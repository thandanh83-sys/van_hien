/**
 * ==========================================================
 * VĂN ĐẠO — INTENT DEFINITIONS (Định nghĩa ý định)
 * Vị trí: js/ai/nlp/intent-definitions.js
 * Version: 2.0.0 (Contemplative Intents — No Scoring)
 * ==========================================================
 *
 * MỤC ĐÍCH:
 * - Thay thế EXTRACTION_PATTERNS bằng định nghĩa ngữ nghĩa.
 * - Ánh xạ: Hành động (Action) + Đối tượng (TargetType) → Intent.
 * - Mỗi intent khai báo:
 *   + mode:        'ask' | 'search'
 *   + action:      Hành động (summarize, explain, analyze...)
 *   + targetType:  Đối tượng (work, author, symbol...)
 *   + agent:       Agent nào xử lý intent này
 *   + relation?:   Quan hệ (nếu có)
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. KHÔNG CHẤM ĐIỂM (No Scoring):
 *    - Không có intent nào là "chấm điểm" hay "đánh giá".
 *    - Chỉ có "phân tích" (analyze), "gợi mở" (open-depth),
 *      "tán thưởng" (praise).
 *
 * 2. THAY THẾ CRITIC BẰNG GỢI MỞ (Critic → Open-Depth):
 *    - Intent cũ `'criticize-work'` → đổi thành `'open-depth'`.
 *    - Agent cũ `'critic'`           → đổi thành `'goi-mo'`.
 *    - Key mới phản ánh đúng bản chất: không phê bình, chỉ gợi mở.
 *
 * 3. THAY THẾ PRAISER BẰNG KHÚC TÁN THƯỞNG:
 *    - Intent `'praise-work'` giữ nguyên key (backward compat),
 *      nhưng agent đổi từ `'praiser'` → `'khuc-tan-thuong'`.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.0.0: Định nghĩa intent cơ bản (dùng praiser/critic).
 * - v2.0.0: Contemplative Intents.
 *   - [ĐỔI] `'criticize-work'` → `'open-depth'`.
 *   - [ĐỔI] agent `'critic'` → `'goi-mo'`.
 *   - [ĐỔI] agent `'praiser'` → `'khuc-tan-thuong'`.
 *   - [THÊM] comment giải thích triết lý cho từng intent.
 *
 * ==========================================================
 */

