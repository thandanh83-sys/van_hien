/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 9.0.0 (Unified Semantic Routing)
 * ==========================================================
 * TRIẾT LÝ:
 * - Gộp chung Search và Ask Dạo vào một luồng xử lý duy nhất.
 * - SmartInputParser sẽ quyết định: Nếu là từ khóa ngắn -> Search nhanh.
 *   Nếu là câu hỏi dài -> Chạy Pipeline Đa chiều.
 * ==========================================================
 */

import { OutputAI } from './output-ai.js';
import { AgentMap, AgentRegistry } from './agents/index.js';
import { MemoryEngine } from './memory-engine.js';
import { Identity } from './identity.js';
import { DataHub } from '../network/data-hub.js';
import { escapeHTML } from '../utils.js';
import { VDSearchEngine } from '../search.js';
import { SmartInputParser } from './smart-input-parser.js';
import { preprocessText } from './nlp-tools.js';

// =====================================================================
// PHẦN 1: PHIÊN BẢN & LOG
// =====================================================================
export const MASTER_VERSION = '9.0.0';

function debugLog(...args) {
    if (typeof window !== 'undefined' && window.VD_MASTER_DEBUG) console.log('[MASTER]', ...args);
}
function errorLog(...args) { console.error('[MASTER]', ...args); }

// =====================================================================
// PHẦN 2: ADAPTER
// =====================================================================
function isStandardResult(obj) { return (obj !== null && typeof obj === 'object' && typeof obj.answer === 'string' && obj.answer.length > 0); }
function isThematicResult(obj) { return (obj !== null && typeof obj === 'object' && typeof obj.commentary === 'string' && obj.commentary.length > 0); }

function adaptThematicResult(raw, sourceKey) {
    return {
        answer: raw.commentary,
        detail: `Chủ đề: ${raw.theme || 'Chưa rõ'} | Hình ảnh: ${raw.symbol || 'Không có'}`,
        source: sourceKey || 'unknown',
        meta: []
    };
}

function normalizeResult(raw, sourceKey) {
    if (isStandardResult(raw)) return { answer: raw.answer, detail: raw.detail || '', source: raw.source || sourceKey || 'unknown', meta: Array.isArray(raw.meta) ? raw.meta : [], ...raw };
    if (isThematicResult(raw)) return adaptThematicResult(raw, sourceKey);
    if (raw === null || raw === undefined) return { answer: 'Agent không trả về kết quả.', detail: '', source: 'error', meta: [] };
    return { answer: 'Agent trả về kết quả không xác định.', detail: '', source: 'error', meta: [] };
}

// =====================================================================
// PHẦN 3: PIPELINE ĐA CHIỀU (MULTI-PERSPECTIVE PIPELINE)
// =====================================================================
async function runMultiPerspectivePipeline(parsedInput) {
    debugLog(`[PIPELINE] Khởi chạy Pipeline đa chiều cho: "${parsedInput.raw}"`);

    // 1. Nếu là gợi ý theo cảm xúc (Recommend)
    if (parsedInput.intent === 'recommend' && parsedInput.mood) {
        const moodWorks = DataHub.getWorksByMood(parsedInput.mood);
        if (moodWorks.length > 0) {
            return {
                answer: `Thấu hiểu tâm trạng của ${Identity.pronouns.user}, ${Identity.pronouns.self} xin gợi ý những áng văn mang âm hưởng <b>${parsedInput.mood}</b>:`,
                source: 'smart-recommendation',
                meta: moodWorks.slice(0, 5)
            };
        }
    }

    // 2. Phân tích tác phẩm (Analyze)
    const workInfo = await AgentMap['literature'].getWorkInfo(parsedInput.coreKeyword);
    if (!workInfo.ok) return null;

    const work = workInfo.record;
    const fullText = workInfo.detail.content || work.desc || '';

    const analysis = await AgentMap['analysis'].analyze(work);
    const praise = await AgentMap['praiser'].analyze(fullText, work.title);
    const critique = await AgentMap['critic'].analyze(fullText, work.title);

    let relatedByMood = [];
    if (work.cam_xuc && work.cam_xuc.length > 0) {
        relatedByMood = DataHub.getWorksByMood(work.cam_xuc[0]).filter(w => w.id !== work.id).slice(0, 3);
    }

    let report = `Dựa trên tri thức về <b>"${escapeHTML(work.title)}"</b> của ${escapeHTML(work.author)}, ${Identity.pronouns.self} xin dâng lên ${Identity.pronouns.user} vài góc nhìn:\n\n`;
    report += `<div style="margin-bottom: 15px;"><b>1. Phân tích Thi pháp:</b><br>${analysis.answer}</div>`;
    report += `<div style="margin-bottom: 15px;"><b>2. Vẻ đẹp Tán thưởng:</b><br>${praise.commentary}</div>`;
    report += `<div style="margin-bottom: 15px;"><b>3. Góc nhìn Phản biện:</b><br>${critique.commentary}</div>`;

    if (relatedByMood.length > 0) {
        report += `<div style="margin-bottom: 15px;"><b>4. Liên kết cảm xúc (${escapeHTML(work.cam_xuc[0])}):</b><br>`;
        report += `Vì cùng mang cảm xúc này, ${Identity.pronouns.self} gợi ý ${Identity.pronouns.user} tìm đọc thêm: <i>${relatedByMood.map(w => w.title).join(', ')}</i>.</div>`;
    }

    return {
        answer: report,
        detail: `Phân tích đa chiều được tổng hợp bởi Hội đồng Văn Đạo.`,
        source: 'master-pipeline',
        meta: [work, ...relatedByMood]
    };
}

