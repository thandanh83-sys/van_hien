/**
 * ==========================================================
 * VĂN ĐẠO AI - NLP TOOLS (js/ai/nlp-tools.js)
 * Vị trí: js/ai/nlp-tools.js
 * Version: 1.1.0 (Advanced Natural Language Processing)
 * ==========================================================
 * CHỨC NĂNG:
 * - Cung cấp các công cụ xử lý văn bản thô (Tiếng Việt).
 * - Xử lý Teencode, viết tắt, lỗi chính tả, gõ dính chữ, ký tự lặp.
 * - Tự động tách biệt logic này khỏi InputAI để dễ bảo trì.
 * 
 * TRIẾT LÝ:
 * - Người dùng có thể gõ bất cứ thứ gì (teencode, không dấu, sai chính tả).
 * - Hệ thống phải "hiểu" và đưa về dạng chuẩn (Normalized) trước khi phân tích.
 * ==========================================================
 */

// [QUAN TRỌNG] Sử dụng thư viện Toán học để đo độ tương đồng
import { MathUtils } from './math-utils.js';

// =====================================================================
// 1. TỪ ĐIỂN TEENCODE & TỪ KHÓA HỆ THỐNG
// =====================================================================

// Từ điển Teencode mở rộng (Tham khảo underthesea & vnauto)
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
 * 1. Chuẩn hóa cơ bản: Lowercase, bỏ dấu tiếng Việt, đưa về Unicode NFC.
 */
function basicNormalize(text) {
    return String(text).toLowerCase().normalize('NFC')
        .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu thanh
        .replace(/đ/g, 'd');             // Bỏ dấu móc
}

/**
 * 2. Xử lý ký tự lặp (Ví dụ: "đẹppp" -> "đẹp", "xinhhh" -> "xinh").
 * Nếu một ký tự xuất hiện 3 lần trở lên, rút gọn còn 1 lần.
 */
function normalizeRepeatedChars(text) {
    return text.replace(/(.)\1{2,}/g, '$1');
}

/**
 * 3. Xóa ký tự đặc biệt, emoji, dấu câu (Chỉ giữ chữ cái và số).
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
 * 5. Sửa lỗi chính tả (Fuzzy Matching) dựa trên thư viện Toán học.
 * Ví dụ: "phan tichs" (sai 1 chữ s) -> "phan tich" (khoảng cách = 1).
 */
function fuzzyCorrect(text) {
    const words = text.split(/\s+/);
    return words.map(word => {
        if (word.length < 4) return word; // Bỏ qua từ quá ngắn

        let bestMatch = word;
        let minDistance = Infinity;

        for (const keyword of STRUCTURAL_KEYWORDS) {
            // Gọi hàm từ math-utils.js
            const distance = MathUtils.levenshteinDistance(word, keyword);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = keyword;
            }
        }
        // Nếu sai lệch chỉ 1 ký tự, chấp nhận sửa
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
        // Thử tách từ dài thành 2 từ có nghĩa (dựa trên từ điển từ khóa)
        for (let i = 2; i < word.length - 1; i++) {
            const part1 = word.substring(0, i);
            const part2 = word.substring(i);
            
            // Nếu cả 2 phần đều là từ khóa hoặc 1 phần là từ khóa
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
 * @param {string} rawText - Câu gốc người dùng nhập.
 * @returns {string} - Câu đã được chuẩn hóa (bỏ dấu, sửa teencode, sửa lỗi...).
 */
export function preprocessText(rawText) {
    // 1. Chuẩn hóa cơ bản (Lowercase, bỏ dấu)
    let clean = basicNormalize(rawText);
    
    // 2. Nén ký tự lặp (đẹppp -> đẹp)
    clean = normalizeRepeatedChars(clean);
    
    // 3. Xóa ký tự đặc biệt và dấu câu
    clean = removeSpecialChars(clean);
    
    // 4. Dịch Teencode (ko -> khong, tp -> tac pham)
    clean = expandTeencode(clean);
    
    // 5. Tách từ dính (truyenkieu -> truyen kieu)
    clean = segmentWords(clean);
    
    // 6. Sửa lỗi chính tả (Fuzzy Matching)
    clean = fuzzyCorrect(clean);
    
    // 7. Dọn dẹp khoảng trắng thừa
    return clean.replace(/\s+/g, ' ').trim();
}
