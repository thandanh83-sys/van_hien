/**
 * ==========================================================
 * VĂN ĐẠO AI - AGENTS INDEX (js/ai/agents/index.js)
 * Vị trí: js/ai/agents/index.js
 * Version: 3.2.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Là "Bảng điều khiển" trung tâm của toàn bộ hệ thống AI.
 * - Đóng vai trò là Sổ đăng ký (Registry) và Bản đồ (Map) cho các Agent.
 * - Giúp MasterAI điều phối động (Dynamic Routing) mà không cần hardcode.
 * 
 * TRIẾT LÝ "PLUGIN":
 * - Mỗi Agent là một "viên gạch" độc lập.
 * - Khi thêm AI mới, BẠN CHỈ CẦN SỬA FILE NÀY.
 * - Không cần chạm vào master.js hay các file lõi khác.
 * ==========================================================
 */

// =====================================================================
// 1. IMPORT CÁC AGENT (Viên gạch)
// =====================================================================
import { LiteratureAgent } from './literature.js';
import { PoeticsAgent } from './poetics.js';
import { AnalysisAgent } from './analysis.js';
import { FortuneAgent } from './fortune-ai.js';
import { KnowledgeAgent } from './knowledge.js';
import { HistoryAgent } from './history.js';

// =====================================================================
// 2. AGENT MAP (Bản đồ thực thể)
// Ánh xạ key trong Registry sang Object thực tế của Agent.
// Dùng để MasterAI lấy được instance và gọi hàm.
// =====================================================================
export const AgentMap = {
    'literature': LiteratureAgent,
    'poetics': PoeticsAgent,
    'analysis': AnalysisAgent,
    'fortune': FortuneAgent,
    'knowledge': KnowledgeAgent,
    'history': HistoryAgent
};

// =====================================================================
// 3. AGENT REGISTRY (Sổ đăng ký năng lực)
// Định nghĩa chi tiết: Agent này tên gì, làm được việc gì,
// và tên hàm thực tế cần gọi là gì.
// =====================================================================
export const AgentRegistry = {
    agents: {
        // =========================================================
        // 1. VĂN HỌC AI (Literature)
        // =========================================================
        'literature': {
            id: 'agent:literature',
            name: 'Văn Học AI',
            description: 'Chuyên trách Tác phẩm, Tác giả, Tóm tắt và Thể loại.',
            capabilities: {
                'summarize-work': 'summarize',      // Intent -> Tên hàm
                'find-author-of': 'findAuthor',
                'recommend': 'recommend',
                'define-genre': 'defineGenre',
                'search': 'search'
            },
            canRead: ['work', 'author', 'genre'],
            canDelegate: ['poetics', 'knowledge', 'history']
        },

        // =========================================================
        // 2. THI PHÁP AI (Poetics)
        // =========================================================
        'poetics': {
            id: 'agent:poetics',
            name: 'Thi Pháp AI',
            description: 'Chuyên trách Từ điển, Biểu tượng, Điển tích, Thuật ngữ.',
            capabilities: {
                'explain-symbol': 'explainSymbol',
                'explain-allusion': 'explainSymbol', // Gộp chung xử lý
                'define-term': 'explainSymbol'
            },
            canRead: ['work', 'symbol', 'term', 'genre', 'allusion'],
            canDelegate: ['literature', 'knowledge']
        },

        // =========================================================
        // 3. TRI THỨC AI (Knowledge)
        // =========================================================
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

        // =========================================================
        // 4. PHÂN TÍCH AI (Analysis)
        // =========================================================
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

        // =========================================================
        // 5. VẬN KHÍ AI (Fortune)
        // =========================================================
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

        // =========================================================
        // 6. LỊCH SỬ AI (History) - [MỚI]
        // =========================================================
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
        }
    },

    // =================================================================
    // 4. CÁC HÀM TIỆN ÍCH (Helper Methods)
    // =================================================================

    /**
     * Tìm Agent có khả năng thực hiện một task cụ thể.
     * @param {string} task - Intent type (VD: 'summarize-work')
     * @returns {string|null} - Key của Agent (VD: 'literature')
     */
    findAgentForTask(task) {
        if (!task) return null;
        for (const [key, agent] of Object.entries(this.agents)) {
            if (agent.capabilities[task]) {
                return key;
            }
        }
        return null;
    },

    /**
     * Lấy tên hàm thực tế cần gọi trong Agent.
     * @param {string} agentKey - Key của Agent (VD: 'literature')
     * @param {string} task - Intent type (VD: 'summarize-work')
     * @returns {string|null} - Tên hàm (VD: 'summarize')
     */
    getMethodName(agentKey, task) {
        const agent = this.agents[agentKey];
        if (!agent || !agent.capabilities) return null;
        return agent.capabilities[task] || null;
    },

    /**
     * Kiểm tra xem Agent A có quyền nhờ Agent B giúp không.
     * @param {string} fromAgent - Key của Agent yêu cầu
     * @param {string} toAgent - Key của Agent được nhờ
     * @returns {boolean}
     */
    canDelegate(fromAgent, toAgent) {
        const agent = this.agents[fromAgent];
        if (!agent || !agent.canDelegate) return false;
        return agent.canDelegate.includes(toAgent);
    },

    /**
     * Lấy thông tin chi tiết của một Agent.
     * @param {string} agentKey 
     * @returns {Object|null}
     */
    getAgentInfo(agentKey) {
        return this.agents[agentKey] || null;
    },

    /**
     * Lấy danh sách tất cả các Agent hiện có.
     * @returns {Array<string>}
     */
    getAllAgentKeys() {
        return Object.keys(this.agents);
    }
};
