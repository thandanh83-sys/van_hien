/**
 * ==========================================================
 * VĂN ĐẠO AI - AGENTS INDEX (js/ai/agents/index.js)
 * Vị trí: js/ai/agents/index.js
 * Version: 7.0.1 (Renamed Import & Special Detector Support)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. PHÂN TÁN METADATA (Distributed Metadata):
 *    Mỗi Agent TỰ MÔ TẢ metadata qua `AgentName.agentInfo = {...}`
 *    ở cuối file Agent. File index.js KHÔNG chứa metadata.
 *
 * 2. ĐĂNG KÝ TỰ ĐỘNG (Auto-Registry):
 *    Vòng lặp đọc `Agent.agentInfo`, validate, rồi xây dựng 3 cấu trúc:
 *      - AgentMap              : { key -> AgentClass }
 *      - AgentRegistry.agents  : { key -> { capabilities, specialDetector, ... } }
 *      - DynamicIntentPatterns : { intent -> [keywords] }
 *
 * 3. HỖ TRỢ SPECIAL DETECTOR (v7.0.1):
 *    Mỗi Agent có thể khai báo `specialDetector(text) => intent | null`
 *    trong `agentInfo`. Hàm này được copy vào `AgentRegistry.agents[key]`
 *    để `input-ai.js` gọi khi cần logic nhận diện đặc biệt (VD: cần
 *    cấu trúc "X và Y" cho compare, hoặc pattern phức tạp cho poetics).
 *
 * 4. LOG CHÍNH XÁC TÊN AGENT (v7.0.1):
 *    Trước v7.0.1, log warning hiển thị "Object" vì Agent là object
 *    literal (constructor.name = 'Object'). v7.0.1 ưu tiên dùng
 *    `info.key` để log tên thật (VD: "Agent[literature]").
 *
 * 5. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
 *    Giữ nguyên toàn bộ API công khai từ v7.0.0:
 *      - AgentMap, AgentRegistry, DynamicIntentPatterns
 *      - findAgentForTask, getMethodName, canDelegate
 *      - getAgentInfo, getAllAgentKeys, validate
 *
 * CÁCH THÊM AGENT MỚI (chỉ 3 bước):
 *   1. Tạo file `js/ai/agents/new-agent.js`:
 *        export const NewAgent = { async doSomething(query) {...} };
 *        NewAgent.agentInfo = {
 *            key: 'new',
 *            name: '...',
 *            description: '...',
 *            capabilities: { 'new-task': 'doSomething' },
 *            canRead: [...],
 *            canDelegate: [...],
 *            intentPatterns: { 'new-task': ['kw1', 'kw2'] },
 *            specialDetector: (text) => text.includes('xyz') ? 'new-task' : null
 *        };
 *   2. Trong file NÀY, thêm import: import { NewAgent } from './new-agent.js';
 *   3. Thêm NewAgent vào mảng AGENT_CLASSES.
 *   → Push code, GitHub Action tự cập nhật manifest + SW cache.
 * ==========================================================
 */

// =====================================================================
// PHẦN 1: IMPORT 11 AGENT
// =====================================================================
// LƯU Ý v7.0.1: Import FortuneAgent từ './fortune.js' (KHÔNG còn
// './fortune-ai.js' — file đã được đổi tên ở đợt 1).
// =====================================================================

import { LiteratureAgent }  from './literature.js';
import { PoeticsAgent }     from './poetics.js';
import { AnalysisAgent }    from './analysis.js';
import { FortuneAgent }     from './fortune.js';        // [ĐÃ ĐỔI] từ './fortune-ai.js'
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
// =====================================================================

const AGENT_CLASSES = [
    LiteratureAgent,   // key: 'literature'
    PoeticsAgent,      // key: 'poetics'
    AnalysisAgent,     // key: 'analysis'
    FortuneAgent,      // key: 'fortune'   (file: fortune.js)
    KnowledgeAgent,    // key: 'knowledge'
    HistoryAgent,      // key: 'history'
    TranslationAgent,  // key: 'translation'
    CharacterAgent,    // key: 'character'
    ComparisonAgent,   // key: 'comparison'
    PraiserAgent,      // key: 'praiser'
    CriticAgent        // key: 'critic'
];

