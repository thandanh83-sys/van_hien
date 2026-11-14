/**
 * ==========================================================
 * VĂN ĐẠO AI - DIALOGUE ENGINE (ĐỐI THOẠI)
 * Vị trí: js/ai/dialogue-engine.js
 * Version: 1.0.0 (Context-Aware Conversation)
 * ==========================================================
 */

import { Identity } from './identity.js';
import { MemoryEngine } from './memory-engine.js';

export const DialogueEngine = {
    /**
     * Tạo lời dẫn nhập (Intro) dựa trên ngữ cảnh và bản sắc.
     */
    generateIntro(source, hasContext) {
        if (hasContext) {
            return `Nhắc lại chuyện cũ, ${Identity.pronouns.self} lại nhớ...`;
        }

        const intros = {
            'local-data': `Càn khôn bao la, ${Identity.pronouns.self} xin góp đôi lời về điều ${Identity.pronouns.user} hỏi:`,
            'dictionary': `Ngôn từ là nhà của hiện hữu. Mời ${Identity.pronouns.user} cùng bóc tách:`,
            'analysis': `Đứng trước cái đẹp, ngôn từ đôi khi trở nên bất lực. Nhưng xin mượn lời:`,
            'default': `${Identity.philosophy.knowledge} Mời ${Identity.pronouns.user} chiêm nghiệm:`
        };
        return intros[source] || intros['default'];
    },

    /**
     * Tạo câu hỏi gợi mở (Socratic Method) ở cuối câu trả lời.
     */
    generateFollowUp(result) {
        // Nếu là câu trả lời lỗi, không hỏi
        if (result.source === 'error') return '';

        let contextType = 'default';
        if (result.meta && result.meta.length > 0) {
            const firstMeta = result.meta[0];
            if (firstMeta.id.startsWith('tac-gia')) contextType = 'author';
            else if (firstMeta.id.startsWith('quyen')) contextType = 'poetics';
            else contextType = 'work';
        } else if (result.source === 'dictionary') {
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
     */
    generateOutro() {
        const outros = [
            Identity.philosophy.reasoning,
            Identity.philosophy.empathy,
            Identity.philosophy.humility,
            "Học để hiểu sâu hơn, không chỉ để biết nhiều hơn."
        ];
        return `— ${outros[Math.floor(Math.random() * outros.length)]} —`;
    },

    /**
     * Xử lý hội thoại hoàn chỉnh (Sẽ gọi từ OutputAI)
     */
    processConversation(query, result) {
        // 1. Kiểm tra ngữ cảnh
        const context = MemoryEngine.resolveContext(query);
        const hasContext = !!context;
        
        // 2. Lưu vào ký ức
        MemoryEngine.saveTurn(query, result);

        // 3. Nếu AI không trả lời được, ghi nhận khoảng trống
        if (result.source === 'error' || result.source === 'search-engine' && result.answer.includes('Không tìm thấy')) {
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
