/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 6.0.0 (Living Intelligence Orchestrator)
 * ==========================================================
 * CHỨC NĂNG (ORCHESTRATION):
 * - Điều phối câu hỏi từ InputAI đến đúng Agent qua AgentRegistry.
 * - Tích hợp MemoryEngine để nhớ ngữ cảnh hội thoại.
 * - Tự động ghi nhận "Khoảng trống tri thức" khi không tìm thấy Agent.
 * - Render kết quả qua OutputAI (Tích hợp Identity & Dialogue).
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { AgentMap, AgentRegistry } from './agents/index.js';
import { MemoryEngine } from './memory-engine.js';
import { Identity } from './identity.js';

// =====================================================================
// PHẦN 1: PHIÊN BẢN & LOG TIỆN ÍCH
// =====================================================================
export const MASTER_VERSION = '6.0.0';

function debugLog(...args) {
    if (typeof window !== 'undefined' && window.VD_MASTER_DEBUG) {
        console.log('[MASTER]', ...args);
    }
}

function warnLog(...args) {
    console.warn('[MASTER]', ...args);
}

function errorLog(...args) {
    console.error('[MASTER]', ...args);
}

// =====================================================================
// PHẦN 2: HÀM ADAPTER — CHUYỂN ĐỔI KẾT QUẢ VỀ CHUẨN
// =====================================================================
function isStandardResult(obj) {
    return (obj !== null && typeof obj === 'object' && typeof obj.answer === 'string' && obj.answer.length > 0);
}

function isThematicResult(obj) {
    return (obj !== null && typeof obj === 'object' && typeof obj.commentary === 'string' && obj.commentary.length > 0);
}

function adaptThematicResult(raw, sourceKey) {
    return {
        answer: raw.commentary,
        detail: `Chủ đề: ${raw.theme || 'Chưa rõ'} | Hình ảnh: ${raw.symbol || 'Không có'}`,
        source: sourceKey || 'unknown',
        meta: [],
        _adapted: { theme: raw.theme, symbol: raw.symbol }
    };
}

function normalizeResult(raw, sourceKey) {
    if (isStandardResult(raw)) {
        return {
            answer: raw.answer,
            detail: raw.detail || '',
            source: raw.source || sourceKey || 'unknown',
            meta: Array.isArray(raw.meta) ? raw.meta : [],
            ...raw 
        };
    }
    if (isThematicResult(raw)) {
        return adaptThematicResult(raw, sourceKey);
    }
    if (raw === null || raw === undefined) {
        return { answer: 'Agent không trả về kết quả.', detail: '', source: 'error', meta: [] };
    }
    return { answer: 'Agent trả về kết quả không xác định.', detail: '', source: 'error', meta: [] };
}

// =====================================================================
// PHẦN 3: HÀM ĐIỀU PHỐI NỘI BỘ (INTERNAL DISPATCHER)
// =====================================================================
async function internalDispatch(intent) {
    if (!intent || typeof intent !== 'object' || !intent.type) {
        return buildErrorResult('Yêu cầu không hợp lệ.', 'Intent bị thiếu.');
    }

    const taskType = intent.type;
    let query = String(intent.query || '').trim();

    // -----------------------------------------------------------------
    // [TÍCH HỢP MEMORY] Kiểm tra ngữ cảnh từ câu hỏi trước
    // -----------------------------------------------------------------
    const context = MemoryEngine.resolveContext(query);
    if (context && context.targetEntity) {
        // Nếu câu hỏi chứa đại từ ("ông ấy", "nó"), gắn thực thể trước đó vào query
        debugLog(`[MEMORY] Ngữ cảnh: Đang nói về ${context.targetEntity}`);
        // Ta có thể thêm thực thể vào intent để Agent hiểu rõ hơn
        intent.contextEntity = context.targetEntity;
    }

    debugLog(`Dispatch: type="${taskType}", query="${query}"`);

    // -----------------------------------------------------------------
    // Tra cứu Agent (ĐỘNG)
    // -----------------------------------------------------------------
    let agentKey = AgentRegistry.findAgentForTask(taskType);

    if (!agentKey) {
        warnLog(`Không tìm thấy Agent cho task "${taskType}".`);
        
        // [TÍCH HỢP HỌC HỎI] Ghi nhận khoảng trống tri thức
        MemoryEngine.logKnowledgeGap(query);

        // Fallback sang search
        const searchAgentKey = AgentRegistry.findAgentForTask('search');
        if (searchAgentKey && AgentMap[searchAgentKey]) {
            agentKey = searchAgentKey;
            try {
                const searchAgent = AgentMap[searchAgentKey];
                const searchMethod = AgentRegistry.getMethodName(searchAgentKey, 'search');
                if (searchMethod && typeof searchAgent[searchMethod] === 'function') {
                    const rawResult = await searchAgent[searchMethod](query);
                    return normalizeResult(rawResult, searchAgentKey);
                }
            } catch (err) {
                errorLog(`Lỗi trong fallback search:`, err);
            }
        }
        return buildErrorResult(`Tính năng "${taskType}" hiện chưa được hỗ trợ.`, '');
    }

    const agentInstance = AgentMap[agentKey];
    const methodName = AgentRegistry.getMethodName(agentKey, taskType);

    if (!agentInstance || !methodName || typeof agentInstance[methodName] !== 'function') {
        errorLog(`Agent "${agentKey}" hoặc method "${methodName}" không hợp lệ.`);
        return buildErrorResult('Hệ thống gặp sự cố kết nối tri thức.', '');
    }

    // -----------------------------------------------------------------
    // Gọi Agent
    // -----------------------------------------------------------------
    debugLog(`Điều phối "${taskType}" → ${agentKey}.${methodName}("${query}")`);

    let rawResult;
    try {
        // Nếu Agent có hỗ trợ tham số thứ 2 (như Praiser/Critic), ta truyền title
        if (methodName === 'analyze' && (agentKey === 'praiser' || agentKey === 'critic' || agentKey === 'analysis')) {
            rawResult = await agentInstance[methodName](query, intent.title || '');
        } else {
            rawResult = await agentInstance[methodName](query);
        }
    } catch (err) {
        errorLog(`Lỗi khi gọi ${agentKey}.${methodName}:`, err);
        return buildErrorResult('Hệ thống đang gặp chút trục trặc.', `Agent "${agentKey}" báo lỗi: ${err.message}`);
    }

    const normalized = normalizeResult(rawResult, agentKey);
    
    // [TÍCH HỢP MEMORY] Lưu lại lượt hội thoại này
    MemoryEngine.saveTurn(query, normalized);

    return normalized;
}

