/**
 * ==========================================================
 * VĂN ĐẠO AI ENGINE (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 1.0.0 (Network Edition)
 * ==========================================================
 * Chức năng:
 * 
 * 1. PHÂN TÍCH VĂN HỌC (analyzeWork)
 *    - Nhận diện chủ đề qua từ khóa
 *    - Tìm biểu tượng trong văn bản
 *    - Sinh lời bình tự động
 * 
 * 2. BÓI THƠ (synthesizeDynamicFortune)
 *    - Tính vận khí (6 bậc)
 *    - Sinh câu dẫn, lời bình, lời khuyên
 * 
 * 3. AI DISPATCHER (MỚI - v1.0.0)
 *    - Intent Router cho "Hỏi Đạo"
 *    - Parse câu hỏi người dùng → intent
 *    - Dispatch tới MotherNode để lấy dữ liệu
 * 
 * ĐÃ FIX (P4.15):
 * - Regex cắt "Nên:" / "Tránh:" có fallback khi không có "Nên:"
 * 
 * ==========================================================
 */

import { APP_DATA } from './config.js';
import { findSymbols } from './render.js';
import { MotherNode } from './network/mother.js';
import { VDSearchEngine } from './search.js';
import { escapeHTML } from './utils.js';

// ==========================================================
// PHẦN 1: CACHE
// ==========================================================
const CACHE_LIMIT = 120;
const resultCache = new Map();

function cacheSet(key, value) {
    if (resultCache.has(key)) resultCache.delete(key);
    resultCache.set(key, value);
    if (resultCache.size > CACHE_LIMIT) {
        const oldest = resultCache.keys().next().value;
        resultCache.delete(oldest);
    }
}

// ==========================================================
// PHẦN 2: THEME RULES (Quy tắc phân tích chủ đề)
// ==========================================================
const THEME_RULES = [
    {
        id: 'nature',
        label: 'thiên nhiên',
        terms: ['trăng', 'nguyệt', 'sông', 'núi', 'mây', 'gió', 'mưa', 'nắng', 'hoa', 'lá', 'chim', 'đò', 'biển', 'suối', 'thu', 'xuân', 'hạ', 'đông'],
        commentary: 'Hệ thống hình ảnh thiên nhiên tạo nên lớp cảnh sắc cho tác phẩm. Khi đọc, cần đặt cảnh vật trong quan hệ với điểm nhìn và cảm xúc của chủ thể trữ tình, thay vì chỉ xem đó là phông nền.'
    },
    {
        id: 'homesickness',
        label: 'quê hương và ký ức',
        terms: ['quê', 'nhà', 'làng', 'xóm', 'đất nước', 'non sông', 'cố hương', 'xa quê', 'nhớ nhà', 'quê hương'],
        commentary: 'Tác phẩm gợi mở mối liên hệ giữa con người với quê hương và không gian nguồn cội. Ý nghĩa của nỗi nhớ sẽ rõ hơn khi đối chiếu hình ảnh quê nhà với hoàn cảnh và giọng điệu của văn bản.'
    },
    {
        id: 'love',
        label: 'tình cảm',
        terms: ['yêu', 'thương', 'tình', 'duyên', 'người thương', 'đôi', 'nhớ em', 'nhớ anh', 'lứa đôi'],
        commentary: 'Tình cảm là một mạch đáng chú ý trong văn bản. Sắc thái của nó không chỉ nằm ở lời bộc bạch trực tiếp mà còn có thể hiện ra qua cách lựa chọn hình ảnh, nhịp điệu và khoảng lặng.'
    },
    {
        id: 'time',
        label: 'thời gian và hồi tưởng',
        terms: ['thời gian', 'năm tháng', 'tuổi trẻ', 'tuổi xuân', 'ngày xưa', 'hoàng hôn', 'chiều', 'bóng xế', 'phai', 'tàn'],
        commentary: 'Dấu hiệu thời gian góp phần tạo nên chiều sâu suy tưởng. Sự đối chiếu giữa hiện tại và quá khứ, hoặc giữa cái đang có và cái đã qua, có thể là chìa khóa để đọc mạch cảm xúc.'
    },
    {
        id: 'humanity',
        label: 'thân phận con người',
        terms: ['người', 'đời', 'phận', 'kiếp', 'nhân sinh', 'đau', 'khổ', 'nước mắt', 'công bằng', 'bất công', 'nghèo', 'khổ đau'],
        commentary: 'Văn bản hướng sự chú ý đến thân phận và trải nghiệm con người. Khi bình giảng, nên gắn suy tưởng nhân sinh với chi tiết cụ thể, tránh tách thông điệp khỏi hoàn cảnh được miêu tả.'
    },
    {
        id: 'patriotism',
        label: 'quê hương và cộng đồng',
        terms: ['tổ quốc', 'đất nước', 'giang sơn', 'độc lập', 'tự do', 'chiến sĩ', 'quê hương', 'đồng bào', 'non sông'],
        commentary: 'Tác phẩm có những dấu hiệu hướng về cộng đồng và đất nước. Cần xem tình cảm ấy được thể hiện qua hình tượng, giọng điệu và hoàn cảnh lịch sử nào để tránh bình luận chung chung.'
    },
    {
        id: 'resilience',
        label: 'nghị lực và hy vọng',
        terms: ['vượt', 'đường xa', 'bão', 'giông', 'gian nan', 'khó khăn', 'bền chí', 'kiên trì', 'hy vọng', 'niềm tin'],
        commentary: 'Văn bản gợi ra hành trình đối diện thử thách và khả năng hướng về phía trước. Giá trị của mạch ý này cần được nhìn từ diễn biến và lựa chọn của con người trong tác phẩm.'
    }
];

