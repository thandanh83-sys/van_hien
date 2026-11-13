/**
 * ==========================================================
 * VĂN ĐẠO AI - TRANSLATION AGENT (js/ai/agents/translation.js)
 * Vị trí: js/ai/agents/translation.js
 * Version: 1.0.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tiếp nhận yêu cầu dịch thuật (Tác phẩm, Tác giả, hoặc câu nói).
 * - Sử dụng DataHub để tra cứu thông tin gốc (Offline-First).
 * - Giả lập quá trình dịch thuật (Mock Translation) do không có API bên ngoài.
 * - Trả về kết quả chuẩn (answer, detail, source, meta).
 * 
 * TRIẾT LÝ:
 * - Không tự ý fetch dữ liệu. Mọi thứ đi qua DataHub.
 * - Kết quả trả về phải có cấu trúc chuẩn để OutputAI render.
 * ==========================================================
 */

import { DataHub } from '../../network/data-hub.js';
import { resolveAndFetch } from '../core.js';

export const TranslationAgent = {
    // =================================================================
    // 1. HÀM XỬ LÝ CHÍNH (Được gọi từ MasterAI)
    // =================================================================
    /**
     * Dịch một văn bản, tác phẩm hoặc thông tin tác giả.
     * Câu hỏi: "Dịch Truyện Kiều sang tiếng Anh", "Dịch bài thơ này"
     * 
     * @param {string} input - Câu hỏi hoặc tên thực thể cần dịch
     * @returns {Promise<Object>} Kết quả chuẩn (answer, detail, source, meta)
     */
    async translate(input) {
        if (!input) {
            return { 
                answer: 'Bạn muốn dịch nội dung nào?', 
                source: 'translation' 
            };
        }

        // Bước 1: Phân tích xem người dùng muốn dịch cái gì
        const target = DataHub.resolveIdFromQuery(input);
        
        // Bước 2: Nếu là Tác phẩm hoặc Tác giả có trong hệ thống
        if (target) {
            const resolved = await resolveAndFetch(target.id);
            if (resolved) {
                return this._translateEntity(resolved);
            }
        }

        // Bước 3: Nếu là câu nói tự do (Không tìm thấy trong DataHub)
        return this._translateFreeText(input);
    },

    // =================================================================
    // 2. CÁC HÀM HỖ TRỢ NỘI BỘ (PRIVATE METHODS)
    // =================================================================

    /**
     * Dịch thông tin của một Tác phẩm / Tác giả đã có trong hệ thống.
     */
    _translateEntity(resolved) {
        const { group, record } = resolved;
        const title = record.title || record.name;
        
        // Giả lập dịch dựa trên nhóm thực thể
        let answer = '';
        let detail = '';

        if (group === 'tinh-hoa') {
            const fakeEnglishTitle = this._mockTranslateText(title);
            answer = `Bản dịch tiêu đề tác phẩm: **"${fakeEnglishTitle}"** (từ nguyên bản "${title}").`;
            detail = `Tác giả: ${record.author}. Thể loại: ${(record.the_loai || []).join(', ')}.`;
        } else if (group === 'ky-tai') {
            const authorName = title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            const fakeEnglishName = this._mockTranslateText(authorName);
            answer = `Tên tác giả trong tiếng Anh: **"${fakeEnglishName}"** (từ nguyên bản "${authorName}").`;
            detail = `Đây là bản dịch tên riêng, không phải bản dịch tác phẩm.`;
        }

        return {
            answer: answer,
            detail: detail,
            source: 'translation',
            meta: [record] // Trả về để UI có thể render nút bấm
        };
    },

    /**
     * Dịch một câu nói tự do của người dùng.
     */
    _translateFreeText(text) {
        // Loại bỏ các từ khóa ra lệnh (dịch, translate, sang tiếng Anh...)
        const cleanText = text
            .replace(/\b(dịch|translate|sang tiếng anh|sang tiếng việt|giúp tôi|hãy)\b/gi, '')
            .trim();

        if (!cleanText) {
            return { 
                answer: 'Vui lòng nhập nội dung cụ thể bạn muốn dịch.', 
                source: 'translation' 
            };
        }

        // Giả lập dịch
        const mockResult = this._mockTranslateText(cleanText);

        return {
            answer: `Bản dịch giả lập: **"${mockResult}"**`,
            detail: 'Lưu ý: Đây là bản dịch mô phỏng (Mock Translation) để minh họa kiến trúc. Trong thực tế, Agent này sẽ gọi API của Google Translate hoặc OpenAI để có kết quả chính xác.',
            source: 'translation',
            meta: []
        };
    },

    /**
     * Hàm giả lập dịch (Mock Translator).
     * Thực tế sẽ thay bằng lệnh fetch() tới API dịch thuật.
     */
    _mockTranslateText(text) {
        // Một số từ điển mini để tạo cảm giác "có dịch"
        const miniDict = {
            'truyện kiều': 'The Tale of Kieu',
            'nguyễn du': 'Nguyen Du',
            'chí phèo': 'Chi Pheo',
            'nam cao': 'Nam Cao',
            'tắt đèn': 'When the Light is Out',
            'ngô tất tố': 'Ngo Tat To',
            'số đỏ': 'Dumb Luck',
            'vũ trọng phụng': 'Vu Trong Phung',
            'lão hạc': 'Old Man Hac',
            'thơ mới': 'New Poetry',
            'văn học': 'Literature',
            'tác phẩm': 'Work',
            'tác giả': 'Author'
        };

        const lowerText = text.toLowerCase().trim();
        if (miniDict[lowerText]) return miniDict[lowerText];

        // Nếu không có trong từ điển, trả về dạng "Pseudo-English" (Thêm hậu tố)
        // Đây chỉ là cách để chứng minh luồng hoạt động.
        return `[Translated] ${text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    }
};
