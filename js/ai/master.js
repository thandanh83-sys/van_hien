/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 5.0.0 (Resilient Dispatcher & Result Adapter)
 * ==========================================================
 *
 * CHỨC NĂNG (ORCHESTRATION):
 * - Điều phối câu hỏi từ InputAI đến đúng Agent qua AgentRegistry.
 * - Xử lý chuyển đổi kết quả (Adapter) cho các Agent có cấu trúc
 *   trả về khác chuẩn.
 * - Fallback thông minh khi không tìm thấy Agent phù hợp.
 * - Render kết quả qua OutputAI (hoặc trả tín hiệu 'search' về UI).
 *
 * TRIẾT LÝ THIẾT KẾ:
 *
 * 1. TRA CỨU ĐỘNG (Dynamic Lookup):
 *    KHÔNG hardcode bất kỳ key Agent nào. Mọi tra cứu đều đi qua
 *    AgentRegistry.findAgentForTask(task). Nếu ai đó đổi key của
 *    LiteratureAgent từ 'literature' thành 'van-hoc', hệ thống vẫn
 *    chạy bình thường — vì fallback dùng Registry, không dùng key cứng.
 *
 * 2. ADAPTER LINH HOẠT (Flexible Adapter):
 *    Một số Agent (praiser, critic) trả về cấu trúc riêng
 *    { theme, symbol, commentary } thay vì { answer, detail, source, meta }.
 *    Master.js có adapter để chuyển đổi — nhưng dùng PHÁT HIỆN
 *    THEO CẤU TRÚC (structural detection) thay vì hardcode key,
 *    giúp nếu sau này có Agent mới cùng cấu trúc thì tự động hoạt động.
 *
 * 3. PHÒNG THỦ NHIỀU TẦNG (Multi-Layer Defense):
 *    - Layer 1: intent không hợp lệ → fallback search.
 *    - Layer 2: không tìm thấy Agent cho task → fallback search.
 *    - Layer 3: Agent thiếu → log + error.
 *    - Layer 4: method không tồn tại → log + error.
 *    - Layer 5: Agent throw error → catch + error message.
 *    - Layer 6: Agent trả về null/undefined → error message.
 *    - Layer 7: Agent trả về sai cấu trúc → adapter hoặc fallback.
 *
 * 4. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
 *    Giữ nguyên toàn bộ API công khai:
 *      - MasterAI.parseIntent(input)
 *      - MasterAI.dispatch(intent)
 *      - MasterAI.processQuery(inputElement, container)
 *      - AIDispatcher (alias của MasterAI)
 *
 * 5. LOG CÓ PHÂN TẦNG (Layered Logging):
 *    Dùng prefix [MASTER] và các mức log rõ ràng để dev theo dõi
 *    luồng điều phối trong Console mà không bị spam.
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { AgentMap, AgentRegistry } from './agents/index.js';

// =====================================================================
// PHẦN 1: PHIÊN BẢN & LOG TIỆN ÍCH
// =====================================================================

export const MASTER_VERSION = '5.0.0';

/**
 * Log debug có prefix — chỉ in khi bật DEBUG_MODE.
 * Bật bằng cách set `window.VD_MASTER_DEBUG = true` trong Console.
 */
function debugLog(...args) {
    if (typeof window !== 'undefined' && window.VD_MASTER_DEBUG) {
        console.log('[MASTER]', ...args);
    }
}

/**
 * Log warning — luôn in (dùng cho cảnh báo nhẹ).
 */
function warnLog(...args) {
    console.warn('[MASTER]', ...args);
}

/**
 * Log error — luôn in (dùng cho lỗi thật).
 */
function errorLog(...args) {
    console.error('[MASTER]', ...args);
}

// =====================================================================
// PHẦN 2: HÀM ADAPTER — CHUYỂN ĐỔI KẾT QUẢ VỀ CHUẨN OutputAI
// =====================================================================

