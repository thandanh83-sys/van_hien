/**
 * ==========================================================
 * VĂN ĐẠO AI - CORE MODULE (js/ai/core.js)
 * Vị trí: js/ai/core.js
 * Version: 1.5.0 (Offline-First Foundation)
 * ==========================================================
 * CHỨC NĂNG:
 * - Quản lý bộ nhớ đệm (Cache Manager).
 * - Xây dựng chỉ mục từ điển (Dictionary Index).
 * - Xử lý văn bản có trọng số (Weighted Matching).
 * - Cung cấp hằng số dùng chung (Fortune Levels, Dictionary Groups).
 * - [QUAN TRỌNG] Cung cấp hàm resolveAndFetch() để AI lấy dữ liệu
 *   theo ID (kết nối với Máy Mẹ - mother.js).
 * ==========================================================
 */

import { APP_DATA } from '../config.js';
import { normalizeRouteText } from '../utils.js';
import { MotherNode } from '../network/mother.js'; // Import Máy Mẹ để định tuyến ID

// ==========================================================
// PHẦN 1: HẰNG SỐ DÙNG CHUNG
// ==========================================================

/**
 * Danh sách 11 nhóm từ điển có sẵn trong hệ thống.
 */
export const DICTIONARY_GROUPS = Object.freeze({
    symbols:      'Biểu tượng',
    dienTich:     'Điển tích',
    hanViet:      'Hán Việt',
    tuGoiHinh:    'Từ gợi hình',
    tuGoiAm:      'Từ gợi âm',
    tuBieuCam:    'Từ biểu cảm',
    anDu:         'Ẩn dụ',
    soSanh:       'So sánh',
    tuTaoCanh:    'Từ tạo cảnh',
    thanhNgu:     'Thành ngữ',
    thuatNguThiPhap: 'Thuật ngữ thi pháp'
});

/**
 * 6 bậc vận khí với trọng số và lời khuyên.
 */
export const FORTUNE_LEVELS = Object.freeze([
    { 
        key: 'dai-cat', weight: 10, name: 'Đại cát', color: '#b89552', 
        advice: 'Chủ động nắm bắt cơ hội, lấy lòng nhân hậu và sự khiêm nhường làm gốc. Tránh kiêu ngạo, tự mãn hoặc xem thuận lợi nhất thời là điều hiển nhiên.' 
    },
    { 
        key: 'trung-cat', weight: 18, name: 'Trung cát', color: '#8eaa91', 
        advice: 'Kiên trì, làm việc có kế hoạch và giữ chữ tín. Tránh nóng vội, chủ quan hoặc bỏ dở việc đang làm.' 
    },
    { 
        key: 'tieu-cat', weight: 22, name: 'Tiểu cát', color: '#9baf85', 
        advice: 'Trân trọng điều bình dị, chăm chút việc nhỏ và giữ tâm thế biết ơn. Tránh xem nhẹ những điều nhỏ bé.' 
    },
    { 
        key: 'binh-hoa', weight: 24, name: 'Bình hòa', color: '#778c85', 
        advice: 'Giữ sự điều độ, suy xét thấu đáo và làm tốt việc trước mắt. Tránh cố cưỡng cầu kết quả.' 
    },
    { 
        key: 'tieu-hung', weight: 16, name: 'Tiểu hung', color: '#ad876d', 
        advice: 'Kiểm tra lại kế hoạch, lắng nghe ý kiến đáng tin cậy. Tránh quyết định bốc đồng, hấp tấp.' 
    }, 
    { 
        key: 'dai-hung', weight: 10, name: 'Đại hung', color: '#9c7777', 
        advice: 'Thận trọng, rà soát những điều quan trọng và ưu tiên sự an toàn. Tránh liều lĩnh, cố chấp khi chưa đủ thông tin.' 
    }
]);

/**
 * Map tra cứu nhanh Fortune theo key (O(1))
 */
export const FORTUNE_MAP = Object.freeze(
    Object.fromEntries(FORTUNE_LEVELS.map(item => [item.key, item]))
);

// ==========================================================
// PHẦN 2: CACHE MANAGER (Quản lý bộ nhớ đệm)
// ==========================================================
const CACHE_LIMIT = 200;
const resultCache = new Map();
export const CACHE_VERSION = 'v1.5.0';

export const CoreCache = {
    set(key, value) {
        const fullKey = `${CACHE_VERSION}:${key}`;
        if (resultCache.has(fullKey)) resultCache.delete(fullKey);
        resultCache.set(fullKey, value);
        if (resultCache.size > CACHE_LIMIT) {
            const oldest = resultCache.keys().next().value;
            resultCache.delete(oldest);
        }
    },
    get(key) {
        const fullKey = `${CACHE_VERSION}:${key}`;
        if (!resultCache.has(fullKey)) return null;
        try { return JSON.parse(JSON.stringify(resultCache.get(fullKey))); } 
        catch { return null; }
    },
    clear() { resultCache.clear(); },
    stats() { return { size: resultCache.size, limit: CACHE_LIMIT, version: CACHE_VERSION }; }
};

