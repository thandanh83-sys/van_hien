/**
 * ==========================================================
 * VĂN ĐẠO AI - HISTORY AGENT (js/ai/agents/history.js)
 * Vị trí: js/ai/agents/history.js
 * Version: 1.1.0 (Unified Intelligence Network)
 * ==========================================================
 * CHỨC NĂNG:
 * - Truy vấn bối cảnh lịch sử, thời đại văn học.
 * - Tìm tác phẩm, tác giả theo thời kỳ (Era).
 * - Liên kết tác phẩm với bối cảnh lịch sử của nó.
 * 
 * TRIẾT LÝ:
 * - Không tự ý fetch JSON. Mọi dữ liệu lấy từ DataHub.
 * - ID là ngôn ngữ chung. Dùng ID để liên kết Tác phẩm - Tác giả - Thời đại.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { normalizeRouteText } from '../../utils.js';
import { DataHub } from '../../network/data-hub.js';
import { resolveAndFetch } from '../core.js';

export const HistoryAgent = {
    // =================================================================
    // 1. TÌM TÁC PHẨM THEO THỜI KỲ (Era)
    // =================================================================
    /**
     * Tìm các tác phẩm thuộc một thời kỳ cụ thể.
     * Câu hỏi: "Tác phẩm nào viết thời nhà Lê?", "Văn học thế kỷ 19 có gì?"
     * 
     * @param {string} eraQuery - Tên thời kỳ (VD: "Nhà Lê sơ", "TK 19", "Nhà Trần")
     * @returns {Promise<Object>} Kết quả chuẩn (answer, detail, source, meta)
     */
    async findWorksByEra(eraQuery) {
        if (!eraQuery) {
            return { 
                answer: 'Bạn muốn tìm tác phẩm thuộc thời kỳ nào?', 
                source: 'history' 
            };
        }

        const normalizedQuery = normalizeRouteText(eraQuery);
        
        // Lọc tác phẩm dựa trên trường 'era' (Thời kỳ)
        const works = APP_DATA.WORKS_DATA.filter(w => {
            if (!w.era) return false;
            const wEra = normalizeRouteText(w.era);
            // Khớp chính xác hoặc chứa từ khóa (VD: "Lê" khớp với "Nhà Lê sơ")
            return wEra.includes(normalizedQuery) || normalizedQuery.includes(wEra);
        });

        if (works.length === 0) {
            return { 
                answer: `Không tìm thấy tác phẩm nào thuộc thời kỳ "${eraQuery}" trong kho tàng Văn Đạo.`, 
                source: 'history' 
            };
        }

        // Sắp xếp theo tên A-Z
        works.sort((a, b) => a.title.localeCompare(b.title));
        
        // Lấy tối đa 10 tác phẩm để hiển thị lên UI
        const topWorks = works.slice(0, 10);
        const titles = topWorks.map(w => w.title).join(' · ');

        return {
            answer: `Thời kỳ "${eraQuery}" có ${works.length} tác phẩm tiêu biểu. Có thể kể đến: ${titles}.`,
            detail: 'Dựa trên dữ liệu niên đại của tác phẩm.',
            source: 'history',
            meta: topWorks // Trả về mảng object để UI render nút bấm
        };
    },

    // =================================================================
    // 2. TÌM TÁC GIẢ THEO THỜI KỲ (Era)
    // =================================================================
    /**
     * Tìm các tác giả thuộc một thời kỳ cụ thể.
     * Câu hỏi: "Tác giả thời nhà Trần là ai?", "Nhà thơ thế kỷ 20?"
     * 
     * @param {string} eraQuery - Tên thời kỳ
     * @returns {Promise<Object>} 
     */
    async findAuthorsByEra(eraQuery) {
        if (!eraQuery) {
            return { answer: 'Bạn muốn tìm tác giả thuộc thời kỳ nào?', source: 'history' };
        }

        const normalizedQuery = normalizeRouteText(eraQuery);

        // Lọc tác giả: Duyệt qua tất cả tác phẩm, nếu tác phẩm thuộc thời kỳ, lấy tác giả đó.
        const authorMap = new Map(); // Dùng Map để tránh trùng lặp tác giả
        
        APP_DATA.WORKS_DATA.forEach(w => {
            if (w.era && normalizeRouteText(w.era).includes(normalizedQuery)) {
                if (w.author) {
                    authorMap.set(w.author, { 
                        id: `tac-gia-${normalizeRouteText(w.author).replace(/\s+/g, '-')}`, 
                        title: `Chân Dung Tác Giả: ${w.author}`,
                        authorName: w.author 
                    });
                }
            }
        });

        const authors = Array.from(authorMap.values());

        if (authors.length === 0) {
            return { 
                answer: `Không tìm thấy tác giả nào thuộc thời kỳ "${eraQuery}".`, 
                source: 'history' 
            };
        }

        const names = authors.map(a => a.authorName).join(', ');

        return {
            answer: `Thời kỳ "${eraQuery}" có ${authors.length} tác giả tiêu biểu: ${names}.`,
            detail: 'Danh sách được tổng hợp từ các tác phẩm cùng thời.',
            source: 'history',
            meta: authors
        };
    },

    // =================================================================
    // 3. LẤY BỐI CẢNH LỊCH SỬ CỦA MỘT TÁC PHẨM/TÁC GIẢ
    // =================================================================
    /**
     * Lấy bối cảnh lịch sử (Era) của một tác phẩm hoặc tác giả.
     * Câu hỏi: "Truyện Kiều viết thời nào?", "Nam Cao hoạt động thời kỳ nào?"
     * 
     * @param {string} idOrName - ID hoặc tên tác phẩm/tác giả
     * @returns {Promise<Object>}
     */
    async getHistoricalContext(idOrName) {
        if (!idOrName) {
            return { answer: 'Vui lòng cung cấp tên tác phẩm hoặc tác giả.', source: 'history' };
        }

        // [SỬA LỖI] Dùng DataHub để dịch Tên thành ID (VD: "Truyện Kiều" -> "truyen-kieu")
        // Điều này giải quyết lỗi "Không tìm thấy ID Truyện Kiều nào"
        const target = DataHub.resolveIdFromQuery(idOrName);
        let idToFetch = target ? target.id : idOrName;

        // Dùng ID (đã được dịch) để lấy dữ liệu
        const resolved = await resolveAndFetch(idToFetch);
        
        if (!resolved) {
            return { 
                answer: `Không tìm thấy tư liệu về "${idOrName}" để tra cứu lịch sử.`, 
                source: 'history' 
            };
        }

        const { group, record } = resolved;
        let era = '';

        // Nếu là Tác phẩm, lấy trường 'era'
        if (group === 'tinh-hoa') {
            era = record.era || 'Không rõ';
        } 
        // Nếu là Tác giả, tìm tác phẩm của họ để suy ra thời đại
        else if (group === 'ky-tai') {
            const authorName = record.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            const works = APP_DATA.WORKS_DATA.filter(w => 
                w.author && w.author.toLowerCase().trim() === authorName.toLowerCase()
            );
            // Lấy thời kỳ của tác phẩm đầu tiên tìm thấy
            if (works.length > 0 && works[0].era) {
                era = works[0].era;
            } else {
                era = 'Chưa xác định';
            }
        }

        // Tìm các tác phẩm cùng thời kỳ (Liên kết ID - ID)
        let contemporaryWorks = [];
        if (era && era !== 'Không rõ' && era !== 'Chưa xác định') {
            contemporaryWorks = APP_DATA.WORKS_DATA.filter(w => 
                w.id !== record.id && 
                w.era && 
                normalizeRouteText(w.era).includes(normalizeRouteText(era))
            ).slice(0, 5); // Lấy tối đa 5 tác phẩm cùng thời để gợi ý
        }

        const title = record.title || record.name;
        const eraText = era !== 'Không rõ' && era !== 'Chưa xác định' 
            ? `thuộc thời kỳ **${era}**` 
            : 'chưa xác định được thời kỳ chính xác';

        return {
            answer: `Tác phẩm "${title}" ${eraText}.`,
            detail: contemporaryWorks.length > 0 
                ? `Trong cùng thời kỳ này, còn có các tác phẩm: ${contemporaryWorks.map(w => w.title).join(' · ')}`
                : 'Chưa tìm thấy tác phẩm cùng thời khác.',
            source: 'history',
            meta: contemporaryWorks
        };
    }
};

