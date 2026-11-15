/**
 * ==========================================================
 * VĂN ĐẠO — MASTER MODULE (Bộ điều phối trung tâm)
 * Vị trí: js/ai/master.js
 * Version: 11.0.0 (Contemplative Orchestrator — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. OMNIBOX ROUTING (Phân luồng thông minh):
 *    - Factoid:     Trả lời ngắn gọn (ai viết, tóm tắt, là ai...)
 *    - Deep Query:  Phân tích đa chiều (phân tích, cảm nhận, so sánh...)
 *    - Search:      Tìm kiếm danh sách (gõ tên tác phẩm...)
 *
 * 2. CONTEMPLATIVE PIPELINE (Pipeline chiêm nghiệm):
 *    - runMultiPerspectivePipeline giờ gọi:
 *      + AnalysisAgent          → phân tích cấu trúc
 *      + KhucTanThuongAgent     → Khúc Tán Thưởng (thay PraiserAgent)
 *      + GoiMoAgent             → Lời Gợi Mở (thay CriticAgent)
 *    - KHÔNG có bất kỳ điểm số nào trong báo cáo.
 *
 * 3. TRÍ NHỚ (Memory):
 *    - MemoryEngine tự động lưu ngữ cảnh hội thoại.
 *    - Giải quyết đại từ ("nó", "ông ấy", "tác phẩm này").
 *
 * 4. AN TOÀN (Fallback):
 *    - Luôn có fallback graceful khi agent lỗi.
 *    - Không bao giờ crash vì agent không trả về kết quả.
 *
 * 5. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
 *    - Giữ nguyên API công khai: MasterAI, AIDispatcher.
 *    - Giữ nguyên signature: parseIntent, dispatch, processQuery, validate.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v10.0.2: Fixed Absolute Relative Imports.
 * - v11.0.0: Contemplative Orchestrator.
 *   - [ĐỔI] AgentMap['praiser'] → AgentMap['khuc-tan-thuong']
 *   - [ĐỔI] AgentMap['critic']  → AgentMap['goi-mo']
 *   - [ĐỔI] `getQuickHighlight` → `getQuickComment`
 *   - [ĐỔI] Report labels: "Vẻ đẹp Tán thưởng" → "Khúc Tán Thưởng",
 *           "Góc nhìn Phản biện" → "Lời Gợi Mở"
 *   - [BỎ] Không còn bất kỳ ngôn ngữ chấm điểm nào.
 *
 * ==========================================================
 */

// =====================================================================
// PHẦN 1: IMPORTS
// =====================================================================
import { SmartInputParser } from './smart-input-parser.js';
import { AgentMap, AgentRegistry } from './agents/index.js';
import { MemoryEngine } from './memory-engine.js';
import { Identity } from './identity.js';
import { OutputAI } from './output-ai.js';
import { DataHub } from '../network/data-hub.js';
import { VDSearchEngine } from '../search.js';
import { escapeHTML } from '../utils.js';
import { APP_DATA } from '../config.js';

// =====================================================================
// PHẦN 2: PHIÊN BẢN & LOG TIỆN ÍCH
// =====================================================================
export const MASTER_VERSION = '11.0.0';

function debugLog(...args) {
    if (typeof window !== 'undefined' && window.VD_MASTER_DEBUG) {
        console.log('[MASTER]', ...args);
    }
}
function errorLog(...args) {
    console.error('[MASTER]', ...args);
}

// =====================================================================
// PHẦN 3: HÀM ADAPTER — CHUẨN HÓA KẾT QUẢ
// =====================================================================

/**
 * Kiểm tra kết quả có phải chuẩn { answer, ... } không.
 * @private
 */
function isStandardResult(obj) {
    return obj !== null
        && typeof obj === 'object'
        && typeof obj.answer === 'string'
        && obj.answer.length > 0;
}

/**
 * Kiểm tra kết quả có phải thematic (commentary) không.
 * @private
 */
function isThematicResult(obj) {
    return obj !== null
        && typeof obj === 'object'
        && typeof obj.commentary === 'string'
        && obj.commentary.length > 0;
}

/**
 * Chuyển thematic result → standard result.
 * @private
 */
function adaptThematicResult(raw, sourceKey) {
    return {
        answer: raw.commentary,
        detail: `Chủ đề: ${raw.theme || 'Chưa rõ'} | Hình ảnh: ${raw.symbol || 'Không có'}`,
        source: sourceKey || 'unknown',
        meta: []
    };
}

