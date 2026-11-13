/**
 * ==========================================================
 * VĂN ĐẠO AI - AGENTS INDEX (js/ai/agents/index.js)
 * Vị trí: js/ai/agents/index.js
 * Version: 5.0.0 (Auto-Registry Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tự động xây dựng Sổ đăng ký (Registry) và Bản đồ (Map).
 * - Chỉ cần khai báo Agent trong mảng AGENT_CONFIGS.
 * - Tự động gom nhóm intentPatterns cho InputAI.
 * ==========================================================
 */

// =====================================================================
// 1. IMPORT CÁC AGENT
// =====================================================================
import { LiteratureAgent } from './literature.js';
import { PoeticsAgent } from './poetics.js';
import { AnalysisAgent } from './analysis.js';
import { FortuneAgent } from './fortune-ai.js';
import { KnowledgeAgent } from './knowledge.js';
import { HistoryAgent } from './history.js';
import { TranslationAgent } from './translation.js';
import { CharacterAgent } from './character.js';
import { ComparisonAgent } from './comparison.js';
import { PraiserAgent } from './praiser.js';
import { CriticAgent } from './critic.js';

// =====================================================================
// 2. CẤU HÌNH AGENT (Chỉ cần sửa ở đây khi thêm/bớt)
// =====================================================================
const AGENT_CONFIGS = [
    {
        key: 'literature',
        instance: LiteratureAgent,
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
        canDelegate: ['poetics', 'knowledge', 'history', 'character'],
        intentPatterns: {
            'summarize-work': ['tom tat', 'noi dung chinh', 'ke lai', 'trinh bay'],
            'find-author-of': ['ai viet', 'tac gia cua', 'ai sang tac', 'nguoi viet', 'cua ai'],
            'recommend': ['goi y', 'de xuat', 'nen doc', 'muon doc', 'tim truyen', 'tim tho'],
            'define-genre': ['the loai', 'the tho', 'dinh nghia the loai']
        }
    },
    {
        key: 'poetics',
        instance: PoeticsAgent,
        name: 'Thi Pháp AI',
        description: 'Chuyên trách Từ điển, Biểu tượng, Điển tích, Thuật ngữ.',
        capabilities: {
            'explain-symbol': 'explainSymbol',
            'explain-allusion': 'explainSymbol',
            'define-term': 'explainSymbol'
        },
        canRead: ['work', 'symbol', 'term', 'genre', 'allusion'],
        canDelegate: ['literature', 'knowledge'],
        intentPatterns: {
            'explain-symbol': ['y nghia', 'bieu tuong', 'hinh tuong', 'hinh anh', 'tuong trung'],
            'explain-allusion': ['dien tich', 'dien co', 'nguon goc dien'],
            'define-term': ['dinh nghia', 'giai thich', 'khai niem', 'thuat ngu']
        }
    },
    {
        key: 'knowledge',
        instance: KnowledgeAgent,
        name: 'Tri Thức AI',
        description: 'Chuyên trách Mạng lưới liên kết (Tác giả - Tác phẩm - Thể loại).',
        capabilities: {
            'find-related': 'findRelated',
            'find-author-info': 'getAuthorInfo',
            'list-author-works': 'listAuthorWorks',
            'explore': 'exploreEntity'
        },
        canRead: ['work', 'author', 'genre', 'symbol'],
        canDelegate: ['literature', 'poetics', 'history'],
        intentPatterns: {
            'find-related': ['lien quan', 'giong', 'tuong tu', 'cung the loai', 'cung tac gia'],
            'find-author-info': ['tieu su', 'cuoc doi', 'su nghiep', 'thong tin ve tac gia'],
            'list-author-works': ['tac pham cua', 'sang tac nhung tac pham nao', 'co nhung tac pham nao', 'liet ke tac pham']
        }
    },
    {
        key: 'analysis',
        instance: AnalysisAgent,
        name: 'Phân Tích AI',
        description: 'Chuyên trách Đọc hiểu văn bản, Tìm chủ đề, Biểu tượng.',
        capabilities: {
            'analyze-work': 'analyze'
        },
        canRead: ['work', 'author', 'symbol', 'allusion', 'term'],
        canDelegate: ['poetics', 'literature'],
        intentPatterns: {
            'analyze-work': ['phan tich', 'binh giang', 'cam nhan', 'danh gia', 'binh luan', 'mo xe']
        }
    },
    {
        key: 'fortune',
        instance: FortuneAgent,
        name: 'Vận Khí AI',
        description: 'Chuyên trách Bói thơ, Vận khí, Nên/Tránh.',
        capabilities: {
            'fortune': 'getFortune'
        },
        canRead: ['work', 'author'],
        canDelegate: [],
        intentPatterns: {
            'fortune': ['boi', 'van khi', 'gieo que', 'xin que']
        }
    },
    {
        key: 'history',
        instance: HistoryAgent,
        name: 'Lịch Sử AI',
        description: 'Chuyên trách Bối cảnh lịch sử, Thời đại văn học.',
        capabilities: {
            'find-works-by-era': 'findWorksByEra',
            'find-authors-by-era': 'findAuthorsByEra',
            'get-historical-context': 'getHistoricalContext'
        },
        canRead: ['work', 'author', 'genre'],
        canDelegate: ['literature', 'knowledge'],
        intentPatterns: {
            'find-works-by-era': ['tac pham thoi', 'van hoc thoi', 'tac pham trieu dai'],
            'find-authors-by-era': ['tac gia thoi', 'nha tho thoi', 'nha van thoi'],
            'get-historical-context': ['viet thoi nao', 'thuoc thoi nao', 'boi canh lich su', 'hoat dong thoi nao']
        }
    },
    {
        key: 'translation',
        instance: TranslationAgent,
        name: 'Dịch Thuật AI',
        description: 'Chuyên trách dịch thuật văn bản, tác phẩm.',
        capabilities: {
            'translate-work': 'translate'
        },
        canRead: ['work', 'author'],
        canDelegate: ['literature'],
        intentPatterns: {
            'translate-work': ['dich', 'translate', 'chuyen ngu', 'dich thuat', 'sang tieng anh', 'sang tieng viet']
        }
    },
    {
        key: 'character',
        instance: CharacterAgent,
        name: 'Nhân Vật AI',
        description: 'Chuyên trách tra cứu nhân vật văn học.',
        capabilities: {
            'get-character-info': 'getCharacterInfo'
        },
        canRead: ['work', 'author'],
        canDelegate: ['literature', 'knowledge'],
        intentPatterns: {
            'get-character-info': ['nhan vat', 'character', 'la ai', 'nhan vat nao']
        }
    },
    {
        key: 'comparison',
        instance: ComparisonAgent,
        name: 'So Sánh AI',
        description: 'Chuyên trách so sánh 2 tác giả, 2 tác phẩm.',
        capabilities: {
            'compare-entities': 'compare'
        },
        canRead: ['work', 'author'],
        canDelegate: ['literature', 'knowledge'],
        intentPatterns: {
            'compare-entities': ['so sanh', 'compare', 'khac nhau', 'tuong dong', 'giong']
        }
    },
    {
        key: 'praiser',
        instance: PraiserAgent,
        name: 'Tán Thưởng AI',
        description: 'Chuyên trách tìm vẻ đẹp, ca ngợi tác phẩm.',
        capabilities: {
            'praise-work': 'analyze'
        },
        canRead: ['work', 'symbol'],
        canDelegate: ['poetics'],
        intentPatterns: {
            'praise-work': ['khen', 'ca ngoi', 'praise', 'tuyet', 'dep', 'hay']
        }
    },
    {
        key: 'critic',
        instance: CriticAgent,
        name: 'Phê Bình AI',
        description: 'Chuyên trách chỉ ra hạn chế, thiếu sót.',
        capabilities: {
            'criticize-work': 'analyze'
        },
        canRead: ['work', 'symbol'],
        canDelegate: ['poetics'],
        intentPatterns: {
            'criticize-work': ['che', 'phe binh', 'criticize', 'han che', 'te', 'kem']
        }
    }
];

