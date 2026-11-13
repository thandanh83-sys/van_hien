/**
 * ==========================================================
 * VĂN ĐẠO AI ENGINE (js/ai.js)
 * Vị trí: js/ai.js
 * Version: 1.1.0 (Offline-First, Weighted Themes, Smart Intent)
 * ==========================================================
 * CHỨC NĂNG:
 * - Phân tích văn bản dựa trên trọng số từ khóa (Không đếm thô).
 * - AIDispatcher: Nhận diện câu hỏi tự nhiên, chạy 100% Offline.
 * - Không phụ thuộc MotherNode, không gọi API ngoài.
 * ==========================================================
 */

import { APP_DATA } from './config.js';
import { findSymbols } from './render.js';
import { VDSearchEngine } from './search.js';
import { escapeHTML, normalizeRouteText } from './utils.js';

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
// PHẦN 2: THEME RULES (Có trọng số)
// ==========================================================
const THEME_RULES = [
    { 
        id: 'nature', label: 'thiên nhiên', 
        terms: [
            { t: 'trăng', w: 2 }, { t: 'nguyệt', w: 2 }, { t: 'sông', w: 1.5 }, 
            { t: 'núi', w: 1.5 }, { t: 'mây', w: 1 }, { t: 'gió', w: 1 }, 
            { t: 'mưa', w: 0.8 }, { t: 'nắng', w: 0.8 }, { t: 'hoa', w: 0.5 }, 
            { t: 'lá', w: 0.5 }, { t: 'chim', w: 1 }, { t: 'đò', w: 1.5 }, 
            { t: 'biển', w: 1.5 }, { t: 'suối', w: 1 }
        ], 
        commentary: 'Hệ thống hình ảnh thiên nhiên tạo nên lớp cảnh sắc cho tác phẩm. Khi đọc, cần đặt cảnh vật trong quan hệ với điểm nhìn và cảm xúc của chủ thể trữ tình, thay vì chỉ xem đó là phông nền.' 
    },
    { 
        id: 'homesickness', label: 'quê hương và ký ức', 
        terms: [
            { t: 'cố hương', w: 3 }, { t: 'tha hương', w: 3 }, { t: 'nhớ nhà', w: 2.5 }, 
            { t: 'quê hương', w: 2 }, { t: 'quê', w: 1 }, { t: 'làng', w: 1 }, 
            { t: 'xóm', w: 1 }, { t: 'nhà', w: 0.5 }
        ], 
        commentary: 'Tác phẩm gợi mở mối liên hệ giữa con người với quê hương và không gian nguồn cội. Ý nghĩa của nỗi nhớ sẽ rõ hơn khi đối chiếu hình ảnh quê nhà với hoàn cảnh và giọng điệu của văn bản.' 
    },
    { 
        id: 'patriotism', label: 'tình yêu nước', 
        terms: [
            { t: 'tổ quốc', w: 3 }, { t: 'non sông', w: 2.5 }, { t: 'giang sơn', w: 2.5 }, 
            { t: 'đất nước', w: 2 }, { t: 'độc lập', w: 2 }, { t: 'tự do', w: 2 }, 
            { t: 'chiến sĩ', w: 1.5 }, { t: 'đồng bào', w: 1.5 }
        ], 
        commentary: 'Tác phẩm có những dấu hiệu hướng về cộng đồng và đất nước. Cần xem tình cảm ấy được thể hiện qua hình tượng, giọng điệu và hoàn cảnh lịch sử nào để tránh bình luận chung chung.' 
    },
    { 
        id: 'love', label: 'tình cảm đôi lứa', 
        terms: [
            { t: 'yêu', w: 1 }, { t: 'thương', w: 1 }, { t: 'duyên', w: 1.5 }, 
            { t: 'người thương', w: 2 }, { t: 'lứa đôi', w: 2 }, { t: 'nhớ em', w: 2 }, 
            { t: 'nhớ anh', w: 2 }
        ], 
        commentary: 'Tình cảm là một mạch đáng chú ý trong văn bản. Sắc thái của nó không chỉ nằm ở lời bộc bạch trực tiếp mà còn có thể hiện ra qua cách lựa chọn hình ảnh, nhịp điệu và khoảng lặng.' 
    },
    { 
        id: 'humanity', label: 'thân phận con người', 
        terms: [
            { t: 'nhân sinh', w: 2 }, { t: 'phận', w: 2 }, { t: 'kiếp', w: 2 }, 
            { t: 'bất công', w: 2 }, { t: 'khổ đau', w: 2 }, { t: 'nước mắt', w: 1.5 }, 
            { t: 'nghèo', w: 1.5 }, { t: 'người', w: 0.3 }, { t: 'đời', w: 0.5 }
        ], 
        commentary: 'Văn bản hướng sự chú ý đến thân phận và trải nghiệm con người. Khi bình giảng, nên gắn suy tưởng nhân sinh với chi tiết cụ thể, tránh tách thông điệp khỏi hoàn cảnh được miêu tả.' 
    }
];

