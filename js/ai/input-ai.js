/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI 3.0 (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 3.0.0 (Semantic Parser & Entity Extractor)
 * ==========================================================
 * NHIỆM VỤ:
 * 1. Phân biệt câu hỏi (question), mệnh lệnh (command), hay tìm kiếm (search).
 * 2. Trả về 2 lớp thông tin: type (định tuyến) và mode (ngữ cảnh).
 * 3. Trích xuất chính xác "thực thể" (entity) từ câu hỏi tự nhiên.
 * 4. Không phụ thuộc vào dấu hỏi (?).
 * 
 * TRIẾT LÝ:
 * - Người dùng có thể hỏi theo nhiều cách khác nhau.
 * - InputAI phải hiểu được "ý định" đằng sau câu chữ.
 * - Trả về query SẠCH (chỉ còn tên thực thể) để Agent xử lý.
 * ==========================================================
 */

import { extractEntity } from './core.js';

// =====================================================================
// PHẦN 1: CÔNG CỤ XỬ LÝ NGÔN NGỮ
// =====================================================================

/**
 * Chuẩn hóa văn bản: lowercase, bỏ dấu, gộp khoảng trắng.
 * Dùng để so khớp pattern mà không phân biệt hoa thường/dấu.
 */
function normalizeText(text = '') {
    return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Kiểm tra xem text có chứa bất kỳ pattern nào trong danh sách không.
 */
function has(text, patterns) {
    return patterns.some(pattern => pattern.test(text));
}

/**
 * Loại bỏ các từ mở đầu lịch sự (Xin hỏi, Cho tôi hỏi, v.v.)
 */
function removeOpeningWords(text) {
    return text.replace(
        /^(xin hỏi|cho tôi hỏi|cho mình hỏi|giúp tôi|giúp mình|hãy|làm ơn|vui lòng|cho tôi biết|cho mình biết|thưa|kính thưa)\s+/i,
        ''
    ).trim();
}

/**
 * Loại bỏ các từ kết thúc dư thừa (không, ạ, nhỉ, vậy, thế, đó, đấy).
 */
function removeTrailingParticles(text) {
    return text.replace(/\s+(không|ạ|nhỉ|vậy|thế|đó|đấy|đó ạ|vậy ạ)\s*$/i, '').trim();
}

/**
 * Xây dựng object kết quả chuẩn.
 */
function result(type, mode, query, extra = {}) {
    return {
        type,
        mode,
        query: String(query || '').trim(),
        questionType: extra.questionType || null,
        confidence: extra.confidence ?? 0.7,
        needsClarification: extra.needsClarification ?? false,
        signals: extra.signals || [],
        originalInput: extra.originalInput || '',
        ...extra
    };
}

// =====================================================================
// PHẦN 2: BỘ PATTERN TRÍCH XUẤT THỰC THỂ (ENTITY EXTRACTION)
// =====================================================================

/**
 * Bộ pattern loại bỏ từ thừa, CHỈ GIỮ LẠI tên thực thể.
 * Mỗi intent có bộ pattern riêng để tránh xóa nhầm.
 */
const EXTRACTION_PATTERNS = {
    // Tìm tác phẩm liên quan
    'find-related': [
        /\b(tác phẩm|bài thơ|bài viết|tiểu thuyết|truyện ngắn|truyện dài)\b/gi,
        /\b(nào|gì|chi)\b/gi,
        /\b(liên quan đến|liên quan|tương tự|giống như|giống|tương đồng|cùng|gần giống)\b/gi,
        /\b(với|đến|như|tới)\b/gi,
        /\b(có|cho tôi|cho mình|tìm|liệt kê|kể tên)\b/gi,
        /\b(thể loại|tác giả|chủ đề)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Liệt kê tác phẩm của tác giả
    'list-author-works': [
        /\b(liệt kê|kể tên|thống kê|tìm|cho tôi|cho mình|xem)\b/gi,
        /\b(tác phẩm|bài thơ|bài viết|tiểu thuyết|truyện ngắn|truyện dài|sáng tác)\b/gi,
        /\b(của|thuộc về|do)\b/gi,
        /\b(những|những tác phẩm|những bài|những sáng tác)\b/gi,
        /\b(nào|gì|chi)\b/gi,
        /\b(viết|sáng tác|có)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Tiểu sử tác giả
    'find-author-info': [
        /\b(tiểu sử|cuộc đời|sự nghiệp|thông tin|hồ sơ|chân dung|giới thiệu)\b/gi,
        /\b(của|về|cho|nói về|kể về)\b/gi,
        /\b(tác giả|nhà thơ|nhà văn|nhân vật)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Tìm tác giả của tác phẩm
    'find-author-of': [
        /\b(ai là|ai viết|ai sáng tác|là ai|của ai|người nào|tác giả nào)\b/gi,
        /\b(tác giả|tác phẩm)\b/gi,
        /\b(của|cho)\b/gi,
        /\b(là|viết|sáng tác)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Tóm tắt tác phẩm
    'summarize-work': [
        /\b(tóm tắt|kể lại|trình bày|nội dung chính|ý chính)\b/gi,
        /\b(nội dung|tác phẩm|bài thơ|bài viết|truyện ngắn|truyện dài|tiểu thuyết)\b/gi,
        /\b(của|về)\b/gi,
        /\b(cho tôi|cho mình|giúp)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Phân tích tác phẩm
    'analyze-work': [
        /\b(phân tích|bình giảng|cảm nhận|đánh giá|bình luận|mổ xẻ)\b/gi,
        /\b(tác phẩm|bài thơ|bài viết|truyện ngắn|truyện dài|tiểu thuyết|đoạn thơ|đoạn văn)\b/gi,
        /\b(của|về)\b/gi,
        /\b(cho tôi|cho mình|giúp)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Gợi ý đọc
    'recommend': [
        /\b(gợi ý|đề xuất|nên đọc|muốn đọc|tìm|giới thiệu)\b/gi,
        /\b(tác phẩm|bài thơ|truyện|sách|thơ|tiểu thuyết)\b/gi,
        /\b(nào|gì|hay|thú vị)\b/gi,
        /\b(thể loại|chủ đề|về)\b/gi,
        /\b(cho tôi|cho mình)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Giải thích biểu tượng
    'explain-symbol': [
        /\b(ý nghĩa|biểu tượng|hình tượng|hình ảnh|tượng trưng|ẩn dụ)\b/gi,
        /\b(của|trong|về)\b/gi,
        /\b(là gì|thế nào|ra sao|như thế nào)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Giải thích điển tích
    'explain-allusion': [
        /\b(điển tích|điển cố|nguồn gốc điển|tích cũ|điển xưa)\b/gi,
        /\b(của|về|trong)\b/gi,
        /\b(là gì|thế nào|ra sao)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Định nghĩa thuật ngữ
    'define-term': [
        /\b(định nghĩa|giải thích|khái niệm|tìm hiểu|định danh)\b/gi,
        /\b(là gì|nghĩa là gì|được hiểu là gì|có nghĩa là gì)\b/gi,
        /\b(từ|thuật ngữ|khái niệm)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Định nghĩa thể loại
    'define-genre': [
        /\b(định nghĩa|giải thích|khái niệm|tìm hiểu)\b/gi,
        /\b(thể loại|thể thơ|loại thơ)\b/gi,
        /\b(là gì|thế nào|ra sao)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // So sánh tác phẩm
    'compare-works': [
        /\b(so sánh|đối chiếu|khác nhau|giống nhau|sự khác biệt|điểm giống)\b/gi,
        /\b(giữa|và|với)\b/gi,
        /\b(tác phẩm|bài thơ|bài viết|truyện)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Mặc định: Tìm kiếm
    'default': [
        /\b(tìm|kiếm|tra cứu|cho tôi|cho mình)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ]
};

/**
 * Hàm trích xuất thực thể: Loại bỏ từ thừa, giữ lại tên.
 */
function cleanQuery(text, intentType = 'default') {
    let result = text;
    const patterns = EXTRACTION_PATTERNS[intentType] || EXTRACTION_PATTERNS['default'];
    
    if (patterns.length) {
        try {
            result = extractEntity(text, patterns) || text;
        } catch (error) {
            console.warn('[InputAI] Entity extraction error:', error);
        }
    }
    
    // Loại bỏ dấu câu ở đầu/cuối
    return String(result)
        .replace(/^[\s,.:;!?'"“”‘’()[\]{}]+/, '')
        .replace(/[\s,.:;!?'"“”‘’()[\]{}]+$/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// =====================================================================
// PHẦN 3: NHẬN DIỆN CẤU TRÚC CÂU
// =====================================================================

/**
 * Nhận diện mẫu câu hỏi tổng quát (Definition, Reason, Method, v.v.)
 * Dùng khi không có command hoặc special question nào khớp.
 */
function detectQuestionForm(text) {
    const patterns = [
        { type: 'definition', regex: /(^|\s)(la gi|nghia la gi|duoc hieu la gi|la nhu the nao)(\s|$)/ },
        { type: 'reason', regex: /(^|\s)(tai sao|vi sao|vi ly do gi|nguyen nhan nao)(\s|$)/ },
        { type: 'method', regex: /(^|\s)(nhu the nao|bang cach nao|lam the nao)(\s|$)/ },
        { type: 'identity', regex: /(^|\s)(ai la|ai viet|ai sang tac|tac gia nao|nguoi nao)(\s|$)/ },
        { type: 'location', regex: /(^|\s)(o dau|noi nao|thuoc dau|nam o dau)(\s|$)/ },
        { type: 'time', regex: /(^|\s)(khi nao|bao gio|vao thoi nao)(\s|$)/ },
        { type: 'quantity', regex: /(^|\s)(bao nhieu|may loai|co bao nhieu)(\s|$)/ },
        { type: 'yes-no', regex: /(^|\s)(co phai|lieu co|phai chang|co dung khong|dung hay sai)(\s|$)/ },
        { type: 'explanation', regex: /(^|\s)(y nghia la gi|co y nghia gi|duoc hieu ra sao|noi len dieu gi)(\s|$)/ }
    ];
    for (const item of patterns) {
        if (item.regex.test(text)) return item.type;
    }
    return null;
}

// =====================================================================
// PHẦN 4: NHẬN DIỆN Ý ĐỊNH (INTENT DETECTION)
// =====================================================================

/**
 * Nhận diện YÊU CẦU THỰC HIỆN (Command).
 * Ưu tiên: Specific → Generic.
 */
function detectCommand(text) {
    // --- ƯU TIÊN 1: MẠNG LƯỚI TRI THỨC (CỤ THỂ NHẤT) ---
    if (has(text, [
        /\btac pham lien quan\b/, 
        /\blien quan den\b/, 
        /\btuong tu\b/, 
        /\bcung the loai\b/,
        /\bcung tac gia\b/,
        /\bgiong\b/,
        /\bco net tuong dong\b/,
        /\btuong dong voi\b/
    ])) return 'find-related';

    if (has(text, [
        /\btac pham cua\b/,
        /\bsang tac nhung tac pham nao\b/,
        /\bco nhung tac pham nao\b/,
        /\bviet nhung (tac pham|bai|truyen|tho) nao\b/,
        /\bnhung (tac pham|bai|truyen|tho) (cua|nao)\b/,
        /\bliet ke (tac pham|bai|truyen|tho)\b/,
        /\bke ten (tac pham|bai|truyen|tho)\b/
    ])) return 'list-author-works';

    // --- ƯU TIÊN 2: HÀNH ĐỘNG VĂN HỌC ---
    if (has(text, [/\bphan tich\b/, /\bbinh giang\b/, /\bcam nhan\b/, /\bdanh gia\b/, /\bbinh luan\b/])) 
        return 'analyze-work';
    
    if (has(text, [/\btom tat\b/, /\bke lai\b/, /\bnoi dung chinh\b/, /\btrinh bay noi dung\b/, /\bviet ve cai gi\b/, /\bnoi ve cai gi\b/, /\bke ve cai gi\b/])) 
        return 'summarize-work';
    
    if (has(text, [/\bgoi y\b/, /\bde xuat\b/, /\bnen doc\b/, /\bmuon doc\b/, /\btim truyen\b/, /\btim tho\b/, /\btim tac pham\b/])) 
        return 'recommend';
    
    if (has(text, [/\bso sanh\b/, /\bdoi chieu\b/, /\bkhac nhau giua\b/, /\bso sanh giua\b/])) 
        return 'compare-works';
    
    if (has(text, [/\bthong ke\b/, /\bliet ke\b/, /\bke ten\b/])) 
        return 'list';
    
    if (has(text, [/\bboi\b/, /\bvan khi\b/, /\bgieo que\b/, /\bxin que\b/])) 
        return 'fortune';
    
    return null;
}

/**
 * Nhận diện CÂU HỎI CHUYÊN MÔN (Special Question).
 * Ưu tiên: Specific → Generic.
 */
function detectSpecialQuestion(text) {
    // --- TÁC GIẢ ---
    if (has(text, [
        /\bai la tac gia\b/, 
        /\bai viet\b/, 
        /\bai sang tac\b/, 
        /\btac gia cua\b/, 
        /\bnguoi viet\b/,
        /\bla ai\b/,
        /\bcua ai\b/,
        /\btac gia nao\b/
    ])) return 'find-author-of';

    if (has(text, [
        /\btieu su\b/, 
        /\bcuoc doi cua\b/, 
        /\bsu nghiep cua\b/, 
        /\bthong tin ve tac gia\b/,
        /\bho so tac gia\b/,
        /\bchan dung tac gia\b/
    ])) return 'find-author-info';

    // --- BIỂU TƯỢNG & ĐIỂN TÍCH ---
    if (has(text, [
        /\bbieu tuong\b/, 
        /\bhinh tuong\b/, 
        /\by nghia cua hinh anh\b/, 
        /\by nghia cua bieu tuong\b/, 
        /\by nghia trong tho\b/, 
        /\btuong trung cho\b/,
        /\by nghia cua\b/  // Generic fallback
    ])) return 'explain-symbol';

    if (has(text, [
        /\bdien tich\b/, 
        /\bdien co\b/, 
        /\bnguon goc dien\b/,
        /\bdien xua\b/
    ])) return 'explain-allusion';

    // --- ĐỊNH NGHĨA ---
    if (has(text, [
        /\bla gi\b/, 
        /\bnghia la gi\b/, 
        /\bdinh nghia\b/, 
        /\bgiai thich tu\b/, 
        /\bkhai niem\b/,
        /\bco nghia la gi\b/
    ])) return 'define-term';

    if (has(text, [
        /\bthe loai\b/, 
        /\bthe tho\b/, 
        /\btho luc bat\b/, 
        /\btho that ngon\b/,
        /\btho tu do\b/
    ])) return 'define-genre';

    return null;
}

// =====================================================================
// PHẦN 5: INPUT AI - BỘ ĐIỀU PHỐI Ý ĐỊNH ĐẦU VÀO
// =====================================================================

export const InputAI = {
    /**
     * Phân tích câu hỏi và trả về Intent.
     * 
     * @param {string} input - Câu hỏi thô từ người dùng
     * @returns {Object} Intent object với { type, mode, query, confidence, signals }
     */
    parseIntent(input) {
        const original = String(input || '').trim();
        
        // =========================================================
        // BƯỚC 1: XỬ LÝ RỖNG & LÀM SẠCH CƠ BẢN
        // =========================================================
        if (!original) {
            return result('empty', 'empty', '', { confidence: 1, originalInput: original });
        }

        let clean = removeOpeningWords(original);
        clean = removeTrailingParticles(clean);
        
        if (!clean) {
            return result('empty', 'empty', '', { confidence: 1, originalInput: original });
        }

        const normalized = normalizeText(clean);
        const hasQuestionMark = /[?？]/.test(original);

        // =========================================================
        // BƯỚC 2: NHẬN DIỆN COMMAND (Ưu tiên cao nhất)
        // =========================================================
        const command = detectCommand(normalized);
        if (command) {
            const query = cleanQuery(clean, command);
            return result(command, 'command', query, {
                confidence: 0.95,
                signals: ['explicit-command', command],
                originalInput: original
            });
        }

        // =========================================================
        // BƯỚC 3: NHẬN DIỆN CÂU HỎI CHUYÊN MÔN
        // =========================================================
        const special = detectSpecialQuestion(normalized);
        if (special) {
            const query = cleanQuery(clean, special);
            return result(special, 'question', query, {
                questionType: special,
                confidence: 0.9,
                signals: ['special-question', special, ...(hasQuestionMark ? ['has-question-mark'] : [])],
                originalInput: original
            });
        }

        // =========================================================
        // BƯỚC 4: NHẬN DIỆN CÂU HỎI TỔNG QUÁT (Question Form)
        // =========================================================
        const questionType = detectQuestionForm(normalized);
        if (questionType) {
            // Đối với câu hỏi tổng quát, giữ nguyên query (không extract)
            // vì không biết chắc chắn đâu là thực thể.
            return result('search', 'question', clean, {
                questionType,
                confidence: 0.85,
                signals: ['question-structure', questionType, ...(hasQuestionMark ? ['has-question-mark'] : [])],
                originalInput: original
            });
        }

        // =========================================================
        // BƯỚC 5: CÓ DẤU HỎI NHƯNG KHÔNG NHẬN DIỆN ĐƯỢC DẠNG CÂU
        // =========================================================
        if (hasQuestionMark) {
            return result('search', 'question', clean, {
                questionType: 'general',
                confidence: 0.65,
                signals: ['question-punctuation-only'],
                originalInput: original
            });
        }

        // =========================================================
        // BƯỚC 6: MẶC ĐỊNH - TRUY VẤN TÌM KIẾM (Search)
        // =========================================================
        return result('search', 'search', clean, {
            questionType: null,
            confidence: 0.75,
            signals: ['topic-query'],
            originalInput: original
        });
    }
};
