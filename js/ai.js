/**
 * ==========================================================
 * VĂN ĐẠO AI ENGINE (js/ai.js)
 * Hệ chuyên gia văn học chạy hoàn toàn ngoại tuyến.
 * - Dò chủ đề, tra biểu tượng để tạo lời bình/khuyên.
 * - Không dùng Math.random() để phân tích nội dung.
 * ==========================================================
 */

import { findSymbols } from './render.js';

// ==========================================================
// PHẦN 1. BỘ NHỚ TẠM THỜI (CACHE)
// ==========================================================
const CACHE_LIMIT = 120;
const resultCache = new Map();

// ==========================================================
// PHẦN 2. NGÂN HÀNG QUY TẮC CHỦ ĐỀ
// ==========================================================
const THEME_RULES = [
    {
        id: 'nature', label: 'thiên nhiên',
        terms: ['trăng', 'nguyệt', 'sông', 'núi', 'mây', 'gió', 'mưa', 'nắng', 'hoa', 'lá', 'chim', 'đò', 'biển', 'suối', 'thu', 'xuân', 'hạ', 'đông'],
        commentary: 'Hệ thống hình ảnh thiên nhiên tạo nên lớp cảnh sắc cho tác phẩm. Khi đọc, cần đặt cảnh vật trong quan hệ với điểm nhìn và cảm xúc của chủ thể trữ tình, thay vì chỉ xem đó là phông nền.',
        advice: 'Hãy chú ý những hình ảnh thiên nhiên được nhắc lại hoặc đặt ở vị trí quan trọng; sự thay đổi của cảnh có thể giúp nhận ra chuyển động trong tâm trạng và mạch ý.'
    },
    {
        id: 'homesickness', label: 'quê hương và ký ức',
        terms: ['quê', 'nhà', 'làng', 'xóm', 'đất nước', 'non sông', 'cố hương', 'xa quê', 'nhớ nhà', 'quê hương'],
        commentary: 'Tác phẩm gợi mở mối liên hệ giữa con người với quê hương và không gian nguồn cội. Ý nghĩa của nỗi nhớ sẽ rõ hơn khi đối chiếu hình ảnh quê nhà với hoàn cảnh và giọng điệu của văn bản.',
        advice: 'Có thể đọc kỹ những chi tiết gắn với quê nhà, nơi chốn và ký ức; chúng thường cho thấy điều nhân vật hoặc chủ thể trữ tình muốn gìn giữ.'
    },
    {
        id: 'love', label: 'tình cảm',
        terms: ['yêu', 'thương', 'tình', 'duyên', 'người thương', 'đôi', 'nhớ em', 'nhớ anh', 'lứa đôi'],
        commentary: 'Tình cảm là một mạch đáng chú ý trong văn bản. Sắc thái của nó không chỉ nằm ở lời bộc bạch trực tiếp mà còn có thể hiện ra qua cách lựa chọn hình ảnh, nhịp điệu và khoảng lặng.',
        advice: 'Hãy phân biệt điều văn bản nói thẳng với điều được gửi qua hình ảnh, giọng điệu hoặc sự im lặng; cách biểu đạt gián tiếp thường làm nên chiều sâu cảm xúc.'
    },
    {
        id: 'time', label: 'thời gian và hồi tưởng',
        terms: ['thời gian', 'năm tháng', 'tuổi trẻ', 'tuổi xuân', 'ngày xưa', 'hoàng hôn', 'chiều', 'bóng xế', 'phai', 'tàn'],
        commentary: 'Dấu hiệu thời gian góp phần tạo nên chiều sâu suy tưởng. Sự đối chiếu giữa hiện tại và quá khứ, hoặc giữa cái đang có và cái đã qua, có thể là chìa khóa để đọc mạch cảm xúc.',
        advice: 'Hãy để ý các từ chỉ thời gian và những hình ảnh biến đổi; chúng giúp nhận ra tác phẩm đang nghiêng về hồi tưởng, tiếc nuối hay suy ngẫm.'
    },
    {
        id: 'humanity', label: 'thân phận con người',
        terms: ['người', 'đời', 'phận', 'kiếp', 'nhân sinh', 'đau', 'khổ', 'nước mắt', 'công bằng', 'bất công', 'nghèo', 'khổ đau'],
        commentary: 'Văn bản hướng sự chú ý đến thân phận và trải nghiệm con người. Khi bình giảng, nên gắn suy tưởng nhân sinh với chi tiết cụ thể, tránh tách thông điệp khỏi hoàn cảnh được miêu tả.',
        advice: 'Hãy tìm chi tiết cho thấy con người đang sống trong hoàn cảnh nào, chịu tác động bởi điều gì và lựa chọn ra sao; từ đó mới rút ra nhận xét về tư tưởng của tác phẩm.'
    },
    {
        id: 'patriotism', label: 'quê hương và cộng đồng',
        terms: ['tổ quốc', 'đất nước', 'giang sơn', 'độc lập', 'tự do', 'chiến sĩ', 'quê hương', 'đồng bào', 'non sông'],
        commentary: 'Tác phẩm có những dấu hiệu hướng về cộng đồng và đất nước. Cần xem tình cảm ấy được thể hiện qua hình tượng, giọng điệu và hoàn cảnh lịch sử nào để tránh bình luận chung chung.',
        advice: 'Hãy liên hệ hình ảnh cá nhân với cộng đồng, đồng thời chú ý những chi tiết cụ thể làm nên cảm hứng quê hương, đất nước trong văn bản.'
    },
    {
        id: 'resilience', label: 'nghị lực và hy vọng',
        terms: ['vượt', 'đường xa', 'bão', 'giông', 'gian nan', 'khó khăn', 'bền chí', 'kiên trì', 'hy vọng', 'niềm tin'],
        commentary: 'Văn bản gợi ra hành trình đối diện thử thách và khả năng hướng về phía trước. Giá trị của mạch ý này cần được nhìn từ diễn biến và lựa chọn của con người trong tác phẩm.',
        advice: 'Hãy quan sát cách văn bản chuyển từ khó khăn sang suy ngẫm hoặc hy vọng; sự chuyển giọng ấy thường quan trọng hơn một lời khuyên được rút ra vội vàng.'
    }
];

