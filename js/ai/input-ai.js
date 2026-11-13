/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 3.2.1 (Semantic Parser & History Integration)
 * ==========================================================
 * NHIỆM VỤ:
 * 1. Phân biệt câu hỏi (question), mệnh lệnh (command), hay tìm kiếm (search).
 * 2. Trả về 2 lớp thông tin: type (định tuyến) và mode (ngữ cảnh).
 * 3. Trích xuất chính xác "thực thể" (entity) từ câu hỏi tự nhiên.
 * 4. Hỗ trợ các câu hỏi về lịch sử, thời đại (HistoryAgent).
 * ==========================================================
 */

import { extractEntity } from './core.js';

// =====================================================================
// PHẦN 1: CÔNG CỤ XỬ LÝ NGÔN NGỮ
// =====================================================================

function normalizeText(text = '') {
    return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, ' ')
        .trim();
}

function has(text, patterns) {
    return patterns.some(pattern => pattern.test(text));
}

function removeOpeningWords(text) {
    return text.replace(
        /^(xin hỏi|cho tôi hỏi|cho mình hỏi|giúp tôi|giúp mình|hãy|làm ơn|vui lòng|cho tôi biết|cho mình biết|thưa|kính thưa)\s+/i,
        ''
    ).trim();
}

/**
 * [CẬP NHẬT] Cắt bỏ các từ để hỏi ở cuối câu.
 * Giải quyết lỗi: "Truyện Kiều viết thời nào" -> Cắt chữ "nào".
 */
function removeTrailingParticles(text) {
    return text.replace(/\s+(không|ạ|nhỉ|vậy|thế|đó|đấy|đó ạ|vậy ạ|nào|gì|sao)\s*$/i, '').trim();
}

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

