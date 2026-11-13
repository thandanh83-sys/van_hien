/**
 * ==========================================================
 * VĂN ĐẠO AI - CORE MODULE (js/ai/core.js)
 * Vị trí: js/ai/core.js
 * Version: 1.2.0 (Multi-Agent Foundation)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * Đây là "Hạ tầng dùng chung" của toàn bộ hệ thống Multi-Agent.
 * Mọi Agent (Literature, Poetics, Analysis, Fortune) đều phải
 * import từ file này thay vì tự viết lại logic.
 * 
 * CHỨC NĂNG:
 * - Quản lý bộ nhớ đệm (Cache Manager).
 * - Xây dựng chỉ mục từ điển (Dictionary Index).
 * - Xử lý văn bản có trọng số (Weighted Matching).
 * - Cung cấp hằng số dùng chung (Fortune Levels, Dictionary Groups).
 * - Cung cấp các hàm an toàn (Safe Data Access).
 * ==========================================================
 */

import { APP_DATA } from '../config.js';
import { normalizeRouteText } from '../utils.js';

// ==========================================================
// PHẦN 1: HẰNG SỐ DÙNG CHUNG
// ==========================================================

/**
 * Danh sách 11 nhóm từ điển có sẵn trong hệ thống.
 * Được khai báo ở đây để tất cả Agent dùng chung.
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
 * Được tách ra khỏi Fortune Agent để Analysis Agent cũng có thể đọc.
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
 * Map tra cứu nhanh Fortune theo key (O(1) thay vì O(n))
 */
export const FORTUNE_MAP = Object.freeze(
    Object.fromEntries(FORTUNE_LEVELS.map(item => [item.key, item]))
);

// ==========================================================
// PHẦN 2: CACHE MANAGER (Quản lý bộ nhớ đệm)
// ==========================================================

const CACHE_LIMIT = 200;
const resultCache = new Map();
export const CACHE_VERSION = 'v1.2.0';

/**
 * Cache Manager: LRU Cache đơn giản cho kết quả phân tích.
 * Dùng để tránh tính toán lại những bài thơ đã phân tích.
 */
export const CoreCache = {
    /**
     * Lưu kết quả vào cache.
     * @param {string} key - Khóa (nên bao gồm version + text hash)
     * @param {*} value - Giá trị cần lưu
     */
    set(key, value) {
        const fullKey = `${CACHE_VERSION}:${key}`;
        if (resultCache.has(fullKey)) resultCache.delete(fullKey);
        resultCache.set(fullKey, value);
        
        // LRU: Xóa phần tử cũ nhất nếu vượt limit
        if (resultCache.size > CACHE_LIMIT) {
            const oldest = resultCache.keys().next().value;
            resultCache.delete(oldest);
        }
    },

    /**
     * Lấy kết quả từ cache (Deep Clone để tránh bên ngoài sửa).
     * @param {string} key
     * @returns {*} Bản sao dữ liệu hoặc null
     */
    get(key) {
        const fullKey = `${CACHE_VERSION}:${key}`;
        if (!resultCache.has(fullKey)) return null;
        try {
            return JSON.parse(JSON.stringify(resultCache.get(fullKey)));
        } catch {
            return null;
        }
    },

    /**
     * Xóa toàn bộ cache (dùng khi dữ liệu thay đổi).
     */
    clear() {
        resultCache.clear();
    },

    /**
     * Xem thống kê cache (debug).
     */
    stats() {
        return { size: resultCache.size, limit: CACHE_LIMIT, version: CACHE_VERSION };
    }
};

// ==========================================================
// PHẦN 3: DICTIONARY INDEX (Tối ưu tra cứu từ điển)
// ==========================================================

let dictionaryIndexCache = null;

/**
 * Xây dựng chỉ mục từ điển 1 lần duy nhất (lazy loading).
 * @returns {Array<Object>} Mảng các entry đã chuẩn hóa
 */
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
                groupKey: key // Giữ lại key gốc (symbols, dienTich...)
            });
        }
    }
    return dictionaryIndexCache;
}

/**
 * Xóa chỉ mục từ điển (dùng khi nạp lại dữ liệu).
 */
export function invalidateDictionaryIndex() {
    dictionaryIndexCache = null;
}

// ==========================================================
// PHẦN 4: TEXT PROCESSING (Xử lý văn bản)
// ==========================================================

/**
 * Đếm từ khóa có trọng số, xóa vùng đã đếm để tránh trùng lặp.
 * 
 * Ưu điểm: Cụm dài được đếm trước, xóa khỏi văn bản, sau đó mới xét cụm ngắn.
 * Ví dụ: "quê hương" (w=2) được đếm trước, sau đó "quê" (w=1) sẽ không đếm lại vùng đó.
 * 
 * @param {string} text - Văn bản đã chuẩn hóa (chữ thường, bỏ dấu)
 * @param {Array<{t: string, w: number}>} terms - Mảng {text, weight}
 * @returns {{score: number, hits: string[]}}
 */
export function countWeightedMatches(text, terms) {
    let remaining = text;
    let score = 0;
    const hits = [];
    
    // Sắp xếp từ khóa dài trước (quan trọng!)
    const sortedTerms = [...terms].sort((a, b) => b.t.length - a.t.length);

    for (const item of sortedTerms) {
        const needle = normalizeRouteText(item.t);
        if (!needle) continue;

        // Escape các ký tự đặc biệt trong regex + xử lý khoảng trắng
        const escaped = needle
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\s+/g, '\\s+');
        
        // Word boundary: Không khớp nếu nằm trong từ khác
        const pattern = new RegExp(
            `(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 
            'giu'
        );

        const found = [...remaining.matchAll(pattern)];
        if (found.length > 0) {
            score += found.length * item.w;
            hits.push(item.t);
            // Xóa vùng đã đếm để cụm ngắn không đếm lại
            remaining = remaining.replace(pattern, ' ');
        }
    }

    return { score, hits };
}

/**
 * Trích xuất entity (từ khóa chính) từ câu hỏi.
 * Loại bỏ các từ đệm để tìm kiếm chính xác hơn.
 * 
 * @param {string} input - Câu người dùng gõ
 * @param {RegExp[]} patternsToRemove - Mảng regex cần xóa
 * @returns {string}
 */
export function extractEntity(input, patternsToRemove = []) {
    let clean = input;
    patternsToRemove.forEach(p => {
        clean = clean.replace(p, '');
    });
    return clean.replace(/[?!.]/g, '').trim();
}

// ==========================================================
// PHẦN 5: SAFE DATA ACCESS (Truy xuất dữ liệu an toàn)
// ==========================================================

/**
 * Lấy mảng từ APP_DATA một cách an toàn (chống crash nếu undefined).
 * @param {string} key - Tên field trong APP_DATA
 * @returns {Array}
 */
export function safeGetArray(key) {
    const data = APP_DATA[key];
    return Array.isArray(data) ? data : [];
}

/**
 * Lấy object từ APP_DATA một cách an toàn.
 * @param {string} key
 * @returns {Object}
 */
export function safeGetObject(key) {
    const data = APP_DATA[key];
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
}

// ==========================================================
// PHẦN 6: DEBUG HELPERS (Dành cho lập trình viên)
// ==========================================================

/**
 * In báo cáo trạng thái Core ra Console.
 * Dùng khi cần debug xem cache có bao nhiêu item, từ điển có bao nhiêu entry.
 */
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