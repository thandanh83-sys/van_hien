/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Vị trí: js/ai/master.js
 * Version: 4.0.0 (Plugin Architecture & Result Adapter)
 * ==========================================================
 * CHỨC NĂNG:
 * - Điều phối (Orchestrate) dựa trên Intent (type + mode).
 * - Sử dụng AgentRegistry để tra cứu Agent phù hợp.
 * - [MỚI] Xử lý chuyển đổi kết quả (Adapter) cho các Agent đặc biệt.
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { AgentMap, AgentRegistry } from './agents/index.js';

// =====================================================================
// 1. HÀM ĐIỀU PHỐI NỘI BỘ (Internal Dispatcher)
// =====================================================================
async function internalDispatch(intent) {
    try {
        const agentKey = AgentRegistry.findAgentForTask(intent.type);
        
        if (!agentKey) {
            console.warn(`[MASTER] Không tìm thấy Agent cho task: "${intent.type}". Fallback về LiteratureAgent.`);
            return await AgentMap['literature'].search(intent.query);
        }

        const agentInstance = AgentMap[agentKey];
        const methodName = AgentRegistry.getMethodName(agentKey, intent.type);

        if (!agentInstance) {
            throw new Error(`Agent "${agentKey}" được đăng ký nhưng không tìm thấy trong AgentMap.`);
        }

        if (!methodName || typeof agentInstance[methodName] !== 'function') {
            throw new Error(`Agent "${agentKey}" không có hàm "${methodName}".`);
        }

        console.log(`[MASTER] Điều phối "${intent.type}" đến ${agentKey}.${methodName}()`);
        
        // [QUAN TRỌNG] Gọi hàm và nhận kết quả thô
        const rawResult = await agentInstance[methodName](intent.query);

        // [SỬA LỖI] Chuyển đổi kết quả của Praiser và Critic sang chuẩn OutputAI
        // Vì Praiser/Critic trả về { theme, symbol, commentary }, 
        // còn OutputAI cần { answer, detail, source, meta }
        if (agentKey === 'praiser' || agentKey === 'critic') {
            return {
                answer: rawResult.commentary,
                detail: `Chủ đề: ${rawResult.theme} | Hình ảnh: ${rawResult.symbol}`,
                source: agentKey,
                meta: []
            };
        }

        return rawResult;

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
// 2. PUBLIC API
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

        if (intent.type === 'search' && intent.mode === 'search') {
            return { type: 'search', query: intent.query };
        }

        OutputAI.renderLoading(container);

        const result = await internalDispatch(intent);
        
        OutputAI.render(container, result, text);
        
        return { type: 'answered' };
    }
};

// Tương thích ngược
export const AIDispatcher = MasterAI;
