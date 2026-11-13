/**
 * ==========================================================
 * VĂN ĐẠO AI - AGENTS INDEX (js/ai/agents/index.js)
 * Vị trí: js/ai/agents/index.js
 * Version: 3.3.1 (Plugin Architecture - Full 10 Agents)
 * ==========================================================
 * CHỨC NĂNG:
 * - Là "Bảng điều khiển" trung tâm của toàn bộ hệ thống AI.
 * - Đóng vai trò là Sổ đăng ký (Registry) và Bản đồ (Map) cho các Agent.
 * - Giúp MasterAI điều phối động (Dynamic Routing) mà không cần hardcode.
 * ==========================================================
 */

// =====================================================================
// 1. IMPORT CÁC AGENT (10 Viên gạch)
// =====================================================================
import { LiteratureAgent } from './literature.js';
import { PoeticsAgent } from './poetics.js';
import { AnalysisAgent } from './analysis.js';
import { FortuneAgent } from './fortune-ai.js';
import { KnowledgeAgent } from './knowledge.js';
import { HistoryAgent } from './history.js';
import { TranslationAgent } from './translation.js';
import { CharacterAgent } from './character.js';

// [MỚI] Bổ sung 2 Agent Tán thưởng & Phê bình vào Danh bạ
import { PraiserAgent } from './praiser.js';
import { CriticAgent } from './critic.js';

// =====================================================================
// 2. AGENT MAP (Bản đồ thực thể)
// =====================================================================
export const AgentMap = {
    'literature': LiteratureAgent,
    'poetics': PoeticsAgent,
    'analysis': AnalysisAgent,
    'fortune': FortuneAgent,
    'knowledge': KnowledgeAgent,
    'history': HistoryAgent,
    'translation': TranslationAgent,
    'character': CharacterAgent,
    // [MỚI]
    'praiser': PraiserAgent,
    'critic': CriticAgent
};

// =====================================================================
// 3. AGENT REGISTRY (Sổ đăng ký năng lực)
// =====================================================================
export const AgentRegistry = {
    agents: {
        // 1. VĂN HỌC AI
        'literature': {
            id: 'agent:literature',
            name: 'Văn Học AI',
            description: 'Chuyên trách Tác phẩm, Tác giả, Tóm tắt và Thể loại.',
            capabilities: {
                'summarize-work': 'summarize',
                'find-author-of': 'findAuthor',
                'recommend': 'recommend',
                'define-genre': 'defineGenre',
                'search': 'search'
            },
            canRead: ['work', 'author', 'genre'],
            canDelegate: ['poetics', 'knowledge', 'history', 'character']
        },

        // 2. THI PHÁP AI
        'poetics': {
            id: 'agent:poetics',
            name: 'Thi Pháp AI',
            description: 'Chuyên trách Từ điển, Biểu tượng, Điển tích, Thuật ngữ.',
            capabilities: {
                'explain-symbol': 'explainSymbol',
                'explain-allusion': 'explainSymbol',
                'define-term': 'explainSymbol'
            },
            canRead: ['work', 'symbol', 'term', 'genre', 'allusion'],
            canDelegate: ['literature', 'knowledge']
        },

        // 3. TRI THỨC AI
        'knowledge': {
            id: 'agent:knowledge',
            name: 'Tri Thức AI',
            description: 'Chuyên trách Mạng lưới liên kết (Tác giả - Tác phẩm - Thể loại).',
            capabilities: {
                'find-related': 'findRelated',
                'find-author-info': 'getAuthorInfo',
                'list-author-works': 'listAuthorWorks',
                'explore': 'exploreEntity'
            },
            canRead: ['work', 'author', 'genre', 'symbol'],
            canDelegate: ['literature', 'poetics', 'history']
        },

        // 4. PHÂN TÍCH AI
        'analysis': {
            id: 'agent:analysis',
            name: 'Phân Tích AI',
            description: 'Chuyên trách Đọc hiểu văn bản, Tìm chủ đề, Biểu tượng.',
            capabilities: {
                'analyze-work': 'analyze'
            },
            canRead: ['work', 'author', 'symbol', 'allusion', 'term'],
            canDelegate: ['poetics', 'literature']
        },

        // 5. VẬN KHÍ AI
        'fortune': {
            id: 'agent:fortune',
            name: 'Vận Khí AI',
            description: 'Chuyên trách Bói thơ, Vận khí, Nên/Tránh.',
            capabilities: {
                'fortune': 'getFortune'
            },
            canRead: ['work', 'author'],
            canDelegate: []
        },

        // 6. LỊCH SỬ AI
        'history': {
            id: 'agent:history',
            name: 'Lịch Sử AI',
            description: 'Chuyên trách Bối cảnh lịch sử, Thời đại văn học.',
            capabilities: {
                'find-works-by-era': 'findWorksByEra',
                'find-authors-by-era': 'findAuthorsByEra',
                'get-historical-context': 'getHistoricalContext'
            },
            canRead: ['work', 'author', 'genre'],
            canDelegate: ['literature', 'knowledge']
        },

        // 7. DỊCH THUẬT AI
        'translation': {
            id: 'agent:translation',
            name: 'Dịch Thuật AI',
            description: 'Chuyên trách dịch thuật văn bản, tác phẩm.',
            capabilities: {
                'translate-work': 'translate'
            },
            canRead: ['work', 'author'],
            canDelegate: ['literature']
        },

        // 8. NHÂN VẬT AI
        'character': {
            id: 'agent:character',
            name: 'Nhân Vật AI',
            description: 'Chuyên trách tra cứu nhân vật văn học.',
            capabilities: {
                'get-character-info': 'getCharacterInfo'
            },
            canRead: ['work', 'author'],
            canDelegate: ['literature', 'knowledge']
        },

        // 9. TÁN THƯỞNG AI (MỚI)
        'praiser': {
            id: 'agent:praiser',
            name: 'Tán Thưởng AI',
            description: 'Chuyên trách tìm vẻ đẹp, ca ngợi tác phẩm.',
            capabilities: {
                'praise-work': 'analyze' // Hàm analyze của PraiserAgent nhận text
            },
            canRead: ['work', 'symbol'],
            canDelegate: ['poetics']
        },

        // 10. PHÊ BÌNH AI (MỚI)
        'critic': {
            id: 'agent:critic',
            name: 'Phê Bình AI',
            description: 'Chuyên trách chỉ ra hạn chế, thiếu sót của tác phẩm.',
            capabilities: {
                'criticize-work': 'analyze' // Hàm analyze của CriticAgent nhận text
            },
            canRead: ['work', 'symbol'],
            canDelegate: ['poetics']
        }
    },

    // =================================================================
    // 4. CÁC HÀM TIỆN ÍCH
    // =================================================================
    findAgentForTask(task) {
        if (!task) return null;
        for (const [key, agent] of Object.entries(this.agents)) {
            if (agent.capabilities[task]) {
                return key;
            }
        }
        return null;
    },

    getMethodName(agentKey, task) {
        const agent = this.agents[agentKey];
        if (!agent || !agent.capabilities) return null;
        return agent.capabilities[task] || null;
    },

    canDelegate(fromAgent, toAgent) {
        const agent = this.agents[fromAgent];
        if (!agent || !agent.canDelegate) return false;
        return agent.canDelegate.includes(toAgent);
    },

    getAgentInfo(agentKey) {
        return this.agents[agentKey] || null;
    },

    getAllAgentKeys() {
        return Object.keys(this.agents);
    }
};
