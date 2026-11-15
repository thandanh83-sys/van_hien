/**
 * ==========================================================
 * VĂN ĐẠO — CONTEMPLATIVE ENGINE (Bộ máy sinh câu hỏi chiêm nghiệm)
 * Vị trí: js/ai/contemplative-engine.js
 * Version: 1.1.0 (Contemplative Questions — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. SINH CÂU HỎI, KHÔNG CHẤM ĐIỂM (Questions, Not Scores):
 *    Đây là engine thay thế hoàn toàn rubric chấm điểm. Nó không
 *    cho điểm, không xếp hạng, không đánh giá. Nó chỉ sinh ra
 *    NHỮNG CÂU HỎI để người đọc tự hỏi mình.
 *
 * 2. KẾT HỢP HAI NGUỒN (Dual Source):
 *    - Nguồn 1: LiteraryEngine (phân tích cấu trúc — nhịp, vần).
 *      Sinh câu hỏi dựa trên dữ liệu THẬT của bài thơ.
 *    - Nguồn 2: Bộ câu hỏi trong data/contemplative-prompts.json.
 *      Sinh câu hỏi dựa trên các CHIỀU KÍCH phổ quát.
 *    Kết hợp cả hai để câu hỏi vừa cụ thể, vừa phong phú.
 *
 * 3. LUÔN CÓ QUOTE (Always Quoted When Possible):
 *    Câu hỏi dựa trên LiteraryEngine luôn có `quote` — là câu thơ
 *    trung tâm. Điều này giúp người đọc biết câu hỏi đang nói về
 *    phần nào của bài thơ.
 *
 * 4. GIỚI HẠN SỐ CÂU HỎI (Cap at 4-5):
 *    Sinh quá nhiều câu hỏi sẽ làm người đọc rối. Engine giới hạn
 *    tối đa 5 câu, ưu tiên câu hỏi cụ thể trước, câu hỏi phổ quát sau.
 *
 * 5. GRACEFUL DEGRADATION (Tự động hạ cấp):
 *    - Nếu không có văn bản → trả về mảng rỗng (không lỗi).
 *    - Nếu LiteraryEngine lỗi → chỉ dùng câu hỏi phổ quát.
 *    - Nếu không có prompts → chỉ dùng câu hỏi từ LiteraryEngine.
 *    - Nếu cả hai đều không có → trả về mảng rỗng (không lỗi).
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.0.0: Sinh câu hỏi từ prosody/rhyme + corpus.
 * - v1.1.0: Thêm nhiều chiều kích hơn (khong_gian, thoi_gian,
 *           tinh_thai), cải thiện randomness, thêm guard toàn diện,
 *           thêm metadata `dimension` cho mỗi câu hỏi.
 *
 * ==========================================================
 */

import { LiteraryEngine } from './literary-engine.js';

// ==========================================================
// PHẦN 1: HẰNG SỐ NỘI BỘ
// ==========================================================

/**
 * Số câu hỏi tối đa trả về.
 * Đủ để gợi mở, không quá nhiều gây rối.
 */
const MAX_QUESTIONS = 5;

/**
 * Số câu hỏi tối thiểu từ LiteraryEngine (nếu có dữ liệu).
 * Nếu có đủ dữ liệu cấu trúc, ưu tiên câu hỏi cụ thể.
 */
const MIN_STRUCTURAL_QUESTIONS = 2;

/**
 * Danh sách dimensions "ưu tiên" — luôn được chọn trước nếu có.
 * Các dimensions khác sẽ được chọn ngẫu nhiên.
 */
const PRIORITY_DIMENSIONS = Object.freeze([
    'hinh_tuong',
    'ham_suc',
    'dau_an',
    'chuyen_hoa'
]);

// ==========================================================
// PHẦN 2: HELPER NỘI BỘ
// ==========================================================

/**
 * Kiểm tra một giá trị có phải object không rỗng không.
 * @private
 */
function isNonEmptyObject(val) {
    return val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0;
}

/**
 * Kiểm tra một giá trị có phải mảng không rỗng không.
 * @private
 */
function isNonEmptyArray(val) {
    return Array.isArray(val) && val.length > 0;
}

/**
 * Chọn ngẫu nhiên một phần tử từ mảng.
 * @private
 */
