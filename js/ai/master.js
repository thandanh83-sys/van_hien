/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 3.2.0 (Plugin Architecture)
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
// [QUAN TRỌNG] Import từ file index.js duy nhất của thư mục agents
import { AgentMap, AgentRegistry } from './agents/index.js';

// =====================================================================
// 1. HÀM ĐIỀU PHỐI NỘI BỘ (Internal Dispatcher)
// =====================================================================
async function internalDispatch(intent) {
    try {
        // -----------------------------------------------------------------
        // BƯỚC 1: TRA CỨU AGENT REGISTRY
        // Tìm xem Agent nào có khả năng thực hiện task này.
        // -----------------------------------------------------------------
        const agentKey = AgentRegistry.findAgentForTask(intent.type);
        
        if (!agentKey) {
            // Fallback: Nếu không có Agent nào đăng ký task này, chuyển cho LiteratureAgent tìm kiếm
            console.warn(`[MASTER] Không tìm thấy Agent cho task: "${intent.type}". Fallback về LiteratureAgent.`);
            return await AgentMap['literature'].search(intent.query);
        }

        // -----------------------------------------------------------------
        // BƯỚC 2: LẤY INSTANCE VÀ TÊN HÀM
        // -----------------------------------------------------------------
        const agentInstance = AgentMap[agentKey];
        const methodName = AgentRegistry.getMethodName(agentKey, intent.type);

        if (!agentInstance) {
            throw new Error(`Agent "${agentKey}" được đăng ký nhưng không tìm thấy trong AgentMap.`);
        }

        if (!methodName || typeof agentInstance[methodName] !== 'function') {
            throw new Error(`Agent "${agentKey}" không có hàm "${methodName}".`);
        }

        // -----------------------------------------------------------------
        // BƯỚC 3: GỌI HÀM ĐỘNG (Dynamic Method Call)
        // Không cần switch/case. Gọi thẳng hàm dựa trên tên.
        // -----------------------------------------------------------------
        console.log(`[MASTER] Điều phối "${intent.type}" đến ${agentKey}.${methodName}()`);
        return await agentInstance[methodName](intent.query);

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
// 2. PUBLIC API (Dành cho UI & Audit)
// =====================================================================
export const MasterAI = {
    /**
     * Phân tích câu hỏi (Dùng cho Audit hoặc Debug)
     */
    parseIntent(input) {
        return InputAI.parseIntent(input);
    },

    /**
     * Thực thi một Intent (Dùng cho Audit hoặc gọi trực tiếp)
     */
    async dispatch(intent) {
        return await internalDispatch(intent);
    },

    /**
     * [API CHÍNH] Xử lý câu hỏi từ người dùng (Dùng cho UI ask-dao.js)
     * Tự động phân tích, hiển thị loading, gọi Agent và render kết quả.
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

// Tương thích ngược (Legacy support)
export const AIDispatcher = MasterAI;
