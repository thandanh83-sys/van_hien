/**
 * ==========================================================
 * VĂN ĐẠO AI - NLP TOOLS (js/ai/nlp-tools.js)
 * Vị trí: js/ai/nlp-tools.js
 * Version: 2.0.0 (Dynamic Vocabulary Engine & Fuzzy Correction)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * 1. Không hardcode từ điển viết tắt:
 *    Thay vì nhập tay hàng ngàn từ, hệ thống tự động trích xuất
 *    vốn từ (Tác phẩm, Tác giả, Thể loại) từ DataHub.
 * 2. Sửa lỗi chính tả an toàn:
 *    Dùng thuật toán Dice Coefficient để đo độ tương đồng.
 *    Chỉ sửa khi độ tin cậy >= 85% (tránh sửa sai làm AI hiểu nhầm).
 * 3. Tách từ dính thông minh:
 *    Dựa vào vốn từ đã học để tách các từ bị dính liền.
 * 4. Chuẩn hóa NFD:
 *    Bỏ dấu tiếng Việt chính xác 100% bằng cách phân rã ký tự.
 * ==========================================================
 */

import { MathUtils } from './math-utils.js';
import { STATE } from '../config.js';

// =====================================================================
// PHẦN 1: DYNAMIC VOCABULARY ENGINE (Bộ máy Từ vựng Động)
// =====================================================================
let vocabularyList = [];    // Mảng chứa { original, normalized }
let vocabularySet = new Set(); // Set chứa normalized để tra cứu O(1)
let isVocabularyBuilt = false;

/**
 * Xây dựng vốn từ tự động từ kho dữ liệu DataHub.
 * Quét qua STATE.GLOBAL_RECORDS để lấy Tên tác phẩm, Tác giả, Thể loại.
 */
function buildVocabulary() {
    if (isVocabularyBuilt) return;

    const tempSet = new Set();

    // 1. Nếu DataHub chưa sẵn sàng, dùng danh sách fallback tối thiểu
    if (!STATE.GLOBAL_RECORDS || STATE.GLOBAL_RECORDS.length === 0) {
        const fallback = ['tac gia', 'tac pham', 'truyen kieu', 'nguyen du', 'tom tat', 'phan tich'];
        fallback.forEach(w => tempSet.add(w));
    } else {
        // 2. Tự động trích xuất từ DataHub
        STATE.GLOBAL_RECORDS.forEach(record => {
            const item = record.data;
            
            // Tên tác phẩm / thể loại
            if (item.title) tempSet.add(basicNormalize(item.title));
            if (item.name) tempSet.add(basicNormalize(item.name));
            
            // Tên tác giả
            if (item.author) tempSet.add(basicNormalize(item.author));
            
            // Thể loại (Mảng)
            if (Array.isArray(item.the_loai)) {
                item.the_loai.forEach(g => tempSet.add(basicNormalize(g)));
            }
        });
    }

    // 3. Chuyển Set thành Mảng để dùng cho Fuzzy Matching
    vocabularySet = tempSet;
    vocabularyList = Array.from(tempSet).map(term => ({
        normalized: term,
        length: term.length
    }));

    isVocabularyBuilt = true;
    console.log(`[NLP] Đã xây dựng vốn từ động: ${vocabularyList.length} mục.`);
}

/**
 * Làm mới vốn từ (Dùng khi reload dữ liệu hoặc chuyển trang).
 */
export function invalidateVocabulary() {
    isVocabularyBuilt = false;
    vocabularyList = [];
    vocabularySet.clear();
}

// =====================================================================
// PHẦN 2: CHUẨN HÓA VĂN BẢN (TEXT NORMALIZER)
// =====================================================================

/**
 * 1. Chuẩn hóa cơ bản: Lowercase, bỏ dấu tiếng Việt (NFD).
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
 * Chuyển mọi dấu câu (?, !, ., ,, ...) thành khoảng trắng.
 * Ví dụ: "Nguyễn Du là ai?" -> "Nguyen Du la ai ".
 */
