/**
 * ==========================================================
 * VĂN ĐẠO — INSIGHT VALIDATOR
 * Vị trí: js/ai/validators/insight-validator.js
 * Version: 1.1.0 (Contemplative Discipline — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. KỶ LUẬT CỦA SỰ TINH TẾ (Discipline of Subtlety):
 *    Validator này KHÔNG CHẤM ĐIỂM. Nó chỉ kiểm tra:
 *      - Insight có bịa dẫn chứng không?
 *      - Insight có phán xét cay nghiệt không?
 *      - Insight có khen sáo rỗng không?
 *    Đó là ba trụ cột của sự tinh tế.
 *
 * 2. KHÔNG BAO GIỜ TỪ CHỐI HOÀN TOÀN (Never Reject Fully):
 *    Validator trả về `{ valid, reason, suggestion }` để caller
 *    biết cần sửa gì. Nó không ném lỗi (throw) — vì Văn Đạo
 *    không phá vỡ dòng chảy chiêm nghiệm.
 *
 * 3. TỰ CHỨA (Self-Contained):
 *    Không import gì từ bên ngoài. Pure JS. Chạy được cả trong
 *    browser lẫn Node.js (cho test).
 *
 * 4. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
 *    Cung cấp cả 3 method riêng lẻ (validateEvidence,
 *    validateTone, validateSpecificity) và 1 method tổng hợp
 *    (validate) để caller linh hoạt sử dụng.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.0.0: 3 method riêng lẻ + 1 method tổng hợp.
 * - v1.1.0: Thêm `suggestion` cho mỗi lỗi, thêm `validateBatch`
 *           để kiểm tra nhiều insights cùng lúc, chuẩn hóa
 *           normalizeText nội bộ.
 *
 * ==========================================================
 */

// ==========================================================
// PHẦN 1: HẰNG SỐ NỘI BỘ
// ==========================================================

/**
 * Danh sách từ phán xét cay nghiệt.
 * Nếu insight chứa bất kỳ từ nào trong đây → không hợp lệ.
 */
const JUDGMENTAL_WORDS = Object.freeze([
    'dở', 'tệ', 'kém', 'vụng', 'non tay', 'yếu',
    'tầm thường', 'vô nghĩa', 'nhạt nhẽo', 'rỗng tuếch',
    'thảm họa', 'tồi tệ', 'kém cỏi', 'thất bại',
    'sai', 'hỏng', 'vô vị', 'buồn chán'
]);

/**
 * Danh sách cụm từ khen sáo rỗng.
 * Nếu insight chứa cụm này MÀ KHÔNG có quote → không hợp lệ.
 */
const EMPTY_PRAISE_PHRASES = Object.freeze([
    'rất hay', 'rất đẹp', 'tuyệt vời', 'xuất sắc',
    'đặc sắc', 'ấn tượng', 'sâu sắc', 'tinh tế',
    'đỉnh cao', 'hoàn hảo', 'vô cùng hay', 'quá tuyệt'
]);

/**
 * Danh sách cụm từ gợi mở (khuyến khích dùng).
 * Nếu insight chứa cụm này → đánh dấu là "contemplative".
 */
const CONTEMPLATIVE_PHRASES = Object.freeze([
    'ta tự hỏi', 'bạn thử', 'có một gợi mở',
    'có thể', 'đôi khi', 'ta thấy', 'ta nghĩ',
    'bạn có thể', 'thử xem', 'ngẫm xem'
]);

// ==========================================================
// PHẦN 2: HELPER NỘI BỘ
// ==========================================================

/**
 * Chuẩn hóa văn bản để so sánh (lowercase, gộp khoảng trắng).
 * Không xóa dấu — vì tiếng Việt có dấu quan trọng.
 *
 * @private
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Kiểm tra một chuỗi có chứa bất kỳ từ nào trong danh sách không.
 *
 * @private
 * @param {string} text
 * @param {string[]} words
 * @returns {string|null} Từ đầu tiên tìm thấy, hoặc null
 */
