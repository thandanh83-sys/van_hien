/**
 * ==========================================================
 * VĂN ĐẠO AI - INTENT DEFINITIONS (js/ai/nlp/intent-definitions.js)
 * Vị trí: js/ai/nlp/intent-definitions.js
 * ==========================================================
 * MỤC ĐÍCH:
 * - Thay thế EXTRACTION_PATTERNS bằng định nghĩa ngữ nghĩa.
 * - Ánh xạ: Hành động (Action) + Đối tượng (TargetType) -> Intent.
 * ==========================================================
 */

export const INTENT_DEFINITIONS = {
    // === NHÓM VĂN HỌC (Literature) ===
    'summarize-work': {
        mode: 'ask',
        action: 'summarize',
        targetType: 'work',
        agent: 'literature'
    },
    'find-author-of': {
        mode: 'ask', // Hỏi tác giả của tác phẩm
        action: 'find',
        targetType: 'author',
        agent: 'literature'
    },
    'recommend': {
        mode: 'ask',
        action: 'recommend',
        targetType: 'work',
        agent: 'literature'
    },
    'define-genre': {
        mode: 'ask',
        action: 'explain',
        targetType: 'genre',
        agent: 'literature'
    },

    // === NHÓM THI PHÁP (Poetics) ===
    'explain-symbol': {
        mode: 'ask',
        action: 'explain',
        targetType: 'symbol',
        agent: 'poetics'
    },
    'explain-allusion': {
        mode: 'ask',
        action: 'explain',
        targetType: 'allusion',
        agent: 'poetics'
    },
    'define-term': {
        mode: 'ask',
        action: 'explain',
        targetType: 'term',
        agent: 'poetics'
    },

    // === NHÓM TRI THỨC (Knowledge) ===
    'find-related': {
        mode: 'search', // Tìm kiếm danh sách
        action: 'find',
        targetType: 'work',
        relation: 'related_to',
        agent: 'knowledge'
    },
    'find-author-info': {
        mode: 'ask',
        action: 'explain',
        targetType: 'author',
        agent: 'knowledge'
    },
    'list-author-works': {
        mode: 'search',
        action: 'list',
        targetType: 'work',
        relation: 'written_by',
        agent: 'knowledge'
    },

    // === NHÓM PHÂN TÍCH (Analysis) ===
    'analyze-work': {
        mode: 'ask',
        action: 'analyze',
        targetType: 'work',
        agent: 'analysis'
    },

    // === NHÓM LỊCH SỬ (History) ===
    'find-works-by-era': {
        mode: 'search',
        action: 'find',
        targetType: 'work',
        relation: 'belongs_to_era',
        agent: 'history'
    },
    'find-authors-by-era': {
        mode: 'search',
        action: 'find',
        targetType: 'author',
        relation: 'belongs_to_era',
        agent: 'history'
    },
    'get-historical-context': {
        mode: 'ask',
        action: 'explain',
        targetType: 'era',
        agent: 'history'
    },

    // === NHÓM DỊCH THUẬT (Translation) ===
    'translate-work': {
        mode: 'ask',
        action: 'translate',
        targetType: 'work',
        agent: 'translation'
    },

    // === NHÓM NHÂN VẬT (Character) ===
    'get-character-info': {
        mode: 'ask',
        action: 'explain',
        targetType: 'character',
        agent: 'character'
    },

    // === NHÓM SO SÁNH (Comparison) ===
    'compare-entities': {
        mode: 'ask',
        action: 'compare',
        targetType: 'entity',
        agent: 'comparison'
    },

    // === NHÓM ĐÁNH GIÁ (Praiser / Critic) ===
    'praise-work': {
        mode: 'ask',
        action: 'praise',
        targetType: 'work',
        agent: 'praiser'
    },
    'criticize-work': {
        mode: 'ask',
        action: 'criticize',
        targetType: 'work',
        agent: 'critic'
    }
};