// =====================================================================
// PHẦN 4: XỬ LÝ ĐẦU VÀO HỢP NHẤT (UNIFIED HANDLER)
// =====================================================================
async function internalHandle(rawQuery) {
    // 1. Dùng SmartInputParser để giải mã câu hỏi
    const parsed = SmartInputParser.parse(rawQuery);
    debugLog('Parsed Input:', parsed);

    // 2. Nếu là câu hỏi sâu (Deep Query) -> Kích hoạt Pipeline đa chiều
    if (parsed.isDeepQuery) {
        const pipelineResult = await runMultiPerspectivePipeline(parsed);
        if (pipelineResult) {
            MemoryEngine.saveTurn(rawQuery, pipelineResult);
            return pipelineResult;
        }
    }

    // 3. Nếu là tìm kiếm ngắn (Search) hoặc Pipeline không tìm thấy -> Dùng Search
    let results = VDSearchEngine.search(parsed.coreKeyword).map(r => DataHub.getMetadata(r.id)?.data).filter(Boolean);
    
    // Nếu không thấy, thử tìm theo cảm xúc
    if (results.length === 0 && parsed.mood) {
        results = DataHub.getWorksByMood(parsed.mood);
    }

    // Tạo lời dẫn dắt (Agent-Guided Search)
    let commentary = '';
    if (results.length === 1) {
        const highlight = AgentMap['praiser'].getQuickHighlight(results[0]);
        commentary = `Tàng thư chỉ lưu giữ một dấu tích trọn vẹn nhất là <b>"${escapeHTML(results[0].title)}"</b>. ${highlight}`;
    } else if (results.length > 1) {
        const commonThread = AgentMap['comparison'].findCommonThread(results);
        commentary = `Ta đã tìm thấy <b>${results.length} áng văn</b> hữu duyên với từ khóa của bạn. ${commonThread}`;
    } else {
        const randomWorks = APP_DATA.WORKS_DATA.sort(() => 0.5 - Math.random());
        const fallbackWork = randomWorks[0];
        if (fallbackWork) {
            commentary = `Tàng thư chưa ghi chép trực tiếp về <i>"${escapeHTML(rawQuery)}"</i>. Tuy nhiên, hữu duyên thiên lý, mời bạn thử chiêm nghiệm <b>"${escapeHTML(fallbackWork.title)}"</b> của ${escapeHTML(fallbackWork.author)}.`;
            results = [fallbackWork];
        } else {
            commentary = `Không tìm thấy kết quả nào phù hợp.`;
        }
    }

    const finalResult = {
        answer: commentary,
        source: 'agent-guided-search',
        meta: results.slice(0, 5)
    };
    MemoryEngine.saveTurn(rawQuery, finalResult);
    return finalResult;
}

// =====================================================================
// PHẦN 5: PUBLIC API
// =====================================================================
export const MasterAI = {
    version: MASTER_VERSION,

    async dispatch(rawQuery) {
        return await internalHandle(rawQuery);
    },

    async processQuery(inputElement, container) {
        if (!inputElement || typeof inputElement.value !== 'string') return { type: 'empty' };

        const text = inputElement.value.trim();
        if (!text) return { type: 'empty' };

        if (container) {
            try { OutputAI.renderLoading(container); } catch (err) { errorLog('Lỗi render Loading:', err); }
        }

        const result = await internalHandle(text);

        if (container) {
            try { OutputAI.render(container, result, text); } 
            catch (err) {
                errorLog('Lỗi render kết quả:', err);
                container.innerHTML = `<div class="ask-result ask-error"><div class="ask-answer">${result.answer}</div></div>`;
            }
        }

        return { type: 'answered' };
    }
};

export const AIDispatcher = MasterAI;

if (typeof console !== 'undefined' && console.log) {
    console.log(
        `%c[MASTER] Văn Đạo MasterAI v${MASTER_VERSION} (Unified Semantic Router) sẵn sàng.`,
        'color: #8bb8a8; font-weight: bold;'
    );
}