const FALLBACK_COMMENTARY = 'Tác phẩm cần được đọc từ những chi tiết cụ thể: hình ảnh nổi bật, giọng điệu, cách tổ chức câu chữ và mối liên hệ giữa các phần.';

// ==========================================================
// PHẦN 3: FORTUNE LEVELS
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

// Đếm từ khóa có trọng số, xử lý cụm từ dài trước
function countWeightedMatches(text, terms) {
    let score = 0;
    const hits = [];
    
    // Sắp xếp từ khóa dài trước để tránh đè từ ngắn (VD: "quê hương" trước "quê")
    const sortedTerms = [...terms].sort((a, b) => b.t.length - a.t.length);

    for (const item of sortedTerms) {
        const needle = normalizeText(item.t);
        if (!needle) continue;
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        // Dùng ranh giới từ (word boundary) để không bắt nhầm
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'giu');
        const found = text.match(pattern);
        
        if (found?.length) { 
            score += found.length * item.w; 
            hits.push(item.t); 
        }
    }
    return { score, hits };
}

function getWorkText(work = {}) {
    return [work.title, work.author, work.desc, work.description, work.content, work.excerpt].filter(Boolean).join('\n');
}

function selectThemes(text) {
    const normalized = normalizeText(text);
    const results = THEME_RULES.map(rule => {
        const { score, hits } = countWeightedMatches(normalized, rule.terms);
        return { rule, score, hits };
    }).filter(item => item.score > 0);

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 2);
}

function getSymbolEvidence(text) {
    try {
        return findSymbols(text).slice(0, 4).map(symbol => ({
            keyword: symbol.keyword, type: symbol.type, meaning: symbol.mean || '', volume: symbol.vol || '', section: symbol.sec || ''
        }));
    } catch (error) { return []; }
}

// ==========================================================
// PHẦN 5: PUBLIC API - ANALYZE
// ==========================================================
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

    // Tính độ tin cậy thực tế dựa trên điểm số
    let confidence = 'thấp';
    if (themes.length > 0) {
        const topScore = themes[0].score;
        if (topScore >= 6) confidence = 'cao';
        else if (topScore >= 3) confidence = 'trung bình';
    }

    const result = {
        themes: themes.map(t => t.rule.label),
        commentaryText,
        evidence: { themes, symbols },
        confidence
    };

    cacheSet(cacheKey, result);
    return result;
}

// ==========================================================
// PHẦN 6: PUBLIC API - FORTUNE
// ==========================================================
export function calculateFortune() {
    const totalWeight = FORTUNE_LEVELS.reduce((sum, item) => sum + item.weight, 0);
    let draw = Math.random() * totalWeight;
    for (const item of FORTUNE_LEVELS) {
        draw -= item.weight;
        if (draw < 0) return item.key;
    }
    return 'binh-hoa';
}

export function getFortuneInfo(key = 'binh-hoa') {
    // Chuẩn hóa key nếu không hợp lệ
    const validKey = FORTUNE_FALLBACK[key] ? key : 'binh-hoa';
    const fallback = FORTUNE_FALLBACK[validKey];
    const saved = APP_DATA.FORTUNE_CONFIG?.[validKey] || {};
    return { ...fallback, ...saved, key: validKey, name: saved.name || fallback.name, color: saved.color || fallback.color };
}

