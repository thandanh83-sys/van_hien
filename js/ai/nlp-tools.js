/**
 * ==========================================================
 * VĂN ĐẠO AI - NLP TOOLS (js/ai/nlp-tools.js)
 * Vị trí: js/ai/nlp-tools.js
 * Version: 1.2.0 (Fix: Diacritic Stripping với NFD)
 * ==========================================================
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.1.0: Advanced NLP (Teencode, fuzzy, segment).
 * - v1.2.0: SỬA LỖI NGHIÊM TRỌNG — `basicNormalize` dùng NFC
 *           khiến dấu tiếng Việt KHÔNG được bỏ (vì NFC dựng sẵn
 *           ký tự, không còn combining marks để regex xóa).
 *           Đổi sang NFD: phân rã ký tự thành base + combining,
 *           rồi xóa combining → bỏ dấu đúng cách.
 * ==========================================================
 */

import { MathUtils } from './math-utils.js';

const TEENCODE_MAP = {
    'ko': 'khong', 'k': 'khong', 'hok': 'khong', 'hem': 'khong', 'kg': 'khong',
    'dc': 'duoc', 'dk': 'duoc', 'đc': 'duoc', 'dkm': 'duoc',
    'sp': 'san pham', 'bt': 'binh thuong', 'bth': 'binh thuong',
    'tks': 'cam on', 'thanks': 'cam on', 'thank': 'cam on',
    'ntn': 'nhu the nao', 'mn': 'moi nguoi', 'cx': 'cung', 'cg': 'cung',
    'vs': 'voi', 'j': 'gi', 'z': 'vay', 'bit': 'biet', 'ns': 'nhan xet',
    'ct': 'chi tiet', 'tp': 'tac pham', 'tg': 'tac gia', 'nk': 'truyen kieu',
    'nd': 'nguyen du', 'nc': 'nam cao', 'tk': 'tac pham', 'nv': 'nhan vat'
};

const STRUCTURAL_KEYWORDS = [
    'tac pham', 'tac gia', 'truyen', 'bai tho', 'tieu thuyet', 'nhan vat',
    'tom tat', 'phan tich', 'binh giang', 'danh gia', 'dich thuat',
    'lien quan', 'giong', 'tuong tu', 'cung',
    'thoi', 'ky', 'trieu', 'nha', 'viet', 'sang tac',
    'y nghia', 'bieu tuong', 'dien tich', 'dinh nghia', 'the loai'
];

/**
 * 1. Chuẩn hóa cơ bản: Lowercase + BỎ DẤU tiếng Việt.
 *
 * [FIX v1.2.0] Phải dùng NFD (KHÔNG dùng NFC):
 *   - NFC: "ê" là 1 codepoint U+00EA (dựng sẵn)
 *          → regex /[\u0300-\u036f]/ KHÔNG xóa được
 *   - NFD: "ê" là 2 codepoints U+0065 (e) + U+0302 (combining)
 *          → regex xóa U+0302 → còn "e" ✓
 */
function basicNormalize(text) {
    return String(text)
        .toLowerCase()
        .normalize('NFD')                     // [FIX] NFD thay vì NFC
        .replace(/[\u0300-\u036f]/g, '')      // Xóa combining diacritics
        .replace(/đ/g, 'd');                  // đ là codepoint riêng, không bị NFD
}

function normalizeRepeatedChars(text) {
    return text.replace(/(.)\1{2,}/g, '$1');
}

function removeSpecialChars(text) {
    return text.replace(/[^a-z0-9\s]/g, ' ');
}

function expandTeencode(text) {
    return text.split(/\s+/).map(word => TEENCODE_MAP[word] || word).join(' ');
}

function fuzzyCorrect(text) {
    const words = text.split(/\s+/);
    return words.map(word => {
        if (word.length < 4) return word;
        let bestMatch = word;
        let minDistance = Infinity;
        for (const keyword of STRUCTURAL_KEYWORDS) {
            const distance = MathUtils.levenshteinDistance(word, keyword);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = keyword;
            }
        }
        return minDistance <= 1 ? bestMatch : word;
    }).join(' ');
}

function segmentWords(text) {
    const words = text.split(/\s+/);
    const result = [];
    for (const word of words) {
        if (word.length < 5) { result.push(word); continue; }
        let found = false;
        for (let i = 2; i < word.length - 1; i++) {
            const part1 = word.substring(0, i);
            const part2 = word.substring(i);
            if (STRUCTURAL_KEYWORDS.includes(part1) && STRUCTURAL_KEYWORDS.includes(part2)) {
                result.push(part1, part2);
                found = true;
                break;
            }
        }
        if (!found) result.push(word);
    }
    return result.join(' ');
}

export function preprocessText(rawText) {
    let clean = basicNormalize(rawText);
    clean = normalizeRepeatedChars(clean);
    clean = removeSpecialChars(clean);
    clean = expandTeencode(clean);
    clean = segmentWords(clean);
    clean = fuzzyCorrect(clean);
    return clean.replace(/\s+/g, ' ').trim();
}
