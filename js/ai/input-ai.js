/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 11.0.0 (Context-Aware Semantic Router)
 * ==========================================================
 * TRIẾT LÝ:
 * - Không chỉ nhận diện từ khóa, mà hiểu ý định (Intent).
 * - Tích hợp MemoryEngine để giải quyết đại từ (nó, ông ấy, tác phẩm này).
 * - Sử dụng Special Detector của từng Agent để xử lý logic phức tạp.
 * ==========================================================
 */

import { preprocessText } from './nlp-tools.js';
import { LANGUAGE_SIGNALS } from './nlp/language-signals.js';
import { INTENT_DEFINITIONS } from './nlp/intent-definitions.js';
import { EntityExtractor } from './nlp/entity-extractor.js';
import { AgentRegistry } from './agents/index.js';
import { MemoryEngine } from './memory-engine.js';

// =====================================================================
// PHẦN 1: HÀM HỖ TRỢ (HELPERS)
// =====================================================================

function result(data) {
    return {
        mode: data.mode || 'search',
        type: data.type || 'search',
        query: String(data.query || '').trim(),
        originalInput: String(data.originalInput || '').trim(),
        normalizedInput: String(data.normalizedInput || '').trim(),
        confidence: data.confidence ?? 0.8,
        signals: data.signals || [],
        entities: data.entities || [],
        questionType: data.questionType || null
    };
}

function hasSignal(text, signalGroup) {
    for (const [key, phrases] of Object.entries(signalGroup)) {
        if (phrases.some(p => text.includes(p))) return key;
    }
    return null;
}

// =====================================================================
// PHẦN 2: INTENT CLASSIFIER (BỘ PHÂN LOẠI Ý ĐỊNH)
// =====================================================================

function detectSpecialQuestion(text) {
    for (const [agentKey, agent] of Object.entries(AgentRegistry.agents)) {
        if (typeof agent.specialDetector === 'function') {
            const detected = agent.specialDetector(text);
            if (detected) return detected;
        }
    }
    return null;
}

function classifyIntent(text, entities) {
    // 1. Ưu tiên tuyệt đối: Special Detector (Từng Agent tự nhận diện)
    const special = detectSpecialQuestion(text);
    if (special) {
        return { intent: special, confidence: 0.9, source: 'special-detector' };
    }

    // 2. Phân tích Hành động & Quan hệ
    const action = hasSignal(text, LANGUAGE_SIGNALS.actions);
    const relation = hasSignal(text, LANGUAGE_SIGNALS.relations);
    const questionType = hasSignal(text, LANGUAGE_SIGNALS.questionTypes);

    // 3. ĐỐI CHIẾU Ý ĐỊNH NGỮ NGHĨA (Semantic Intent Matching)
    if (entities.length > 0) {
        const hasWork = entities.some(e => e.group === 'tinh-hoa');
        const hasAuthor = entities.some(e => e.group === 'ky-tai');
        const hasSymbol = entities.some(e => e.group === 'bieu-tuong' || e.group === 'dien-tich');

        // Câu hỏi Tại sao / Vì sao / Như thế nào -> Phân tích
        if (questionType === 'reason' || questionType === 'method') {
            if (hasWork || hasAuthor) return { intent: 'analyze-work', confidence: 0.9, source: 'semantic-analysis' };
        }

        // Câu hỏi Ý nghĩa / Định nghĩa -> Giải thích
        if (action === 'explain') {
            if (hasSymbol) return { intent: 'explain-symbol', confidence: 0.9, source: 'semantic-symbol' };
            if (hasAuthor) return { intent: 'find-author-info', confidence: 0.9, source: 'semantic-author' };
        }

        // Chỉ nêu tên tác phẩm/tác giả -> Tra cứu
        if (!action && (hasWork || hasAuthor)) {
            return { intent: 'explore', confidence: 0.8, source: 'semantic-lookup' };
        }
    }

    // 4. Fallback: Đối chiếu định nghĩa Intent
    for (const [intentName, def] of Object.entries(INTENT_DEFINITIONS)) {
        let score = 0;
        if (action && def.action === action) score += 2;
        if (relation && def.relation === relation) score += 2;
        if (entities.length > 0) {
            const hasTarget = entities.some(e => e.group === def.targetType || (def.targetType === 'author' && e.group === 'ky-tai') || (def.targetType === 'work' && e.group === 'tinh-hoa'));
            if (hasTarget) score += 1;
        }
        if (score >= 2) return { intent: intentName, confidence: 0.85, source: 'semantic-match' };
    }
    return null;
}

// =====================================================================
// PHẦN 3: INPUT AI - BỘ ĐIỀU PHỐI CHÍNH
// =====================================================================

export const InputAI = {
    version: '11.0.0',

    parseIntent(input) {
        const original = String(input || '').trim();
        if (!original) return result({ mode: 'empty', type: 'empty', originalInput: original });

        // 1. Tiền xử lý (Xóa dấu, sửa teencode, lọc stopwords)
        const clean = preprocessText(original);
        if (!clean) return result({ mode: 'empty', type: 'empty', originalInput: original });

        // 2. [KÝ ỨC] Kiểm tra ngữ cảnh từ câu hỏi trước đó
        const context = MemoryEngine.resolveContext(clean);
        
        // 3. Trích xuất Thực thể (Entities)
        let entities = EntityExtractor.extract(clean);

        // [KÝ ỨC] Nếu phát hiện đại từ ("nó", "ông ấy"), thay thế bằng thực thể cũ
        if (context && context.targetEntity) {
            const meta = EntityExtractor.resolveEntity(context.targetEntity);
            if (meta && !entities.some(e => e.id === meta.id)) {
                entities.push(meta);
                console.log(`[MEMORY] Đã giải quyết đại từ -> ${context.targetEntity}`);
            }
        }

        // 4. Phân loại Intent
        const classification = classifyIntent(clean, entities);

        // 5. Xây dựng Query (Nếu có entity, query là tên thực thể, ngược lại giữ nguyên)
        let query = original;
        if (classification && entities.length > 0) {
            query = entities.map(e => e.name).join(' và ');
        }

        // 6. Trả về kết quả
        if (classification) {
            const def = INTENT_DEFINITIONS[classification.intent];
            return result({
                mode: def ? def.mode : 'ask',
                type: classification.intent,
                query: query,
                originalInput: original,
                normalizedInput: clean,
                entities: entities,
                confidence: classification.confidence,
                signals: [classification.source]
            });
        }

        // 7. Fallback (Search)
        return result({
            mode: 'search',
            type: 'search',
            query: original,
            originalInput: original,
            normalizedInput: clean,
            entities: entities,
            confidence: 0.8
        });
    }
};