/**
 * Chuẩn hóa kết quả về dạng { answer, detail, source, meta }.
 * @private
 */
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
        return {
            answer: 'Agent không trả về kết quả.',
            detail: '',
            source: 'error',
            meta: []
        };
    }
    return {
        answer: 'Agent trả về kết quả không xác định.',
        detail: '',
        source: 'error',
        meta: []
    };
}

// =====================================================================
// PHẦN 4: PIPELINE ĐA CHIỀU (CONTEMPLATIVE PIPELINE)
// =====================================================================
/**
 * Pipeline phân tích đa chiều — KHÔNG chấm điểm.
 *
 * Cấu trúc báo cáo:
 *   1. Phân tích thi pháp (AnalysisAgent)
 *   2. Khúc Tán Thưởng  (KhucTanThuongAgent)
 *   3. Lời Gợi Mở       (GoiMoAgent)
 *   4. Liên kết cảm xúc (nếu có)
 *
 * @private
 * @param {Object} parsedInput - Kết quả từ SmartInputParser.parse()
 * @returns {Promise<Object|null>} Kết quả chuẩn hoặc null nếu không xử lý được
 */
async function runMultiPerspectivePipeline(parsedInput) {
    debugLog(`[PIPELINE] Khởi chạy Pipeline đa chiều cho: "${parsedInput.raw}"`);

    // -----------------------------------------------------------------
    // 4.1. Gợi ý theo cảm xúc (Recommend)
    // -----------------------------------------------------------------
    if (parsedInput.intent === 'recommend' && parsedInput.mood) {
        const moodWorks = DataHub.getWorksByMood(parsedInput.mood);
        if (moodWorks.length > 0) {
            return {
                answer: `Thấu hiểu tâm trạng của ${Identity.pronouns.user}, ${Identity.pronouns.self} xin gợi ý những áng văn mang âm hưởng <b>${escapeHTML(parsedInput.mood)}</b>:`,
                source: 'smart-recommendation',
                meta: moodWorks.slice(0, 5)
            };
        }
    }

    // -----------------------------------------------------------------
    // 4.2. Lấy thông tin tác phẩm
    // -----------------------------------------------------------------
    let workInfo;
    try {
        workInfo = await AgentMap['literature'].getWorkInfo(parsedInput.coreKeyword);
    } catch (err) {
        errorLog('Không lấy được work info:', err);
        return null;
    }

    if (!workInfo || !workInfo.ok) return null;

    const work = workInfo.record;
    const fullText = (workInfo.detail && workInfo.detail.content) || work.desc || '';

    // -----------------------------------------------------------------
    // 4.3. Gọi 3 agents song song (với fallback graceful)
    // -----------------------------------------------------------------
    let analysis = null;
    let praise = null;
    let goiMo = null;

    // AnalysisAgent
    try {
        analysis = await AgentMap['analysis'].analyze(work);
    } catch (err) {
        console.warn('[PIPELINE] AnalysisAgent lỗi:', err);
        analysis = { answer: 'Cần thêm thời gian để phân tích cấu trúc bài thơ.' };
    }

    // KhucTanThuongAgent (thay PraiserAgent)
    try {
        praise = await AgentMap['khuc-tan-thuong'].analyze(fullText, work.title);
    } catch (err) {
        console.warn('[PIPELINE] KhucTanThuongAgent lỗi:', err);
        praise = { commentary: 'Cần thêm thời gian để cảm nhận vẻ đẹp của bài thơ.' };
    }

    // GoiMoAgent (thay CriticAgent)
    try {
        goiMo = await AgentMap['goi-mo'].analyze(fullText, work.title);
    } catch (err) {
        console.warn('[PIPELINE] GoiMoAgent lỗi:', err);
        goiMo = { commentary: 'Có một chiều sâu ta muốn cùng Bạn đào thêm, nhưng cần đọc chậm hơn.' };
    }

    // -----------------------------------------------------------------
    // 4.4. Liên kết cảm xúc (nếu có)
    // -----------------------------------------------------------------
    let relatedByMood = [];
    if (Array.isArray(work.cam_xuc) && work.cam_xuc.length > 0) {
        try {
            relatedByMood = DataHub.getWorksByMood(work.cam_xuc[0])
                .filter(w => w.id !== work.id)
                .slice(0, 3);
        } catch (err) {
            console.warn('[PIPELINE] Liên kết cảm xúc lỗi:', err);
        }
    }

    // -----------------------------------------------------------------
    // 4.5. Xây dựng báo cáo
    // -----------------------------------------------------------------
    // Lưu ý: Labels đã đổi từ "Vẻ đẹp Tán thưởng" / "Góc nhìn Phản biện"
    // sang "Khúc Tán Thưởng" / "Lời Gợi Mở".
    // -----------------------------------------------------------------
    let report = `Dựa trên tri thức về <b>"${escapeHTML(work.title)}"</b> của ${escapeHTML(work.author)}, `
        + `${Identity.pronouns.self} xin dâng lên ${Identity.pronouns.user} vài góc nhìn:\n\n`;

    // 4.5.1. Phân tích thi pháp
    report += `<div style="margin-bottom: 15px;">`
        + `<b>1. Phân tích Thi pháp:</b><br>${(analysis && analysis.answer) || 'Cần thêm thời gian.'}`
        + `</div>`;

    // 4.5.2. Khúc Tán Thưởng (thay "Vẻ đẹp Tán thưởng")
    report += `<div style="margin-bottom: 15px;">`
        + `<b>2. Khúc Tán Thưởng:</b><br>${(praise && praise.commentary) || 'Cần thêm thời gian.'}`
        + `</div>`;

    // 4.5.3. Lời Gợi Mở (thay "Góc nhìn Phản biện")
    report += `<div style="margin-bottom: 15px;">`
        + `<b>3. Lời Gợi Mở:</b><br>${(goiMo && goiMo.commentary) || 'Cần thêm thời gian.'}`
        + `</div>`;

    // 4.5.4. Liên kết cảm xúc (nếu có)
    if (relatedByMood.length > 0) {
        report += `<div style="margin-bottom: 15px;">`
            + `<b>4. Liên kết cảm xúc (${escapeHTML(work.cam_xuc[0])}):</b><br>`
            + `Vì cùng mang cảm xúc này, ${Identity.pronouns.self} gợi ý ${Identity.pronouns.user} tìm đọc thêm: `
            + `<i>${relatedByMood.map(w => escapeHTML(w.title)).join(', ')}</i>.`
            + `</div>`;
    }

    // -----------------------------------------------------------------
    // 4.6. Trả kết quả chuẩn
    // -----------------------------------------------------------------
    return {
        answer: report,
        detail: `Phân tích đa chiều được tổng hợp bởi Hội đồng Văn Đạo.`,
        source: 'master-pipeline',
        meta: [work, ...relatedByMood]
    };
}