// =====================================================================
// PHẦN 3: KHO CHỨA CÔNG KHAI (PUBLIC STORES)
// =====================================================================

/**
 * Bản đồ key -> Agent Class.
 * Ví dụ: AgentMap['fortune'] === FortuneAgent
 */
export const AgentMap = {};

/**
 * Sổ đăng ký năng lực của từng Agent.
 * Cấu trúc: { [key]: { id, key, name, description, capabilities,
 *                       canRead, canDelegate, specialDetector } }
 * [v7.0.1] Thêm trường specialDetector (có thể null).
 */
export const AgentRegistry = { agents: {} };

/**
 * Bộ từ khóa nhận diện Intent, gộp từ 11 Agent.
 * Cấu trúc: { [intent]: [keyword1, keyword2, ...] }
 */
export const DynamicIntentPatterns = {};

// =====================================================================
// PHẦN 4: VÒNG LẶP ĐĂNG KÝ TỰ ĐỘNG
// =====================================================================

// Bộ đếm để log tổng kết cuối vòng lặp
let registeredCount = 0;
let skippedCount = 0;

// Mảng ghi nhận cảnh báo (log tập trung, không spam giữa chừng)
const registrationWarnings = [];

for (const AgentClass of AGENT_CLASSES) {

    // -----------------------------------------------------------------
    // BƯỚC 4.1: Defensive — Class phải là object
    // -----------------------------------------------------------------
    if (!AgentClass || typeof AgentClass !== 'object') {
        registrationWarnings.push(
            `Bỏ qua một Class không hợp lệ (null/undefined/không phải object).`
        );
        skippedCount++;
        continue;
    }

    // -----------------------------------------------------------------
    // BƯỚC 4.2: Đọc metadata tự mô tả TRƯỚC (để log đúng tên)
    // -----------------------------------------------------------------
    // [v7.0.1 — FIX] Đọc `info` TRƯỚC khi khai báo `className`.
    // Trước v7.0.1, `className` được khai báo từ `AgentClass.constructor.name`
    // → luôn là 'Object' vì Agent là object literal.
    // Sau v7.0.1, ưu tiên `info.key` để log tên thật.
    const info = AgentClass.agentInfo;

    // Bây giờ mới khai báo className (đã có info để ưu tiên)
    const className = (info && info.key)
        ? `Agent[${info.key}]`
        : (AgentClass?.name || 'UnknownAgent');

    // -----------------------------------------------------------------
    // BƯỚC 4.3: Validate metadata
    // -----------------------------------------------------------------
    if (!info || typeof info !== 'object') {
        registrationWarnings.push(
            `BỎ QUA "${className}": thiếu thuộc tính "agentInfo". ` +
            `Hãy thêm "AgentName.agentInfo = { ... }" vào cuối file Agent.`
        );
        skippedCount++;
        continue;
    }

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
    if (AgentMap[agentKey]) {
        registrationWarnings.push(
            `TRÙNG KEY "${agentKey}": "${className}" sẽ ghi đè Agent đã đăng ký trước đó.`
        );
    }
    AgentMap[agentKey] = AgentClass;

    // -----------------------------------------------------------------
    // BƯỚC 4.5: Đăng ký vào AgentRegistry
    // -----------------------------------------------------------------
    // [v7.0.1] Thêm trường `specialDetector` (copy từ agentInfo).
    // Trường này được `input-ai.js` dùng để gọi logic nhận diện đặc biệt
    // của từng Agent (VD: compare cần cấu trúc "X và Y").
    AgentRegistry.agents[agentKey] = {
        // ---- Định danh ----
        id: `agent:${agentKey}`,
        key: agentKey,
        name: info.name || agentKey,
        description: info.description || '',

        // ---- Năng lực ----
        capabilities: (info.capabilities && typeof info.capabilities === 'object')
            ? { ...info.capabilities }
            : {},

        // ---- Loại dữ liệu có thể đọc ----
        canRead: Array.isArray(info.canRead) ? [...info.canRead] : [],

        // ---- Agent được phép ủy thác ----
        canDelegate: Array.isArray(info.canDelegate) ? [...info.canDelegate] : [],

        // ---- [v7.0.1] Special Detector ----
        // Nếu Agent khai báo `specialDetector` là hàm trong agentInfo,
        // copy tham chiếu vào Registry để input-ai.js gọi được.
        // Nếu không khai báo hoặc không phải hàm → null.
        specialDetector: (typeof info.specialDetector === 'function')
            ? info.specialDetector
            : null
    };

    // -----------------------------------------------------------------
    // BƯỚC 4.6: Gộp Intent Patterns vào DynamicIntentPatterns
    // -----------------------------------------------------------------
    if (info.intentPatterns && typeof info.intentPatterns === 'object') {
        for (const [intent, keywords] of Object.entries(info.intentPatterns)) {

            if (!Array.isArray(keywords)) {
                registrationWarnings.push(
                    `Agent "${agentKey}": intent "${intent}" có keywords KHÔNG phải mảng. Bỏ qua.`
                );
                continue;
            }

            const validKeywords = keywords
                .filter(kw => typeof kw === 'string' && kw.trim().length > 0)
                .map(kw => kw.trim());

            if (validKeywords.length === 0) continue;

            // Gộp với keywords cũ (nếu có) và loại trùng
            if (DynamicIntentPatterns[intent]) {
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
// PHẦN 5: LOG TỔNG KẾT
// =====================================================================

if (typeof console !== 'undefined' && console.log) {
    const totalIntents = Object.keys(DynamicIntentPatterns).length;
    const totalSpecialDetectors = Object.values(AgentRegistry.agents)
        .filter(a => typeof a.specialDetector === 'function').length;
    const summaryColor = skippedCount === 0 ? '#8bb8a8' : '#d4a373';

    console.log(
        `%c[AGENT-REGISTRY v7.0.1] Đã đăng ký ${registeredCount} agent` +
        (skippedCount > 0 ? ` (bỏ qua ${skippedCount})` : '') +
        `. Intent patterns: ${totalIntents}. ` +
        `Special detectors: ${totalSpecialDetectors}.`,
        `color: ${summaryColor}; font-weight: bold;`
    );

    if (registrationWarnings.length > 0) {
        console.group('%c[AGENT-REGISTRY] Cảnh báo đăng ký:', 'color: #d4a373; font-weight: bold;');
        registrationWarnings.forEach(w => console.warn('  -', w));
        console.groupEnd();
    }
}

// =====================================================================
// PHẦN 6: CÁC HÀM TIỆN ÍCH CỦA REGISTRY
// =====================================================================

/**
 * Tìm key Agent có khả năng thực thi task cụ thể.
 *
 * @param {string} task - Tên task (VD: 'summarize-work').
 * @returns {string|null}
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
 * @param {string} agentKey
 * @param {string} task
 * @returns {string|null}
 */
AgentRegistry.getMethodName = function (agentKey, task) {
    if (!agentKey || !task) return null;

    const agent = this.agents[agentKey];
    if (!agent || !agent.capabilities) return null;

    return agent.capabilities[task] || null;
};

/**
 * Kiểm tra Agent A có được phép ủy thác cho Agent B không.
 *
 * @param {string} fromAgent
 * @param {string} toAgent
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
 * @param {string} agentKey
 * @returns {Object|null}
 */
AgentRegistry.getAgentInfo = function (agentKey) {
    if (!agentKey) return null;
    return this.agents[agentKey] || null;
};

/**
 * Lấy danh sách tất cả key Agent đã đăng ký.
 *
 * @returns {string[]}
 */
AgentRegistry.getAllAgentKeys = function () {
    return Object.keys(this.agents);
};

/**
 * Kiểm tra tính toàn vẹn của Registry.
 *
 * @returns {{ total, invalid, reasons }}
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
            reasons[key] = 'Không có capability nào.';
            continue;
        }

        // 6.3 — Mỗi method phải tồn tại trên Class
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
        invalid: [...new Set(invalid)],
        reasons
    };
};
