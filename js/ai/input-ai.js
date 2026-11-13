/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 5.1.0 (Clean Router Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Nhận câu hỏi thô từ người dùng.
 * - Gọi thư viện NLP Tools để làm sạch.
 * - Phân tích ý định (Intent) và chuyển giao cho Master AI.
 * ==========================================================
 */

import { extractEntity } from './core.js';
import { preprocessText } from './nlp-tools.js'; // Gọi thư viện NLP

// =====================================================================
// BỘ PATTERN TRÍCH XUẤT THỰC THỂ
// =====================================================================
const EXTRACTION_PATTERNS = {
    // ... (Giữ nguyên toàn bộ EXTRACTION_PATTERNS của bản cũ)
};

function cleanQuery(text, intentType = 'default') {
    let result = text;
    const patterns = EXTRACTION_PATTERNS[intentType] || EXTRACTION_PATTERNS['default'];
    
    if (patterns.length) {
        try { result = extractEntity(text, patterns) || text; } 
        catch (error) { console.warn('[InputAI] Entity extraction error:', error); }
    }
    
    return String(result)
        .replace(/^[\s,.:;!?'"“”‘’()[\]{}]+/, '')
        .replace(/[\s,.:;!?'"“”‘’()[\]{}]+$/, '')
        .replace(/\s+(nao|gi|the|vay)$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// =====================================================================
// NHẬN DIỆN Ý ĐỊNH (BAG OF WORDS)
// =====================================================================

function detectIntent(text) {
    const words = new Set(text.split(' '));
    const hasAny = (arr) => arr.some(w => words.has(w));
    const hasAll = (arr) => arr.every(w => words.has(w));

    if (hasAny(['thoi', 'ky', 'trieu', 'nha']) && hasAny(['tac', 'pham', 'bai'])) return 'find-works-by-era';
    if (hasAny(['thoi', 'ky', 'trieu', 'nha']) && hasAny(['tac', 'gia', 'nha', 'tho', 'van'])) return 'find-authors-by-era';
    if (hasAny(['viet', 'sang', 'tac', 'thuoc', 'hoat']) && hasAny(['thoi', 'ky', 'nao', 'bao'])) return 'get-historical-context';
    if (hasAny(['giong', 'tuong', 'lien', 'quan']) && hasAny(['tac', 'pham', 'bai', 'truyen'])) return 'find-related';
    if (hasAll(['tac', 'pham']) && hasAny(['cua', 'gi', 'nao'])) return 'list-author-works';
    if (hasAny(['phan', 'tich', 'binh', 'giang', 'danh', 'gia', 'cam', 'nhan'])) return 'analyze-work';
    if (hasAny(['tom', 'tat', 'noi', 'dung', 'ke', 'lai'])) return 'summarize-work';
    if (hasAny(['goi', 'y', 'de', 'xuat', 'nen', 'doc', 'muon'])) return 'recommend';
    if (hasAny(['ai', 'viet', 'sang', 'tac', 'cua'])) {
        if (hasAny(['tac', 'pham', 'truyen', 'bai', 'tho'])) return 'find-author-of';
        if (hasAny(['tieu', 'su', 'cuoc', 'doi', 'thong', 'tin'])) return 'find-author-info';
    }
    return null;
}

function detectSpecialQuestion(text) {
    const words = new Set(text.split(' '));
    const hasAny = (arr) => arr.some(w => words.has(w));

    if (hasAny(['bieu', 'tuong', 'hinh', 'anh', 'y', 'nghia'])) return 'explain-symbol';
    if (hasAny(['dien', 'tich', 'co', 'nguon', 'goc'])) return 'explain-allusion';
    if (hasAny(['dinh', 'nghia', 'khai', 'niem', 'thuat', 'ngu'])) return 'define-term';
    if (hasAny(['the', 'loai', 'the', 'tho'])) return 'define-genre';
    return null;
}

// =====================================================================
// API CÔNG KHAI
// =====================================================================

export const InputAI = {
    parseIntent(input) {
        const original = String(input || '').trim();
        if (!original) return { type: 'empty', mode: 'empty', originalInput: original };

        // 1. Giao phó việc làm sạch cho thư viện NLP
        let clean = preprocessText(original);
        if (!clean) return { type: 'empty', mode: 'empty', originalInput: original };

        // 2. Nhận diện ý định
        const intentType = detectIntent(clean);
        if (intentType) {
            return { type: intentType, mode: 'command', query: cleanQuery(clean, intentType), confidence: 0.95, originalInput: original };
        }

        const specialType = detectSpecialQuestion(clean);
        if (specialType) {
            return { type: specialType, mode: 'question', query: cleanQuery(clean, specialType), confidence: 0.9, originalInput: original };
        }

        // 3. Fallback
        return { type: 'search', mode: 'search', query: clean, confidence: 0.75, originalInput: original };
    }
};
