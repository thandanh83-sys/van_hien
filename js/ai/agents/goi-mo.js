/**
 * ==========================================================
 * VĂN ĐẠO — LỜI GỢI MỞ AGENT
 * Vị trí: js/ai/agents/goi-mo.js
 * Version: 4.1.0 (Contemplative Open-Depth — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. GỢI MỞ, KHÔNG PHÁN XÉT (Open, Don't Judge):
 *    Agent này THAY THẾ CriticAgent cũ. Nó không "phê bình" —
 *    nó "mở ra một chiều sâu mới". Như người bạn chỉ cho ta
 *    thấy một lối nhỏ mà ta chưa từng để ý.
 *
 * 2. KHÔNG CHẤM ĐIỂM (No Scoring):
 *    Tuân thủ Quy tắc vàng 12. Không có điểm số, không xếp hạng.
 *    Chỉ có câu hỏi gợi mở và những quan sát tinh tế.
 *
 * 3. GIỌNG ĐIỆU "TA TỰ HỎI..." (Socratic Method):
 *    Không nói "câu này sai", "chỗ này dở". Chỉ nói:
 *    "Ta tự hỏi...", "Bạn thử xem...", "Có một hướng khác...".
 *    Để người đọc tự quyết định.
 *
 * 4. LUÔN GẮN VỚI CÂU THƠ CỤ THỂ (Always Grounded):
 *    Mọi gợi mở phải gắn với một câu thơ cụ thể trong bài.
 *    Không nói "bài thơ này có thể sâu hơn" — phải chỉ ra
 *    "câu X có thể mở ra hướng Y".
 *
 * 5. TÔN TRỌNG SỰ LỰA CHỌN CỦA TÁC GIẢ (Respect Author's Choice):
 *    Mỗi gợi mở đều kết thúc bằng một lựa chọn:
 *    "Bạn có thể giữ nguyên — vì đôi khi cái mơ hồ lại là cái hay."
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v3.3.0: (tiền thân — CriticAgent) Phê bình dựa trên nhịp điệu.
 * - v4.0.0: Đổi tên GoiMoAgent, bỏ ngôn ngữ phán xét, thêm
 *           validation chống cay nghiệt, thêm fallback graceful.
 * - v4.1.0: Chuẩn hóa escapeHTML cho mọi trường, thêm builder
 *           `_buildContrastiveOpen` (gợi mở tương phản), cải thiện
 *           validation, thêm metadata `evidence.quote` cho
 *           InsightValidator có thể kiểm chứng.
 *
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';
import { escapeHTML } from '../../utils.js';

// ==========================================================
// PHẦN 1: AGENT CHÍNH
// ==========================================================

export const GoiMoAgent = {

    // =================================================================
    // 1. HÀM XỬ LÝ CHÍNH (Main Method)
    // =================================================================
    /**
     * Phân tích văn bản và gợi mở chiều sâu.
     *
     * Hàm này SYNC (không async) để tương thích ngược với CriticAgent cũ.
     *
     * @param {string} text - Văn bản thô của bài thơ
     * @param {string} title - Tên bài thơ (tùy chọn)
     * @returns {Object} {
     *   theme, symbol, commentary, isValid,
     *   evidence: { coreLine, quote, positionText }
     * }
     */
    analyze(text, title = '') {
        // -----------------------------------------------------------------
        // GUARD 1: Input rỗng hoặc không phải string
        // -----------------------------------------------------------------
        if (!text || typeof text !== 'string') {
            return this._getEmptyResult(title);
        }

        // -----------------------------------------------------------------
        // GUARD 2: Văn bản quá ngắn
        // -----------------------------------------------------------------
        const trimmed = text.trim();
        if (trimmed.length < 10) {
            return this._getShortResult(title);
        }

        // -----------------------------------------------------------------
        // BƯỚC 1: Phân tích ngữ cảnh qua LiteraryEngine
        // -----------------------------------------------------------------
        let ctx;
        try {
            ctx = LiteraryEngine.analyzeContext(text, title);
        } catch (err) {
            console.warn('[GOI-MO] LiteraryEngine lỗi:', err);
            return this._getInvalidResult(title);
        }

        if (!ctx || !ctx.isValid) {
            return this._getInvalidResult(title);
        }

        // -----------------------------------------------------------------
        // BƯỚC 2: Trích xuất các trường cần dùng
        // -----------------------------------------------------------------
        const { coreLine, context, prosody, rhyme } = ctx;
        const workName = title
            ? `bài thơ "${escapeHTML(title)}"`
            : 'bài thơ này';

        // -----------------------------------------------------------------
        // BƯỚC 3: Xây dựng lời gợi mở (nhiều đoạn, ghép lại)
        // -----------------------------------------------------------------
        const parts = [];

        // 3.1. Mở bài — mời gọi, không phán xét
        parts.push(this._buildOpening(coreLine, workName));

        // 3.2. Gợi mở về nhịp điệu (nếu có dữ liệu)
        const rhythmOpen = this._buildRhythmOpen(coreLine, prosody);
        if (rhythmOpen) parts.push(rhythmOpen);

        // 3.3. Gợi mở về ngữ cảnh (nếu có câu trước / câu sau)
        const contextOpen = this._buildContextOpen(context);
        if (contextOpen) parts.push(contextOpen);

        // 3.4. Gợi mở tương phản (thay thế từ, đổi trật tự)
        const contrastiveOpen = this._buildContrastiveOpen(coreLine);
        if (contrastiveOpen) parts.push(contrastiveOpen);

        // 3.5. Gợi mở về vần điệu (nếu có)
        const rhymeOpen = this._buildRhymeOpen(rhyme);
        if (rhymeOpen) parts.push(rhymeOpen);

        // 3.6. Kết bài — trả lại quyền lựa chọn cho tác giả
        parts.push(this._buildEnding());

        // -----------------------------------------------------------------
        // BƯỚC 4: Ghép lời gợi mở và validate
        // -----------------------------------------------------------------
        const rawCommentary = parts.filter(Boolean).join(' ');
        const validated = this._validateOpen(rawCommentary, text, coreLine);

        // -----------------------------------------------------------------
        // BƯỚC 5: Trả kết quả chuẩn (tương thích CriticAgent cũ)
        // -----------------------------------------------------------------
        return {
            theme: workName,
            symbol: coreLine.substring(0, 30) + (coreLine.length > 30 ? '...' : ''),
            commentary: validated.commentary,
            isValid: validated.valid,

            // [v4.1.0] Metadata cho InsightValidator
            evidence: {
                coreLine: coreLine,
                quote: coreLine,
                positionText: context.positionText || '',
                hasRhyme: !!(rhyme && rhyme.hasRhyme),
                rhythmType: prosody && prosody.rhythmType ? prosody.rhythmType : 'unknown'
            }
        };
    },

    // =================================================================
    // 2. NHẬN XÉT SIÊU NGẮN (cho Bói Thơ / Fortune Modal)
    // =================================================================
    /**
     * Trả lời siêu ngắn (1-2 câu), dùng trong Fortune Modal.
     *
     * @param {Object} work - Object tác phẩm (từ DataHub)
     * @returns {string} Câu gợi mở ngắn, có HTML
     */
    getQuickComment(work) {
        // GUARD: Không có work
        if (!work || typeof work !== 'object') {
            return 'Có một chiều sâu ta muốn cùng Bạn đào thêm, nhưng cần đọc chậm hơn.';
        }

        // Ưu tiên 1: Dựa trên cảm xúc (cam_xuc)
        if (Array.isArray(work.cam_xuc) && work.cam_xuc.length > 0) {
            const mood = escapeHTML(work.cam_xuc[0]);
            return `Cảm xúc <b>${mood}</b> được khai thác. `
                 + `Ta tự hỏi: còn tầng cảm xúc nào phía sau chưa được chạm tới?`;
        }

        // Ưu tiên 2: Dựa trên thể loại (the_loai)
        if (Array.isArray(work.the_loai) && work.the_loai.length > 0) {
            const genre = escapeHTML(work.the_loai[0]);
            return `Một tác phẩm của thể loại <b>${genre}</b>. `
                 + `Bạn thử đọc chậm lại — có chi tiết nào đang chờ được khám phá?`;
        }

        // Ưu tiên 3: Fallback
        return 'Tác phẩm có ý vị riêng. Đọc chậm và ngẫm nghĩ sẽ thấy nhiều điều hơn.';
    },

    // =================================================================
    // 3. VALIDATE (Kiểm tra kỷ luật của sự gợi mở)
    // =================================================================
    /**
     * Kiểm tra lời gợi mở có vi phạm kỷ luật không.
     *
     * Quy tắc:
     * 1. Không được dùng từ phán xét cay nghiệt (dở, tệ, kém...)
     * 2. Phải có trích dẫn cụ thể (giữa ** hoặc "...")
     * 3. Không được nói "cần sửa", "phải đổi" — chỉ "có thể", "thử xem"
     *
     * @private
     * @param {string} commentary - Lời gợi mở cần kiểm tra
     * @param {string} originalText - Văn bản gốc
     * @param {string} coreLine - Câu thơ trung tâm
     * @returns {Object} { valid, commentary, reason? }
     */
    _validateOpen(commentary, originalText, coreLine) {
        if (!commentary || typeof commentary !== 'string') {
            return {
                valid: false,
                commentary: 'Cần có nội dung cụ thể để ta cùng chiêm nghiệm.',
                reason: 'empty_commentary'
            };
        }

        // -----------------------------------------------------------------
        // RULE 1: Không có từ phán xét cay nghiệt
        // -----------------------------------------------------------------
        const judgmentalWords = [
            'dở', 'tệ', 'kém', 'vụng', 'non tay', 'yếu',
            'tầm thường', 'vô nghĩa', 'nhạt nhẽo', 'rỗng tuếch',
            'thảm họa', 'tồi tệ', 'kém cỏi', 'thất bại',
            'sai', 'hỏng', 'vô vị', 'buồn chán',
            'cần sửa', 'phải sửa', 'phải đổi', 'nên đổi'
        ];
        const lowerCommentary = commentary.toLowerCase();
        const foundJudgment = judgmentalWords.find(w =>
            lowerCommentary.includes(w)
        );
        if (foundJudgment) {
            console.warn(
                `[GOI-MO] Phát hiện từ phán xét: "${foundJudgment}". ` +
                `Đã tự động loại bỏ câu chứa từ này.`
            );
            const sentences = commentary.split(/(?<=[.!?])\s+/);
            const cleaned = sentences
                .filter(s => !judgmentalWords.some(w => s.toLowerCase().includes(w)))
                .join(' ');
            return {
                valid: cleaned.length > 20,
                commentary: cleaned,
                reason: 'judgmental_removed'
            };
        }

        // -----------------------------------------------------------------
        // RULE 2: Phải có trích dẫn cụ thể
        // -----------------------------------------------------------------
        const hasQuote = /\*\*[^*]+\*\*|"[^"]{3,}"/.test(commentary);
        if (!hasQuote) {
            const safeCoreLine = coreLine ? escapeHTML(coreLine) : '';
            const injected = safeCoreLine
                ? commentary + ` Nhìn lại câu **"${safeCoreLine}"**, ta tự hỏi...`
                : commentary + ' (Lưu ý: lời gợi mở cần gắn với câu thơ cụ thể.)';
            return {
                valid: true,
                commentary: injected,
                reason: 'quote_injected'
            };
        }

        // -----------------------------------------------------------------
        // RULE 3: Trích dẫn phải nằm trong văn bản gốc
        // -----------------------------------------------------------------
        const quoteMatch = commentary.match(/\*\*([^*]+)\*\*|"([^"]{3,})"/);
        if (quoteMatch) {
            const quote = quoteMatch[1] || quoteMatch[2];
            const normalizedOriginal = originalText.toLowerCase().replace(/\s+/g, ' ');
            const normalizedQuote = quote.toLowerCase().replace(/\s+/g, ' ');
            if (normalizedOriginal && !normalizedOriginal.includes(normalizedQuote)) {
                console.warn(
                    `[GOI-MO] Trích dẫn "${quote}" không khớp văn bản gốc.`
                );
            }
        }

        // -----------------------------------------------------------------
        // PASS
        // -----------------------------------------------------------------
        return { valid: true, commentary };
    },

    // =================================================================
    // 4. CÁC HÀM XÂY DỰNG LỜI GỢI MỞ (Builders)
    // =================================================================

    /**
     * Mở bài — mời gọi, không phán xét.
     * @private
     */
    _buildOpening(coreLine, workName) {
        const safeLine = escapeHTML(coreLine);

        const openings = [
            `Ta có một gợi mở nho nhỏ cho ${workName}.`,
            `Đọc ${workName}, ta tự hỏi một điều...`,
            `Có một chiều sâu ta muốn cùng Bạn đào thêm ở ${workName}.`,
            `Đứng trước câu **"${safeLine}"**, ta thấy có một hướng khác để ngắm.`,
            `Có một điều ta chưa chắc — và ta muốn cùng Bạn nghĩ tiếp.`,
            `Ta không dám nói mình đúng. Nhưng có một gợi mở...`
        ];

        return this._pick(openings);
    },

    /**
     * Gợi mở về nhịp điệu.
     * @private
     */
    _buildRhythmOpen(coreLine, prosody) {
        if (!prosody || typeof prosody.total !== 'number' || prosody.total === 0) {
            return '';
        }

        const safeLine = escapeHTML(coreLine);

        if (prosody.rhythmType === 'gentle') {
            return this._pick([
                `Câu thơ **"${safeLine}"** có nhiều thanh Bằng — tạo cảm giác êm đềm. ` +
                `Ta tự hỏi: cái êm ấy có đang nuôi dưỡng cảm xúc, hay đang làm nó chìm đi?`,

                `Nhịp thơ nhẹ như hơi thở. ` +
                `Bạn thử đọc to lên — cái nhẹ ấy có làm cảm xúc bay đi, hay đọng lại?`
            ]);
        }

        if (prosody.rhythmType === 'intense') {
            return this._pick([
                `Câu thơ **"${safeLine}"** có nhiều thanh Trắc — tạo nhịp dồn dập. ` +
                `Bạn thử đọc chậm lại: cái dồn dập ấy có phải là điều Bạn muốn gửi gắm?`,

                `Nhịp thơ mạnh, như sóng vỗ. ` +
                `Ta tự hỏi: nếu nhịp chậm lại một chút, cảm xúc có lắng sâu hơn không?`
            ]);
        }

        return this._pick([
            `Câu thơ **"${safeLine}"** có sự đan xen Bằng/Trắc hài hòa. ` +
            `Ta tự hỏi: sự hài hòa ấy có đang làm phẳng đi một cảm xúc nào không?`,

            `Nhịp thơ cân bằng. ` +
            `Có những cái đẹp không cần phải ồn ào — chỉ cần hiện diện. ` +
            `Nhưng đôi khi, một chút phá cách lại mở ra một trời mới.`
        ]);
    },

    /**
     * Gợi mở về ngữ cảnh (câu trước / câu sau).
     * @private
     */
    _buildContextOpen(context) {
        if (!context) return '';

        const hasPrev = context.prevLine && context.prevLine.trim().length > 0;
        const hasNext = context.nextLine && context.nextLine.trim().length > 0;

        if (hasPrev && hasNext) {
            const safePrev = escapeHTML(context.prevLine);
            const safeNext = escapeHTML(context.nextLine);
            return this._pick([
                `Đặt giữa câu **"${safePrev}"** và câu **"${safeNext}"**, ` +
                `câu thơ trung tâm như một nhịp cầu. ` +
                `Bạn thử xem: nếu đảo thứ tự hai câu, mạch thơ có đổi không?`,

                `Ba câu thơ liền nhau tạo thành một cụm. ` +
                `Ta tự hỏi: cụm này có đang phục vụ một ý lớn hơn không?`
            ]);
        }

        if (hasNext) {
            const safeNext = escapeHTML(context.nextLine);
            return `Câu tiếp theo — **"${safeNext}"** — mở ra một hướng mới. ` +
                   `Ta tự hỏi: hướng ấy có đang kéo cảm xúc đi xa quá không?`;
        }

        if (hasPrev) {
            const safePrev = escapeHTML(context.prevLine);
            return `Đặt câu này sau **"${safePrev}"**, ta thấy mạch thơ như được mở ra. ` +
                   `Bạn thử xem: câu này có đang gánh vác quá nhiều ý không?`;
        }

        return '';
    },

    /**
     * Gợi mở tương phản — thay từ, đổi trật tự.
     * @private
     */
    _buildContrastiveOpen(coreLine) {
        const safeLine = escapeHTML(coreLine);

        return this._pick([
            `Câu **"${safeLine}"** có một từ đắt. ` +
            `Bạn thử thay nó bằng một từ đồng nghĩa — cảm xúc có đổi không? ` +
            `Nếu có, thì từ ấy đang gánh một trọng lượng riêng.`,

            `Ta tự hỏi: nếu câu **"${safeLine}"** được viết lại với một trật tự khác, ` +
            `cảm xúc có đổi không? Đôi khi, sự đảo lộn lại làm sáng tỏ một điều gì.`,

            `Có một chữ trong câu **"${safeLine}"** làm ta dừng lại. ` +
            `Bạn thử bỏ chữ ấy đi — câu thơ có mất một cái gì không?`
        ]);
    },

    /**
     * Gợi mở về vần điệu.
     * @private
     */
    _buildRhymeOpen(rhyme) {
        if (!rhyme) return '';

        if (rhyme.hasRhyme && rhyme.details) {
            const safeDetails = escapeHTML(rhyme.details);
            return this._pick([
                `Bài thơ có ${safeDetails}. ` +
                `Bạn thử xem: vần ấy có đang hỗ trợ cảm xúc, hay chỉ là kỹ thuật?`,

                `Sự gieo vần ${safeDetails} tạo nên một dư âm. ` +
                `Ta tự hỏi: dư âm ấy có đang làm mờ đi một chi tiết nào không?`
            ]);
        }

        return this._pick([
            `Bài thơ không có vần rõ ràng. ` +
            `Đó không phải là điều xấu — thơ tự do có cái hay riêng của nó. ` +
            `Bạn thử xem: cái không vần ấy có đang phục vụ một ý tưởng nào không?`,

            `Không có vần điệu cố định. ` +
            `Ta tự hỏi: nếu thêm một vần nhẹ ở cuối câu, cảm xúc có đổi không?`
        ]);
    },

    /**
     * Kết bài — trả lại quyền lựa chọn cho tác giả.
     * @private
     */
    _buildEnding() {
        const endings = [
            `Đây chỉ là gợi mở. Bạn có thể giữ nguyên — vì đôi khi cái mơ hồ lại là cái hay.`,
            `Không có gì cần sửa. Chỉ là một phép thử để thấy rõ hơn điều Bạn đã viết.`,
            `Bạn thử ngẫm xem. Nếu thấy không cần đổi, thì đó cũng là một câu trả lời.`,
            `Ta không dám nói mình đúng. Mỗi người đọc có một cách cảm riêng.`,
            `Đôi khi, cái hay nằm ở chỗ ta không ngờ tới. Bạn có thể thấy khác ta.`,
            `Hãy để thời gian trả lời. Có những câu thơ chỉ chín sau nhiều năm.`,
            `Bạn là người viết. Bạn là người quyết định. Ta chỉ ở đây để cùng ngắm.`
        ];
        return this._pick(endings);
    },

    // =================================================================
    // 5. CÁC HÀM TIỆN ÍCH (Utilities)
    // =================================================================

    /**
     * Chọn ngẫu nhiên một phần tử từ mảng.
     * @private
     */
    _pick(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return '';
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * Fallback khi input rỗng.
     * @private
     */
    _getEmptyResult(title) {
        return {
            theme: title ? `bài thơ "${escapeHTML(title)}"` : 'bài thơ',
            symbol: '',
            commentary: 'Cần có nội dung cụ thể để ta cùng chiêm nghiệm. ' +
                        'Mời Bạn nhập một bài thơ, và ta sẽ cùng đào sâu.',
            isValid: false,
            evidence: { coreLine: '', quote: '', positionText: '', hasRhyme: false, rhythmType: 'unknown' }
        };
    },

    /**
     * Fallback khi văn bản quá ngắn.
     * @private
     */
    _getShortResult(title) {
        return {
            theme: title ? `bài thơ "${escapeHTML(title)}"` : 'bài thơ',
            symbol: '',
            commentary: 'Bài thơ quá ngắn để ta có thể gợi mở trọn vẹn. ' +
                        'Nhưng đôi khi, một câu thơ cũng đủ để mở ra cả một trời.',
            isValid: false,
            evidence: { coreLine: '', quote: '', positionText: '', hasRhyme: false, rhythmType: 'unknown' }
        };
    },

    /**
     * Fallback khi LiteraryEngine không phân tích được.
     * @private
     */
    _getInvalidResult(title) {
        return {
            theme: title ? `bài thơ "${escapeHTML(title)}"` : 'bài thơ',
            symbol: '',
            commentary: 'Ta chưa thể phân tích được bài thơ này. ' +
                        'Có thể văn bản chưa đủ rõ, hoặc chưa đủ để ta dừng lại. ' +
                        'Mời Bạn thử lại với một bài thơ khác.',
            isValid: false,
            evidence: { coreLine: '', quote: '', positionText: '', hasRhyme: false, rhythmType: 'unknown' }
        };
    }
};

