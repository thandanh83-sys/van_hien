/**
 * ==========================================================
 * NGỌC THANH - MAIN ENTRY POINT (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 4.3.0 (Living Intelligence Network)
 * ==========================================================
 * CHỨC NĂNG:
 * - Đóng vai trò là "Cổng giao tiếp" (Facade) duy nhất cho toàn bộ AI.
 * - Gom tất cả các module AI và Network xuất ra ngoài.
 * - main.js và ask-dao.js chỉ cần import từ file này.
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
// 4. CÁC CHUYÊN GIA (AGENTS) - ĐỘI NGŨ TRI THỨC (11 AI)
// =====================================================================
export { LiteratureAgent } from './ai/agents/literature.js';
export { PoeticsAgent } from './ai/agents/poetics.js';
export { AnalysisAgent, analyzeWork } from './ai/agents/analysis.js';
export { 
    FortuneAgent, 
    calculateFortune, 
    getFortuneInfo, 
    synthesizeDynamicFortune 
} from './ai/agents/fortune.js';
export { KnowledgeAgent } from './ai/agents/knowledge.js';
export { HistoryAgent } from './ai/agents/history.js';
export { TranslationAgent } from './ai/agents/translation.js';
export { CharacterAgent } from './ai/agents/character.js';
export { ComparisonAgent } from './ai/agents/comparison.js';
export { PraiserAgent } from './ai/agents/praiser.js';
export { CriticAgent } from './ai/agents/critic.js';

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
// 6. CÁC ENGINE MỚI (BỘ NHỚ, SUY LUẬN, BẢN SẮC)
// =====================================================================
export { LiteraryEngine } from './ai/literary-engine.js';
export { MemoryEngine } from './ai/memory-engine.js';
export { Identity } from './ai/identity.js';
export { DialogueEngine } from './ai/dialogue-engine.js';
export { SmartInputParser } from './ai/smart-input-parser.js';

// =====================================================================
// 7. TRUNG TÂM DỮ LIỆU (DATA HUB) - TRÁI TIM CỦA MẠNG LƯỚI
// =====================================================================
export { DataHub } from './network/data-hub.js';

// =====================================================================
// 8. PHIÊN BẢN & METADATA (Dùng cho Audit/Debug)
// =====================================================================
export const AI_VERSION = '4.3.0';
export const AI_ARCHITECTURE = 'Living Intelligence Network (11 Agents)';