/**
 * Kiểm tra một object có phải cấu trúc chuẩn { answer, detail, source, meta }
 * mà OutputAI có thể render không.
 *
 * @param {*} obj - Bất kỳ giá trị nào.
 * @returns {boolean}
 */
function isStandardResult(obj) {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj.answer === 'string' &&
        obj.answer.length > 0
    );
}

/**
 * Kiểm tra một object có phải cấu trúc đặc biệt { theme, symbol, commentary }
 * mà PraiserAgent / CriticAgent trả về không.
 *
 * PHÁT HIỆN THEO CẤU TRÚC — không hardcode key Agent.
 * Nếu sau này có Agent mới (VD: MoodAgent) cũng trả về
 * { theme, symbol, commentary }, adapter sẽ tự động xử lý.
 *
 * @param {*} obj
 * @returns {boolean}
 */
function isThematicResult(obj) {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj.commentary === 'string' &&
        obj.commentary.length > 0 &&
        (typeof obj.theme === 'string' || obj.theme === undefined) &&
        (typeof obj.symbol === 'string' || obj.symbol === undefined)
    );
}

/**
 * Adapter: chuyển { theme, symbol, commentary } thành
 * { answer, detail, source, meta } mà OutputAI hiểu.
 *
 * @param {Object} raw - Kết quả thô từ Agent.
 * @param {string} sourceKey - Key Agent nguồn (để gán source).
 * @returns {Object} - Kết quả chuẩn.
 */
function adaptThematicResult(raw, sourceKey) {
    const theme = raw.theme || 'Chưa rõ';
    const symbol = raw.symbol || 'Không có';

    return {
        answer: raw.commentary,
        detail: `Chủ đề: ${theme} | Hình ảnh: ${symbol}`,
        source: sourceKey || 'unknown',
        meta: [],
        // Gắn thêm metadata gốc để nếu cần debug
        _adapted: {
            theme,
            symbol,
            originalStructure: 'thematic'
        }
    };
}

/**
 * Adapter tổng quát: nhận bất kỳ kết quả nào từ Agent và chuẩn hóa
 * về cấu trúc { answer, detail, source, meta }.
 *
 * Thứ tự ưu tiên:
 *   1. Nếu đã là cấu trúc chuẩn → trả nguyên.
 *   2. Nếu là cấu trúc thematic → chuyển đổi.
 *   3. Nếu có 'answer' nhưng thiếu field khác → bổ sung default.
 *   4. Nếu không nhận dạng được → trả lỗi an toàn.
 *
 * @param {*} raw - Kết quả thô từ Agent.
 * @param {string} sourceKey - Key Agent nguồn.
 * @returns {Object} - Luôn trả về object chuẩn.
 */
function normalizeResult(raw, sourceKey) {
    // Case 1: Chuẩn rồi → trả nguyên (nhưng đảm bảo đủ field)
    if (isStandardResult(raw)) {
        return {
            answer: raw.answer,
            detail: raw.detail || '',
            source: raw.source || sourceKey || 'unknown',
            meta: Array.isArray(raw.meta) ? raw.meta : [],
            ...raw // Giữ nguyên các field phụ (VD: _raw từ AnalysisAgent)
        };
    }

    // Case 2: Cấu trúc thematic (praiser/critic hoặc tương tự)
    if (isThematicResult(raw)) {
        return adaptThematicResult(raw, sourceKey);
    }

    // Case 3: null/undefined → lỗi an toàn
    if (raw === null || raw === undefined) {
        return {
            answer: 'Agent không trả về kết quả nào.',
            detail: `Source: ${sourceKey || 'unknown'}`,
            source: 'error',
            meta: []
        };
    }

    // Case 4: object nhưng không có answer/commentary → lỗi
    if (typeof raw === 'object') {
        return {
            answer: 'Agent trả về kết quả có cấu trúc không xác định.',
            detail: `Source: ${sourceKey || 'unknown'}, keys: ${Object.keys(raw).join(', ')}`,
            source: 'error',
            meta: []
        };
    }

    // Case 5: primitive (string, number) → thử chuyển
    if (typeof raw === 'string' && raw.length > 0) {
        return {
            answer: raw,
            detail: '',
            source: sourceKey || 'unknown',
            meta: []
        };
    }

    // Case 6: Không xử lý được
    return {
        answer: 'Agent trả về kết quả không hợp lệ.',
        detail: `Source: ${sourceKey || 'unknown'}, type: ${typeof raw}`,
        source: 'error',
        meta: []
    };
}

