/**
 * ==========================================================
 * VĂN ĐẠO — FORTUNE AGENT (Bói Thơ)
 * Vị trí: js/ai/agents/fortune.js
 * Version: 4.0.0 (Contemplative Fortune — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. BÓI THƠ LÀ CHIÊM NGHIỆM, KHÔNG PHẢI CHẤM ĐIỂM:
 *    - "Vận khí" chỉ là cái cớ để mở ra một cuộc trò chuyện
 *      với chính mình. Không phải để đánh giá bài thơ.
 *    - 6 mức vận khí (Đại Cát → Đại Hung) chỉ là 6 "tâm thế"
 *      để Bạn chiêm nghiệm, không phải 6 thang điểm.
 *
 * 2. 4 GÓC NHÌN ĐỀU TÔN VINH BÀI THƠ:
 *    - Phân tích (Analysis): chỉ ra cấu trúc, không phán xét.
 *    - Tán thưởng (Khúc Tán Thưởng): chỉ ra vẻ đẹp (đã có).
 *    - Gợi mở (Lời Gợi Mở): mở ra chiều sâu (có thể có).
 *    - Chiêm nghiệm (Fortune Reflection): lời bình thiền vị.
 *    → Không góc nhìn nào nói "bài thơ dở". Tất cả đều nói
 *      "bài thơ có hồn, và đây là một cách cảm nhận".
 *
 * 3. KHÔNG DÙNG TỪ PHÁN XÉT:
 *    - Không "tệ", "kém", "dở", "sai".
 *    - Chỉ dùng "Ta tự hỏi...", "Bạn thử xem...", "Có một gợi mở...".
 *
 * 4. FALLBACK GRACEFUL:
 *    - Nếu LiteraryEngine không phân tích được → vẫn trả về
 *      lời bình thiền vị từ fortune_texts.
 *    - Nếu work là null/undefined → vẫn trả về khung cơ bản.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v3.6.0: (tiền thân) Tích hợp PraiserAgent + CriticAgent.
 * - v4.0.0: Đổi sang KhucTanThuongAgent + GoiMoAgent.
 *           Bỏ hoàn toàn ngôn ngữ "critic/phê bình".
 *           Thêm `contemplativeReflection` (tùy chọn).
 *
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { escapeHTML } from '../../utils.js';
import { FORTUNE_LEVELS, FORTUNE_MAP } from '../core.js';
import { KhucTanThuongAgent } from './khuc-tan-thuong.js';
import { GoiMoAgent }         from './goi-mo.js';

// ==========================================================
// PHẦN 1: TÍNH TOÁN VẬN KHÍ (Ngẫu nhiên có trọng số)
// ==========================================================

/**
 * Tính toán vận khí ngẫu nhiên có trọng số.
 *
 * 6 mức vận khí với trọng số khác nhau:
 * - dai-cat:   10 (hiếm — niềm vui lớn)
 * - trung-cat: 18
 * - tieu-cat:  22 (phổ biến nhất — niềm vui nhỏ)
 * - binh-hoa:  24 (phổ biến nhất — tĩnh tại)
 * - tieu-hung: 16
 * - dai-hung:  10 (hiếm — thử thách lớn)
 *
 * @returns {string} Key của mức vận khí
 */
export function calculateFortune() {
    const totalWeight = FORTUNE_LEVELS.reduce((sum, level) => sum + level.weight, 0);
    let random = Math.random() * totalWeight;

    for (const level of FORTUNE_LEVELS) {
        if (random < level.weight) return level.key;
        random -= level.weight;
    }

    // Fallback an toàn (không bao giờ xảy ra trừ khi có lỗi cấu hình)
    return 'binh-hoa';
}

/**
 * Lấy thông tin chi tiết của một mức vận khí.
 *
 * @param {string} fortuneKey - Key của vận khí
 * @returns {Object} Object chứa { key, name, color, advice, fortune_texts }
 */
export function getFortuneInfo(fortuneKey) {
    return FORTUNE_MAP[fortuneKey] || FORTUNE_MAP['binh-hoa'];
}

// ==========================================================
// PHẦN 2: TỔNG HỢP 4 GÓC NHÌN
// ==========================================================

/**
 * Tổng hợp 4 góc nhìn thành một kết quả Fortune hoàn chỉnh.
 *
 * 4 góc nhìn:
 * 1. Phân tích (Analysis) — từ tham số analysisResult (nếu có)
 * 2. Tán thưởng (Khúc Tán Thưởng) — từ KhucTanThuongAgent
 * 3. Gợi mở (Lời Gợi Mở) — từ GoiMoAgent
 * 4. Chiêm nghiệm (Fortune Reflection) — từ fortune_texts (thiền vị)
 *
 * @param {Object} work - Object tác phẩm (từ DataHub)
 * @param {string} fortuneKey - Key vận khí
 * @param {Object} analysisResult - Kết quả phân tích (tùy chọn)
 * @returns {Object} Kết quả Fortune đầy đủ
 */
