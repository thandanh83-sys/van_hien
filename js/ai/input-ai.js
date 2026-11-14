/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 10.0.0 (Semantic Intent Router)
 * ==========================================================
 * NHIỆM VỤ:
 * 1. Nhận diện câu hỏi thô thành Intent (Ý định).
 * 2. Phân biệt rõ ràng 2 chế độ (Mode): Search vs Ask.
 * 3. Sử dụng kiến trúc Semantic (Hành động + Thực thể) thay vì Regex.
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

/**
 * Kiểm tra câu có chứa cụm từ tín hiệu nào không.
 */
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
    // 1. Kiểm tra các mẫu câu hỏi đặc biệt (Dùng Special Detector của Agent)
    for (const [agentKey, agent] of Object.entries(AgentRegistry.agents)) {
        if (typeof agent.specialDetector === 'function') {
            const detected = agent.specialDetector(text);
            if (detected) return detected;
        }
    }
    return null;
}

function classifyIntent(text, entities) {
    // 1. Ưu tiên tuyệt đối: Special Detector (VD: "X là ai")
    const special = detectSpecialQuestion(text);
    if (special) {
        return { intent: special, confidence: 0.9, source: 'special-detector' };
    }

    // 2. Phân tích dựa trên Hành động (Action) và Quan hệ (Relation)
    const action = hasSignal(text, LANGUAGE_SIGNALS.actions);
    const relation = hasSignal(text, LANGUAGE_SIGNALS.relations);
    const questionType = hasSignal(text, LANGUAGE_SIGNALS.questionTypes);

    // 3. Đối chiếu với INTENT_DEFINITIONS
    for (const [intentName, def] of Object.entries(INTENT_DEFINITIONS)) {
        let score = 0;

        // Khớp Action
        if (action && def.action === action) score += 2;
        
        // Khớp Relation
        if (relation && def.relation === relation) score += 2;

        // Khớp QuestionType (VD: "la gi" -> definition)
        if (questionType && def.action === 'explain') score += 1;

        // Khớp TargetType (dựa trên EntityExtractor)
        // VD: Câu hỏi có chứa Tác giả -> targetType: 'author'
        if (entities.length > 0) {
            const hasTarget = entities.some(e => e.group === def.targetType || 
                (def.targetType === 'author' && e.group === 'ky-tai') ||
                (def.targetType === 'work' && e.group === 'tinh-hoa')
            );
            if (hasTarget) score += 1;
        }

        // Nếu đạt đủ điểm, chọn Intent này
        if (score >= 2) {
            return { intent: intentName, confidence: 0.85, source: 'semantic-match' };
        }
    }

    // 4. Fallback: Nếu không khớp bất kỳ Intent nào
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

        // 1. Chuẩn hóa văn bản (Bỏ dấu, xóa dấu câu, sửa lỗi fuzzy)
        const clean = preprocessText(original);
        if (!clean) return result({ mode: 'empty', type: 'empty', originalInput: original });

        // 2. Trích xuất Thực thể (Entities)
        const entities = EntityExtractor.extract(clean);

        // 3. Phân loại Intent
        const classification = classifyIntent(clean, entities);

        // 4. Xây dựng Query (Dựa trên Entity hoặc Câu gốc)
        let query = original;
        if (classification && entities.length > 0) {
            // Nếu là câu hỏi (Ask), ưu tiên lấy tên thực thể chính làm query
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
