/**
 * ==========================================================
 * VĂN ĐẠO AI - CORE MODULE (js/ai/core.js)
 * Vị trí: js/ai/core.js
 * Version: 3.3.0 (Fix: resolveAndFetch Tự Động Resolve Title → ID)
 * ==========================================================
 * CHỨC NĂNG:
 * - Quản lý bộ nhớ đệm kết quả AI (CoreCache).
 * - Xây dựng chỉ mục từ điển (Dictionary Index).
 * - Xử lý văn bản có trọng số (Weighted Matching).
 * - Cung cấp hằng số dùng chung (Fortune Levels, Dictionary Groups).
 * - [QUAN TRỌNG] Cung cấp hàm resolveAndFetch() để AI lấy dữ liệu
 *   thông qua DataHub (Trung tâm dữ liệu mới).
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v3.2.0: Plugin Architecture.
 * - v3.3.0: SỬA LỖI WARNING NOISE — `resolveAndFetch` trước đây CHỈ
 *           chấp nhận ID, nhưng nhiều nơi gọi (literature.getWorkInfo,
 *           literature.defineGenre, history.getHistoricalContext) lại
 *           truyền vào TITLE (VD: "Ai Đã Đặt Tên Cho Dòng Sông?").
 *           Hệ quả: log warning `[CORE] Không tìm thấy ID "..." trong
 *           Metadata` xuất hiện, dù kết quả cuối vẫn đúng nhờ fallback.
 *           Nay thêm bước tự động resolve: nếu input không phải ID
 *           trong GLOBAL_INDEX, thử DataHub.resolveIdFromQuery(input)
 *           để chuyển title → ID, rồi mới lấy metadata.
 * ==========================================================
 */

import { APP_DATA, STATE } from '../config.js';
import { normalizeRouteText } from '../utils.js';
import { DataHub } from '../network/data-hub.js'; // Kết nối với Trái tim dữ liệu

// =====================================================================
// PHẦN 1: HẰNG SỐ DÙNG CHUNG
// =====================================================================

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

export const FORTUNE_LEVELS = Object.freeze([
    { key: 'dai-cat', weight: 10, name: 'Đại cát', color: '#b89552', advice: 'Chủ động nắm bắt cơ hội, lấy lòng nhân hậu và sự khiêm nhường làm gốc. Tránh kiêu ngạo, tự mãn hoặc xem thuận lợi nhất thời là điều hiển nhiên.' },
    { key: 'trung-cat', weight: 18, name: 'Trung cát', color: '#8eaa91', advice: 'Kiên trì, làm việc có kế hoạch và giữ chữ tín. Tránh nóng vội, chủ quan hoặc bỏ dở việc đang làm.' },
    { key: 'tieu-cat', weight: 22, name: 'Tiểu cát', color: '#9baf85', advice: 'Trân trọng điều bình dị, chăm chút việc nhỏ và giữ tâm thế biết ơn. Tránh xem nhẹ những điều nhỏ bé.' },
    { key: 'binh-hoa', weight: 24, name: 'Bình hòa', color: '#778c85', advice: 'Giữ sự điều độ, suy xét thấu đáo và làm tốt việc trước mắt. Tránh cố cưỡng cầu kết quả.' },
    { key: 'tieu-hung', weight: 16, name: 'Tiểu hung', color: '#ad876d', advice: 'Kiểm tra lại kế hoạch, lắng nghe ý kiến đáng tin cậy. Tránh quyết định bốc đồng, hấp tấp.' }, 
    { key: 'dai-hung', weight: 10, name: 'Đại hung', color: '#9c7777', advice: 'Thận trọng, rà soát những điều quan trọng và ưu tiên sự an toàn. Tránh liều lĩnh, cố chấp khi chưa đủ thông tin.' }
]);

export const FORTUNE_MAP = Object.freeze(
    Object.fromEntries(FORTUNE_LEVELS.map(item => [item.key, item]))
);

// =====================================================================
// PHẦN 2: CACHE MANAGER (Quản lý bộ nhớ đệm kết quả AI)
// =====================================================================
const CACHE_LIMIT = 200;
const resultCache = new Map();
export const CACHE_VERSION = 'v3.3.0';

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

// =====================================================================
// PHẦN 3: DICTIONARY INDEX (Tối ưu tra cứu từ điển)
// =====================================================================
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

// =====================================================================
// PHẦN 4: TEXT PROCESSING (Xử lý văn bản)
// =====================================================================

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

export function extractEntity(input, patternsToRemove = []) {
    let clean = input;
    patternsToRemove.forEach(p => { clean = clean.replace(p, ''); });
    return clean.replace(/[?!.]/g, '').trim();
}

// =====================================================================
// PHẦN 5: ID RESOLVER (Cầu nối giữa AI và DataHub) — [ĐÃ FIX v3.3.0]
// =====================================================================

