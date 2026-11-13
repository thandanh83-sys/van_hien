/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Chức năng: Tiếp nhận, Chuẩn hóa và Phân tích Ý định
 * ==========================================================
 */

import { extractEntity } from './core.js';

export const InputAI = {
    /**
     * Phân tích câu hỏi của người dùng
     * @param {string} input - Câu người dùng gõ
     * @returns {Object} - { type, query }
     */
    parseIntent(input) {
        const t = (input || '').toLowerCase().trim();
        if (!t) return { type: 'empty', query: '' };

        // Cắt bỏ các từ đệm phổ biến (Hãy, giúp tôi, cho tôi biết...)
        let clean = t.replace(/^(hãy|giúp tôi|cho tôi biết|cho mình hỏi|xin hỏi|làm ơn)\s+/i, '');

        // 1. Tóm tắt / Nội dung
        if (/(tóm tắt|nội dung|kể lại|giới thiệu|nói về gì)/i.test(clean)) {
            const q = extractEntity(clean, [/(tóm tắt|nội dung|kể lại|giới thiệu|nói về gì|tác phẩm|bài thơ|bài|của)/gi]);
            return { type: 'summarize-work', query: q };
        }

        // 2. Hỏi Tác giả
        if (/(ai|tác giả|người nào)\s+(là|viết|sáng tác|đặt tên|tạo ra|của bài|của tác phẩm)/i.test(clean)) {
            const q = extractEntity(clean, [/(ai là|ai viết|tác giả|người nào|đặt tên cho|viết|sáng tác|là người|của bài|của tác phẩm|của)/gi]);
            return { type: 'find-author-of', query: q };
        }

        // 3. Hỏi Ý nghĩa / Biểu tượng / Điển tích
        if (/(biểu tượng|hình ảnh|điển tích|điển cố|ý nghĩa của)/i.test(clean)) {
            const keyword = extractEntity(clean, [/(biểu tượng|hình ảnh|điển tích|điển cố|ý nghĩa của|là gì|có ý nghĩa gì|trong thơ|của từ|từ)/gi]);
            if (!keyword) return { type: 'search', query: clean }; 
            return { type: 'explain-symbol', query: keyword };
        }

        // 4. Gợi ý đọc
        if (/(gợi ý|đề xuất|tìm truyện|tìm thơ|muốn đọc)/i.test(clean)) {
            const genre = extractEntity(clean, [/(gợi ý|đề xuất|tìm truyện|tìm thơ|muốn đọc|cho tôi|về|những|tác phẩm|các)/gi]);
            return { type: 'recommend', query: genre };
        }

        // 5. Phân tích tác phẩm
        if (/(phân tích|bình giảng|cảm nhận|đánh giá)/i.test(clean)) {
            const q = extractEntity(clean, [/(phân tích|bình giảng|cảm nhận|đánh giá|tác phẩm|bài thơ|bài)/gi]);
            return { type: 'analyze-work', query: q };
        }

        // 6. Định nghĩa thể loại
        if (/(thể loại|định nghĩa|khái niệm).*(là gì|như thế nào)/i.test(clean)) {
            const genre = extractEntity(clean, [/thể loại|là gì|như thế nào|định nghĩa|khái niệm/gi]);
            return { type: 'define-genre', query: genre };
        }

        // 7. Bói thơ / Vận khí
        if (/(bói|vận khí|quẻ|gieo quẻ)/i.test(clean)) {
            return { type: 'fortune', query: clean };
        }

        // 8. Mặc định: Tìm kiếm thông thường
        return { type: 'search', query: input.trim() };
    }
};