/**
 * ==========================================================
 * VĂN ĐẠO AI - NLP TOOLS (js/ai/nlp-tools.js)
 * Vị trí: js/ai/nlp-tools.js
 * Version: 1.3.0 (Intent Router Compatible)
 * ==========================================================
 * CHỨC NĂNG:
 * - Cung cấp các công cụ xử lý văn bản thô (Tiếng Việt).
 * - Xử lý Teencode, viết tắt, lỗi chính tả, gõ dính chữ, ký tự lặp.
 * - Tự động tách biệt logic này khỏi InputAI để dễ bảo trì.
 * 
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.2.0: Chuyển NFC sang NFD để bỏ dấu tiếng Việt.
 * - v1.3.0: 
 *   - Bổ sung `removeSpecialChars` để loại bỏ hoàn toàn dấu câu (?, !, ., ...).
 *   - Điều này đảm bảo IntentRouter có thể so khớp chính xác các cụm từ
 *     (VD: "la ai?" sẽ thành "la ai") trước khi đưa vào Regex.
 *   - Chuẩn hóa khoảng trắng sau khi bỏ dấu câu.
 * ==========================================================
 */

import { MathUtils } from './math-utils.js';

// =====================================================================
// 1. TỪ ĐIỂN TEENCODE & TỪ KHÓA HỆ THỐNG
// =====================================================================

// Từ điển Teencode mở rộng
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

// Từ điển từ khóa cấu trúc (Dùng cho việc tách chữ dính & sửa lỗi chính tả)
const STRUCTURAL_KEYWORDS = [
    'tac pham', 'tac gia', 'truyen', 'bai tho', 'tieu thuyet', 'nhan vat',
    'tom tat', 'phan tich', 'binh giang', 'danh gia', 'dich thuat',
    'lien quan', 'giong', 'tuong tu', 'cung',
    'thoi', 'ky', 'trieu', 'nha', 'viet', 'sang tac',
    'y nghia', 'bieu tuong', 'dien tich', 'dinh nghia', 'the loai'
];

// =====================================================================
// 2. CÁC HÀM XỬ LÝ LÕI (PRIVATE FUNCTIONS)
// =====================================================================

/**
 * 1. Chuẩn hóa cơ bản: Lowercase, bỏ dấu tiếng Việt.
 * [QUAN TRỌNG] Phải dùng NFD để phân rã ký tự (VD: "ế" -> "e" + dấu mũ + dấu sắc).
 * Sau đó dùng regex xóa các dấu (combining marks).
 */
function basicNormalize(text) {
    return String(text)
        .normalize('NFD') 
        .replace(/[\u0300-\u036f]/g, '') 
        .replace(/đ/g, 'd')
        .toLowerCase();
}

/**
 * 2. Xử lý ký tự lặp (Ví dụ: "đẹppp" -> "đẹp", "xinhhh" -> "xinh").
 */
function normalizeRepeatedChars(text) {
    return text.replace(/(.)\1{2,}/g, '$1');
}

/**
 * 3. Xóa ký tự đặc biệt và dấu câu.
 * [QUAN TRỌNG] Chuyển mọi dấu câu (?, !, ., ,, ...) thành khoảng trắng.
 * Ví dụ: "Nguyễn Du là ai?" -> "Nguyen Du la ai ".
 * Điều này giúp Regex `hasPhrase` ở InputAI hoạt động chính xác.
 */
function removeSpecialChars(text) {
    return text.replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * 4. Dịch Teencode.
 */
function expandTeencode(text) {
    return text.split(/\s+/).map(word => TEENCODE_MAP[word] || word).join(' ');
}

/**
 * 5. Sửa lỗi chính tả (Fuzzy Matching).
 */
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

/**
 * 6. Tách từ dính (Word Segmentation).
 * Ví dụ: "truyenkieu" -> "truyen kieu".
 */
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

// =====================================================================
// 3. HÀM PIPELINE CÔNG KHAI (PUBLIC API)
// =====================================================================

/**
 * Hàm tổng hợp: Làm sạch văn bản thô từ người dùng.
 * 
 * @param {string} rawText - Câu gốc người dùng nhập.
 * @returns {string} - Câu đã được chuẩn hóa (bỏ dấu, sửa teencode, xóa dấu câu...).
 */
export function preprocessText(rawText) {
    if (!rawText) return '';

    // 1. Chuẩn hóa cơ bản (Lowercase, bỏ dấu bằng NFD)
    let clean = basicNormalize(rawText);
    
    // 2. Nén ký tự lặp (đẹppp -> đẹp)
    clean = normalizeRepeatedChars(clean);
    
    // 3. Xóa dấu câu và ký tự đặc biệt (Chuyển thành khoảng trắng)
    clean = removeSpecialChars(clean);
    
    // 4. Dịch Teencode (ko -> khong, tp -> tac pham)
    clean = expandTeencode(clean);
    
    // 5. Tách từ dính (truyenkieu -> truyen kieu)
    clean = segmentWords(clean);
    
    // 6. Sửa lỗi chính tả (Fuzzy Matching)
    clean = fuzzyCorrect(clean);
    
    // 7. Dọn dẹp khoảng trắng thừa (Quan trọng: đảm bảo đầu/cuối không có space)
    return clean.replace(/\s+/g, ' ').trim();
}