/**
 * Lấy dữ liệu chi tiết của một ID bất kỳ.
 * Giao phó hoàn toàn cho DataHub xử lý (Offline-First).
 *
 * [FIX v3.3.0] Tự động resolve TITLE → ID trước khi fetch:
 *   - Input có thể là ID    (VD: "truyen-kieu")
 *   - Hoặc TITLE            (VD: "Truyện Kiều", "Ai Đã Đặt Tên Cho Dòng Sông?")
 *   - Hoặc NAME             (VD: "Thơ Lục Bát")
 *
 * QUY TRÌNH (4 bước phòng thủ):
 *   1. Thử dùng input như ID trực tiếp (nhanh — O(1) qua GLOBAL_INDEX).
 *   2. Nếu fail, dùng DataHub.resolveIdFromQuery(input) để chuyển title → ID.
 *   3. Nếu vẫn fail, thử fuzzy search qua VDSearchEngine (nếu cần).
 *   4. Nếu tất cả fail → log warning (đây mới là lỗi thực sự).
 *
 * @param {string} idOrTitle - ID, title, hoặc name.
 * @returns {Promise<Object|null>} { group, record, detail }
 */
export async function resolveAndFetch(idOrTitle) {
    if (!idOrTitle) return null;

    try {
        // -----------------------------------------------------------------
        // BƯỚC 1: Thử dùng trực tiếp như ID (nhanh nhất — không tốn chi phí)
        // -----------------------------------------------------------------
        let resolvedId = String(idOrTitle).trim();
        let meta = DataHub.getMetadata(resolvedId);

        // -----------------------------------------------------------------
        // BƯỚC 2 [FIX v3.3.0]: Nếu không phải ID, tự động resolve title → ID
        // -----------------------------------------------------------------
        // DataHub.resolveIdFromQuery xử lý được cả 3 trường hợp:
        //   - Input là ID    → trả luôn { id, group }
        //   - Input là TITLE → tìm trong GLOBAL_RECORDS theo title/alias
        //   - Input là NAME  → tìm trong GLOBAL_RECORDS theo name
        if (!meta) {
            const target = DataHub.resolveIdFromQuery(resolvedId);
            if (target && target.id) {
                resolvedId = target.id;
                meta = DataHub.getMetadata(resolvedId);
            }
        }

        // -----------------------------------------------------------------
        // BƯỚC 3 [FIX v3.3.0]: Nếu vẫn không có → log warning và trả null
        // -----------------------------------------------------------------
        // Đây mới là lỗi THỰC SỰ: input không match cả ID lẫn title/name.
        // Warning cũ đã bị thay thế bằng thông báo rõ ràng hơn.
        if (!meta) {
            console.warn(
                `[CORE] Không resolve được "${idOrTitle}" ` +
                `(đã thử cả ID, title và name trong GLOBAL_INDEX).`
            );
            return null;
        }

        // -----------------------------------------------------------------
        // BƯỚC 4: Lấy nội dung chi tiết (Từ RAM hoặc Fetch qua Service Worker)
        // -----------------------------------------------------------------
        const detail = await DataHub.getDetail(resolvedId);

        return {
            group: meta.group,
            record: meta.data,
            detail: detail || {}
        };
    } catch (err) {
        console.warn(`[CORE] Lỗi khi resolve "${idOrTitle}":`, err);
        return null;
    }
}

// =====================================================================
// PHẦN 6: SAFE DATA ACCESS (Truy xuất dữ liệu an toàn)
// =====================================================================

export function safeGetArray(key) {
    const data = APP_DATA[key];
    return Array.isArray(data) ? data : [];
}

export function safeGetObject(key) {
    const data = APP_DATA[key];
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
}

// =====================================================================
// PHẦN 7: DEBUG HELPERS (Công cụ gỡ lỗi)
// =====================================================================

export function debugCore() {
    const dictIndex = getDictionaryIndex();
    console.log('%c[CORE AI] Trạng thái hiện tại:', 'color: #8bb8a8; font-weight: bold;');
    console.log('  • Version:', CACHE_VERSION);
    console.log('  • Cache:', CoreCache.stats());
    console.log('  • Dictionary Entries:', dictIndex.length);
    console.log('  • Dictionary Groups:', Object.keys(DICTIONARY_GROUPS).length);
    console.log('  • Fortune Levels:', FORTUNE_LEVELS.length);
    console.log('  • Works Data:', safeGetArray('WORKS_DATA').length);
    console.log('  • Authors Data:', safeGetArray('AUTHOR_DATA').length);
    console.log('  • Genres Data:', safeGetArray('THE_LOAI_DATA').length);
    console.log('  • DataHub Status:', DataHub.getMetadata('truyen-kieu') ? 'Sẵn sàng' : 'Chưa kết nối');
}
