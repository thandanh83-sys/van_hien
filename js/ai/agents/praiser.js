/**
 * ==========================================================
 * VĂN ĐẠO AI - PRAISER AGENT (js/ai/agents/praiser.js)
 * Vị trí: js/ai/agents/praiser.js
 * Version: 3.1.0 (Search Integration & Quick Highlight)
 * ==========================================================
 * TRIẾT LÝ:
 * - Lời khen không sáo rỗng, phải dựa trên nhịp Bằng/Trắc, vị trí và cảm xúc.
 * - [MỚI] Thêm hàm getQuickHighlight() phục vụ riêng cho chế độ Tìm kiếm
 *   (trả về câu nhận xét cực ngắn, không chạy phân tích sâu).
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';

export const PraiserAgent = {
    /**
     * Phân tích văn bản để tìm vẻ đẹp, điểm sáng (Dùng cho Pipeline).
     */
    analyze(text, title = '') {
        const ctx = LiteraryEngine.analyzeContext(text, title);

        if (!ctx.isValid) {
            return { theme: '', symbol: '', commentary: 'Chưa có đủ nội dung để cảm nhận vẻ đẹp của tác phẩm.' };
        }

        const { coreLine, context, prosody, rhyme } = ctx;
        const workName = title ? `tác phẩm "${title}"` : 'bài thơ';

        const openings = [
            `Khi đọc ${workName}, có một câu thơ khiến ta phải dừng lại suy ngẫm: <i>"${coreLine}"</i>.`,
            `Ấn tượng nhất ở ${context.positionText} là câu thơ <i>"${coreLine}"</i>.`,
            `Tác giả đã thực sự thăng hoa ở câu thơ <i>"${coreLine}"</i>.`
        ];
        const intro = openings[Math.floor(Math.random() * openings.length)];

        let rhythmComment = '';
        if (prosody.rhythmType === 'gentle') {
            rhythmComment = `Nhịp thơ êm ái, mang nặng thanh Bằng (${prosody.bang} Bằng / ${prosody.trac} Trắc), tựa như một lời ru nhẹ nhàng đưa ta vào cõi mộng.`;
        } else if (prosody.rhythmType === 'intense') {
            rhythmComment = `Nhịp thơ dồn dập với nhiều thanh Trắc (${prosody.trac} Trắc / ${prosody.bang} Bằng), tạo nên những đợt sóng lòng cuộn xiết, day dứt không nguôi.`;
        } else {
            rhythmComment = `Sự phối hợp nhịp nhàng giữa Bằng (${prosody.bang}) và Trắc (${prosody.trac}) đã tạo nên một nhạc điệu uyển chuyển, rất mực tài hoa.`;
        }

        let contextComment = '';
        if (context.prevLine && context.nextLine) {
            contextComment = `Đặt giữa câu trước <i>"${context.prevLine}"</i> và câu sau <i>"${context.nextLine}"</i>, câu thơ này như một nhịp cầu nối hoàn hảo.`;
        }

        let rhymeComment = '';
        if (rhyme.hasRhyme) {
            rhymeComment = `Đặc biệt, sự gieo vần (${rhyme.details}) đã làm cho câu thơ trở nên du dương.`;
        }

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
     * [MỚI] Trích xuất nhanh một câu khen ngắn gọn (Dùng cho Search).
     * Không chạy phân tích sâu, chỉ dựa vào metadata để trả về trong 1ms.
     * 
     * @param {Object} work - Object tác phẩm từ DataHub.
     * @returns {string} Câu nhận xét ngắn.
     */
    getQuickHighlight(work) {
        if (!work) return '';
        
        // Ưu tiên 1: Khen dựa trên Cảm xúc (cam_xuc)
        if (work.cam_xuc && work.cam_xuc.length > 0) {
            const moods = work.cam_xuc.join(', ');
            return `Tác phẩm mang đậm cảm xúc <i>${moods}</i>, rất đáng để chiêm nghiệm.`;
        }
        
        // Ưu tiên 2: Khen dựa trên Thể loại
        if (work.the_loai && work.the_loai.length > 0) {
            return `Một tác phẩm tiêu biểu cho thể loại <i>${work.the_loai[0]}</i> mà bạn không nên bỏ lỡ.`;
        }
        
        // Fallback: Dùng mô tả ngắn (desc)
        if (work.desc) {
            return `<i>"${work.desc}"</i>`;
        }

        return `Một áng văn hữu duyên dành cho bạn.`;
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