const FALLBACK_COMMENTARY = 'Tác phẩm cần được đọc từ những chi tiết cụ thể: hình ảnh nổi bật, giọng điệu, cách tổ chức câu chữ và mối liên hệ giữa các phần. Chưa nên kết luận về tư tưởng chủ đạo khi chưa có đủ văn bản.';
const FALLBACK_ADVICE = 'Hãy chọn một hình ảnh hoặc câu văn gây chú ý, rồi tự hỏi: chi tiết ấy xuất hiện trong hoàn cảnh nào, liên hệ với phần còn lại ra sao và tạo nên sắc thái gì?';

// ==========================================================
// PHẦN 3. CÁC HÀM XỬ LÝ
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
        if (found?.length) {
            score += found.length;
            hits.push(term);
        }
    }
    return { score, hits };
}

function getWorkText(work = {}) {
    return [work.title, work.author, work.desc, work.description, work.content, work.excerpt]
        .filter(Boolean).join('\n');
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
        console.warn('[VĂN ĐẠO AI] Không thể tra cứu biểu tượng:', error);
        return [];
    }
}

function makeCommentary(work, themes, symbols) {
    const title = work.title ? `“${work.title}”` : 'Văn bản này';
    const parts = [];
    if (themes.length) {
        parts.push(themes[0].rule.commentary);
        if (themes[1]) parts.push(themes[1].rule.commentary);
    } else {
        parts.push(FALLBACK_COMMENTARY);
    }
    if (symbols.length) {
        const names = symbols.slice(0, 2).map(item => `“${item.keyword}”`).join(' và ');
        parts.push(`Đáng chú ý, văn bản có những hình ảnh hoặc điển tích như ${names}. Ý nghĩa cụ thể của chúng cần được xác định trong ngữ cảnh câu chữ, không nên áp dụng máy móc một nghĩa cố định.`);
    }
    return `${title}: ${parts.join(' ')}`;
}

