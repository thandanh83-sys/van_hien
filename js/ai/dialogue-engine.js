/**
 * ==========================================================
 * VĂN ĐẠO AI - DIALOGUE ENGINE (BỘ MÁY ĐỐI THOẠI)
 * Vị trí: js/ai/dialogue-engine.js
 * Version: 2.0.0 (Multi-Perspective Conversation)
 * ==========================================================
 * TRIẾT LÝ:
 * - Không chỉ hiển thị dữ liệu, mà biến nó thành một cuộc đối thoại.
 * - Tự động chọn lời dẫn (Intro) phù hợp với Nguồn (Source) của dữ liệu.
 * - Đặt câu hỏi gợi mở (Socratic Method) để người đọc tự chiêm nghiệm.
 * - [MỚI v2.0.0] Thêm lời dẫn đặc biệt cho "master-pipeline" (Hội đồng chuyên gia).
 * ==========================================================
 */

import { Identity } from './identity.js';
import { MemoryEngine } from './memory-engine.js';

export const DialogueEngine = {
    /**
     * Tạo lời dẫn nhập (Intro) dựa trên ngữ cảnh và bản sắc.
     * 
     * @param {string} source - Nguồn dữ liệu (VD: 'local-data', 'master-pipeline')
     * @param {boolean} hasContext - Có ngữ cảnh từ câu hỏi trước không
     * @returns {string} Lời dẫn HTML
     */
    generateIntro(source, hasContext) {
        if (hasContext) {
            return `Nhắc lại chuyện cũ, ${Identity.pronouns.self} lại nhớ...`;
        }

        const intros = {
            'local-data': `Càn khôn bao la, ${Identity.pronouns.self} xin góp đôi lời về điều ${Identity.pronouns.user} hỏi:`,
            'dictionary': `Ngôn từ là nhà của hiện hữu. Mời ${Identity.pronouns.user} cùng bóc tách:`,
            'analysis': `Đứng trước cái đẹp, ngôn từ đôi khi trở nên bất lực. Nhưng xin mượn lời:`,
            'master-pipeline': `Đứng trước một tác phẩm văn học, cái nhìn đơn chiều không bao giờ đủ. ${Identity.pronouns.self} đã triệu tập các chuyên gia để cùng chiêm nghiệm:`,
            'default': `${Identity.philosophy.knowledge} Mời ${Identity.pronouns.user} chiêm nghiệm:`
        };
        return intros[source] || intros['default'];
    },

    /**
     * Tạo câu hỏi gợi mở (Socratic Method) ở cuối câu trả lời.
     * 
     * @param {Object} result - Kết quả từ Agent (chứa source, meta, answer)
     * @returns {string} HTML câu hỏi
     */
    generateFollowUp(result) {
        // Nếu là câu trả lời lỗi, không hỏi
        if (result.source === 'error') return '';

        let contextType = 'default';
        
        // Nếu là Pipeline đa chiều, đặt câu hỏi sâu hơn
        if (result.source === 'master-pipeline') {
            contextType = 'analysis-deep';
        } 
        // Nếu có Meta List, dựa vào thực thể đầu tiên để xác định loại câu hỏi
        else if (result.meta && result.meta.length > 0) {
            const firstMeta = result.meta[0];
            if (String(firstMeta.id).startsWith('tac-gia')) contextType = 'author';
            else if (String(firstMeta.id).startsWith('quyen')) contextType = 'poetics';
            else contextType = 'work';
        } 
        else if (result.source === 'dictionary') {
            contextType = 'poetics';
        }

        const question = Identity.getSocraticQuestion(contextType);
        
        return `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed var(--border-color); font-style: italic; color: var(--text-muted); font-size: 0.95rem; display: flex; gap: 8px; align-items: flex-start;">
                <span style="color: var(--accent-gold); font-size: 1.2rem; line-height: 1;">${Identity.pronouns.self} hỏi:</span>
                <span>${question}</span>
            </div>
        `;
    },

    /**
     * Tạo lời kết (Outro) mang phong thái Văn Đạo.
     * 
     * @returns {string} Lời kết
     */
    generateOutro() {
        const outros = [
            Identity.philosophy.reasoning,
            Identity.philosophy.empathy,
            Identity.philosophy.humility,
            "Học để hiểu sâu hơn, không chỉ để biết nhiều hơn.",
            "Văn chương là tấm gương soi chiếu tâm hồn người đọc."
        ];
        return `— ${outros[Math.floor(Math.random() * outros.length)]} —`;
    },

    /**
     * Xử lý hội thoại hoàn chỉnh (Được gọi từ OutputAI).
     * 
     * @param {string} query - Câu hỏi của người dùng
     * @param {Object} result - Kết quả từ Agent
     * @returns {Object} { intro, followUp, outro }
     */
    processConversation(query, result) {
        // 1. Kiểm tra ngữ cảnh từ ký ức
        const context = MemoryEngine.resolveContext(query);
        const hasContext = !!context;
        
        // 2. Lưu vào ký ức (Memory Engine)
        MemoryEngine.saveTurn(query, result);

        // 3. Nếu AI không trả lời được, ghi nhận khoảng trống tri thức
        if (result.source === 'error' || (result.source === 'search-engine' && result.answer.includes('Không tìm thấy'))) {
            MemoryEngine.logKnowledgeGap(query);
        }

        // 4. Tạo các phần của câu trả lời
        return {
            intro: this.generateIntro(result.source, hasContext),
            followUp: this.generateFollowUp(result),
            outro: this.generateOutro()
        };
    }
};
