/**
 * ==========================================================
 * VĂN ĐẠO — MAIN ENTRY POINT (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 5.0.0 (Contemplative Facade — No Scoring)
 * ==========================================================
 *
 * CHỨC NĂNG:
 * - Đóng vai trò là "Cổng giao tiếp" (Facade) duy nhất cho toàn bộ AI.
 * - Gom tất cả các module AI và Network xuất ra ngoài.
 * - main.js và ask-dao.js chỉ cần import từ file này.
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. MỘT CỬA NGÕ DUY NHẤT (Single Entry Point):
 *    Mọi module AI (agents, engines, utils) đều được export qua
 *    file này. Bên ngoài chỉ cần `import { ... } from './ai.js'`,
 *    không cần biết cấu trúc thư mục bên trong.
 *
 * 2. KHÔNG CHẤM ĐIỂM VĂN CHƯƠNG (v5.0.0):
 *    - Đã BỎ export `PraiserAgent` và `CriticAgent`.
 *    - Đã THÊM export `KhucTanThuongAgent` và `GoiMoAgent`.
 *    - Tổng số agent export vẫn là 11.
 *
 * 3. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
 *    - Tất cả export cũ (trừ praiser/critic) vẫn giữ nguyên.
 *    - `analyzeWork`, `calculateFortune`, `synthesizeDynamicFortune`
 *      vẫn export như cũ.
 *
 * 4. PHÂN TẦNG RÕ RÀNG (Layered Exports):
 *    - Tầng 1: Core (MasterAI, InputAI, OutputAI)
 *    - Tầng 2: Registry (AgentRegistry, AgentMap)
 *    - Tầng 3: Agents (11 agents)
 *    - Tầng 4: Core Utils (CoreCache, Fortune constants)
 *    - Tầng 5: Engines (LiteraryEngine, MemoryEngine, Identity...)
 *    - Tầng 6: Network (DataHub)
 *    - Tầng 7: Metadata (version, architecture)
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v4.3.0: Living Intelligence Network.
 * - v5.0.0: Contemplative Facade.
 *   - [BỎ] export PraiserAgent, CriticAgent.
 *   - [THÊM] export KhucTanThuongAgent, GoiMoAgent.
 *   - [THÊM] export ContemplativeEngine, InsightValidator.
 *   - Cập nhật AI_VERSION và AI_ARCHITECTURE.
 *
 * ==========================================================
 */

// =====================================================================
// 1. BỘ ĐIỀU PHỐI TRUNG TÂM (MASTER AI)
// =====================================================================
export { MasterAI, AIDispatcher } from './ai/master.js';

// =====================================================================
// 2. BỘ XỬ LÝ ĐẦU VÀO & ĐẦU RA (INPUT/OUTPUT AI)
// =====================================================================
export { InputAI } from './ai/input-ai.js';
export { OutputAI } from './ai/output-ai.js';

// =====================================================================
// 3. SỔ ĐĂNG KÝ AGENT (AGENT REGISTRY & AGENT MAP)
// =====================================================================
export { AgentRegistry, AgentMap } from './ai/agents/index.js';

// =====================================================================
// 4. CÁC CHUYÊN GIA (AGENTS) — ĐỘI NGŨ TRI THỨC (11 AI)
// =====================================================================
// LƯU Ý v5.0.0: Đã THAY THẾ praiser.js → khuc-tan-thuong.js,
//              đã THAY THẾ critic.js → goi-mo.js.
// =====================================================================

// ---- Nhóm Văn học & Tri thức ----
export { LiteratureAgent }  from './ai/agents/literature.js';
export { PoeticsAgent }     from './ai/agents/poetics.js';
export { KnowledgeAgent }   from './ai/agents/knowledge.js';
export { HistoryAgent }     from './ai/agents/history.js';

// ---- Nhóm Phân tích & Cảm thụ ----
export { AnalysisAgent, analyzeWork } from './ai/agents/analysis.js';
export { KhucTanThuongAgent } from './ai/agents/khuc-tan-thuong.js';  // [NEW] Thay PraiserAgent
export { GoiMoAgent }         from './ai/agents/goi-mo.js';           // [NEW] Thay CriticAgent

