/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI 2.0 (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 2.0.0 (Semantic Parser)
 * ==========================================================
 * NHIỆM VỤ:
 * 1. Phân biệt câu hỏi, tìm kiếm và yêu cầu thực hiện.
 * 2. Trả về 2 lớp thông tin: type (định tuyến) và mode (ngữ cảnh).
 * 3. Không phụ thuộc vào dấu hỏi (?).
 * ==========================================================
 */

import { extractEntity } from './core.js';

// ----------------------------------------------------------
// 1. CÔNG CỤ XỬ LÝ NGÔN NGỮ
// ----------------------------------------------------------
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
        /^(xin hỏi|cho tôi hỏi|cho mình hỏi|giúp tôi|giúp mình|hãy|làm ơn|vui lòng|cho tôi biết|cho mình biết)\s+/i,
        ''
    ).trim();
}

function cleanQuery(text, patterns = []) {
    let result = text;
    if (patterns.length) {
        try {
            result = extractEntity(text, patterns) || text;
        } catch (error) {
            console.warn('[InputAI] Entity extraction error:', error);
        }
    }
    return String(result)
        .replace(/^[\s,.:;!?'"“”‘’()[\]{}]+/, '')
        .replace(/[\s,.:;!?'"“”‘’()[\]{}]+$/, '')
        .trim();
}

function result(type, mode, query, extra = {}) {
    return {
        type,
        mode,
        query: query || '',
        questionType: extra.questionType || null,
        confidence: extra.confidence ?? 0.7,
        needsClarification: extra.needsClarification ?? false,
        signals: extra.signals || [],
        originalInput: extra.originalInput || '',
        ...extra
    };
}

// ----------------------------------------------------------
// 2. NHẬN DIỆN CẤU TRÚC CÂU
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// 3. NHẬN DIỆN YÊU CẦU THỰC HIỆN
// ----------------------------------------------------------
function detectCommand(text) {
    if (has(text, [/\bphan tich\b/, /\bbinh giang\b/, /\bcam nhan\b/, /\bdanh gia\b/])) return 'analyze-work';
    if (has(text, [/\btom tat\b/, /\bke lai\b/, /\bnoi dung chinh\b/, /\btrinh bay noi dung\b/])) return 'summarize-work';
    if (has(text, [/\bgoi y\b/, /\bde xuat\b/, /\bnen doc\b/, /\bmuon doc\b/, /\btim truyen\b/, /\btim tho\b/, /\btim tac pham\b/])) return 'recommend';
    if (has(text, [/\bso sanh\b/, /\bdoi chieu\b/, /\bkhac nhau giua\b/])) return 'compare-works';
    if (has(text, [/\bthong ke\b/, /\bliet ke\b/, /\bke ten\b/])) return 'list';
    if (has(text, [/\bboi\b/, /\bvan khi\b/, /\bgieo que\b/, /\bxin que\b/])) return 'fortune';
    return null;
}

// ----------------------------------------------------------
// 4. NHẬN DIỆN CÂU HỎI CHUYÊN MÔN
// ----------------------------------------------------------
function detectSpecialQuestion(text) {
    if (has(text, [/\bai la tac gia\b/, /\bai viet\b/, /\bai sang tac\b/, /\btac gia cua\b/, /\bnguoi viet\b/])) return 'find-author-of';
    if (has(text, [/\bbieu tuong\b/, /\bhinh tuong\b/, /\by nghia cua hinh anh\b/, /\by nghia cua bieu tuong\b/, /\by nghia trong tho\b/, /\btuong trung cho\b/])) return 'explain-symbol';
    if (has(text, [/\bdien tich\b/, /\bdien co\b/, /\bnguon goc dien\b/])) return 'explain-allusion';
    if (has(text, [/\bla gi\b/, /\bnghia la gi\b/, /\bdinh nghia\b/, /\bgiai thich tu\b/, /\bkhai niem\b/])) return 'define-term';
    if (has(text, [/\bthe loai\b/, /\bthe tho\b/, /\btho luc bat\b/, /\btho that ngon\b/])) return 'define-genre';
    if (has(text, [/\btieu su\b/, /\bcuoc doi cua\b/, /\bsu nghiep cua\b/, /\bthong tin ve tac gia\b/])) return 'find-author-info';
    return null;
}

// ----------------------------------------------------------
// 5. INPUT AI - BỘ ĐIỀU PHỐI Ý ĐỊNH ĐẦU VÀO
// ----------------------------------------------------------
export const InputAI = {
    parseIntent(input) {
        const original = String(input || '').trim();
        if (!original) {
            return result('empty', 'empty', '', { confidence: 1, originalInput: original });
        }

        const clean = removeOpeningWords(original);
        const normalized = normalizeText(clean);
        const hasQuestionMark = /[?？]/.test(original);

        // 1. Xác định yêu cầu thực hiện trước (Command)
        const command = detectCommand(normalized);
        if (command) {
            const query = cleanQuery(clean, [
                /(phân tích|bình giảng|cảm nhận|đánh giá|tóm tắt|kể lại|nội dung chính|gợi ý|đề xuất|nên đọc|muốn đọc|tìm|so sánh|đối chiếu|thống kê|liệt kê|kể tên|bói|gieo quẻ)/gi
            ]);
            return result(command, 'command', query, {
                confidence: 0.95,
                signals: ['explicit-command'],
                originalInput: original
            });
        }

        // 2. Nhận diện ý định chuyên môn (Special Question)
        const special = detectSpecialQuestion(normalized);
        if (special) {
            const query = cleanQuery(clean, [
                /(ý nghĩa của|ý nghĩa|biểu tượng|hình tượng|hình ảnh|điển tích|điển cố|tác giả|ai là|ai viết|ai sáng tác|là gì|nghĩa là gì|định nghĩa|giải thích|khái niệm|thể loại|thể thơ|tiểu sử|cuộc đời của|sự nghiệp của|thông tin về)/gi
            ]);
            return result(special, 'question', query, {
                questionType: special,
                confidence: 0.9,
                signals: ['special-question'],
                originalInput: original
            });
        }

        // 3. Nhận diện câu hỏi tổng quát (General Question Form)
        const questionType = detectQuestionForm(normalized);
        if (questionType) {
            return result('search', 'question', clean, {
                questionType,
                confidence: 0.85,
                signals: ['question-structure', ...(hasQuestionMark ? ['question-punctuation'] : [])],
                originalInput: original
            });
        }

        // 4. Có dấu hỏi nhưng không nhận diện được dạng câu
        if (hasQuestionMark) {
            return result('search', 'question', clean, {
                questionType: 'general',
                confidence: 0.65,
                signals: ['question-punctuation'],
                originalInput: original
            });
        }

        // 5. Mặc định: Truy vấn tìm kiếm (Search)
        return result('search', 'search', clean, {
            questionType: null,
            confidence: 0.75,
            signals: ['topic-query'],
            originalInput: original
        });
    }
};