// =====================================================================
// 3. TỰ ĐỘNG XÂY DỰNG AGENT MAP & REGISTRY
// =====================================================================
export const AgentMap = {};
export const AgentRegistry = { agents: {} };
export const DynamicIntentPatterns = {}; // Tự động gom intent cho InputAI

for (const config of AGENT_CONFIGS) {
    // 1. Xây dựng AgentMap
    AgentMap[config.key] = config.instance;

    // 2. Xây dựng AgentRegistry
    AgentRegistry.agents[config.key] = {
        id: `agent:${config.key}`,
        name: config.name,
        description: config.description,
        capabilities: config.capabilities,
        canRead: config.canRead,
        canDelegate: config.canDelegate
    };

    // 3. Gom Intent Patterns
    if (config.intentPatterns) {
        Object.entries(config.intentPatterns).forEach(([intent, keywords]) => {
            DynamicIntentPatterns[intent] = keywords;
        });
    }
}

// =====================================================================
// 4. CÁC HÀM TIỆN ÍCH CỦA REGISTRY
// =====================================================================
AgentRegistry.findAgentForTask = function(task) {
    if (!task) return null;
    for (const [key, agent] of Object.entries(this.agents)) {
        if (agent.capabilities && agent.capabilities[task]) return key;
    }
    return null;
};

AgentRegistry.getMethodName = function(agentKey, task) {
    const agent = this.agents[agentKey];
    if (!agent || !agent.capabilities) return null;
    return agent.capabilities[task] || null;
};

AgentRegistry.canDelegate = function(fromAgent, toAgent) {
    const agent = this.agents[fromAgent];
    if (!agent || !agent.canDelegate) return false;
    return agent.canDelegate.includes(toAgent);
};

AgentRegistry.getAgentInfo = function(agentKey) {
    return this.agents[agentKey] || null;
};

AgentRegistry.getAllAgentKeys = function() {
    return Object.keys(this.agents);
};
