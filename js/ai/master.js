/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 7.0.0 (Multi-Perspective Pipeline)
 * ==========================================================
 * CHỨC NĂNG (ORCHESTRATION):
 * - Điều phối câu hỏi từ InputAI đến đúng Agent qua AgentRegistry.
 * - Tích hợp MemoryEngine để nhớ ngữ cảnh hội thoại.
 * - [MỚI v7.0.0] Kích hoạt "Pipeline Đa Chiều" (Multi-Perspective Pipeline)
 *   khi người dùng yêu cầu Phân tích hoặc Khám phá thực thể.
 *   Pipeline này sẽ gọi liên tiếp: LiteraryEngine -> Praiser -> Critic -> DataHub
 *   để tạo ra một báo cáo toàn diện và sâu sắc.
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { AgentMap, AgentRegistry } from './agents/index.js';
import { MemoryEngine } from './memory-engine.js';
import { Identity } from './identity.js';
import { DataHub } from '../network/data-hub.js';
import { escapeHTML } from '../utils.js';

// =====================================================================
// PHẦN 1: PHIÊN BẢN & LOG TIỆN ÍCH
// =====================================================================
export const MASTER_VERSION = '7.0.0';

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
// PHẦN 3: PIPELINE ĐA CHIỀU (MULTI-PERSPECTIVE PIPELINE)
// =====================================================================
async function runMultiPerspectivePipeline(query) {
    debugLog(`[PIPELINE] Khởi chạy Pipeline đa chiều cho: "${query}"`);

    // 1. Lấy thông tin tác phẩm
    const workInfo = await AgentMap['literature'].getWorkInfo(query);
    if (!workInfo.ok) return null; // Không tìm thấy thì để fallback

    const work = workInfo.record;
    const fullText = workInfo.detail.content || work.desc || '';

    // 2. Phân tích Thi pháp (Analysis Agent)
    const analysis = await AgentMap['analysis'].analyze(work);

    // 3. Tán thưởng & Phê bình (Praiser & Critic)
    const praise = await AgentMap['praiser'].analyze(fullText, work.title);
    const critique = await AgentMap['critic'].analyze(fullText, work.title);

    // 4. Liên kết dữ liệu (DataHub - Hướng 3)
    let relatedByMood = [];
    let relatedByTag = [];
    
    if (work.cam_xuc && work.cam_xuc.length > 0) {
        relatedByMood = DataHub.getWorksByMood(work.cam_xuc[0])
            .filter(w => w.id !== work.id).slice(0, 3);
    }
    if (work.tags && work.tags.length > 0) {
        relatedByTag = DataHub.getWorksByTag(work.tags[0])
            .filter(w => w.id !== work.id && !relatedByMood.some(m => m.id === w.id)).slice(0, 3);
    }

    // 5. Tổng hợp Báo cáo HTML
    let report = `Dựa trên tri thức về <b>"${escapeHTML(work.title)}"</b> của ${escapeHTML(work.author)}, ${Identity.pronouns.self} xin dâng lên ${Identity.pronouns.user} vài góc nhìn:\n\n`;
    
    report += `<div style="margin-bottom: 15px;"><b>1. Phân tích Thi pháp:</b><br>${analysis.answer}</div>`;
    
    report += `<div style="margin-bottom: 15px;"><b>2. Vẻ đẹp Tán thưởng:</b><br>${praise.commentary}</div>`;
    
    report += `<div style="margin-bottom: 15px;"><b>3. Góc nhìn Phản biện:</b><br>${critique.commentary}</div>`;

    if (relatedByMood.length > 0) {
        report += `<div style="margin-bottom: 15px;"><b>4. Liên kết cảm xúc (${escapeHTML(work.cam_xuc[0])}):</b><br>`;
        report += `Vì cùng mang cảm xúc này, ${Identity.pronouns.self} gợi ý ${Identity.pronouns.user} tìm đọc thêm: <i>${relatedByMood.map(w => w.title).join(', ')}</i>.</div>`;
    }

    if (relatedByTag.length > 0) {
        report += `<div style="margin-bottom: 15px;"><b>5. Liên kết chủ đề (${escapeHTML(work.tags[0])}):</b><br>`;
        report += `Cùng chủ đề này, còn có các tác phẩm: <i>${relatedByTag.map(w => w.title).join(', ')}</i>.</div>`;
    }

    const metaList = [work, ...relatedByMood, ...relatedByTag];

    return {
        answer: report,
        detail: `Phân tích đa chiều được tổng hợp bởi Hội đồng Văn Đạo.`,
        source: 'master-pipeline',
        meta: metaList
    };
}

// =====================================================================
// PHẦN 4: HÀM ĐIỀU PHỐI NỘI BỘ (INTERNAL DISPATCHER)
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
        debugLog(`[MEMORY] Ngữ cảnh: Đang nói về ${context.targetEntity}`);
        intent.contextEntity = context.targetEntity;
    }

    debugLog(`Dispatch: type="${taskType}", query="${query}"`);

    // -----------------------------------------------------------------
    // [KÍCH HOẠT PIPELINE ĐA CHIỀU]
    // -----------------------------------------------------------------
    if (taskType === 'analyze-work' || taskType === 'explore') {
        try {
            const pipelineResult = await runMultiPerspectivePipeline(query);
            if (pipelineResult) {
                MemoryEngine.saveTurn(query, pipelineResult);
                return pipelineResult;
            }
        } catch (err) {
            errorLog('Lỗi khi chạy Pipeline đa chiều:', err);
            // Nếu lỗi, tiếp tục fallback xuống Dispatch 1 Agent bên dưới
        }
    }

    // -----------------------------------------------------------------
    // Tra cứu Agent (ĐỘNG) - Dành cho các task đơn lẻ
    // -----------------------------------------------------------------
    let agentKey = AgentRegistry.findAgentForTask(taskType);

    if (!agentKey) {
        warnLog(`Không tìm thấy Agent cho task "${taskType}".`);
        MemoryEngine.logKnowledgeGap(query);

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
// PHẦN 5: PUBLIC API — MASTER AI
// =====================================================================
export const MasterAI = {
    version: MASTER_VERSION,

    parseIntent(input) {
        return InputAI.parseIntent(input);
    },

    async dispatch(intent) {
        return await internalDispatch(intent);
    },

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
// PHẦN 6: LOG KHỞI TẠO
// =====================================================================
if (typeof console !== 'undefined' && console.log) {
    const agentCount = AgentRegistry.getAllAgentKeys().length;
    console.log(
        `%c[MASTER] Văn Đạo MasterAI v${MASTER_VERSION} (Multi-Perspective) sẵn sàng. ` +
        `Điều phối ${agentCount} Agent.`,
        'color: #8bb8a8; font-weight: bold;'
    );
}
