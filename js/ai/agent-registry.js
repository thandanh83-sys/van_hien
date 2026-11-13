/**
 * ==========================================================
 * VĂN ĐẠO - AGENT REGISTRY (js/ai/agent-registry.js)
 * Vị trí: js/ai/agent-registry.js
 * Version: 3.1.0 (Unified Intelligence Network)
 * ==========================================================
 * CHỨC NĂNG:
 * - Quản lý thông tin các AI (Agents): Khả năng, quyền đọc ID, quyền ủy thác.
 * - Cho phép Master AI tra cứu Agent phù hợp thay vì hardcode switch/case.
 * - Là "danh bạ" để các Agent biết ai có thể giúp mình.
 * ==========================================================
 */

export const AgentRegistry = {
    // =================================================================
    // 1. ĐĂNG KÝ CÁC AGENT (Danh sách các chuyên gia)
    // =================================================================
    agents: {
        // --- Chuyên gia Văn học ---
        'literature': {
            id: 'agent:literature',
            name: 'Văn Học AI',
            description: 'Chuyên trách Tác phẩm, Tác giả, Tóm tắt và Thể loại.',
            capabilities: ['summarize-work', 'find-author-of', 'recommend', 'define-genre', 'search'],
            canRead: ['work', 'author', 'genre'],
            canDelegate: ['poetics', 'knowledge', 'history'] // Có thể nhờ AI khác giúp
        },

        // --- Chuyên gia Thi pháp ---
        'poetics': {
            id: 'agent:poetics',
            name: 'Thi Pháp AI',
            description: 'Chuyên trách Từ điển, Biểu tượng, Điển tích, Thuật ngữ.',
            capabilities: ['explain-symbol', 'explain-allusion', 'define-term'],
            canRead: ['work', 'symbol', 'term', 'genre', 'allusion'],
            canDelegate: ['literature', 'knowledge'] // Cần tác phẩm minh họa thì nhờ Văn Học AI
        },

        // --- Chuyên gia Tri thức ---
        'knowledge': {
            id: 'agent:knowledge',
            name: 'Tri Thức AI',
            description: 'Chuyên trách Mạng lưới liên kết (Tác giả - Tác phẩm - Thể loại).',
            capabilities: ['find-related', 'find-author-info', 'list-author-works', 'explore'],
            canRead: ['work', 'author', 'genre', 'symbol'],
            canDelegate: ['literature', 'poetics', 'history']
        },

        // --- Chuyên gia Phân tích ---
        'analysis': {
            id: 'agent:analysis',
            name: 'Phân Tích AI',
            description: 'Chuyên trách Đọc hiểu văn bản, Tìm chủ đề, Biểu tượng.',
            capabilities: ['analyze-work'],
            canRead: ['work', 'author', 'symbol', 'allusion', 'term'],
            canDelegate: ['poetics', 'literature']
        },

        // --- Chuyên gia Bói toán ---
        'fortune': {
            id: 'agent:fortune',
            name: 'Vận Khí AI',
            description: 'Chuyên trách Bói thơ, Vận khí, Nên/Tránh.',
            capabilities: ['fortune'],
            canRead: ['work', 'author'],
            canDelegate: []
        },

        // --- [MỚI] Chuyên gia Lịch sử ---
        'history': {
            id: 'agent:history',
            name: 'Lịch Sử AI',
            description: 'Chuyên trách Bối cảnh lịch sử, Thời đại văn học.',
            capabilities: ['find-works-by-era', 'find-authors-by-era', 'get-historical-context'],
            canRead: ['work', 'author', 'genre'],
            canDelegate: ['literature', 'knowledge'] // Cần thêm tác phẩm minh họa thì nhờ Văn Học AI
        }
    },

    // =================================================================
    // 2. HÀM ĐIỀU PHỐI (Tra cứu Agent phù hợp)
    // =================================================================
    
    /**
     * Tìm Agent có khả năng thực hiện một task cụ thể.
     * @param {string} task - Tên task (VD: 'summarize-work')
     * @returns {string|null} - Key của Agent (VD: 'literature')
     */
    findAgentForTask(task) {
        if (!task) return null;
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
