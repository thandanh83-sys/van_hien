/**
 * ==========================================================
 * VĂN ĐẠO AI - ANALYSIS AGENT (js/ai/agents/analysis.js)
 * Vị trí: js/ai/agents/analysis.js
 * Version: 1.2.0 (Multi-Agent Specialist)
 * ==========================================================
 * CHỨC NĂNG:
 * - Phân tích chủ đề văn bản dựa trên trọng số từ khóa.
 * - Trích xuất bằng chứng (Evidence) và biểu tượng.
 * - Đánh giá mức độ nhận diện (Strength).
 * - Tổng hợp lời bình có căn cứ.
 * ==========================================================
 */

import { countWeightedMatches } from '../core.js';
import { findSymbols } from '../../render.js';
import { normalizeRouteText } from '../../utils.js';

// ==========================================================
// 1. CẤU HÌNH CHỦ ĐỀ (Theme Rules)
// Đã tích hợp trọng số để tránh đếm trùng và tăng độ chính xác
// ==========================================================
const THEME_RULES = [
    { 
        id: 'nature', 
        label: 'thiên nhiên', 
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
        id: 'homesickness', 
        label: 'quê hương và ký ức', 
        terms: [
            { t: 'cố hương', w: 3 }, { t: 'tha hương', w: 3 }, { t: 'nhớ nhà', w: 2.5 }, 
            { t: 'quê hương', w: 2 }, { t: 'quê', w: 1 }, { t: 'làng', w: 1 }, 
            { t: 'xóm', w: 1 }, { t: 'nhà', w: 0.5 }
        ], 
        commentary: 'Tác phẩm gợi mở mối liên hệ giữa con người với quê hương và không gian nguồn cội. Ý nghĩa của nỗi nhớ sẽ rõ hơn khi đối chiếu hình ảnh quê nhà với hoàn cảnh và giọng điệu của văn bản.' 
    },
    { 
        id: 'patriotism', 
        label: 'tình yêu nước', 
        terms: [
            { t: 'tổ quốc', w: 3 }, { t: 'non sông', w: 2.5 }, { t: 'giang sơn', w: 2.5 }, 
            { t: 'đất nước', w: 2 }, { t: 'độc lập', w: 2 }, { t: 'tự do', w: 2 }, 
            { t: 'chiến sĩ', w: 1.5 }, { t: 'đồng bào', w: 1.5 }
        ], 
        commentary: 'Tác phẩm có những dấu hiệu hướng về cộng đồng và đất nước. Cần xem tình cảm ấy được thể hiện qua hình tượng, giọng điệu và hoàn cảnh lịch sử nào để tránh bình luận chung chung.' 
    },
    { 
        id: 'love', 
        label: 'tình cảm đôi lứa', 
        terms: [
            { t: 'yêu', w: 1 }, { t: 'thương', w: 1 }, { t: 'duyên', w: 1.5 }, 
            { t: 'người thương', w: 2 }, { t: 'lứa đôi', w: 2 }, { t: 'nhớ em', w: 2 }, 
            { t: 'nhớ anh', w: 2 }
        ], 
        commentary: 'Tình cảm là một mạch đáng chú ý trong văn bản. Sắc thái của nó không chỉ nằm ở lời bộc bạch trực tiếp mà còn có thể hiện ra qua cách lựa chọn hình ảnh, nhịp điệu và khoảng lặng.' 
    },
    { 
        id: 'humanity', 
        label: 'thân phận con người', 
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
// 2. HÀM PHÂN TÍCH CHÍNH
// ==========================================================

/**
 * Phân tích một tác phẩm (từ metadata index)
 * @param {Object} work - Object chứa { title, author, desc, content... }
 * @returns {Object} - Kết quả phân tích { answer, detail, source, meta }
 */
function analyzeWork(work = {}) {
    // Gộp các trường văn bản lại để phân tích
    const sourceText = [
        work.title, 
        work.author, 
        work.desc, 
        work.description, 
        work.content, 
        work.excerpt
    ].filter(Boolean).join('\n');

    return analyzeText(sourceText, work.title || 'Tác phẩm');
}

/**
 * Phân tích một đoạn văn bản thô (dùng cho Thi Pháp Học)
 * @param {string} text - Nội dung văn bản
 * @param {string} title - Tiêu đề hiển thị (mặc định: "Đoạn văn bản")
 * @returns {Object} - Kết quả phân tích
 */
function analyzeText(text, title = 'Đoạn văn bản') {
    if (!text || !text.trim()) {
        return {
            answer: 'Không có nội dung để phân tích.',
            detail: 'Văn bản trống.',
            source: 'analysis',
            meta: []
        };
    }

    const normalized = normalizeRouteText(text);

    // 1. Chấm điểm chủ đề (Weighted)
    const themes = THEME_RULES.map(rule => {
        const { score, hits } = countWeightedMatches(normalized, rule.terms);
        return { rule, score, hits };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

    // 2. Trích xuất biểu tượng (Symbols)
    let symbols = [];
    try {
        symbols = findSymbols(text).slice(0, 4);
    } catch (e) {
        console.warn('[ANALYSIS] Lỗi trích xuất biểu tượng:', e);
    }

    // 3. Tạo lời bình (Commentary)
    let commentaryText = themes.length 
        ? themes[0].rule.commentary 
        : FALLBACK_COMMENTARY;

    if (symbols.length > 0) {
        commentaryText += ` Đáng chú ý, văn bản xuất hiện hình ảnh "${symbols[0].keyword}", cần được đặt trong ngữ cảnh để hiểu rõ tầng nghĩa sâu kín.`;
    }

    // 4. Đánh giá độ mạnh (Strength)
    let strength = 'Yếu';
    let strengthDetail = '';
    
    if (themes.length > 0) {
        const topScore = themes[0].score;
        if (topScore >= 6) {
            strength = 'Mạnh';
            strengthDetail = 'Hệ thống tìm thấy nhiều dấu hiệu rõ ràng.';
        } else if (topScore >= 3) {
            strength = 'Vừa';
            strengthDetail = 'Hệ thống tìm thấy một số dấu hiệu nhất định.';
        } else {
            strength = 'Yếu';
            strengthDetail = 'Hệ thống chỉ tìm thấy dấu hiệu mờ nhạt, cần kiểm chứng thêm.';
        }
    }

    // 5. Trả về kết quả
    return {
        answer: commentaryText,
        detail: `Mức độ nhận diện chủ đề: ${strength}. ${strengthDetail}`,
        source: 'analysis',
        meta: [], // Không trả về meta để tránh làm rối UI
        // Các trường mở rộng để Fortune Agent dùng lại
        themes: themes.map(t => t.rule.label),
        evidence: {
            themes: themes.map(t => ({ label: t.rule.label, score: t.score, hits: t.hits })),
            symbols: symbols.map(s => ({ keyword: s.keyword, type: s.type, mean: s.mean }))
        },
        strength: strength
    };
}

// ==========================================================
// 3. EXPORT AGENT
// ==========================================================

export const AnalysisAgent = {
    /**
     * Phân tích tác phẩm (nhận object)
     * Dùng trong luồng AI Dispatcher
     */
    async analyze(work) {
        return analyzeWork(work);
    },

    /**
     * Phân tích văn bản thô (nhận string)
     * Dùng cho tính năng Thi Pháp Học hoặc phân tích tự do
     */
    async analyzeRaw(text, title) {
        return analyzeText(text, title);
    }
};