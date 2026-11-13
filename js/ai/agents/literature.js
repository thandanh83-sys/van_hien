/**
 * ==========================================================
 * VĂN ĐẠO AI - LITERATURE AGENT (js/ai/agents/literature.js)
 * Vị trí: js/ai/agents/literature.js
 * Version: 3.3.0 (Special Detector Support)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tìm kiếm, tra cứu Tác phẩm, Tác giả, Thể loại.
 * - Hỗ trợ truy xuất dữ liệu bằng TẤT CẢ ID (qua DataHub).
 * - Tóm tắt thông minh: Ưu tiên đọc nội dung chi tiết, Fallback về desc nếu Offline.
 * 
 * LỊCH SỬ PHIÊN BẢN:
 * - v3.2.0: Unified Intelligence Network.
 * - v3.3.0: Thêm `specialDetector` trong agentInfo để tự nhận diện
 *           intent `define-genre` (thể loại / thể thơ) từ câu hỏi.
 *           Trước v3.3.0, logic này nằm hardcode trong input-ai.js.
 *           Toàn bộ logic nghiệp vụ giữ nguyên 100%.
 *
 * TRIẾT LÝ:
 * - Không tự ý fetch JSON. Mọi dữ liệu lấy từ DataHub.
 * - ID là ngôn ngữ chung. Dùng ID để liên kết Tác phẩm - Tác giả - Thể loại.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { VDSearchEngine } from '../../search.js';
import { DataHub } from '../../network/data-hub.js';
import { resolveAndFetch } from '../core.js';

export const LiteratureAgent = {
    // =================================================================
    // 1. LẤY THÔNG TIN CƠ BẢN VÀ CHI TIẾT CỦA TÁC PHẨM
    // =================================================================
    /**
     * Lấy thông tin cơ bản và chi tiết của một tác phẩm.
     * Hàm này là "xương sống" để các hàm khác (như findAuthor, summarize) tái sử dụng.
     * 
     * @param {string} input - Tên tác phẩm hoặc ID tác phẩm
     * @returns {Promise<Object>} { ok, record, detail }
     */
    async getWorkInfo(input) {
        if (!input) return { ok: false };

        // Bước 1: Thử resolve trực tiếp bằng ID (Nếu input là ID)
        let resolved = await resolveAndFetch(input);
        if (resolved && resolved.group === 'tinh-hoa') {
            return { ok: true, record: resolved.record, detail: resolved.detail };
        }

        // Bước 2: Nếu không phải ID, dùng DataHub để dịch Tên thành ID
        const target = DataHub.resolveIdFromQuery(input);
        if (target && target.group === 'tinh-hoa') {
            resolved = await resolveAndFetch(target.id);
            if (resolved) {
                return { ok: true, record: resolved.record, detail: resolved.detail };
            }
        }

        // Bước 3: Nếu DataHub không tìm thấy, dùng Search Engine làm phương án dự phòng
        const top = VDSearchEngine.search(input).find(r => r.group === 'tinh-hoa');
        if (top) {
            resolved = await resolveAndFetch(top.id);
            if (resolved) {
                return { ok: true, record: resolved.record, detail: resolved.detail };
            }
        }
        
        return { ok: false };
    },

    // =================================================================
    // 2. TÌM TÁC GIẢ CỦA TÁC PHẨM
    // =================================================================
    /**
     * Tìm tác giả của một tác phẩm.
     * Câu hỏi: "Ai viết Truyện Kiều?", "Tác giả của Chí Phèo là ai?"
     * 
     * @param {string} input - Tên tác phẩm
     * @returns {Promise<Object>}
     */
    async findAuthor(input) {
        const workInfo = await this.getWorkInfo(input);
        
        if (workInfo.ok) {
            const work = workInfo.record;
            return { 
                answer: `Tác giả: ${work.author || 'Không rõ'}`, 
                detail: `Tác phẩm: "${work.title}"`, 
                source: 'local-data', 
                meta: [work] 
            };
        }
        return { answer: `Không tìm thấy tác phẩm "${input}".`, source: 'local-data' };
    },

    // =================================================================
    // 3. TÓM TẮT TÁC PHẨM
    // =================================================================
    /**
     * Tóm tắt tác phẩm (Ưu tiên lấy nội dung chi tiết, tự động fallback nếu Offline).
     * Câu hỏi: "Tóm tắt Truyện Kiều", "Nội dung chính của Chí Phèo"
     * 
     * @param {string} input - Tên tác phẩm
     * @returns {Promise<Object>}
     */
    async summarize(input) {
        const workInfo = await this.getWorkInfo(input);
        
        if (workInfo.ok) {
            const work = workInfo.record;
            // 1. Lấy desc làm fallback mặc định
            let summaryText = work.desc || 'Tác phẩm này chưa có tóm tắt.';
            
            // 2. Nếu có nội dung chi tiết (từ DataHub), dùng nó để tóm tắt
            if (workInfo.detail && workInfo.detail.content) {
                const plainText = workInfo.detail.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (plainText.length > 50) {
                    summaryText = plainText.substring(0, 300) + '...';
                }
            }

            return { 
                answer: summaryText, 
                detail: `Tác phẩm: "${work.title}" của ${work.author}`, 
                source: 'local-data', 
                meta: [work] 
            };
        }
        return { answer: `Không tìm thấy tác phẩm "${input}".`, source: 'local-data' };
    },

    // =================================================================
    // 4. TÌM KIẾM TỰ DO
    // =================================================================
    /**
     * Tìm kiếm tự do (Dùng khi Master AI chuyển tiếp câu hỏi Fallback).
     * 
     * @param {string} query 
     * @returns {Promise<Object>}
     */
    async search(query) {
        const results = VDSearchEngine.search(query);
        if (results.length > 0) {
            const topResults = results.slice(0, 5).map(r => {
                const idx = APP_DATA.WORKS_DATA.find(w => w.id === r.id) || APP_DATA.AUTHOR_DATA.find(a => a.id === r.id);
                return { id: r.id, _group: r.group, title: idx ? (idx.title || idx.name) : r.id };
            });
            return { 
                answer: `Tìm thấy ${results.length} mục liên quan.`, 
                detail: 'Nhấn để xem chi tiết', 
                source: 'search-engine', 
                meta: topResults 
            };
        }
        return { answer: 'Không tìm thấy kết quả phù hợp.', source: 'search-engine' };
    },

    // =================================================================
    // 5. GỢI Ý ĐỌC
    // =================================================================
    /**
     * Gợi ý đọc tác phẩm (Ngẫu nhiên hoặc theo thể loại).
     * 
     * @param {string} genre - Tên thể loại (Tùy chọn)
     * @returns {Promise<Object>}
     */
    async recommend(genre) {
        let works = Array.isArray(APP_DATA.WORKS_DATA) ? APP_DATA.WORKS_DATA : [];
        
        if (genre) {
            const q = genre.toLowerCase();
            works = works.filter(w => (w.the_loai && w.the_loai.join(' ').toLowerCase().includes(q)));
        }
        
        // Fisher-Yates shuffle (Xáo trộn ngẫu nhiên)
        for (let i = works.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [works[i], works[j]] = [works[j], works[i]];
        }
        
        const selected = works.slice(0, 4);
        if (selected.length > 0) {
            return { 
                answer: `Gợi ý cho bạn: ${selected.map(w => w.title).join(' · ')}`, 
                detail: 'Dựa trên sở thích của bạn', 
                source: 'local-data', 
                meta: selected 
            };
        }
        return { answer: 'Chưa có tác phẩm phù hợp để gợi ý.', source: 'local-data' };
    },

    // =================================================================
    // 6. ĐỊNH NGHĨA THỂ LOẠI
    // =================================================================
    /**
     * Định nghĩa thể loại (Hỗ trợ cả ID và Tên).
     * Câu hỏi: "Thơ lục bát là gì?", "Định nghĩa truyện ngắn"
     * 
     * @param {string} input - Tên hoặc ID thể loại
     * @returns {Promise<Object>}
     */
    async defineGenre(input) {
        // 1. Thử resolve bằng ID (Nếu input là ID như 'tho-luc-bat')
        const resolved = await resolveAndFetch(input);
        if (resolved && resolved.group === 'the-loai') {
            return { 
                answer: resolved.record.description || 'Thể loại này chưa có mô tả chi tiết.', 
                detail: `Thể loại: ${resolved.record.name}`, 
                source: 'local-data', 
                meta: [resolved.record] 
            };
        }

        // 2. Nếu không phải ID, tìm theo Tên
        const genres = Array.isArray(APP_DATA.THE_LOAI_DATA) ? APP_DATA.THE_LOAI_DATA : [];
        const genre = genres.find(g => g.name.toLowerCase().includes(input.toLowerCase()));
        
        if (genre) {
            return { 
                answer: genre.description || 'Thể loại này chưa có mô tả chi tiết.', 
                detail: `Thể loại: ${genre.name}`, 
                source: 'local-data', 
                meta: [genre] 
            };
        }
        return { answer: 'Thể loại không có trong từ điển.', source: 'local-data' };
    }
};