function removeSpecialChars(text) {
    return text.replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * 4. Xử lý Teencode cơ bản (Chỉ những từ phổ biến nhất).
 * Các từ viết tắt phức tạp sẽ được xử lý bởi Fuzzy Corrector.
 */
function expandCoreTeencode(text) {
    const TEENCODE_MAP = {
        'ko': 'khong', 'k': 'khong', 'hok': 'khong', 'hem': 'khong',
        'dc': 'duoc', 'dk': 'duoc', 'đc': 'duoc',
        'vs': 'voi', 'j': 'gi', 'z': 'vay', 
        'ntn': 'nhu the nao', 'mn': 'moi nguoi',
        'bt': 'biet', // Mặc định hiểu là "biết" (an toàn hơn "bình thường")
        'cx': 'cung', 'cg': 'cung'
    };
    return text.split(/\s+/).map(word => TEENCODE_MAP[word] || word).join(' ');
}

/**
 * 5. Tách từ dính (Word Segmentation) dựa trên Vốn từ động.
 * Ví dụ: "truyenkieu" -> "truyen kieu" (nếu cả 2 từ đều có trong vốn từ).
 */
function segmentWords(text) {
    const words = text.split(/\s+/);
    const result = [];

    for (const word of words) {
        if (word.length < 5) { 
            result.push(word); 
            continue; 
        }

        let found = false;
        // Thử tách từ dài thành 2 từ có nghĩa
        for (let i = 2; i < word.length - 1; i++) {
            const part1 = word.substring(0, i);
            const part2 = word.substring(i);
            
            // Nếu cả 2 phần đều nằm trong vốn từ -> Tách
            if (vocabularySet.has(part1) && vocabularySet.has(part2)) {
                result.push(part1, part2);
                found = true;
                break;
            }
        }
        if (!found) result.push(word);
    }
    return result.join(' ');
}

/**
 * 6. Sửa lỗi chính tả (Fuzzy Matching) dựa trên Vốn từ động.
 * Sử dụng thuật toán Dice Coefficient để đo độ tương đồng.
 */
function fuzzyCorrect(text) {
    const tokens = text.split(/\s+/);
    const correctedTokens = tokens.map(token => {
        // Bỏ qua từ quá ngắn (1-2 ký tự) để tránh sửa bừa
        if (token.length < 3) return token;
        
        // Nếu từ đã có trong vốn từ -> Giữ nguyên
        if (vocabularySet.has(token)) return token;

        let bestMatch = token;
        let highestScore = 0.0;

        // Duyệt vốn từ để tìm từ gần giống nhất
        for (const vocab of vocabularyList) {
            // Bỏ qua nếu độ dài lệch quá nhiều (tối ưu hiệu năng)
            if (Math.abs(vocab.length - token.length) > 3) continue;

            const score = MathUtils.diceCoefficient(token, vocab.normalized);
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = vocab.normalized;
            }
        }

        // NGƯỠNG AN TOÀN: Chỉ sửa nếu độ tương đồng >= 85%
        // Nguyên tắc: Thà giữ nguyên từ sai còn hơn sửa sai thành từ khác.
        if (highestScore >= 0.85) {
            return bestMatch;
        }

        return token;
    });
    
    return correctedTokens.join(' ');
}

// =====================================================================
// PHẦN 3: HÀM PIPELINE CÔNG KHAI (PUBLIC API)
// =====================================================================

/**
 * Hàm tổng hợp: Làm sạch văn bản thô từ người dùng.
 * 
 * @param {string} rawText - Câu gốc người dùng nhập.
 * @returns {string} - Câu đã được chuẩn hóa, sửa lỗi và bỏ dấu câu.
 */
export function preprocessText(rawText) {
    if (!rawText) return '';

    // Đảm bảo vốn từ đã được nạp
    buildVocabulary();

    // 1. Chuẩn hóa cơ bản (Lowercase, bỏ dấu NFD)
    let clean = basicNormalize(rawText);
    
    // 2. Nén ký tự lặp
    clean = normalizeRepeatedChars(clean);
    
    // 3. Xóa dấu câu
    clean = removeSpecialChars(clean);
    
    // 4. Dịch Teencode cơ bản
    clean = expandCoreTeencode(clean);
    
    // 5. Tách từ dính (Dùng vốn từ động)
    clean = segmentWords(clean);
    
    // 6. Sửa lỗi chính tả (Fuzzy Matching)
    clean = fuzzyCorrect(clean);
    
    // 7. Dọn dẹp khoảng trắng
    return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Hàm lấy thống kê vốn từ (Dùng cho Debug).
 */
export function getVocabularyStats() {
    buildVocabulary();
    return {
        totalWords: vocabularyList.length,
        isBuilt: isVocabularyBuilt
    };
}
