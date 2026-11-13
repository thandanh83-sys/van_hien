/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 1.2.1 (Orchestrator & Audit-Ready)
 * ==========================================================
 * CHỨC NĂNG:
 * - Nhận câu hỏi từ người dùng qua `processQuery` (Dành cho UI).
 * - Phân tích ý định (Dựa trên Input AI).
 * - Điều phối (Dispatch) tới các Agent chuyên môn.
 * - Expose `parseIntent` và `dispatch` (Dành cho Bác Sĩ audit.js test).
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { LiteratureAgent } from './agents/literature.js';
import { PoeticsAgent } from './agents/poetics.js';
import { AnalysisAgent } from './agents/analysis.js';
import { FortuneAgent } from './agents/fortune-ai.js';

// ==========================================================
// 1. HÀM ĐIỀU PHỐI NỘI BỘ (Dùng chung cho UI và Audit)
// ==========================================================
async function internalDispatch(intent) {
    try {
        switch (intent.type) {
            case 'summarize-work':
                return await LiteratureAgent.summarize(intent.query);

            case 'find-author-of':
                return await LiteratureAgent.findAuthor(intent.query);

            case 'explain-symbol':
                return await PoeticsAgent.explainSymbol(intent.query);

            case 'recommend':
                return await LiteratureAgent.recommend(intent.query);

            case 'define-genre':
                return await LiteratureAgent.defineGenre(intent.query);

            case 'analyze-work':
                // Gọi Literature Agent lấy dữ liệu thô
                const workInfo = await LiteratureAgent.getWorkInfo(intent.query);
                if (workInfo.ok) {
                    // Đưa dữ liệu thô cho Analysis Agent phân tích
                    const analysis = await AnalysisAgent.analyze(workInfo.data);
                    return { ...analysis, meta: [workInfo.data] };
                }
                return workInfo; // Trả về lỗi nếu không tìm thấy tác phẩm

            case 'fortune':
                return { 
                    answer: 'Vui lòng sử dụng nút "Một bài thơ cho hôm nay" ở Trang Chủ để gieo quẻ vận khí.', 
                    source: 'master' 
                };

            default:
                return { 
                    answer: 'Tôi chưa hiểu ý bạn. Vui lòng thử lại với câu hỏi khác.', 
                    source: 'master' 
                };
        }
    } catch (err) {
        console.error('[MASTER AI] Lỗi trong quá trình xử lý:', err);
        return { 
            answer: 'Đã xảy ra lỗi khi kết nối với chuyên gia. Hãy thử lại sau.', 
            source: 'error' 
        };
    }
}

// ==========================================================
// 2. PUBLIC API (Dành cho UI, Audit và các Module khác)
// ==========================================================
export const MasterAI = {
    /**
     * Phân tích câu hỏi (Wrapper của Input AI)
     * - Dùng cho audit.js test nhận diện Intent
     */
    parseIntent(input) {
        return InputAI.parseIntent(input);
    },

    /**
     * Xử lý logic AI (Wrapper của internalDispatch)
     * - Dùng cho audit.js test kết quả trả về của Agent
     */
    async dispatch(intent) {
        return await internalDispatch(intent);
    },

    /**
     * Xử lý toàn diện cho UI (Input -> Dispatch -> Output)
     * - Dùng cho ask-dao.js khi người dùng nhấn Enter
     */
    async processQuery(inputElement, container) {
        const text = inputElement.value.trim();
        if (!text) return { type: 'empty' };

        // 1. Phân tích ý định
        const intent = InputAI.parseIntent(text);

        // Nếu là tìm kiếm thông thường, Master nhường quyền lại cho UI
        if (intent.type === 'search') {
            return { type: 'search', query: intent.query };
        }

        // 2. Hiển thị Loading
        OutputAI.renderLoading(container);

        // 3. Điều phối Agent xử lý
        const result = await internalDispatch(intent);

        // 4. Render kết quả ra màn hình
        OutputAI.render(container, result, text);
        
        return { type: 'answered' };
    }
};

// Tương thích ngược: Giữ tên AIDispatcher cho các file cũ (ask-dao.js) đang gọi
export const AIDispatcher = MasterAI;