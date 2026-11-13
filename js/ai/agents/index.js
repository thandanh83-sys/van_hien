/**
 * ==========================================================
 * VĂN ĐẠO AI - AGENTS INDEX (js/ai/agents/index.js)
 * Vị trí: js/ai/agents/index.js
 * Version: 7.0.0 (Distributed AgentInfo Architecture)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. PHÂN TÁN METADATA (Distributed Metadata):
 *    Mỗi Agent TỰ MÔ TẢ metadata của chính nó qua thuộc tính
 *    `AgentName.agentInfo = {...}` ở cuối file Agent.
 *    File index.js này KHÔNG chứa bất kỳ metadata nào — chỉ import
 *    và đăng ký tự động. Đây là "Single Source of Truth" thực sự:
 *    metadata nằm ngay cạnh code xử lý.
 *
 * 2. ĐĂNG KÝ TỰ ĐỘNG (Auto-Registry):
 *    Vòng lặp duy nhất đọc `Agent.agentInfo` của từng Agent, validate,
 *    rồi xây dựng 3 cấu trúc:
 *      - AgentMap              : { key -> AgentClass }
 *      - AgentRegistry.agents  : { key -> { id, name, capabilities, ... } }
 *      - DynamicIntentPatterns : { intent -> [keywords] }  (gộp từ 11 Agent)
 *
 * 3. KIỂM TRA AN TOÀN (Defensive Registration):
 *    - Bỏ qua Agent thiếu `agentInfo` (log cảnh báo, không crash).
 *    - Bỏ qua Agent thiếu `key` (log cảnh báo, không crash).
 *    - Cảnh báo nếu 2 Agent trùng key (Agent sau ghi đè Agent trước).
 *    - Gộp keywords khi 2 Agent cùng khai báo 1 intent (tránh mất dữ liệu).
 *
 * 4. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
 *    Giữ nguyên toàn bộ API công khai mà các module khác đang dùng:
 *      - AgentMap, AgentRegistry, DynamicIntentPatterns
 *      - AgentRegistry.findAgentForTask(task)
 *      - AgentRegistry.getMethodName(agentKey, task)
 *      - AgentRegistry.canDelegate(fromAgent, toAgent)
 *      - AgentRegistry.getAgentInfo(agentKey)
 *      - AgentRegistry.getAllAgentKeys()
 *    Thêm mới: AgentRegistry.validate() để audit toàn vẹn.
 *
 * CÁCH THÊM AGENT MỚI (chỉ 3 bước):
 *   1. Tạo file `js/ai/agents/new-agent.js` với cấu trúc:
 *        export const NewAgent = { async doSomething(query) {...} };
 *        NewAgent.agentInfo = {
 *            key: 'new',                    // BẮT BUỘC: unique key
 *            name: 'Tên Hiển Thị',
 *            description: 'Mô tả ngắn',
 *            capabilities: { 'new-task': 'doSomething' },
 *            canRead: ['work', 'author'],
 *            canDelegate: ['literature'],
 *            intentPatterns: { 'new-task': ['tu khoa 1', 'tu khoa 2'] }
 *        };
 *   2. Trong file NÀY, thêm 1 dòng import:
 *        import { NewAgent } from './new-agent.js';
 *   3. Trong mảng AGENT_CLASSES bên dưới, thêm NewAgent:
 *        const AGENT_CLASSES = [ ..., NewAgent ];
 *   → Push code, GitHub Action sẽ tự cập nhật manifest + SW cache.
 * ==========================================================
 */

// =====================================================================
// PHẦN 1: IMPORT 11 AGENT HIỆN CÓ
// =====================================================================
// ES Module yêu cầu import tĩnh (static import) — không thể quét thư mục
// như Node.js. Đây là giới hạn của nền tảng trình duyệt, không phải
// lỗi thiết kế. Khi có bundler (Vite/Webpack) thì có thể dùng
// import.meta.glob, nhưng dự án hiện tại chạy ES Module thuần.
// =====================================================================

