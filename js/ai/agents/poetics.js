/**
 * ==========================================================
 * VĂN ĐẠO AI - POETICS AGENT (js/ai/agents/poetics.js)
 * Vị trí: js/ai/agents/poetics.js
 * Version: 1.5.0 (Hybrid Dictionary Integration)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tra cứu từ điển (Biểu tượng, Điển tích, Hán Việt, Tu từ...).
 * - Giải thích các khái niệm thi pháp.
 * 
 * TRIẾT LÝ THIẾT KẾ (v1.5.0):
 * - Áp dụng kiến trúc Từ điển Lai (Hybrid):
 *   1. Tra cứu RAM (Đồng bộ): Symbols & Điển tích (Nhẹ, tốc độ cao).
 *   2. Tra cứu IndexedDB (Bất đồng bộ): Hán Việt (Nặng, giải phóng RAM).
 * - Không bao giờ load han-viet.json vào RAM để tránh crash thiết bị yếu.
 * - Luôn có Fallback graceful khi không tìm thấy.
 * ==========================================================
 */

import { getDictionaryIndex } from '../core.js';
import { DictionaryDB } from '../../network/dictionary-db.js';
import { normalizeRouteText } from '../../utils.js';

export const PoeticsAgent = {
    // =================================================================
    // 1. HÀM TRA CỨU CHÍNH (Dùng cho cả Agent và MasterAI)
    // =================================================================
    /**
     * Giải nghĩa Biểu tượng / Điển tích / Từ Hán Việt / Thuật ngữ thi pháp.
     * 
     * @param {string} keyword - Từ khóa cần tra cứu (VD: "trăng", "tái ông thất mã")
     * @returns {Promise<Object>} Kết quả chuẩn { answer, detail, source, meta }
     */
    async explainSymbol(keyword) {
        // GUARD: Từ khóa quá ngắn hoặc rỗng
        if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2) {
            return {
                answer: 'Từ khóa quá ngắn để tra cứu. Vui lòng nhập rõ hơn (VD: "ý nghĩa của trăng").',
                source: 'dictionary'
            };
        }

        const q = normalizeRouteText(keyword);

        // -----------------------------------------------------------------
        // BƯỚC 1: Tra cứu chính xác trong IndexedDB (Hán Việt)
        // (Ưu tiên DB vì Hán Việt thường có nghĩa cụ thể, rõ ràng)
        // -----------------------------------------------------------------
        try {
            const exactDbMatch = await DictionaryDB.getExact(q);
            if (exactDbMatch) {
                return {
                    answer: exactDbMatch.mean || 'Chưa có thông tin giải nghĩa chi tiết.',
                    detail: `[Hán Việt] ${exactDbMatch.keyword}`,
                    source: 'dictionary',
                    meta: []
                };
            }
        } catch (err) {
            console.warn('[POETICS] Lỗi tra cứu IndexedDB (có thể chưa nạp data):', err);
            // Không throw, tiếp tục fallback xuống RAM
        }

        // -----------------------------------------------------------------
        // BƯỚC 2: Tra cứu chính xác trong RAM (Biểu tượng & Điển tích)
        // -----------------------------------------------------------------
        const allEntries = await getDictionaryIndex();
        let found = allEntries.find(item => item.normalizedKeyword === q);

        // -----------------------------------------------------------------
        // BƯỚC 3: Nếu không có, tìm gần đúng trong RAM (Partial Match)
        // -----------------------------------------------------------------
        if (!found) {
            const partialMatches = allEntries.filter(item => 
                item.normalizedKeyword.includes(q) || q.includes(item.normalizedKeyword)
            );
            
            if (partialMatches.length > 0) {
                // Ưu tiên kết quả có độ dài từ khóa gần nhất
                partialMatches.sort((a, b) => 
                    Math.abs(a.normalizedKeyword.length - q.length) - Math.abs(b.normalizedKeyword.length - q.length)
                );
                found = partialMatches[0];
            }
        }

        // -----------------------------------------------------------------
        // BƯỚC 4: Nếu vẫn không có, tìm gần đúng trong IndexedDB (Hán Việt)
        // -----------------------------------------------------------------
        if (!found) {
            try {
                const dbMatches = await DictionaryDB.searchPartial(q, 1);
                if (dbMatches.length > 0) {
                    const match = dbMatches[0];
                    return {
                        answer: match.mean || 'Chưa có thông tin giải nghĩa chi tiết.',
                        detail: `[Hán Việt - Gợi ý] ${match.keyword}`,
                        source: 'dictionary',
                        meta: []
                    };
                }
            } catch (err) {
                console.warn('[POETICS] Lỗi tìm kiếm gần đúng IndexedDB:', err);
            }
        }

        // -----------------------------------------------------------------
        // BƯỚC 5: Trả kết quả từ RAM (nếu tìm thấy)
        // -----------------------------------------------------------------
        if (found) {
            return {
                answer: found.mean || 'Chưa có thông tin giải nghĩa chi tiết.',
                detail: `[${found.type}] ${found.keyword}`,
                source: 'dictionary',
                meta: []
            };
        }

        // -----------------------------------------------------------------
        // BƯỚC 6: Không tìm thấy bất kỳ đâu
        // -----------------------------------------------------------------
        return {
            answer: `Không tìm thấy giải nghĩa cho "${keyword}" trong từ điển.`,
            detail: 'Bạn có thể thử tra cứu các từ khóa khác như: trăng, liễu, tái ông thất mã, hán việt...',
            source: 'dictionary',
            meta: []
        };
    },

    // =================================================================
    // 2. HÀM TRA CỨU NÂNG CAO (Trả về danh sách)
    // =================================================================
    /**
     * Tra cứu nâng cao: Trả về danh sách nhiều kết quả thay vì chỉ 1.
     * 
     * @param {string} query - Từ khóa tìm kiếm
     * @returns {Promise<Object>}
     */
    async searchDictionary(query) {
        if (!query || typeof query !== 'string') {
            return { answer: 'Vui lòng nhập từ khóa cần tìm.', source: 'dictionary', meta: [] };
        }

        const q = normalizeRouteText(query);
        const results = [];

        // 1. Tìm trong RAM trước (Symbols, Điển tích)
        const allEntries = await getDictionaryIndex();
        const ramMatches = allEntries
            .filter(item => item.normalizedKeyword.includes(q))
            .slice(0, 5)
            .map(item => ({ keyword: item.keyword, type: item.type, mean: item.mean }));

        results.push(...ramMatches);

        // 2. Nếu chưa đủ 5 kết quả, tìm thêm trong IndexedDB (Hán Việt)
        if (results.length < 5) {
            try {
                const dbResults = await DictionaryDB.searchPartial(q, 5 - results.length);
                dbResults.forEach(item => {
                    results.push({ keyword: item.keyword, type: 'Hán Việt', mean: item.mean });
                });
            } catch (err) {
                console.warn('[POETICS] Lỗi searchPartial IndexedDB:', err);
            }
        }

        // 3. Trả kết quả
        if (results.length > 0) {
            return {
                answer: `Tìm thấy ${results.length} mục từ liên quan đến "${query}".`,
                detail: 'Chi tiết bên dưới:',
                source: 'dictionary',
                meta: results // Sẽ render dạng list ở OutputAI
            };
        }

        return {
            answer: `Không có kết quả nào cho "${query}".`,
            source: 'dictionary',
            meta: []
        };
    }
};

