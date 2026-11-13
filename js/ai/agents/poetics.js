/**
 * ==========================================================
 * VĂN ĐẠO AI - POETICS AGENT (js/ai/agents/poetics.js)
 * Vị trí: js/ai/agents/poetics.js
 * Version: 1.3.0 (Special Detector Support)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tra cứu từ điển (Biểu tượng, Điển tích, Hán Việt, Tu từ...).
 * - Giải thích các khái niệm thi pháp.
 * - Hỗ trợ tìm kiếm mờ (Fuzzy search) không phân biệt dấu.
 * 
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.2.0: Multi-Agent Specialist.
 * - v1.3.0: Thêm `specialDetector` trong agentInfo để tự nhận diện
 *           3 intent: explain-symbol, explain-allusion, define-term.
 *           Trước v1.3.0, logic này nằm hardcode trong input-ai.js.
 *           Toàn bộ logic nghiệp vụ giữ nguyên 100%.
 * ==========================================================
 */

import { getDictionaryIndex } from '../core.js';
import { normalizeRouteText } from '../../utils.js';

export const PoeticsAgent = {
    /**
     * 1. Giải nghĩa Biểu tượng / Điển tích / Từ ngữ thi pháp
     * Được gọi khi người dùng hỏi: "Ý nghĩa của trăng là gì?", "Tái ông thất mã nghĩa là gì?"
     * 
     * @param {string} keyword - Từ khóa cần tra cứu (VD: "trăng", "tái ông thất mã")
     * @returns {Object} - Kết quả chuẩn để MasterAI và OutputAI xử lý
     */
    async explainSymbol(keyword) {
        // Nếu từ khóa quá ngắn hoặc rỗng, trả về lỗi ngay
        if (!keyword || keyword.trim().length < 2) {
            return {
                answer: 'Từ khóa quá ngắn để tra cứu. Vui lòng nhập rõ hơn (VD: "ý nghĩa của trăng", "điển tích tái ông").',
                source: 'dictionary'
            };
        }

        // Lấy toàn bộ chỉ mục từ điển (đã được cache trong core.js để không bị chậm)
        const allEntries = getDictionaryIndex();
        const q = normalizeRouteText(keyword);

        // Bước 1: Tìm chính xác tuyệt đối (Exact Match)
        // Ví dụ gõ đúng "trăng" sẽ ưu tiên tìm ra mục "trăng" thay vì "ánh trăng"
        let found = allEntries.find(item => item.normalizedKeyword === q);

        // Bước 2: Nếu không có, tìm gần đúng (Partial Match)
        // Ví dụ gõ "tái ông" sẽ tìm thấy mục "tái ông thất mã"
        if (!found) {
            // Lọc ra các mục chứa từ khóa
            const partialMatches = allEntries.filter(item => 
                item.normalizedKeyword.includes(q) || q.includes(item.normalizedKeyword)
            );
            
            // Nếu có nhiều kết quả, ưu tiên kết quả có độ dài từ khóa gần nhất
            if (partialMatches.length > 0) {
                partialMatches.sort((a, b) => Math.abs(a.normalizedKeyword.length - q.length) - Math.abs(b.normalizedKeyword.length - q.length));
                found = partialMatches[0];
            }
        }

        // Bước 3: Trả kết quả
        if (found) {
            return {
                answer: found.mean || 'Chưa có thông tin giải nghĩa chi tiết.',
                detail: `[${found.type}] ${found.keyword}`,
                source: 'dictionary',
                meta: [] // Poetics không trả về meta liên kết tác phẩm
            };
        }

        // Bước 4: Không tìm thấy
        return {
            answer: `Không tìm thấy giải nghĩa cho "${keyword}" trong từ điển.`,
            detail: 'Bạn có thể thử tra cứu các từ khóa khác như: trăng, liễu, tái ông thất mã, hán việt...',
            source: 'dictionary',
            meta: []
        };
    },

    /**
     * 2. Tra cứu nâng cao (Tùy chọn - Dành cho tương lai mở rộng)
     * Trả về danh sách nhiều kết quả thay vì chỉ 1.
     */
    async searchDictionary(query) {
        const allEntries = getDictionaryIndex();
        const q = normalizeRouteText(query);
        
        const results = allEntries
            .filter(item => item.normalizedKeyword.includes(q))
            .slice(0, 5) // Lấy tối đa 5 kết quả
            .map(item => ({
                keyword: item.keyword,
                type: item.type,
                mean: item.mean
            }));

        if (results.length > 0) {
            return {
                answer: `Tìm thấy ${results.length} mục từ liên quan đến "${query}".`,
                detail: 'Chi tiết bên dưới:',
                source: 'dictionary',
                meta: [] // Sẽ render dạng list ở OutputAI
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
// AGENT INFO - Tự mô tả metadata cho Auto-Registry (v7.0.0+)
// =====================================================================
/**
 * Metadata tự mô tả của PoeticsAgent.
 *
 * LƯU Ý v1.3.0:
 * - Thêm trường `specialDetector` để tự nhận diện 3 intent chuyên môn:
 *     + explain-symbol    (ý nghĩa, biểu tượng, hình tượng, ...)
 *     + explain-allusion  (điển tích, điển cố, nguồn gốc điển, ...)
 *     + define-term       (định nghĩa, giải thích, khái niệm, thuật ngữ, ...)
 * - Đây là logic trước đây nằm hardcode trong input-ai.js
 *   (`detectSpecialQuestion`).
 * - `specialDetector` được copy vào `AgentRegistry.agents[key].specialDetector`
 *   bởi index.js v7.0.1, rồi được input-ai.js v8.0.0 gọi.
 *
 * THỨ TỰ ƯU TIÊN NỘI BỘ (trong specialDetector):
 *   1. explain-symbol   (ưu tiên cao nhất — từ khóa: y nghia, bieu tuong...)
 *   2. explain-allusion (từ khóa: dien tich, dien co...)
 *   3. define-term      (từ khóa: dinh nghia, khai niem...)
 *   Đây là thứ tự cũ trong input-ai.js v7.0.0, cần bảo toàn.
 *
 * TƯƠNG TÁC VỚI LITERATURE:
 * - Literature.specialDetector đã được thiết kế để NHƯỜNG cho Poetics
 *   khi câu chứa từ khóa Poetics. Nhờ vậy, thứ tự ưu tiên cũ
 *   (explain-symbol > define-genre) được bảo toàn dù Literature
 *   đứng trước Poetics trong AGENT_CLASSES.
 */
PoeticsAgent.agentInfo = {
    // ---- Định danh ----
    key: 'poetics',
    name: 'Thi Pháp AI',
    description: 'Chuyên trách Từ điển, Biểu tượng, Điển tích, Thuật ngữ.',

    // ---- Năng lực (task -> method) ----
    capabilities: {
        'explain-symbol': 'explainSymbol',
        'explain-allusion': 'explainSymbol',
        'define-term': 'explainSymbol'
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'symbol', 'term', 'genre', 'allusion'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['literature', 'knowledge'],

    // ---- Từ khóa nhận diện Intent (từ khóa chính) ----
    intentPatterns: {
        'explain-symbol': ['y nghia', 'bieu tuong', 'hinh tuong', 'hinh anh', 'tuong trung'],
        'explain-allusion': ['dien tich', 'dien co', 'nguon goc dien'],
        'define-term': ['dinh nghia', 'giai thich', 'khai niem', 'thuat ngu']
    },

    // =================================================================
    // [v1.3.0 - THÊM MỚI] SPECIAL DETECTOR
    // =================================================================
    /**
     * Nhận diện câu hỏi chuyên môn đặc biệt cần xử lý riêng.
     *
     * Đây là logic trước đây nằm hardcode trong input-ai.js. Nay chuyển
     * về từng Agent tự khai báo — input-ai.js không còn hardcode.
     *
     * LOGIC (kế thừa từ input-ai.js v7.0.0):
     *   1. Nếu chứa 'bieu', 'tuong', 'hinh', 'anh', 'y', 'nghia'
     *      → intent 'explain-symbol'.
     *   2. Nếu chứa 'dien', 'tich', 'co', 'nguon', 'goc'
     *      → intent 'explain-allusion'.
     *   3. Nếu chứa 'dinh', 'nghia', 'khai', 'niem', 'thuat', 'ngu'
     *      → intent 'define-term'.
     *
     * THỨ TỰ if-else QUAN TRỌNG:
     * - Phải giữ đúng thứ tự 1 → 2 → 3 như cũ.
     * - Nếu câu "ý nghĩa của điển tích" chứa cả 'y nghia' và 'dien tich',
     *   phải match explain-symbol (ưu tiên cao hơn) — đúng thứ tự cũ.
     *
     * @param {string} text - Câu đã chuẩn hóa (lowercase, không dấu).
     * @returns {string|null} - Intent hoặc null.
     */
    specialDetector: (text) => {
        // Defensive: text phải là string
        if (!text || typeof text !== 'string') return null;

        const words = new Set(text.split(' '));
        const hasAny = (arr) => arr.some(w => words.has(w));

        // ---- BƯỚC 1: explain-symbol (ưu tiên cao nhất) ----
        if (hasAny(['bieu', 'tuong', 'hinh', 'anh', 'y', 'nghia'])) {
            return 'explain-symbol';
        }

        // ---- BƯỚC 2: explain-allusion ----
        if (hasAny(['dien', 'tich', 'co', 'nguon', 'goc'])) {
            return 'explain-allusion';
        }

        // ---- BƯỚC 3: define-term ----
        if (hasAny(['dinh', 'nghia', 'khai', 'niem', 'thuat', 'ngu'])) {
            return 'define-term';
        }

        return null;
    }
};