import { LiteratureAgent }  from './literature.js';
import { PoeticsAgent }     from './poetics.js';
import { AnalysisAgent }    from './analysis.js';
import { FortuneAgent }     from './fortune-ai.js';
import { KnowledgeAgent }   from './knowledge.js';
import { HistoryAgent }     from './history.js';
import { TranslationAgent } from './translation.js';
import { CharacterAgent }   from './character.js';
import { ComparisonAgent }  from './comparison.js';
import { PraiserAgent }     from './praiser.js';
import { CriticAgent }      from './critic.js';

// =====================================================================
// PHẦN 2: DANH SÁCH CLASS (CHỈ REFERENCE, KHÔNG METADATA)
// =====================================================================
// Đây là nơi DUY NHẤT cần sửa khi thêm Agent mới (sau khi đã import).
// Mỗi phần tử là một Class (Agent Object), KHÔNG phải config.
// Metadata thực sự nằm trong `AgentName.agentInfo` ở cuối file Agent.
// =====================================================================

const AGENT_CLASSES = [
    LiteratureAgent,   // key: 'literature'   - Văn Học AI
    PoeticsAgent,      // key: 'poetics'      - Thi Pháp AI
    AnalysisAgent,     // key: 'analysis'     - Phân Tích AI
    FortuneAgent,      // key: 'fortune'      - Vận Khí AI (file: fortune-ai.js)
    KnowledgeAgent,    // key: 'knowledge'    - Tri Thức AI
    HistoryAgent,      // key: 'history'      - Lịch Sử AI
    TranslationAgent,  // key: 'translation'  - Dịch Thuật AI
    CharacterAgent,    // key: 'character'    - Nhân Vật AI
    ComparisonAgent,   // key: 'comparison'   - So Sánh AI
    PraiserAgent,      // key: 'praiser'      - Tán Thưởng AI
    CriticAgent        // key: 'critic'       - Phê Bình AI
];

// =====================================================================
// PHẦN 3: KHO CHỨA CÔNG KHAI (PUBLIC STORES)
// =====================================================================
// 3 cấu trúc này được export ra ngoài, các module khác import trực tiếp:
//   - input-ai.js  dùng DynamicIntentPatterns
//   - master.js    dùng AgentMap, AgentRegistry
//   - audit.js     dùng AgentRegistry.validate(), getAllAgentKeys()
//   - network/index.js dùng AgentRegistry
// =====================================================================

/**
 * Bản đồ key -> Agent Class.
 * Ví dụ: AgentMap['literature'] === LiteratureAgent
 * Dùng để lấy instance Agent ra gọi method.
 */
export const AgentMap = {};

/**
 * Sổ đăng ký năng lực (capabilities) của từng Agent.
 * Cấu trúc: { [key]: { id, name, description, capabilities, canRead, canDelegate } }
 * Dùng để tra cứu Agent nào làm được task gì mà KHÔNG cần import class.
 */
export const AgentRegistry = { agents: {} };

/**
 * Bộ từ khóa nhận diện Intent, gộp từ 11 Agent.
 * Cấu trúc: { [intent]: [keyword1, keyword2, ...] }
 * Dùng bởi InputAI.detectCommand() để nhận diện câu hỏi người dùng.
 */
export const DynamicIntentPatterns = {};

// =====================================================================
// PHẦN 4: VÒNG LẶP ĐĂNG KÝ TỰ ĐỘNG (TRÁI TIM CỦA FILE NÀY)
// =====================================================================
// Duyệt qua từng Class trong AGENT_CLASSES, đọc `Class.agentInfo`,
// validate, rồi đăng ký vào 3 kho công khai ở trên.
// =====================================================================

// Bộ đếm để log tổng kết cuối vòng lặp
let registeredCount = 0;
let skippedCount = 0;

// Mảng ghi nhận lỗi để log cảnh báo tập trung (không spam giữa chừng)
const registrationWarnings = [];

