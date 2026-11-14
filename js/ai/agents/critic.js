/**
 * ==========================================================
 * VĂN ĐẠO AI - CRITIC AGENT (js/ai/agents/critic.js)
 * Vị trí: js/ai/agents/critic.js
 * Version: 3.0.0 (Literary Context & Soul Edition)
 * ==========================================================
 * TRIẾT LÝ:
 * - Phê bình có căn cứ, dựa trên sự đứt gãy nhịp điệu hoặc ngữ cảnh.
 * - Thái độ xây dựng, tôn trọng người viết.
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';

export const CriticAgent = {
    /**
     * Phân tích văn bản để tìm hạn chế, điểm cần cải thiện.
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
                commentary: 'Cần có nội dung cụ thể để đưa ra lời góp ý.' 
            };
        }

        const { coreLine, context, prosody, rhyme } = ctx;
        const workName = title ? `tác phẩm "${title}"` : 'bài thơ';

        // 1. Mở bài
        const openings = [
            `Dù ${workName} có nhiều nỗ lực, nhưng khi xét câu thơ <i>"${coreLine}"</i>, ta thấy vẫn còn những điểm cần bàn lại.`,
            `Xét riêng câu <i>"${coreLine}"</i> ở ${context.positionText}, tác giả dường như còn khá dè dặt.`,
            `Câu thơ <i>"${coreLine}"</i> cho thấy tác giả có ý tưởng, nhưng cách triển khai chưa thực sự thuyết phục.`
        ];
        const intro = openings[Math.floor(Math.random() * openings.length)];

        // 2. Phân tích Nhịp điệu (Prosody)
        let rhythmComment = '';
        if (prosody.rhythmType === 'gentle' && prosody.total > 5) {
            rhythmComment = `Việc lạm dụng quá nhiều thanh Bằng (${prosody.bang}) khiến câu thơ đôi chỗ trở nên đều đều, thiếu đi độ căng cần thiết của cảm xúc.`;
        } else if (prosody.rhythmType === 'intense') {
            rhythmComment = `Sự xuất hiện dày đặc của thanh Trắc (${prosody.trac}) làm cho nhịp thơ trở nên gấp gáp, đôi khi gây cảm giác nặng nề, khó đọc.`;
        } else {
            rhythmComment = `Nhịp điệu Bằng/Trắc tuy cân bằng nhưng lại thiếu đi những điểm nhấn đột phá để tạo dư vị.`;
        }

        // 3. Phân tích Ngữ cảnh (Context)
        let contextComment = '';
        if (context.prevLine) {
            contextComment = `Mối liên kết với câu trước <i>"${context.prevLine}"</i> còn khá lỏng lẻo. Sự chuyển ý đột ngột khiến mạch thơ bị ngắt quãng.`;
        } else if (context.nextLine) {
            contextComment = `Mở đầu bằng <i>"${coreLine}"</i> là một ý hay, nhưng mạch thơ sau đó (câu <i>"${context.nextLine}"</i>) chưa giữ được độ căng cần thiết.`;
        }

        // 4. Vần điệu (Rhyme)
        let rhymeComment = '';
        if (!rhyme.hasRhyme && context.nextLine) {
            rhymeComment = `Việc thiếu đi sự gieo vần với câu tiếp theo khiến câu thơ bị rời rạc, thiếu tính nhạc.`;
        }

        // 5. Kết bài
        const endings = [
            `Tác phẩm cần được gọt giũa thêm để có thể tỏa sáng.`,
            `Hy vọng tác giả sẽ có những bước tiến xa hơn trong các sáng tác sau.`,
            `Văn chương là sự tôi luyện. Hãy tiếp tục viết và trau chuốt hơn nữa.`
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
CriticAgent.agentInfo = {
    key: 'critic',
    name: 'Phê Bình AI',
    description: 'Chuyên trách chỉ ra hạn chế, thiếu sót.',
    capabilities: {
        'criticize-work': 'analyze'
    },
    canRead: ['work', 'symbol'],
    canDelegate: ['poetics'],
    intentPatterns: {
        'criticize-work': ['che', 'phe binh', 'criticize', 'han che', 'te', 'kem']
    }
};
