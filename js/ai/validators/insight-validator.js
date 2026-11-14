/**
 * ==========================================================
 * VĂN ĐẠO - INSIGHT VALIDATOR (js/ai/validators/insight-validator.js)
 * Version: 1.0.0
 * ==========================================================
 * TRIẾT LÝ:
 * - Không chấm điểm. Chỉ kiểm tra kỷ luật của sự tinh tế.
 * - Mọi nhận xét phải có căn cứ (trích dẫn cụ thể).
 * - Không được phán xét cay nghiệt.
 * - Không được khen sáo rỗng.
 * ==========================================================
 */

export const InsightValidator = {
    /**
     * Kiểm tra insight có bịa dẫn chứng không
     */
    validateEvidence(insight, originalText) {
        if (!insight.quote) return { valid: true };
        const normalizedOriginal = originalText.toLowerCase().replace(/\s+/g, ' ');
        const normalizedQuote = insight.quote.toLowerCase().replace(/\s+/g, ' ');
        if (!normalizedOriginal.includes(normalizedQuote)) {
            return {
                valid: false,
                reason: `Trích dẫn "${insight.quote}" không khớp văn bản gốc.`,
                suggestion: 'Yêu cầu AI chỉ trích dẫn từ văn bản đã cho.'
            };
        }
        return { valid: true };
    },

    /**
     * Kiểm tra giọng điệu có phán xét cay nghiệt không
     */
    validateTone(insight) {
        const judgmentalWords = [
            'dở', 'tệ', 'kém', 'vụng', 'non', 'yếu', 'sai', 'hỏng', 'thảm',
            'tầm thường', 'vô nghĩa', 'nhạt nhẽo', 'sáo rỗng', 'rỗng tuếch'
        ];
        const content = (insight.content || '').toLowerCase();
        const found = judgmentalWords.find(w => content.includes(w));
        if (found) {
            return {
                valid: false,
                reason: `Dùng từ phán xét cay nghiệt: "${found}".`,
                suggestion: 'Chuyển sang gợi mở: "Ta tự hỏi...", "Bạn thử xem..."'
            };
        }
        return { valid: true };
    },

    /**
     * Kiểm tra khen có sáo rỗng không
     */
    validateSpecificity(insight) {
        const emptyPhrases = [
            'rất hay', 'rất đẹp', 'tuyệt vời', 'xuất sắc', 'đặc sắc',
            'ấn tượng', 'sâu sắc', 'tinh tế'
        ];
        const content = (insight.content || '').toLowerCase();
        const hasEmpty = emptyPhrases.some(p => content.includes(p));
        if (hasEmpty && !insight.quote) {
            return {
                valid: false,
                reason: 'Khen sáo rỗng mà không có trích dẫn cụ thể.',
                suggestion: 'Phải gắn với câu thơ cụ thể: "Ta thấy đẹp ở câu X vì..."'
            };
        }
        return { valid: true };
    },

    /**
     * Kiểm tra tổng hợp
     */
    validate(insight, originalText) {
        const results = [
            this.validateEvidence(insight, originalText),
            this.validateTone(insight),
            this.validateSpecificity(insight)
        ];
        const failed = results.filter(r => !r.valid);
        return {
            valid: failed.length === 0,
            failures: failed
        };
    }
};
