/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 1.2.0 (Orchestrator)
 * ==========================================================
 * CHỨC NĂNG:
 * - Nhận câu hỏi từ người dùng.
 * - Phân tích ý định (Parse Intent).
 * - Điều phối (Dispatch) tới các Agent chuyên môn.
 * - Tổng hợp kết quả trả về cho UI.
 * ==========================================================
 */

import { extractEntity } from './core.js';
import { LiteratureAgent } from './agents/literature.js';
import { PoeticsAgent } from './agents/poetics.js';
import { AnalysisAgent } from './agents/analysis.js';
import { FortuneAgent } from './agents/fortune.js';

// ==========================================================
// 1. INTENT PARSER (Phân tích câu hỏi)
// ==========================================================
function parseIntent(input) {
    const t = (input || '').toLowerCase().trim();
    if (!t) return { type: 'empty', query: '' };

    // Cắt bỏ từ đệm
    let clean = t.replace(/^(hãy|giúp tôi|cho tôi biết|cho mình hỏi|xin hỏi|làm ơn)\s+/i, '');

    // 1. Tóm tắt
    if (/(tóm tắt|nội dung|kể lại|giới thiệu|nói về gì)/i.test(clean)) {
        const q = extractEntity(clean, [/(tóm tắt|nội dung|kể lại|giới thiệu|nói về gì|tác phẩm|bài thơ|bài|của)/gi]);
        return { type: 'summarize-work', query: q };
    }

    // 2. Tác giả
    if (/(ai|tác giả|người nào)\s+(là|viết|sáng tác|đặt tên|tạo ra|của bài|của tác phẩm)/i.test(clean)) {
        const q = extractEntity(clean, [/(ai là|ai viết|tác giả|người nào|đặt tên cho|viết|sáng tác|là người|của bài|của tác phẩm|của)/gi]);
        return { type: 'find-author-of', query: q };
    }

    // 3. Biểu tượng / Điển tích
    if (/(biểu tượng|hình ảnh|điển tích|điển cố|ý nghĩa của)/i.test(clean)) {
        const keyword = extractEntity(clean, [/(biểu tượng|hình ảnh|điển tích|điển cố|ý nghĩa của|là gì|có ý nghĩa gì|trong thơ|của từ|từ)/gi]);
        if (!keyword) return { type: 'search', query: clean }; 
        return { type: 'explain-symbol', query: keyword };
    }

    // 4. Gợi ý đọc
    if (/(gợi ý|đề xuất|tìm truyện|tìm thơ|muốn đọc)/i.test(clean)) {
        const genre = extractEntity(clean, [/(gợi ý|đề xuất|tìm truyện|tìm thơ|muốn đọc|cho tôi|về|những|tác phẩm|các)/gi]);
        return { type: 'recommend', query: genre };
    }

    // 5. Phân tích / Bình giảng (Dành cho AnalysisAgent)
    if (/(phân tích|bình giảng|cảm nhận|đánh giá)/i.test(clean)) {
        const q = extractEntity(clean, [/(phân tích|bình giảng|cảm nhận|đánh giá|tác phẩm|bài thơ|bài)/gi]);
        return { type: 'analyze-work', query: q };
    }

    // 6. Thể loại là gì
    if (/(thể loại|định nghĩa|khái niệm).*(là gì|như thế nào)/i.test(clean)) {
        const genre = extractEntity(clean, [/thể loại|là gì|như thế nào|định nghĩa|khái niệm/gi]);
        return { type: 'define-genre', query: genre };
    }

    return { type: 'search', query: input.trim() };
}

// ==========================================================
// 2. ORCHESTRATOR (Điều phối Agent)
// ==========================================================
async function dispatch(intent) {
    try {
        switch (intent.type) {
            case 'summarize-work':
                return await LiteratureAgent.summarize(intent.query);

            case 'find-author-of':
                return await LiteratureAgent.findAuthor(intent.query);

            case 'explain-symbol':
                return await PoeticsAgent.explainSymbol(intent.query);

            case 'analyze-work':
                // Có thể gọi kết hợp Literature + Analysis
                const workInfo = await LiteratureAgent.getWorkInfo(intent.query);
                if (!workInfo.ok) return workInfo;
                return await AnalysisAgent.analyze(workInfo.data);

            case 'recommend':
                return await LiteratureAgent.recommend(intent.query);

            case 'define-genre':
                return await LiteratureAgent.defineGenre(intent.query);

            case 'empty':
                return { answer: 'Vui lòng nhập câu hỏi.', source: 'system' };

            case 'search':
            default:
                return await LiteratureAgent.search(intent.query);
        }
    } catch (err) {
        console.error('[MASTER AI] Lỗi:', err);
        return { answer: 'Đã xảy ra lỗi khi xử lý câu hỏi.', source: 'error' };
    }
}

// ==========================================================
// 3. EXPORT PUBLIC API
// ==========================================================
export const MasterAI = {
    parseIntent,
    dispatch,
    
    // Hàm tiện ích cho UI gọi trực tiếp
    async ask(query) {
        const intent = this.parseIntent(query);
        return await this.dispatch(intent);
    }
};