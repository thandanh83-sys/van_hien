/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 8.0.0 (Agent-Guided Search Edition)
 * ==========================================================
 * CHỨC NĂNG:
 * - Điều phối câu hỏi từ InputAI đến đúng Agent qua AgentRegistry.
 * - Tích hợp MemoryEngine để nhớ ngữ cảnh hội thoại.
 * - [MỚI v8.0.0] Thêm nhánh xử lý 'search' có Agent dẫn dắt.
 *   Thay vì trả về danh sách khô khan, Master sẽ gọi Praiser,
 *   Comparison hoặc FortuneAgent để tạo lời dẫn dắt có hồn.
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { AgentMap, AgentRegistry } from './agents/index.js';
import { MemoryEngine } from './memory-engine.js';
import { Identity } from './identity.js';
import { DataHub } from '../network/data-hub.js';
import { escapeHTML } from '../utils.js';
import { VDSearchEngine } from '../search.js';
import { EntityExtractor } from './nlp/entity-extractor.js';

// =====================================================================
// PHẦN 1: PHIÊN BẢN & LOG TIỆN ÍCH
// =====================================================================
export const MASTER_VERSION = '8.0.0';

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
// PHẦN 2: HÀM ADAPTER
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
    if (isThematicResult(raw)) return adaptThematicResult(raw, sourceKey);
    if (raw === null || raw === undefined) return { answer: 'Agent không trả về kết quả.', detail: '', source: 'error', meta: [] };
    return { answer: 'Agent trả về kết quả không xác định.', detail: '', source: 'error', meta: [] };
}

// =====================================================================
// PHẦN 3: PIPELINE ĐA CHIỀU (MULTI-PERSPECTIVE PIPELINE)
// =====================================================================
async function runMultiPerspectivePipeline(query) {
    debugLog(`[PIPELINE] Khởi chạy Pipeline đa chiều cho: "${query}"`);

    const workInfo = await AgentMap['literature'].getWorkInfo(query);
    if (!workInfo.ok) return null;

    const work = workInfo.record;
    const fullText = workInfo.detail.content || work.desc || '';

    const analysis = await AgentMap['analysis'].analyze(work);
    const praise = await AgentMap['praiser'].analyze(fullText, work.title);
    const critique = await AgentMap['critic'].analyze(fullText, work.title);

    let relatedByMood = [];
    let relatedByTag = [];
    
    if (work.cam_xuc && work.cam_xuc.length > 0) {
        relatedByMood = DataHub.getWorksByMood(work.cam_xuc[0]).filter(w => w.id !== work.id).slice(0, 3);
    }
    if (work.tags && work.tags.length > 0) {
        relatedByTag = DataHub.getWorksByTag(work.tags[0]).filter(w => w.id !== work.id && !relatedByMood.some(m => m.id === w.id)).slice(0, 3);
    }

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

    return {
        answer: report,
        detail: `Phân tích đa chiều được tổng hợp bởi Hội đồng Văn Đạo.`,
        source: 'master-pipeline',
        meta: [work, ...relatedByMood, ...relatedByTag]
    };
}

