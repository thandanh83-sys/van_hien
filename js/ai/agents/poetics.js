/**
 * ==========================================================
 * VĂN ĐẠO AI - POETICS AGENT (js/ai/agents/poetics.js)
 * Vị trí: js/ai/agents/poetics.js
 * Version: 1.2.0 (Multi-Agent Specialist)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tra cứu từ điển (Biểu tượng, Điển tích, Hán Việt, Tu từ...).
 * - Giải thích các khái niệm thi pháp.
 * - Hỗ trợ tìm kiếm mờ (Fuzzy search) không phân biệt dấu.
 * ==========================================================
 */

import { getDictionaryIndex } from '../core.js';
import { normalizeRouteText } from '../../utils.js';

export const PoeticsAgent = {
    /**
     * 1. Giải nghĩa Biểu tượng / Điển tích / Từ ngữ thi pháp
     * Được gọi khi người dùng hỏi: "Ý nghĩa của trăng là gì?", "Tái ông thất mã nghĩa là gì?"
     * 
     * @param {string} keyword - Từ khóa cần tra cứu (VD: "trăng", "tái ông thất mã")
     * @returns {Object} - Kết quả chuẩn để MasterAI và OutputAI xử lý
     */
    async explainSymbol(keyword) {
        // Nếu từ khóa quá ngắn hoặc rỗng, trả về lỗi ngay
        if (!keyword || keyword.trim().length < 2) {
            return {
                answer: 'Từ khóa quá ngắn để tra cứu. Vui lòng nhập rõ hơn (VD: "ý nghĩa của trăng", "điển tích tái ông").',
                source: 'dictionary'
            };
        }

        // Lấy toàn bộ chỉ mục từ điển (đã được cache trong core.js để không bị chậm)
        const allEntries = getDictionaryIndex();
        const q = normalizeRouteText(keyword);

        // Bước 1: Tìm chính xác tuyệt đối (Exact Match)
        // Ví dụ gõ đúng "trăng" sẽ ưu tiên tìm ra mục "trăng" thay vì "ánh trăng"
        let found = allEntries.find(item => item.normalizedKeyword === q);

        // Bước 2: Nếu không có, tìm gần đúng (Partial Match)
        // Ví dụ gõ "tái ông" sẽ tìm thấy mục "tái ông thất mã"
        if (!found) {
            // Lọc ra các mục chứa từ khóa
            const partialMatches = allEntries.filter(item => 
                item.normalizedKeyword.includes(q) || q.includes(item.normalizedKeyword)
            );
            
            // Nếu có nhiều kết quả, ưu tiên kết quả có độ dài từ khóa gần nhất
            if (partialMatches.length > 0) {
                partialMatches.sort((a, b) => Math.abs(a.normalizedKeyword.length - q.length) - Math.abs(b.normalizedKeyword.length - q.length));
                found = partialMatches[0];
            }
        }

        // Bước 3: Trả kết quả
        if (found) {
            return {
                answer: found.mean || 'Chưa có thông tin giải nghĩa chi tiết.',
                detail: `[${found.type}] ${found.keyword}`,
                source: 'dictionary',
                meta: [] // Poetics không trả về meta liên kết tác phẩm
            };
        }

        // Bước 4: Không tìm thấy
        return {
            answer: `Không tìm thấy giải nghĩa cho "${keyword}" trong từ điển.`,
            detail: 'Bạn có thể thử tra cứu các từ khóa khác như: trăng, liễu, tái ông thất mã, hán việt...',
            source: 'dictionary',
            meta: []
        };
    },

    /**
     * 2. Tra cứu nâng cao (Tùy chọn - Dành cho tương lai mở rộng)
     * Trả về danh sách nhiều kết quả thay vì chỉ 1.
     */
    async searchDictionary(query) {
        const allEntries = getDictionaryIndex();
        const q = normalizeRouteText(query);
        
        const results = allEntries
            .filter(item => item.normalizedKeyword.includes(q))
            .slice(0, 5) // Lấy tối đa 5 kết quả
            .map(item => ({
                keyword: item.keyword,
                type: item.type,
                mean: item.mean
            }));

        if (results.length > 0) {
            return {
                answer: `Tìm thấy ${results.length} mục từ liên quan đến "${query}".`,
                detail: 'Chi tiết bên dưới:',
                source: 'dictionary',
                meta: [] // Sẽ render dạng list ở OutputAI
            };
        }

        return {
            answer: `Không có kết quả nào cho "${query}".`,
            source: 'dictionary',
            meta: []
        };
    }
};