function findFirstWord(text, words) {
    if (!text || !Array.isArray(words)) return null;
    const normalized = normalizeText(text);
    for (const word of words) {
        const w = normalizeText(word);
        if (w && normalized.includes(w)) return word;
    }
    return null;
}

/**
 * Trích xuất quote từ insight.
 * Ưu tiên insight.quote trực tiếp, fallback trích từ content.
 *
 * @private
 * @param {Object} insight
 * @returns {string} Quote hoặc chuỗi rỗng
 */
function extractQuote(insight) {
    if (!insight || typeof insight !== 'object') return '';
    if (insight.quote && typeof insight.quote === 'string') return insight.quote.trim();

    // Fallback: tìm **...** hoặc "..." trong content
    const content = insight.content || '';
    const boldMatch = content.match(/\*\*([^*]+)\*\*/);
    if (boldMatch) return boldMatch[1].trim();

    const quoteMatch = content.match(/"([^"]{3,})"/);
    if (quoteMatch) return quoteMatch[1].trim();

    return '';
}

// ==========================================================
// PHẦN 3: INSIGHT VALIDATOR
// ==========================================================

export const InsightValidator = {

    // =================================================================
    // 1. validateEvidence — Chống bịa dẫn chứng
    // =================================================================
    /**
     * Kiểm tra trích dẫn có nằm trong văn bản gốc không.
     *
     * @param {Object} insight - { quote?, content? }
     * @param {string} originalText - Văn bản gốc
     * @returns {Object} { valid, reason?, suggestion? }
     */
    validateEvidence(insight, originalText) {
        // GUARD: insight không hợp lệ
        if (!insight || typeof insight !== 'object') {
            return {
                valid: false,
                reason: 'insight không hợp lệ (null hoặc không phải object).',
                suggestion: 'Truyền object có ít nhất trường content hoặc quote.'
            };
        }

        const quote = extractQuote(insight);

        // Nếu không có quote → bỏ qua (không bắt buộc mọi insight phải có quote)
        if (!quote) {
            return { valid: true };
        }

        // GUARD: originalText không hợp lệ
        if (!originalText || typeof originalText !== 'string') {
            return {
                valid: false,
                reason: `Có trích dẫn "${quote}" nhưng không có văn bản gốc để đối chiếu.`,
                suggestion: 'Cung cấp originalText để validator có thể kiểm chứng.'
            };
        }

        // So khớp (case-insensitive, gộp khoảng trắng)
        const normalizedOriginal = normalizeText(originalText);
        const normalizedQuote = normalizeText(quote);

        if (!normalizedOriginal.includes(normalizedQuote)) {
            return {
                valid: false,
                reason: `Trích dẫn "${quote}" không nằm trong văn bản gốc.`,
                suggestion: 'Chỉ trích dẫn những câu thực sự có trong bài. Không bịa đặt.'
            };
        }

        return { valid: true };
    },

    // =================================================================
    // 2. validateTone — Chống phán xét cay nghiệt
    // =================================================================
    /**
     * Kiểm tra giọng điệu có phán xét cay nghiệt không.
     *
     * @param {Object} insight - { content }
     * @returns {Object} { valid, reason?, suggestion?, foundWord? }
     */
    validateTone(insight) {
        // GUARD
        if (!insight || typeof insight !== 'object') {
            return {
                valid: false,
                reason: 'insight không hợp lệ (null hoặc không phải object).',
                suggestion: 'Truyền object có trường content.'
            };
        }

        const content = insight.content || '';
        if (!content.trim()) {
            // Content rỗng → không có gì để phán xét
            return { valid: true };
        }

        // Tìm từ phán xét đầu tiên
        const foundWord = findFirstWord(content, JUDGMENTAL_WORDS);

        if (foundWord) {
            return {
                valid: false,
                reason: `Dùng từ phán xét cay nghiệt: "${foundWord}".`,
                suggestion: 'Chuyển sang gợi mở: "Ta tự hỏi...", "Bạn thử xem...", "Có một hướng khác..."',
                foundWord
            };
        }

        return { valid: true };
    },

    // =================================================================
    // 3. validateSpecificity — Chống khen sáo rỗng
    // =================================================================
    /**
     * Kiểm tra lời khen có sáo rỗng không.
     *
     * Quy tắc: Nếu có cụm khen sáo rỗng MÀ KHÔNG có quote cụ thể → không hợp lệ.
     *
     * @param {Object} insight - { content, quote? }
     * @returns {Object} { valid, reason?, suggestion?, foundPhrase? }
     */
    validateSpecificity(insight) {
        // GUARD
        if (!insight || typeof insight !== 'object') {
            return {
                valid: false,
                reason: 'insight không hợp lệ (null hoặc không phải object).',
                suggestion: 'Truyền object có trường content.'
            };
        }

        const content = insight.content || '';
        if (!content.trim()) {
            return { valid: true };
        }

        // Tìm cụm khen sáo rỗng
        const foundPhrase = findFirstWord(content, EMPTY_PRAISE_PHRASES);

        // Nếu không có cụm sáo rỗng → OK
        if (!foundPhrase) {
            return { valid: true };
        }

        // Có cụm sáo rỗng — kiểm tra xem có quote kèm theo không
        const quote = extractQuote(insight);
        if (!quote) {
            return {
                valid: false,
                reason: `Dùng cụm khen sáo rỗng "${foundPhrase}" mà không có trích dẫn cụ thể.`,
                suggestion: `Thay "${foundPhrase}" bằng một nhận xét cụ thể gắn với câu thơ. Ví dụ: "Ta thấy đẹp ở câu **'...'** vì chữ '...' gợi..."`,
                foundPhrase
            };
        }

        // Có quote → OK (khen có căn cứ)
        return { valid: true };
    },

    // =================================================================
    // 4. validate — Kiểm tra tổng hợp
    // =================================================================
    /**
     * Kiểm tra insight qua cả 3 tiêu chí.
     *
     * @param {Object} insight - { content, quote? }
     * @param {string} originalText - Văn bản gốc (để kiểm chứng quote)
     * @returns {Object} {
     *   valid: boolean,
     *   failures: Array<{ criterion, reason, suggestion }>,
     *   isContemplative: boolean,
     *   hasQuote: boolean
     * }
     */
    validate(insight, originalText = '') {
        // GUARD
        if (!insight || typeof insight !== 'object') {
            return {
                valid: false,
                failures: [{
                    criterion: 'structure',
                    reason: 'insight không hợp lệ (null hoặc không phải object).',
                    suggestion: 'Truyền object có ít nhất trường content.'
                }],
                isContemplative: false,
                hasQuote: false
            };
        }

        const failures = [];

        // 1. Kiểm tra evidence
        const evidenceResult = this.validateEvidence(insight, originalText);
        if (!evidenceResult.valid) {
            failures.push({
                criterion: 'evidence',
                reason: evidenceResult.reason,
                suggestion: evidenceResult.suggestion
            });
        }

        // 2. Kiểm tra tone
        const toneResult = this.validateTone(insight);
        if (!toneResult.valid) {
            failures.push({
                criterion: 'tone',
                reason: toneResult.reason,
                suggestion: toneResult.suggestion
            });
        }

        // 3. Kiểm tra specificity
        const specificityResult = this.validateSpecificity(insight);
        if (!specificityResult.valid) {
            failures.push({
                criterion: 'specificity',
                reason: specificityResult.reason,
                suggestion: specificityResult.suggestion
            });
        }

        // 4. Đánh dấu isContemplative (khuyến khích dùng từ gợi mở)
        const content = insight.content || '';
        const hasContemplativePhrase = findFirstWord(content, CONTEMPLATIVE_PHRASES) !== null;

        // 5. Đánh dấu hasQuote
        const hasQuote = extractQuote(insight).length > 0;

        return {
            valid: failures.length === 0,
            failures,
            isContemplative: hasContemplativePhrase,
            hasQuote
        };
    },

    // =================================================================
    // 5. validateBatch — Kiểm tra nhiều insights cùng lúc
    // =================================================================
    /**
     * Kiểm tra một mảng insights và trả về kết quả tổng hợp.
     *
     * @param {Array<Object>} insights - Mảng insight cần kiểm tra
     * @param {string} originalText - Văn bản gốc
     * @returns {Object} {
     *   totalValid, totalInvalid, results: Array<...>
     * }
     */
    validateBatch(insights, originalText = '') {
        if (!Array.isArray(insights)) {
            return {
                totalValid: 0,
                totalInvalid: 0,
                results: [{
                    index: -1,
                    valid: false,
                    reason: 'insights không phải là mảng.'
                }]
            };
        }

        const results = insights.map((insight, index) => {
            const result = this.validate(insight, originalText);
            return {
                index,
                valid: result.valid,
                failures: result.failures,
                isContemplative: result.isContemplative,
                hasQuote: result.hasQuote,
                content: insight && insight.content ? insight.content.substring(0, 80) + '...' : ''
            };
        });

        const totalValid = results.filter(r => r.valid).length;

        return {
            totalValid,
            totalInvalid: results.length - totalValid,
            results
        };
    },

    // =================================================================
    // 6. getSummary — Tóm tắt kết quả (cho UI hiển thị)
    // =================================================================
    /**
     * Tạo tóm tắt dễ đọc từ kết quả validate.
     *
     * @param {Object} validationResult - Kết quả từ validate() hoặc validateBatch()
     * @returns {string} Tóm tắt dạng text
     */
    getSummary(validationResult) {
        if (!validationResult) return 'Không có kết quả để tóm tắt.';

        // Nếu là validateBatch
        if (typeof validationResult.totalValid === 'number') {
            const { totalValid, totalInvalid } = validationResult;
            if (totalInvalid === 0) {
                return `Tất cả ${totalValid} insights đều hợp lệ.`;
            }
            return `${totalValid}/${totalValid + totalInvalid} insights hợp lệ. ` +
                   `${totalInvalid} insights cần xem lại.`;
        }

        // Nếu là validate đơn lẻ
        if (validationResult.valid) {
            const tags = [];
            if (validationResult.isContemplative) tags.push('contemplative');
            if (validationResult.hasQuote) tags.push('có dẫn chứng');
            return tags.length > 0
                ? `Insight hợp lệ (${tags.join(', ')}).`
                : 'Insight hợp lệ.';
        }

        // Có lỗi
        const failureCount = validationResult.failures ? validationResult.failures.length : 0;
        const criteria = (validationResult.failures || [])
            .map(f => f.criterion)
            .join(', ');
        return `Insight chưa hợp lệ (${failureCount} lỗi: ${criteria}).`;
    }
};