// =====================================================================
// PHẦN 3: HÀM ĐIỀU PHỐI NỘI BỘ (INTERNAL DISPATCHER)
// =====================================================================

/**
 * Điều phối một intent đến Agent phù hợp và trả kết quả đã chuẩn hóa.
 *
 * Đây là hàm PRIVATE — không export. Chỉ được gọi từ MasterAI.dispatch()
 * và MasterAI.processQuery().
 *
 * LUỒNG XỬ LÝ:
 *   1. Validate intent đầu vào.
 *   2. Tra cứu Agent qua AgentRegistry.findAgentForTask(intent.type).
 *   3. Nếu không tìm thấy → fallback 'search'.
 *   4. Nếu vẫn không có → trả lỗi.
 *   5. Lấy instance Agent từ AgentMap.
 *   6. Lấy method name từ AgentRegistry.getMethodName().
 *   7. Validate method tồn tại trên instance.
 *   8. Gọi method, nhận kết quả thô.
 *   9. Chuẩn hóa kết quả qua normalizeResult().
 *  10. Trả kết quả chuẩn.
 *
 * @param {Object} intent - Object từ InputAI.parseIntent().
 * @returns {Promise<Object>} - Kết quả chuẩn { answer, detail, source, meta }.
 */
async function internalDispatch(intent) {
    // -----------------------------------------------------------------
    // BƯỚC 1: Validate intent
    // -----------------------------------------------------------------
    if (!intent || typeof intent !== 'object') {
        errorLog('Intent không hợp lệ (null hoặc không phải object).');
        return buildErrorResult(
            'Yêu cầu không hợp lệ.',
            'Intent object bị thiếu hoặc sai kiểu.'
        );
    }

    if (!intent.type || typeof intent.type !== 'string') {
        errorLog('Intent thiếu trường "type".', intent);
        return buildErrorResult(
            'Không xác định được loại câu hỏi.',
            `Intent keys: ${Object.keys(intent).join(', ')}`
        );
    }

    const taskType = intent.type;
    const query = String(intent.query || '').trim();

    debugLog(`Dispatch: type="${taskType}", query="${query}"`);

    // -----------------------------------------------------------------
    // BƯỚC 2: Tra cứu Agent cho task (ĐỘNG — không hardcode key)
    // -----------------------------------------------------------------
    let agentKey = AgentRegistry.findAgentForTask(taskType);

    // -----------------------------------------------------------------
    // BƯỚC 3: Fallback thông minh nếu không có Agent cho task
    // -----------------------------------------------------------------
    if (!agentKey) {
        warnLog(`Không tìm thấy Agent cho task "${taskType}". Thử fallback 'search'.`);

        // 3.1 — Thử tìm Agent có capability 'search'
        const searchAgentKey = AgentRegistry.findAgentForTask('search');

        if (searchAgentKey && AgentMap[searchAgentKey]) {
            debugLog(`Fallback: dùng Agent "${searchAgentKey}" cho search.`);
            agentKey = searchAgentKey;

            // Đổi taskType thành 'search' để gọi đúng method
            // (không dùng taskType gốc vì Agent search có capability 'search', không phải taskType)
            try {
                const searchAgent = AgentMap[searchAgentKey];
                const searchMethod = AgentRegistry.getMethodName(searchAgentKey, 'search');

                if (searchMethod && typeof searchAgent[searchMethod] === 'function') {
                    debugLog(`Gọi fallback: ${searchAgentKey}.${searchMethod}("${query}")`);
                    const rawResult = await searchAgent[searchMethod](query);
                    return normalizeResult(rawResult, searchAgentKey);
                }
            } catch (err) {
                errorLog(`Lỗi trong fallback search:`, err);
                return buildErrorResult(
                    'Không thể tìm kiếm. Hãy thử lại sau giây lát.',
                    err.message
                );
            }
        }

        // 3.2 — Không có Agent search → trả lỗi
        errorLog(`Không có Agent nào xử lý được task "${taskType}" kể cả fallback search.`);
        return buildErrorResult(
            `Tính năng "${taskType}" hiện chưa được hỗ trợ.`,
            `Không có Agent đăng ký capability này và không có Agent search khả dụng.`
        );
    }

    // -----------------------------------------------------------------
    // BƯỚC 4: Lấy instance Agent
    // -----------------------------------------------------------------
    const agentInstance = AgentMap[agentKey];

    if (!agentInstance) {
        errorLog(`Agent "${agentKey}" được Registry báo có nhưng không có trong AgentMap.`);
        return buildErrorResult(
            'Hệ thống gặp sự cố kết nối tri thức.',
            `Agent key "${agentKey}" thiếu trong AgentMap (lỗi đồng bộ đăng ký).`
        );
    }

    // -----------------------------------------------------------------
    // BƯỚC 5: Lấy method name từ Registry
    // -----------------------------------------------------------------
    const methodName = AgentRegistry.getMethodName(agentKey, taskType);

    if (!methodName) {
        errorLog(`Agent "${agentKey}" không khai báo method cho task "${taskType}".`);
        return buildErrorResult(
            'Agent không được cấu hình để xử lý yêu cầu này.',
            `Agent "${agentKey}" thiếu capability "${taskType}" trong Registry.`
        );
    }

    // -----------------------------------------------------------------
    // BƯỚC 6: Validate method tồn tại trên instance
    // -----------------------------------------------------------------
    if (typeof agentInstance[methodName] !== 'function') {
        errorLog(
            `Agent "${agentKey}" có capability "${taskType}" trỏ tới ` +
            `"${methodName}" nhưng instance không có hàm này.`
        );
        return buildErrorResult(
            'Agent được đăng ký nhưng chưa cài đặt phương thức xử lý.',
            `Agent "${agentKey}": method "${methodName}" không tồn tại trên instance.`
        );
    }

    // -----------------------------------------------------------------
    // BƯỚC 7: Gọi method và nhận kết quả thô
    // -----------------------------------------------------------------
    debugLog(`Điều phối "${taskType}" → ${agentKey}.${methodName}("${query}")`);

    let rawResult;
    try {
        rawResult = await agentInstance[methodName](query);
    } catch (err) {
        errorLog(`Lỗi khi gọi ${agentKey}.${methodName}:`, err);
        return buildErrorResult(
            'Hệ thống đang gặp chút trục trặc trong việc xử lý câu hỏi.',
            `Agent "${agentKey}" báo lỗi: ${err.message}`
        );
    }

    // -----------------------------------------------------------------
    // BƯỚC 8: Chuẩn hóa kết quả qua adapter
    // -----------------------------------------------------------------
    debugLog(`Kết quả thô từ ${agentKey}:`, rawResult);

    const normalized = normalizeResult(rawResult, agentKey);

    debugLog(`Kết quả sau adapter:`, normalized);

    return normalized;
}

