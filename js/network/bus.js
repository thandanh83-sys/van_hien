/**
 * ==========================================================
 * VĂN ĐẠO — NETWORK BUS (VDBus) v1.0.0
 * Vị trí: js/network/bus.js
 * ==========================================================
 * 
 * CHỨC NĂNG:
 * Bus là "đường dây nội bộ" giữa các tab/iframe cùng origin:
 * - Publish: Gửi tin nhắn đến tất cả (hoặc 1) node.
 * - Subscribe: Đăng ký nhận tin nhắn theo từ khóa.
 * - Request-Response: Gửi câu hỏi và chờ câu trả lời.
 * 
 * TƯƠNG THÍCH:
 * - Ưu tiên 1: BroadcastChannel (Chrome, Firefox, Safari 15.4+)
 * - Fallback: localStorage event (Trình duyệt cũ, Safari < 15.4)
 * ==========================================================
 */

const CONFIG = Object.freeze({
    CHANNEL_NAME: 'vandao-network-bus',
    STORAGE_KEY: 'vandao_bus_msg',
    DEFAULT_TIMEOUT: 5000,
    MAX_HANDLERS_PER_TYPE: 50
});

// Sinh ID ngẫu nhiên cho mỗi tab (Máy con)
function generateNodeId() {
    const ts = Date.now().toString(36).slice(-4);
    const rand = Math.random().toString(36).slice(2, 8);
    return `node-${ts}-${rand}`;
}

// ==========================================================
// CƠ CHẾ 1: BROADCAST CHANNEL (Hiện đại)
// ==========================================================
function createBroadcastChannelAdapter() {
    if (typeof BroadcastChannel === 'undefined') return null;
    try {
        const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
        return {
            name: 'BroadcastChannel',
            send: (msg) => channel.postMessage(msg),
            onMessage: (handler) => { channel.onmessage = (e) => handler(e.data); },
            close: () => channel.close()
        };
    } catch (err) {
        console.warn('[BUS] Lỗi tạo BroadcastChannel:', err);
        return null;
    }
}

// ==========================================================
// CƠ CHẾ 2: LOCAL STORAGE (Dự phòng cho trình duyệt cũ)
// ==========================================================
function createLocalStorageAdapter() {
    if (typeof localStorage === 'undefined' || typeof window === 'undefined') return null;
    let handler = null;
    const onStorage = (e) => {
        if (e.key !== CONFIG.STORAGE_KEY || !e.newValue) return;
        try {
            const msg = JSON.parse(e.newValue);
            if (handler) handler(msg);
        } catch (_) { /* Bỏ qua lỗi parse JSON */ }
    };
    window.addEventListener('storage', onStorage);
    return {
        name: 'LocalStorage',
        send: (msg) => {
            try {
                // Thêm _ts và _rand để đảm bảo mỗi message là duy nhất
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
                    ...msg,
                    _ts: Date.now(),
                    _rand: Math.random()
                }));
            } catch (_) { /* Bỏ qua lỗi quá dung lượng */ }
        },
        onMessage: (h) => { handler = h; },
        close: () => { window.removeEventListener('storage', onStorage); }
    };
}

// Khởi tạo Adapter
const adapter = createBroadcastChannelAdapter() || createLocalStorageAdapter();

// ==========================================================
// TRẠNG THÁI CỦA BUS
// ==========================================================
const nodeId = generateNodeId();
const handlers = new Map();          // type -> [functions]
const pendingRequests = new Map();   // requestId -> { resolve, timer }

