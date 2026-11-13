/**
 * ==========================================================
 * VĂN ĐẠO AI - NLP TOOLS (js/ai/nlp-tools.js)
 * Vị trí: js/ai/nlp-tools.js
 * Version: 1.0.0 (Natural Language Processing Library)
 * ==========================================================
 * CHỨC NĂNG:
 * - Cung cấp các công cụ xử lý văn bản thô (Tiếng Việt).
 * - Xử lý Teencode, viết tắt, lỗi chính tả, gõ dính chữ.
 * - Tách biệt hoàn toàn khỏi logic điều phối của InputAI.
 * ==========================================================
 */

// =====================================================================
// 1. TỪ ĐIỂN TEENCODE & TỪ KHÓA HỆ THỐNG
// =====================================================================
const TEENCODE_MAP = {
    'ko': 'khong', 'k': 'khong', 'hok': 'khong', 'hem': 'khong', 'kg': 'khong',
    'dc': 'duoc', 'dk': 'duoc', 'đc': 'duoc',
    'sp': 'san pham', 'bt': 'binh thuong', 'bth': 'binh thuong',
    'tks': 'cam on', 'thanks': 'cam on', 'thank': 'cam on',
    'ntn': 'nhu the nao', 'mn': 'moi nguoi', 'cx': 'cung', 'cg': 'cung',
    'vs': 'voi', 'j': 'gi', 'z': 'vay', 'bit': 'biet', 'ns': 'nhan xet',
    'ct': 'chi tiet', 'tp': 'tac pham', 'tg': 'tac gia', 'nk': 'truyen kieu'
};

// Từ điển từ khóa cấu trúc (Dùng cho việc tách chữ dính & sửa lỗi chính tả)
const STRUCTURAL_KEYWORDS = [
    'tac pham', 'tac gia', 'truyen', 'bai tho', 'tieu thuyet',
    'tom tat', 'phan tich', 'binh giang', 'danh gia',
    'lien quan', 'giong', 'tuong tu', 'cung',
    'thoi', 'ky', 'trieu', 'nha', 'viet', 'sang tac',
    'y nghia', 'bieu tuong', 'dien tich', 'dinh nghia', 'the loai'
];

// =====================================================================
// 2. CÁC HÀM XỬ LÝ LÕI (PRIVATE FUNCTIONS)
// =====================================================================

/**
 * 1. Chuẩn hóa cơ bản: Lowercase, bỏ dấu tiếng Việt.
 */
function basicNormalize(text) {
    return String(text).toLowerCase().normalize('NFC')
        .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu thanh
        .replace(/đ/g, 'd');             // Bỏ dấu móc
}

/**
 * 2. Xử lý ký tự lặp (Ví dụ: "đẹppp" -> "đẹp").
 */
function normalizeRepeatedChars(text) {
    return text.replace(/(.)\1{2,}/g, '$1');
}

/**
 * 3. Xóa ký tự đặc biệt, dấu câu.
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
 * 5. Tính khoảng cách Levenshtein (Dùng để đo độ sai lệch giữa 2 từ).
 */
function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // Thay thế
                    matrix[i][j - 1] + 1,     // Chèn
                    matrix[i - 1][j] + 1      // Xóa
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * 6. Sửa lỗi chính tả (Fuzzy Matching).
 * Ví dụ: "phan tich" gõ thành "phan tichs" -> khoảng cách = 1 -> Tự sửa.
 */
function fuzzyCorrect(text) {
    const words = text.split(/\s+/);
    return words.map(word => {
        if (word.length < 4) return word; // Bỏ qua từ quá ngắn

        let bestMatch = word;
        let minDistance = Infinity;

        for (const keyword of STRUCTURAL_KEYWORDS) {
            const distance = levenshteinDistance(word, keyword);
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
 * 7. Tách từ dính (Word Segmentation).
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
 * @param {string} rawText - Câu gốc người dùng nhập.
 * @returns {string} - Câu đã được chuẩn hóa (bỏ dấu, sửa teencode, sửa lỗi...).
 */
export function preprocessText(rawText) {
    let clean = basicNormalize(rawText);
    clean = normalizeRepeatedChars(clean);
    clean = removeSpecialChars(clean);
    clean = expandTeencode(clean);
    clean = segmentWords(clean);
    clean = fuzzyCorrect(clean);
    return clean.replace(/\s+/g, ' ').trim();
}
