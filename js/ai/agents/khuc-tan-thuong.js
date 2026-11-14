/**
 * ==========================================================
 * VĂN ĐẠO — KHÚC TÁN THƯỞNG AGENT
 * Vị trí: js/ai/agents/khuc-tan-thuong.js
 * Version: 4.0.0 (Contemplative Praise — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. KHÔNG CHẤM ĐIỂM (No Scoring):
 *    Đây là quy tắc vàng thứ 12 của Văn Đạo — "Mỗi bài thơ đều có
 *    hồn, nét đẹp riêng". Agent này KHÔNG cho điểm, KHÔNG xếp hạng.
 *    Nó chỉ "chỉ ra vẻ đẹp" — như người bạn chỉ cho ta thấy một
 *    vì sao trên trời đêm.
 *
 * 2. LUÔN TRÍCH DẪN (Always Quote):
 *    Mọi lời khen phải gắn với câu thơ cụ thể. Không được nói
 *    "bài thơ này rất hay" mà không chỉ ra hay ở đâu, vì sao.
 *    Đây là kỷ luật của sự cụ thể — chống lại sự sáo rỗng.
 *
 * 3. GIỌNG ĐIỆU "TA — BẠN":
 *    Không dùng "người dùng", "bạn đọc". Chỉ dùng "Ta" và "Bạn"
 *    — như hai người bạn cùng ngồi bên ấm trà, cùng ngắm một
 *    bài thơ.
 *
 * 4. KHÔNG PHÁN XÉT (No Judgment):
 *    Không dùng "hay nhất", "tuyệt vời nhất", "đỉnh cao". Chỉ
 *    dùng "có một nét đẹp ở...", "ta bị chạm ở...". Vì cái đẹp
 *    không có thứ bậc — nó chỉ có mặt.
 *
 * 5. TĨNH TẠI (Contemplative):
 *    Câu văn phải chậm, phải có chỗ thở. Không vội kết luận.
 *    Kết bài luôn mở ra một hướng mới — "đó là một góc nhìn,
 *    Bạn có thể thấy khác".
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v3.3.0: (tiền thân — PraiserAgent) Tán thưởng dựa trên nhịp điệu.
 * - v4.0.0: Đổi tên KhucTanThuongAgent, bỏ hoàn toàn ngôn ngữ
 *           đánh giá, thêm validation chống sáo rỗng, thêm
 *           fallback graceful cho edge cases.
 *
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';
import { escapeHTML } from '../../utils.js';

// ==========================================================
// PHẦN 1: AGENT CHÍNH
// ==========================================================

export const KhucTanThuongAgent = {

    // =================================================================
    // 1. HÀM XỬ LÝ CHÍNH (Main Method)
    // =================================================================
    /**
     * Phân tích văn bản và tìm vẻ đẹp.
     *
     * Hàm này SYNC (không async) để tương thích ngược với PraiserAgent cũ.
     * Khi cần mở rộng (gọi API, load file), có thể đổi thành async mà
     * không cần sửa master.js (vì master.js đã `await` sẵn).
     *
     * @param {string} text - Văn bản thô của bài thơ
     * @param {string} title - Tên bài thơ (tùy chọn)
     * @returns {Object} { theme, symbol, commentary, isValid }
     */
    analyze(text, title = '') {
        // -----------------------------------------------------------------
        // GUARD 1: Input rỗng hoặc không phải string
        // -----------------------------------------------------------------
        if (!text || typeof text !== 'string') {
            return this._getEmptyResult(title);
        }

        // -----------------------------------------------------------------
        // GUARD 2: Văn bản quá ngắn (dưới 10 ký tự có nghĩa)
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
            console.warn('[KHÚC-TÁN-THƯỞNG] LiteraryEngine lỗi:', err);
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
        // BƯỚC 3: Xây dựng lời bình (nhiều đoạn, ghép lại)
        // -----------------------------------------------------------------
        const parts = [];

        // 3.1. Mở bài — luôn trích dẫn câu thơ trung tâm
        parts.push(this._buildOpening(coreLine, prosody, workName));

        // 3.2. Nhận xét về nhịp điệu (Bằng/Trắc)
        parts.push(this._buildRhythmComment(coreLine, prosody));

        // 3.3. Nhận xét về ngữ cảnh (nếu có câu trước / câu sau)
        const contextComment = this._buildContextComment(context);
        if (contextComment) parts.push(contextComment);

        // 3.4. Nhận xét về vần điệu (nếu có)
        const rhymeComment = this._buildRhymeComment(rhyme, coreLine);
        if (rhymeComment) parts.push(rhymeComment);

        // 3.5. Kết bài — mở ra một hướng mới, không đóng lại
        parts.push(this._buildEnding());

        // -----------------------------------------------------------------
        // BƯỚC 4: Ghép lời bình và validate
        // -----------------------------------------------------------------
        const rawCommentary = parts.filter(Boolean).join(' ');
        const validated = this._validatePraise(rawCommentary, text);

        // -----------------------------------------------------------------
        // BƯỚC 5: Trả kết quả chuẩn (giữ tương thích với PraiserAgent cũ)
        // -----------------------------------------------------------------
        return {
            theme: workName,
            symbol: coreLine.substring(0, 30) + (coreLine.length > 30 ? '...' : ''),
            commentary: validated.commentary,
            isValid: validated.valid
        };
    },

    // =================================================================
    // 2. NHẬN XÉT SIÊU NGẮN (cho Bói Thơ / Fortune Modal)
    // =================================================================
    /**
     * Trả lời siêu ngắn (1-2 câu), dùng trong Fortune Modal.
     * Vì Modal đã có nhiều thông tin, không thể chèn lời bình dài.
     *
     * @param {Object} work - Object tác phẩm (từ DataHub)
     * @returns {string} Câu nhận xét ngắn, có HTML
     */
    getQuickComment(work) {
        // GUARD: Không có work
        if (!work || typeof work !== 'object') {
            return 'Một áng văn hữu duyên — cần thêm thời gian để cảm nhận.';
        }

        // Ưu tiên 1: Dựa trên cảm xúc (cam_xuc)
        if (Array.isArray(work.cam_xuc) && work.cam_xuc.length > 0) {
            const mood = escapeHTML(work.cam_xuc[0]);
            return `Áng văn này mang đậm cảm xúc <b>${mood}</b>. `
                 + `Đọc lên, ta thấy tâm hồn lắng lại — như có một làn gió nhẹ đi qua.`;
        }

        // Ưu tiên 2: Dựa trên thể loại (the_loai)
        if (Array.isArray(work.the_loai) && work.the_loai.length > 0) {
            const genre = escapeHTML(work.the_loai[0]);
            return `Một tác phẩm tiêu biểu của thể loại <b>${genre}</b>. `
                 + `Mỗi lần đọc lại, ta lại thấy một tầng nghĩa mới.`;
        }

        // Ưu tiên 3: Fallback — không có metadata
        return 'Nét đẹp của tác phẩm nằm ở sự chân thành và mộc mạc. '
             + 'Đôi khi, cái giản dị lại là cái ở lại lâu nhất.';
    },

    // =================================================================
    // 3. VALIDATE (Kiểm tra kỷ luật của sự tinh tế)
    // =================================================================
    /**
     * Kiểm tra lời bình có vi phạm kỷ luật không.
     *
     * Quy tắc:
     * 1. Không được dùng từ phán xét cay nghiệt (dở, tệ, kém...)
     * 2. Không được khen sáo rỗng mà không có trích dẫn
     * 3. Phải có ít nhất một câu thơ được trích dẫn (giữa dấu **)
     *
     * @private
     * @param {string} commentary - Lời bình cần kiểm tra
     * @param {string} originalText - Văn bản gốc
     * @returns {Object} { valid, commentary, reason? }
     */
    _validatePraise(commentary, originalText) {
        if (!commentary || typeof commentary !== 'string') {
            return {
                valid: false,
                commentary: 'Cần có nội dung cụ thể để ta cùng cảm nhận.',
                reason: 'empty_commentary'
            };
        }

        // -----------------------------------------------------------------
        // RULE 1: Không có từ phán xét cay nghiệt
        // -----------------------------------------------------------------
        const judgmentalWords = [
            'dở', 'tệ', 'kém', 'vụng', 'non tay', 'yếu',
            'tầm thường', 'vô nghĩa', 'nhạt nhẽo', 'rỗng tuếch',
            'thảm họa', 'tồi tệ', 'kém cỏi', 'thất bại'
        ];
        const lowerCommentary = commentary.toLowerCase();
        const foundJudgment = judgmentalWords.find(w =>
            lowerCommentary.includes(w)
        );
        if (foundJudgment) {
            console.warn(
                `[KHÚC-TÁN-THƯỞNG] Phát hiện từ phán xét: "${foundJudgment}". ` +
                `Đã tự động loại bỏ câu chứa từ này.`
            );
            // Loại bỏ câu chứa từ phán xét
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
        // RULE 2: Phải có trích dẫn cụ thể (giữa ** hoặc "...")
        // -----------------------------------------------------------------
        const hasQuote = /\*\*[^*]+\*\*|"[^"]{3,}"/.test(commentary);
        if (!hasQuote) {
            return {
                valid: false,
                commentary: commentary + ' (Lưu ý: lời bình cần gắn với câu thơ cụ thể.)',
                reason: 'no_specific_quote'
            };
        }

        // -----------------------------------------------------------------
        // RULE 3: Không được khen sáo rỗng mà không có trích dẫn
        // -----------------------------------------------------------------
        const emptyPhrases = [
            'rất hay', 'rất đẹp', 'tuyệt vời', 'xuất sắc',
            'đặc sắc', 'ấn tượng', 'sâu sắc', 'tinh tế'
        ];
        const hasEmptyPhrase = emptyPhrases.some(p =>
            lowerCommentary.includes(p)
        );
        if (hasEmptyPhrase && !hasQuote) {
            return {
                valid: false,
                commentary,
                reason: 'empty_praise_without_quote'
            };
        }

        // -----------------------------------------------------------------
        // PASS: Lời bình hợp lệ
        // -----------------------------------------------------------------
        return { valid: true, commentary };
    },

    // =================================================================
    // 4. CÁC HÀM XÂY DỰNG LỜI BÌNH (Builders)
    // =================================================================

    /**
     * Mở bài — luôn trích dẫn câu thơ trung tâm.
     * @private
     */
    _buildOpening(coreLine, prosody, workName) {
        const safeLine = escapeHTML(coreLine);

        const openings = [
            `Khi đọc ${workName}, ta dừng lại ở câu **"${safeLine}"**.`,
            `Ta bị chạm ở câu **"${safeLine}"** trong ${workName}.`,
            `Có một nét đẹp rất riêng ở câu **"${safeLine}"**.`,
            `Đọc đến câu **"${safeLine}"**, ta thấy lòng mình lắng lại.`,
            `Câu **"${safeLine}"** khiến ta phải đọc lại lần thứ hai.`
        ];

        return this._pick(openings);
    },

    /**
     * Nhận xét về nhịp điệu (Bằng/Trắc).
     * @private
     */
    _buildRhythmComment(coreLine, prosody) {
        if (!prosody || typeof prosody.total !== 'number' || prosody.total === 0) {
            return '';
        }

        const safeLine = escapeHTML(coreLine);

        if (prosody.rhythmType === 'gentle') {
            return this._pick([
                `Câu thơ có nhiều thanh Bằng, tạo cảm giác êm đềm như một lời ru. ` +
                `Ta tự hỏi: cái êm ấy có đang ru cả tâm hồn người đọc?`,

                `Nhịp thơ nhẹ như hơi thở. ` +
                `Đọc lên, ta thấy câu thơ không chỉ có âm thanh — nó có một sự tĩnh tại riêng.`,

                `Sự phối hợp Bằng/Trắc ở câu **"${safeLine}"** tạo nên một nhạc điệu dịu dàng. ` +
                `Đôi khi, cái dịu dàng lại là cái ở lại lâu nhất.`
            ]);
        }

        if (prosody.rhythmType === 'intense') {
            return this._pick([
                `Câu thơ có nhiều thanh Trắc, tạo nên những đợt sóng lòng cuộn xiết. ` +
                `Đọc lên, ta cảm nhận được cái dồn nén của cảm xúc.`,

                `Nhịp thơ dồn dập, như sóng vỗ vào bờ đá. ` +
                `Ta nghe được trong đó một điều gì muốn bật ra mà không thể.`,

                `Sự phối hợp Bằng/Trắc ở câu **"${safeLine}"** tạo nên một nhịp điệu mạnh mẽ. ` +
                `Có những cảm xúc chỉ có thể nói bằng nhịp điệu, không bằng lời.`
            ]);
        }

        // rhythmType === 'balanced'
        return this._pick([
            `Sự đan xen Bằng/Trắc ở câu **"${safeLine}"** tạo nên một nhạc điệu uyển chuyển. ` +
            `Đọc lên, ta thấy câu thơ có một nhịp điệu riêng — nhịp của tâm hồn.`,

            `Nhịp thơ cân bằng, như mặt hồ thu không gợn sóng. ` +
            `Có những cái đẹp không cần phải ồn ào — chỉ cần hiện diện.`,

            `Câu thơ có sự hòa phối Bằng/Trắc rất nhịp nhàng. ` +
            `Ta tự hỏi: sự cân bằng ấy có phải là điều tác giả muốn gửi gắm?`
        ]);
    },

    /**
     * Nhận xét về ngữ cảnh (câu trước / câu sau).
     * @private
     */
    _buildContextComment(context) {
        if (!context) return '';

        const hasPrev = context.prevLine && context.prevLine.trim().length > 0;
        const hasNext = context.nextLine && context.nextLine.trim().length > 0;

        if (hasPrev && hasNext) {
            const safePrev = escapeHTML(context.prevLine);
            const safeNext = escapeHTML(context.nextLine);
            return this._pick([
                `Đặt giữa câu trước **"${safePrev}"** và câu sau **"${safeNext}"**, ` +
                `câu thơ này như một nhịp cầu nối hoàn hảo.`,

                `Hai câu **"${safePrev}"** và **"${safeNext}"** bao quanh câu thơ trung tâm, ` +
                `như hai cánh tay nâng đỡ một viên ngọc.`
            ]);
        }

        if (hasNext) {
            const safeNext = escapeHTML(context.nextLine);
            return `Câu tiếp theo — **"${safeNext}"** — như nối dài thêm ý thơ. ` +
                   `Hai câu hòa quyện thành một chỉnh thể, không thể tách rời.`;
        }

        if (hasPrev) {
            const safePrev = escapeHTML(context.prevLine);
            return `Đặt câu này sau **"${safePrev}"**, ta thấy mạch thơ như được mở ra ` +
                   `một cách tự nhiên — như dòng suối chảy qua ghềnh đá.`;
        }

        return '';
    },

    /**
     * Nhận xét về vần điệu.
     * @private
     */
    _buildRhymeComment(rhyme, coreLine) {
        if (!rhyme || !rhyme.hasRhyme || !rhyme.details) {
            // Không có vần không phải là điều xấu — chỉ là thơ tự do
            return '';
        }

        const safeLine = escapeHTML(coreLine);
        const safeDetails = escapeHTML(rhyme.details);

        return this._pick([
            `Đặc biệt, câu thơ **"${safeLine}"** có ${safeDetails}. ` +
            `Sự gieo vần này không chỉ là kỹ thuật — nó làm cho câu thơ ngân vang, ` +
            `như tiếng chuông buông trong đêm tĩnh.`,

            `Ta chú ý đến cách gieo vần: ${safeDetails}. ` +
            `Vần điệu ấy làm câu thơ có một dư âm riêng, đọc lên thấy lòng mình lắng lại.`
        ]);
    },

    /**
     * Kết bài — mở ra hướng mới, không đóng lại.
     * @private
     */
    _buildEnding() {
        const endings = [
            `Những gì ta vừa nói chỉ là một góc nhìn. ` +
            `Mỗi người đọc sẽ thấy một vẻ đẹp khác — và đó chính là điều kỳ diệu của thơ.`,

            `Ta không dám nói đây là câu thơ hay nhất. ` +
            `Chỉ dám nói: nó đã chạm vào ta.`,

            `Có những câu thơ không cần phải hiểu hết. ` +
            `Chỉ cần đọc lên, và để nó ngân vang.`,

            `Đôi khi ta tự hỏi: liệu tác giả có biết mình đã tạo ra một nét đẹp như thế không? ` +
            `Có lẽ là không. Và đó lại càng làm cho nét đẹp ấy thêm quý.`,

            `Ta dừng lại ở đây. Nhưng bài thơ thì vẫn tiếp tục — trong lòng Bạn, ` +
            `trong những lần đọc sau, trong những người đọc khác.`,

            `Không có gì để thêm, không có gì để bớt. ` +
            `Chỉ là một khoảnh khắc đẹp, và ta muốn chia sẻ lại cùng Bạn.`
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
            commentary: 'Cần có nội dung cụ thể để ta cùng cảm nhận. ' +
                        'Mời Bạn nhập một bài thơ, và ta sẽ cùng ngắm.',
            isValid: false
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
            commentary: 'Bài thơ quá ngắn để ta có thể cảm nhận trọn vẹn. ' +
                        'Nhưng đôi khi, một câu thơ cũng đủ để mở ra cả một trời.',
            isValid: false
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
            commentary: 'Ta chưa thể cảm nhận được bài thơ này. ' +
                        'Có thể văn bản chưa đủ rõ, hoặc chưa đủ để ta dừng lại. ' +
                        'Mời Bạn thử lại với một bài thơ khác.',
            isValid: false
        };
    }
};

