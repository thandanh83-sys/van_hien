/**
 * ==========================================================
 * VĂN ĐẠO - AGENT REGISTRY (js/ai/agent-registry.js)
 * Vị trí: js/ai/agent-registry.js
 * Version: 1.0.0 (Unified Intelligence Network)
 * ==========================================================
 * CHỨC NĂNG:
 * - Quản lý thông tin các AI (Agents): Khả năng, quyền đọc ID, quyền ủy thác.
 * - Cho phép Master AI tra cứu Agent phù hợp thay vì hardcode switch/case.
 * ==========================================================
 */

export const AgentRegistry = {
    // -----------------------------------------------------------------
    // 1. ĐĂNG KÝ CÁC AGENT (Danh sách các chuyên gia)
    // -----------------------------------------------------------------
    agents: {
        'literature': {
            name: 'Văn Học AI',
            capabilities: ['summarize-work', 'find-author-of', 'recommend', 'search'],
            canRead: ['work', 'author', 'genre'],
            canDelegate: ['poetics', 'dictionary'] // Có thể nhờ AI khác giúp
        },
        'poetics': {
            name: 'Thi Pháp AI',
            capabilities: ['explain-symbol', 'explain-allusion', 'define-term', 'define-genre'],
            canRead: ['work', 'symbol', 'term', 'genre', 'allusion'],
            canDelegate: ['literature'] // Cần tác phẩm minh họa thì nhờ Văn Học AI
        },
        'knowledge': {
            name: 'Tri Thức AI',
            capabilities: ['find-related', 'find-author-info', 'list-author-works', 'explore'],
            canRead: ['work', 'author', 'genre', 'symbol'],
            canDelegate: ['literature', 'poetics']
        },
        'analysis': {
            name: 'Phân Tích AI',
            capabilities: ['analyze-work'],
            canRead: ['work', 'author', 'symbol', 'allusion', 'term'],
            canDelegate: ['poetics', 'literature']
        },
        'fortune': {
            name: 'Vận Khí AI',
            capabilities: ['fortune'],
            canRead: ['work', 'author'],
            canDelegate: []
        }
    },

    // -----------------------------------------------------------------
    // 2. HÀM ĐIỀU PHỐI (Tra cứu Agent phù hợp)
    // -----------------------------------------------------------------
    
    /**
     * Tìm Agent có khả năng thực hiện một task cụ thể.
     * @param {string} task - Tên task (VD: 'summarize-work')
     * @returns {string|null} - Key của Agent (VD: 'literature')
     */
    findAgentForTask(task) {
        for (const [key, agent] of Object.entries(this.agents)) {
            if (agent.capabilities.includes(task)) {
                return key;
            }
        }
        return null;
    },

    /**
     * Kiểm tra xem Agent A có quyền nhờ Agent B giúp không.
     * @param {string} fromAgent - Key của Agent yêu cầu
     * @param {string} toAgent - Key của Agent được nhờ
     */
    canDelegate(fromAgent, toAgent) {
        const agent = this.agents[fromAgent];
        if (!agent || !agent.canDelegate) return false;
        return agent.canDelegate.includes(toAgent);
    }
};