// ---- Nhóm Thực thể & So sánh ----
export { CharacterAgent }   from './ai/agents/character.js';
export { ComparisonAgent }  from './ai/agents/comparison.js';
export { TranslationAgent } from './ai/agents/translation.js';

// ---- Nhóm Vận khí ----
export {
    FortuneAgent,
    calculateFortune,
    getFortuneInfo,
    synthesizeDynamicFortune
} from './ai/agents/fortune.js';

// =====================================================================
// 5. HẠ TẦNG DÙNG CHUNG (CORE & UTILS)
// =====================================================================
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

export { preprocessText } from './ai/nlp-tools.js';
export { MathUtils } from './ai/math-utils.js';

// =====================================================================
// 6. CÁC ENGINE MỚI (BỘ NHỚ, SUY LUẬN, BẢN SẮC, CHIÊM NGHIỆM)
// =====================================================================
export { LiteraryEngine } from './ai/literary-engine.js';
export { MemoryEngine } from './ai/memory-engine.js';
export { Identity } from './ai/identity.js';
export { DialogueEngine } from './ai/dialogue-engine.js';
export { SmartInputParser } from './ai/smart-input-parser.js';

// ---- [v5.0.0 — NEW] Contemplative Engine ----
export { ContemplativeEngine } from './ai/contemplative-engine.js';

// ---- [v5.0.0 — NEW] Insight Validator ----
export { InsightValidator } from './ai/validators/insight-validator.js';

// =====================================================================
// 7. TRUNG TÂM DỮ LIỆU (DATA HUB) — TRÁI TIM CỦA MẠNG LƯỚI
// =====================================================================
export { DataHub } from './network/data-hub.js';

// =====================================================================
// 8. PHIÊN BẢN & METADATA (Dùng cho Audit/Debug)
// =====================================================================
export const AI_VERSION = '5.0.0';
export const AI_ARCHITECTURE = 'Contemplative Intelligence Network (11 Agents — No Scoring)';

// =====================================================================
// 9. TRIẾT LÝ (Dùng cho Audit/Console)
// =====================================================================
export const AI_PHILOSOPHY = Object.freeze({
    core: 'Không chấm điểm văn chương. Mỗi bài thơ đều có hồn, nét đẹp riêng.',
    role: 'Ta — Bạn, cùng chiêm nghiệm. Không phán xét, không xếp hạng.',
    rule: 'Chỉ chiêm nghiệm, gợi mở, tôn vinh. Không bao giờ chấm điểm.'
});

// =====================================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// =====================================================================
/**
 * SAU KHI DÙNG ai.js v5.0.0, CÁC FILE SAU CẦN ĐƯỢC CẬP NHẬT:
 *
 * 1. js/main.js
 *    - Đã sửa trong bản v7.0.0 (import KhucTanThuongAgent + GoiMoAgent)
 *
 * 2. js/ai/agents/analysis.js
 *    - Cần sửa: import KhucTanThuongAgent + GoiMoAgent
 *               thay PraiserAgent + CriticAgent
 *
 * 3. js/ai/master.js
 *    - Cần sửa: AgentMap['praiser'] → AgentMap['khuc-tan-thuong']
 *               AgentMap['critic']  → AgentMap['goi-mo']
 *
 * 4. js/ai/nlp/intent-definitions.js
 *    - Cần sửa: agent 'praiser' → 'khuc-tan-thuong'
 *               agent 'critic'  → 'goi-mo'
 *               (hoặc đổi key 'criticize-work' → 'open-depth')
 *
 * 5. js/ai/nlp/language-signals.js
 *    - Cần sửa: 'criticize' → 'open-depth' (nếu đổi key)
 *
 * 6. js/audit.js
 *    - Cần sửa: test case 'criticize-work' → 'open-depth'
 *
 * 7. Xóa 2 files cũ:
 *    - js/ai/agents/praiser.js
 *    - js/ai/agents/critic.js
 *
 * 8. Chạy: python tools/update_manifests.py
 *
 * 9. Tăng CACHE_VERSION trong sw.js: v14.2.0 → v15.0.0
 *
 * =====================================================================
 */