export const INTENT_DEFINITIONS = {

    // =================================================================
    // NHÓM VĂN HỌC (Literature)
    // =================================================================
    // Xử lý: Tác phẩm, Tác giả, Thể loại
    // =================================================================

    /**
     * Tóm tắt tác phẩm.
     * Câu hỏi: "Tóm tắt Truyện Kiều", "Nội dung chính của Chí Phèo"
     */
    'summarize-work': {
        mode: 'ask',
        action: 'summarize',
        targetType: 'work',
        agent: 'literature'
    },

    /**
     * Tìm tác giả của tác phẩm.
     * Câu hỏi: "Ai viết Truyện Kiều?", "Tác giả của Chí Phèo là ai?"
     */
    'find-author-of': {
        mode: 'ask',
        action: 'find',
        targetType: 'author',
        agent: 'literature'
    },

    /**
     * Gợi ý đọc tác phẩm.
     * Câu hỏi: "Gợi ý cho tôi vài tác phẩm hay", "Nên đọc gì?"
     */
    'recommend': {
        mode: 'ask',
        action: 'recommend',
        targetType: 'work',
        agent: 'literature'
    },

    /**
     * Định nghĩa thể loại.
     * Câu hỏi: "Thơ lục bát là gì?", "Định nghĩa truyện ngắn"
     */
    'define-genre': {
        mode: 'ask',
        action: 'explain',
        targetType: 'genre',
        agent: 'literature'
    },

    // =================================================================
    // NHÓM THI PHÁP (Poetics)
    // =================================================================
    // Xử lý: Từ điển, Biểu tượng, Điển tích
    // =================================================================

    /**
     * Giải nghĩa biểu tượng.
     * Câu hỏi: "Ý nghĩa của trăng là gì?", "Hình ảnh liễu tượng trưng cho gì?"
     */
    'explain-symbol': {
        mode: 'ask',
        action: 'explain',
        targetType: 'symbol',
        agent: 'poetics'
    },

    /**
     * Giải nghĩa điển tích.
     * Câu hỏi: "Điển tích Tái Ông Thất Mã là gì?", "Sân Lai là gì?"
     */
    'explain-allusion': {
        mode: 'ask',
        action: 'explain',
        targetType: 'allusion',
        agent: 'poetics'
    },

    /**
     * Định nghĩa thuật ngữ thi pháp.
     * Câu hỏi: "Niêm là gì?", "Thất ngôn bát cú là gì?"
     */
    'define-term': {
        mode: 'ask',
        action: 'explain',
        targetType: 'term',
        agent: 'poetics'
    },

    // =================================================================
    // NHÓM TRI THỨC (Knowledge)
    // =================================================================
    // Xử lý: Mạng lưới liên kết (Tác giả ↔ Tác phẩm)
    // =================================================================

    /**
     * Tìm tác phẩm liên quan.
     * Câu hỏi: "Tác phẩm nào giống Truyện Kiều?", "Truyện Kiều cùng thể loại với bài nào?"
     */
    'find-related': {
        mode: 'search',
        action: 'find',
        targetType: 'work',
        relation: 'related_to',
        agent: 'knowledge'
    },

    /**
     * Lấy tiểu sử tác giả.
     * Câu hỏi: "Tiểu sử Nguyễn Du", "Nguyễn Du là ai?" (khi specialDetector nhận diện)
     */
    'find-author-info': {
        mode: 'ask',
        action: 'explain',
        targetType: 'author',
        agent: 'knowledge'
    },

    /**
     * Liệt kê tác phẩm của tác giả.
     * Câu hỏi: "Các tác phẩm của Nam Cao", "Nam Cao viết những gì?"
     */
    'list-author-works': {
        mode: 'search',
        action: 'list',
        targetType: 'work',
        relation: 'written_by',
        agent: 'knowledge'
    },

    // =================================================================
    // NHÓM PHÂN TÍCH (Analysis)
    // =================================================================
    // Xử lý: Phân tích cấu trúc, tìm chủ đề
    // =================================================================

    /**
     * Phân tích tác phẩm (đa chiều).
     * Câu hỏi: "Phân tích Truyện Kiều", "Cảm nhận về Tây Tiến"
     *
     * Lưu ý: Intent này thường kích hoạt Pipeline đa chiều
     * (Analysis + Khúc Tán Thưởng + Lời Gợi Mở).
     */
    'analyze-work': {
        mode: 'ask',
        action: 'analyze',
        targetType: 'work',
        agent: 'analysis'
    },

    // =================================================================
    // NHÓM LỊCH SỬ (History)
    // =================================================================
    // Xử lý: Bối cảnh lịch sử, thời đại văn học
    // =================================================================

    /**
     * Tìm tác phẩm theo thời kỳ.
     * Câu hỏi: "Tác phẩm thời nhà Lê?", "Văn học thế kỷ 19 có gì?"
     */
    'find-works-by-era': {
        mode: 'search',
        action: 'find',
        targetType: 'work',
        relation: 'belongs_to_era',
        agent: 'history'
    },

    /**
     * Tìm tác giả theo thời kỳ.
     * Câu hỏi: "Tác giả thời nhà Trần?", "Nhà thơ thế kỷ 20?"
     */
    'find-authors-by-era': {
        mode: 'search',
        action: 'find',
        targetType: 'author',
        relation: 'belongs_to_era',
        agent: 'history'
    },

    /**
     * Lấy bối cảnh lịch sử của tác phẩm/tác giả.
     * Câu hỏi: "Truyện Kiều viết thời nào?", "Nam Cao hoạt động thời kỳ nào?"
     */
    'get-historical-context': {
        mode: 'ask',
        action: 'explain',
        targetType: 'era',
        agent: 'history'
    },

    // =================================================================
    // NHÓM DỊCH THUẬT (Translation)
    // =================================================================

    /**
     * Dịch tác phẩm.
     * Câu hỏi: "Dịch Truyện Kiều sang tiếng Anh"
     */
    'translate-work': {
        mode: 'ask',
        action: 'translate',
        targetType: 'work',
        agent: 'translation'
    },

    // =================================================================
    // NHÓM NHÂN VẬT (Character)
    // =================================================================

    /**
     * Lấy thông tin nhân vật.
     * Câu hỏi: "Thúy Kiều là ai?", "Chí Phèo xuất hiện trong tác phẩm nào?"
     */
    'get-character-info': {
        mode: 'ask',
        action: 'explain',
        targetType: 'character',
        agent: 'character'
    },

    // =================================================================
    // NHÓM SO SÁNH (Comparison)
    // =================================================================

    /**
     * So sánh 2 thực thể.
     * Câu hỏi: "So sánh Nguyễn Du và Nam Cao", "So sánh Truyện Kiều và Chí Phèo"
     */
    'compare-entities': {
        mode: 'ask',
        action: 'compare',
        targetType: 'entity',
        agent: 'comparison'
    },

    // =================================================================
    // NHÓM TÁN THƯỞNG (Khúc Tán Thưởng)
    // =================================================================
    // [v2.0.0] Agent đổi từ 'praiser' → 'khuc-tan-thuong'
    // =================================================================

    /**
     * Tán thưởng vẻ đẹp tác phẩm.
     * Câu hỏi: "Khen bài thơ này", "Tìm vẻ đẹp của bài thơ"
     *
     * Lưu ý: Key 'praise-work' giữ nguyên (backward compat),
     * nhưng agent đã đổi sang KhucTanThuongAgent.
     */
    'praise-work': {
        mode: 'ask',
        action: 'praise',
        targetType: 'work',
        agent: 'khuc-tan-thuong'  // [v2.0.0] Đổi từ 'praiser'
    },

    // =================================================================
    // NHÓM GỢI MỞ (Lời Gợi Mở)
    // =================================================================
    // [v2.0.0] Thay thế hoàn toàn 'criticize-work' (Phê bình)
    // =================================================================

    /**
     * Gợi mở chiều sâu cho tác phẩm.
     * Câu hỏi: "Gợi mở chiều sâu cho bài thơ này", "Đào sâu bài thơ"
     *
     * THAY THẾ 'criticize-work' cũ:
     * - Không phê bình, không phán xét.
     * - Chỉ "mở ra một chiều sâu mới" để người đọc tự chiêm nghiệm.
     *
     * Agent: GoiMoAgent (thay CriticAgent).
     */
    'open-depth': {
        mode: 'ask',
        action: 'open',           // Hành động mới: "mở ra"
        targetType: 'work',
        agent: 'goi-mo'           // [v2.0.0] Thay thế 'critic'
    }

    // =================================================================
    // GHI CHÚ VỀ CÁC INTENT ĐÃ XÓA
    // =================================================================
    // Intent 'criticize-work' (v1.0.0) đã được thay bằng 'open-depth'.
    // Nếu code cũ vẫn tham chiếu 'criticize-work', cần cập nhật:
    //   - js/ai/nlp/language-signals.js: 'criticize' → 'open-depth'
    //   - js/audit.js: test case 'criticize-work' → 'open-depth'
    // =================================================================
};

