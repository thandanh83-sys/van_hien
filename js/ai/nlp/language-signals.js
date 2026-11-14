/**
 * ==========================================================
 * VĂN ĐẠO AI - LANGUAGE SIGNALS (js/ai/nlp/language-signals.js)
 * Vị trí: js/ai/nlp/language-signals.js
 * ==========================================================
 * MỤC ĐÍCH:
 * - Tập trung hóa tất cả các từ khóa tín hiệu ngôn ngữ vào một nơi.
 * - Phân loại rõ ràng: Hành động (Actions), Quan hệ (Relations), 
 *   Loại câu hỏi (QuestionTypes).
 * - Loại bỏ sự trùng lặp từ khóa giữa các Intent.
 * ==========================================================
 */

export const LANGUAGE_SIGNALS = {
    // 1. Các động từ chỉ Hành động (Actions)
    actions: {
        summarize: ['tom tat', 'khai quat', 'noi dung chinh', 'y chinh', 'ke lai'],
        analyze: ['phan tich', 'binh giang', 'cam nhan', 'danh gia', 'binh luan', 'mo xe'],
        list: ['liet ke', 'ke ten', 'thong ke', 'co nhung', 'gom nhung'],
        find: ['tim', 'tra cuu', 'tim kiem', 'cho toi', 'xem'],
        compare: ['so sanh', 'doi chieu', 'khac nhau', 'tuong dong', 'giong'],
        explain: ['giai thich', 'y nghia', 'dinh nghia', 'khai niem', 'cho biet'],
        translate: ['dich', 'translate', 'chuyen ngu', 'dich thuat'],
        recommend: ['goi y', 'de xuat', 'nen doc', 'muon doc'],
        praise: ['khen', 'ca ngoi', 'tuyen duong'],
        criticize: ['che', 'phe binh', 'chi trich', 'han che']
    },

    // 2. Các từ chỉ Quan hệ (Relations)
    relations: {
        written_by: ['cua', 'do', 'duoc sang tac boi', 'tac gia cua'],
        similar_to: ['tuong tu', 'gan giong', 'giong nhu', 'cung the loai'],
        related_to: ['lien quan', 'co lien he', 'co lien quan den'],
        belongs_to_era: ['thoi', 'thoi ky', 'trieu dai', 'nha']
    },

    // 3. Các mẫu câu hỏi (Question Types)
    questionTypes: {
        identity: ['la ai', 'la nguoi nao'],
        definition: ['la gi', 'nghia la gi', 'duoc hieu la gi'],
        reason: ['tai sao', 'vi sao', 'nguyen nhan'],
        method: ['nhu the nao', 'bang cach nao', 'lam sao']
    }
};
