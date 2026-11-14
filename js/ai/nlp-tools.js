/**
 * ==========================================================
 * VĂN ĐẠO AI - NLP TOOLS (js/ai/nlp-tools.js)
 * Vị trí: js/ai/nlp-tools.js
 * Version: 3.1.0 (Deep Cleaning & Stopwords Integration)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * 1. Không để AI bắt nhầm "từ rác": Bổ sung bộ lọc STOPWORDS (Từ dừng)
 *    để loại bỏ các đại từ, liên từ, trợ từ vô nghĩa (như "ai", "là", "gì").
 *    Điều này cực kỳ quan trọng để các Agent (Praiser, Critic, LiteraryEngine) 
 *    không lấy nhầm chữ "ai" trong câu hỏi "ai viết truyện kiều" để làm câu thơ.
 * 2. Sửa lỗi chính tả an toàn: Dùng thuật toán Dice Coefficient.
 * 3. Tách từ dính thông minh: Dựa vào vốn từ đã học từ DataHub.
 * ==========================================================
 */

import { MathUtils } from './math-utils.js';
import { STATE } from '../config.js';

// =====================================================================
// PHẦN 1: DYNAMIC VOCABULARY ENGINE (Bộ máy Từ vựng Động)
// =====================================================================
let vocabularyList = [];    
let vocabularySet = new Set(); 
let isVocabularyBuilt = false;

export function buildVocabulary() {
    if (isVocabularyBuilt) return;

    const tempSet = new Set();

    // Fallback nếu DataHub chưa sẵn sàng
    if (!STATE.GLOBAL_RECORDS || STATE.GLOBAL_RECORDS.length === 0) {
        const fallback = ['tac gia', 'tac pham', 'truyen kieu', 'nguyen du', 'tom tat', 'phan tich'];
        fallback.forEach(w => tempSet.add(w));
    } else {
        // Trích xuất tự động từ DataHub
        STATE.GLOBAL_RECORDS.forEach(record => {
            const item = record.data;
            if (item.title) tempSet.add(basicNormalize(item.title));
            if (item.name) tempSet.add(basicNormalize(item.name));
            if (item.author) tempSet.add(basicNormalize(item.author));
            if (Array.isArray(item.the_loai)) {
                item.the_loai.forEach(g => tempSet.add(basicNormalize(g)));
            }
        });
    }

    vocabularySet = tempSet;
    vocabularyList = Array.from(tempSet).map(term => ({
        normalized: term,
        length: term.length
    }));

    isVocabularyBuilt = true;
    console.log(`[NLP] Đã xây dựng vốn từ động: ${vocabularyList.length} mục.`);
}

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
 */
function basicNormalize(text) {
    return String(text)
        .normalize('NFD') 
        .replace(/[\u0300-\u036f]/g, '') 
        .replace(/đ/g, 'd')
        .toLowerCase();
}

/**
 * 2. Xử lý ký tự lặp (Ví dụ: "đẹppp" -> "đẹp").
 */
function normalizeRepeatedChars(text) {
    return text.replace(/(.)\1{2,}/g, '$1');
}

/**
 * 3. Xóa ký tự đặc biệt và dấu câu.
 */
function removeSpecialChars(text) {
    return text.replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * 4. Xử lý Teencode cơ bản.
 */
function expandCoreTeencode(text) {
    const TEENCODE_MAP = {
        'ko': 'khong', 'k': 'khong', 'hok': 'khong', 'hem': 'khong',
        'dc': 'duoc', 'dk': 'duoc', 'đc': 'duoc',
        'vs': 'voi', 'j': 'gi', 'z': 'vay', 
        'ntn': 'nhu the nao', 'mn': 'moi nguoi',
        'bt': 'biet', 'cx': 'cung', 'cg': 'cung'
    };
    return text.split(/\s+/).map(word => TEENCODE_MAP[word] || word).join(' ');
}

/**
 * 5. Tách từ dính (Word Segmentation) dựa trên Vốn từ động.
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
        for (let i = 2; i < word.length - 1; i++) {
            const part1 = word.substring(0, i);
            const part2 = word.substring(i);
            
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
 * 6. Sửa lỗi chính tả (Fuzzy Matching).
 */
function fuzzyCorrect(text) {
    const tokens = text.split(/\s+/);
    const correctedTokens = tokens.map(token => {
        if (token.length < 3) return token;
        if (vocabularySet.has(token)) return token;

        let bestMatch = token;
        let highestScore = 0.0;

        for (const vocab of vocabularyList) {
            if (Math.abs(vocab.length - token.length) > 3) continue;
            const score = MathUtils.diceCoefficient(token, vocab.normalized);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = vocab.normalized;
            }
        }

        if (highestScore >= 0.85) return bestMatch;
        return token;
    });
    
    return correctedTokens.join(' ');
}

// =====================================================================
// PHẦN 3: BỘ LỌC TỪ DỪNG (STOPWORDS FILTER) - [QUAN TRỌNG NHẤT]
// =====================================================================
/**
 * Danh sách các từ vô nghĩa (đại từ, liên từ, trợ từ, giới từ).
 * AI KHÔNG ĐƯỢC PHÉP lấy những từ này làm trọng tâm phân tích.
 * Khi LiteraryEngine cần trích xuất câu thơ, phải gọi hàm isStopword.
 */
const STOPWORDS = new Set([
    "ai", "la", "gi", "the", "nao", "tai", "sao", "cua", "va", "co", "trong", 
    "cho", "nhung", "cac", "mot", "duoc", "voi", "da", "de", "khi", "ra", 
    "ve", "tu", "nhu", "nguoi", "thi", "ma", "nay", "do", "cung", "se", 
    "dang", "toi", "ban", "minh", "ho", "chung", "no", "cac", "nhung",
    "phai", "khong", "roi", "nhe", "nha", "a", "oi", "hich", "ha", "vay", "day"
]);

export function isStopword(word) {
    if (!word) return true;
    return STOPWORDS.has(word.toLowerCase().trim());
}

// =====================================================================
// PHẦN 4: HÀM PIPELINE CÔNG KHAI (PUBLIC API)
// =====================================================================

/**
 * Hàm tổng hợp: Làm sạch văn bản thô từ người dùng.
 * 
 * @param {string} rawText - Câu gốc người dùng nhập.
 * @returns {string} - Câu đã được chuẩn hóa, sửa lỗi và bỏ dấu câu.
 */
export function preprocessText(rawText) {
    if (!rawText) return '';

    buildVocabulary();

    let clean = basicNormalize(rawText);
    clean = normalizeRepeatedChars(clean);
    clean = removeSpecialChars(clean);
    clean = expandCoreTeencode(clean);
    clean = segmentWords(clean);
    clean = fuzzyCorrect(clean);
    
    return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Lọc bỏ các từ dừng khỏi một mảng từ.
 * Dùng trong LiteraryEngine để không lấy nhầm từ rác làm "câu thơ".
 */
export function filterStopwords(wordsArray) {
    return wordsArray.filter(w => !isStopword(w) && w.trim().length > 1);
}

/**
 * Lấy thống kê vốn từ (Dùng cho Debug).
 */
export function getVocabularyStats() {
    buildVocabulary();
    return {
        totalWords: vocabularyList.length,
        isBuilt: isVocabularyBuilt,
        totalStopwords: STOPWORDS.size
    };
}
