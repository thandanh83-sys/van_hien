/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 8.1.0 (Fix: Multi-Word Phrase Matching)
 * ==========================================================
 * LỊCH SỬ PHIÊN BẢN:
 * - v8.0.0: Special Detector Plugin Architecture.
 * - v8.1.0: SỬA LỖI NGHIÊM TRỌNG — `detectCommand` trước đây dùng
 *           `words.has(kw)` với `words = new Set(text.split(' '))`.
 *           Vì `words` chỉ chứa từ ĐƠN, các keyword CỤM (VD: 'tom tat',
 *           'ai viet', 'tac pham cua', 'y nghia', 'la ai') KHÔNG BAO GIỜ
 *           match được → mọi intent có keyword cụm đều thất bại.
 *           Nay thay bằng `hasPhrase` (regex với word boundary 2 đầu),
 *           match được cả từ đơn và cụm nhiều từ chính xác.
 * ==========================================================
 */

import { extractEntity } from './core.js';
import { preprocessText } from './nlp-tools.js';
import { DynamicIntentPatterns, AgentRegistry } from './agents/index.js';

function result(type, mode, query, extra = {}) {
    return {
        type,
        mode,
        query: String(query || '').trim(),
        questionType: extra.questionType || null,
        confidence: extra.confidence ?? 0.7,
        needsClarification: extra.needsClarification ?? false,
        signals: extra.signals || [],
        originalInput: extra.originalInput || '',
        ...extra
    };
}

