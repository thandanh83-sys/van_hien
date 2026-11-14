/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 9.0.0 (Intent Router Architecture)
 * ==========================================================
 *
 * NHIỆM VỤ:
 * 1. Nhận diện câu hỏi thô thành Intent (Ý định).
 * 2. Phân biệt rõ ràng 2 chế độ (Mode):
 *    - mode: 'search' (Tra cứu) - Khi người dùng chỉ gõ tên thực thể.
 *    - mode: 'ask' (Hỏi Đạo) - Khi người dùng đặt câu hỏi hoặc ra lệnh.
 * 3. Sử dụng `hasPhrase` với Regex ranh giới từ (word boundary) để
 *    nhận diện chính xác các cụm từ khóa (VD: "la ai", "tom tat").
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v8.1.0: Fix lỗi multi-word keyword.
 * - v9.0.0: Áp dụng cấu trúc IntentRouter.
 *           - Trả về object chuẩn { mode, type, query, originalInput, ... }.
 *           - Tích hợp logic ưu tiên: Command -> Special Question -> Search.
 * ==========================================================
 */

import { extractEntity } from './core.js';
import { preprocessText } from './nlp-tools.js';
import { DynamicIntentPatterns, AgentRegistry } from './agents/index.js';

// =====================================================================
// PHẦN 1: CÔNG CỤ XỬ LÝ NGÔN NGỮ & KẾT QUẢ
// =====================================================================

/**
 * Hàm tạo object kết quả chuẩn (Intent Result).
 */
function createResult(data) {
    return {
        mode: data.mode || 'search',          // 'search' | 'ask' | 'empty'
        type: data.type || 'search',          // Intent Type (dùng cho MasterAI)
        query: String(data.query || '').trim(), // Thực thể trích xuất được
        originalInput: String(data.originalInput || '').trim(),
        normalizedInput: String(data.normalizedInput || '').trim(),
        confidence: data.confidence ?? 0.8,
        needsClarification: data.needsClarification ?? false,
        signals: data.signals || [],
        questionType: data.questionType || null
    };
}

// =====================================================================
// PHẦN 2: BỘ PATTERN TRÍCH XUẤT THỰC THỂ (ENTITY EXTRACTION)
// =====================================================================
// Giữ nguyên từ v8.x — không thay đổi.
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
// PHẦN 3: INTENT ROUTER (TỰ ĐỘNG NHẬN DIỆN)
// =====================================================================

/**
 * Hàm so khớp cụm từ (Phrase Matching).
 * Sử dụng Regex để đảm bảo tính chính xác của ranh giới từ.
 * 
 * @param {string} text - Câu đã chuẩn hóa (không dấu, không dấu câu).
 * @param {string} phrase - Cụm từ khóa cần tìm.
 * @returns {boolean}
 */
function hasPhrase(text, phrase) {
    if (!phrase || typeof phrase !== 'string') return false;
    const needle = phrase.trim();
    if (!needle) return false;

    // Escape các ký tự đặc biệt trong Regex (nếu có)
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Tìm từ khóa nằm giữa khoảng trắng hoặc đầu/cuối chuỗi
    const pattern = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'u');
    return pattern.test(text);
}

/**
 * Tầng 1: Nhận diện Intent qua từ khóa (DynamicIntentPatterns).
 */
function detectCommand(text) {
    if (!text) return null;
    const hasAny = (phrases) => phrases.some(p => hasPhrase(text, p));

    // 1. Ưu tiên logic so sánh
    if (hasAny(['so sanh', 'compare', 'khac', 'tuong dong']) || 
        (hasPhrase(text, 'giong') && (hasPhrase(text, 'va') || hasPhrase(text, 'voi')))) {
        return 'compare-entities';
    }

    // 2. Duyệt qua từ điển Intent
    for (const [intent, keywords] of Object.entries(DynamicIntentPatterns)) {
        if (keywords.some(kw => hasPhrase(text, kw))) {
            return intent;
        }
    }
    return null;
}

/**
 * Tầng 2: Nhận diện Câu hỏi Chuyên môn qua `specialDetector`.
 */
function detectSpecialQuestion(text) {
    // Duyệt qua tất cả Agent đã đăng ký
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
            console.warn(`[InputAI] specialDetector của Agent "${agentKey}" báo lỗi:`, err);
        }
    }
    return null;
}

// =====================================================================
// PHẦN 4: INPUT AI - BỘ ĐIỀU PHỐI Ý ĐỊNH ĐẦU VÀO
// =====================================================================

export const InputAI = {
    version: '9.0.0',

    /**
     * Phân tích câu hỏi thô và trả về đối tượng Intent chuẩn.
     * 
     * @param {string} input - Câu hỏi thô.
     * @returns {Object} - { mode, type, query, originalInput, ... }
     */
    parseIntent(input) {
        const original = String(input || '').trim();
        
        if (!original) {
            return createResult({ mode: 'empty', type: 'empty', query: '', originalInput: original, confidence: 1 });
        }

        // 1. Chuẩn hóa văn bản (Bỏ dấu, xóa dấu câu)
        const clean = preprocessText(original);
        if (!clean) {
            return createResult({ mode: 'empty', type: 'empty', query: '', originalInput: original, confidence: 1 });
        }

        // 2. Tầng 1: Thử nhận diện qua từ khóa (Command)
        const command = detectCommand(clean);
        if (command) {
            const query = cleanQuery(clean, command);
            return createResult({
                mode: 'ask', // Đã là lệnh -> Hỏi Đạo
                type: command,
                query: query,
                originalInput: original,
                normalizedInput: clean,
                confidence: 0.95,
                signals: ['explicit-command', command]
            });
        }

        // 3. Tầng 2: Thử nhận diện qua Special Detector (VD: "X là ai")
        const special = detectSpecialQuestion(clean);
        if (special) {
            const query = cleanQuery(clean, special);
            return createResult({
                mode: 'ask',
                type: special,
                query: query,
                originalInput: original,
                normalizedInput: clean,
                confidence: 0.90,
                signals: ['special-question', special],
                questionType: special
            });
        }

        // 4. Tầng 3: Fallback (Search)
        // Không có từ khóa hỏi -> Chế độ Tìm kiếm.
        // Lưu ý: Truyền `original` để Search Engine tìm literal.
        return createResult({
            mode: 'search',
            type: 'search',
            query: original,
            originalInput: original,
            normalizedInput: clean,
            confidence: 0.80,
            signals: ['topic-query']
        });
    }
};