// =====================================================================
// PHẦN 4: AGENT-GUIDED SEARCH (TÌM KIẾM CÓ DẪN DẮT)
// =====================================================================
async function runAgentGuidedSearch(query) {
    debugLog(`[SEARCH] Khởi chạy Search có dẫn dắt cho: "${query}"`);

    // 1. Trích xuất thực thể ẩn (Nếu có)
    const entities = EntityExtractor.extract(query);
    
    // 2. Tìm kiếm cơ bản
    let results = VDSearchEngine.search(query).map(r => {
        return DataHub.getMetadata(r.id)?.data;
    }).filter(Boolean);

    // Nếu không thấy, thử tìm theo cảm xúc
    if (results.length === 0 && entities.length > 0) {
        const firstEntity = entities[0];
        if (firstEntity.group === 'bieu-tuong') {
             // Fallback tìm theo từ khóa
        }
    }

    // 3. Tạo lời dẫn dắt
    let commentary = '';
    
    if (results.length === 1) {
        const highlight = AgentMap['praiser'].getQuickHighlight(results[0]);
        commentary = `Tàng thư chỉ lưu giữ một dấu tích trọn vẹn nhất là <b>"${escapeHTML(results[0].title)}"</b>. ${highlight}`;
    } 
    else if (results.length > 1) {
        const commonThread = AgentMap['comparison'].findCommonThread(results);
        commentary = `Ta đã tìm thấy <b>${results.length} áng văn</b> hữu duyên với từ khóa của bạn. ${commonThread}`;
    } 
    else {
        // Không thấy -> Gợi ý ngẫu nhiên
        const randomWorks = APP_DATA.WORKS_DATA.sort(() => 0.5 - Math.random());
        const fallbackWork = randomWorks[0];
        
        if (fallbackWork) {
            commentary = `Tàng thư chưa ghi chép trực tiếp về <i>"${escapeHTML(query)}"</i>. Tuy nhiên, hữu duyên thiên lý, mời bạn thử chiêm nghiệm <b>"${escapeHTML(fallbackWork.title)}"</b> của ${escapeHTML(fallbackWork.author)}.`;
            results = [fallbackWork];
        } else {
            commentary = `Không tìm thấy kết quả nào phù hợp.`;
        }
    }

    return {
        answer: commentary,
        source: 'agent-guided-search',
        meta: results.slice(0, 5)
    };
}

// =====================================================================
// PHẦN 5: HÀM ĐIỀU PHỐI NỘI BỘ (INTERNAL DISPATCHER)
// =====================================================================
async function internalDispatch(intent) {
    if (!intent || typeof intent !== 'object' || !intent.type) {
        return buildErrorResult('Yêu cầu không hợp lệ.', 'Intent bị thiếu.');
    }

    const taskType = intent.type;
    let query = String(intent.query || '').trim();

    const context = MemoryEngine.resolveContext(query);
    if (context && context.targetEntity) {
        intent.contextEntity = context.targetEntity;
    }

    debugLog(`Dispatch: type="${taskType}", query="${query}"`);

    // -----------------------------------------------------------------
    // [NHÁNH 1] SEARCH CÓ DẪN DẮT
    // -----------------------------------------------------------------
    if (taskType === 'search') {
        try {
            const searchResult = await runAgentGuidedSearch(query);
            MemoryEngine.saveTurn(query, searchResult);
            return searchResult;
        } catch (err) {
            errorLog('Lỗi khi chạy Search có dẫn dắt:', err);
            return buildErrorResult('Lỗi tìm kiếm.', err.message);
        }
    }

    // -----------------------------------------------------------------
    // [NHÁNH 2] PIPELINE ĐA CHIỀU
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
        }
    }

    // -----------------------------------------------------------------
    // [NHÁNH 3] GỌI 1 AGENT ĐƠN LẺ
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
        return buildErrorResult('Hệ thống gặp sự cố kết nối tri thức.', '');
    }

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
// PHẦN 6: PUBLIC API — MASTER AI
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
            // [SỬA] Chuyển hướng Search sang hàm có dẫn dắt
            if (container) {
                try { OutputAI.renderLoading(container); } catch (err) { errorLog('Lỗi render Loading:', err); }
            }
            const searchResult = await runAgentGuidedSearch(intent.query);
            if (container) {
                OutputAI.render(container, searchResult, text);
            }
            return { type: 'answered' };
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
// PHẦN 7: LOG KHỞI TẠO
// =====================================================================
if (typeof console !== 'undefined' && console.log) {
    const agentCount = AgentRegistry.getAllAgentKeys().length;
    console.log(
        `%c[MASTER] Văn Đạo MasterAI v${MASTER_VERSION} (Agent-Guided Search) sẵn sàng. ` +
        `Điều phối ${agentCount} Agent.`,
        'color: #8bb8a8; font-weight: bold;'
    );
}
