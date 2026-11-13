/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 1.3.0 (Mode-Aware & Intent Router)
 * ==========================================================
 * CHỨC NĂNG:
 * - Điều phối (Orchestrate) dựa trên Intent (type + mode).
 * - Xử lý Fallback thông minh cho các Agent chưa được xây dựng.
 * - Cung cấp API cho UI (processQuery) và Audit (parseIntent, dispatch).
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { LiteratureAgent } from './agents/literature.js';
import { PoeticsAgent } from './agents/poetics.js';
import { AnalysisAgent } from './agents/analysis.js';
import { FortuneAgent } from './agents/fortune-ai.js';

// ==========================================================
// 1. HÀM ĐIỀU PHỐI NỘI BỘ (Internal Dispatcher)
// ==========================================================
async function internalDispatch(intent) {
    try {
        switch (intent.type) {
            // ================= NHÓM TÁC PHẨM & TÁC GIẢ =================
            case 'summarize-work':
                return await LiteratureAgent.summarize(intent.query);

            case 'find-author-of':
                return await LiteratureAgent.findAuthor(intent.query);

            case 'recommend':
                return await LiteratureAgent.recommend(intent.query);

            case 'find-author-info':
                // Fallback: Tạm dùng chức năng tìm tác giả
                return await LiteratureAgent.findAuthor(intent.query);

            case 'compare-works':
            case 'list':
                // Fallback: Tạm dùng chức năng search nếu chưa có Agent So sánh
                return await LiteratureAgent.search(intent.query);

            // ================= NHÓM THI PHÁP & TỪ ĐIỂN =================
            case 'explain-symbol':
            case 'explain-allusion': // Gộp chung vào xử lý biểu tượng
            case 'define-term':      // Gộp chung vào xử lý biểu tượng
                return await PoeticsAgent.explainSymbol(intent.query);

            case 'define-genre':
                return await LiteratureAgent.defineGenre(intent.query);

            // ================= NHÓM PHÂN TÍCH VĂN HỌC =================
            case 'analyze-work':
                const workInfo = await LiteratureAgent.getWorkInfo(intent.query);
                if (workInfo.ok) {
                    const analysis = await AnalysisAgent.analyze(workInfo.data);
                    return { ...analysis, meta: [workInfo.data] };
                }
                return workInfo; // Trả về lỗi nếu không tìm thấy

            // ================= NHÓM BÓI TOÁN =================
            case 'fortune':
                return { 
                    answer: 'Vui lòng sử dụng nút "Một bài thơ cho hôm nay" ở Trang Chủ để gieo quẻ vận khí.', 
                    source: 'master' 
                };

            // ================= NHÓM MẶC ĐỊNH (SEARCH) =================
            case 'search':
            default:
                // Nếu là câu hỏi (mode = question) nhưng chưa có Agent chuyên biệt,
                // ta chuyển sang cho LiteratureAgent tìm kiếm.
                return await LiteratureAgent.search(intent.query);
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
// 2. PUBLIC API (Dành cho UI & Audit)
// ==========================================================
export const MasterAI = {
    /**
     * Dùng cho Audit.js test
     */
    parseIntent(input) {
        return InputAI.parseIntent(input);
    },

    /**
     * Dùng cho Audit.js test
     */
    async dispatch(intent) {
        return await internalDispatch(intent);
    },

    /**
     * Dùng cho UI (ask-dao.js) khi người dùng nhấn Enter
     */
    async processQuery(inputElement, container) {
        const text = inputElement.value.trim();
        if (!text) return { type: 'empty' };

        // 1. Phân tích ý định
        const intent = InputAI.parseIntent(text);

        // [ĐIỀU KIỆN QUAN TRỌNG]
        // Nếu Type là 'search' VÀ Mode là 'search' (Người dùng chỉ gõ từ khóa)
        // -> Trả quyền lại cho UI để chạy hàm searchEncyclopedia bình thường
        if (intent.type === 'search' && intent.mode === 'search') {
            return { type: 'search', query: intent.query };
        }

        // 2. Nếu là câu hỏi (mode = question) hoặc lệnh (mode = command)
        // -> Hiển thị Loading và gọi Agent
        OutputAI.renderLoading(container);

        const result = await internalDispatch(intent);
        
        // 3. Render kết quả ra HTML
        OutputAI.render(container, result, text);
        
        return { type: 'answered' };
    }
};

// Tương thích ngược
export const AIDispatcher = MasterAI;