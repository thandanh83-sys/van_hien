/**
 * ==========================================================
 * VĂN ĐẠO — ANALYSIS AGENT (Phân tích Thi pháp)
 * Vị trí: js/ai/agents/analysis.js
 * Version: 3.0.0 (Contemplative Analysis — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. PHÂN TÍCH, KHÔNG CHẤM ĐIỂM (Analyze, Don't Score):
 *    - AnalysisAgent bóc tách cấu trúc bài thơ qua LiteraryEngine
 *      (câu trung tâm, nhịp điệu Bằng/Trắc, vần điệu).
 *    - Kết hợp với 2 agents cảm thụ:
 *      + KhucTanThuongAgent → "Khúc Tán Thưởng" (chỉ ra vẻ đẹp)
 *      + GoiMoAgent         → "Lời Gợi Mở" (mở ra chiều sâu)
 *    - KHÔNG có trường điểm số, KHÔNG xếp hạng.
 *
 * 2. LUÔN CÓ CĂN CỨ (Always Grounded):
 *    - Phân tích dựa trên dữ liệu THẬT từ LiteraryEngine.
 *    - Không bịa đặt nhận xét chung chung.
 *
 * 3. FALLBACK GRACEFUL (Tự động hạ cấp):
 *    - Nếu LiteraryEngine lỗi → trả về thông báo nhẹ nhàng.
 *    - Nếu KhucTanThuongAgent/GoiMoAgent lỗi → dùng câu mặc định.
 *
 * 4. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
 *    - Giữ nguyên signature: analyzeWork(work) và AnalysisAgent.analyze(input).
 *    - Giữ nguyên cấu trúc return: { themes, commentaryText, evidence, strength }.
 *    - `main.js` cũ đọc `commentaryText` vẫn chạy.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v2.0.0: LiteraryEngine Integration (dùng PraiserAgent + CriticAgent).
 * - v3.0.0: Contemplative Analysis.
 *           - Import `KhucTanThuongAgent` + `GoiMoAgent` thay
 *             `PraiserAgent` + `CriticAgent`.
 *           - Đổi label "Điểm sáng" → "Khúc Tán Thưởng",
 *             "Điểm cần lưu ý" → "Lời Gợi Mở".
 *           - Thêm metadata `evidence` từ 2 agents cảm thụ.
 *           - Bỏ hoàn toàn ngôn ngữ chấm điểm.
 *
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';
import { KhucTanThuongAgent } from './khuc-tan-thuong.js';
import { GoiMoAgent }         from './goi-mo.js';
import { normalizeRouteText } from '../../utils.js';

// ==========================================================
// PHẦN 1: HẰNG SỐ NỘI BỘ
// ==========================================================

/**
 * Nhãn hiển thị cho 2 góc nhìn cảm thụ.
 * Dùng trong commentaryText để thống nhất ngôn ngữ.
 */
const LABELS = Object.freeze({
    praise: 'Khúc Tán Thưởng',
    goiMo:  'Lời Gợi Mở'
});

/**
 * Câu fallback khi agents lỗi hoặc không có dữ liệu.
 */
const FALLBACK = Object.freeze({
    praise: 'Cần thêm thời gian để cảm nhận trọn vẹn vẻ đẹp của bài thơ.',
    goiMo:  'Có một chiều sâu ta muốn cùng Bạn đào thêm, nhưng cần đọc chậm hơn.',
    noData: 'Chưa có đủ nội dung để phân tích chi tiết. Mời Bạn nhập một bài thơ — ta sẽ cùng ngắm.'
});

// ==========================================================
// PHẦN 2: HÀM PHÂN TÍCH CHÍNH (Dùng chung cho Agent và Facade)
// ==========================================================

/**
 * Phân tích một tác phẩm — trả về báo cáo đa chiều (KHÔNG chấm điểm).
 *
 * Cấu trúc báo cáo:
 *   1. Câu thơ trung tâm (từ LiteraryEngine)
 *   2. Nhận xét nhịp điệu (Bằng/Trắc)
 *   3. Khúc Tán Thưởng (từ KhucTanThuongAgent)
 *   4. Lời Gợi Mở (từ GoiMoAgent)
 *
 * @param {Object} work - Object tác phẩm
 *   {
 *     title, author, desc, description, content,
 *     the_loai, cam_xuc, era, ...
 *   }
 * @returns {Object} {
 *   themes: string[],           // Thể loại của tác phẩm
 *   commentaryText: string,     // Báo cáo đa chiều (HTML)
 *   evidence: { context, praise, goiMo }, // Metadata
 *   strength: 'Yếu'|'Vừa'|'Mạnh'
 * }
 */