// ==========================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// ==========================================================
/**
 * SAU KHI DÙNG intent-definitions.js v2.0.0:
 *
 * 1. Đã thay đổi intent:
 *    - `'criticize-work'` (Phê bình) → `'open-depth'` (Gợi mở)
 *    - Agent `'critic'` → `'goi-mo'`
 *    - Agent `'praiser'` → `'khuc-tan-thuong'`
 *
 * 2. Các file sau cần cập nhật:
 *    - js/ai/nlp/language-signals.js: đổi `criticize` → `open-depth`
 *    - js/audit.js: đổi test case `criticize-work` → `open-depth`
 *
 * 3. Tương thích ngược:
 *    - Intent `'praise-work'` giữ nguyên key (chỉ đổi agent).
 *    - Intent `'open-depth'` là key MỚI (không còn `'criticize-work'`).
 *    - Nếu caller cũ gọi `'criticize-work'`, sẽ nhận `undefined`.
 *      → Cần cập nhật caller để dùng `'open-depth'`.
 *
 * 4. Triết lý cốt lõi:
 *    - Không chấm điểm, không phê bình, không phán xét.
 *    - Chỉ phân tích, tán thưởng, gợi mở.
 *    - Mỗi bài thơ đều có hồn, nét đẹp riêng.
 */