// =====================================================================
// PHẦN 4: HÀM TIỆN ÍCH TẠO KẾT QUẢ LỖI
// =====================================================================

/**
 * Tạo object kết quả lỗi chuẩn để OutputAI render.
 *
 * @param {string} message - Thông điệp thân thiện với người dùng.
 * @param {string} detail - Chi tiết kỹ thuật (cho dev).
 * @returns {Object}
 */
function buildErrorResult(message, detail) {
    return {
        answer: message,
        detail: detail ? `Chi tiết kỹ thuật: ${detail}` : '',
        source: 'error',
        meta: []
    };
}

// =====================================================================
// PHẦN 5: PUBLIC API — MASTER AI
// =====================================================================

/**
 * MasterAI — Nhạc trưởng điều phối toàn bộ hệ thống AI.
 *
 * Cung cấp 3 method công khai:
 *   1. parseIntent(input)              — phân tích câu hỏi thô thành intent.
 *   2. dispatch(intent)                — điều phối intent đến Agent.
 *   3. processQuery(inputElement, container) — pipeline đầy đủ cho UI.
 *
 * Và 1 method tiện ích cho audit:
 *   4. validate()                      — kiểm tra toàn vẹn pipeline.
 */
export const MasterAI = {

    /**
     * Phiên bản module — dùng cho audit/debug.
     */
    version: MASTER_VERSION,

    // =================================================================
    // 5.1 — parseIntent: chuyển câu hỏi thô thành intent
    // =================================================================

    /**
     * Phân tích câu hỏi thô của người dùng thành intent object.
     *
     * Đây chỉ là wrapper mỏng gọi InputAI.parseIntent() — nhưng tách ra
     * để sau này có thể thêm cache, log, telemetry mà không đổi InputAI.
     *
     * @param {string} input - Câu hỏi thô (VD: "Tóm tắt Truyện Kiều").
     * @returns {Object} - Intent object { type, mode, query, confidence, ... }.
     */
    parseIntent(input) {
        return InputAI.parseIntent(input);
    },

    // =================================================================
    // 5.2 — dispatch: điều phối intent đến Agent
    // =================================================================

    /**
     * Điều phối một intent (đã parse) đến Agent phù hợp.
     *
     * @param {Object} intent - Object từ parseIntent().
     * @returns {Promise<Object>} - Kết quả chuẩn { answer, detail, source, meta }.
     */
    async dispatch(intent) {
        return await internalDispatch(intent);
    },

    // =================================================================
    // 5.3 — processQuery: pipeline đầy đủ cho UI
    // =================================================================

    /**
     * Pipeline đầy đủ: parse → dispatch → render.
     *
     * LUỒNG:
     *   1. Đọc text từ input element.
     *   2. Parse thành intent.
     *   3. Nếu intent là 'search' thuần → trả tín hiệu cho UI tự render
     *      danh sách (KHÔNG gọi Agent).
     *   4. Nếu là câu hỏi thật → render Loading → dispatch → render kết quả.
     *
     * @param {HTMLInputElement} inputElement - Ô input người dùng nhập.
     * @param {HTMLElement} container - Khung chứa kết quả để render.
     * @returns {Promise<{type: string, query?: string}>}
     *   - { type: 'empty' }       : input rỗng
     *   - { type: 'search', query } : cần UI tự render danh sách
     *   - { type: 'answered' }    : AI đã trả lời, đã render xong
     */
    async processQuery(inputElement, container) {
        // 5.3.1 — Validate input
        if (!inputElement || typeof inputElement.value !== 'string') {
            errorLog('processQuery: inputElement không hợp lệ.');
            return { type: 'empty' };
        }

        const text = inputElement.value.trim();
        if (!text) {
            return { type: 'empty' };
        }

        // 5.3.2 — Parse intent
        const intent = InputAI.parseIntent(text);
        debugLog('Intent:', intent);

        // 5.3.3 — Nếu là tìm kiếm thuần (không phải câu hỏi) → trả tín hiệu
        if (intent.type === 'search' && intent.mode === 'search') {
            return { type: 'search', query: intent.query };
        }

        // 5.3.4 — Render Loading
        if (container) {
            try {
                OutputAI.renderLoading(container);
            } catch (err) {
                errorLog('Lỗi render Loading:', err);
            }
        }

        // 5.3.5 — Dispatch
        const result = await internalDispatch(intent);

        // 5.3.6 — Render kết quả
        if (container) {
            try {
                OutputAI.render(container, result, text);
            } catch (err) {
                errorLog('Lỗi render kết quả:', err);
                // Fallback render tối thiểu nếu OutputAI crash
                container.innerHTML = `
                    <div class="ask-result ask-error">
                        <div class="ask-answer">${result.answer || 'Có lỗi xảy ra.'}</div>
                    </div>
                `;
            }
        }

        return { type: 'answered' };
    },

    // =================================================================
    // 5.4 — validate: kiểm tra toàn vẹn pipeline (dùng cho audit)
    // =================================================================

    /**
     * Kiểm tra toàn vẹn của Master pipeline.
     *
     * Xác minh:
     *   1. InputAI khả dụng (có hàm parseIntent).
     *   2. OutputAI khả dụng (có hàm render, renderLoading).
     *   3. AgentRegistry có ít nhất 1 Agent.
     *   4. AgentRegistry.validate() không phát hiện Agent lỗi.
     *   5. Có ít nhất 1 Agent hỗ trợ fallback 'search'.
     *
     * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
     */
    validate() {
        const errors = [];
        const warnings = [];

        // 5.4.1 — Kiểm tra InputAI
        if (!InputAI || typeof InputAI.parseIntent !== 'function') {
            errors.push('InputAI thiếu hàm parseIntent().');
        }

        // 5.4.2 — Kiểm tra OutputAI
        if (!OutputAI || typeof OutputAI.render !== 'function') {
            errors.push('OutputAI thiếu hàm render().');
        }
        if (!OutputAI || typeof OutputAI.renderLoading !== 'function') {
            warnings.push('OutputAI thiếu hàm renderLoading() — UX sẽ kém mượt hơn.');
        }

        // 5.4.3 — Kiểm tra AgentRegistry
        if (!AgentRegistry || typeof AgentRegistry.getAllAgentKeys !== 'function') {
            errors.push('AgentRegistry thiếu hàm getAllAgentKeys().');
        } else {
            const agentKeys = AgentRegistry.getAllAgentKeys();
            if (agentKeys.length === 0) {
                errors.push('Không có Agent nào được đăng ký.');
            }

            // 5.4.4 — Chạy validate() của AgentRegistry (nếu có)
            if (typeof AgentRegistry.validate === 'function') {
                const regValidation = AgentRegistry.validate();
                if (regValidation.invalid.length > 0) {
                    regValidation.invalid.forEach(k => {
                        const reason = regValidation.reasons?.[k] || 'không rõ lý do';
                        errors.push(`Agent "${k}" không hợp lệ: ${reason}`);
                    });
                }
            }
        }

        // 5.4.5 — Kiểm tra có Agent hỗ trợ fallback search
        if (typeof AgentRegistry.findAgentForTask === 'function') {
            const searchAgent = AgentRegistry.findAgentForTask('search');
            if (!searchAgent) {
                warnings.push('Không có Agent nào hỗ trợ fallback "search" — câu hỏi lạ sẽ không có phương án dự phòng.');
            }
        }

        return {
            ok: errors.length === 0,
            version: MASTER_VERSION,
            totalAgents: AgentRegistry.getAllAgentKeys ? AgentRegistry.getAllAgentKeys().length : 0,
            errors,
            warnings
        };
    }
};

// =====================================================================
// PHẦN 6: TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY)
// =====================================================================

/**
 * Alias `AIDispatcher` — giữ nguyên cho các module cũ đang dùng
 * tên này (ask-dao.js, main.js, audit.js đều import MasterAI nhưng
 * một số chỗ có thể dùng AIDispatcher).
 */
export const AIDispatcher = MasterAI;

// =====================================================================
// PHẦN 7: LOG KHỞI TẠO (chỉ trong môi trường dev)
// =====================================================================
// In version + số Agent để dev xác nhận Master đã load đúng.
// Không log nếu không có console (SSR-safe).
// =====================================================================

if (typeof console !== 'undefined' && console.log) {
    const agentCount = AgentRegistry.getAllAgentKeys().length;
    console.log(
        `%c[MASTER] Văn Đạo MasterAI v${MASTER_VERSION} sẵn sàng. ` +
        `Điều phối ${agentCount} Agent.`,
        'color: #8bb8a8; font-weight: bold;'
    );
}
