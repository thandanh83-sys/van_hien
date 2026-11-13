/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 5.2.0 (Semantic Parser & Expanded Agents)
 * ==========================================================
 * NHIỆM VỤ:
 * 1. Nhận diện câu hỏi, mệnh lệnh, tìm kiếm.
 * 2. Trích xuất thực thể.
 * 3. Hỗ trợ các câu hỏi về Lịch sử, Dịch thuật, Nhân vật.
 * ==========================================================
 */

import { extractEntity } from './core.js';
import { preprocessText } from './nlp-tools.js'; // [MỚI] Gọi thư viện NLP

// =====================================================================
// PHẦN 1: CÔNG CỤ XỬ LÝ NGÔN NGỮ (Đã chuyển sang nlp-tools.js)
// =====================================================================
// Các hàm basicNormalize, removeTrailingParticles, ... đã được dọn dẹp.

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
// PHẦN 2: BỘ PATTERN TRÍCH XUẤT THỰC THỂ (ENTITY EXTRACTION)
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
    
    // [MỚI] Pattern cho Dịch thuật
    'translate-work': [
        /\b(dich|translate|chuyen ngu|dich thuat|sang tieng anh|sang tieng viet)\b/gi,
        /\b(tac pham|bai tho|truyen|tieu thuyet|doan van)\b/gi,
        /\b(sang|qua|thanh)\b/gi,
        /\b(khong|a|nhi|vay)\b/gi
    ],
    // [MỚI] Pattern cho Nhân vật
    'get-character-info': [
        /\b(nhan vat|character|nhan vat nao|thong tin nhan vat)\b/gi,
        /\b(trong|thuoc|cua)\b/gi,
        /\b(tac pham|truyen|bai tho)\b/gi,
        /\b(la ai|la gi|the nao)\b/gi,
        /\b(khong|a|nhi|vay)\b/gi
    ],

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
// PHẦN 3: NHẬN DIỆN Ý ĐỊNH (BAG OF WORDS)
// =====================================================================

function detectCommand(text) {
    const words = new Set(text.split(' '));
    const hasAny = (arr) => arr.some(w => words.has(w));
    const hasAll = (arr) => arr.every(w => words.has(w));

    // 1. NHÓM LỊCH SỬ
    if (hasAny(['thoi', 'ky', 'trieu', 'nha']) && hasAny(['tac', 'pham', 'bai'])) return 'find-works-by-era';
    if (hasAny(['thoi', 'ky', 'trieu', 'nha']) && hasAny(['tac', 'gia', 'nha', 'tho', 'van'])) return 'find-authors-by-era';
    if (hasAny(['viet', 'sang', 'tac', 'thuoc', 'hoat']) && hasAny(['thoi', 'ky', 'nao', 'bao'])) return 'get-historical-context';

    // 2. NHÓM DỊCH THUẬT [MỚI]
    if (hasAny(['dich', 'translate', 'chuyen', 'ngu', 'dich thuat'])) return 'translate-work';

    // 3. NHÓM NHÂN VẬT [MỚI]
    if (hasAny(['nhan vat', 'character'])) return 'get-character-info';
    // Phân biệt "Ai là tác giả" vs "Thúy Kiều là ai"
    if (hasAny(['ai la']) && !hasAny(['tac gia', 'viet', 'sang tac'])) {
        return 'get-character-info';
    }

    // 4. NHÓM MẠNG LƯỚI TRI THỨC
    if (hasAny(['giong', 'tuong', 'lien', 'quan']) && hasAny(['tac', 'pham', 'bai', 'truyen'])) return 'find-related';
    if (hasAll(['tac', 'pham']) && hasAny(['cua', 'gi', 'nao'])) return 'list-author-works';

    // 5. NHÓM HÀNH ĐỘNG VĂN HỌC
    if (hasAny(['phan', 'tich', 'binh', 'giang', 'danh', 'gia', 'cam', 'nhan'])) return 'analyze-work';
    if (hasAny(['tom', 'tat', 'noi', 'dung', 'ke', 'lai'])) return 'summarize-work';
    if (hasAny(['goi', 'y', 'de', 'xuat', 'nen', 'doc', 'muon'])) return 'recommend';

    // 6. NHÓM TÁC GIẢ
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
// PHẦN 4: INPUT AI - BỘ ĐIỀU PHỐI Ý ĐỊNH ĐẦU VÀO
// =====================================================================

export const InputAI = {
    parseIntent(input) {
        const original = String(input || '').trim();
        if (!original) return result('empty', 'empty', '', { confidence: 1, originalInput: original });

        // 1. Chuẩn hóa bằng thư viện NLP (Bỏ dấu, teencode, sửa lỗi...)
        let clean = preprocessText(original);
        if (!clean) return result('empty', 'empty', '', { confidence: 1, originalInput: original });

        // 2. Nhận diện Mệnh lệnh
        const command = detectCommand(clean);
        if (command) {
            const query = cleanQuery(clean, command);
            return result(command, 'command', query, { confidence: 0.95, signals: ['explicit-command', command], originalInput: original });
        }

        // 3. Nhận diện Câu hỏi Chuyên môn
        const special = detectSpecialQuestion(clean);
        if (special) {
            const query = cleanQuery(clean, special);
            return result(special, 'question', query, { questionType: special, confidence: 0.9, signals: ['special-question', special], originalInput: original });
        }

        // 4. Fallback: Tìm kiếm thông thường
        return result('search', 'search', clean, { questionType: null, confidence: 0.75, signals: ['topic-query'], originalInput: original });
    }
};
