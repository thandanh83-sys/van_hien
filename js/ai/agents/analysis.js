/**
 * ==========================================================
 * VĂN ĐẠO AI - ANALYSIS AGENT (js/ai/agents/analysis.js)
 * Vị trí: js/ai/agents/analysis.js
 * Version: 1.2.0
 * ==========================================================
 * CHỨC NĂNG:
 * - Phân tích văn bản dựa trên trọng số từ khóa.
 * - Export cả Agent Object và hàm analyzeWork (tương thích ngược).
 * ==========================================================
 */

import { countWeightedMatches } from '../core.js';
import { normalizeRouteText } from '../../utils.js';
import { findSymbols } from '../../render.js';

// ==========================================================
// 1. THEME RULES (Quy tắc phân tích chủ đề)
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
// 2. HÀM PHÂN TÍCH CHÍNH (Dùng chung cho cả Agent và Facade)
// ==========================================================
export function analyzeWork(work = {}) {
    const sourceText = [work.title, work.author, work.desc, work.description, work.content, work.excerpt].filter(Boolean).join('\n');
    const normalized = normalizeRouteText(sourceText);
    
    const themes = THEME_RULES.map(rule => ({ rule, ...countWeightedMatches(normalized, rule.terms) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

    const symbols = findSymbols(sourceText).slice(0, 4);

    let commentaryText = themes.length ? themes[0].rule.commentary : FALLBACK_COMMENTARY;
    if (symbols.length > 0) {
        commentaryText += ` Đáng chú ý, văn bản xuất hiện hình ảnh "${symbols[0].keyword}", cần được đặt trong ngữ cảnh để hiểu rõ tầng nghĩa sâu kín.`;
    }

    // Đánh giá độ mạnh của tín hiệu (thay vì "độ tin cậy" tuyệt đối)
    let strength = 'Yếu';
    if (themes.length > 0) {
        const topScore = themes[0].score;
        if (topScore >= 6) strength = 'Mạnh';
        else if (topScore >= 3) strength = 'Vừa';
    }

    return {
        themes: themes.map(t => t.rule.label),
        commentaryText,
        evidence: { themes, symbols },
        strength
    };
}

// ==========================================================
// 3. EXPORT AGENT OBJECT (Dùng cho MasterAI)
// ==========================================================
export const AnalysisAgent = {
    async analyze(work) {
        const result = analyzeWork(work);
        return { 
            answer: result.commentaryText, 
            detail: `Mức độ nhận diện: ${result.strength}`, 
            source: 'analysis',
            // Gắn thêm dữ liệu thô để các Agent khác (như Fortune) có thể dùng lại
            _raw: result 
        };
    }
};

// =====================================================================
// [THÊM MỚI v7.0.0] AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
/**
 * Metadata tự mô tả của AnalysisAgent.
 * Chuyên trách phân tích văn bản: tìm chủ đề, biểu tượng, đánh giá tín hiệu.
 *
 * GHI CHÚ:
 * - Hàm `analyzeWork()` được export riêng ở trên (dùng cho main.js
 *   trong pipeline Thi Pháp Học và Bói Thơ).
 * - Agent Object chỉ wrap lại kết quả của `analyzeWork()` thành định dạng
 *   chuẩn `{ answer, detail, source, meta }` để MasterAI điều phối.
 */
AnalysisAgent.agentInfo = {
    // ---- Định danh ----
    key: 'analysis',
    name: 'Phân Tích AI',
    description: 'Chuyên trách Đọc hiểu văn bản, Tìm chủ đề, Biểu tượng.',

    // ---- Năng lực ----
    capabilities: {
        'analyze-work': 'analyze'               // "Phân tích Truyện Kiều" -> AnalysisAgent.analyze()
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author', 'symbol', 'allusion', 'term'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['poetics', 'literature'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'analyze-work': ['phan tich', 'binh giang', 'cam nhan', 'danh gia', 'binh luan', 'mo xe']
    }
};
