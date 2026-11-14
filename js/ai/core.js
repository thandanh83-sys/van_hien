/**
 * ==========================================================
 * VĂN ĐẠO AI - CORE MODULE (js/ai/core.js)
 * Vị trí: js/ai/core.js
 * Version: 4.2.0 (Deep Poetic Fortune & Lazy-Load Dictionary)
 * ==========================================================
 * CHỨC NĂNG:
 * - Quản lý bộ nhớ đệm kết quả AI (CoreCache).
 * - Xây dựng chỉ mục từ điển (Dictionary Index) bất đồng bộ.
 * - Xử lý văn bản có trọng số (Weighted Matching).
 * - Cung cấp các cấp độ vận khí (FORTUNE_LEVELS) với văn phong thiền vị.
 * ==========================================================
 */

import { APP_DATA, STATE, lazyLoadDictionary } from '../config.js';
import { normalizeRouteText } from '../utils.js';
import { DataHub } from '../network/data-hub.js'; 

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

// [NÂNG CẤP] Tích hợp các đoạn văn bản "Ý tại ngôn ngoại" vào mảng fortune_texts
export const FORTUNE_LEVELS = Object.freeze([
    { 
        key: 'dai-cat', 
        weight: 10, 
        name: 'Đại cát', 
        color: '#b89552', 
        advice: 'Chủ động nắm bắt cơ hội, lấy lòng nhân hậu và sự khiêm nhường làm gốc. Tránh kiêu ngạo, tự mãn.',
        fortune_texts: [
            "Phong thuận phàm căng, chính độ thời lai vận chuyển, cứ thẳng cánh vươn ra biển lớn. Nhưng hãy lấy chữ khiêm làm mỏ neo, lấy lòng nhân làm bến đỗ, bởi hoa nở rộ nhất là khi rễ vẫn bám sâu vào lòng đất.",
            "Nguyệt viên chiếu rọi non sông, thời vận đã chín muồi cho những mưu cầu lớn. Hãy cứ tiến bước với tâm thế của người quân tử: thắng không kiêu, lấy sự bao dung làm cội rễ để giữ phúc bền lâu.",
            "Tựa cá chép vượt vũ môn, công sức bấy lâu nay đã tới ngày hái quả. Càng đứng ở đỉnh cao càng phải cúi đầu trân trọng những bàn tay từng nâng đỡ, chớ để ánh hào quang làm mờ đi bản tâm.",
            "Xuân phong đắc ý, vạn sự hanh thông như thuyền xuôi dòng nước. Hãy chủ động nắm bắt cơ duyên, lấy đức dày để gánh vác phúc lớn, đừng xem sự thuận lợi là điều hiển nhiên."
        ]
    },
    { 
        key: 'trung-cat', 
        weight: 18, 
        name: 'Trung cát', 
        color: '#8eaa91', 
        advice: 'Kiên trì, làm việc có kế hoạch và giữ chữ tín. Tránh nóng vội, chủ quan.',
        fortune_texts: [
            "Đường xa chẳng ngại dặm trường, cứ bền bỉ như thượng thiện nhược thủy. Hạt mầm gieo trong kiên nhẫn và giữ trọn chữ tín, qua sương gió ắt ngày đơm bông.",
            "Nguyệt hữu âm tình viên khuyết, mọi việc đang dần đi vào quỹ đạo ổn định. Cứ giữ vững tay chèo, làm việc có đầu có đuôi, thành quả tuy đến chậm nhưng chắc chắn và vẹn nguyên.",
            "Thiết xử thành châm, đừng vì thấy đường còn dài mà nản chí. Hãy bước đi từng bước vững chãi, giữ lời hứa với người và với chính mình, trái ngọt đang chờ ở cuối con dốc.",
            "Nắng ấm đang dần tan sương mù, những nỗ lực âm thầm bắt đầu hé lộ tín hiệu vui. Chớ nóng vội đốt cháy giai đoạn, cứ thong dong vun bồi từng chút một để gốc rễ thêm sâu."
        ]
    },
    { 
        key: 'tieu-cat', 
        weight: 22, 
        name: 'Tiểu cát', 
        color: '#9baf85', 
        advice: 'Trân trọng điều bình dị, chăm chút việc nhỏ và giữ tâm thế biết ơn.',
        fortune_texts: [
            "Tích tiểu thành đại, niềm vui nằm ở giọt sương mai đọng trên nhành lá nhỏ. Chắt chiu từng điều bình dị, tự khắc gom đủ nắng ấm cho cả một mùa.",
            "Nhất diệp tri thu, hãy biết ơn những may mắn bé nhỏ quanh mình. Chăm chút cho những việc đang làm bằng tất cả sự tỉ mỉ và dịu dàng.",
            "Phù sa tích tụ, gom từng hạt nhỏ mới bồi đắp nên bãi bồi xanh mướt. Đừng xem nhẹ những bước tiến khiêm nhường hôm nay, bởi đó là nền móng cho sự an yên mai sau.",
            "Hạnh phúc đôi khi chỉ là tách trà ấm giữa buổi chiều tà, một lời hỏi thăm đúng lúc. Trân trọng hiện tại, nâng niu những điều giản đơn, lòng tự khắc thấy đủ đầy."
        ]
    },
    { 
        key: 'binh-hoa', 
        weight: 24, 
        name: 'Bình hòa', 
        color: '#778c85', 
        advice: 'Giữ sự điều độ, suy xét thấu đáo và làm tốt việc trước mắt. Tránh cố cưỡng cầu.',
        fortune_texts: [
            "Vân tại thanh thiên, thủy tại bình, lòng an nhiên như mặt hồ thu không gợn sóng. Thuận theo tự nhiên mà sống, chẳng cưỡng cầu hoa nở trái mùa.",
            "Bát phong xuy bất động, mọi sự hôm nay cứ để tự nhiên an bài. Làm tốt bổn phận trước mắt, không mong cầu quá cao cũng chẳng lo âu vô cớ, tự khắc lòng thanh thản.",
            "Giữ cho mình một khoảng lặng như ngôi cổ tự giữa rừng sâu, mặc ngoài kia gió bụi xoay vần. Biết đủ là hạnh phúc, biết dừng đúng lúc là khôn ngoan, cứ thong dong tận hưởng nhịp sống hiện tại.",
            "Thủy chí thanh tắc vô ngư, người xét nét quá thì lòng chẳng yên. Hãy giữ sự điều độ trong từng suy nghĩ và hành động, để mọi thứ diễn ra nhẹ nhàng như hơi thở."
        ]
    }, 
    { 
        key: 'tieu-hung', 
        weight: 16, 
        name: 'Tiểu hung', 
        color: '#ad876d', 
        advice: 'Kiểm tra lại kế hoạch, lắng nghe ý kiến đáng tin cậy. Tránh quyết định bốc đồng.',
        fortune_texts: [
            "Dục tốc bất đạt, gặp đoạn suối sâu thì chậm bước dò đá. Lùi lại một nhịp để nghe tiếng gió và lời can gián chân thành, tránh một phút bốc đồng mà lỡ cả chuyến đò.",
            "Ám vân già che khuất nhật nguyệt, báo hiệu một vài trắc trở nhỏ trên đường đi. Hãy khoan đưa ra quyết định vội vàng, dành thời gian rà soát lại mọi thứ và lắng nghe những người đi trước.",
            "Thất chi hào ly, mậu dĩ thiên lý, sự chủ quan lúc này dễ dẫn đến những rắc rối không đáng có. Giữ cái đầu lạnh, bước chậm lại một chút để nhìn rõ sỏi đá dưới chân.",
            "Nghịch phong bất khả dương phàm, đừng cố gồng mình đối đầu trực diện. Bình tĩnh xem xét lại kế hoạch, điều chỉnh hướng đi kịp thời sẽ giúp bạn tránh được hao tổn."
        ]
    },
    { 
        key: 'dai-hung', 
        weight: 10, 
        name: 'Đại hung', 
        color: '#9c7777', 
        advice: 'Thận trọng, rà soát những điều quan trọng và ưu tiên sự an toàn. Tránh liều lĩnh.',
        fortune_texts: [
            "Kinh đào hãi lãng, bất khả xuất hành, lúc bão giông hãy học cách cúi mình như ngọn cỏ. Giữ lấy bình an nơi bến đỗ, thủ tĩnh chờ khổ tận cam lai, đợi trời quang mây tạnh hãy căng buồm.",
            "Chân kim bất phạ hỏa, nghịch cảnh ập đến là lúc cần sự tỉnh táo hơn bao giờ hết. Tuyệt đối tránh liều lĩnh hay cố chấp, hãy ưu tiên bảo toàn lực lượng và giữ sự an toàn lên hàng đầu.",
            "Đêm tối nhất là lúc trước bình minh, nhưng khi chưa thấy ánh sáng thì chớ vội bước bừa vào rừng rậm. Hãy thu mình lại, rà soát những điều cốt lõi nhất và kiên nhẫn chờ cơn giông đi qua.",
            "Nhu thắng cương, nhược thắng cường, cây cứng giữa bão lớn thì dễ gãy, nước mềm mại luồn qua khe đá lại vươn tới biển khơi. Lúc thời vận chưa thông, biết nhẫn nhịn và lùi về phòng thủ chính là bản lĩnh của người trí tuệ."
        ]
    }
]);

