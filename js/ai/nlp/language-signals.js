/**
 * ==========================================================
 * VĂN ĐẠO — LANGUAGE SIGNALS (Tín hiệu ngôn ngữ)
 * Vị trí: js/ai/nlp/language-signals.js
 * Version: 2.0.0 (Contemplative Signals — No Scoring)
 * ==========================================================
 *
 * MỤC ĐÍCH:
 * - Tập trung hóa tất cả các từ khóa tín hiệu ngôn ngữ vào một nơi.
 * - Phân loại rõ ràng: Hành động (Actions), Quan hệ (Relations),
 *   Loại câu hỏi (QuestionTypes).
 * - Loại bỏ sự trùng lặp từ khóa giữa các Intent.
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. KHÔNG CHẤM ĐIỂM (No Scoring):
 *    - Không có action "chấm điểm", "đánh giá", "xếp hạng".
 *    - Chỉ có "phân tích", "tán thưởng", "gợi mở".
 *
 * 2. THAY THẾ CRITICIZE BẰNG OPEN (v2.0.0):
 *    - Action cũ `criticize` (phê bình) đã được thay bằng `open`
 *      (gợi mở chiều sâu).
 *    - Từ khóa cũ ('che', 'phe binh') được chuyển vào action `open`
 *      dưới dạng "từ khóa kế thừa" — nhưng được ưu tiên thấp hơn
 *      các từ khóa mới ('goi mo', 'chieu sau', 'dao sau').
 *    - Lý do: Người dùng vẫn có thể gõ "chê bài thơ này", nhưng
 *      kết quả trả về sẽ là "Lời Gợi Mở" (không phán xét) thay vì
 *      "Phê bình" (cay nghiệt).
 *
 * 3. PHÂN LOẠI RÕ RÀNG:
 *    - Actions: Động từ chỉ hành động (summarize, analyze, open...)
 *    - Relations: Từ chỉ quan hệ (written_by, similar_to...)
 *    - QuestionTypes: Mẫu câu hỏi (identity, definition, reason...)
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.0.0: Định nghĩa tín hiệu cơ bản (có `criticize`).
 * - v2.0.0: Contemplative Signals.
 *   - [ĐỔI] `criticize` → `open` (gợi mở chiều sâu).
 *   - [THÊM] Từ khóa mới cho gợi mở.
 *   - [GIỮ] Từ khóa cũ ('che', 'phe binh') trong `open` để
 *           tương thích ngược — nhưng ưu tiên thấp.
 *
 * ==========================================================
 */