// ==========================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// ==========================================================
/**
 * SAU KHI DÙNG insight-validator.js v1.1.0:
 *
 * 1. Import trong test:
 *    import { InsightValidator } from '../js/ai/validators/insight-validator.js';
 *
 * 2. Sử dụng trong code AI (ví dụ: output-ai.js, master.js):
 *    const check = InsightValidator.validate(insight, originalText);
 *    if (!check.valid) {
 *        console.warn('[INSIGHT] Không hợp lệ:', check.failures);
 *        // Có thể: yêu cầu agent sinh lại, hoặc fallback
 *    }
 *
 * 3. Sử dụng trong test:
 *    expect(InsightValidator.validateEvidence(
 *        { quote: 'Quạt giấy khép lại mùa thi' },
 *        'Quạt giấy khép lại mùa thi\nÁo dài bay giữa kinh kỳ sắc xuân'
 *    ).valid).toBe(true);
 *
 * 4. KHÔNG BAO GIỜ chấm điểm trong file này.
 *    Chỉ kiểm tra 3 trụ cột: evidence, tone, specificity.
 *
 * 5. Triết lý cốt lõi:
 *    - Không bịa dẫn chứng
 *    - Không phán xét cay nghiệt
 *    - Không khen sáo rỗng
 *    - Ưu tiên giọng gợi mở ("Ta tự hỏi...", "Bạn thử xem...")
 */