// =====================================================================
// AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
/**
 * Metadata tự mô tả của PoeticsAgent.
 * Chuyên trách Từ điển, Biểu tượng, Điển tích, Thuật ngữ.
 */
PoeticsAgent.agentInfo = {
    key: 'poetics',
    name: 'Thi Pháp AI',
    description: 'Chuyên trách Từ điển, Biểu tượng, Điển tích, Thuật ngữ.',

    capabilities: {
        'explain-symbol': 'explainSymbol',
        'explain-allusion': 'explainSymbol',
        'define-term': 'explainSymbol'
    },

    canRead: ['work', 'symbol', 'term', 'genre', 'allusion'],
    canDelegate: ['literature', 'knowledge'],

    intentPatterns: {
        'explain-symbol': ['y nghia', 'bieu tuong', 'hinh tuong', 'hinh anh', 'tuong trung'],
        'explain-allusion': ['dien tich', 'dien co', 'nguon goc dien'],
        'define-term': ['dinh nghia', 'giai thich', 'khai niem', 'thuat ngu']
    },

    specialDetector: (text) => {
        if (!text || typeof text !== 'string') return null;

        const words = new Set(text.split(' '));
        const hasAny = (arr) => arr.some(w => words.has(w));

        if (hasAny(['bieu', 'tuong', 'hinh', 'anh', 'y', 'nghia'])) {
            return 'explain-symbol';
        }
        if (hasAny(['dien', 'tich', 'co', 'nguon', 'goc'])) {
            return 'explain-allusion';
        }
        if (hasAny(['dinh', 'nghia', 'khai', 'niem', 'thuat', 'ngu'])) {
            return 'define-term';
        }

        return null;
    }
};