for (const AgentClass of AGENT_CLASSES) {

    // -----------------------------------------------------------------
    // BƯỚC 4.1: Kiểm tra Class có tồn tại (defensive — phòng import lỗi)
    // -----------------------------------------------------------------
    if (!AgentClass || typeof AgentClass !== 'object') {
        registrationWarnings.push(
            `Bỏ qua một Class không hợp lệ (null/undefined/không phải object).`
        );
        skippedCount++;
        continue;
    }

    // -----------------------------------------------------------------
    // BƯỚC 4.2: Lấy tên Class để log (dùng .name của function/class)
    // -----------------------------------------------------------------
    // Lưu ý: AgentClass là object literal (const X = {...}), không phải
    // class ES6. Nên .name thường là '' hoặc tên biến gốc. Ta dùng
    // fallback về 'UnknownAgent' nếu không xác định được.
    const className = AgentClass.constructor?.name || AgentClass.name || 'UnknownAgent';

    // -----------------------------------------------------------------
    // BƯỚC 4.3: Đọc metadata tự mô tả
    // -----------------------------------------------------------------
    const info = AgentClass.agentInfo;

    // 4.3.1 — Thiếu agentInfo hoàn toàn
    if (!info || typeof info !== 'object') {
        registrationWarnings.push(
            `BỎ QUA "${className}": thiếu thuộc tính "agentInfo". ` +
            `Hãy thêm "AgentName.agentInfo = { ... }" vào cuối file Agent tương ứng.`
        );
        skippedCount++;
        continue;
    }

    // 4.3.2 — Thiếu key (không thể đăng ký nếu không có key)
    if (!info.key || typeof info.key !== 'string' || !info.key.trim()) {
        registrationWarnings.push(
            `BỎ QUA "${className}": thiếu trường "key" (string không rỗng) trong agentInfo.`
        );
        skippedCount++;
        continue;
    }

    const agentKey = info.key.trim();

    // -----------------------------------------------------------------
    // BƯỚC 4.4: Đăng ký vào AgentMap
    // -----------------------------------------------------------------
    // Nếu trùng key → ghi đè (nhưng log cảnh báo để dev biết)
    if (AgentMap[agentKey]) {
        registrationWarnings.push(
            `TRÙNG KEY "${agentKey}": "${className}" sẽ ghi đè Agent đã đăng ký trước đó. ` +
            `Hãy kiểm tra lại key của 2 Agent để đảm bảo duy nhất.`
        );
    }
    AgentMap[agentKey] = AgentClass;

    // -----------------------------------------------------------------
    // BƯỚC 4.5: Đăng ký vào AgentRegistry
    // -----------------------------------------------------------------
    // Cấu trúc được chuẩn hóa — kể cả khi Agent không khai báo đủ trường,
    // ta vẫn tạo object với giá trị mặc định an toàn (mảng rỗng).
    AgentRegistry.agents[agentKey] = {
        // ---- Định danh ----
        id: `agent:${agentKey}`,
        key: agentKey,                                 // tiện tra cứu ngược
        name: info.name || agentKey,                   // fallback = key
        description: info.description || '',

        // ---- Năng lực (map: task -> method) ----
        capabilities: (info.capabilities && typeof info.capabilities === 'object')
            ? { ...info.capabilities }                 // clone nông để tránh mutate
            : {},

        // ---- Loại dữ liệu có thể đọc ----
        canRead: Array.isArray(info.canRead) ? [...info.canRead] : [],

        // ---- Agent được phép ủy thác ----
        canDelegate: Array.isArray(info.canDelegate) ? [...info.canDelegate] : []
    };

    // -----------------------------------------------------------------
    // BƯỚC 4.6: Gộp Intent Patterns vào DynamicIntentPatterns
    // -----------------------------------------------------------------
    // Nếu 2 Agent cùng khai báo 1 intent (VD: cả 'knowledge' và 'literature'
    // đều có 'find-author-of'), ta GỘP keywords thay vì ghi đè, để không
    // mất bất kỳ từ khóa nào.
    if (info.intentPatterns && typeof info.intentPatterns === 'object') {
        for (const [intent, keywords] of Object.entries(info.intentPatterns)) {

            // 4.6.1 — Keywords phải là mảng (defensive)
            if (!Array.isArray(keywords)) {
                registrationWarnings.push(
                    `Agent "${agentKey}": intent "${intent}" có keywords KHÔNG phải mảng. Bỏ qua.`
                );
                continue;
            }

            // 4.6.2 — Lọc keywords hợp lệ (chuỗi không rỗng)
            const validKeywords = keywords
                .filter(kw => typeof kw === 'string' && kw.trim().length > 0)
                .map(kw => kw.trim());

            if (validKeywords.length === 0) {
                continue; // Toàn bộ keywords rỗng — bỏ qua intent này
            }

            // 4.6.3 — Gộp với keywords cũ (nếu có) và loại trùng
            if (DynamicIntentPatterns[intent]) {
                // Dùng Set để loại trùng O(n) thay vì O(n²)
                DynamicIntentPatterns[intent] = Array.from(
                    new Set([...DynamicIntentPatterns[intent], ...validKeywords])
                );
            } else {
                DynamicIntentPatterns[intent] = [...validKeywords];
            }
        }
    }

    registeredCount++;
}