// ==========================================================
// PHẦN 7: PUBLIC API - TỔNG HỢP BÓI THƠ
// ==========================================================
export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa') {
    const fortune = getFortuneInfo(fortuneKey);
    const analysis = analyzeWork(work);

    const title = work.title || 'trang sách';
    const author = work.author || 'tác giả';
    const mainTheme = analysis.themes.length > 0 ? analysis.themes[0] : 'nhân sinh';
    const mainSymbol = analysis.evidence.symbols.length > 0 ? `"${analysis.evidence.symbols[0].keyword}"` : null;

    let bridgeText = `Duyên lành đưa bạn đến với "${title}" của ${author} trong một ngày vận khí ${fortune.name.toLowerCase()}. `;
    if (fortuneKey === 'dai-cat') bridgeText += `Trang sách mở ra như một lời chúc phúc, hãy đón nhận bằng tâm thế rộng mở.`;
    else if (fortuneKey === 'trung-cat' || fortuneKey === 'tieu-cat') bridgeText += `Mọi sự đang diễn ra êm đềm, thật hợp để bạn tĩnh tâm chiêm nghiệm.`;
    else if (fortuneKey === 'binh-hoa') bridgeText += `Ngày hôm nay như mặt hồ phẳng lặng, rất thích hợp để lắng lòng.`;
    else bridgeText += `Dẫu ngoài kia có chút gợn sóng, nhưng trang sách này sẽ là một chốn bình yên.`;

    let dynamicAdvice = "";
    if (fortuneKey === 'dai-cat') dynamicAdvice = `Vận khí đang rực rỡ, hãy dùng cảm hứng từ chủ đề "${mainTheme}" của tác phẩm để chủ động gieo duyên lành.`;
    else if (fortuneKey === 'tieu-hung' || fortuneKey === 'dai-hung') dynamicAdvice = `Khi vận khí có chút trắc trở, hãy mượn sự tĩnh tại và bài học về "${mainTheme}" trong tác phẩm để làm điểm tựa.`;
    else dynamicAdvice = `Hãy kết hợp sự thong dong của vận khí ${fortune.name.toLowerCase()} với những chiêm nghiệm về "${mainTheme}" trong trang sách.`;

    if (mainSymbol) dynamicAdvice += ` Đặc biệt, hãy để hình ảnh ${mainSymbol} đánh thức những suy ngẫm sâu kín trong bạn.`;

    let nenText = "", tranhText = "";
    if (fortune.advice) {
        const matchNen = fortune.advice.match(/Nên:(.*?)(?=Tránh:|$)/i);
        const matchTranh = fortune.advice.match(/Tránh:(.*)/i);
        nenText = matchNen ? matchNen[1].trim() : '';
        tranhText = matchTranh ? matchTranh[1].trim() : '';
        if (!nenText && !tranhText) nenText = fortune.advice.trim();
    }

    let adviceHtml = '';
    if (nenText) adviceHtml += `<div style="margin-bottom:8px;"><strong style="color:var(--accent-text);">Nên:</strong> <span style="color:var(--text-main);">${escapeHTML(nenText)}</span></div>`;
    if (tranhText) adviceHtml += `<div style="margin-bottom:10px;"><strong style="color:#a36b6b;">Tránh:</strong> <span style="color:var(--text-muted);">${escapeHTML(tranhText)}</span></div>`;
    
    adviceHtml += `<div style="border-top:1px dashed rgba(128,128,128,0.2); padding-top:10px; margin-top:10px;"><strong style="color:var(--accent-text);">Gợi ý đọc:</strong> <span style="color:var(--text-main);">${escapeHTML(dynamicAdvice)}</span></div>`;

    const commentaryData = APP_DATA.COMMENTARY_DATA?.[fortuneKey] || {};
    const commentaries = Array.isArray(commentaryData.commentaries) ? commentaryData.commentaries : [];
    const fortuneReflection = commentaries.length > 0 ? commentaries[Math.floor(Math.random() * commentaries.length)] : `Lời chiêm nghiệm cho vận khí ${fortune.name}: Hãy giữ tâm thế bình thản trước mọi biến động.`;

    return { 
        bridgeText: escapeHTML(bridgeText), 
        fortuneReflection: escapeHTML(fortuneReflection), 
        literaryCommentary: escapeHTML(analysis.commentaryText), 
        adviceHtml, 
        fortuneInfo: fortune, 
        confidence: analysis.confidence, 
        evidence: analysis.evidence 
    };
}

