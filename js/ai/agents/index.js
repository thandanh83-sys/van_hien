/**
 * ==========================================================
 * VĂN ĐẠO AI — AGENTS INDEX
 * Vị trí: js/ai/agents/index.js
 * Version: 8.0.0 (Contemplative Agents — No Scoring)
 * ==========================================================
 *
 * ⚠️⚠️⚠️ QUAN TRỌNG — ĐỌC TRƯỚC KHI IMPORT ⚠️⚠️⚠️
 *
 * File này import 2 agents mới:
 *   - ./khuc-tan-thuong.js  (ĐÃ CÓ — thay thế praiser.js)
 *   - ./goi-mo.js           (CHƯA CÓ — thay thế critic.js)
 *
 * Nếu chưa tạo ./goi-mo.js, hãy tạo nó trước khi import file này.
 * Nếu không, sẽ có lỗi:
 *   "Failed to resolve module specifier './goi-mo.js'"
 *
 * Xem spec ./goi-mo.js trong MASTER PLAN (Phần 1.4).
 *
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
 * 3. HỖ TRỢ SPECIAL DETECTOR:
 *    Mỗi Agent có thể khai báo `specialDetector(text) => intent | null`
 *    trong `agentInfo`. Hàm này được copy vào `AgentRegistry.agents[key]`
 *    để `input-ai.js` gọi khi cần logic nhận diện đặc biệt.
 *
 * 4. LOG CHÍNH XÁC TÊN AGENT:
 *    Ưu tiên dùng `info.key` để log tên thật (VD: "Agent[literature]").
 *
 * 5. KHÔNG CHẤM ĐIỂM VĂN CHƯƠNG (v8.0.0):
 *    - `praiser.js`     → thay bằng `khuc-tan-thuong.js`
 *    - `critic.js`      → thay bằng `goi-mo.js`
 *    - Cả 2 agent mới đều KHÔNG chấm điểm, chỉ gợi mở / tán thưởng.
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
// PHẦN 1: IMPORT 11 AGENT (v8.0.0)
// =====================================================================
// LƯU Ý v8.0.0:
// - Đã THAY THẾ praiser.js → khuc-tan-thuong.js
// - Đã THAY THẾ critic.js  → goi-mo.js
// - Tổng số agent vẫn là 11 (không đổi)
// =====================================================================

import { LiteratureAgent }      from './literature.js';
import { PoeticsAgent }         from './poetics.js';
import { AnalysisAgent }        from './analysis.js';
import { FortuneAgent }         from './fortune.js';
import { KnowledgeAgent }       from './knowledge.js';
import { HistoryAgent }         from './history.js';
import { TranslationAgent }     from './translation.js';
import { CharacterAgent }       from './character.js';
import { ComparisonAgent }      from './comparison.js';

// ---- Agents mới (v8.0.0) ----
import { KhucTanThuongAgent }   from './khuc-tan-thuong.js';  // THAY praiser.js
import { GoiMoAgent }           from './goi-mo.js';           // THAY critic.js

// =====================================================================
// PHẦN 2: DANH SÁCH CLASS (CHỈ REFERENCE, KHÔNG METADATA)
// =====================================================================
// Đây là nơi DUY NHẤT cần sửa khi thêm Agent mới (sau khi đã import).
// =====================================================================

const AGENT_CLASSES = [
    // ---- Nhóm Văn học & Tri thức ----
    LiteratureAgent,      // key: 'literature'    — Tác phẩm, Tác giả, Thể loại
    PoeticsAgent,         // key: 'poetics'       — Từ điển, Biểu tượng, Điển tích
    KnowledgeAgent,       // key: 'knowledge'     — Mạng lưới (Tác giả ↔ Tác phẩm)
    HistoryAgent,         // key: 'history'       — Bối cảnh lịch sử, Thời đại

    // ---- Nhóm Phân tích & Cảm thụ ----
    AnalysisAgent,        // key: 'analysis'      — Phân tích 4 tầng thi pháp
    KhucTanThuongAgent,   // key: 'khuc-tan-thuong' — Tán thưởng (thay praiser)
    GoiMoAgent,           // key: 'goi-mo'        — Gợi mở (thay critic)

    // ---- Nhóm Thực thể & So sánh ----
    CharacterAgent,       // key: 'character'     — Nhân vật văn học
    ComparisonAgent,      // key: 'comparison'    — So sánh 2 thực thể
    TranslationAgent,     // key: 'translation'   — Dịch thuật

    // ---- Nhóm Vận khí ----
    FortuneAgent          // key: 'fortune'       — Bói thơ, Nên/Tránh
];

// =====================================================================
// PHẦN 3: KHO CHỨA CÔNG KHAI (PUBLIC STORES)
// =====================================================================

/**
 * Bản đồ key -> Agent Class.
 * Ví dụ: AgentMap['khuc-tan-thuong'] === KhucTanThuongAgent
 */
export const AgentMap = {};

/**
 * Sổ đăng ký năng lực của từng Agent.
 * Cấu trúc: { [key]: { id, key, name, description, capabilities,
 *                       canRead, canDelegate, specialDetector } }
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
    const info = AgentClass.agentInfo;

    // Ưu tiên `info.key` để log tên thật (VD: "Agent[literature]")
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

        // ---- Special Detector (nếu có) ----
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
        `%c[AGENT-REGISTRY v8.0.0] Đã đăng ký ${registeredCount} agent` +
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

    // Thông báo đặc biệt về sự thay đổi agent (v8.0.0)
    console.log(
        `%c[TRIẾT LÝ VĂN ĐẠO] Không chấm điểm văn chương. ` +
        `Mỗi bài thơ đều có hồn, nét đẹp riêng.`,
        'color: #c9a96e; font-style: italic; font-weight: bold;'
    );
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

// =====================================================================
// PHẦN 7: GHI CHÚ CHO NGƯỜI BẢO TRÌ
// =====================================================================
/**
 * SAU KHI ĐỔI SANG v8.0.0, CÁC FILE SAU CẦN ĐƯỢC CẬP NHẬT:
 *
 * 1. js/ai/master.js
 *    - Dòng `AgentMap['praiser']`  → `AgentMap['khuc-tan-thuong']`
 *    - Dòng `AgentMap['critic']`   → `AgentMap['goi-mo']`
 *
 * 2. js/ai/agents/fortune.js
 *    - Import `PraiserAgent`       → `KhucTanThuongAgent`
 *    - Import `CriticAgent`        → `GoiMoAgent`
 *    - Dòng `PraiserAgent.getQuickComment` → `KhucTanThuongAgent.getQuickComment`
 *    - Dòng `CriticAgent.getQuickComment`  → `GoiMoAgent.getQuickComment`
 *
 * 3. js/ai/agents/analysis.js
 *    - Import `PraiserAgent`       → `KhucTanThuongAgent`
 *    - Import `CriticAgent`        → `GoiMoAgent`
 *    - Dòng `PraiserAgent.analyze` → `KhucTanThuongAgent.analyze`
 *    - Dòng `CriticAgent.analyze`  → `GoiMoAgent.analyze`
 *
 * 4. data/manifests/agents-manifest.json
 *    - Chạy: `python tools/update_manifests.py` để tự động cập nhật.
 *
 * 5. data/manifests/static-assets.json
 *    - Chạy: `python tools/update_manifests.py` để tự động cập nhật.
 *
 * 6. sw.js
 *    - Tăng `CACHE_VERSION` (VD: v14.2.0 → v15.0.0)
 *    - Vì đây là thay đổi lớn (breaking change).
 *
 * =====================================================================
 */
