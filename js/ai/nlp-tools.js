/**
 * ==========================================================
 * VĂN ĐẠO AI - NLP TOOLS (js/ai/nlp-tools.js)
 * Vị trí: js/ai/nlp-tools.js
 * Version: 2.0.0 (Dynamic Vocabulary & Fuzzy Correction)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tự động xây dựng vốn từ (Vocabulary) từ kho dữ liệu DataHub.
 * - Sửa lỗi chính tả thông minh (Fuzzy Matching) thay vì hardcode.
 * - Chuẩn hóa văn bản (bỏ dấu, xóa dấu câu) phục vụ Intent Router.
 * 
 * TRIẾT LÝ:
 * - "Không sửa nội dung người dùng khi chưa chắc chắn".
 * - Chỉ sửa từ nếu độ tin cậy > 0.8 (80%).
 * - Tự học từ vựng từ chính dữ liệu của dự án.
 * ==========================================================
 */

import { MathUtils } from './math-utils.js';
import { STATE } from '../config.js';

// =====================================================================
// PHẦN 1: DYNAMIC VOCABULARY ENGINE (Bộ máy Từ vựng Động)
// =====================================================================
let vocabularyCache = null;
let vocabularyList = [];

/**
 * Xây dựng vốn từ từ các bản ghi trong DataHub (STATE.GLOBAL_RECORDS).
 * Bao gồm: Tên tác phẩm, Tên tác giả, Tên thể loại, Thuật ngữ hệ thống.
 */
function buildVocabulary() {
    if (vocabularyCache) return;

    const vocabSet = new Set();

    // 1. Từ khóa hệ thống cốt lõi (Chỉ giữ những từ thực sự cần thiết)
    const systemKeywords = [
        'tac gia', 'tac pham', 'tom tat', 'phan tich', 'nhan vat', 
        'the loai', 'y nghia', 'dien tich', 'dinh nghia', 'tieu su',
        'la ai', 'la gi', 'the nao', 'tai sao', 'vi sao', 'bao nhieu'
    ];
    systemKeywords.forEach(k => vocabSet.add(k));

    // 2. Tự động trích xuất từ dữ liệu thực tế
    if (STATE.GLOBAL_RECORDS && STATE.GLOBAL_RECORDS.length > 0) {
        STATE.GLOBAL_RECORDS.forEach(record => {
            const item = record.data;
            
            // Tên tác phẩm / thể loại
            if (item.title) vocabSet.add(item.title);
            if (item.name) vocabSet.add(item.name);
            
            // Tên tác giả
            if (item.author) vocabSet.add(item.author);
            
            // Thể loại (nếu là mảng)
            if (Array.isArray(item.the_loai)) {
                item.the_loai.forEach(g => vocabSet.add(g));
            }
        });
    }

    // Chuyển thành mảng và chuẩn hóa (bỏ dấu) để so khớp
    vocabularyList = Array.from(vocabSet).map(term => ({
        original: term,
        normalized: basicNormalize(term)
    }));

    vocabularyCache = true;
    console.log(`[NLP] Đã xây dựng bộ từ vựng động: ${vocabularyList.length} mục.`);
}

/**
 * Xóa cache để xây dựng lại vốn từ (dùng khi reload dữ liệu).
 */
export function invalidateVocabulary() {
    vocabularyCache = null;
    vocabularyList = [];
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
 * 2. Xóa dấu câu và ký tự đặc biệt (Chuyển thành khoảng trắng).
 */
function removeSpecialChars(text) {
    return text.replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * 3. Xử lý ký tự lặp (VD: "đẹppp" -> "đẹp").
 */
function normalizeRepeatedChars(text) {
    return text.replace(/(.)\1{2,}/g, '$1');
}

// =====================================================================
// PHẦN 3: FUZZY CORRECTOR (Tự sửa lỗi chính tả)
// =====================================================================

/**
 * Sửa lỗi chính tả dựa trên vốn từ động.
 * Sử dụng thuật toán Dice Coefficient để đo độ tương đồng.
 * 
 * @param {string} token - Từ cần kiểm tra (đã bỏ dấu).
 * @returns {string} - Từ đã sửa (đã bỏ dấu) hoặc giữ nguyên nếu không chắc chắn.
 */
function fuzzyCorrectToken(token) {
    // Bỏ qua các từ quá ngắn (1-2 ký tự) để tránh sửa bừa
    if (token.length < 3) return token;

    let bestMatch = token;
    let highestScore = 0.0;

    for (const vocab of vocabularyList) {
        // Bỏ qua nếu độ dài lệch quá nhiều (tối ưu hiệu năng)
        if (Math.abs(vocab.normalized.length - token.length) > 3) continue;

        // Tính điểm tương đồng
        const score = MathUtils.diceCoefficient(token, vocab.normalized);
        
        if (score > highestScore) {
            highestScore = score;
            bestMatch = vocab.normalized;
        }
    }

    // NGƯỠNG AN TOÀN: Chỉ sửa nếu độ tương đồng > 80%
    // Nguyên tắc: Thà giữ nguyên từ sai còn hơn sửa sai thành từ khác.
    if (highestScore >= 0.80) {
        return bestMatch;
    }

    return token;
}

/**
 * Áp dụng Fuzzy Correction cho toàn bộ câu.
 */
function fuzzyCorrectSentence(text) {
    const tokens = text.split(/\s+/);
    const correctedTokens = tokens.map(t => fuzzyCorrectToken(t));
    return correctedTokens.join(' ');
}

// =====================================================================
// PHẦN 4: PIPELINE CÔNG KHAI
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

    // 1. Chuẩn hóa cơ bản (Lowercase, bỏ dấu)
    let clean = basicNormalize(rawText);
    
    // 2. Nén ký tự lặp
    clean = normalizeRepeatedChars(clean);
    
    // 3. Xóa dấu câu
    clean = removeSpecialChars(clean);
    
    // 4. Sửa lỗi chính tả (Fuzzy Matching) - Chỉ sửa khi chắc chắn
    clean = fuzzyCorrectSentence(clean);
    
    // 5. Dọn dẹp khoảng trắng
    return clean.replace(/\s+/g, ' ').trim();
}