export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa', analysisResult = null) {
    // -----------------------------------------------------------------
    // GUARD: work không hợp lệ
    // -----------------------------------------------------------------
    if (!work || typeof work !== 'object') {
        return _getEmptyFortune(fortuneKey);
    }

    // -----------------------------------------------------------------
    // BƯỚC 1: Lấy thông tin vận khí
    // -----------------------------------------------------------------
    const fortune = getFortuneInfo(fortuneKey);
    const validKey = fortune.key;

    // -----------------------------------------------------------------
    // BƯỚC 2: Lấy lời bình từ 2 agents mới (thay vì 2 agents cũ)
    // -----------------------------------------------------------------
    // - KhucTanThuongAgent.getQuickComment: khen ngắn, có căn cứ
    // - GoiMoAgent.getQuickComment: gợi mở ngắn, không phán xét
    // -----------------------------------------------------------------
    let praiseCommentary = '';
    let goiMoCommentary = '';

    try {
        praiseCommentary = KhucTanThuongAgent.getQuickComment(work);
    } catch (err) {
        console.warn('[FORTUNE] KhucTanThuongAgent lỗi:', err);
        praiseCommentary = 'Áng văn này có một nét đẹp riêng, cần thêm thời gian để cảm nhận.';
    }

    try {
        goiMoCommentary = GoiMoAgent.getQuickComment(work);
    } catch (err) {
        console.warn('[FORTUNE] GoiMoAgent lỗi:', err);
        goiMoCommentary = 'Có một chiều sâu ta muốn cùng Bạn đào thêm, nhưng cần đọc chậm hơn.';
    }

    // -----------------------------------------------------------------
    // BƯỚC 3: Lấy lời khuyên Nên/Tránh
    // -----------------------------------------------------------------
    const commentaryData = (APP_DATA.COMMENTARY_DATA && APP_DATA.COMMENTARY_DATA[validKey]) || {};
    const nen = commentaryData.nen || fortune.advice || 'Thuận theo tự nhiên.';
    const tranh = commentaryData.tranh || 'Tránh nóng vội.';

    // -----------------------------------------------------------------
    // BƯỚC 4: Lấy lời chiêm nghiệm (thiền vị)
    // -----------------------------------------------------------------
    // Ưu tiên 1: fortune.fortune_texts (từ core.js — mới, thiền vị hơn)
    // Ưu tiên 2: commentaryData.commentaries (từ data-loi-binh.json — cũ)
    // Fallback:  câu mặc định
    // -----------------------------------------------------------------
    let commentaries = [];
    if (fortune.fortune_texts && Array.isArray(fortune.fortune_texts) && fortune.fortune_texts.length > 0) {
        commentaries = fortune.fortune_texts;
    } else if (commentaryData.commentaries && Array.isArray(commentaryData.commentaries)) {
        commentaries = commentaryData.commentaries;
    }

    const randomCommentary = commentaries.length > 0
        ? commentaries[Math.floor(Math.random() * commentaries.length)]
        : 'Vạn sự tùy duyên. Mọi sự đến rồi đi, chỉ có tâm là ở lại.';

    // -----------------------------------------------------------------
    // BƯỚC 5: Xây dựng cầu nối (bridge text)
    // -----------------------------------------------------------------
    const bridgeText = `Trong kho tàng văn học, Bạn gặp được tác phẩm "${work.title || 'này'}". `
                     + `Đây là một cơ duyên. Dưới đây là đôi lời chiêm nghiệm dành riêng cho Bạn hôm nay:`;

    // -----------------------------------------------------------------
    // BƯỚC 6: Xây dựng HTML cho phần Nên/Tránh
    // -----------------------------------------------------------------
    const adviceHtml = `
        <div style="margin-bottom: 10px;">
            <span style="color: var(--accent-text); font-weight: 700;">Nên:</span>
            ${escapeHTML(nen)}
        </div>
        <div>
            <span style="color: #a36b6b; font-weight: 700;">Tránh:</span>
            ${escapeHTML(tranh)}
        </div>
    `;

    // -----------------------------------------------------------------
    // BƯỚC 7: Lấy thông tin từ analysisResult (nếu có)
    // -----------------------------------------------------------------
    let analysisSummary = '';
    if (analysisResult && typeof analysisResult === 'object') {
        analysisSummary = analysisResult.commentaryText || '';
    }

    // -----------------------------------------------------------------
    // BƯỚC 8: Trả kết quả chuẩn
    // -----------------------------------------------------------------
    return {
        // ---- Vận khí ----
        fortuneInfo: fortune,

        // ---- Lời dẫn ----
        bridgeText: escapeHTML(bridgeText),

        // ---- Chiêm nghiệm (thiền vị) ----
        fortuneReflection: escapeHTML(randomCommentary),

        // ---- Tán thưởng (từ KhucTanThuongAgent) ----
        praiseCommentary,

        // ---- Gợi mở (từ GoiMoAgent) ----
        // LƯU Ý: Giữ cả 2 field name để tương thích ngược:
        // - 'criticCommentary': tên cũ (main.js có thể đọc)
        // - 'goiMoCommentary':  tên mới (khuyến nghị dùng)
        criticCommentary: goiMoCommentary,   // [LEGACY] giữ cho tương thích
        goiMoCommentary,                     // [NEW] khuyến nghị

        // ---- Lời khuyên ----
        adviceHtml,

        // ---- Phân tích (nếu có) ----
        analysisSummary,

        // ---- Metadata ----
        strength: 'Vừa',
        evidence: { themes: [], symbols: [] }
    };
}

