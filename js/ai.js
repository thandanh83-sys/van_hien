/**
 * ==========================================================
 * VĂN ĐẠO AI - MAIN ENTRY POINT (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 4.2.0 (Living Intelligence Network)
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

// =====================================================================
// 7. TRUNG TÂM DỮ LIỆU (DATA HUB) - TRÁI TIM CỦA MẠNG LƯỚI
// =====================================================================
export { DataHub } from './network/data-hub.js';

// =====================================================================
// 8. PHIÊN BẢN & METADATA (Dùng cho Audit/Debug)
// =====================================================================
export const AI_VERSION = '4.2.0';
export const AI_ARCHITECTURE = 'Living Intelligence Network (11 Agents)';

export async function debugAI() {
    const { AgentRegistry } = await import('./ai/agents/index.js');
    const { CoreCache, safeGetArray } = await import('./ai/core.js');
    const { DataHub } = await import('./network/data-hub.js');
    
    console.log('%c[AI SYSTEM] Trạng thái tổng quan:', 'color: #8bb8a8; font-weight: bold; font-size: 14px;');
    console.log('  • Version:', AI_VERSION);
    console.log('  • Architecture:', AI_ARCHITECTURE);
    console.log('  • Tổng số Agents:', AgentRegistry.getAllAgentKeys().length);
    console.log('  • Danh sách Agents:', AgentRegistry.getAllAgentKeys().join(', '));
    console.log('  • Core Cache:', CoreCache.stats());
    console.log('  • DataHub Test:', DataHub.getMetadata('truyen-kieu') ? 'Sẵn sàng' : 'Chưa kết nối');
    console.log('  • Tác phẩm:', safeGetArray('WORKS_DATA').length);
    console.log('  • Tác giả:', safeGetArray('AUTHOR_DATA').length);
}
