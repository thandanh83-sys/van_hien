/**
 * ==========================================================
 * VĂN ĐẠO AI - CRITIC AGENT (js/ai/agents/critic.js)
 * Vị trí: js/ai/agents/critic.js
 * Version: 1.1.0 (Context-Aware Commentary)
 * ==========================================================
 * CHỨC NĂNG:
 * - Chỉ ra hạn chế, thiếu sót của tác phẩm (Phê bình).
 * - Sinh ra lời bình luận mang tính xây dựng dựa trên chủ đề và biểu tượng.
 * 
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.0.0: Plugin Architecture.
 * - v1.1.0: Thêm tính năng trích xuất câu thơ đầu tiên (excerpt) để 
 *           đưa vào câu phê bình. Giúp lời phê bình có căn cứ cụ thể, 
 *           tránh việc chê bai chung chung vô căn cứ.
 * 
 * ĐẶC BIỆT:
 * - Đây là agent KHÔNG đi qua MasterAI thông thường.
 * - Kết quả trả về có cấu trúc riêng { theme, symbol, commentary }.
 * - MasterAI có adapter riêng để chuyển đổi sang chuẩn chung.
 * ==========================================================
 */

import { countWeightedMatches } from '../core.js';
import { normalizeRouteText } from '../../utils.js';
import { findSymbols } from '../../render.js';

// ==========================================================
// 1. THEME RULES (Quy tắc chủ đề để phê bình)
// ==========================================================
const THEMES = [
    { 
        id: 'nature', 
        label: 'thiên nhiên', 
        terms: [
            { t: 'trăng', w: 2 }, { t: 'sông', w: 1.5 }, { t: 'núi', w: 1.5 }, 
            { t: 'mây', w: 1 }, { t: 'gió', w: 1 }, { t: 'hoa', w: 0.8 }, 
            { t: 'lá', w: 0.5 }, { t: 'chim', w: 1 }
        ] 
    },
    { 
        id: 'homesickness', 
        label: 'quê hương', 
        terms: [
            { t: 'quê hương', w: 2.5 }, { t: 'nhớ nhà', w: 2.5 }, 
            { t: 'làng', w: 1.5 }, { t: 'xóm', w: 1 }, { t: 'cố hương', w: 2 }
        ] 
    },
    { 
        id: 'love', 
        label: 'tình cảm đôi lứa', 
        terms: [
            { t: 'yêu', w: 1 }, { t: 'thương', w: 1 }, { t: 'duyên', w: 1.5 }, 
            { t: 'lứa đôi', w: 2 }, { t: 'nhớ em', w: 2 }, { t: 'nhớ anh', w: 2 }
        ] 
    },
    { 
        id: 'humanity', 
        label: 'nhân sinh', 
        terms: [
            { t: 'nhân sinh', w: 2 }, { t: 'phận', w: 2 }, { t: 'kiếp', w: 2 }, 
            { t: 'nước mắt', w: 1.5 }, { t: 'khổ đau', w: 1.5 }, { t: 'đời', w: 0.5 }
        ] 
    }
];