// =====================================================================
// PHẦN 5: LOG TỔNG KẾT (Chỉ trong môi trường dev có console)
// =====================================================================
// Mục đích: Dev mở Console thấy ngay "11 agents, 22 intents" để xác nhận
// hệ thống đăng ký đủ. Nếu thiếu, sẽ thấy ngay danh sách warning.
// =====================================================================

if (typeof console !== 'undefined' && console.log) {
    const totalIntents = Object.keys(DynamicIntentPatterns).length;
    const summaryColor = skippedCount === 0 ? '#8bb8a8' : '#d4a373';

    console.log(
        `%c[AGENT-REGISTRY] Đã đăng ký ${registeredCount} agent` +
        (skippedCount > 0 ? ` (bỏ qua ${skippedCount})` : '') +
        `. Tổng intent patterns: ${totalIntents}.`,
        `color: ${summaryColor}; font-weight: bold;`
    );

    // In từng cảnh báo (nếu có) để dev dễ sửa
    if (registrationWarnings.length > 0) {
        console.group('%c[AGENT-REGISTRY] Cảnh báo đăng ký:', 'color: #d4a373; font-weight: bold;');
        registrationWarnings.forEach(w => console.warn('  -', w));
        console.groupEnd();
    }
}

// =====================================================================
// PHẦN 6: CÁC HÀM TIỆN ÍCH CỦA REGISTRY
// =====================================================================
// Đây là API công khai mà master.js, audit.js, network/index.js đang dùng.
// KHÔNG được đổi tên hay xóa — chỉ được thêm mới.
// =====================================================================

/**
 * Tìm key của Agent có khả năng thực thi task cụ thể.
 *
 * Cách hoạt động:
 *   Duyệt qua tất cả Agent đã đăng ký. Agent nào có
 *   `capabilities[task]` là một tên hàm (truthy) thì trả về key của nó.
 *   Trả về null nếu không Agent nào làm được.
 *
 * Ví dụ:
 *   AgentRegistry.findAgentForTask('summarize-work')  → 'literature'
 *   AgentRegistry.findAgentForTask('get-historical-context') → 'history'
 *   AgentRegistry.findAgentForTask('khong-ton-tai')   → null
 *
 * @param {string} task - Tên task (VD: 'summarize-work').
 * @returns {string|null} - Key Agent hoặc null.
 */
AgentRegistry.findAgentForTask = function (task) {
    if (!task || typeof task !== 'string') return null;

    for (const [key, agent] of Object.entries(this.agents)) {
        if (agent.capabilities && agent.capabilities[task]) {
            return key;
        }
    }
    return null;
};

/**
 * Lấy tên method cụ thể trong Agent để thực thi task.
 *
 * Ví dụ:
 *   AgentRegistry.getMethodName('literature', 'summarize-work') → 'summarize'
 *   AgentRegistry.getMethodName('literature', 'khong-ton-tai')  → null
 *
 * @param {string} agentKey - Key của Agent (VD: 'literature').
 * @param {string} task - Tên task (VD: 'summarize-work').
 * @returns {string|null} - Tên method hoặc null.
 */