// ==========================================================
// PHẦN 8: AI DISPATCHER (OFFLINE-FIRST, KHÔNG PHỤ THUỘC MOTHERNODE)
// ==========================================================

const DICTIONARY_GROUPS = {
    symbols: 'Biểu tượng',
    dienTich: 'Điển tích',
    hanViet: 'Hán Việt',
    tuGoiHinh: 'Từ gợi hình',
    tuGoiAm: 'Từ gợi âm',
    tuBieuCam: 'Từ biểu cảm',
    anDu: 'Ẩn dụ',
    soSanh: 'So sánh',
    tuTaoCanh: 'Từ tạo cảnh',
    thanhNgu: 'Thành ngữ',
    thuatNguThiPhap: 'Thuật ngữ thi pháp'
};

export const AIDispatcher = (() => {

    function parseIntent(input) {
        const t = (input || '').toLowerCase().trim();
        if (!t) return { type: 'empty', query: '' };

        // 1. Tóm tắt
        if (/(tóm tắt|nội dung|kể lại|giới thiệu|nói về gì)/i.test(t)) {
            const q = t.replace(/(tóm tắt|nội dung|kể lại|giới thiệu|nói về gì|tác phẩm|bài thơ|bài)/gi, '').replace(/[?!.]/g, '').trim();
            return { type: 'summarize-work', query: q };
        }

        // 2. Biểu tượng / Điển tích
        if (/(biểu tượng|hình ảnh|điển tích|điển cố|ý nghĩa của)/i.test(t)) {
            const keyword = t.replace(/(biểu tượng|hình ảnh|điển tích|điển cố|ý nghĩa của|là gì|có ý nghĩa gì|trong thơ)/gi, '').replace(/[?!.]/g, '').trim();
            if (!keyword) return { type: 'search', query: t }; // Nếu rỗng thì fallback về search
            return { type: 'explain-symbol', query: keyword };
        }

        // 3. Gợi ý đọc
        if (/(gợi ý|đề xuất|tìm truyện|tìm thơ|muốn đọc)/i.test(t)) {
            const genre = t.replace(/(gợi ý|đề xuất|tìm truyện|tìm thơ|muốn đọc|cho tôi|về)/gi, '').replace(/[?!.]/g, '').trim();
            return { type: 'recommend', query: genre };
        }

        // 4. Thể loại là gì
        if (/(thể loại|định nghĩa|khái niệm).*(là gì|như thế nào)/i.test(t)) {
            const genre = t.replace(/thể loại|là gì|như thế nào|định nghĩa|khái niệm/gi, '').replace(/[?!.]/g, '').trim();
            return { type: 'define-genre', query: genre };
        }

        // 5. Tác giả
        if (/(ai|tác giả|người nào)\s+(là|viết|sáng tác|đặt tên|tạo ra|của bài|của tác phẩm)/i.test(t)) {
            const q = t.replace(/(ai là|ai viết|tác giả|người nào|đặt tên cho|viết|sáng tác|là người|của bài|của tác phẩm)/gi, '').replace(/[?!.]/g, '').trim();
            return { type: 'find-author-of', query: q };
        }

        return { type: 'search', query: input.trim() };
    }

    async function dispatch(intent) {
        try {
            // Lấy dữ liệu trực tiếp từ APP_DATA (Đảm bảo Offline)
            const works = APP_DATA.WORKS_DATA || [];
            const authors = APP_DATA.AUTHOR_DATA || [];
            const genres = APP_DATA.THE_LOAI_DATA || [];

            switch (intent.type) {
                case 'summarize-work': {
                    const results = VDSearchEngine.search(intent.query);
                    const topResult = results.find(r => r.group === 'tinh-hoa');
                    if (topResult) {
                        const work = works.find(w => w.id === topResult.id);
                        if (work) return { answer: work.desc || 'Chưa có tóm tắt.', detail: `Tác phẩm: "${work.title}" của ${work.author}`, source: 'local-data', meta: [work] };
                    }
                    return { answer: `Không tìm thấy tác phẩm "${intent.query}".`, source: 'local-data' };
                }

                case 'explain-symbol': {
                    const dict = APP_DATA.DICTIONARY_DATA || {};
                    const allEntries = [];
                    
                    // Duyệt qua tất cả các nhóm từ điển
                    for (const [key, label] of Object.entries(DICTIONARY_GROUPS)) {
                        if (dict[key] && typeof dict[key] === 'object') {
                            for (const [k, v] of Object.entries(dict[key])) {
                                allEntries.push({ ...v, keyword: k, type: label });
                            }
                        }
                    }

                    const q = normalizeText(intent.query);
                    const found = allEntries.find(item => normalizeText(item.keyword).includes(q));
                    
                    if (found) {
                        return { answer: found.mean, detail: `[${found.type}] ${found.keyword}`, source: 'dictionary', meta: [] };
                    }
                    return { answer: `Không tìm thấy giải nghĩa cho "${intent.query}".`, source: 'dictionary' };
                }

                case 'recommend': {
                    let filteredWorks = [...works];
                    const q = normalizeText(intent.query);
                    
                    if (q) {
                        filteredWorks = filteredWorks.filter(w => {
                            const title = normalizeText(w.title || '');
                            const genre = Array.isArray(w.the_loai) ? normalizeText(w.the_loai.join(' ')) : '';
                            const type = normalizeText(typeof w.loai_hinh === 'string' ? w.loai_hinh : '');
                            return title.includes(q) || genre.includes(q) || type.includes(q);
                        });
                    }
                    
                    // Thuật toán xáo trộn Fisher-Yates chuẩn
                    for (let i = filteredWorks.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [filteredWorks[i], filteredWorks[j]] = [filteredWorks[j], filteredWorks[i]];
                    }
                    
                    const selected = filteredWorks.slice(0, 4);
                    if (selected.length > 0) return { answer: `Gợi ý cho bạn: ${selected.map(w => w.title).join(' · ')}`, detail: 'Dựa trên sở thích của bạn', source: 'local-data', meta: selected };
                    return { answer: 'Rất tiếc, chưa có tác phẩm nào phù hợp.', source: 'local-data' };
                }

                case 'find-author-of': {
                    const results = VDSearchEngine.search(intent.query);
                    const topResult = results.find(r => r.group === 'tinh-hoa');
                    if (topResult) {
                        const work = works.find(w => w.id === topResult.id);
                        if (work) return { answer: `Tác giả là: ${work.author || 'Không rõ'}`, detail: `Tác phẩm: "${work.title}"`, source: 'search-engine', meta: [work] };
                    }
                    return { answer: `Không tìm thấy tác phẩm nào khớp với "${intent.query}".`, source: 'search-engine' };
                }

                case 'define-genre': {
                    const genre = genres.find(g => normalizeText(g.name || '').includes(normalizeText(intent.query)));
                    if (genre) return { answer: genre.description || 'Không có mô tả.', detail: `Thể loại: ${genre.name}`, source: 'local-data', meta: [genre] };
                    return { answer: 'Thể loại không có trong từ điển.', source: 'local-data' };
                }

                case 'empty': return { answer: 'Vui lòng nhập câu hỏi.', source: 'system' };

                case 'search':
                default: {
                    const results = VDSearchEngine.search(intent.query);
                    if (results.length > 0) {
                        const topResults = results.slice(0, 5).map(r => {
                            const record = { id: r.id, _group: r.group };
                            const idx = works.find(w => w.id === r.id) || authors.find(a => a.id === r.id) || APP_DATA.THEORY_DATA.find(t => t.id === r.id);
                            if (idx) record.title = idx.title || idx.name;
                            return record;
                        });
                        return { answer: `Tìm thấy ${results.length} mục`, detail: `Liên quan: ${topResults.map(r => r.title || r.id).filter(Boolean).join(', ')}`, source: 'search-engine', meta: topResults };
                    }
                    return { answer: 'Không có kết quả.', source: 'search-engine' };
                }
            }
        } catch (err) {
            return { answer: `Đã xảy ra lỗi khi xử lý câu hỏi.`, source: 'error' };
        }
    }

    return { parseIntent, dispatch };
})();

export const VAN_DAO_AI = Object.freeze({
    analyzeWork, calculateFortune, getFortuneInfo, synthesizeDynamicFortune,
    clearCache() { resultCache.clear(); }, getCacheSize() { return resultCache.size; }
});
export default VAN_DAO_AI;