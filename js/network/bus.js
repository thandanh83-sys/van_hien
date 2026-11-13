/**
 * ==========================================================
 * VĂN ĐẠO — NETWORK BUS (VDBus) (js/network/bus.js)
 * Vị trí: js/network/bus.js
 * Version: 2.0.0 (Unified Messaging System)
 * ==========================================================
 * CHỨC NĂNG:
 * - Là "đường dây nội bộ" kết nối các tab/iframe cùng origin.
 * - Publish/Subscribe: Gửi và nhận tin nhắn theo sự kiện.
 * - Request-Response: Gửi câu hỏi và chờ câu trả lời (Promise-based).
 * - Data Sync: Thông báo cho các tab khác biết dữ liệu đã thay đổi.
 * 
 * TƯƠNG THÍCH:
 * - Ưu tiên 1: BroadcastChannel (Chrome, Firefox, Safari 15.4+).
 * - Fallback: localStorage event (Trình duyệt cũ, Safari < 15.4).
 * ==========================================================
 */

// =====================================================================
// I. CẤU HÌNH & HẰNG SỐ
// =====================================================================
const CONFIG = Object.freeze({
    CHANNEL_NAME: 'vandao-network-bus',
    STORAGE_KEY: 'vandao_bus_msg',
    DEFAULT_TIMEOUT: 5000,
    MAX_HANDLERS_PER_TYPE: 50
});

/**
 * Các loại tin nhắn chuẩn dùng trong hệ thống.
 * Giúp tránh việc gõ sai tên sự kiện (typo).
 */
export const MESSAGE_TYPES = Object.freeze({
    DATA_UPDATED: 'DATA_UPDATED',     // Khi dữ liệu (Cache, DB) thay đổi
    SETTINGS_CHANGED: 'SETTINGS_CHANGED', // Khi người dùng đổi cài đặt
    THEME_CHANGED: 'THEME_CHANGED',   // Khi đổi giao diện
    PING: 'PING',                     // Kiểm tra kết nối
    PONG: 'PONG'                      // Phản hồi kiểm tra kết nối
});

// Sinh ID ngẫu nhiên cho mỗi tab (Máy con)
function generateNodeId() {
    const ts = Date.now().toString(36).slice(-4);
    const rand = Math.random().toString(36).slice(2, 8);
    return `node-${ts}-${rand}`;
}

// =====================================================================
// II. CÁC ADAPTER (Bộ chuyển đổi giao thức)
// =====================================================================

/**
 * Cơ chế 1: BROADCAST CHANNEL (Hiện đại)
 */
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

/**
 * Cơ chế 2: LOCAL STORAGE (Dự phòng cho trình duyệt cũ)
 */
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

// Khởi tạo Adapter (Ưu tiên BroadcastChannel)
const adapter = createBroadcastChannelAdapter() || createLocalStorageAdapter();

// =====================================================================
// III. TRẠNG THÁI CỦA BUS
// =====================================================================
const nodeId = generateNodeId();
const handlers = new Map();          // type -> [functions]
const pendingRequests = new Map();   // requestId -> { resolve, timer }

// =====================================================================
// IV. LẮNG NGHE TIN NHẮN
// =====================================================================
if (adapter) {
    adapter.onMessage((msg) => {
        if (!msg || typeof msg !== 'object') return;
        const { type, data, from, to, requestId, isResponse } = msg;
        
        // 1. Kiểm tra tính hợp lệ cơ bản
        if (!type) return;
        if (from === nodeId) return; // Bỏ qua tin nhắn do chính mình gửi
        if (to && to !== 'all' && to !== nodeId) return; // Lọc người nhận

        // 2. Xử lý câu trả lời (Request-Response pattern)
        if (isResponse && requestId) {
            const pending = pendingRequests.get(requestId);
            if (pending) {
                clearTimeout(pending.timer);
                pendingRequests.delete(requestId);
                pending.resolve(data);
            }
            return;
        }

        // 3. Phân phát đến các hàm đang lắng nghe (Subscribers)
        const list = handlers.get(type) || [];
        list.forEach(fn => {
            try { 
                fn(data, from); 
            } catch (err) { 
                console.warn(`[BUS] Lỗi xử lý tin "${type}":`, err); 
            }
        });
    });
}

// =====================================================================
// V. XUẤT API TOÀN CỤC (VDBus)
// =====================================================================
export const VDBus = Object.freeze({
    // --- Thuộc tính ---
    nodeId,
    adapterName: adapter ? adapter.name : 'none',
    isActive: !!adapter,

    /**
     * Publish: Gửi tin nhắn đi (Broadcast)
     * @param {string} type - Loại tin nhắn (Nên dùng MESSAGE_TYPES)
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
        
        // Cảnh báo nếu có quá nhiều handler (nguy cơ rò rỉ bộ nhớ)
        if (list.length >= CONFIG.MAX_HANDLERS_PER_TYPE) {
            console.warn(`[BUS] Quá nhiều handler cho "${type}". Có thể rò rỉ bộ nhớ.`);
        }
        
        list.push(handler);

        // Trả về hàm hủy đăng ký
        return () => {
            const current = handlers.get(type) || [];
            handlers.set(type, current.filter(fn => fn !== handler));
        };
    },

    /**
     * Request: Gửi câu hỏi và chờ trả lời (Promise)
     * @param {string} type - Loại câu hỏi
     * @param {*} data - Dữ liệu kèm theo
     * @param {string} [to='all'] - Gửi cho ai
     * @param {number} [timeoutMs=5000] - Thời gian chờ tối đa
     * @returns {Promise<*|null>} - Dữ liệu trả về hoặc null nếu timeout
     */
    request(type, data, to = 'all', timeoutMs = CONFIG.DEFAULT_TIMEOUT) {
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
     * @param {string} requestId - ID của request cần trả lời
     * @param {*} data - Dữ liệu trả lời
     * @param {string} to - Gửi cho ai (node-id)
     */
    respond(requestId, data, to) {
        if (!adapter || !requestId) return;
        adapter.send({ type: 'response', data, from: nodeId, to, requestId, isResponse: true });
    },

    /**
     * [MỚI] Thông báo cho các tab khác biết dữ liệu đã thay đổi.
     * @param {string} id - ID của thực thể vừa thay đổi (hoặc 'all')
     */
    notifyDataUpdate(id = 'all') {
        this.publish(MESSAGE_TYPES.DATA_UPDATED, { id });
    },

    /**
     * [MỚI] Gửi tín hiệu Ping để kiểm tra kết nối.
     * @returns {Promise<boolean>} - True nếu có ít nhất 1 node phản hồi.
     */
    async ping() {
        const response = await this.request(MESSAGE_TYPES.PING, { timestamp: Date.now() }, 'all', 1000);
        return response !== null;
    },

    /** Dọn dẹp tất cả handler (Dùng khi chuyển trang hoặc test) */
    clearHandlers() { 
        handlers.clear(); 
    },

    /** Hủy toàn bộ Bus (Dọn dẹp bộ nhớ) */
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

// =====================================================================
// VI. TỰ ĐỘNG DỌN DẸP
// =====================================================================
// Tự động hủy Bus khi đóng tab để giải phóng bộ nhớ
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeunload', () => VDBus.destroy());
}