export function analyzeWork(work = {}) {
    // -----------------------------------------------------------------
    // GUARD 1: work null/undefined
    // -----------------------------------------------------------------
    if (!work || typeof work !== 'object') {
        return {
            themes: [],
            commentaryText: FALLBACK.noData,
            evidence: {},
            strength: 'Yếu'
        };
    }

    // -----------------------------------------------------------------
    // BƯỚC 1: Gom văn bản để phân tích
    // -----------------------------------------------------------------
    const sourceText = [
        work.title,
        work.author,
        work.desc,
        work.description,
        work.content
    ].filter(Boolean).join('\n');

    // -----------------------------------------------------------------
    // GUARD 2: Văn bản quá ngắn
    // -----------------------------------------------------------------
    if (!sourceText || sourceText.trim().length < 10) {
        return {
            themes: work.the_loai || [],
            commentaryText: FALLBACK.noData,
            evidence: {},
            strength: 'Yếu'
        };
    }

    // -----------------------------------------------------------------
    // BƯỚC 2: Phân tích cấu trúc qua LiteraryEngine
    // -----------------------------------------------------------------
    let ctx = null;
    try {
        ctx = LiteraryEngine.analyzeContext(sourceText, work.title || '');
    } catch (err) {
        console.warn('[ANALYSIS] LiteraryEngine lỗi:', err);
        ctx = null;
    }

    // -----------------------------------------------------------------
    // BƯỚC 3: Lấy cảm thụ từ 2 agents mới
    // -----------------------------------------------------------------
    let praise = null;
    let goiMo = null;

    try {
        praise = KhucTanThuongAgent.analyze(sourceText, work.title || '');
    } catch (err) {
        console.warn('[ANALYSIS] KhucTanThuongAgent lỗi:', err);
        praise = { commentary: FALLBACK.praise, isValid: false, evidence: {} };
    }

    try {
        goiMo = GoiMoAgent.analyze(sourceText, work.title || '');
    } catch (err) {
        console.warn('[ANALYSIS] GoiMoAgent lỗi:', err);
        goiMo = { commentary: FALLBACK.goiMo, isValid: false, evidence: {} };
    }

    // Đảm bảo praise/goiMo luôn có commentary
    if (!praise || !praise.commentary) {
        praise = { commentary: FALLBACK.praise, isValid: false, evidence: {} };
    }
    if (!goiMo || !goiMo.commentary) {
        goiMo = { commentary: FALLBACK.goiMo, isValid: false, evidence: {} };
    }

    // -----------------------------------------------------------------
    // BƯỚC 4: Xây dựng báo cáo đa chiều
    // -----------------------------------------------------------------
    let commentaryText = '';

    if (ctx && ctx.isValid) {
        // 4.1. Mở bài — trích dẫn câu thơ trung tâm
        commentaryText = `Tác phẩm được phân tích dựa trên câu thơ trung tâm: `
            + `<i>"${ctx.coreLine}"</i> (nằm ở ${ctx.context.positionText}). `;

        // 4.2. Nhận xét nhịp điệu
        if (ctx.prosody.rhythmType === 'gentle') {
            commentaryText += `Nhịp thơ mang nhiều thanh Bằng, tạo cảm giác êm đềm, tĩnh tại. `;
        } else if (ctx.prosody.rhythmType === 'intense') {
            commentaryText += `Nhịp thơ dồn dập với nhiều thanh Trắc, thể hiện những cảm xúc mãnh liệt, trăn trở. `;
        } else {
            commentaryText += `Sự đan xen hài hòa giữa Bằng và Trắc tạo nên một nhạc điệu uyển chuyển. `;
        }

        // 4.3. Khúc Tán Thưởng (thay "Điểm sáng")
        commentaryText += `<br><br><b>${LABELS.praise}:</b> ${praise.commentary}`;

        // 4.4. Lời Gợi Mở (thay "Điểm cần lưu ý")
        commentaryText += `<br><br><b>${LABELS.goiMo}:</b> ${goiMo.commentary}`;
    } else {
        // Không phân tích được cấu trúc → chỉ dùng 2 góc nhìn
        commentaryText = `<b>${LABELS.praise}:</b> ${praise.commentary}`;
        commentaryText += `<br><br><b>${LABELS.goiMo}:</b> ${goiMo.commentary}`;
    }

    // -----------------------------------------------------------------
    // BƯỚC 5: Đánh giá độ mạnh của tín hiệu
    // -----------------------------------------------------------------
    let strength = 'Vừa';
    if (ctx && ctx.isValid && ctx.prosody && ctx.prosody.total > 5) {
        strength = 'Mạnh';
    } else if (!ctx || !ctx.isValid) {
        strength = 'Yếu';
    }

    // -----------------------------------------------------------------
    // BƯỚC 6: Trả kết quả chuẩn
    // -----------------------------------------------------------------
    return {
        // ---- Thể loại ----
        themes: work.the_loai || [],

        // ---- Báo cáo đa chiều ----
        commentaryText,

        // ---- Metadata cho UI/Audit ----
        evidence: {
            context: ctx || {},
            praise: praise.evidence || {},
            goiMo: goiMo.evidence || {}
        },

        // ---- Độ mạnh tín hiệu ----
        strength
    };
}