const FALLBACK_COMMENTARY = 'Tác phẩm cần được đọc từ những chi tiết cụ thể: hình ảnh nổi bật, giọng điệu, cách tổ chức câu chữ và mối liên hệ giữa các phần.';

// ==========================================================
// PHẦN 3: FORTUNE LEVELS (6 bậc vận khí)
// ==========================================================
const FORTUNE_LEVELS = [
    { key: 'dai-cat', weight: 10, name: 'Đại cát', color: '#b89552', advice: 'Chủ động nắm bắt cơ hội, lấy lòng nhân hậu và sự khiêm nhường làm gốc. Tránh kiêu ngạo, tự mãn hoặc xem thuận lợi nhất thời là điều hiển nhiên.' },
    { key: 'trung-cat', weight: 18, name: 'Trung cát', color: '#8eaa91', advice: 'Kiên trì, làm việc có kế hoạch và giữ chữ tín. Tránh nóng vội, chủ quan hoặc bỏ dở việc đang làm.' },
    { key: 'tieu-cat', weight: 22, name: 'Tiểu cát', color: '#9baf85', advice: 'Trân trọng điều bình dị, chăm chút việc nhỏ và giữ tâm thế biết ơn. Tránh xem nhẹ những điều nhỏ bé.' },
    { key: 'binh-hoa', weight: 24, name: 'Bình hòa', color: '#778c85', advice: 'Giữ sự điều độ, suy xét thấu đáo và làm tốt việc trước mắt. Tránh cố cưỡng cầu kết quả.' },
    { key: 'tieu-hung', weight: 16, name: 'Tiểu hung', color: '#ad876d', advice: 'Kiểm tra lại kế hoạch, lắng nghe ý kiến đáng tin cậy. Tránh quyết định bốc đồng, hấp tấp.' },
    { key: 'dai-hung', weight: 10, name: 'Đại hung', color: '#9c7777', advice: 'Thận trọng, rà soát những điều quan trọng và ưu tiên sự an toàn. Tránh liều lĩnh, cố chấp khi chưa đủ thông tin.' }
];
const FORTUNE_FALLBACK = Object.fromEntries(FORTUNE_LEVELS.map(item => [item.key, item]));