// =====================================================================
// PHẦN 5: XỬ LÝ CÂU HỎI NGẮN (FACTOID)
// =====================================================================
/**
 * Xử lý các câu hỏi dạng Factoid (trả lời ngắn gọn).
 *
 * @private
 * @param {Object} parsedInput - Kết quả từ SmartInputParser.parse()
 * @returns {Promise<Object|null>}
 */
async function handleFactoid(parsedInput) {
    let result = null;
    const norm = parsedInput.normalized;
    const keyword = parsedInput.coreKeyword;

    // -----------------------------------------------------------------
    // 5.1. Phân loại câu hỏi
    // -----------------------------------------------------------------
    try {
        if (norm.includes('ai viet') || norm.includes('tac gia') || norm.includes('cua ai')) {
            result = await AgentMap['literature'].findAuthor(keyword);
        } else if (norm.includes('tom tat') || norm.includes('noi dung')) {
            result = await AgentMap['literature'].summarize(keyword);
        } else if (norm.includes('la ai') || norm.includes('la gi')) {
            result = await AgentMap['poetics'].explainSymbol(keyword);
        }
    } catch (err) {
        errorLog('Lỗi xử lý factoid:', err);
        return null;
    }

    // -----------------------------------------------------------------
    // 5.2. Bổ sung meta nếu thiếu
    // -----------------------------------------------------------------
    if (result) {
        if (!result.meta || result.meta.length === 0) {
            try {
                const searchRes = VDSearchEngine.search(keyword);
                if (searchRes.length > 0) {
                    const meta = DataHub.getMetadata(searchRes[0].id);
                    if (meta && meta.data) {
                        result.meta = [meta.data];
                    }
                }
            } catch (err) {
                console.warn('[FACTOID] Bổ sung meta lỗi:', err);
            }
        }
        return normalizeResult(result, 'factoid');
    }
    return null;
}

