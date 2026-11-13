/**
 * ==========================================================
 * VĂN ĐẠO — NETWORK BUS (BroadcastChannel) v1.0.0
 * ==========================================================
 * 
 * CHỨC NĂNG:
 * ─────────────────────────────────────────────────────────
 * Bus là "đường dây nội bộ" giữa các tab cùng origin:
 * 
 *   1. Publish: 1 tab gửi tin → tất cả tab khác nhận
 *   2. Subscribe: tab đăng ký nhận tin theo type
 *   3. Request-Response: gửi request + chờ response
 *   4. Targeted: gửi riêng cho 1 node cụ thể
 * 
 * TRIẾT LÝ:
 * ─────────────────────────────────────────────────────────
 * "Đồng thanh tương ứng, đồng khí tương cầu" — Cổ ngữ
 * 
 * Các node không cần biết nhau trực tiếp. Chúng chỉ cần biết
 * "tần số chung" (channel name). Ai nói đúng tần số thì
 * nghe được, ai không thì không.
 * 
 * Bus tự động detect và fallback:
 *   - Ưu tiên BroadcastChannel (nhanh, real-time)
 *   - Fallback localStorage (chậm hơn, cho Safari cũ)
 * 
 * TƯƠNG THÍCH:
 * ─────────────────────────────────────────────────────────
 * - Chrome 54+    : BroadcastChannel ✅
 * - Firefox 38+   : BroadcastChannel ✅
 * - Safari 15.4+  : BroadcastChannel ✅
 * - Safari < 15.4 : localStorage fallback ✅
 * - IE 11         : localStorage fallback ✅
 * 
 * VERSION: 1.0.0
 * ==========================================================
 */

// ==========================================================
// PHẦN 1: CẤU HÌNH
// ==========================================================
const CONFIG = Object.freeze({
    CHANNEL_NAME: 'vandao-network',
    STORAGE_KEY: 'vandao_network_msg',
    DEFAULT_TIMEOUT: 5000,
    MAX_HANDLERS_PER_TYPE: 50
});

// ==========================================================
// PHẦN 2: NODE ID GENERATOR
// ==========================================================
function generateNodeId() {
    const ts = Date.now().toString(36).slice(-4);
    const rand = Math.random().toString(36).slice(2, 8);
    return `node-${ts}-${rand}`;
}

// ==========================================================
// PHẦN 3: CHANNEL ADAPTERS
// ==========================================================

/**
 * BroadcastChannel Adapter — modern, real-time
 * @returns {Object|null}
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
        console.warn('[BUS] Không tạo được BroadcastChannel:', err);
        return null;
    }
}

/**
 * LocalStorage Adapter — fallback cho Safari cũ
 * Cơ chế: ghi vào localStorage → tab khác nhận qua 'storage' event
 * @returns {Object|null}
 */
function createLocalStorageAdapter() {
    if (typeof localStorage === 'undefined') return null;
    if (typeof window === 'undefined' || !window.addEventListener) return null;

    let handler = null;

    const onStorage = (e) => {
        if (e.key !== CONFIG.STORAGE_KEY || !e.newValue) return;
        try {
            const msg = JSON.parse(e.newValue);
            if (handler) handler(msg);
        } catch (_) { /* ignore parse error */ }
    };

    window.addEventListener('storage', onStorage);

    return {
        name: 'LocalStorage',
        send: (msg) => {
            try {
                // _ts + _rand đảm bảo mỗi message là unique → storage event luôn fire
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
                    ...msg,
                    _ts: Date.now(),
                    _rand: Math.random()
                }));
            } catch (_) { /* quota exceeded */ }
        },
        onMessage: (h) => { handler = h; },
        close: () => { window.removeEventListener('storage', onStorage); }
    };
}

// Adapter selection (ưu tiên BroadcastChannel)
const adapter = createBroadcastChannelAdapter() || createLocalStorageAdapter();

