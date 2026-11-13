/**
 * ==========================================================
 * VĂN ĐẠO AI - MAIN ENTRY POINT (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 1.3.3 (Multi-Agent Facade)
 * ==========================================================
 * CHỨC NĂNG:
 * - Đóng vai trò là "Cổng giao tiếp" (Facade) duy nhất cho toàn bộ AI.
 * - Gom tất cả các module từ thư mục 'js/ai/' và xuất ra ngoài.
 * - Giúp main.js và ask-dao.js không cần quan tâm đến cấu trúc thư mục.
 * ==========================================================
 */

// =====================================================================
// 1. BỘ ĐIỀU PHỐI TRUNG TÂM & INPUT/OUTPUT
// =====================================================================

// Master AI (Nhạc trưởng điều phối)
export { MasterAI, AIDispatcher } from './ai/master.js';

// Input AI (Nhận diện câu hỏi, phân tích mode/type)
export { InputAI } from './ai/input-ai.js';

// Output AI (Định dạng câu trả lời thành HTML)
export { OutputAI } from './ai/output-ai.js';

// =====================================================================
// 2. CÁC CHUYÊN GIA (AGENTS)
// =====================================================================

// Chuyên gia Văn học (Tìm tác phẩm, tác giả, tóm tắt)
export { LiteratureAgent } from './ai/agents/literature.js';

// Chuyên gia Thi pháp (Tra từ điển, biểu tượng, điển tích)
export { PoeticsAgent } from './ai/agents/poetics.js';

// Chuyên gia Phân tích (Đọc hiểu văn bản)
export { AnalysisAgent, analyzeWork } from './ai/agents/analysis.js';

// Chuyên gia Bói thơ (Vận khí, Nên/Tránh)
export { 
    FortuneAgent, 
    calculateFortune, 
    getFortuneInfo, 
    synthesizeDynamicFortune 
} from './ai/agents/fortune-ai.js';

// Chuyên gia Tán thưởng (Tìm vẻ đẹp, ca ngợi)
export { PraiserAgent } from './ai/agents/praiser.js';

// Chuyên gia Phê bình (Chỉ ra hạn chế, thiếu sót)
export { CriticAgent } from './ai/agents/critic.js';

// =====================================================================
// 3. HẠ TẦNG DÙNG CHUNG (CORE)
// =====================================================================

// Các hàm tiện ích, Cache, Từ điển dùng chung
export { 
    CoreCache, 
    getDictionaryIndex, 
    FORTUNE_LEVELS, 
    FORTUNE_MAP, 
    countWeightedMatches,
    debugCore 
} from './ai/core.js';