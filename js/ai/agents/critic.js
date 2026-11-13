/**
 * ==========================================================
 * VĂN ĐẠO AI - CRITIC AGENT (js/ai/agents/critic.js)
 * Vị trí: js/ai/agents/critic.js
 * Version: 1.0.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Chỉ ra hạn chế, thiếu sót của tác phẩm (Phê bình).
 * - Sinh ra lời bình luận mang tính xây dựng dựa trên chủ đề và biểu tượng.
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
// 1. THEME RULES (Quy tắc chủ đề để phê bình)
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
export const CriticAgent = {
    /**
     * Phân tích văn bản để tìm hạn chế, điểm cần cải thiện.
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

// =====================================================================
// [THÊM MỚI v7.0.0] AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
/**
 * Metadata tự mô tả của CriticAgent.
 * Chuyên trách Phê bình — chỉ ra hạn chế, thiếu sót của tác phẩm.
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
 * - Critic còn được gọi TRỰC TIẾP trong main.js (tầng 4 của
 *   Thi Pháp Học) và trong fortune-ai.js (synthesizeDynamicFortune).
 *   Vì vậy KHÔNG được đổi tên method `analyze` hay cấu trúc
 *   kết quả nếu muốn giữ tương thích ngược.
 *
 * ĐỐI TRỌNG VỚI PRAISER:
 * - Cùng cấu trúc THEMES, cùng cơ chế analyze(), nhưng giọng
 *   điệu ngược lại: Praiser ca ngợi, Critic chỉ trích xây dựng.
 * - Cặp đôi này thường được gọi cùng nhau để tạo "lưỡng diện"
 *   trong Bói thơ và Thi Pháp Học.
 */
CriticAgent.agentInfo = {
    // ---- Định danh ----
    key: 'critic',
    name: 'Phê Bình AI',
    description: 'Chuyên trách chỉ ra hạn chế, thiếu sót.',

    // ---- Năng lực ----
    capabilities: {
        'criticize-work': 'analyze'             // "Chê bài thơ này" -> CriticAgent.analyze()
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'symbol'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['poetics'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'criticize-work': ['che', 'phe binh', 'criticize', 'han che', 'te', 'kem']
    }
};
