/**
 * ==========================================================
 * VĂN ĐẠO AI - MAIN ENTRY POINT (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 1.2.0 (Multi-Agent Facade)
 * ==========================================================
 * CHỨC NĂNG:
 * - Đóng vai trò là "Cổng giao tiếp" duy nhất cho toàn bộ hệ thống AI.
 * - Xuất (export) các hàm cần thiết từ kiến trúc Multi-Agent (thư mục ai/).
 * - Giúp các file bên ngoài (main.js, ask-dao.js) không cần biết 
 *   cấu trúc thư mục phức tạp bên trong.
 * ==========================================================
 */

// 1. Xuất Bộ điều phối trung tâm (Master AI)
export { MasterAI, AIDispatcher } from './ai/master.js';

// 2. Xuất Bộ nhận diện câu hỏi (Input AI)
export { InputAI } from './ai/input-ai.js';

// 3. Xuất Bộ định dạng (Output AI)
export { OutputAI } from './ai/output-ai.js';

// 4. Xuất các hàm phân tích (Tương thích ngược cho main.js)
export { AnalysisAgent, analyzeWork } from './ai/agents/analysis.js';

// 5. Xuất các hàm Bói thơ (Tương thích ngược cho main.js)
export { 
    FortuneAgent, 
    calculateFortune, 
    getFortuneInfo, 
    synthesizeDynamicFortune 
} from './ai/agents/fortune-ai.js';