export const LANGUAGE_SIGNALS = {

    // =================================================================
    // 1. CÁC ĐỘNG TỪ CHỈ HÀNH ĐỘNG (Actions)
    // =================================================================
    actions: {

        /**
         * Tóm tắt — rút gọn nội dung.
         */
        summarize: [
            'tom tat', 'khai quat', 'noi dung chinh', 'y chinh', 'ke lai'
        ],

        /**
         * Phân tích — bóc tách cấu trúc, tìm chủ đề.
         */
        analyze: [
            'phan tich', 'binh giang', 'cam nhan',
            'danh gia', 'binh luan', 'mo xe', 'doc hieu'
        ],

        /**
         * Liệt kê — đưa ra danh sách.
         */
        list: [
            'liet ke', 'ke ten', 'thong ke', 'co nhung', 'gom nhung'
        ],

        /**
         * Tìm — tra cứu thông tin.
         */
        find: [
            'tim', 'tra cuu', 'tim kiem', 'cho toi', 'xem'
        ],

        /**
         * So sánh — đối chiếu hai đối tượng.
         */
        compare: [
            'so sanh', 'doi chieu', 'khac nhau', 'tuong dong', 'giong'
        ],

        /**
         * Giải thích — định nghĩa, làm rõ.
         */
        explain: [
            'giai thich', 'y nghia', 'dinh nghia', 'khai niem', 'cho biet'
        ],

        /**
         * Dịch — chuyển ngữ.
         */
        translate: [
            'dich', 'translate', 'chuyen ngu', 'dich thuat'
        ],

        /**
         * Gợi ý — đề xuất.
         */
        recommend: [
            'goi y', 'de xuat', 'nen doc', 'muon doc'
        ],

        /**
         * Tán thưởng — ca ngợi vẻ đẹp.
         */
        praise: [
            'khen', 'ca ngoi', 'tuyen duong', 'tan thuong',
            've dep', 'net dep', 'diem sang'
        ],

        // =================================================================
        // [v2.0.0 — THAY THẾ `criticize` BẰNG `open`]
        // =================================================================
        /**
         * Gợi mở chiều sâu — mở ra một góc nhìn mới.
         *
         * LƯU Ý QUAN TRỌNG:
         * - Đây là action THAY THẾ cho `criticize` (phê bình) cũ.
         * - Từ khóa được chia 2 nhóm:
         *   + Nhóm 1 (ưu tiên cao): từ khóa mới — gợi mở, chiêm nghiệm.
         *   + Nhóm 2 (ưu tiên thấp): từ khóa cũ — chê, phê bình.
         * - Lý do giữ nhóm 2: để người dùng cũ vẫn dùng được.
         *   Nhưng kết quả sẽ là "Lời Gợi Mở" (không phán xét),
         *   không phải "Phê bình" (cay nghiệt).
         *
         * Triết lý: "Không có gì cần sửa. Chỉ là một phép thử
         * để thấy rõ hơn điều Bạn đã viết."
         */
        open: [
            // ---- Nhóm 1: Từ khóa MỚI (ưu tiên cao) ----
            'goi mo', 'chieu sau', 'dao sau', 'mo rong',
            'khai mo', 'chiem nghiem', 'suy tu', 'cam nhan sau',
            'mo ra', 'nhin lai',

            // ---- Nhóm 2: Từ khóa CŨ (kế thừa, ưu tiên thấp) ----
            // Giữ lại để tương thích ngược.
            // Người dùng gõ "chê" sẽ nhận về "Lời Gợi Mở" thay vì "Phê bình".
            'che', 'phe binh', 'chi trich', 'han che'
        ]
    },

    // =================================================================
    // 2. CÁC TỪ CHỈ QUAN HỆ (Relations)
    // =================================================================
    relations: {

        /**
         * Quan hệ "được viết bởi" — tác giả của tác phẩm.
         */
        written_by: [
            'cua', 'do', 'duoc sang tac boi', 'tac gia cua'
        ],

        /**
         * Quan hệ "tương tự" — tác phẩm cùng thể loại.
         */
        similar_to: [
            'tuong tu', 'gan giong', 'giong nhu', 'cung the loai'
        ],

        /**
         * Quan hệ "liên quan" — tác phẩm có nét tương đồng.
         */
        related_to: [
            'lien quan', 'co lien he', 'co lien quan den'
        ],

        /**
         * Quan hệ "thuộc thời kỳ" — tác phẩm thuộc triều đại nào.
         */
        belongs_to_era: [
            'thoi', 'thoi ky', 'trieu dai', 'nha'
        ]
    },

    // =================================================================
    // 3. CÁC MẪU CÂU HỎI (QuestionTypes)
    // =================================================================
    questionTypes: {

        /**
         * Câu hỏi định danh — "X là ai?".
         */
        identity: [
            'la ai', 'la nguoi nao'
        ],

        /**
         * Câu hỏi định nghĩa — "X là gì?".
         */
        definition: [
            'la gi', 'nghia la gi', 'duoc hieu la gi'
        ],

        /**
         * Câu hỏi lý do — "Tại sao?".
         */
        reason: [
            'tai sao', 'vi sao', 'nguyen nhan'
        ],

        /**
         * Câu hỏi phương pháp — "Như thế nào?".
         */
        method: [
            'nhu the nao', 'bang cach nao', 'lam sao'
        ]
    }
};

// ==========================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// ==========================================================
/**
 * SAU KHI DÙNG language-signals.js v2.0.0:
 *
 * 1. Đã thay đổi:
 *    - `actions.criticize` (cũ) → `actions.open` (mới)
 *    - Từ khóa cũ ('che', 'phe binh') được giữ trong `actions.open`
 *      để tương thích ngược — nhưng ưu tiên thấp hơn từ khóa mới.
 *
 * 2. Các file cần cập nhật đồng bộ:
 *    - js/ai/nlp/intent-definitions.js: đã có `open-depth` với action 'open'
 *    - js/audit.js: test case 'criticize-work' → 'open-depth'
 *
 * 3. Tương thích ngược:
 *    - Nếu code cũ tham chiếu `actions.criticize` → sẽ nhận `undefined`.
 *      → Cần đổi sang `actions.open`.
 *    - Từ khóa 'che', 'phe binh' vẫn hoạt động (trong `actions.open`),
 *      nhưng kết quả trả về là "Lời Gợi Mở" (không phán xét).
 *
 * 4. Triết lý cốt lõi:
 *    - Không chấm điểm, không phê bình, không phán xét.
 *    - Chỉ phân tích, tán thưởng, gợi mở.
 *    - Mỗi bài thơ đều có hồn, nét đẹp riêng.
 */