function makeAdvice(themes, symbols) {
    if (themes.length) {
        const advice = themes.map(item => item.rule.advice);
        if (symbols.length) {
            advice.push(`Đối chiếu biểu tượng “${symbols[0].keyword}” với câu thơ hoặc đoạn văn chứa nó; một biểu tượng có thể thay đổi sắc thái theo ngữ cảnh.`);
        }
        return advice.join(' ');
    }
    return FALLBACK_ADVICE;
}

function cacheSet(key, value) {
    if (resultCache.has(key)) resultCache.delete(key);
    resultCache.set(key, value);
    if (resultCache.size > CACHE_LIMIT) {
        const oldest = resultCache.keys().next().value;
        resultCache.delete(oldest);
    }
}

function escapeHTML(value = '') {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

// ==========================================================
// PHẦN 4. API CÔNG KHAI
// ==========================================================
export function analyzeWork(work = {}) {
    const sourceText = getWorkText(work);
    const cacheKey = `work:${normalizeText(sourceText)}`;
    if (resultCache.has(cacheKey)) return resultCache.get(cacheKey);

    const themes = selectThemes(sourceText);
    const symbols = getSymbolEvidence(sourceText);

    const result = {
        bridgeText: themes.length
            ? `Một hướng đọc đáng chú ý của tác phẩm là ${themes.map(item => item.rule.label).join(' và ')}. Hãy bắt đầu từ những chi tiết thực sự hiện diện trong văn bản.`
            : 'Hãy bắt đầu bằng một chi tiết cụ thể trong tác phẩm; từ chi tiết ấy, lần theo hình ảnh, giọng điệu và mạch ý.',
        commentaryText: makeCommentary(work, themes, symbols),
        adviceText: makeAdvice(themes, symbols),
        evidence: {
            themes: themes.map(item => ({ id: item.rule.id, label: item.rule.label, hits: item.hits })),
            symbols
        },
        confidence: themes.length ? 'trung bình' : 'thấp'
    };

    cacheSet(cacheKey, result);
    return result;
}

export function analyze(text, options = {}) {
    const tasks = Array.isArray(options.tasks) ? options.tasks : ['commentary', 'advice'];
    const work = { title: options.title || '', desc: String(text || '') };
    const base = analyzeWork(work);

    const result = { evidence: base.evidence, confidence: base.confidence };

    if (tasks.includes('commentary')) result.commentary = { text: base.commentaryText, evidence: base.evidence };
    if (tasks.includes('advice')) result.advice = { text: base.adviceText, evidence: base.evidence };
    
    if (tasks.includes('poetics')) {
        result.poetics = typeof options.poeticsAnalyzer === 'function'
            ? options.poeticsAnalyzer(String(text || ''))
            : { available: false, message: 'Chưa được cung cấp bộ phân tích thi pháp cho yêu cầu này.' };
    }

    return result;
}

export function synthesizeCommentary(work) {
    const result = analyzeWork(work);
    const adviceHtml = `
        <div>
            <strong style="color:var(--accent-text);">Gợi ý đọc:</strong>
            <span style="color:var(--text-main);">${escapeHTML(result.adviceText)}</span>
        </div>
    `;
    return {
        commentaryText: escapeHTML(result.commentaryText),
        adviceHtml,
        bridgeText: escapeHTML(result.bridgeText),
        evidence: result.evidence,
        confidence: result.confidence
    };
}

export const VAN_DAO_AI = Object.freeze({
    analyze,
    analyzeWork,
    synthesizeCommentary,
    clearCache() { resultCache.clear(); },
    getCacheSize() { return resultCache.size; }
});

export default VAN_DAO_AI;