// ==========================================================
// PHẦN 2: AUTO-REGISTRY METADATA
// ==========================================================

/**
 * Metadata tự mô tả của GoiMoAgent.
 *
 * Được đọc bởi AgentRegistry trong index.js để tự động đăng ký.
 * Key 'goi-mo' THAY THẾ hoàn toàn 'critic' cũ.
 *
 * LƯU Ý: Các file sau cần được cập nhật để dùng key mới:
 * - js/ai/master.js (dòng `AgentMap['critic']`)
 * - js/ai/agents/fortune.js (dòng `CriticAgent`)
 * - js/ai/agents/analysis.js (dòng `CriticAgent`)
 */
GoiMoAgent.agentInfo = {
    // ---- Định danh ----
    key: 'goi-mo',
    name: 'Lời Gợi Mở AI',
    description: 'Chuyên trách gợi mở chiều sâu (không phán xét, không chấm điểm).',

    // ---- Năng lực (task → method) ----
    capabilities: {
        'open-depth': 'analyze',           // "Gợi mở chiều sâu", "Đào sâu"
        'quick-open-depth': 'getQuickComment' // Dùng cho Fortune Modal
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'symbol', 'author'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['poetics', 'literature'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'open-depth': [
            'goi mo', 'chieu sau', 'dao sau', 'mo rong',
            'cam nhan sau', 'chiem nghiem', 'suy tu',
            'goi y', 'mo ra', 'khai mo'
        ]
    }

    // ---- Không có specialDetector ----
};
