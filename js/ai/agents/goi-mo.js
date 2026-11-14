/**
 * VĂN ĐẠO - GỢI MỞ AGENT (js/ai/agents/goi-mo.js)
 * Version: 4.0.0 (Contemplative — No Scoring)
 * ==========================================================
 * TRIẾT LÝ:
 * - Không chấm điểm. Không phán xét.
 * - Chỉ gợi mở: "Ta tự hỏi...", "Bạn thử xem..."
 * - Mỗi gợi mở phải gắn với câu thơ cụ thể (trích dẫn).
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';

export const GoiMoAgent = {
    analyze(text, title = '') {
        const ctx = LiteraryEngine.analyzeContext(text, title);
        if (!ctx.isValid) {
            return { commentary: 'Cần có nội dung cụ thể để ta cùng chiêm nghiệm.' };
        }

        const { coreLine, context, prosody } = ctx;
        const workName = title ? `bài thơ "${title}"` : 'bài thơ này';

        // KHÔNG dùng "dở", "tệ", "kém", "sai"
        // CHỈ dùng "Ta tự hỏi...", "Bạn thử xem...", "Có một gợi mở..."

        const openings = [
            `Ta có một gợi mở nho nhỏ cho ${workName}.`,
            `Đọc ${workName}, ta tự hỏi một điều...`,
            `Có một chiều sâu ta muốn cùng Bạn đào thêm ở ${workName}.`
        ];
        const intro = openings[Math.floor(Math.random() * openings.length)];

        // Gợi mở về nhịp điệu (không phán xét)
        let rhythmHint = '';
        if (prosody.rhythmType === 'gentle') {
            rhythmHint = `Câu thơ "**${coreLine}**" có nhiều thanh Bằng — tạo cảm giác êm đềm. Ta tự hỏi: cái êm ấy có đang nuôi dưỡng cảm xúc, hay đang làm nó chìm đi?`;
        } else if (prosody.rhythmType === 'intense') {
            rhythmHint = `Câu thơ "**${coreLine}**" có nhiều thanh Trắc — tạo nhịp dồn dập. Bạn thử đọc chậm lại: cái dồn dập ấy có phải là điều Bạn muốn gửi gắm?`;
        } else {
            rhythmHint = `Câu thơ "**${coreLine}**" có sự đan xen Bằng/Trắc hài hòa. Ta tự hỏi: sự hài hòa ấy có đang làm phẳng đi một cảm xúc nào không?`;
        }

        // Gợi mở về ngữ cảnh
        let contextHint = '';
        if (context.prevLine) {
            contextHint = ` Câu trước đó ("*${context.prevLine}*") và câu này có mối liên hệ. Bạn thử xem: nếu đảo thứ tự hai câu, mạch thơ có đổi không?`;
        } else if (context.nextLine) {
            contextHint = ` Câu tiếp theo ("*${context.nextLine}*") mở ra một hướng mới. Ta tự hỏi: hướng ấy có đang kéo cảm xúc đi xa quá không?`;
        }

        const endings = [
            `Đây chỉ là gợi mở. Bạn có thể giữ nguyên — vì đôi khi cái mơ hồ lại là cái hay.`,
            `Không có gì cần sửa. Chỉ là một phép thử để thấy rõ hơn điều Bạn đã viết.`,
            `Bạn thử ngẫm xem. Nếu thấy không cần đổi, thì đó cũng là một câu trả lời.`
        ];
        const outro = endings[Math.floor(Math.random() * endings.length)];

        return {
            theme: workName,
            symbol: coreLine.substring(0, 20) + '...',
            commentary: `${intro} ${rhythmHint}${contextHint} ${outro}`
        };
    },

    getQuickComment(work) {
        if (!work) return 'Cần thêm thời gian để cảm nhận trọn vẹn.';
        if (work.cam_xuc && work.cam_xuc.length > 0) {
            return `Cảm xúc <b>${work.cam_xuc[0]}</b> được khai thác. Ta tự hỏi: còn tầng cảm xúc nào phía sau chưa được chạm tới?`;
        }
        return 'Tác phẩm có ý vị riêng. Đọc chậm và ngẫm nghĩ sẽ thấy nhiều điều hơn.';
    }
};

// Auto-Registry
GoiMoAgent.agentInfo = {
    key: 'goi-mo',           // Đổi key: 'critic' → 'goi-mo'
    name: 'Gợi Mở AI',       // Đổi tên
    description: 'Chuyên trách gợi mở chiều sâu (không phán xét, không chấm điểm).',
    capabilities: {
        'open-depth': 'analyze'
    },
    canRead: ['work', 'symbol'],
    canDelegate: ['poetics'],
    intentPatterns: {
        'open-depth': ['goi mo', 'chieu sau', 'dao sau', 'mo rong', 'cam nhan sau']
    }
};
