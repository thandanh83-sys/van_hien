/**
 * VĂN ĐẠO - CONTEMPLATIVE ENGINE (js/ai/contemplative-engine.js)
 * Sinh câu hỏi chiêm nghiệm từ phân tích LiteraryEngine.
 */

import { LiteraryEngine } from './literary-engine.js';

export const ContemplativeEngine = {
    /**
     * Sinh câu hỏi chiêm nghiệm dựa trên văn bản
     * @param {string} text - Bài thơ cần phân tích
     * @param {Object} contemplativePrompts - Bộ câu hỏi từ JSON
     * @returns {Array} Mảng câu hỏi chiêm nghiệm
     */
    generate(text, contemplativePrompts = {}) {
        const ctx = LiteraryEngine.analyzeContext(text);
        if (!ctx.isValid) return [];

        const questions = [];
        const coreLine = ctx.coreLine;

        // 1. Câu hỏi về nhịp điệu (dựa trên prosody)
        if (ctx.prosody.rhythmType === 'gentle') {
            questions.push({
                dimension: 'nhac_dieu',
                quote: coreLine,
                question: `Câu thơ "**${coreLine}**" có nhịp êm ái. Bạn thử đọc chậm lại — nhịp ấy có khớp với cảm xúc Bạn muốn gửi gắm không?`
            });
        } else if (ctx.prosody.rhythmType === 'intense') {
            questions.push({
                dimension: 'nhac_dieu',
                quote: coreLine,
                question: `Câu thơ "**${coreLine}**" có nhịp dồn dập. Ta tự hỏi: nhịp nhanh ấy có đang làm cảm xúc vỡ ra, hay đang làm nó cô đọng lại?`
            });
        }

        // 2. Câu hỏi về vần điệu (dựa trên rhyme)
        if (ctx.rhyme.hasRhyme && ctx.rhyme.details) {
            questions.push({
                dimension: 'ham_suc',
                quote: coreLine,
                question: `Câu thơ "**${coreLine}**" có ${ctx.rhyme.details}. Bạn thử đọc to lên — âm vang ấy đang mở ra điều gì?`
            });
        }

        // 3. Câu hỏi chung từ bộ prompts (nếu có)
        Object.entries(contemplativePrompts).forEach(([key, dimension]) => {
            if (!dimension.questions || dimension.questions.length === 0) return;
            const randomQ = dimension.questions[Math.floor(Math.random() * dimension.questions.length)];
            questions.push({
                dimension: key,
                quote: null,
                question: randomQ
            });
        });

        return questions.slice(0, 4); // Tối đa 4 câu hỏi
    }
};