// ==========================================================
// LẮNG NGHE TIN NHẮN
// ==========================================================
if (adapter) {
    adapter.onMessage((msg) => {
        if (!msg || typeof msg !== 'object') return;
        const { type, data, from, to, requestId, isResponse } = msg;
        
        if (!type) return;
        if (from === nodeId) return; // Bỏ qua tin nhắn do chính mình gửi
        if (to && to !== 'all' && to !== nodeId) return; // Lọc người nhận

        // Xử lý câu trả lời (Request-Response pattern)
        if (isResponse && requestId) {
            const pending = pendingRequests.get(requestId);
            if (pending) {
                clearTimeout(pending.timer);
                pendingRequests.delete(requestId);
                pending.resolve(data);
            }
            return;
        }

        // Phân phát đến các hàm đang lắng nghe (Subscribers)
        const list = handlers.get(type) || [];
        list.forEach(fn => {
            try { fn(data, from); } 
            catch (err) { console.warn(`[BUS] Lỗi xử lý tin "${type}":`, err); }
        });
    });
}

// ==========================================================
// XUẤT API TOÀN CỤC
// ==========================================================
export const VDBus = Object.freeze({
    nodeId,
    adapterName: adapter ? adapter.name : 'none',
    isActive: !!adapter,

    /**
     * Publish: Gửi tin nhắn đi
     * @param {string} type - Loại tin nhắn
     * @param {*} data - Nội dung gửi
     * @param {string} [to='all'] - 'all' hoặc 'node-id-cụ-thể'
     */
    publish(type, data, to = 'all') {
        if (!adapter || !type) return;
        adapter.send({ type, data, from: nodeId, to });
    },

    /**
     * Subscribe: Đăng ký nhận tin nhắn
     * @param {string} type - Loại tin nhắn muốn nghe
     * @param {Function} handler - Hàm xử lý (data, from) => {}
     * @returns {Function} Hàm hủy đăng ký (unsubscribe)
     */
    subscribe(type, handler) {
        if (!type || typeof handler !== 'function') return () => {};
        if (!handlers.has(type)) handlers.set(type, []);
        const list = handlers.get(type);
        
        if (list.length >= CONFIG.MAX_HANDLERS_PER_TYPE) {
            console.warn(`[BUS] Quá nhiều handler cho "${type}". Có thể rò rỉ bộ nhớ.`);
        }
        list.push(handler);

        return () => {
            const current = handlers.get(type) || [];
            handlers.set(type, current.filter(fn => fn !== handler));
        };
    },

    /**
     * Request: Gửi câu hỏi và chờ trả lời (Promise)
     * @param {string} type - Loại câu hỏi
     * @param {*} data - Dữ liệu kèm theo
     * @param {string} [to='mother'] - Gửi cho ai
     * @param {number} [timeoutMs=5000] - Thời gian chờ tối đa
     * @returns {Promise<*|null>}
     */
    request(type, data, to = 'mother', timeoutMs = CONFIG.DEFAULT_TIMEOUT) {
        if (!adapter) return Promise.resolve(null);
        const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                pendingRequests.delete(requestId);
                resolve(null); // Trả về null nếu timeout
            }, timeoutMs);

            pendingRequests.set(requestId, { resolve, timer });
            adapter.send({ type, data, from: nodeId, to, requestId });
        });
    },

    /**
     * Respond: Trả lời một request
     */
    respond(requestId, data, to) {
        if (!adapter || !requestId) return;
        adapter.send({ type: 'response', data, from: nodeId, to, requestId, isResponse: true });
    },

    /** Dọn dẹp tất cả (Dùng khi chuyển trang hoặc test) */
    clearHandlers() { handlers.clear(); },

    /** Hủy toàn bộ Bus */
    destroy() {
        handlers.clear();
        pendingRequests.forEach(p => clearTimeout(p.timer));
        pendingRequests.clear();
        if (adapter) adapter.close();
    },

    /** Xem trạng thái hiện tại (Dùng trong Console) */
    debug() {
        return {
            nodeId,
            adapter: adapter ? adapter.name : 'none',
            active: !!adapter,
            handlerTypes: [...handlers.keys()],
            pendingRequests: pendingRequests.size
        };
    }
});

// Tự động dọn dẹp khi đóng tab
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeunload', () => VDBus.destroy());
}