// ==========================================================
// PHẦN 3: DICTIONARY INDEX (Tối ưu tra cứu từ điển)
// ==========================================================
let dictionaryIndexCache = null;

export function getDictionaryIndex() {
    if (dictionaryIndexCache) return dictionaryIndexCache;
    
    const dict = APP_DATA.DICTIONARY_DATA || {};
    dictionaryIndexCache = [];

    for (const [key, label] of Object.entries(DICTIONARY_GROUPS)) {
        const group = dict[key];
        if (!group || typeof group !== 'object') continue;

        for (const [keyword, value] of Object.entries(group)) {
            if (!value || typeof value !== 'object') continue;
            dictionaryIndexCache.push({
                ...value,
                keyword,
                normalizedKeyword: normalizeRouteText(keyword),
                type: label,
                groupKey: key
            });
        }
    }
    return dictionaryIndexCache;
}

export function invalidateDictionaryIndex() {
    dictionaryIndexCache = null;
}

// ==========================================================
// PHẦN 4: TEXT PROCESSING (Xử lý văn bản)
// ==========================================================

/**
 * Đếm từ khóa có trọng số, xóa vùng đã đếm để tránh trùng lặp.
 */
export function countWeightedMatches(text, terms) {
    let remaining = text;
    let score = 0;
    const hits = [];
    
    const sortedTerms = [...terms].sort((a, b) => b.t.length - a.t.length);

    for (const item of sortedTerms) {
        const needle = normalizeRouteText(item.t);
        if (!needle) continue;

        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'giu');

        const found = [...remaining.matchAll(pattern)];
        if (found.length > 0) {
            score += found.length * item.w;
            hits.push(item.t);
            remaining = remaining.replace(pattern, ' ');
        }
    }
    return { score, hits };
}

/**
 * Trích xuất entity (từ khóa chính) từ câu hỏi.
 */
export function extractEntity(input, patternsToRemove = []) {
    let clean = input;
    patternsToRemove.forEach(p => { clean = clean.replace(p, ''); });
    return clean.replace(/[?!.]/g, '').trim();
}

// ==========================================================
// PHẦN 5: ID RESOLVER (Cầu nối giữa AI và Máy Mẹ)
// ==========================================================

/**
 * [CỰC KỲ QUAN TRỌNG] Lấy dữ liệu chi tiết của một ID bất kỳ.
 * Hàm này sẽ hỏi Máy Mẹ (MotherNode) để tìm xem ID nằm ở đâu,
 * sau đó lấy toàn bộ nội dung chi tiết (Offline-Friendly).
 * 
 * @param {string} id - ID của tác phẩm, tác giả, quyển, thể loại...
 * @returns {Promise<Object|null>} Object chứa { group, record, detail }
 */
export async function resolveAndFetch(id) {
    if (!id) return null;
    
    try {
        // 1. Hỏi Máy Mẹ xem ID này nằm ở đâu và lấy record cơ bản
        const location = await MotherNode.locateById(id);
        if (!location) return null;

        // 2. Lấy dữ liệu chi tiết (Nội dung bài thơ/tác giả) từ Máy Mẹ
        const detailData = await MotherNode.getDetailData(id);

        return {
            group: location.group,
            record: location.record,
            detail: detailData || {}
        };
    } catch (err) {
        console.warn(`[CORE] Lỗi khi resolve ID "${id}":`, err);
        return null;
    }
}

// ==========================================================
// PHẦN 6: SAFE DATA ACCESS (Truy xuất dữ liệu an toàn)
// ==========================================================
export function safeGetArray(key) {
    const data = APP_DATA[key];
    return Array.isArray(data) ? data : [];
}

export function safeGetObject(key) {
    const data = APP_DATA[key];
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
}

// ==========================================================
// PHẦN 7: DEBUG HELPERS
// ==========================================================
export function debugCore() {
    const dictIndex = getDictionaryIndex();
    console.log('%c[CORE AI] Trạng thái hiện tại:', 'color: #8bb8a8; font-weight: bold;');
    console.log('  • Cache:', CoreCache.stats());
    console.log('  • Dictionary Entries:', dictIndex.length);
    console.log('  • Dictionary Groups:', Object.keys(DICTIONARY_GROUPS).length);
    console.log('  • Fortune Levels:', FORTUNE_LEVELS.length);
    console.log('  • Works Data:', safeGetArray('WORKS_DATA').length);
    console.log('  • Authors Data:', safeGetArray('AUTHOR_DATA').length);
    console.log('  • Genres Data:', safeGetArray('THE_LOAI_DATA').length);
}