// ==========================================================
// PHẦN 3: FALLBACK (Graceful Degradation)
// ==========================================================

/**
 * Trả về kết quả Fortune rỗng (khi không có work).
 * @private
 */
function _getEmptyFortune(fortuneKey) {
    const fortune = getFortuneInfo(fortuneKey);

    return {
        fortuneInfo: fortune,
        bridgeText: escapeHTML('Hôm nay, duyên chưa tụ với một tác phẩm cụ thể. '
            + 'Nhưng vẫn có một lời chiêm nghiệm dành cho Bạn:'),
        fortuneReflection: escapeHTML('Vạn sự tùy duyên. Mọi sự đến rồi đi, chỉ có tâm là ở lại.'),
        praiseCommentary: 'Cần thêm thời gian để cảm nhận trọn vẹn một áng văn.',
        criticCommentary: 'Có một chiều sâu ta muốn cùng Bạn đào thêm.',
        goiMoCommentary: 'Có một chiều sâu ta muốn cùng Bạn đào thêm.',
        adviceHtml: `
            <div style="margin-bottom: 10px;">
                <span style="color: var(--accent-text); font-weight: 700;">Nên:</span>
                ${escapeHTML(fortune.advice || 'Thuận theo tự nhiên.')}
            </div>
            <div>
                <span style="color: #a36b6b; font-weight: 700;">Tránh:</span>
                Tránh nóng vội.
            </div>
        `,
        analysisSummary: '',
        strength: 'Yếu',
        evidence: { themes: [], symbols: [] }
    };
}

// ==========================================================
// PHẦN 4: AGENT OBJECT (cho MasterAI / Auto-Registry)
// ==========================================================

export const FortuneAgent = {
    /**
     * Method chính — dùng khi MasterAI gọi.
     *
     * LƯU Ý: Method này KHÔNG thực hiện bói (vì bói cần work object
     * và UI riêng). Nó chỉ trả về hướng dẫn cho người dùng.
     * Việc bói thực sự diễn ra trong main.js → randomPoem().
     *
     * @param {string} query - Câu hỏi (không dùng)
     * @returns {Object} Hướng dẫn
     */
    async getFortune(query) {
        return {
            answer: 'Vui lòng sử dụng nút "Một bài thơ cho hôm nay" ở Trang Chủ để gieo quẻ vận khí. '
                  + 'Mỗi lần gieo là một cơ duyên khác nhau — Bạn có thể thử nhiều lần.',
            detail: 'Tính năng Bói thơ sử dụng thuật toán ngẫu nhiên có trọng số, '
                  + 'kết hợp với 3 góc nhìn AI: Tán thưởng, Gợi mở, Chiêm nghiệm.',
            source: 'fortune'
        };
    }
};

// ==========================================================
// PHẦN 5: AUTO-REGISTRY METADATA
// ==========================================================

FortuneAgent.agentInfo = {
    // ---- Định danh ----
    key: 'fortune',
    name: 'Vận Khí AI',
    description: 'Chuyên trách Bói thơ, Vận khí, Nên/Tránh (không chấm điểm).',

    // ---- Năng lực ----
    capabilities: {
        'fortune': 'getFortune'
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['khuc-tan-thuong', 'goi-mo', 'analysis'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'fortune': [
            'boi', 'van khi', 'gieo que', 'xin que',
            'bai tho hom nay', 'mot bai tho', 'chon giup',
            'tam su', 'met moi', 'chan nan', 'can loi khuyen'
        ]
    }
};
