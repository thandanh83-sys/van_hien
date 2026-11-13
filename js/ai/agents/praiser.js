/**
 * ==========================================================
 * VĂN ĐẠO AI - PRAISER AGENT (js/ai/agents/praiser.js)
 * Chức năng: Chuyên gia Tán dương & Tìm vẻ đẹp Văn học
 * ==========================================================
 */

import { countWeightedMatches } from '../core.js';
import { normalizeRouteText } from '../../utils.js';
import { findSymbols } from '../../render.js';

const THEMES = [
    { id: 'nature', label: 'thiên nhiên', terms: [{ t: 'trăng', w: 2 }, { t: 'sông', w: 1.5 }, { t: 'núi', w: 1.5 }, { t: 'mây', w: 1 }] },
    { id: 'homesickness', label: 'quê hương', terms: [{ t: 'quê hương', w: 2 }, { t: 'nhớ nhà', w: 2.5 }, { t: 'làng', w: 1 }] },
    { id: 'love', label: 'tình cảm', terms: [{ t: 'yêu', w: 1 }, { t: 'duyên', w: 1.5 }, { t: 'lứa đôi', w: 2 }] },
    { id: 'humanity', label: 'nhân sinh', terms: [{ t: 'nhân sinh', w: 2 }, { t: 'phận', w: 2 }, { t: 'nước mắt', w: 1.5 }] }
];

export const PraiserAgent = {
    analyze(text) {
        const normalized = normalizeRouteText(text);
        
        let topTheme = null;
        let maxScore = 0;
        THEMES.forEach(theme => {
            const { score } = countWeightedMatches(normalized, theme.terms);
            if (score > maxScore) { maxScore = score; topTheme = theme.label; }
        });

        const symbols = findSymbols(text);
        const mainSymbol = symbols.length > 0 ? symbols[0].keyword : null;

        const openings = [
            "Bài thơ mang một vẻ đẹp rất riêng và đầy sức gợi.",
            "Điều ấn tượng nhất ở tác phẩm này là sự tinh tế trong từng câu chữ.",
            "Bài thơ đã chạm đến những rung cảm sâu kín nhất của người đọc.",
            "Một tác phẩm để lại dư vị ngọt ngào và ám ảnh khó quên."
        ];

        let middle = "";
        if (topTheme && mainSymbol) {
            middle = `Tác giả đã xuất sắc khắc họa chủ đề <b>${topTheme}</b> thông qua hình ảnh <b>${mainSymbol}</b>. Sự hòa quyện giữa cảnh và tình này đã tạo nên những vần thơ đắt giá, khiến người đọc không thể rời mắt.`;
        } else if (topTheme) {
            middle = `Cảm xúc về <b>${topTheme}</b> được tuôn chảy tự nhiên, không hề gượng ép, cho thấy một tâm hồn thi sĩ nhạy cảm và tinh tế.`;
        } else if (mainSymbol) {
            middle = `Việc sử dụng hình ảnh <b>${mainSymbol}</b> là một điểm sáng nghệ thuật, tạo nên chiều sâu và sức lan tỏa cho toàn bộ tác phẩm.`;
        } else {
            middle = `Dù không dùng nhiều hình ảnh ước lệ, bài thơ vẫn chinh phục người đọc bằng chính sự chân thành và giọng điệu mộc mạc.`;
        }

        const endings = [
            "Đây là một viên ngọc quý trong kho tàng văn học.",
            "Một tác phẩm xứng đáng được đọc đi đọc lại nhiều lần.",
            "Chắc chắn bài thơ này sẽ còn sống mãi cùng năm tháng."
        ];

        const commentary = `${openings[Math.floor(Math.random() * openings.length)]} ${middle} ${endings[Math.floor(Math.random() * endings.length)]}`;

        return {
            theme: topTheme || 'Chưa rõ',
            symbol: mainSymbol || 'Không có',
            commentary: commentary
        };
    }
};