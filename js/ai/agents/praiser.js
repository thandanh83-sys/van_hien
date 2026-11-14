/**
 * ==========================================================
 * VĂN ĐẠO AI - PRAISER AGENT (js/ai/agents/praiser.js)
 * Vị trí: js/ai/agents/praiser.js
 * Version: 3.3.0 (Deep Poetic Expression)
 * ==========================================================
 * TRIẾT LÝ:
 * - Lời khen không sáo rỗng, phải dựa trên nhịp Bằng/Trắc và vị trí.
 * - [MỚI] Loại bỏ các con số kỹ thuật (1 Bằng / 0 Trắc) để câu văn 
 *   mượt mà, bay bổng và đậm chất chiêm nghiệm hơn.
 * - Thêm hàm getQuickComment() phục vụ riêng cho tính năng Bói thơ.
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';

export const PraiserAgent = {
    /**
     * Phân tích văn bản để tìm vẻ đẹp, điểm sáng (Dùng cho Pipeline).
     * 
     * @param {string} text - Văn bản thô
     * @param {string} title - Tên tác phẩm
     * @returns {Object} { theme, symbol, commentary }
     */
    analyze(text, title = '') {
        const ctx = LiteraryEngine.analyzeContext(text, title);

        if (!ctx.isValid) {
            return { theme: '', symbol: '', commentary: 'Chưa có đủ nội dung để cảm nhận vẻ đẹp của tác phẩm.' };
        }

        const { coreLine, context, prosody, rhyme } = ctx;
        const workName = title ? `tác phẩm "${title}"` : 'bài thơ';

        // 1. Lời dẫn (Mở bài)
        const openings = [
            `Khi đọc ${workName}, có một câu thơ khiến ta phải dừng lại suy ngẫm: <i>"${coreLine}"</i>.`,
            `Ấn tượng nhất ở ${context.positionText} là câu thơ <i>"${coreLine}"</i>.`,
            `Tác giả đã thực sự thăng hoa ở câu thơ <i>"${coreLine}"</i>.`
        ];
        const intro = openings[Math.floor(Math.random() * openings.length)];

        // 2. Nhận xét Nhịp điệu (Đã bỏ số liệu)
        let rhythmComment = '';
        if (prosody.rhythmType === 'gentle') {
            rhythmComment = `Nhịp thơ êm ái, mang nặng thanh Bằng, tựa như một lời ru nhẹ nhàng đưa ta vào cõi mộng.`;
        } else if (prosody.rhythmType === 'intense') {
            rhythmComment = `Nhịp thơ dồn dập với nhiều thanh Trắc, tạo nên những đợt sóng lòng cuộn xiết, day dứt không nguôi.`;
        } else {
            rhythmComment = `Sự phối hợp nhịp nhàng giữa Bằng và Trắc đã tạo nên một nhạc điệu uyển chuyển, rất mực tài hoa.`;
        }

        // 3. Nhận xét Ngữ cảnh
        let contextComment = '';
        if (context.prevLine && context.nextLine) {
            contextComment = `Đặt giữa câu trước <i>"${context.prevLine}"</i> và câu sau <i>"${context.nextLine}"</i>, câu thơ này như một nhịp cầu nối hoàn hảo.`;
        }

        // 4. Nhận xét Vần điệu (Đã bỏ chi tiết kỹ thuật)
        let rhymeComment = '';
        if (rhyme.hasRhyme) {
            rhymeComment = `Đặc biệt, sự gieo vần tinh tế đã làm cho câu thơ trở nên du dương, dễ đi vào lòng người.`;
        }

        // 5. Lời kết
        const endings = [
            `Đây là một viên ngọc quý trong kho tàng văn học.`,
            `Sự kết hợp giữa hình ảnh và nhạc điệu đã tạo nên một dư vị khó phai.`,
            `Chắc chắn tác phẩm này sẽ còn sống mãi cùng năm tháng.`
        ];
        const outro = endings[Math.floor(Math.random() * endings.length)];

        return {
            theme: workName,
            symbol: coreLine.substring(0, 20) + '...',
            commentary: `${intro} ${rhythmComment} ${contextComment} ${rhymeComment} ${outro}`
        };
    },

    /**
     * Nhận xét siêu ngắn dành riêng cho Bói thơ (Fate Modal).
     * Dựa trên metadata (cam_xuc, the_loai) để trả về trong 1ms.
     * 
     * @param {Object} work - Object tác phẩm từ DataHub.
     * @returns {string} Câu nhận xét ngắn.
     */
    getQuickComment(work) {
        if (!work) return "Một áng văn hữu duyên.";
        
        if (work.cam_xuc && work.cam_xuc.length > 0) {
            return `Áng văn này mang đậm cảm xúc <b>${work.cam_xuc[0]}</b>, đọc lên thấy tâm hồn lắng đọng lạ kỳ.`;
        }
        if (work.the_loai && work.the_loai.length > 0) {
            return `Một tác phẩm xuất sắc của thể loại <b>${work.the_loai[0]}</b>.`;
        }
        return "Nét đẹp của tác phẩm nằm ở sự chân thành và mộc mạc.";
    }
};

// =====================================================================
// AGENT INFO
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