// ==========================================================
// PHẦN 3: EXPORT AGENT OBJECT (Dùng cho MasterAI)
// ==========================================================

export const AnalysisAgent = {
    /**
     * Phương thức phân tích — được gọi từ MasterAI.
     *
     * @param {string|Object} input - ID, tên, hoặc object tác phẩm
     * @returns {Promise<Object>} Kết quả chuẩn { answer, detail, source, meta }
     */
    async analyze(input) {
        // -----------------------------------------------------------------
        // BƯỚC 1: Chuẩn hóa input thành object work
        // -----------------------------------------------------------------
        let work = null;

        if (typeof input === 'string') {
            // Nếu là string → giả lập work object
            // (Trong ngữ cảnh MasterAI, input thường là object đã có content)
            work = {
                title: input,
                content: input
            };
        } else if (input && typeof input === 'object') {
            work = input;
        } else {
            // Input không hợp lệ
            return {
                answer: FALLBACK.noData,
                detail: '',
                source: 'analysis',
                meta: [],
                _raw: { themes: [], commentaryText: FALLBACK.noData, evidence: {}, strength: 'Yếu' }
            };
        }

        // -----------------------------------------------------------------
        // BƯỚC 2: Gọi hàm phân tích chính
        // -----------------------------------------------------------------
        const result = analyzeWork(work);

        // -----------------------------------------------------------------
        // BƯỚC 3: Trả kết quả chuẩn
        // -----------------------------------------------------------------
        return {
            answer: result.commentaryText,
            detail: `Mức độ nhận diện: ${result.strength}`,
            source: 'analysis',
            meta: [],
            _raw: result  // Giữ raw data cho caller nếu cần
        };
    }
};

// ==========================================================
// PHẦN 4: AUTO-REGISTRY METADATA
// ==========================================================

/**
 * Metadata tự mô tả của AnalysisAgent.
 *
 * Được đọc bởi AgentRegistry trong index.js để tự động đăng ký.
 */
AnalysisAgent.agentInfo = {
    // ---- Định danh ----
    key: 'analysis',
    name: 'Phân Tích AI',
    description: 'Chuyên trách Đọc hiểu văn bản, Tìm chủ đề, Biểu tượng (không chấm điểm).',

    // ---- Năng lực (task → method) ----
    capabilities: {
        'analyze-work': 'analyze'
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author', 'symbol', 'allusion', 'term'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['poetics', 'literature', 'khuc-tan-thuong', 'goi-mo'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'analyze-work': [
            'phan tich', 'binh giang', 'cam nhan',
            'danh gia', 'binh luan', 'mo xe',
            'doc hieu', 'tim chu de'
        ]
    }
};

// ==========================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// ==========================================================
/**
 * SAU KHI DÙNG analysis.js v3.0.0:
 *
 * 1. Đã thay thế:
 *    - `PraiserAgent` → `KhucTanThuongAgent`
 *    - `CriticAgent`  → `GoiMoAgent`
 *
 * 2. Đã đổi label trong commentaryText:
 *    - "Điểm sáng"        → "Khúc Tán Thưởng"
 *    - "Điểm cần lưu ý"   → "Lời Gợi Mở"
 *
 * 3. Vẫn giữ nguyên signature:
 *    - `analyzeWork(work)` → { themes, commentaryText, evidence, strength }
 *    - `AnalysisAgent.analyze(input)` → { answer, detail, source, meta, _raw }
 *
 * 4. `master.js` cũ đọc `analysis.answer` vẫn chạy bình thường.
 *
 * 5. KHÔNG có trường điểm số trong file này.
 *    Đó là tư duy của Prompt Evaluator, không phải Văn Đạo.
 */
