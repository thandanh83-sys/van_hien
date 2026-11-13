/**
 * ==========================================================
 * VĂN ĐẠO AI - CHARACTER AGENT (js/ai/agents/character.js)
 * Vị trí: js/ai/agents/character.js
 * Version: 1.0.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tìm kiếm thông tin về nhân vật văn học (Thúy Kiều, Chí Phèo, Tấm, Cám...).
 * - Xác định nhân vật xuất hiện trong tác phẩm nào.
 * - Sử dụng thuật toán quét văn bản (Text Scanning) trên kho dữ liệu hiện có.
 * 
 * TRIẾT LÝ:
 * - Không tự ý fetch dữ liệu. Mọi thứ đi qua DataHub/APP_DATA.
 * - Kết quả trả về phải có cấu trúc chuẩn (answer, detail, source, meta).
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { normalizeRouteText } from '../../utils.js';
import { DataHub } from '../../network/data-hub.js';

export const CharacterAgent = {
    // =================================================================
    // 1. HÀM XỬ LÝ CHÍNH (Được gọi từ MasterAI)
    // =================================================================
    /**
     * Lấy thông tin về một nhân vật văn học.
     * Câu hỏi: "Thúy Kiều là ai?", "Chí Phèo xuất hiện trong tác phẩm nào?"
     * 
     * @param {string} input - Tên nhân vật (VD: "Thúy Kiều")
     * @returns {Promise<Object>} Kết quả chuẩn (answer, detail, source, meta)
     */
    async getCharacterInfo(input) {
        if (!input) {
            return { 
                answer: 'Bạn muốn tìm hiểu về nhân vật nào?', 
                source: 'character' 
            };
        }

        // Bước 1: Làm sạch tên nhân vật (Loại bỏ các từ thừa)
        const cleanName = this._cleanCharacterName(input);
        if (!cleanName) {
            return { answer: 'Tên nhân vật không hợp lệ.', source: 'character' };
        }

        const normalizedQuery = normalizeRouteText(cleanName);

        // Bước 2: Quét trong kho Tác phẩm để tìm manh mối
        const findings = this._scanWorksForCharacter(normalizedQuery);

        if (findings.length === 0) {
            return this._handleNotFound(cleanName);
        }

        // Bước 3: Tổng hợp kết quả
        return this._synthesizeCharacterInfo(cleanName, findings);
    },

    // =================================================================
    // 2. CÁC HÀM HỖ TRỢ NỘI BỘ (PRIVATE METHODS)
    // =================================================================

    /**
     * Làm sạch tên nhân vật (VD: "nhân vật Thúy Kiều" -> "Thúy Kiều").
     */
    _cleanCharacterName(input) {
        return input
            .replace(/\b(nhân vật|nhan vat|ai là|ai la|cho tôi biết|thông tin về|về)\b/gi, '')
            .replace(/[?!.]/g, '')
            .trim();
    },

    /**
     * Quét toàn bộ kho Tác phẩm để tìm nhân vật.
     * Trả về mảng các tác phẩm có chứa tên nhân vật.
     */
    _scanWorksForCharacter(normalizedQuery) {
        const findings = [];

        for (const work of APP_DATA.WORKS_DATA) {
            let matched = false;
            let context = '';

            // 1. Kiểm tra xem tên nhân vật có nằm trong Tiêu đề tác phẩm không
            // (VD: "Chí Phèo" là tên tác phẩm)
            if (normalizeRouteText(work.title).includes(normalizedQuery)) {
                matched = true;
                context = `Tác phẩm "${work.title}" được lấy tên theo nhân vật chính.`;
            }

            // 2. Kiểm tra trong phần mô tả (desc)
            if (!matched && work.desc && normalizeRouteText(work.desc).includes(normalizedQuery)) {
                matched = true;
                context = `Nhân vật xuất hiện trong tác phẩm "${work.title}".`;
            }

            // 3. (Tùy chọn) Kiểm tra trong nội dung chi tiết nếu có thể (Cần fetch từ DataHub)
            // Để tối ưu hiệu năng, chúng ta tạm dừng ở đây. Nếu tìm thấy trong Tiêu đề hoặc Desc là đủ.

            if (matched) {
                findings.push({
                    work: work,
                    context: context
                });
            }
        }

        return findings;
    },

    /**
     * Tổng hợp thông tin nhân vật từ các manh mối tìm được.
     */
    _synthesizeCharacterInfo(characterName, findings) {
        const mainWork = findings[0].work;
        const otherWorks = findings.slice(1);

        let answer = `Nhân vật "${characterName}" là một hình tượng văn học đặc sắc. `;
        
        if (findings.length === 1) {
            answer += `Nhân vật này gắn liền với tác phẩm "${mainWork.title}" của tác giả ${mainWork.author}. `;
        } else {
            answer += `Nhân vật này xuất hiện trong ${findings.length} tác phẩm, tiêu biểu nhất là "${mainWork.title}". `;
        }

        // Thêm nhận xét văn chương
        answer += `Trong dòng chảy văn học, mỗi nhân vật đều mang một số phận, một tiếng lòng riêng. Để hiểu rõ hơn về "${characterName}", bạn có thể đọc trực tiếp tác phẩm hoặc sử dụng tính năng Phân tích.`;

        // Chuẩn bị Detail
        let detail = `Tác giả: ${mainWork.author}. Thời kỳ: ${mainWork.era || 'Không rõ'}.`;
        if (otherWorks.length > 0) {
            detail += ` Ngoài ra, tên nhân vật còn xuất hiện trong: ${otherWorks.map(w => w.title).join(', ')}.`;
        }

        // Chuẩn bị Meta (Các tác phẩm liên quan để UI render nút bấm)
        const metaList = findings.map(f => f.work);

        return {
            answer: answer,
            detail: detail,
            source: 'character',
            meta: metaList
        };
    },

    /**
     * Xử lý khi không tìm thấy nhân vật trong hệ thống.
     */
    _handleNotFound(characterName) {
        return {
            answer: `Kho tàng hiện tại chưa có dữ liệu chi tiết về nhân vật "${characterName}".`,
            detail: 'Văn Đạo liên tục được cập nhật. Bạn có thể thử tra cứu tên tác phẩm hoặc tác giả liên quan.',
            source: 'character',
            meta: []
        };
    }
};