// ==========================================================
// PHẦN 4: UTILITIES
// ==========================================================
function normalizeText(value = '') {
    return String(value).toLocaleLowerCase('vi').normalize('NFC').replace(/\s+/g, ' ').trim();
}

function countMatches(text, terms) {
    let score = 0;
    const hits = [];
    for (const term of terms) {
        const needle = normalizeText(term);
        if (!needle) continue;
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'giu');
        const found = text.match(pattern);
        if (found?.length) { score += found.length; hits.push(term); }
    }
    return { score, hits };
}

function getWorkText(work = {}) {
    return [
        work.title,
        work.author,
        work.desc,
        work.description,
        work.content,
        work.excerpt
    ].filter(Boolean).join('\n');
}

function selectThemes(text) {
    const normalized = normalizeText(text);
    return THEME_RULES.map(rule => ({ rule, ...countMatches(normalized, rule.terms) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
}

function getSymbolEvidence(text) {
    try {
        return findSymbols(text).slice(0, 4).map(symbol => ({
            keyword: symbol.keyword,
            type: symbol.type,
            meaning: symbol.mean || '',
            volume: symbol.vol || '',
            section: symbol.sec || ''
        }));
    } catch (error) {
        return [];
    }
}

// ==========================================================
// PHẦN 5: PUBLIC API - ANALYZE
// ==========================================================

/**
 * Phân tích tác phẩm: chủ đề + biểu tượng + lời bình
 * @param {Object} work
 * @returns {{themes, commentaryText, evidence, confidence}}
 */
export function analyzeWork(work = {}) {
    const sourceText = getWorkText(work);
    const cacheKey = `work:${normalizeText(sourceText)}`;
    if (resultCache.has(cacheKey)) return resultCache.get(cacheKey);

    const themes = selectThemes(sourceText);
    const symbols = getSymbolEvidence(sourceText);

    let commentaryText = themes.length ? themes[0].rule.commentary : FALLBACK_COMMENTARY;
    if (symbols.length > 0) {
        commentaryText += ` Đáng chú ý, văn bản xuất hiện hình ảnh "${symbols[0].keyword}", cần được đặt trong ngữ cảnh để hiểu rõ tầng nghĩa sâu kín.`;
    }

    const result = {
        themes: themes.map(t => t.rule.label),
        commentaryText,
        evidence: { themes, symbols },
        confidence: themes.length ? 'trung bình' : 'thấp'
    };

    cacheSet(cacheKey, result);
    return result;
}

// ==========================================================
// PHẦN 6: PUBLIC API - FORTUNE
// ==========================================================

/**
 * Rút ngẫu nhiên 1 vận khí (weighted)
 * @returns {string} fortuneKey
 */
export function calculateFortune() {
    const totalWeight = FORTUNE_LEVELS.reduce((sum, item) => sum + item.weight, 0);
    let draw = Math.random() * totalWeight;
    for (const item of FORTUNE_LEVELS) {
        draw -= item.weight;
        if (draw < 0) return item.key;
    }
    return 'binh-hoa';
}

/**
 * Lấy thông tin 1 vận khí
 * @param {string} key
 * @returns {Object}
 */
export function getFortuneInfo(key = 'binh-hoa') {
    const fallback = FORTUNE_FALLBACK[key] || FORTUNE_FALLBACK['binh-hoa'];
    const saved = APP_DATA.FORTUNE_CONFIG?.[key] || {};
    return {
        ...fallback,
        ...saved,
        key,
        name: saved.name || fallback.name,
        color: saved.color || fallback.color
    };
}

// ==========================================================
// PHẦN 7: PUBLIC API - TỔNG HỢP BÓI THƠ
// ==========================================================

/**
 * Tổng hợp bói thơ: câu dẫn + vận khí + lời khuyên
 * 
 * [FIX P4.15] Regex cắt "Nên:"/"Tránh:" có fallback
 * 
 * @param {Object} work
 * @param {string} fortuneKey
 * @returns {Object}
 */
export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa') {
    const fortune = getFortuneInfo(fortuneKey);
    const analysis = analyzeWork(work);

    const title = work.title || 'trang sách';
    const author = work.author || 'tác giả';
    const mainTheme = analysis.themes.length > 0 ? analysis.themes[0] : 'nhân sinh';

    const mainSymbol = analysis.evidence.symbols.length > 0
        ? `"${analysis.evidence.symbols[0].keyword}"`
        : null;

    // 1. CÂU DẪN
    let bridgeText = `Duyên lành đưa bạn đến với "${title}" của ${author} trong một ngày vận khí ${fortune.name.toLowerCase()}. `;
    if (fortuneKey === 'dai-cat') {
        bridgeText += `Trang sách mở ra như một lời chúc phúc, hãy đón nhận bằng tâm thế rộng mở.`;
    } else if (fortuneKey === 'trung-cat' || fortuneKey === 'tieu-cat') {
        bridgeText += `Mọi sự đang diễn ra êm đềm, thật hợp để bạn tĩnh tâm chiêm nghiệm.`;
    } else if (fortuneKey === 'binh-hoa') {
        bridgeText += `Ngày hôm nay như mặt hồ phẳng lặng, rất thích hợp để lắng lòng.`;
    } else {
        bridgeText += `Dẫu ngoài kia có chút gợn sóng, nhưng trang sách này sẽ là một chốn bình yên.`;
    }

    // 2. LỜI KHUYÊN ĐỘNG
    let dynamicAdvice = "";
    if (fortuneKey === 'dai-cat') {
        dynamicAdvice = `Vận khí đang rực rỡ, hãy dùng cảm hứng từ chủ đề "${mainTheme}" của tác phẩm để chủ động gieo duyên lành và lan tỏa những điều tốt đẹp.`;
    } else if (fortuneKey === 'tieu-hung' || fortuneKey === 'dai-hung') {
        dynamicAdvice = `Khi vận khí có chút trắc trở, hãy mượn sự tĩnh tại và bài học về "${mainTheme}" trong tác phẩm để làm điểm tựa, nhắc mình chậm lại, quan sát sâu hơn và không hấp tấp.`;
    } else {
        dynamicAdvice = `Hãy kết hợp sự thong dong của vận khí ${fortune.name.toLowerCase()} với những chiêm nghiệm về "${mainTheme}" trong trang sách để vun đắp những giá trị bền vững.`;
    }

    if (mainSymbol) {
        dynamicAdvice += ` Đặc biệt, hãy để hình ảnh ${mainSymbol} đánh thức những suy ngẫm sâu kín trong bạn.`;
    }

    // 3. [FIX P4.15] TÁCH NÊN / TRÁNH CÓ FALLBACK
    let nenText = "", tranhText = "";
    if (fortune.advice) {
        const matchNen = fortune.advice.match(/Nên:(.*?)(?=Tránh:|$)/i);
        const matchTranh = fortune.advice.match(/Tránh:(.*)/i);
        nenText = matchNen ? matchNen[1].trim() : '';
        tranhText = matchTranh ? matchTranh[1].trim() : '';

        // [FIX] Fallback: Nếu advice không có "Nên:" và không có "Tránh:"
        // → dùng toàn bộ advice làm "Nên"
        if (!nenText && !tranhText) {
            nenText = fortune.advice.trim();
        }
    }

    let adviceHtml = '';
    if (nenText) {
        adviceHtml += `<div style="margin-bottom:8px;"><strong style="color:var(--accent-text);">Nên:</strong> <span style="color:var(--text-main);">${escapeHTML(nenText)}</span></div>`;
    }
    if (tranhText) {
        adviceHtml += `<div style="margin-bottom:10px;"><strong style="color:#a36b6b;">Tránh:</strong> <span style="color:var(--text-muted);">${escapeHTML(tranhText)}</span></div>`;
    }

    adviceHtml += `
        <div style="border-top:1px dashed rgba(128,128,128,0.2); padding-top:10px; margin-top:10px;">
            <strong style="color:var(--accent-text);">Gợi ý đọc:</strong>
            <span style="color:var(--text-main);">${escapeHTML(dynamicAdvice)}</span>
        </div>
    `;

    // 4. LỜI CHIÊM NGHIỆM (từ JSON hoặc fallback)
    const commentaryData = APP_DATA.COMMENTARY_DATA?.[fortuneKey] || {};
    const commentaries = Array.isArray(commentaryData.commentaries) ? commentaryData.commentaries : [];
    const fortuneReflection = commentaries.length > 0
        ? commentaries[Math.floor(Math.random() * commentaries.length)]
        : `Lời chiêm nghiệm cho vận khí ${fortune.name}: Hãy giữ tâm thế bình thản trước mọi biến động.`;

    return {
        bridgeText,
        fortuneReflection,
        literaryCommentary: analysis.commentaryText,
        adviceHtml,
        fortuneInfo: fortune,
        confidence: analysis.confidence,
        evidence: analysis.evidence
    };
}

// ==========================================================
// PHẦN 8: AI DISPATCHER (MỚI - v1.0.0)
// ==========================================================

/**
 * AI Dispatcher: Intent Router cho "Hỏi Đạo"
 * 
 * Parse câu hỏi tự nhiên → intent → dispatch tới MotherNode
 */
export const AIDispatcher = (() => {

    /**
     * Parse intent từ câu hỏi
     * @param {string} input
     * @returns {{type: string, query: string}}
     */
    function parseIntent(input) {
        const t = (input || '').toLowerCase().trim();
        if (!t) return { type: 'empty', query: '' };

        // 1. "Ai viết bài X" / "Tác giả của X"
        if (/(ai|tác giả).*(viết|sáng tác|của bài|của tác phẩm)/i.test(t)) {
            return { type: 'find-author-of', query: extractTitle(t) };
        }

        // 2. "Bài nào của Y" / "Tác phẩm của Y"
        if (/(bài nào|tác phẩm nào|liệt kê|kể tên).*(của|viết bởi)/i.test(t)) {
            return { type: 'find-works-by', query: extractAuthor(t) };
        }

        // 3. "Thể loại X là gì"
        if (/(thể loại|định nghĩa|khái niệm).*(là gì|như thế nào)/i.test(t)) {
            return { type: 'define-genre', query: extractGenre(t) };
        }

        // 4. "Trạng thái mạng" / "node"
        if (/(trạng thái|mạng|node|máy con|máy mẹ)/i.test(t)) {
            return { type: 'network-info', query: t };
        }

        // 5. Fallback: tìm kiếm thường
        return { type: 'search', query: input.trim() };
    }

    /**
     * Dispatch intent → MotherNode → result
     * @param {{type, query}} intent
     * @returns {Promise<Object>}
     */
    async function dispatch(intent) {
        try {
            switch (intent.type) {
                case 'find-author-of': {
                    const resp = await MotherNode.request({ group: 'tinh-hoa' });
                    const work = (resp.records || []).find(w =>
                        w.title && w.title.toLowerCase().includes(intent.query.toLowerCase())
                    );
                    if (work) {
                        return {
                            answer: `${work.author || 'Không rõ tác giả'}`,
                            detail: `Tác phẩm: "${work.title}"`,
                            source: resp.source,
                            meta: [work]
                        };
                    }
                    return {
                        answer: 'Không tìm thấy tác phẩm này.',
                        source: resp.source
                    };
                }

                case 'find-works-by': {
                    const resp = await MotherNode.request({ group: 'tinh-hoa' });
                    const works = (resp.records || []).filter(w =>
                        w.author && w.author.toLowerCase().includes(intent.query.toLowerCase())
                    );
                    if (works.length > 0) {
                        return {
                            answer: works.map(w => w.title).join(' · '),
                            detail: `Tìm thấy ${works.length} tác phẩm của ${works[0].author}`,
                            source: resp.source,
                            meta: works.slice(0, 10)
                        };
                    }
                    return {
                        answer: 'Không tìm thấy tác giả này.',
                        source: resp.source
                    };
                }

                case 'define-genre': {
                    const resp = await MotherNode.request({ group: 'the-loai' });
                    const genre = (resp.records || []).find(g =>
                        (g.name || '').toLowerCase().includes(intent.query.toLowerCase())
                    );
                    if (genre) {
                        return {
                            answer: genre.description || 'Không có mô tả.',
                            detail: `Thể loại: ${genre.name}`,
                            source: resp.source,
                            meta: [genre]
                        };
                    }
                    return {
                        answer: 'Thể loại không có trong từ điển.',
                        source: resp.source
                    };
                }

                case 'network-info': {
                    const health = await MotherNode.healthCheck();
                    const online = health.filter(n => n.status === 'online').length;
                    return {
                        answer: `${online}/${health.length} máy con đang online`,
                        detail: health.map(n => `${n.label}: ${n.status}`).join(' · '),
                        source: 'mother-00',
                        meta: health
                    };
                }

                case 'empty':
                    return {
                        answer: 'Vui lòng nhập câu hỏi.',
                        source: 'system'
                    };

                case 'search':
                default: {
                    const results = VDSearchEngine.search(intent.query);
                    if (results.length > 0) {
                        const topResults = results.slice(0, 5).map(r => {
                            const record = {
                                id: r.id,
                                _group: r.group
                            };
                            // Gắn thêm title nếu có
                            const idx = APP_DATA.WORKS_DATA.find(w => w.id === r.id)
                                     || APP_DATA.AUTHOR_DATA.find(a => a.id === r.id)
                                     || APP_DATA.THEORY_DATA.find(t => t.id === r.id)
                                     || APP_DATA.THE_LOAI_DATA.find(g => g.id === r.id);
                            if (idx) record.title = idx.title || idx.name;
                            return record;
                        });
                        return {
                            answer: `Tìm thấy ${results.length} mục`,
                            detail: `Liên quan: ${topResults.map(r => r.title || r.id).filter(Boolean).join(', ')}`,
                            source: 'search-engine',
                            meta: topResults
                        };
                    }
                    return {
                        answer: 'Không có kết quả.',
                        source: 'search-engine'
                    };
                }
            }
        } catch (err) {
            return {
                answer: `Lỗi: ${err.message}`,
                source: 'error',
                detail: 'Có thể mạng lưới đang bận, hãy thử lại.'
            };
        }
    }

    // Helpers
    function extractTitle(t) {
        const m = t.match(/["“]([^"”]+)["”]/);
        if (m) return m[1];
        return t.replace(/^(ai|tác giả|viết|sáng tác|của bài|của tác phẩm|của)\s+/gi, '').trim();
    }

    function extractAuthor(t) {
        return t.replace(/^(bài nào|tác phẩm nào|liệt kê|kể tên|của|viết bởi)\s+/gi, '').trim();
    }

    function extractGenre(t) {
        return t.replace(/thể loại|là gì|như thế nào|định nghĩa|khái niệm/gi, '').trim();
    }

    return { parseIntent, dispatch };
})();

// ==========================================================
// PHẦN 9: EXPORT DEFAULT
// ==========================================================
export const VAN_DAO_AI = Object.freeze({
    analyzeWork,
    calculateFortune,
    getFortuneInfo,
    synthesizeDynamicFortune,
    clearCache() { resultCache.clear(); },
    getCacheSize() { return resultCache.size; }
});

export default VAN_DAO_AI;