// =====================================================================
// PHẦN 6: XỬ LÝ ĐẦU VÀO HỢP NHẤT (UNIFIED HANDLER)
// =====================================================================
/**
 * Xử lý chính — được gọi từ MasterAI.dispatch và processQuery.
 *
 * @private
 * @param {string} rawQuery
 * @returns {Promise<Object>} Kết quả chuẩn
 */
async function internalHandle(rawQuery) {
    // -----------------------------------------------------------------
    // BƯỚC 1: Phân tích input
    // -----------------------------------------------------------------
    const parsed = SmartInputParser.parse(rawQuery);
    debugLog('Parsed Input:', parsed);

    // -----------------------------------------------------------------
    // BƯỚC 2: Nếu là Factoid → xử lý nhanh
    // -----------------------------------------------------------------
    if (parsed.isFactoid) {
        const factoidResult = await handleFactoid(parsed);
        if (factoidResult) {
            MemoryEngine.saveTurn(rawQuery, factoidResult);
            return factoidResult;
        }
    }

    // -----------------------------------------------------------------
    // BƯỚC 3: Nếu là Deep Query → chạy pipeline đa chiều
    // -----------------------------------------------------------------
    if (parsed.isDeepQuery) {
        const pipelineResult = await runMultiPerspectivePipeline(parsed);
        if (pipelineResult) {
            MemoryEngine.saveTurn(rawQuery, pipelineResult);
            return pipelineResult;
        }
    }

    // -----------------------------------------------------------------
    // BƯỚC 4: Fallback — Agent-Guided Search
    // -----------------------------------------------------------------
    let results = [];
    try {
        results = VDSearchEngine.search(parsed.coreKeyword)
            .map(r => DataHub.getMetadata(r.id)?.data)
            .filter(Boolean);
    } catch (err) {
        console.warn('[MASTER] Search lỗi:', err);
    }

    if (results.length === 0 && parsed.mood) {
        try {
            results = DataHub.getWorksByMood(parsed.mood);
        } catch (err) {
            console.warn('[MASTER] Mood search lỗi:', err);
        }
    }

    let commentary = '';

    if (results.length === 1) {
        // Có 1 kết quả → dùng KhucTanThuongAgent lấy quick comment
        // (Trước đây: AgentMap['praiser'].getQuickHighlight — không tồn tại
        //  → đổi thành getQuickComment cho đúng với agent mới).
        let highlight = '';
        try {
            highlight = AgentMap['khuc-tan-thuong'].getQuickComment(results[0]);
        } catch (err) {
            highlight = 'Đây là một áng văn đáng để dừng lại.';
        }
        commentary = `Tàng thư chỉ lưu giữ một dấu tích trọn vẹn nhất là `
            + `<b>"${escapeHTML(results[0].title)}"</b>. ${highlight}`;
    } else if (results.length > 1) {
        // Nhiều kết quả → dùng ComparisonAgent tìm điểm chung
        let commonThread = '';
        try {
            commonThread = AgentMap['comparison'].findCommonThread(results);
        } catch (err) {
            commonThread = 'Dù khác biệt về phong cách, tất cả đều là những viên ngọc quý của văn học.';
        }
        commentary = `Ta đã tìm thấy <b>${results.length} áng văn</b> hữu duyên với từ khóa của bạn. ${commonThread}`;
    } else {
        // Không có kết quả → gợi ý ngẫu nhiên
        const works = Array.isArray(APP_DATA.WORKS_DATA) ? APP_DATA.WORKS_DATA.slice() : [];
        works.sort(() => 0.5 - Math.random());
        const fallbackWork = works[0];

        if (fallbackWork) {
            commentary = `Tàng thư chưa ghi chép trực tiếp về <i>"${escapeHTML(rawQuery)}"</i>. `
                + `Tuy nhiên, hữu duyên thiên lý, mời bạn thử chiêm nghiệm `
                + `<b>"${escapeHTML(fallbackWork.title)}"</b> của ${escapeHTML(fallbackWork.author)}.`;
            results = [fallbackWork];
        } else {
            commentary = `Không tìm thấy kết quả nào phù hợp.`;
        }
    }

    // -----------------------------------------------------------------
    // BƯỚC 5: Trả kết quả cuối cùng
    // -----------------------------------------------------------------
    const finalResult = {
        answer: commentary,
        source: 'agent-guided-search',
        meta: results.slice(0, 5)
    };
    MemoryEngine.saveTurn(rawQuery, finalResult);
    return finalResult;
}