// ==========================================================
// 2. AGENT OBJECT
// ==========================================================
export const CriticAgent = {
    /**
     * Phân tích văn bản để tìm hạn chế, điểm cần cải thiện.
     * 
     * @param {string} text - Văn bản cần phân tích (nội dung bài thơ/tác phẩm)
     * @returns {Object} { theme, symbol, commentary }
     */
    analyze(text) {
        if (!text) return { theme: '', symbol: '', commentary: 'Chưa có nội dung để phân tích.' };

        const normalized = normalizeRouteText(text);
        
        // 1. Tìm chủ đề nổi bật nhất
        let topTheme = null;
        let maxScore = 0;
        THEMES.forEach(theme => {
            const { score } = countWeightedMatches(normalized, theme.terms);
            if (score > maxScore) { maxScore = score; topTheme = theme.label; }
        });

        // 2. Tìm biểu tượng (nếu có)
        const symbols = findSymbols(text);
        const mainSymbol = symbols.length > 0 ? symbols[0].keyword : null;

        // 3. Trích xuất câu thơ đầu tiên làm dẫn chứng (Context-Aware)
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let excerpt = lines[0] || '';
        if (excerpt.length > 35) excerpt = excerpt.substring(0, 35).trim() + '...';

        // 4. Xây dựng các phần của lời bình
        const openings = excerpt ? [
            `Dù câu thơ <i>"${excerpt}"</i> có nỗ lực, nhưng nhịp điệu tổng thể vẫn chưa thực sự nhuần nhuyễn.`,
            `Xét riêng câu <i>"${excerpt}"</i>, ta thấy tác giả còn khá dè dặt trong việc bứt phá cảm xúc.`,
            `Mở đầu bằng <i>"${excerpt}"</i> là một ý hay, nhưng mạch thơ sau đó chưa giữ được độ căng cần thiết.`,
            `Câu thơ <i>"${excerpt}"</i> cho thấy tác giả có ý tưởng, nhưng cách triển khai chưa thực sự thuyết phục.`
        ] : [
            "Dù có nhiều nỗ lực, bài thơ vẫn còn những điểm cần bàn lại.",
            "Tác phẩm có ý tưởng tốt nhưng cách triển khai chưa thực sự thuyết phục.",
            "Đọc bài thơ, ta thấy tác giả còn khá dè dặt trong việc bứt phá.",
            "Có thể thấy tác giả đang cố gắng, nhưng tác phẩm vẫn chưa chạm tới đỉnh cao."
        ];

        let middle = "";
        if (topTheme && mainSymbol) {
            middle = `Việc lạm dụng hình ảnh <b>${mainSymbol}</b> để nói về <b>${topTheme}</b> đôi chỗ khiến bài thơ trở nên sáo rỗng. Tác giả nên tiết chế lại để tránh sự trùng lặp và nhàm chán.`;
        } else if (topTheme) {
            middle = `Chủ đề <b>${topTheme}</b> được khai thác nhưng chưa có gì mới lạ. Những cảm xúc được bộc lộ khá an toàn và thiếu đi những điểm nhấn đột phá.`;
        } else if (mainSymbol) {
            middle = `Hình ảnh <b>${mainSymbol}</b> xuất hiện nhưng chưa được đẩy lên thành biểu tượng, khiến câu thơ vẫn dừng lại ở mức miêu tả thông thường.`;
        } else {
            middle = `Bài thơ thiếu đi những hình ảnh ước lệ cần thiết, nhịp điệu câu chữ đôi lúc còn lỏng lẻo, chưa tạo được dư vị sâu sắc.`;
        }

        const endings = [
            "Tác phẩm cần được gọt giũa thêm để có thể tỏa sáng.",
            "Hy vọng tác giả sẽ có những bước tiến xa hơn trong các sáng tác sau.",
            "Đây là một trải nghiệm đọc thú vị, nhưng chưa phải là một kiệt tác.",
            "Nếu biết tiết chế và chọn lọc hơn, tác giả sẽ sớm có những vần thơ để đời."
        ];

        // 5. Kết hợp ngẫu nhiên
        const commentary = `${openings[Math.floor(Math.random() * openings.length)]} ${middle} ${endings[Math.floor(Math.random() * endings.length)]}`;

        return {
            theme: topTheme || '',
            symbol: mainSymbol || '',
            commentary: commentary
        };
    }
};

// =====================================================================
// AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
CriticAgent.agentInfo = {
    key: 'critic',
    name: 'Phê Bình AI',
    description: 'Chuyên trách chỉ ra hạn chế, thiếu sót.',
    capabilities: {
        'criticize-work': 'analyze'
    },
    canRead: ['work', 'symbol'],
    canDelegate: ['poetics'],
    intentPatterns: {
        'criticize-work': ['che', 'phe binh', 'criticize', 'han che', 'te', 'kem']
    }
};
