/**
 * ==========================================================
 * VĂN ĐẠO AI - INPUT AI (js/ai/input-ai.js)
 * Vị trí: js/ai/input-ai.js
 * Version: 8.0.0 (Special Detector Plugin Architecture)
 * ==========================================================
 *
 * NHIỆM VỤ:
 * 1. Nhận diện câu hỏi, mệnh lệnh, tìm kiếm.
 * 2. Tự động lấy từ khóa từ AgentRegistry (không hardcode).
 * 3. Hỗ trợ Special Detector: mỗi Agent có thể tự khai báo logic
 *    nhận diện đặc biệt (VD: compare cần cấu trúc "X và Y").
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v7.0.0: Full Dynamic Intent (đọc DynamicIntentPatterns).
 * - v8.0.0: Special Detector Plugin — thay hardcode
 *           `detectSpecialQuestion` bằng vòng lặp gọi
 *           `AgentRegistry.agents[key].specialDetector(text)`.
 *           Khi thêm Agent mới có logic đặc biệt, CHỈ CẦN khai báo
 *           `specialDetector` trong agentInfo — KHÔNG cần sửa file này.
 *
 * CƠ CHẾ NHẬN DIỆN (4 tầng ưu tiên):
 *   Tầng 1: detectCommand()        — từ khóa Intent (DynamicIntentPatterns)
 *   Tầng 2: detectSpecialQuestion() — specialDetector của từng Agent
 *   Tầng 3: Fallback 'search'      — tìm kiếm thông thường
 *   Tầng 4: Empty                  — input rỗng
 * ==========================================================
 */

import { extractEntity } from './core.js';
import { preprocessText } from './nlp-tools.js';
import { DynamicIntentPatterns, AgentRegistry } from './agents/index.js';