// =====================================================================
// PHẦN 7: PUBLIC API — MASTER AI
// =====================================================================
export const MasterAI = {
    // ---- Phiên bản ----
    version: MASTER_VERSION,

    /**
     * Phân tích input — trả về kết quả từ SmartInputParser.
     *
     * @param {string} input
     * @returns {Object}
     */
    parseIntent(input) {
        return SmartInputParser.parse(input);
    },

    /**
     * Dispatch — nhận input (string hoặc parsed object) và trả về kết quả.
     *
     * @param {string} rawQuery
     * @returns {Promise<Object>}
     */
    async dispatch(rawQuery) {
        return await internalHandle(rawQuery);
    },

    /**
     * Xử lý câu hỏi từ input element + render vào container.
     * Được gọi từ UI (VD: ask-dao.js).
     *
     * @param {HTMLInputElement} inputElement
     * @param {HTMLElement} container
     * @returns {Promise<{ type: string }>}
     */
    async processQuery(inputElement, container) {
        if (!inputElement || typeof inputElement.value !== 'string') {
            return { type: 'empty' };
        }

        const text = inputElement.value.trim();
        if (!text) return { type: 'empty' };

        // Hiển thị loading
        if (container) {
            try {
                OutputAI.renderLoading(container);
            } catch (err) {
                errorLog('Lỗi render Loading:', err);
            }
        }

        // Xử lý
        const result = await internalHandle(text);

        // Render kết quả
        if (container) {
            try {
                OutputAI.render(container, result, text);
            } catch (err) {
                errorLog('Lỗi render kết quả:', err);
                // Fallback render nếu OutputAI lỗi
                container.innerHTML = `
                    <div class="ask-result ask-error">
                        <div class="ask-answer">${escapeHTML(result.answer || 'Đã xảy ra lỗi.')}</div>
                    </div>
                `;
            }
        }

        return { type: 'answered' };
    },

    /**
     * Validate registry — kiểm tra tính toàn vẹn của AgentRegistry.
     *
     * @returns {{ ok: boolean, version: string, totalAgents: number, errors: string[] }}
     */
    validate() {
        const errors = [];
        if (!AgentRegistry || AgentRegistry.getAllAgentKeys().length === 0) {
            errors.push('Không có Agent nào được đăng ký.');
        }
        return {
            ok: errors.length === 0,
            version: MASTER_VERSION,
            totalAgents: AgentRegistry.getAllAgentKeys ? AgentRegistry.getAllAgentKeys().length : 0,
            errors
        };
    }
};

// ---- Alias cho backward compatibility ----
export const AIDispatcher = MasterAI;

// =====================================================================
// PHẦN 8: LOG KHỞI TẠO
// =====================================================================
if (typeof console !== 'undefined' && console.log) {
    const agentCount = AgentRegistry.getAllAgentKeys().length;
    console.log(
        `%c[MASTER] Văn Đạo MasterAI v${MASTER_VERSION} (Contemplative Omnibox) sẵn sàng. `
        + `Điều phối ${agentCount} Agent.`,
        'color: #2e8b57; font-weight: bold;'
    );
    console.log(
        `%c[TRIẾT LÝ] Không chấm điểm văn chương. Mỗi bài thơ đều có hồn, nét đẹp riêng.`,
        'color: #c9a96e; font-style: italic;'
    );
}

// =====================================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// =====================================================================
/**
 * SAU KHI DÙNG master.js v11.0.0:
 *
 * 1. Đã thay thế các tham chiếu agent:
 *    - `AgentMap['praiser']` → `AgentMap['khuc-tan-thuong']`
 *    - `AgentMap['critic']`  → `AgentMap['goi-mo']`
 *    - `AgentMap['praiser'].getQuickHighlight` → `AgentMap['khuc-tan-thuong'].getQuickComment`
 *
 * 2. Đã đổi label trong báo cáo pipeline:
 *    - "Vẻ đẹp Tán thưởng"  → "Khúc Tán Thưởng"
 *    - "Góc nhìn Phản biện" → "Lời Gợi Mở"
 *
 * 3. Đã thêm fallback graceful:
 *    - Mỗi agent call đều có try/catch riêng.
 *    - Không bao giờ crash vì 1 agent lỗi.
 *
 * 4. KHÔNG có trường điểm số trong file này.
 *
 * 5. Tương thích ngược:
 *    - Giữ nguyên signature `MasterAI.dispatch`, `MasterAI.processQuery`.
 *    - Giữ nguyên export `AIDispatcher`.
 */
