/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 3.1.0 (Unified Intelligence Network Orchestrator)
 * ==========================================================
 * CHỨC NĂNG:
 * - Điều phối (Orchestrate) dựa trên Intent (type + mode).
 * - Sử dụng AgentRegistry để tra cứu Agent phù hợp thay vì hardcode.
 * - Xử lý Fallback thông minh khi không tìm thấy Agent.
 * - Cung cấp API cho UI (processQuery) và Audit (parseIntent, dispatch).
 * 
 * TRIẾT LÝ:
 * - Master AI là "Nhạc trưởng", không phải "Người làm tất cả".
 * - Mọi quyết định định tuyến đều dựa trên AgentRegistry.
 * - Kết quả trả về phải có cấu trúc chuẩn (answer, detail, source, meta).
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { AgentRegistry } from './agent-registry.js'; // Sổ đăng ký Agent

// Import tất cả các Agent chuyên môn
import { LiteratureAgent } from './agents/literature.js';
import { PoeticsAgent } from './agents/poetics.js';
import { AnalysisAgent } from './agents/analysis.js';
import { FortuneAgent } from './agents/fortune-ai.js';
import { KnowledgeAgent } from './agents/knowledge.js';
import { HistoryAgent } from './agents/history.js'; // [MỚI] Agent Lịch sử

// =====================================================================
// 1. BẢN ĐỒ AGENT (AGENT MAP) - Ánh xạ key từ Registry sang Object thực tế
// =====================================================================
const AGENT_MAP = {
    'literature': LiteratureAgent,
    'poetics': PoeticsAgent,
    'analysis': AnalysisAgent,
    'fortune': FortuneAgent,
    'knowledge': KnowledgeAgent,
    'history': HistoryAgent // [MỚI]
};

// =====================================================================
// 2. HÀM ĐIỀU PHỐI NỘI BỘ (Internal Dispatcher)
// =====================================================================
async function internalDispatch(intent) {
    try {
        // -----------------------------------------------------------------
        // BƯỚC 1: TRA CỨU AGENT REGISTRY
        // -----------------------------------------------------------------
        const agentKey = AgentRegistry.findAgentForTask(intent.type);
        
        if (!agentKey) {
            // Fallback: Nếu không có Agent nào đăng ký task này, chuyển cho LiteratureAgent tìm kiếm
            console.warn(`[MASTER] Không tìm thấy Agent cho task: "${intent.type}". Fallback về LiteratureAgent.`);
            return await LiteratureAgent.search(intent.query);
        }

        const agent = AGENT_MAP[agentKey];
        if (!agent) {
            throw new Error(`Agent "${agentKey}" được đăng ký nhưng không tìm thấy trong AGENT_MAP.`);
        }

        // -----------------------------------------------------------------
        // BƯỚC 2: GỌI HÀM TƯƠNG ỨNG CỦA AGENT
        // -----------------------------------------------------------------
        switch (intent.type) {
            // ================= NHÓM TÁC PHẨM & TÁC GIẢ (LITERATURE) =================
            case 'summarize-work':
                return await agent.summarize(intent.query);

            case 'find-author-of':
                return await agent.findAuthor(intent.query);

            case 'recommend':
                return await agent.recommend(intent.query);
            
            case 'define-genre':
                return await agent.defineGenre(intent.query);

            // ================= NHÓM MẠNG LƯỚI (KNOWLEDGE) =================
            case 'find-related':
                return await agent.findRelated(intent.query);

            case 'find-author-info':
                return await agent.getAuthorInfo(intent.query);

            case 'list-author-works':
                return await agent.listAuthorWorks(intent.query);

            case 'explore':
                const exploreRes = await agent.exploreEntity(intent.query);
                if (exploreRes) return exploreRes;
                // Nếu không tìm thấy, rơi xuống case search
                break;

            // ================= NHÓM LỊCH SỬ (HISTORY) - [MỚI] =================
            case 'find-works-by-era':
                return await agent.findWorksByEra(intent.query);

            case 'find-authors-by-era':
                return await agent.findAuthorsByEra(intent.query);

            case 'get-historical-context':
                return await agent.getHistoricalContext(intent.query);

            // ================= NHÓM THI PHÁP & TỪ ĐIỂN (POETICS) =================
            case 'explain-symbol':
            case 'explain-allusion':
            case 'define-term':
                return await agent.explainSymbol(intent.query);

            // ================= NHÓM PHÂN TÍCH (ANALYSIS) =================
            case 'analyze-work':
                const workInfo = await LiteratureAgent.getWorkInfo(intent.query);
                if (workInfo.ok) {
                    const analysis = await agent.analyze(workInfo.record);
                    return { ...analysis, meta: [workInfo.record] };
                }
                return { 
                    answer: `Không tìm thấy tác phẩm "${intent.query}" để phân tích.`, 
                    source: 'master' 
                };

            // ================= NHÓM BÓI TOÁN (FORTUNE) =================
            case 'fortune':
                return { 
                    answer: 'Vui lòng sử dụng nút "Một bài thơ cho hôm nay" ở Trang Chủ để gieo quẻ vận khí.', 
                    source: 'master' 
                };

            // ================= NHÓM MẶC ĐỊNH (SEARCH) =================
            case 'search':
            default:
                return await agent.search(intent.query);
        }
    } catch (err) {
        console.error('[MASTER AI] Lỗi trong quá trình điều phối:', err);
        return { 
            answer: 'Hệ thống đang gặp chút trục trặc trong việc kết nối tri thức. Hãy thử lại sau giây lát.', 
            detail: `Chi tiết lỗi: ${err.message}`,
            source: 'error' 
        };
    }
}

// =====================================================================
// 3. PUBLIC API (Dành cho UI & Audit)
// =====================================================================
export const MasterAI = {
    parseIntent(input) {
        return InputAI.parseIntent(input);
    },

    async dispatch(intent) {
        return await internalDispatch(intent);
    },

    async processQuery(inputElement, container) {
        const text = inputElement.value.trim();
        if (!text) return { type: 'empty' };

        const intent = InputAI.parseIntent(text);

        // Nếu chỉ là tìm kiếm thông thường, trả quyền lại cho UI
        if (intent.type === 'search' && intent.mode === 'search') {
            return { type: 'search', query: intent.query };
        }

        // Hiển thị Loading và gọi Agent
        OutputAI.renderLoading(container);
        const result = await internalDispatch(intent);
        
        // Render kết quả ra HTML
        OutputAI.render(container, result, text);
        
        return { type: 'answered' };
    }
};

// Tương thích ngược (Legacy support)
export const AIDispatcher = MasterAI;
