/**
 * ==========================================================
 * VĂN ĐẠO AI - PRAISER AGENT (js/ai/agents/praiser.js)
 * Vị trí: js/ai/agents/praiser.js
 * Version: 1.1.0 (Context-Aware Commentary)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tìm vẻ đẹp, ca ngợi tác phẩm (Tán thưởng).
 * - Sinh ra lời bình luận tích cực dựa trên chủ đề và biểu tượng.
 * 
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.0.0: Plugin Architecture.
 * - v1.1.0: Thêm tính năng trích xuất câu thơ đầu tiên (excerpt) để 
 *           đưa vào câu bình luận. Giúp AI không còn nói những câu 
 *           chung chung sáo rỗng, mà bám sát vào văn bản thực tế.
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
// 1. THEME RULES (Quy tắc chủ đề để ca ngợi)
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
export const PraiserAgent = {
    /**
     * Phân tích văn bản để tìm vẻ đẹp, điểm sáng.
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
        // Giới hạn độ dài để câu bình luận không bị quá dài
        if (excerpt.length > 35) excerpt = excerpt.substring(0, 35).trim() + '...';
        
        // 4. Xây dựng các phần của lời bình
        const openings = excerpt ? [
            `Ấn tượng đầu tiên khi đọc câu thơ <i>"${excerpt}"</i> là sự tinh tế trong cách dùng từ.`,
            `Chỉ qua câu thơ <i>"${excerpt}"</i>, ta đã thấy được một tâm hồn thi sĩ nhạy cảm và đầy trăn trở.`,
            `Tác giả đã khéo léo dẫn dắt người đọc vào mạch cảm xúc ngay từ câu mở đầu <i>"${excerpt}"</i>.`,
            `Câu thơ <i>"${excerpt}"</i> như một nốt nhạc dạo đầu đầy gợi cảm cho toàn bộ tác phẩm.`
        ] : [
            "Bài thơ mang một vẻ đẹp rất riêng và đầy sức gợi.",
            "Điều ấn tượng nhất ở tác phẩm này là sự tinh tế trong từng câu chữ.",
            "Bài thơ đã chạm đến những rung cảm sâu kín nhất của người đọc.",
            "Một tác phẩm để lại dư vị ngọt ngào và ám ảnh khó quên."
        ];

        let middle = "";
        if (topTheme && mainSymbol) {
            middle = `Tác giả đã xuất sắc khắc họa chủ đề <b>${topTheme}</b> thông qua hình ảnh <b>${mainSymbol}</b>. Sự hòa quyện giữa cảnh và tình này đã tạo nên những vần thơ đắt giá, khiến người đọc không thể rời mắt.`;
        } else if (topTheme) {
            middle = `Cảm xúc về <b>${topTheme}</b> được tuôn chảy tự nhiên, không hề gượng ép, cho thấy một tâm hồn nhạy cảm và tinh tế.`;
        } else if (mainSymbol) {
            middle = `Việc sử dụng hình ảnh <b>${mainSymbol}</b> là một điểm sáng nghệ thuật, tạo nên chiều sâu và sức lan tỏa cho toàn bộ tác phẩm.`;
        } else {
            middle = `Dù không dùng nhiều hình ảnh ước lệ, bài thơ vẫn chinh phục người đọc bằng chính sự chân thành và giọng điệu mộc mạc.`;
        }

        const endings = [
            "Đây là một viên ngọc quý trong kho tàng văn học.",
            "Một tác phẩm xứng đáng được đọc đi đọc lại nhiều lần.",
            "Chắc chắn bài thơ này sẽ còn sống mãi cùng năm tháng.",
            "Một sáng tác để lại nhiều dư âm trong lòng độc giả."
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
PraiserAgent.agentInfo = {
    key: 'praiser',
    name: 'Tán Thưởng AI',
    description: 'Chuyên trách tìm vẻ đẹp, ca ngợi tác phẩm.',
    capabilities: {
        'praise-work': 'analyze'
    },
    canRead: ['work', 'symbol'],
    canDelegate: ['poetics'],
    intentPatterns: {
        'praise-work': ['khen', 'ca ngoi', 'praise', 'tuyet', 'dep', 'hay']
    }
};