// ==========================================================
// PHẦN 4: STATE
// ==========================================================
const nodeId = generateNodeId();
const handlers = new Map();          // type → [fn]
const pendingRequests = new Map();   // requestId → { resolve, timer }

// ==========================================================
// PHẦN 5: MESSAGE HANDLER
// ==========================================================
if (adapter) {
    adapter.onMessage((msg) => {
        if (!msg || typeof msg !== 'object') return;

        const { type, data, from, to, requestId, isResponse } = msg;
        if (!type) return;
        if (from === nodeId) return;  // Bỏ qua message của chính mình

        // Target filter: chỉ nhận nếu gửi cho mình hoặc broadcast
        if (to && to !== 'all' && to !== nodeId) return;

        // Response cho request-response pattern
        if (isResponse && requestId) {
            const pending = pendingRequests.get(requestId);
            if (pending) {
                clearTimeout(pending.timer);
                pendingRequests.delete(requestId);
                pending.resolve(data);
            }
            return;
        }

        // Dispatch đến handlers
        const list = handlers.get(type) || [];
        list.forEach(fn => {
            try {
                fn(data, from);
            } catch (err) {
                console.warn(`[BUS] Handler error cho "${type}":`, err);
            }
        });
    });
}

// ==========================================================
// PHẦN 6: PUBLIC API
// ==========================================================
export const VDBus = Object.freeze({
    // Metadata
    nodeId,
    adapterName: adapter ? adapter.name : 'none',
    isActive: !!adapter,

    /**
     * Publish: gửi tin đến tất cả (hoặc 1) node
     * @param {string} type
     * @param {*} data
     * @param {string} [to='all']
     */
    publish(type, data, to = 'all') {
        if (!adapter || !type) return;
        adapter.send({ type, data, from: nodeId, to });
    },

    /**
     * Subscribe: đăng ký nhận tin
     * @param {string} type
     * @param {Function} handler - (data, from) => void
     * @returns {Function} unsubscribe
     */
    subscribe(type, handler) {
        if (!type || typeof handler !== 'function') return () => {};

        if (!handlers.has(type)) handlers.set(type, []);
        const list = handlers.get(type);

        if (list.length >= CONFIG.MAX_HANDLERS_PER_TYPE) {
            console.warn(`[BUS] Quá nhiều handler cho "${type}" (${list.length}). Cân nhắc dọn dẹp.`);
        }

        list.push(handler);

        return () => {
            const current = handlers.get(type) || [];
            handlers.set(type, current.filter(fn => fn !== handler));
        };
    },

    /**
     * Request-Response pattern
     * @param {string} type
     * @param {*} data
     * @param {string} [to='mother']
     * @param {number} [timeoutMs=5000]
     * @returns {Promise<*|null>} null nếu timeout
     */
    request(type, data, to = 'mother', timeoutMs = CONFIG.DEFAULT_TIMEOUT) {
        if (!adapter) return Promise.resolve(null);

        const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                pendingRequests.delete(requestId);
                resolve(null);
            }, timeoutMs);

            pendingRequests.set(requestId, { resolve, timer });
            adapter.send({ type, data, from: nodeId, to, requestId });
        });
    },

    /**
     * Respond: trả lời request
     * @param {string} requestId
     * @param {*} data
     * @param {string} to
     */
    respond(requestId, data, to) {
        if (!adapter || !requestId) return;
        adapter.send({
            type: 'response',
            data,
            from: nodeId,
            to,
            requestId,
            isResponse: true
        });
    },

    /** Clear tất cả handlers (dùng khi cleanup) */
    clearHandlers() {
        handlers.clear();
    },

    /** Destroy channel (dùng khi test hoặc page unload) */
    destroy() {
        handlers.clear();
        pendingRequests.forEach(p => clearTimeout(p.timer));
        pendingRequests.clear();
        if (adapter) adapter.close();
    },

    /** Debug: trạng thái hiện tại */
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

// Auto-cleanup khi page unload
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeunload', () => VDBus.destroy());
}