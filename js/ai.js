/**
 * ==========================================================
 * VĂN ĐẠO AI - MAIN ENTRY POINT (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 3.3.0 (Plugin Architecture & NLP Integration)
 * ==========================================================
 * CHỨC NĂNG:
 * - Đóng vai trò là "Cổng giao tiếp" (Facade) duy nhất cho toàn bộ AI.
 * - Gom tất cả các module AI và Network xuất ra ngoài.
 * - main.js và ask-dao.js chỉ cần import từ file này.
 * 
 * TRIẾT LÝ:
 * - Một cửa ngõ, một đầu mối.
 * - DataHub là trung tâm dữ liệu (Offline-First).
 * - AgentRegistry (nằm trong agents/index.js) là sổ đăng ký AI.
 * ==========================================================
 */

// =====================================================================
// 1. BỘ ĐIỀU PHỐI TRUNG TÂM (MASTER AI)
// =====================================================================

// Master AI (Nhạc trưởng điều phối toàn bộ Agent dựa trên AgentRegistry)
export { MasterAI, AIDispatcher } from './ai/master.js';

// =====================================================================
// 2. BỘ XỬ LÝ ĐẦU VÀO & ĐẦU RA (INPUT/OUTPUT AI)
// =====================================================================

// Input AI (Nhận diện câu hỏi, phân tích mode/type, trích xuất entity)
export { InputAI } from './ai/input-ai.js';

// Output AI (Định dạng câu trả lời thành HTML, render meta buttons)
export { OutputAI } from './ai/output-ai.js';

// =====================================================================
// 3. SỔ ĐĂNG KÝ AGENT (AGENT REGISTRY & AGENT MAP)
// =====================================================================
// [QUAN TRỌNG] File index.js trong thư mục agents/ là "Bảng điều khiển"
// trung tâm. Nó chứa cả AgentMap (bản đồ thực thể) và AgentRegistry
// (sổ đăng ký năng lực). Chỉ cần sửa file này khi thêm/bớt AI.

export { AgentRegistry, AgentMap } from './ai/agents/index.js';

// =====================================================================
// 4. CÁC CHUYÊN GIA (AGENTS) - ĐỘI NGŨ TRI THỨC
// =====================================================================
// (Export trực tiếp từng Agent để tiện import ở nơi khác nếu cần)

// Chuyên gia Văn học (Tác phẩm, Tác giả, Tóm tắt, Thể loại)
export { LiteratureAgent } from './ai/agents/literature.js';

// Chuyên gia Thi pháp (Từ điển, Biểu tượng, Điển tích, Hán Việt)
export { PoeticsAgent } from './ai/agents/poetics.js';

// Chuyên gia Phân tích (Đọc hiểu văn bản, Tìm chủ đề, Biểu tượng)
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

// Chuyên gia Mạng lưới (Tác phẩm liên quan, Tiểu sử tác giả, Danh sách tác phẩm)
export { KnowledgeAgent } from './ai/agents/knowledge.js';

// Chuyên gia Lịch sử (Bối cảnh lịch sử, Tác phẩm/Tác giả theo thời kỳ)
export { HistoryAgent } from './ai/agents/history.js';

// =====================================================================
// 5. HẠ TẦNG DÙNG CHUNG (CORE)
// =====================================================================
// Cache, Từ điển, Bói toán, Xử lý văn bản, Hằng số

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
// 6. THƯ VIỆN XỬ LÝ NGÔN NGỮ TỰ NHIÊN (NLP TOOLS)
// =====================================================================
// [MỚI] Cung cấp hàm tiền xử lý văn bản (Bỏ dấu, sửa teencode, sửa lỗi chính tả).
// Giúp các module khác (như search.js) có thể tái sử dụng nếu cần.

export { preprocessText } from './ai/nlp-tools.js';

// =====================================================================
// 7. TRUNG TÂM DỮ LIỆU (DATA HUB) - TRÁI TIM CỦA MẠNG LƯỚI
// =====================================================================
// DataHub: Trung tâm truy xuất dữ liệu duy nhất (Offline-First).
// UI có thể dùng trực tiếp DataHub để prefetch hoặc truy vấn nhanh.

export { DataHub } from './network/data-hub.js';

// =====================================================================
// 8. PHIÊN BẢN & METADATA (Dùng cho Audit/Debug)
// =====================================================================

export const AI_VERSION = '3.3.0';
export const AI_ARCHITECTURE = 'Unified Intelligence Network (Plugin & NLP)';

/**
 * Hàm debug tổng hợp: In ra trạng thái của toàn bộ hệ thống AI.
 * Dùng trong Console: import { debugAI } from './ai.js'; debugAI();
 */
export async function debugAI() {
    const { AgentRegistry } = await import('./ai/agents/index.js');
    const { CoreCache, safeGetArray } = await import('./ai/core.js');
    const { DataHub } = await import('./network/data-hub.js');
    const { preprocessText } = await import('./ai/nlp-tools.js');
    
    console.log('%c[AI SYSTEM] Trạng thái tổng quan:', 'color: #8bb8a8; font-weight: bold; font-size: 14px;');
    console.log('  • Version:', AI_VERSION);
    console.log('  • Architecture:', AI_ARCHITECTURE);
    console.log('  • Agents đã đăng ký:', AgentRegistry.getAllAgentKeys());
    console.log('  • Core Cache:', CoreCache.stats());
    console.log('  • DataHub Test:', DataHub.getMetadata('truyen-kieu') ? 'Sẵn sàng' : 'Chưa kết nối');
    console.log('  • Tác phẩm:', safeGetArray('WORKS_DATA').length);
    console.log('  • Tác giả:', safeGetArray('AUTHOR_DATA').length);
    
    // Test nhanh NLP
    console.log('  • NLP Test (Teencode):', preprocessText("tg cua tp truyen keu la ai"));
}