// =====================================================================
// PHẦN 1: CÔNG CỤ XỬ LÝ NGÔN NGỮ
// =====================================================================

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
// Giữ nguyên từ v7.0.0 — không thay đổi.
// =====================================================================
const EXTRACTION_PATTERNS = {
    'find-related': [/\b(tac pham|bai tho|bai viet|tieu thuyet|truyen ngan|truyen dai)\b/gi, /\b(nao|gi|chi)\b/gi, /\b(lien quan den|lien quan|tuong tu|giong nhu|giong|tuong dong|cung|gan giong)\b/gi, /\b(voi|den|nhu|toi)\b/gi, /\b(co|cho toi|cho minh|tim|liet ke|ke ten)\b/gi, /\b(the loai|tac gia|chu de)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'list-author-works': [/\b(liet ke|ke ten|thong ke|tim|cho toi|cho minh|xem)\b/gi, /\b(tac pham|bai tho|bai viet|tieu thuyet|truyen ngan|truyen dai|sang tac)\b/gi, /\b(cua|thuoc ve|do)\b/gi, /\b(nhung|nhung tac pham|nhung bai|nhung sang tac)\b/gi, /\b(nao|gi|chi)\b/gi, /\b(viet|sang tac|co)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'find-author-info': [/\b(tieu su|cuoc doi|su nghiep|thong tin|ho so|chan dung|gioi thieu)\b/gi, /\b(cua|ve|cho|noi ve|ke ve)\b/gi, /\b(tac gia|nha tho|nha van|nhan vat)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'find-author-of': [/\b(ai la|ai viet|ai sang tac|la ai|cua ai|nguoi nao|tac gia nao)\b/gi, /\b(tac gia|tac pham)\b/gi, /\b(cua|cho)\b/gi, /\b(la|viet|sang tac)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'summarize-work': [/\b(tom tat|ke lai|trinh bay|noi dung chinh|y chinh)\b/gi, /\b(noi dung|tac pham|bai tho|bai viet|truyen ngan|truyen dai|tieu thuyet)\b/gi, /\b(cua|ve)\b/gi, /\b(cho toi|cho minh|giup)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'analyze-work': [/\b(phan tich|binh giang|cam nhan|danh gia|binh luan|mo xe)\b/gi, /\b(tac pham|bai tho|bai viet|truyen ngan|truyen dai|tieu thuyet|doan tho|doan van)\b/gi, /\b(cua|ve)\b/gi, /\b(cho toi|cho minh|giup)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'recommend': [/\b(goi y|de xuat|nen doc|muon doc|tim|gioi thieu)\b/gi, /\b(tac pham|bai tho|truyen|sach|tho|tieu thuyet)\b/gi, /\b(nao|gi|hay|thu vi)\b/gi, /\b(the loai|chu de|ve)\b/gi, /\b(cho toi|cho minh)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'explain-symbol': [/\b(y nghia|bieu tuong|hinh tuong|hinh anh|tuong trung|an du)\b/gi, /\b(cua|trong|ve)\b/gi, /\b(la gi|the nao|ra sao|nhu the nao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'explain-allusion': [/\b(dien tich|dien co|nguon goc dien|tich cu|dien xua)\b/gi, /\b(cua|ve|trong)\b/gi, /\b(la gi|the nao|ra sao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'define-term': [/\b(dinh nghia|giai thich|khai niem|tim hieu|dinh danh)\b/gi, /\b(la gi|nghia la gi|duoc hieu la gi|co nghia la gi)\b/gi, /\b(tu|thuat ngu|khai niem)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'define-genre': [/\b(dinh nghia|giai thich|khai niem|tim hieu)\b/gi, /\b(the loai|the tho|loai tho)\b/gi, /\b(la gi|the nao|ra sao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'find-works-by-era': [/\b(tac pham|bai tho|truyen|tieu thuyet)\b/gi, /\b(thoi|thuoc thoi|thoi ky|trieu dai|nha)\b/gi, /\b(nao|gi)\b/gi, /\b(co|cho toi|cho minh|tim|liet ke)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'find-authors-by-era': [/\b(tac gia|nha tho|nha van)\b/gi, /\b(thoi|thuoc thoi|thoi ky|trieu dai|nha)\b/gi, /\b(nao|gi|ai)\b/gi, /\b(co|cho toi|cho minh|tim|liet ke)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'get-historical-context': [/\b(viet|sang tac|thuoc|hoat dong)\b/gi, /\b(thoi|thoi ky|trieu dai|nam nao|khi nao)\b/gi, /\b(boi canh|hoan canh|lich su)\b/gi, /\b(la gi|the nao|ra sao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'translate-work': [/\b(dich|translate|chuyen ngu|dich thuat|sang tieng anh|sang tieng viet)\b/gi, /\b(tac pham|bai tho|truyen|tieu thuyet|doan van)\b/gi, /\b(sang|qua|thanh)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'get-character-info': [/\b(nhan vat|character|nhan vat nao|thong tin nhan vat)\b/gi, /\b(trong|thuoc|cua)\b/gi, /\b(tac pham|truyen|bai tho)\b/gi, /\b(la ai|la gi|the nao)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'compare-entities': [/\b(so sanh|compare|giua|khac nhau|tuong dong|giong)\b/gi, /\b(va|voi|cung)\b/gi, /\b(tac gia|tac pham|truyen|bai tho)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'praise-work': [/\b(khen|ca ngoi|praise|dep|hay|tuyet voi)\b/gi, /\b(bai tho|tac pham|truyen)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'criticize-work': [/\b(che|phe binh|criticize|han che|do|te|kem)\b/gi, /\b(bai tho|tac pham|truyen)\b/gi, /\b(khong|a|nhi|vay)\b/gi],
    'default': [/\b(tim|kiem|tra cuu|cho toi|cho minh)\b/gi, /\b(khong|a|nhi|vay)\b/gi]
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
        .replace(/\s+(nao|gi|the|vay)$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// =====================================================================
// PHẦN 3: NHẬN DIỆN Ý ĐỊNH (TỰ ĐỘNG TỪ AGENTS)
// =====================================================================

/**
 * Tầng 1: Nhận diện Intent qua DynamicIntentPatterns (từ khóa).
 *
 * Ưu tiên đặc biệt:
 *   1. 'compare-entities' — cần cấu trúc "X và Y" HOẶC có từ khóa
 *      'so sanh', 'compare', 'khac', 'tuong dong'.
 *   2. Duyệt DynamicIntentPatterns — match keyword đầu tiên.
 *
 * @param {string} text - Câu đã chuẩn hóa (không dấu, lowercase).
 * @returns {string|null} - Intent type hoặc null.
 */
function detectCommand(text) {
    const words = new Set(text.split(' '));
    const hasAny = (arr) => arr.some(w => words.has(w));

    // 1. Ưu tiên logic đặc biệt (So sánh cần cấu trúc đặc biệt)
    if (hasAny(['so sanh', 'compare', 'khac', 'tuong dong']) ||
        (hasAny(['giong']) && hasAny(['va', 'voi']))) {
        return 'compare-entities';
    }

    // 2. Tự động nhận diện từ DynamicIntentPatterns
    for (const [intent, keywords] of Object.entries(DynamicIntentPatterns)) {
        if (keywords.some(kw => words.has(kw))) return intent;
    }

    return null;
}

/**
 * Tầng 2: Nhận diện Câu hỏi Chuyên môn qua `specialDetector` của Agent.
 *
 * [v8.0.0 — THAY ĐỔI CỐT LÕI]
 * Trước v8.0.0, hàm này hardcode 4 case:
 *   - if (hasAny(['bieu', 'tuong', ...])) return 'explain-symbol';
 *   - if (hasAny(['dien', 'tich', ...])) return 'explain-allusion';
 *   - if (hasAny(['dinh', 'nghia', ...])) return 'define-term';
 *   - if (hasAny(['the', 'loai', ...])) return 'define-genre';
 *
 * Sau v8.0.0, duyệt qua Registry và gọi `specialDetector(text)` của
 * từng Agent. Agent nào trả về intent → dừng và trả intent đó.
 *
 * Khi thêm Agent mới có logic đặc biệt, CHỈ CẦN khai báo
 * `specialDetector` trong `agentInfo` — KHÔNG cần sửa file này.
 *
 * @param {string} text - Câu đã chuẩn hóa.
 * @returns {string|null} - Intent type hoặc null.
 */
function detectSpecialQuestion(text) {
    // Duyệt qua tất cả Agent đã đăng ký
    for (const [agentKey, agent] of Object.entries(AgentRegistry.agents)) {
        // Bỏ qua Agent không có specialDetector
        if (typeof agent.specialDetector !== 'function') continue;

        try {
            const detected = agent.specialDetector(text);
            if (detected && typeof detected === 'string') {
                // Log debug để dev biết Agent nào đã nhận diện
                if (typeof window !== 'undefined' && window.VD_MASTER_DEBUG) {
                    console.log(`[InputAI] Agent "${agentKey}" specialDetector → "${detected}"`);
                }
                return detected;
            }
        } catch (err) {
            // specialDetector lỗi → log warning, tiếp tục thử Agent khác
            console.warn(
                `[InputAI] specialDetector của Agent "${agentKey}" báo lỗi:`,
                err.message || err
            );
        }
    }

    return null;
}

// =====================================================================
// PHẦN 4: INPUT AI - BỘ ĐIỀU PHỐI Ý ĐỊNH ĐẦU VÀO
// =====================================================================

export const InputAI = {
    /**
     * Phiên bản module — dùng cho audit/debug.
     */
    version: '8.0.0',

    /**
     * Phân tích câu hỏi thô thành intent object.
     *
     * LUỒNG XỬ LÝ:
     *   1. Validate input.
     *   2. Chuẩn hóa qua preprocessText() (bỏ dấu, teencode, ...).
     *   3. detectCommand()        — thử từ khóa Intent.
     *   4. detectSpecialQuestion() — thử specialDetector của Agent.
     *   5. Fallback 'search'.
     *
     * @param {string} input - Câu hỏi thô.
     * @returns {Object} - Intent object.
     */
    parseIntent(input) {
        const original = String(input || '').trim();
        if (!original) {
            return result('empty', 'empty', '', {
                confidence: 1,
                originalInput: original
            });
        }

        // 1. Chuẩn hóa
        const clean = preprocessText(original);
        if (!clean) {
            return result('empty', 'empty', '', {
                confidence: 1,
                originalInput: original
            });
        }

        // 2. Nhận diện Mệnh lệnh (Tầng 1 — từ khóa)
        const command = detectCommand(clean);
        if (command) {
            const query = cleanQuery(clean, command);
            return result(command, 'command', query, {
                confidence: 0.95,
                signals: ['explicit-command', command],
                originalInput: original
            });
        }

        // 3. Nhận diện Câu hỏi Chuyên môn (Tầng 2 — specialDetector)
        const special = detectSpecialQuestion(clean);
        if (special) {
            const query = cleanQuery(clean, special);
            return result(special, 'question', query, {
                questionType: special,
                confidence: 0.9,
                signals: ['special-question', special],
                originalInput: original
            });
        }

        // 4. Fallback: Tìm kiếm thông thường
        return result('search', 'search', clean, {
            questionType: null,
            confidence: 0.75,
            signals: ['topic-query'],
            originalInput: original
        });
    }
};