// =====================================================================
// [THÊM MỚI v7.0.0] AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
/**
 * Metadata tự mô tả của HistoryAgent.
 * Chuyên trách bối cảnh lịch sử, thời đại văn học.
 *
 * ĐIỂM MẠNH:
 * - 3 method độc lập, mỗi method trả lời một dạng câu hỏi riêng:
 *   1. findWorksByEra      → "Tác phẩm thời Lê?"
 *   2. findAuthorsByEra    → "Tác giả thời Trần?"
 *   3. getHistoricalContext → "Truyện Kiều viết thời nào?"
 * - Đều dùng DataHub để tra cứu (Offline-First), không tự fetch JSON.
 */
HistoryAgent.agentInfo = {
    // ---- Định danh ----
    key: 'history',
    name: 'Lịch Sử AI',
    description: 'Chuyên trách Bối cảnh lịch sử, Thời đại văn học.',

    // ---- Năng lực (task -> method) ----
    capabilities: {
        'find-works-by-era': 'findWorksByEra',        // "Tác phẩm thời Lê?"
        'find-authors-by-era': 'findAuthorsByEra',    // "Tác giả thời Trần?"
        'get-historical-context': 'getHistoricalContext' // "Truyện Kiều viết thời nào?"
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author', 'genre'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['literature', 'knowledge'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'find-works-by-era': ['tac pham thoi', 'van hoc thoi', 'tac pham trieu dai'],
        'find-authors-by-era': ['tac gia thoi', 'nha tho thoi', 'nha van thoi'],
        'get-historical-context': ['viet thoi nao', 'thuoc thoi nao', 'boi canh lich su', 'hoat dong thoi nao']
    }
};
