/**
 * ==========================================================
 * VĂN ĐẠO AI - MAIN ENTRY POINT (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 2.0.0 (DataHub Integration & Knowledge Network)
 * ==========================================================
 * CHỨC NĂNG:
 * - Đóng vai trò là "Cổng giao tiếp" (Facade) duy nhất cho toàn bộ AI.
 * - Gom tất cả các module từ thư mục 'js/ai/' và 'js/network/' xuất ra ngoài.
 * - Giúp main.js và ask-dao.js không cần quan tâm đến cấu trúc thư mục.
 * 
 * TRIẾT LÝ:
 * - Mọi AI giao tiếp qua ID.
 * - DataHub là trung tâm truy xuất dữ liệu (Offline-First).
 * - Không AI nào được phép tự ý fetch JSON.
 * ==========================================================
 */

// =====================================================================
// 1. BỘ ĐIỀU PHỐI TRUNG TÂM (MASTER AI)
// =====================================================================

// Master AI (Nhạc trưởng điều phối toàn bộ Agent)
export { MasterAI, AIDispatcher } from './ai/master.js';

// =====================================================================
// 2. BỘ XỬ LÝ ĐẦU VÀO & ĐẦU RA (INPUT/OUTPUT AI)
// =====================================================================

// Input AI (Nhận diện câu hỏi, phân tích mode/type, trích xuất entity)
export { InputAI } from './ai/input-ai.js';

// Output AI (Định dạng câu trả lời thành HTML, render meta buttons)
export { OutputAI } from './ai/output-ai.js';

// =====================================================================
// 3. CÁC CHUYÊN GIA (AGENTS) - ĐỘI NGŨ TRI THỨC
// =====================================================================

// Chuyên gia Văn học (Tìm tác phẩm, tác giả, tóm tắt, thể loại)
export { LiteratureAgent } from './ai/agents/literature.js';

// Chuyên gia Thi pháp (Tra từ điển biểu tượng, điển tích, Hán Việt)
export { PoeticsAgent } from './ai/agents/poetics.js';

// Chuyên gia Phân tích (Đọc hiểu văn bản, tìm chủ đề, biểu tượng)
export { AnalysisAgent, analyzeWork } from './ai/agents/analysis.js';

// Chuyên gia Bói thơ (Vận khí, Nên/Tránh, Tổng hợp 4 góc nhìn)
export { 
    FortuneAgent, 
    calculateFortune, 
    getFortuneInfo, 
    synthesizeDynamicFortune 
} from './ai/agents/fortune-ai.js';

// Chuyên gia Tán thưởng (Tìm vẻ đẹp, ca ngợi tác phẩm)
export { PraiserAgent } from './ai/agents/praiser.js';

// Chuyên gia Phê bình (Chỉ ra hạn chế, thiếu sót)
export { CriticAgent } from './ai/agents/critic.js';

// [MỚI] Chuyên gia Mạng lưới (Tác phẩm liên quan, Tiểu sử tác giả, Danh sách tác phẩm)
export { KnowledgeAgent } from './ai/agents/knowledge.js';

// =====================================================================
// 4. HẠ TẦNG DÙNG CHUNG (CORE)
// =====================================================================

// Các hàm tiện ích, Cache, Từ điển, Bói toán, Xử lý văn bản
export { 
    CoreCache, 
    getDictionaryIndex, 
    invalidateDictionaryIndex,
    FORTUNE_LEVELS, 
    FORTUNE_MAP, 
    countWeightedMatches,
    extractEntity,
    resolveAndFetch,
    safeGetArray,
    safeGetObject,
    debugCore 
} from './ai/core.js';

// =====================================================================
// 5. TRUNG TÂM DỮ LIỆU (DATA HUB) - TRÁI TIM CỦA MẠNG LƯỚI
// =====================================================================

// DataHub: Quản lý toàn bộ truy xuất dữ liệu (Offline-First)
// UI có thể dùng trực tiếp DataHub để prefetch hoặc truy vấn nhanh.
export { DataHub } from './network/data-hub.js';

// =====================================================================
// 6. PHIÊN BẢN & METADATA (Dùng cho Audit/Debug)
// =====================================================================

export const AI_VERSION = '2.0.0';
export const AI_ARCHITECTURE = 'Knowledge Network (ID-Centric)';
