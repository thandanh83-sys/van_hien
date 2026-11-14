/**
 * ==========================================================
 * VĂN ĐẠO AI - NLP TOOLS (js/ai/nlp-tools.js)
 * Vị trí: js/ai/nlp-tools.js
 * Version: 4.0.0 (Omnibox Abbreviation & Typo Correction)
 * ==========================================================
 * TRIẾT LÝ:
 * - Hiểu cả những gì người dùng "gõ tắt" (tk, pt, nd, tt...).
 * - Tự động dịch teencode và viết tắt văn học sang tiếng Việt chuẩn.
 * - Tích hợp bộ lọc Stopwords mạnh mẽ.
 * ==========================================================
 */

import { MathUtils } from './math-utils.js';
import { STATE } from '../config.js';

// =====================================================================
// PHẦN 1: DYNAMIC VOCABULARY ENGINE
// =====================================================================
let vocabularyList = [];    
let vocabularySet = new Set(); 
let isVocabularyBuilt = false;

export function buildVocabulary() {
    if (isVocabularyBuilt) return;
    const tempSet = new Set();
    if (!STATE.GLOBAL_RECORDS || STATE.GLOBAL_RECORDS.length === 0) {
        const fallback = ['tac gia', 'tac pham', 'truyen kieu', 'nguyen du', 'tom tat', 'phan tich'];
        fallback.forEach(w => tempSet.add(w));
    } else {
        STATE.GLOBAL_RECORDS.forEach(record => {
            const item = record.data;
            if (item.title) tempSet.add(basicNormalize(item.title));
            if (item.name) tempSet.add(basicNormalize(item.name));
            if (item.author) tempSet.add(basicNormalize(item.author));
            if (Array.isArray(item.the_loai)) item.the_loai.forEach(g => tempSet.add(basicNormalize(g)));
        });
    }
    vocabularySet = tempSet;
    vocabularyList = Array.from(tempSet).map(term => ({ normalized: term, length: term.length }));
    isVocabularyBuilt = true;
}

export function invalidateVocabulary() {
    isVocabularyBuilt = false;
    vocabularyList = [];
    vocabularySet.clear();
}

// =====================================================================
// PHẦN 2: CHUẨN HÓA VĂN BẢN (TEXT NORMALIZER)
// =====================================================================
function basicNormalize(text) {
    return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
}

function normalizeRepeatedChars(text) {
    return text.replace(/(.)\1{2,}/g, '$1');
}

function removeSpecialChars(text) {
    return text.replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * [MỚI] Bộ giải mã Teencode & Từ viết tắt (Omnibox Logic)
 * Dịch "tk" -> "truyen kieu", "pt" -> "phan tich"
 */
function expandSmartAbbreviations(text) {
    const SHORTCUT_MAP = {
        'ko': 'khong', 'k': 'khong', 'hok': 'khong', 'hem': 'khong',
        'dc': 'duoc', 'dk': 'duoc', 'đc': 'duoc',
        'vs': 'voi', 'j': 'gi', 'z': 'vay', 
        'ntn': 'nhu the nao', 'mn': 'moi nguoi', 'bt': 'biet',
        'pt': 'phan tich', 'ss': 'so sanh', 'nd': 'noi dung', 'nt': 'nghe thuat',
        'tk': 'truyen kieu', 'tt': 'tay tien', 'cp': 'chi pheo', 'lh': 'lao hac',
        'dq': 'dong chi', 'tcs': 'tuay but song huong', 'sh': 'song huong'
    };
    return text.split(/\s+/).map(word => SHORTCUT_MAP[word] || word).join(' ');
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

function fuzzyCorrect(text) {
    const tokens = text.split(/\s+/);
    const correctedTokens = tokens.map(token => {
        if (token.length < 3 || vocabularySet.has(token)) return token;
        let bestMatch = token;
        let highestScore = 0.0;
        for (const vocab of vocabularyList) {
            if (Math.abs(vocab.length - token.length) > 3) continue;
            const score = MathUtils.diceCoefficient(token, vocab.normalized);
            if (score > highestScore) { highestScore = score; bestMatch = vocab.normalized; }
        }
        if (highestScore >= 0.85) return bestMatch;
        return token;
    });
    return correctedTokens.join(' ');
}

// =====================================================================
// PHẦN 3: BỘ LỌC TỪ DỪNG (STOPWORDS FILTER)
// =====================================================================
const STOPWORDS = new Set([
    "ai", "la", "gi", "the", "nao", "tai", "sao", "cua", "va", "co", "trong", 
    "cho", "nhung", "cac", "mot", "duoc", "voi", "da", "de", "khi", "ra", 
    "ve", "tu", "nhu", "nguoi", "thi", "ma", "nay", "do", "cung", "se", 
    "dang", "toi", "ban", "minh", "ho", "chung", "no", "phai", "khong", 
    "roi", "nhe", "nha", "a", "oi", "hich", "ha", "vay", "day"
]);

export function isStopword(word) {
    if (!word) return true;
    return STOPWORDS.has(word.toLowerCase().trim());
}

// =====================================================================
// PHẦN 4: HÀM PIPELINE CÔNG KHAI
// =====================================================================
export function preprocessText(rawText) {
    if (!rawText) return '';
    buildVocabulary();

    let clean = basicNormalize(rawText);
    clean = normalizeRepeatedChars(clean);
    clean = removeSpecialChars(clean);
    
    // [MỚI] Áp dụng bộ giải mã Omnibox
    clean = expandSmartAbbreviations(clean);
    
    clean = segmentWords(clean);
    clean = fuzzyCorrect(clean);
    
    return clean.replace(/\s+/g, ' ').trim();
}

export function filterStopwords(wordsArray) {
    return wordsArray.filter(w => !isStopword(w) && w.trim().length > 1);
}

export function getVocabularyStats() {
    buildVocabulary();
    return { totalWords: vocabularyList.length, isBuilt: isVocabularyBuilt, totalStopwords: STOPWORDS.size };
}
