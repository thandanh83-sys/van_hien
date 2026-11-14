/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 10.0.0 (Semantic Intent Router)
 * ==========================================================
 */

import { preprocessText } from './nlp-tools.js';
import { LANGUAGE_SIGNALS } from './nlp/language-signals.js';
import { INTENT_DEFINITIONS } from './nlp/intent-definitions.js';
import { EntityExtractor } from './nlp/entity-extractor.js';
import { AgentRegistry } from './agents/index.js';

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
    // 1. Ưu tiên tuyệt đối: Special Detector
    const special = detectSpecialQuestion(text);
    if (special) {
        return { intent: special, confidence: 0.9, source: 'special-detector' };
    }

    // 2. Phân tích Hành động & Quan hệ
    const action = hasSignal(text, LANGUAGE_SIGNALS.actions);
    const relation = hasSignal(text, LANGUAGE_SIGNALS.relations);
    const questionType = hasSignal(text, LANGUAGE_SIGNALS.questionTypes);

    // 3. Đối chiếu Intent
    for (const [intentName, def] of Object.entries(INTENT_DEFINITIONS)) {
        let score = 0;
        if (action && def.action === action) score += 2;
        if (relation && def.relation === relation) score += 2;
        if (questionType && def.action === 'explain') score += 1;

        if (entities.length > 0) {
            const hasTarget = entities.some(e => e.group === def.targetType || 
                (def.targetType === 'author' && e.group === 'ky-tai') ||
                (def.targetType === 'work' && e.group === 'tinh-hoa')
            );
            if (hasTarget) score += 1;
        }

        if (score >= 2) {
            return { intent: intentName, confidence: 0.85, source: 'semantic-match' };
        }
    }
    return null;
}

// =====================================================================
// PHẦN 3: INPUT AI - BỘ ĐIỀU PHỐI CHÍNH
// =====================================================================

export const InputAI = {
    version: '10.0.0',

    parseIntent(input) {
        const original = String(input || '').trim();
        if (!original) return result({ mode: 'empty', type: 'empty', originalInput: original });

        // 1. Chuẩn hóa văn bản
        const clean = preprocessText(original);
        if (!clean) return result({ mode: 'empty', type: 'empty', originalInput: original });

        // 2. Trích xuất Thực thể (Entities)
        const entities = EntityExtractor.extract(clean);

        // 3. Phân loại Intent
        const classification = classifyIntent(clean, entities);

        // 4. Xây dựng Query
        let query = original;
        if (classification && entities.length > 0) {
            query = entities.map(e => e.name).join(' và ');
        }

        // 5. Trả về kết quả
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

        // 6. Fallback (Search)
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