export const FORTUNE_MAP = Object.freeze(
    Object.fromEntries(FORTUNE_LEVELS.map(item => [item.key, item]))
);

// =====================================================================
// PHẦN 2: CACHE MANAGER (Quản lý bộ nhớ đệm kết quả AI)
// =====================================================================
const CACHE_LIMIT = 200;
const resultCache = new Map();
export const CACHE_VERSION = 'v4.2.0';

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
// PHẦN 3: DICTIONARY INDEX (Tối ưu tra cứu từ điển - BẤT ĐỒNG BỘ)
// =====================================================================
let dictionaryIndexCache = null;

export async function getDictionaryIndex() {
    if (dictionaryIndexCache) return dictionaryIndexCache;
    
    // [QUAN TRỌNG] Phải chờ tải xong từ điển (Lazy Load) trước khi xây dựng Index
    await lazyLoadDictionary();

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
// PHẦN 5: ID RESOLVER (Cầu nối giữa AI và DataHub)
// =====================================================================

/**
 * Lấy dữ liệu chi tiết của một ID hoặc Tên bất kỳ.
 * Tự động chuyển đổi Tên (Title) thành ID trước khi fetch.
 * 
 * @param {string} idOrTitle - ID, title, hoặc name.
 * @returns {Promise<Object|null>} { group, record, detail }
 */
export async function resolveAndFetch(idOrTitle) {
    if (!idOrTitle) return null;

    try {
        let resolvedId = String(idOrTitle).trim();
        let meta = DataHub.getMetadata(resolvedId);

        // Nếu không phải ID, tự động resolve title -> ID
        if (!meta) {
            const target = DataHub.resolveIdFromQuery(resolvedId);
            if (target && target.id) {
                resolvedId = target.id;
                meta = DataHub.getMetadata(resolvedId);
            }
        }

        if (!meta) {
            console.warn(`[CORE] Không resolve được "${idOrTitle}".`);
            return null;
        }

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

export async function debugCore() {
    const dictIndex = await getDictionaryIndex();
    console.log('%c[CORE AI] Trạng thái hiện tại:', 'color: #8bb8a8; font-weight: bold;');
    console.log('  • Version:', CACHE_VERSION);
    console.log('  • Cache:', CoreCache.stats());
    console.log('  • Dictionary Entries:', dictIndex.length);
    console.log('  • DataHub Status:', DataHub.getMetadata('truyen-kieu') ? 'Sẵn sàng' : 'Chưa kết nối');
}