const EXTRACTION_PATTERNS = {
    // [CẬP NHẬT] Thêm "giống" vào bộ lọc của find-related
    'find-related': [
        /\b(tác phẩm|bài thơ|bài viết|tiểu thuyết|truyện ngắn|truyện dài)\b/gi,
        /\b(nào|gì|chi)\b/gi,
        /\b(liên quan đến|liên quan|tương tự|giống như|giống|tương đồng|cùng|gần giống)\b/gi,
        /\b(với|đến|như|tới)\b/gi,
        /\b(có|cho tôi|cho mình|tìm|liệt kê|kể tên)\b/gi,
        /\b(thể loại|tác giả|chủ đề)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'list-author-works': [
        /\b(liệt kê|kể tên|thống kê|tìm|cho tôi|cho mình|xem)\b/gi,
        /\b(tác phẩm|bài thơ|bài viết|tiểu thuyết|truyện ngắn|truyện dài|sáng tác)\b/gi,
        /\b(của|thuộc về|do)\b/gi,
        /\b(những|những tác phẩm|những bài|những sáng tác)\b/gi,
        /\b(nào|gì|chi)\b/gi,
        /\b(viết|sáng tác|có)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'find-author-info': [
        /\b(tiểu sử|cuộc đời|sự nghiệp|thông tin|hồ sơ|chân dung|giới thiệu)\b/gi,
        /\b(của|về|cho|nói về|kể về)\b/gi,
        /\b(tác giả|nhà thơ|nhà văn|nhân vật)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'find-author-of': [
        /\b(ai là|ai viết|ai sáng tác|là ai|của ai|người nào|tác giả nào)\b/gi,
        /\b(tác giả|tác phẩm)\b/gi,
        /\b(của|cho)\b/gi,
        /\b(là|viết|sáng tác)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'summarize-work': [
        /\b(tóm tắt|kể lại|trình bày|nội dung chính|ý chính)\b/gi,
        /\b(nội dung|tác phẩm|bài thơ|bài viết|truyện ngắn|truyện dài|tiểu thuyết)\b/gi,
        /\b(của|về)\b/gi,
        /\b(cho tôi|cho mình|giúp)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'analyze-work': [
        /\b(phân tích|bình giảng|cảm nhận|đánh giá|bình luận|mổ xẻ)\b/gi,
        /\b(tác phẩm|bài thơ|bài viết|truyện ngắn|truyện dài|tiểu thuyết|đoạn thơ|đoạn văn)\b/gi,
        /\b(của|về)\b/gi,
        /\b(cho tôi|cho mình|giúp)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'recommend': [
        /\b(gợi ý|đề xuất|nên đọc|muốn đọc|tìm|giới thiệu)\b/gi,
        /\b(tác phẩm|bài thơ|truyện|sách|thơ|tiểu thuyết)\b/gi,
        /\b(nào|gì|hay|thú vị)\b/gi,
        /\b(thể loại|chủ đề|về)\b/gi,
        /\b(cho tôi|cho mình)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'explain-symbol': [
        /\b(ý nghĩa|biểu tượng|hình tượng|hình ảnh|tượng trưng|ẩn dụ)\b/gi,
        /\b(của|trong|về)\b/gi,
        /\b(là gì|thế nào|ra sao|như thế nào)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'explain-allusion': [
        /\b(điển tích|điển cố|nguồn gốc điển|tích cũ|điển xưa)\b/gi,
        /\b(của|về|trong)\b/gi,
        /\b(là gì|thế nào|ra sao)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'define-term': [
        /\b(định nghĩa|giải thích|khái niệm|tìm hiểu|định danh)\b/gi,
        /\b(là gì|nghĩa là gì|được hiểu là gì|có nghĩa là gì)\b/gi,
        /\b(từ|thuật ngữ|khái niệm)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'define-genre': [
        /\b(định nghĩa|giải thích|khái niệm|tìm hiểu)\b/gi,
        /\b(thể loại|thể thơ|loại thơ)\b/gi,
        /\b(là gì|thế nào|ra sao)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    // Pattern cho Lịch sử
    'find-works-by-era': [
        /\b(tác phẩm|bài thơ|truyện|tiểu thuyết)\b/gi,
        /\b(thời|thuộc thời|thời kỳ|triều đại|nhà)\b/gi,
        /\b(nào|gì)\b/gi,
        /\b(có|cho tôi|cho mình|tìm|liệt kê)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'find-authors-by-era': [
        /\b(tác giả|nhà thơ|nhà văn)\b/gi,
        /\b(thời|thuộc thời|thời kỳ|triều đại|nhà)\b/gi,
        /\b(nào|gì|ai)\b/gi,
        /\b(có|cho tôi|cho mình|tìm|liệt kê)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    'get-historical-context': [
        /\b(viết|sáng tác|thuộc|hoạt động)\b/gi,
        /\b(thời|thời kỳ|triều đại|năm nào|khi nào)\b/gi,
        /\b(bối cảnh|hoàn cảnh|lịch sử)\b/gi,
        /\b(là gì|thế nào|ra sao)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ],
    
    'default': [
        /\b(tìm|kiếm|tra cứu|cho tôi|cho mình)\b/gi,
        /\b(không|ạ|nhỉ|vậy)\b/gi
    ]
};

function cleanQuery(text, intentType = 'default') {
    let result = text;
    const patterns = EXTRACTION_PATTERNS[intentType] || EXTRACTION_PATTERNS['default'];
    
    if (patterns.length) {
        try { result = extractEntity(text, patterns) || text; } 
        catch (error) { console.warn('[InputAI] Entity extraction error:', error); }
    }
    
    // Làm sạch lần cuối: Cắt khoảng trắng, dấu câu, và các từ hỏi ở cuối (nếu lọt)
    return String(result)
        .replace(/^[\s,.:;!?'"“”‘’()[\]{}]+/, '')
        .replace(/[\s,.:;!?'"“”‘’()[\]{}]+$/, '')
        .replace(/\s+(nao|gi|the|vay)$/i, '') // Lớp bảo vệ cuối cùng
        .replace(/\s+/g, ' ')
        .trim();
}

// =====================================================================
// PHẦN 3: NHẬN DIỆN CẤU TRÚC CÂU
// =====================================================================

function detectQuestionForm(text) {
    const patterns = [
        { type: 'definition', regex: /(^|\s)(la gi|nghia la gi|duoc hieu la gi|la nhu the nao)(\s|$)/ },
        { type: 'reason', regex: /(^|\s)(tai sao|vi sao|vi ly do gi|nguyen nhan nao)(\s|$)/ },
        { type: 'identity', regex: /(^|\s)(ai la|ai viet|ai sang tac|tac gia nao|nguoi nao)(\s|$)/ },
        { type: 'time', regex: /(^|\s)(khi nao|bao gio|vao thoi nao|thoi nao)(\s|$)/ },
        { type: 'explanation', regex: /(^|\s)(y nghia la gi|co y nghia gi|noi len dieu gi)(\s|$)/ }
    ];
    for (const item of patterns) {
        if (item.regex.test(text)) return item.type;
    }
    return null;
}

// =====================================================================
// PHẦN 4: NHẬN DIỆN Ý ĐỊNH (INTENT DETECTION)
// =====================================================================

function detectCommand(text) {
    // 1. NHÓM LỊCH SỬ (Ưu tiên cao nhất)
    if (has(text, [/\btac pham thoi\b/, /\btac pham thuoc thoi\b/, /\bvan hoc thoi\b/, /\btac pham trieu dai\b/])) 
        return 'find-works-by-era';
    
    if (has(text, [/\btac gia thoi\b/, /\bnhung nha tho thoi\b/, /\bnhung nha van thoi\b/, /\btac gia thuoc thoi\b/])) 
        return 'find-authors-by-era';
    
    if (has(text, [/\bviet thoi nao\b/, /\bthuoc thoi nao\b/, /\bhoat dong thoi\b/, /\bboi canh lich su\b/])) 
        return 'get-historical-context';

    // 2. NHÓM MẠNG LƯỚI TRI THỨC [ĐÃ THÊM "GIỐNG"]
    if (has(text, [/\btac pham lien quan\b/, /\blien quan den\b/, /\btuong tu\b/, /\bgiong\b/, /\bcung the loai\b/, /\bcung tac gia\b/])) 
        return 'find-related';
    if (has(text, [/\btac pham cua\b/, /\bsang tac nhung tac pham nao\b/, /\bco nhung tac pham nao\b/, /\bliet ke\b/])) 
        return 'list-author-works';

    // 3. NHÓM HÀNH ĐỘNG VĂN HỌC
    if (has(text, [/\bphan tich\b/, /\bbinh giang\b/, /\bcam nhan\b/, /\bdanh gia\b/])) return 'analyze-work';
    if (has(text, [/\btom tat\b/, /\bke lai\b/, /\bnoi dung chinh\b/])) return 'summarize-work';
    if (has(text, [/\bgoi y\b/, /\bde xuat\b/, /\bnen doc\b/, /\bmuon doc\b/])) return 'recommend';
    
    return null;
}

function detectSpecialQuestion(text) {
    if (has(text, [/\bai la tac gia\b/, /\bai viet\b/, /\bai sang tac\b/, /\btac gia cua\b/])) return 'find-author-of';
    if (has(text, [/\btieu su\b/, /\bcuoc doi cua\b/, /\bsu nghiep cua\b/, /\bthong tin ve tac gia\b/])) return 'find-author-info';
    if (has(text, [/\bbieu tuong\b/, /\bhinh tuong\b/, /\by nghia cua\b/, /\btuong trung cho\b/])) return 'explain-symbol';
    if (has(text, [/\bdien tich\b/, /\bdien co\b/, /\bnguon goc dien\b/])) return 'explain-allusion';
    if (has(text, [/\bla gi\b/, /\bnghia la gi\b/, /\bdinh nghia\b/, /\bkhai niem\b/])) return 'define-term';
    if (has(text, [/\bthe loai\b/, /\bthe tho\b/])) return 'define-genre';
    return null;
}

// =====================================================================
// PHẦN 5: INPUT AI - BỘ ĐIỀU PHỐI Ý ĐỊNH ĐẦU VÀO
// =====================================================================

export const InputAI = {
    parseIntent(input) {
        const original = String(input || '').trim();
        if (!original) return result('empty', 'empty', '', { confidence: 1, originalInput: original });

        let clean = removeOpeningWords(original);
        clean = removeTrailingParticles(clean); // Cắt đuôi từ hỏi (nào, gì...)
        if (!clean) return result('empty', 'empty', '', { confidence: 1, originalInput: original });

        const normalized = normalizeText(clean);
        const hasQuestionMark = /[?？]/.test(original);

        // 1. Command (Mệnh lệnh / Yêu cầu)
        const command = detectCommand(normalized);
        if (command) {
            const query = cleanQuery(clean, command);
            return result(command, 'command', query, { confidence: 0.95, signals: ['explicit-command', command], originalInput: original });
        }

        // 2. Special Question (Câu hỏi chuyên môn)
        const special = detectSpecialQuestion(normalized);
        if (special) {
            const query = cleanQuery(clean, special);
            return result(special, 'question', query, { questionType: special, confidence: 0.9, signals: ['special-question', special, ...(hasQuestionMark ? ['has-question-mark'] : [])], originalInput: original });
        }

        // 3. General Question Form (Câu hỏi tổng quát)
        const questionType = detectQuestionForm(normalized);
        if (questionType) {
            return result('search', 'question', clean, { questionType, confidence: 0.85, signals: ['question-structure', questionType], originalInput: original });
        }

        // 4. Fallback: Search (Tìm kiếm thông thường)
        return result('search', 'search', clean, { questionType: null, confidence: 0.75, signals: ['topic-query'], originalInput: original });
    }
};
