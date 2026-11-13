/**
 * ==========================================================
 * VĂN ĐẠO AI - CRITIC AGENT (js/ai/agents/critic.js)
 * Chức năng: Chuyên gia Phê bình & Chỉ ra hạn chế
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

export const CriticAgent = {
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
            "Đây là một trải nghiệm đọc thú vị, nhưng chưa phải là một kiệt tác."
        ];

        const commentary = `${openings[Math.floor(Math.random() * openings.length)]} ${middle} ${endings[Math.floor(Math.random() * endings.length)]}`;

        return {
            theme: topTheme || 'Chưa rõ',
            symbol: mainSymbol || 'Không có',
            commentary: commentary
        };
    }
};