// =====================================================================
// AGENT INFO - Tự mô tả metadata cho Auto-Registry (v7.0.0+)
// =====================================================================
/**
 * Metadata tự mô tả của LiteratureAgent.
 *
 * LƯU Ý v3.3.0:
 * - Thêm trường `specialDetector` để tự nhận diện intent `define-genre`
 *   từ câu hỏi người dùng. Đây là logic trước đây nằm hardcode trong
 *   input-ai.js (`detectSpecialQuestion`).
 * - `specialDetector` được copy vào `AgentRegistry.agents[key].specialDetector`
 *   bởi index.js v7.0.1, rồi được input-ai.js v8.0.0 gọi.
 *
 * THỨ TỰ ƯU TIÊN:
 * - LiteratureAgent đứng TRƯỚC PoeticsAgent trong AGENT_CLASSES.
 * - Nếu câu hỏi chứa từ khóa của Poetics ('y nghia', 'bieu tuong', ...),
 *   LiteratureAgent PHẢI nhường để bảo toàn thứ tự ưu tiên cũ
 *   (explain-symbol > define-genre). Xem chi tiết trong specialDetector.
 */
LiteratureAgent.agentInfo = {
    // ---- Định danh ----
    key: 'literature',
    name: 'Văn Học AI',
    description: 'Chuyên trách Tác phẩm, Tác giả, Tóm tắt và Thể loại.',

    // ---- Năng lực (task -> method) ----
    capabilities: {
        'summarize-work': 'summarize',
        'find-author-of': 'findAuthor',
        'recommend': 'recommend',
        'define-genre': 'defineGenre',
        'search': 'search'
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author', 'genre'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['poetics', 'knowledge', 'history', 'character'],

    // ---- Từ khóa nhận diện Intent (từ khóa chính) ----
    intentPatterns: {
        'summarize-work': ['tom tat', 'noi dung chinh', 'ke lai', 'trinh bay'],
        'find-author-of': ['ai viet', 'tac gia cua', 'ai sang tac', 'nguoi viet', 'cua ai'],
        'recommend': ['goi y', 'de xuat', 'nen doc', 'muon doc', 'tim truyen', 'tim tho'],
        'define-genre': ['the loai', 'the tho', 'dinh nghia the loai']
    },

    // =================================================================
    // [v3.3.0 - THÊM MỚI] SPECIAL DETECTOR
    // =================================================================
    /**
     * Nhận diện câu hỏi chuyên môn đặc biệt cần xử lý riêng.
     *
     * Đây là logic trước đây nằm hardcode trong input-ai.js. Nay chuyển
     * về từng Agent tự khai báo — input-ai.js không còn hardcode.
     *
     * LOGIC (kế thừa từ input-ai.js v7.0.0):
     * - Nếu câu chứa 'the', 'loai', 'the', 'tho' → intent 'define-genre'.
     *
     * QUAN TRỌNG — NHƯỜNG QUYỀN CHO POETICS:
     * - Trong Registry, Literature đứng TRƯỚC Poetics. Nếu câu hỏi
     *   chứa cả từ khóa Poetics lẫn từ khóa thể loại (VD: "ý nghĩa
     *   của thể loại"), thứ tự cũ ưu tiên `explain-symbol` (Poetics).
     * - Vì vậy, Literature PHẢI return null khi thấy bất kỳ từ khóa
     *   Poetics nào, để nhường cho Poetics xử lý ở vòng lặp tiếp theo.
     * - Nếu không nhường → đảo ngược hành vi cũ, gây sai intent.
     *
     * @param {string} text - Câu đã chuẩn hóa (lowercase, không dấu).
     * @returns {string|null} - Intent hoặc null.
     */
    specialDetector: (text) => {
        // Defensive: text phải là string
        if (!text || typeof text !== 'string') return null;

        const words = new Set(text.split(' '));
        const hasAny = (arr) => arr.some(w => words.has(w));

        // ---- BƯỚC 1: Nhường Poetics nếu có từ khóa của họ ----
        // Danh sách từ khóa Poetics (explain-symbol + explain-allusion + define-term)
        const poeticsKeywords = [
            // explain-symbol
            'bieu', 'tuong', 'hinh', 'anh', 'y', 'nghia',
            // explain-allusion
            'dien', 'tich', 'co', 'nguon', 'goc',
            // define-term
            'dinh', 'nghia', 'khai', 'niem', 'thuat', 'ngu'
        ];
        if (hasAny(poeticsKeywords)) {
            return null; // Nhường cho Poetics
        }

        // ---- BƯỚC 2: Match define-genre ----
        if (hasAny(['the', 'loai', 'the', 'tho'])) {
            return 'define-genre';
        }

        return null;
    }
};
