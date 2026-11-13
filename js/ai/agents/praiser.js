/**
 * ==========================================================
 * VĂN ĐẠO AI - PRAISER AGENT (js/ai/agents/praiser.js)
 * Vị trí: js/ai/agents/praiser.js
 * Version: 1.0.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tìm vẻ đẹp, ca ngợi tác phẩm (Tán thưởng).
 * - Sinh ra lời bình luận tích cực dựa trên chủ đề và biểu tượng.
 * 
 * ĐẶC BIỆT:
 * - Đây là agent KHÔNG đi qua MasterAI thông thường.
 * - Kết quả trả về có cấu trúc riêng { theme, symbol, commentary }
 *   khác với chuẩn { answer, detail, source, meta }.
 * - MasterAI có adapter riêng để chuyển đổi (xem master.js dòng 42-48).
 * - Được dùng trực tiếp trong main.js để render tầng 4 của
 *   pipeline Thi Pháp Học, và trong synthesizeDynamicFortune()
 *   của fortune-ai.js.
 * ==========================================================
 */

import { countWeightedMatches } from '../core.js';
import { normalizeRouteText } from '../../utils.js';
import { findSymbols } from '../../render.js';

// ==========================================================
// 1. THEME RULES (Quy tắc chủ đề để ca ngợi)
// ==========================================================
const THEMES = [
    { id: 'nature', label: 'thiên nhiên', terms: [{ t: 'trăng', w: 2 }, { t: 'sông', w: 1.5 }, { t: 'núi', w: 1.5 }, { t: 'mây', w: 1 }] },
    { id: 'homesickness', label: 'quê hương', terms: [{ t: 'quê hương', w: 2 }, { t: 'nhớ nhà', w: 2.5 }, { t: 'làng', w: 1 }] },
    { id: 'love', label: 'tình cảm', terms: [{ t: 'yêu', w: 1 }, { t: 'duyên', w: 1.5 }, { t: 'lứa đôi', w: 2 }] },
    { id: 'humanity', label: 'nhân sinh', terms: [{ t: 'nhân sinh', w: 2 }, { t: 'phận', w: 2 }, { t: 'nước mắt', w: 1.5 }] }
];

// ==========================================================
// 2. AGENT OBJECT
// ==========================================================
export const PraiserAgent = {
    /**
     * Phân tích văn bản để tìm vẻ đẹp, điểm sáng.
     * 
     * @param {string} text - Văn bản cần phân tích (tên tác phẩm, nội dung, v.v.)
     * @returns {Object} { theme, symbol, commentary }
     */
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

// =====================================================================
// [THÊM MỚI v7.0.0] AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
/**
 * Metadata tự mô tả của PraiserAgent.
 * Chuyên trách Tán thưởng — tìm vẻ đẹp, điểm sáng của tác phẩm.
 *
 * GHI CHÚ QUAN TRỌNG:
 * - Kết quả trả về của `analyze()` KHÔNG theo chuẩn
 *   { answer, detail, source, meta } mà theo cấu trúc riêng
 *   { theme, symbol, commentary }.
 * - MasterAI đã có adapter riêng để chuyển đổi (xem master.js):
 *       if (agentKey === 'praiser' || agentKey === 'critic') {
 *           return {
 *               answer: rawResult.commentary,
 *               detail: `Chủ đề: ... | Hình ảnh: ...`,
 *               source: agentKey,
 *               meta: []
 *           };
 *       }
 * - Praiser còn được gọi TRỰC TIẾP trong main.js (tầng 4 của
 *   Thi Pháp Học) và trong fortune-ai.js (synthesizeDynamicFortune).
 *   Vì vậy KHÔNG được đổi tên method `analyze` hay cấu trúc
 *   kết quả nếu muốn giữ tương thích ngược.
 *
 * TỪ KHÓA INTENT:
 * - Các từ khóa 'dep', 'hay', 'tuyet' rất ngắn và dễ trùng với
 *   các câu hỏi thông thường. Trong thực tế, Praiser thường được
 *   gọi qua ngữ cảnh rõ ràng (VD: "Khen bài thơ này") hơn là
 *   nhận diện tự động.
 */
PraiserAgent.agentInfo = {
    // ---- Định danh ----
    key: 'praiser',
    name: 'Tán Thưởng AI',
    description: 'Chuyên trách tìm vẻ đẹp, ca ngợi tác phẩm.',

    // ---- Năng lực ----
    capabilities: {
        'praise-work': 'analyze'                // "Khen bài thơ này" -> PraiserAgent.analyze()
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'symbol'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['poetics'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'praise-work': ['khen', 'ca ngoi', 'praise', 'tuyet', 'dep', 'hay']
    }
};