function pickRandom(arr) {
    if (!isNonEmptyArray(arr)) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Xáo trộn mảng (Fisher-Yates) — trả về mảng mới.
 * @private
 */
function shuffle(arr) {
    if (!Array.isArray(arr)) return [];
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Lấy danh sách dimensions từ prompts, ưu tiên priority dimensions.
 * @private
 */
function getPrioritizedDimensions(prompts) {
    if (!isNonEmptyObject(prompts)) return [];

    const allKeys = Object.keys(prompts).filter(key => {
        // Bỏ qua các key bắt đầu bằng "_" (metadata)
        if (key.startsWith('_')) return false;
        // Phải có questions là mảng không rỗng
        return isNonEmptyArray(prompts[key]?.questions);
    });

    const priority = allKeys.filter(k => PRIORITY_DIMENSIONS.includes(k));
    const others = allKeys.filter(k => !PRIORITY_DIMENSIONS.includes(k));

    return [...shuffle(priority), ...shuffle(others)];
}

// ==========================================================
// PHẦN 3: CONTEMPLATIVE ENGINE
// ==========================================================

export const ContemplativeEngine = {

    // =================================================================
    // 1. HÀM XỬ LÝ CHÍNH (Main Method)
    // =================================================================
    /**
     * Sinh câu hỏi chiêm nghiệm từ văn bản và bộ câu hỏi.
     *
     * @param {string} text - Bài thơ cần phân tích
     * @param {Object} prompts - Bộ câu hỏi (từ contemplative-prompts.json)
     * @returns {Array<Object>} Mảng câu hỏi, mỗi câu có:
     *   {
     *     dimension: string,    // Tên chiều kích (VD: 'hinh_tuong')
     *     quote: string|null,   // Câu thơ trích dẫn (nếu có)
     *     question: string      // Câu hỏi
     *   }
     */
    generate(text, prompts = {}) {
        // -----------------------------------------------------------------
        // GUARD 1: Văn bản không hợp lệ
        // -----------------------------------------------------------------
        if (!text || typeof text !== 'string') {
            return [];
        }

        const trimmed = text.trim();
        if (trimmed.length < 10) {
            return [];
        }

        // -----------------------------------------------------------------
        // BƯỚC 1: Phân tích văn bản qua LiteraryEngine
        // -----------------------------------------------------------------
        let ctx = null;
        try {
            ctx = LiteraryEngine.analyzeContext(text);
        } catch (err) {
            console.warn('[CONTEMPLATIVE] LiteraryEngine lỗi:', err);
            ctx = null;
        }

        // Nếu LiteraryEngine không phân tích được → chỉ dùng corpus
        if (!ctx || !ctx.isValid) {
            return this._generateFromCorpusOnly(prompts);
        }

        // -----------------------------------------------------------------
        // BƯỚC 2: Sinh câu hỏi từ cấu trúc (LiteraryEngine)
        // -----------------------------------------------------------------
        const structuralQuestions = this._generateFromStructure(ctx);

        // -----------------------------------------------------------------
        // BƯỚC 3: Sinh câu hỏi từ corpus (contemplative-prompts.json)
        // -----------------------------------------------------------------
        const corpusQuestions = this._generateFromCorpus(prompts, structuralQuestions.length);

        // -----------------------------------------------------------------
        // BƯỚC 4: Kết hợp và giới hạn số câu hỏi
        // -----------------------------------------------------------------
        // Ưu tiên câu hỏi cụ thể trước, câu hỏi phổ quát sau.
        // Nhưng nếu câu hỏi cụ thể quá nhiều, cắt bớt để cân bằng.
        const structuralCount = Math.max(
            MIN_STRUCTURAL_QUESTIONS,
            Math.min(structuralQuestions.length, MAX_QUESTIONS - 2)
        );
        const corpusCount = MAX_QUESTIONS - structuralCount;

        const selectedStructural = structuralQuestions.slice(0, structuralCount);
        const selectedCorpus = corpusQuestions.slice(0, corpusCount);

        // Trộn nhẹ để không phải lúc nào cũng theo thứ tự cố định
        return [...selectedStructural, ...selectedCorpus];
    },

    // =================================================================
    // 2. SINH CÂU HỎI TỪ CẤU TRÚC (LiteraryEngine)
    // =================================================================
    /**
     * Sinh câu hỏi dựa trên dữ liệu cấu trúc của bài thơ.
     *
     * @private
     * @param {Object} ctx - Context từ LiteraryEngine
     * @returns {Array<Object>} Mảng câu hỏi
     */
    _generateFromStructure(ctx) {
        const questions = [];

        // -----------------------------------------------------------------
        // 2.1. Câu hỏi về nhịp điệu (dựa trên prosody)
        // -----------------------------------------------------------------
        const rhythmQ = this._generateRhythmQuestion(ctx);
        if (rhythmQ) questions.push(rhythmQ);

        // -----------------------------------------------------------------
        // 2.2. Câu hỏi về vần điệu (dựa trên rhyme)
        // -----------------------------------------------------------------
        const rhymeQ = this._generateRhymeQuestion(ctx);
        if (rhymeQ) questions.push(rhymeQ);

        // -----------------------------------------------------------------
        // 2.3. Câu hỏi về ngữ cảnh (dựa trên prevLine / nextLine)
        // -----------------------------------------------------------------
        const contextQ = this._generateContextQuestion(ctx);
        if (contextQ) questions.push(contextQ);

        // -----------------------------------------------------------------
        // 2.4. Câu hỏi về tổng thể cấu trúc (nếu có đủ dữ liệu)
        // -----------------------------------------------------------------
        const overallQ = this._generateOverallQuestion(ctx);
        if (overallQ) questions.push(overallQ);

        return questions;
    },

    /**
     * Sinh câu hỏi về nhịp điệu.
     * @private
     */
    _generateRhythmQuestion(ctx) {
        const { coreLine, prosody } = ctx;
        if (!coreLine || !prosody || prosody.total === 0) return null;

        const safeQuote = coreLine;

        if (prosody.rhythmType === 'gentle') {
            return {
                dimension: 'nhac_dieu',
                quote: safeQuote,
                question: `Câu thơ "${safeQuote}" có nhịp êm ái (nhiều thanh Bằng). ` +
                          `Bạn thử đọc chậm lại — nhịp ấy có khớp với cảm xúc Bạn muốn gửi gắm không?`
            };
        }

        if (prosody.rhythmType === 'intense') {
            return {
                dimension: 'nhac_dieu',
                quote: safeQuote,
                question: `Câu thơ "${safeQuote}" có nhịp dồn dập (nhiều thanh Trắc). ` +
                          `Ta tự hỏi: nhịp nhanh ấy có đang làm cảm xúc vỡ ra, hay đang làm nó cô đọng lại?`
            };
        }

        // balanced
        return {
            dimension: 'nhac_dieu',
            quote: safeQuote,
            question: `Câu thơ "${safeQuote}" có sự đan xen Bằng/Trắc hài hòa. ` +
                      `Bạn thử xem: sự hài hòa ấy có đang làm phẳng đi một cảm xúc nào không?`
        };
    },

    /**
     * Sinh câu hỏi về vần điệu.
     * @private
     */
    _generateRhymeQuestion(ctx) {
        const { coreLine, rhyme } = ctx;
        if (!rhyme) return null;

        if (rhyme.hasRhyme && rhyme.details) {
            return {
                dimension: 'ham_suc',
                quote: coreLine,
                question: `Câu thơ "${coreLine}" có ${rhyme.details}. ` +
                          `Bạn thử đọc to lên — âm vang ấy đang mở ra điều gì?`
            };
        }

        // Không vần
        return {
            dimension: 'nhac_dieu',
            quote: coreLine,
            question: `Bài thơ không có vần rõ ràng. ` +
                      `Đó không phải là điều xấu — thơ tự do có cái hay riêng. ` +
                      `Ta tự hỏi: cái không vần ấy có đang phục vụ một ý tưởng nào không?`
        };
    },

    /**
     * Sinh câu hỏi về ngữ cảnh (câu trước / câu sau).
     * @private
     */
    _generateContextQuestion(ctx) {
        const { coreLine, context } = ctx;
        if (!context) return null;

        const hasPrev = context.prevLine && context.prevLine.trim().length > 0;
        const hasNext = context.nextLine && context.nextLine.trim().length > 0;

        if (hasPrev && hasNext) {
            return {
                dimension: 'boi_canh',
                quote: coreLine,
                question: `Câu thơ "${coreLine}" được đặt giữa câu trước và câu sau. ` +
                          `Bạn thử xem: nếu đảo thứ tự hai câu, mạch thơ có đổi không?`
            };
        }

        if (hasNext) {
            return {
                dimension: 'chuyen_hoa',
                quote: coreLine,
                question: `Câu tiếp theo (sau "${coreLine}") mở ra một hướng mới. ` +
                          `Ta tự hỏi: hướng ấy có đang kéo cảm xúc đi xa quá không?`
            };
        }

        return null;
    },

    /**
     * Sinh câu hỏi về tổng thể cấu trúc.
     * @private
     */
    _generateOverallQuestion(ctx) {
        const { totalLines, prosody } = ctx;
        if (!totalLines || totalLines < 2) return null;

        if (prosody && prosody.total >= 5) {
            return {
                dimension: 'tinh_thai',
                quote: null,
                question: `Bài thơ có ${totalLines} câu, với câu trung tâm khá dài. ` +
                          `Bạn thử đọc toàn bài một lần, rồi đọc lại chỉ câu trung tâm — ` +
                          `cảm xúc có đổi không?`
            };
        }

        return null;
    },

    // =================================================================
    // 3. SINH CÂU HỎI TỪ CORPUS (contemplative-prompts.json)
    // =================================================================
    /**
     * Sinh câu hỏi ngẫu nhiên từ bộ câu hỏi corpus.
     *
     * @private
     * @param {Object} prompts - Bộ câu hỏi
     * @param {number} alreadySelected - Số câu đã chọn từ cấu trúc
     * @returns {Array<Object>} Mảng câu hỏi
     */
    _generateFromCorpus(prompts, alreadySelected = 0) {
        // GUARD: Không có prompts
        if (!isNonEmptyObject(prompts)) return [];

        // Lấy danh sách dimensions ưu tiên
        const dimensions = getPrioritizedDimensions(prompts);
        if (dimensions.length === 0) return [];

        const questions = [];
        const maxFromCorpus = MAX_QUESTIONS - alreadySelected;

        for (const dimensionKey of dimensions) {
            if (questions.length >= maxFromCorpus) break;

            const dimension = prompts[dimensionKey];
            if (!dimension || !isNonEmptyArray(dimension.questions)) continue;

            // Chọn 1 câu hỏi ngẫu nhiên từ dimension này
            const question = pickRandom(dimension.questions);
            if (!question) continue;

            questions.push({
                dimension: dimensionKey,
                quote: null,
                question: question
            });
        }

        return questions;
    },

    // =================================================================
    // 4. FALLBACK: CHỈ DÙNG CORPUS KHI KHÔNG CÓ CẤU TRÚC
    // =================================================================
    /**
     * Khi LiteraryEngine không phân tích được, chỉ dùng corpus.
     *
     * @private
     * @param {Object} prompts - Bộ câu hỏi
     * @returns {Array<Object>} Mảng câu hỏi
     */
    _generateFromCorpusOnly(prompts) {
        return this._generateFromCorpus(prompts, 0);
    },

    // =================================================================
    // 5. HELPER CÔNG KHAI (Dùng cho test hoặc UI)
    // =================================================================
    /**
     * Lấy một câu hỏi ngẫu nhiên từ một dimension cụ thể.
     *
     * @param {Object} prompts - Bộ câu hỏi
     * @param {string} dimensionKey - Key của dimension (VD: 'hinh_tuong')
     * @returns {string|null} Câu hỏi hoặc null
     */
    getQuestionForDimension(prompts, dimensionKey) {
        if (!isNonEmptyObject(prompts) || !dimensionKey) return null;
        const dimension = prompts[dimensionKey];
        if (!dimension || !isNonEmptyArray(dimension.questions)) return null;
        return pickRandom(dimension.questions);
    },

    /**
     * Lấy danh sách tên các dimensions có sẵn.
     *
     * @param {Object} prompts - Bộ câu hỏi
     * @returns {Array<{ key: string, name: string }>}
     */
    listDimensions(prompts) {
        if (!isNonEmptyObject(prompts)) return [];

        return Object.keys(prompts)
            .filter(key => !key.startsWith('_'))
            .filter(key => isNonEmptyArray(prompts[key]?.questions))
            .map(key => ({
                key,
                name: prompts[key].name || key
            }));
    },

    /**
     * Đếm tổng số câu hỏi có trong corpus.
     *
     * @param {Object} prompts - Bộ câu hỏi
     * @returns {number}
     */
    countQuestions(prompts) {
        if (!isNonEmptyObject(prompts)) return 0;

        let total = 0;
        for (const key of Object.keys(prompts)) {
            if (key.startsWith('_')) continue;
            const dimension = prompts[key];
            if (dimension && isNonEmptyArray(dimension.questions)) {
                total += dimension.questions.length;
            }
        }
        return total;
    }
};

// ==========================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// ==========================================================
/**
 * SAU KHI DÙNG contemplative-engine.js v1.1.0:
 *
 * 1. Import trong main.js:
 *    const mod = await import('./ai/contemplative-engine.js');
 *    const questions = mod.ContemplativeEngine.generate(rawText, APP_DATA.CONTEMPLATIVE_PROMPTS);
 *
 * 2. Sử dụng trong test:
 *    import { ContemplativeEngine } from '../js/ai/contemplative-engine.js';
 *    const questions = ContemplativeEngine.generate('Quạt giấy khép lại mùa thi...', prompts);
 *    expect(questions.length).toBeLessThanOrEqual(5);
 *
 * 3. KHÔNG BAO GIỜ:
 *    - Thêm scoring/rubric vào file này.
 *    - Sinh quá 5 câu hỏi (gây rối).
 *    - Trả về câu hỏi có từ phán xét.
 *
 * 4. Triết lý cốt lõi:
 *    - Sinh câu hỏi, không sinh điểm số.
 *    - Câu hỏi phải gắn với văn bản (khi có thể).
 *    - Luôn có fallback graceful.
 */