// =====================================================================
// PHẦN 2: BỘ PATTERN TRÍCH XUẤT THỰC THỂ (giữ nguyên)
// =====================================================================
const EXTRACTION_PATTERNS = {
    'find-related': [/\b(tac pham|bai tho|bai viet|tieu thuyet|truyen ngan|truyen dai)\b/gi, /\b(nao|gi|chi)\b/gi, /\b(lien quan den|lien quan|tuong tu|giong nhu|giong|tuong dong|cung|gan giong)\b/gi, /\b(voi|den|nhu|toi)\b/gi, /\b(co|cho toi|cho minh|tim|liet ke|ke ten)\b/gi, /\b(the loai|tac gia|chu de)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'list-author-works': [/\b(liet ke|ke ten|thong ke|tim|cho toi|cho minh|xem)\b/gi, /\b(tac pham|bai tho|bai viet|tieu thuyet|truyen ngan|truyen dai|sang tac)\b/gi, /\b(cua|thuoc ve|do)\b/gi, /\b(nhung|nhung tac pham|nhung bai|nhung sang tac)\b/gi, /\b(nao|gi|chi)\b/gi, /\b(viet|sang tac|co)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'find-author-info': [/\b(tieu su|cuoc doi|su nghiep|thong tin|ho so|chan dung|gioi thieu)\b/gi, /\b(cua|ve|cho|noi ve|ke ve)\b/gi, /\b(tac gia|nha tho|nha van|nhan vat)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'find-author-of': [/\b(ai la|ai viet|ai sang tac|la ai|cua ai|nguoi nao|tac gia nao)\b/gi, /\b(tac gia|tac pham)\b/gi, /\b(cua|cho)\b/gi, /\b(la|viet|sang tac)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'summarize-work': [/\b(tom tat|ke lai|trinh bay|noi dung chinh|y chinh)\b/gi, /\b(noi dung|tac pham|bai tho|bai viet|truyen ngan|truyen dai|tieu thuyet)\b/gi, /\b(cua|ve)\b/gi, /\b(cho toi|cho minh|giup)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'analyze-work': [/\b(phan tich|binh giang|cam nhan|danh gia|binh luan|mo xe)\b/gi, /\b(tac pham|bai tho|bai viet|truyen ngan|truyen dai|tieu thuyet|doan tho|doan van)\b/gi, /\b(cua|ve)\b/gi, /\b(cho toi|cho minh|giup)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'recommend': [/\b(goi y|de xuat|nen doc|muon doc|tim|gioi thieu)\b/gi, /\b(tac pham|bai tho|truyen|sach|tho|tieu thuyet)\b/gi, /\b(nao|gi|hay|thu vi)\b/gi, /\b(the loai|chu de|ve)\b/gi, /\b(cho toi|cho minh)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'explain-symbol': [/\b(y nghia|bieu tuong|hinh tuong|hinh anh|tuong trung|an du)\b/gi, /\b(cua|trong|ve)\b/gi, /\b(la gi|the nao|ra sao|nhu the nao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'explain-allusion': [/\b(dien tich|dien co|nguon goc dien|tich cu|dien xua)\b/gi, /\b(cua|ve|trong)\b/gi, /\b(la gi|the nao|ra sao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'define-term': [/\b(dinh nghia|giai thich|khai niem|tim hieu|dinh danh)\b/gi, /\b(la gi|nghia la gi|duoc hieu la gi|co nghia la gi)\b/gi, /\b(tu|thuat ngu|khai niem)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'define-genre': [/\b(dinh nghia|giai thich|khai niem|tim hieu)\b/gi, /\b(the loai|the tho|loai tho)\b/gi, /\b(la gi|the nao|ra sao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'find-works-by-era': [/\b(tac pham|bai tho|truyen|tieu thuyet)\b/gi, /\b(thoi|thuoc thoi|thoi ky|trieu dai|nha)\b/gi, /\b(nao|gi)\b/gi, /\b(co|cho toi|cho minh|tim|liet ke)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'find-authors-by-era': [/\b(tac gia|nha tho|nha van)\b/gi, /\b(thoi|thuoc thoi|thoi ky|trieu dai|nha)\b/gi, /\b(nao|gi|ai)\b/gi, /\b(co|cho toi|cho minh|tim|liet ke)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'get-historical-context': [/\b(viet|sang tac|thuoc|hoat dong)\b/gi, /\b(thoi|thoi ky|trieu dai|nam nao|khi nao)\b/gi, /\b(boi canh|hoan canh|lich su)\b/gi, /\b(la gi|the nao|ra sao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'translate-work': [/\b(dich|translate|chuyen ngu|dich thuat|sang tieng anh|sang tieng viet)\b/gi, /\b(tac pham|bai tho|truyen|tieu thuyet|doan van)\b/gi, /\b(sang|qua|thanh)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'get-character-info': [/\b(nhan vat|character|nhan vat nao|thong tin nhan vat)\b/gi, /\b(trong|thuoc|cua)\b/gi, /\b(tac pham|truyen|bai tho)\b/gi, /\b(la ai|la gi|the nao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'compare-entities': [/\b(so sanh|compare|giua|khac nhau|tuong dong|giong)\b/gi, /\b(va|voi|cung)\b/gi, /\b(tac gia|tac pham|truyen|bai tho)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'praise-work': [/\b(khen|ca ngoi|praise|dep|hay|tuyet voi)\b/gi, /\b(bai tho|tac pham|truyen)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'criticize-work': [/\b(che|phe binh|criticize|han che|do|te|kem)\b/gi, /\b(bai tho|tac pham|truyen)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'default': [/\b(tim|kiem|tra cuu|cho toi|cho minh)\b/gi, /\b(khong|a|nhi|vay)\b/gi]
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
// PHẦN 3: NHẬN DIỆN Ý ĐỊNH (v8.1.0 — MULTI-WORD PHRASE MATCHING)
// =====================================================================

/**
 * [v8.1.0] So khớp phrase trong text với word boundary 2 đầu.
 *
 * Khác với `words.has(kw)` (chỉ match từ đơn), hàm này match được cả
 * cụm nhiều từ: 'tom tat', 'ai viet', 'tac pham cua', 'y nghia'...
 *
 * @param {string} text - Câu đã chuẩn hóa.
 * @param {string} phrase - Keyword cần tìm (từ đơn hoặc cụm).
 * @returns {boolean}
 */
function hasPhrase(text, phrase) {
    if (!phrase || typeof phrase !== 'string') return false;
    const needle = phrase.trim();
    if (!needle) return false;

    // Escape ký tự đặc biệt của regex (nếu có) trong keyword
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Pattern: bắt đầu hoặc khoảng trắng trước, kết thúc hoặc khoảng trắng sau
    // Dùng lookahead (?=\s|$) để không "ăn" luôn khoảng trắng sau
    const pattern = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'u');

    return pattern.test(text);
}

/**
 * [v8.1.0] Nhận diện Intent qua DynamicIntentPatterns.
 *
 * Ưu tiên đặc biệt:
 *   1. 'compare-entities' — cấu trúc "X và Y" HOẶC keyword so sánh.
 *   2. Duyệt DynamicIntentPatterns — match keyword đầu tiên.
 *
 * @param {string} text - Câu đã chuẩn hóa.
 * @returns {string|null}
 */
function detectCommand(text) {
    if (!text) return null;

    const hasAny = (phrases) => phrases.some(p => hasPhrase(text, p));

    // 1. Ưu tiên logic đặc biệt: so sánh cần 2 thực thể
    if (
        hasAny(['so sanh', 'compare', 'khac', 'tuong dong']) ||
        (hasPhrase(text, 'giong') && (hasPhrase(text, 'va') || hasPhrase(text, 'voi')))
    ) {
        return 'compare-entities';
    }

    // 2. Duyệt DynamicIntentPatterns — match phrase (không còn bị lỗi
    //    multi-word keyword không match được)
    for (const [intent, keywords] of Object.entries(DynamicIntentPatterns)) {
        if (keywords.some(kw => hasPhrase(text, kw))) return intent;
    }

    return null;
}

/**
 * Nhận diện câu hỏi chuyên môn qua `specialDetector` của Agent.
 *
 * @param {string} text
 * @returns {string|null}
 */
function detectSpecialQuestion(text) {
    for (const [agentKey, agent] of Object.entries(AgentRegistry.agents)) {
        if (typeof agent.specialDetector !== 'function') continue;
        try {
            const detected = agent.specialDetector(text);
            if (detected && typeof detected === 'string') {
                if (typeof window !== 'undefined' && window.VD_MASTER_DEBUG) {
                    console.log(`[InputAI] Agent "${agentKey}" specialDetector → "${detected}"`);
                }
                return detected;
            }
        } catch (err) {
            console.warn(
                `[InputAI] specialDetector của Agent "${agentKey}" báo lỗi:`,
                err.message || err
            );
        }
    }
    return null;
}

// =====================================================================
// PHẦN 4: INPUT AI - BỘ ĐIỀU PHỐI Ý ĐỊNH ĐẦU VÀO
// =====================================================================

export const InputAI = {
    version: '8.1.0',

    parseIntent(input) {
        const original = String(input || '').trim();
        if (!original) {
            return result('empty', 'empty', '', { confidence: 1, originalInput: original });
        }

        const clean = preprocessText(original);
        if (!clean) {
            return result('empty', 'empty', '', { confidence: 1, originalInput: original });
        }

        // Tầng 1: từ khóa (phrase-aware)
        const command = detectCommand(clean);
        if (command) {
            const query = cleanQuery(clean, command);
            return result(command, 'command', query, {
                confidence: 0.95,
                signals: ['explicit-command', command],
                originalInput: original
            });
        }

        // Tầng 2: specialDetector của Agent
        const special = detectSpecialQuestion(clean);
        if (special) {
            const query = cleanQuery(clean, special);
            return result(special, 'question', query, {
                questionType: special,
                confidence: 0.9,
                signals: ['special-question', special],
                originalInput: original
            });
        }

        // Tầng 3: fallback search
        return result('search', 'search', clean, {
            questionType: null,
            confidence: 0.75,
            signals: ['topic-query'],
            originalInput: original
        });
    }
};
