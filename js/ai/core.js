/**
 * ==========================================================
 * VĂN ĐẠO AI - CORE MODULE (js/ai/core.js)
 * Vị trí: js/ai/core.js
 * Version: 1.2.0 (Multi-Agent Foundation)
 * ==========================================================
 * CHỨC NĂNG:
 * - Chuẩn hóa ngôn ngữ, xử lý tiếng Việt.
 * - Cung cấp bộ nhớ đệm (Cache).
 * - Xây dựng chỉ mục từ điển (Dictionary Index).
 * ==========================================================
 */

import { APP_DATA } from '../config.js';
import { normalizeRouteText } from '../utils.js';

// ==========================================================
// 1. CACHE MANAGER (Quản lý bộ nhớ đệm)
// ==========================================================
const CACHE_LIMIT = 200;
const resultCache = new Map();
const CACHE_VERSION = 'v1.2.0';

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
        // Trả về bản sao (Deep clone) để tránh bên ngoài sửa đổi cache gốc
        return JSON.parse(JSON.stringify(resultCache.get(fullKey)));
    },
    clear() {
        resultCache.clear();
    }
};

// ==========================================================
// 2. DICTIONARY INDEX (Tối ưu tra cứu từ điển)
// ==========================================================
let dictionaryIndexCache = null;

export function getDictionaryIndex() {
    if (dictionaryIndexCache) return dictionaryIndexCache;
    
    const dict = APP_DATA.DICTIONARY_DATA || {};
    dictionaryIndexCache = [];
    
    const DICTIONARY_GROUPS = {
        symbols: 'Biểu tượng', dienTich: 'Điển tích', hanViet: 'Hán Việt',
        tuGoiHinh: 'Từ gợi hình', tuGoiAm: 'Từ gợi âm', tuBieuCam: 'Từ biểu cảm',
        anDu: 'Ẩn dụ', soSanh: 'So sánh', tuTaoCanh: 'Từ tạo cảnh',
        thanhNgu: 'Thành ngữ', thuatNguThiPhap: 'Thuật ngữ thi pháp'
    };

    for (const [key, label] of Object.entries(DICTIONARY_GROUPS)) {
        const group = dict[key];
        if (!group || typeof group !== 'object') continue;
        for (const [keyword, value] of Object.entries(group)) {
            if (!value || typeof value !== 'object') continue;
            dictionaryIndexCache.push({
                ...value,
                keyword,
                normalizedKeyword: normalizeRouteText(keyword),
                type: label
            });
        }
    }
    return dictionaryIndexCache;
}

// ==========================================================
// 3. TEXT PROCESSING (Xử lý văn bản)
// ==========================================================

/**
 * Đếm từ khóa có trọng số, xóa vùng đã đếm để tránh trùng lặp
 */
export function countWeightedMatches(text, terms) {
    let remaining = text;
    let score = 0;
    const hits = [];
    
    // Ưu tiên cụm dài trước
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
            // Xóa vùng đã đếm để cụm ngắn hơn không đếm lại
            remaining = remaining.replace(pattern, ' ');
        }
    }
    return { score, hits };
}

/**
 * Trích xuất từ khóa cốt lõi từ câu hỏi
 * Loại bỏ các từ đệm để tìm kiếm chính xác hơn
 */
export function extractEntity(input, patternsToRemove = []) {
    let clean = input;
    patternsToRemove.forEach(p => {
        clean = clean.replace(p, '');
    });
    return clean.replace(/[?!.]/g, '').trim();
}