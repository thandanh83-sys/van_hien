/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 3.2.0 (Semantic Parser & History Integration)
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

function removeTrailingParticles(text) {
    return text.replace(/\s+(không|ạ|nhỉ|vậy|thế|đó|đấy|đó ạ|vậy ạ)\s*$/i, '').trim();
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
    // ... (Giữ nguyên các pattern cũ cho Văn học, Thi pháp, Tri thức)
    'find-related': [/\b(tác phẩm|bài thơ|liên quan|tương tự|giống|cùng)\b/gi, /\b(nào|gì|với|đến|như)\b/gi, /\b(có|tìm|liệt kê)\b/gi],
    'list-author-works': [/\b(liệt kê|kể tên|tác phẩm|sáng tác|của|viết)\b/gi, /\b(nào|gì)\b/gi],
    'find-author-info': [/\b(tiểu sử|cuộc đời|sự nghiệp|thông tin|tác giả)\b/gi, /\b(của|về|cho|nói về)\b/gi],
    'find-author-of': [/\b(ai là|ai viết|tác giả|của ai)\b/gi, /\b(tác phẩm|bài thơ)\b/gi],
    'summarize-work': [/\b(tóm tắt|kể lại|nội dung chính|tác phẩm|bài thơ)\b/gi],
    'analyze-work': [/\b(phân tích|bình giảng|cảm nhận|đánh giá|tác phẩm|bài thơ)\b/gi],
    'recommend': [/\b(gợi ý|đề xuất|nên đọc|tìm|tác phẩm|truyện|thơ)\b/gi],
    'explain-symbol': [/\b(ý nghĩa|biểu tượng|hình tượng|hình ảnh|của|trong|là gì)\b/gi],
    'explain-allusion': [/\b(điển tích|điển cố|nguồn gốc|là gì)\b/gi],
    'define-term': [/\b(định nghĩa|giải thích|khái niệm|là gì|nghĩa là gì)\b/gi],
    'define-genre': [/\b(định nghĩa|thể loại|thể thơ|là gì)\b/gi],

    // [MỚI] Pattern cho Lịch sử
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
    
    'default': [/\b(tìm|kiếm|tra cứu|cho tôi|cho mình)\b/gi, /\b(không|ạ|nhỉ|vậy)\b/gi]
};

function cleanQuery(text, intentType = 'default') {
    let result = text;
    const patterns = EXTRACTION_PATTERNS[intentType] || EXTRACTION_PATTERNS['default'];
    
    if (patterns.length) {
        try { result = extractEntity(text, patterns) || text; } 
        catch (error) { console.warn('[InputAI] Entity extraction error:', error); }
    }
    
    return String(result)
        .replace(/^[\s,.:;!?'"“”‘’()[\]{}]+/, '')
        .replace(/[\s,.:;!?'"“”‘’()[\]{}]+$/, '')
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
    // 1. NHÓM LỊCH SỬ (Ưu tiên cao nhất vì dễ nhầm với tìm kiếm)
    if (has(text, [/\btac pham thoi\b/, /\btac pham thuoc thoi\b/, /\bvan hoc thoi\b/, /\btac pham trieu dai\b/])) 
        return 'find-works-by-era';
    
    if (has(text, [/\btac gia thoi\b/, /\bnhung nha tho thoi\b/, /\bnhung nha van thoi\b/, /\btac gia thuoc thoi\b/])) 
        return 'find-authors-by-era';
    
    if (has(text, [/\bviet thoi nao\b/, /\bthuoc thoi nao\b/, /\bhoat dong thoi\b/, /\bboi canh lich su\b/])) 
        return 'get-historical-context';

    // 2. NHÓM MẠNG LƯỚI TRI THỨC
    if (has(text, [/\btac pham lien quan\b/, /\blien quan den\b/, /\btuong tu\b/, /\bcung the loai\b/, /\bcung tac gia\b/])) 
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
        clean = removeTrailingParticles(clean);
        if (!clean) return result('empty', 'empty', '', { confidence: 1, originalInput: original });

        const normalized = normalizeText(clean);
        const hasQuestionMark = /[?？]/.test(original);

        // 1. Command
        const command = detectCommand(normalized);
        if (command) {
            const query = cleanQuery(clean, command);
            return result(command, 'command', query, { confidence: 0.95, signals: ['explicit-command', command], originalInput: original });
        }

        // 2. Special Question
        const special = detectSpecialQuestion(normalized);
        if (special) {
            const query = cleanQuery(clean, special);
            return result(special, 'question', query, { questionType: special, confidence: 0.9, signals: ['special-question', special, ...(hasQuestionMark ? ['has-question-mark'] : [])], originalInput: original });
        }

        // 3. General Question Form
        const questionType = detectQuestionForm(normalized);
        if (questionType) {
            return result('search', 'question', clean, { questionType, confidence: 0.85, signals: ['question-structure', questionType], originalInput: original });
        }

        // 4. Fallback: Search
        return result('search', 'search', clean, { questionType: null, confidence: 0.75, signals: ['topic-query'], originalInput: original });
    }
};