AgentRegistry.getMethodName = function (agentKey, task) {
    if (!agentKey || !task) return null;

    const agent = this.agents[agentKey];
    if (!agent || !agent.capabilities) return null;

    return agent.capabilities[task] || null;
};

/**
 * Kiểm tra Agent A có được phép ủy thác (delegate) cho Agent B không.
 *
 * Ủy thác là cơ chế để một Agent có thể nhờ Agent khác xử lý khi
 * task nằm ngoài khả năng của mình (VD: LiteratureAgent nhờ
 * PoeticsAgent giải thích biểu tượng).
 *
 * Ví dụ:
 *   AgentRegistry.canDelegate('literature', 'poetics')    → true
 *   AgentRegistry.canDelegate('poetics', 'fortune')       → false
 *
 * @param {string} fromAgent - Key Agent nguồn.
 * @param {string} toAgent - Key Agent đích.
 * @returns {boolean}
 */
AgentRegistry.canDelegate = function (fromAgent, toAgent) {
    if (!fromAgent || !toAgent) return false;

    const agent = this.agents[fromAgent];
    if (!agent || !Array.isArray(agent.canDelegate)) return false;

    return agent.canDelegate.includes(toAgent);
};

/**
 * Lấy thông tin đầy đủ của một Agent.
 *
 * @param {string} agentKey - Key Agent.
 * @returns {Object|null} - Object info hoặc null nếu không tồn tại.
 */
AgentRegistry.getAgentInfo = function (agentKey) {
    if (!agentKey) return null;
    return this.agents[agentKey] || null;
};

/**
 * Lấy danh sách tất cả key Agent đã đăng ký.
 *
 * @returns {string[]} - Mảng các key (VD: ['literature', 'poetics', ...]).
 */
AgentRegistry.getAllAgentKeys = function () {
    return Object.keys(this.agents);
};

/**
 * Kiểm tra tính toàn vẹn của Registry (dùng cho audit.js).
 *
 * Kiểm tra 2 điều kiện:
 *   1. Mỗi key trong AgentRegistry.agents phải có Class tương ứng trong AgentMap.
 *   2. Mỗi Agent phải có ít nhất 1 capability (không được rỗng).
 *
 * @returns {{ total: number, invalid: string[], reasons: Object }}
 *   - total: tổng số Agent đã đăng ký
 *   - invalid: mảng key các Agent không hợp lệ
 *   - reasons: map key -> lý do không hợp lệ (để debug)
 */
AgentRegistry.validate = function () {
    const invalid = [];
    const reasons = {};

    for (const [key, info] of Object.entries(this.agents)) {
        // 6.1 — Phải có Class trong AgentMap
        if (!AgentMap[key]) {
            invalid.push(key);
            reasons[key] = 'Không có Class trong AgentMap (đăng ký lỗi).';
            continue;
        }

        // 6.2 — Phải có ít nhất 1 capability
        if (!info.capabilities || Object.keys(info.capabilities).length === 0) {
            invalid.push(key);
            reasons[key] = 'Không có capability nào (Agent không làm được gì).';
            continue;
        }

        // 6.3 — Mỗi method trong capabilities phải là hàm tồn tại trên Class
        const agentClass = AgentMap[key];
        for (const [task, methodName] of Object.entries(info.capabilities)) {
            if (typeof methodName !== 'string' || !methodName) {
                invalid.push(key);
                reasons[key] = `Capability "${task}" có methodName không hợp lệ.`;
                break;
            }
            if (typeof agentClass[methodName] !== 'function') {
                invalid.push(key);
                reasons[key] = `Capability "${task}" trỏ tới "${methodName}" nhưng Class không có hàm này.`;
                break;
            }
        }
    }

    return {
        total: Object.keys(this.agents).length,
        invalid: [...new Set(invalid)], // loại trùng (một Agent có thể fail nhiều lý do)
        reasons
    };
};
