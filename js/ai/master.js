/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 2.0.0 (Knowledge Network Orchestrator)
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
import { KnowledgeAgent } from './agents/knowledge.js'; // [MỚI] Chuyên gia Mạng lưới

// ==========================================================
// 1. HÀM ĐIỀU PHỐI NỘI BỘ (Internal Dispatcher)
// ==========================================================
async function internalDispatch(intent) {
    try {
        switch (intent.type) {
            // ================= NHÓM TÁC PHẨM & TÁC GIẢ (LITERATURE AGENT) =================
            case 'summarize-work':
                return await LiteratureAgent.summarize(intent.query);

            case 'find-author-of':
                return await LiteratureAgent.findAuthor(intent.query);

            case 'recommend':
                return await LiteratureAgent.recommend(intent.query);
            
            case 'define-genre':
                return await LiteratureAgent.defineGenre(intent.query);

            // ================= NHÓM MẠNG LƯỚI (KNOWLEDGE AGENT) =================
            case 'find-related':
                return await KnowledgeAgent.findRelated(intent.query);

            case 'find-author-info':
                return await KnowledgeAgent.getAuthorInfo(intent.query);

            case 'list-author-works':
                return await KnowledgeAgent.listAuthorWorks(intent.query);

            // Fallback: Khám phá toàn cảnh mạng lưới
            case 'explore':
                const exploreRes = await KnowledgeAgent.exploreEntity(intent.query);
                if (exploreRes) return exploreRes;
                // Nếu không tìm thấy, rơi xuống case search
                break;

            // ================= NHÓM THI PHÁP & TỪ ĐIỂN (POETICS AGENT) =================
            case 'explain-symbol':
            case 'explain-allusion':
            case 'define-term':
                return await PoeticsAgent.explainSymbol(intent.query);

            // ================= NHÓM PHÂN TÍCH VĂN HỌC (ANALYSIS AGENT) =================
            case 'analyze-work':
                const workInfo = await LiteratureAgent.getWorkInfo(intent.query);
                if (workInfo.ok) {
                    const analysis = await AnalysisAgent.analyze(workInfo.record);
                    return { ...analysis, meta: [workInfo.record] };
                }
                return { 
                    answer: `Không tìm thấy tác phẩm "${intent.query}" để phân tích.`, 
                    source: 'master' 
                };

            // ================= NHÓM BÓI TOÁN (FORTUNE AGENT) =================
            case 'fortune':
                return { 
                    answer: 'Vui lòng sử dụng nút "Một bài thơ cho hôm nay" ở Trang Chủ để gieo quẻ vận khí.', 
                    source: 'master' 
                };

            // ================= NHÓM MẶC ĐỊNH (SEARCH) =================
            case 'search':
            default:
                // Nếu là câu hỏi nhưng chưa có Agent chuyên biệt,
                // chuyển sang cho LiteratureAgent tìm kiếm.
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
