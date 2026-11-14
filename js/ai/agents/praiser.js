/**
 * ==========================================================
 * VĂN ĐẠO AI - PRAISER AGENT (js/ai/agents/praiser.js)
 * Vị trí: js/ai/agents/praiser.js
 * Version: 2.0.0 (Literary Reasoning Integration)
 * ==========================================================
 * TRIẾT LÝ:
 * - Không khen chung chung.
 * - Sử dụng LiteraryEngine để bóc tách câu thơ, ngữ cảnh và nhịp điệu.
 * - Lời khen phải có căn cứ (dựa trên thanh điệu, vị trí câu thơ).
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';

export const PraiserAgent = {
    /**
     * Phân tích văn bản để tìm vẻ đẹp, điểm sáng.
     * 
     * @param {string} text - Văn bản cần phân tích.
     * @param {string} title - Tên tác phẩm (tùy chọn).
     * @returns {Object} { theme, symbol, commentary }
     */
    analyze(text, title = '') {
        // 1. Lấy gói ngữ cảnh từ Literary Engine
        const ctx = LiteraryEngine.analyzeContext(text);

        if (!ctx.isValid) {
            return { 
                theme: '', 
                symbol: '', 
                commentary: 'Chưa có đủ nội dung để cảm nhận vẻ đẹp của tác phẩm.' 
            };
        }

        const { coreLine, context, prosody } = ctx;
        const workName = title ? `tác phẩm "${title}"` : 'bài thơ';

        // 2. Xây dựng lời bình dựa trên dữ liệu thực tế
        const openings = [
            `Đọc ${workName}, ấn tượng đầu tiên đọng lại là câu thơ <i>"${coreLine}"</i>.`,
            `Chỉ qua một câu thơ <i>"${coreLine}"</i>, ta đã thấy được cái thần thái rất riêng của tác giả.`,
            `Câu thơ <i>"${coreLine}"</i> nằm ở ${context.positionText} như một viên ngọc sáng, thu hút mọi ánh nhìn.`
        ];
        const intro = openings[Math.floor(Math.random() * openings.length)];

        // 3. Phân tích nhịp điệu (Prosody)
        let rhythmComment = '';
        if (prosody.rhythmType === 'gentle') {
            rhythmComment = `Nhịp thơ êm ái, mang nặng thanh Bằng, tựa như một lời ru nhẹ nhàng đưa ta vào cõi mộng.`;
        } else if (prosody.rhythmType === 'intense') {
            rhythmComment = `Nhịp thơ dồn dập với nhiều thanh Trắc, tạo nên những đợt sóng lòng cuộn xiết, day dứt không nguôi.`;
        } else {
            rhythmComment = `Sự phối hợp nhịp nhàng giữa Bằng và Trắc đã tạo nên một nhạc điệu uyển chuyển, rất mực tài hoa.`;
        }

        // 4. Phân tích ngữ cảnh (Context)
        let contextComment = '';
        if (context.prevLine && context.nextLine) {
            contextComment = `Đặt trong mạch thơ, câu thơ này như một nhịp cầu nối. Từ câu trước <i>"${context.prevLine}"</i>, cảm xúc dâng trào và đọng lại ở đây, trước khi mở ra một không gian mới ở câu sau.`;
        } else if (context.prevLine) {
            contextComment = `Nối tiếp mạch cảm xúc từ câu trước <i>"${context.prevLine}"</i>, câu thơ này như một tiếng thở dài, một sự lắng đọng cần thiết.`;
        } else if (context.nextLine) {
            contextComment = `Mở đầu bằng <i>"${coreLine}"</i>, tác giả đã khéo léo đặt nền móng để dẫn dắt người đọc đến câu thơ tiếp theo.`;
        } else {
            contextComment = `Dù chỉ là một câu thơ độc lập, nó vẫn mang sức nặng của cả một tâm tình.`;
        }

        // 5. Lời kết
        const endings = [
            `Đây là một viên ngọc quý trong kho tàng văn học.`,
            `Sự kết hợp giữa hình ảnh và nhạc điệu đã tạo nên một dư vị khó phai.`,
            `Chắc chắn tác phẩm này sẽ còn sống mãi cùng năm tháng.`
        ];
        const outro = endings[Math.floor(Math.random() * endings.length)];

        // 6. Trả về kết quả
        return {
            theme: workName,
            symbol: coreLine.substring(0, 20) + '...',
            commentary: `${intro} ${rhythmComment} ${contextComment} ${outro}`
        };
    }
};

// =====================================================================
// AGENT INFO - Tự mô tả metadata cho Auto-Registry
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