function buildErrorResult(message, detail) {
    return {
        answer: message,
        detail: detail ? `Chi tiết: ${detail}` : '',
        source: 'error',
        meta: []
    };
}

// =====================================================================
// PHẦN 4: PUBLIC API — MASTER AI
// =====================================================================
export const MasterAI = {
    version: MASTER_VERSION,

    parseIntent(input) {
        return InputAI.parseIntent(input);
    },

    async dispatch(intent) {
        return await internalDispatch(intent);
    },

    /**
     * Pipeline đầy đủ: parse → dispatch → render.
     */
    async processQuery(inputElement, container) {
        if (!inputElement || typeof inputElement.value !== 'string') {
            return { type: 'empty' };
        }

        const text = inputElement.value.trim();
        if (!text) return { type: 'empty' };

        const intent = InputAI.parseIntent(text);
        debugLog('Intent:', intent);

        if (intent.type === 'search' && intent.mode === 'search') {
            return { type: 'search', query: intent.query };
        }

        if (container) {
            try { OutputAI.renderLoading(container); } catch (err) { errorLog('Lỗi render Loading:', err); }
        }

        const result = await internalDispatch(intent);

        if (container) {
            try { OutputAI.render(container, result, text); } 
            catch (err) {
                errorLog('Lỗi render kết quả:', err);
                container.innerHTML = `<div class="ask-result ask-error"><div class="ask-answer">${result.answer}</div></div>`;
            }
        }

        return { type: 'answered' };
    },

    validate() {
        const errors = [];
        const warnings = [];

        if (!InputAI || typeof InputAI.parseIntent !== 'function') errors.push('InputAI lỗi.');
        if (!OutputAI || typeof OutputAI.render !== 'function') errors.push('OutputAI lỗi.');
        if (!AgentRegistry || AgentRegistry.getAllAgentKeys().length === 0) errors.push('Không có Agent.');

        return {
            ok: errors.length === 0,
            version: MASTER_VERSION,
            totalAgents: AgentRegistry.getAllAgentKeys ? AgentRegistry.getAllAgentKeys().length : 0,
            errors,
            warnings
        };
    }
};

export const AIDispatcher = MasterAI;

// =====================================================================
// PHẦN 5: LOG KHỞI TẠO
// =====================================================================
if (typeof console !== 'undefined' && console.log) {
    const agentCount = AgentRegistry.getAllAgentKeys().length;
    console.log(
        `%c[MASTER] Văn Đạo MasterAI v${MASTER_VERSION} (Living Intelligence) sẵn sàng. ` +
        `Điều phối ${agentCount} Agent. Bản sắc: ${Identity.pronouns.self} - ${Identity.pronouns.user}.`,
        'color: #8bb8a8; font-weight: bold;'
    );
}
