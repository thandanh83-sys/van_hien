/**
 * ==========================================================
 * VĂN ĐẠO AI - MAIN ENTRY POINT (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 4.0.0 (Ultimate Plugin Architecture & NLP Integration)
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
// 4. CÁC CHUYÊN GIA (AGENTS) - ĐỘI NGŨ TRI THỨC (11 AI)
// =====================================================================

// 1. Chuyên gia Văn học (Tác phẩm, Tác giả, Tóm tắt, Thể loại)
export { LiteratureAgent } from './ai/agents/literature.js';

// 2. Chuyên gia Thi pháp (Từ điển, Biểu tượng, Điển tích, Hán Việt)
export { PoeticsAgent } from './ai/agents/poetics.js';

// 3. Chuyên gia Phân tích (Đọc hiểu văn bản, Tìm chủ đề, Biểu tượng)
export { AnalysisAgent, analyzeWork } from './ai/agents/analysis.js';

// 4. Chuyên gia Bói thơ (Vận khí, Nên/Tránh, Tổng hợp 4 góc nhìn)
export { 
    FortuneAgent, 
    calculateFortune, 
    getFortuneInfo, 
    synthesizeDynamicFortune 
} from './ai/agents/fortune-ai.js';

// 5. Chuyên gia Tri thức (Mạng lưới liên kết, Tiểu sử tác giả)
export { KnowledgeAgent } from './ai/agents/knowledge.js';

// 6. Chuyên gia Lịch sử (Bối cảnh lịch sử, Thời đại văn học)
export { HistoryAgent } from './ai/agents/history.js';

// 7. Chuyên gia Dịch thuật (Dịch tác phẩm, tên tác giả)
export { TranslationAgent } from './ai/agents/translation.js';

// 8. Chuyên gia Nhân vật (Tra cứu thông tin nhân vật văn học)
export { CharacterAgent } from './ai/agents/character.js';

// 9. Chuyên gia So sánh (So sánh 2 tác giả, 2 tác phẩm)
export { ComparisonAgent } from './ai/agents/comparison.js';

// 10. Chuyên gia Tán thưởng (Tìm vẻ đẹp, ca ngợi tác phẩm)
export { PraiserAgent } from './ai/agents/praiser.js';

// 11. Chuyên gia Phê bình (Chỉ ra hạn chế, thiếu sót)
export { CriticAgent } from './ai/agents/critic.js';

// =====================================================================
// 5. HẠ TẦNG DÙNG CHUNG (CORE & UTILS)
// =====================================================================

// Các hàm tiện ích, Cache, Từ điển, Bói toán, Xử lý văn bản cốt lõi
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

// Thư viện Xử lý Ngôn ngữ Tự nhiên (NLP)
// Cho phép các module khác (như search.js) dùng chung bộ lọc Teencode
export { preprocessText } from './ai/nlp-tools.js';

// Thư viện Toán học (Math Utils)
// Cung cấp thuật toán Levenshtein, Dice Coefficient cho các module khác
export { MathUtils } from './ai/math-utils.js';

// =====================================================================
// 6. TRUNG TÂM DỮ LIỆU (DATA HUB) - TRÁI TIM CỦA MẠNG LƯỚI
// =====================================================================
// DataHub: Trung tâm truy xuất dữ liệu duy nhất (Offline-First).
// UI có thể dùng trực tiếp DataHub để prefetch hoặc truy vấn nhanh.
export { DataHub } from './network/data-hub.js';

// =====================================================================
// 7. PHIÊN BẢN & METADATA (Dùng cho Audit/Debug)
// =====================================================================

export const AI_VERSION = '4.0.0';
export const AI_ARCHITECTURE = 'Unified Intelligence Network (11 Agents)';

/**
 * Hàm debug tổng hợp: In ra trạng thái của toàn bộ hệ thống AI.
 * Dùng trong Console: import { debugAI } from './ai.js'; debugAI();
 */
export async function debugAI() {
    const { AgentRegistry } = await import('./ai/agents/index.js');
    const { CoreCache, safeGetArray } = await import('./ai/core.js');
    const { DataHub } = await import('./network/data-hub.js');
    const { preprocessText } = await import('./ai/nlp-tools.js');
    const { MathUtils } = await import('./ai/math-utils.js');
    
    console.log('%c[AI SYSTEM] Trạng thái tổng quan:', 'color: #8bb8a8; font-weight: bold; font-size: 14px;');
    console.log('  • Version:', AI_VERSION);
    console.log('  • Architecture:', AI_ARCHITECTURE);
    console.log('  • Tổng số Agents:', AgentRegistry.getAllAgentKeys().length);
    console.log('  • Danh sách Agents:', AgentRegistry.getAllAgentKeys().join(', '));
    console.log('  • Core Cache:', CoreCache.stats());
    console.log('  • DataHub Test:', DataHub.getMetadata('truyen-kieu') ? 'Sẵn sàng' : 'Chưa kết nối');
    console.log('  • Tác phẩm:', safeGetArray('WORKS_DATA').length);
    console.log('  • Tác giả:', safeGetArray('AUTHOR_DATA').length);
    
    // Test nhanh NLP & Math
    console.log('  • NLP Test (Teencode):', preprocessText("tg cua tp truyen keu la ai"));
    console.log('  • Math Test (Levenshtein "keu" vs "kieu"):', MathUtils.levenshteinDistance('keu', 'kieu'));
}
