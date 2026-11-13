/**
 * ==========================================================
 * VĂN ĐẠO - RENDER MODULE (js/render.js)
 * Đã cập nhật: Hàm findSymbols dùng Regex ranh giới từ.
 * ==========================================================
 */

import { APP_DATA, STATE, ICONS, ITEMS_PER_PAGE, ENCY_ITEMS_PER_PAGE } from './config.js';
import { escapeHTML, normalizeRouteId, highlightText, formatContent, removeAccents } from './utils.js';
import { VDSearchEngine } from './search.js';

// ... (Giữ nguyên PerformanceEngine, initMainFilters, renderHeritage, ContentManager, 
// bindEncyclopediaEvents, renderEncyclopedia, renderPagination, changePage...)

// THAY THẾ TOÀN BỘ HÀM findSymbols CŨ BẰNG HÀM DƯỚI ĐÂY:
export function findSymbols(text) {
    if (!text) return [];

    // 1. Chuẩn hóa văn bản đầu vào
    const source = String(text).toLocaleLowerCase('vi').normalize('NFC');

    // 2. Lấy từ điển
    const dictionary = APP_DATA.DICTIONARY_DATA || {};
    const groups = [
        ['Biểu tượng', dictionary.symbols || {}],
        ['Điển tích', dictionary.dienTich || {}],
        ['Hán Việt', dictionary.hanViet || {}]
    ];

    const candidates = [];

    // 3. Duyệt từng nhóm
    for (const [type, entries] of groups) {
        for (const [keyword, info] of Object.entries(entries)) {
            const normalizedKeyword = String(keyword).toLocaleLowerCase('vi').normalize('NFC').trim();
            if (!normalizedKeyword) continue;

            const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
            const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, 'u');
            const match = pattern.exec(source);

            if (!match) continue;

            const start = match.index + match[1].length;
            const end = start + match[2].length;

            candidates.push({
                type,
                keyword,
                info: info && typeof info === 'object' ? info : { mean: String(info || '') },
                start,
                end,
                length: end - start
            });
        }
    }

    // 4. Ưu tiên cụm từ dài (VD: "ánh trăng" > "trăng")
    candidates.sort((a, b) => b.length - a.length || a.start - b.start);

    const accepted = [];
    // 5. Loại bỏ chồng lấn
    for (const item of candidates) {
        const overlaps = accepted.some(hit => item.start < hit.end && item.end > hit.start);
        if (!overlaps) accepted.push(item);
    }

    // 6. Trả về theo thứ tự xuất hiện
    return accepted.sort((a, b) => a.start - b.start).map(({ type, keyword, info }) => ({
        type,
        keyword,
        ...info
    }));
}

// ... (Giữ nguyên các hàm còn lại: highlightSymbolsInContent, findRelatedWorks, appendRelatedSection, renderPagination, changePage)