// ==========================================================
// PHẦN 2: AUTO-REGISTRY METADATA
// ==========================================================
/**
 * Metadata tự mô tả của KhucTanThuongAgent.
 *
 * Được đọc bởi AgentRegistry trong index.js để tự động đăng ký.
 * Key 'khuc-tan-thuong' THAY THẾ hoàn toàn 'praiser' cũ.
 *
 * LƯU Ý: Các file sau cần được cập nhật để dùng key mới:
 * - js/ai/master.js (dòng `AgentMap['praiser']`)
 * - js/ai/agents/fortune.js (dòng `PraiserAgent`)
 * - js/ai/agents/analysis.js (dòng `PraiserAgent`)
 */
KhucTanThuongAgent.agentInfo = {
    // ---- Định danh ----
    key: 'khuc-tan-thuong',
    name: 'Khúc Tán Thưởng AI',
    description: 'Chuyên trách tìm vẻ đẹp, ca ngợi tác phẩm (không chấm điểm).',

    // ---- Năng lực (task → method) ----
    capabilities: {
        'praise-work': 'analyze',        // "Khen bài thơ này", "Tìm vẻ đẹp"
        'quick-praise': 'getQuickComment' // Dùng cho Fortune Modal
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'symbol', 'author'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['poetics', 'literature'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'praise-work': [
            'khen', 'ca ngoi', 'praise', 'tan thuong',
            'dep', 'hay', 'net dep', 've dep',
            'diem sang', 'tuyet tac', 'xuat sac'
        ]
    }

    // ---- Không có specialDetector ----
    // (Vì đây là agent đơn giản, intent rõ ràng qua từ khóa)
};
