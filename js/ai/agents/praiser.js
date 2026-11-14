/**
 * ==========================================================
 * VĂN ĐẠO AI - PRAISER AGENT (js/ai/agents/praiser.js)
 * Vị trí: js/ai/agents/praiser.js
 * Version: 3.0.0 (Literary Context & Soul Edition)
 * ==========================================================
 * TRIẾT LÝ:
 * - Sử dụng LiteraryEngine để tìm ra câu thơ thực sự, nhịp điệu và
 *   ngữ cảnh.
 * - Lời khen không sáo rỗng, phải dựa trên nhịp Bằng/Trắc và vị trí.
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
        const ctx = LiteraryEngine.analyzeContext(text, title);

        if (!ctx.isValid) {
            return { 
                theme: '', 
                symbol: '', 
                commentary: 'Chưa có đủ nội dung để cảm nhận vẻ đẹp của tác phẩm.' 
            };
        }

        const { coreLine, context, prosody, rhyme } = ctx;
        const workName = title ? `tác phẩm "${title}"` : 'bài thơ';

        // 1. Mở bài: Trích dẫn câu thơ trung tâm
        const openings = [
            `Khi đọc ${workName}, có một câu thơ khiến ta phải dừng lại suy ngẫm: <i>"${coreLine}"</i>.`,
            `Ấn tượng nhất ở ${context.positionText} là câu thơ <i>"${coreLine}"</i>.`,
            `Tác giả đã thực sự thăng hoa ở câu thơ <i>"${coreLine}"</i>.`
        ];
        const intro = openings[Math.floor(Math.random() * openings.length)];

        // 2. Thân bài: Phân tích Thanh điệu (Prosody)
        let rhythmComment = '';
        if (prosody.rhythmType === 'gentle') {
            rhythmComment = `Nhịp thơ êm ái, mang nặng thanh Bằng (${prosody.bang} Bằng / ${prosody.trac} Trắc), tựa như một lời ru nhẹ nhàng đưa ta vào cõi mộng.`;
        } else if (prosody.rhythmType === 'intense') {
            rhythmComment = `Nhịp thơ dồn dập với nhiều thanh Trắc (${prosody.trac} Trắc / ${prosody.bang} Bằng), tạo nên những đợt sóng lòng cuộn xiết, day dứt không nguôi.`;
        } else {
            rhythmComment = `Sự phối hợp nhịp nhàng giữa Bằng (${prosody.bang}) và Trắc (${prosody.trac}) đã tạo nên một nhạc điệu uyển chuyển, rất mực tài hoa.`;
        }

        // 3. Thân bài: Phân tích Ngữ cảnh (Context)
        let contextComment = '';
        if (context.prevLine && context.nextLine) {
            contextComment = `Đặt giữa câu trước <i>"${context.prevLine}"</i> và câu sau <i>"${context.nextLine}"</i>, câu thơ này như một nhịp cầu nối hoàn hảo, dẫn dắt cảm xúc đi từ bất ngờ này đến bất ngờ khác.`;
        } else if (context.prevLine) {
            contextComment = `Nối tiếp mạch cảm xúc từ câu trước <i>"${context.prevLine}"</i>, câu thơ này như một tiếng thở dài, một sự lắng đọng cần thiết.`;
        } else if (context.nextLine) {
            contextComment = `Mở đầu bằng <i>"${coreLine}"</i>, tác giả đã khéo léo đặt nền móng để dẫn dắt người đọc đến câu thơ tiếp theo.`;
        }

        // 4. Vần điệu (Rhyme)
        let rhymeComment = '';
        if (rhyme.hasRhyme) {
            rhymeComment = `Đặc biệt, sự gieo vần (${rhyme.details}) đã làm cho câu thơ trở nên du dương, dễ đi vào lòng người.`;
        }

        // 5. Kết bài
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
