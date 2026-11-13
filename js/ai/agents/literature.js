/**
 * ==========================================================
 * VĂN ĐẠO AI - LITERATURE AGENT (js/ai/agents/literature.js)
 * Vị trí: js/ai/agents/literature.js
 * Version: 1.2.0 (Multi-Agent Specialist)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tra cứu tác phẩm, tác giả, thể loại.
 * - Tóm tắt nội dung tác phẩm.
 * - Gợi ý đọc theo thể loại/sở thích.
 * - Cung cấp dữ liệu thô cho AnalysisAgent (Phân tích).
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { VDSearchEngine } from '../../search.js';

// Helper: Lấy mảng an toàn, tránh lỗi undefined
const safeArray = (arr) => Array.isArray(arr) ? arr : [];

export const LiteratureAgent = {

    /**
     * 1. TÌM KIẾM CHUNG (Tác phẩm, Tác giả, Lý thuyết)
     * @param {string} query - Từ khóa người dùng nhập
     */
    async search(query) {
        if (!query) return { answer: 'Vui lòng nhập từ khóa tìm kiếm.', source: 'literature-agent' };

        const results = VDSearchEngine.search(query);
        if (!results || results.length === 0) {
            return { 
                answer: `Không tìm thấy kết quả nào cho "${query}".`, 
                source: 'search-engine' 
            };
        }

        const works = safeArray(APP_DATA.WORKS_DATA);
        const authors = safeArray(APP_DATA.AUTHOR_DATA);
        const theories = safeArray(APP_DATA.THEORY_DATA);
        const genres = safeArray(APP_DATA.THE_LOAI_DATA);

        // Lấy top 5 kết quả để hiển thị
        const topResults = results.slice(0, 5).map(r => {
            const record = { id: r.id, _group: r.group };
            let idx = null;
            
            if (r.group === 'tinh-hoa') idx = works.find(w => w.id === r.id);
            else if (r.group === 'ky-tai') idx = authors.find(a => a.id === r.id);
            else if (r.group === 'triet-thuyet') idx = theories.find(t => t.id === r.id);
            else if (r.group === 'the-loai') idx = genres.find(g => g.id === r.id);

            if (idx) record.title = idx.title || idx.name || idx.id;
            else record.title = r.id; // Fallback
            
            return record;
        });

        return { 
            answer: `Tìm thấy ${results.length} mục liên quan.`, 
            detail: `Các kết quả hàng đầu: ${topResults.map(r => r.title).join(', ')}`, 
            source: 'search-engine', 
            meta: topResults 
        };
    },

    /**
     * 2. TÌM TÁC GIẢ CỦA TÁC PHẨM
     * @param {string} title - Tên tác phẩm
     */
    async findAuthor(title) {
        if (!title) return { answer: 'Vui lòng cho biết tên tác phẩm.', source: 'literature-agent' };

        const results = VDSearchEngine.search(title);
        const topResult = results.find(r => r.group === 'tinh-hoa'); // Chỉ tìm trong nhóm tác phẩm

        if (topResult) {
            const work = safeArray(APP_DATA.WORKS_DATA).find(w => w.id === topResult.id);
            if (work) {
                return { 
                    answer: `Tác giả của tác phẩm này là: ${work.author || 'Không rõ'}.`, 
                    detail: `Tác phẩm: "${work.title}"`, 
                    source: 'local-data', 
                    meta: [work] 
                };
            }
        }
        return { 
            answer: `Không tìm thấy tác phẩm "${title}" để xác định tác giả.`, 
            source: 'local-data' 
        };
    },

    /**
     * 3. TÓM TẮT NỘI DUNG TÁC PHẨM
     * @param {string} title - Tên tác phẩm
     */
    async summarize(title) {
        if (!title) return { answer: 'Vui lòng cho biết tên tác phẩm cần tóm tắt.', source: 'literature-agent' };

        const results = VDSearchEngine.search(title);
        const topResult = results.find(r => r.group === 'tinh-hoa');

        if (topResult) {
            const work = safeArray(APP_DATA.WORKS_DATA).find(w => w.id === topResult.id);
            if (work) {
                const summary = work.desc || work.description || 'Tác phẩm này chưa có thông tin tóm tắt.';
                return { 
                    answer: summary, 
                    detail: `Tác phẩm: "${work.title}" của ${work.author}`, 
                    source: 'local-data', 
                    meta: [work] 
                };
            }
        }
        return { 
            answer: `Không tìm thấy tác phẩm "${title}" để tóm tắt.`, 
            source: 'local-data' 
        };
    },

    /**
     * 4. LẤY DỮ LIỆU THÔ CỦA TÁC PHẨM (Dành cho AnalysisAgent)
     * @param {string} title - Tên tác phẩm
     */
    async getWorkInfo(title) {
        if (!title) return { ok: false, answer: 'Vui lòng cho biết tên tác phẩm.', source: 'literature-agent' };

        const results = VDSearchEngine.search(title);
        const topResult = results.find(r => r.group === 'tinh-hoa');

        if (topResult) {
            const work = safeArray(APP_DATA.WORKS_DATA).find(w => w.id === topResult.id);
            if (work) {
                return { ok: true, data: work };
            }
        }
        return { 
            ok: false, 
            answer: `Không tìm thấy tác phẩm "${title}" trong kho dữ liệu.`, 
            source: 'local-data' 
        };
    },

    /**
     * 5. GỢI Ý ĐỌC (Recommend)
     * @param {string} genre - Thể loại hoặc từ khóa (có thể để trống)
     */
    async recommend(genre) {
        let works = [...safeArray(APP_DATA.WORKS_DATA)];
        
        // Nếu có yêu cầu cụ thể về thể loại
        if (genre) {
            const q = genre.toLowerCase().trim();
            works = works.filter(w => {
                const titleMatch = w.title && w.title.toLowerCase().includes(q);
                const genreMatch = w.the_loai && Array.isArray(w.the_loai) && w.the_loai.join(' ').toLowerCase().includes(q);
                const typeMatch = w.loai_hinh && typeof w.loai_hinh === 'string' && w.loai_hinh.toLowerCase().includes(q);
                return titleMatch || genreMatch || typeMatch;
            });
        }

        if (works.length === 0) {
            return { 
                answer: 'Rất tiếc, chưa có tác phẩm nào phù hợp với yêu cầu của bạn.', 
                source: 'local-data' 
            };
        }

        // Thuật toán xáo trộn Fisher-Yates (Chuẩn xác, không dùng sort ngẫu nhiên)
        for (let i = works.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [works[i], works[j]] = [works[j], works[i]];
        }

        // Lấy ngẫu nhiên 4 tác phẩm
        const selected = works.slice(0, 4);

        return { 
            answer: `Gợi ý cho bạn một số tác phẩm: ${selected.map(w => w.title).join(' · ')}.`, 
            detail: genre ? `Dựa trên thể loại: ${genre}` : 'Dựa trên kho tàng tri thức', 
            source: 'local-data', 
            meta: selected 
        };
    },

    /**
     * 6. ĐỊNH NGHĨA THỂ LOẠI
     * @param {string} query - Tên thể loại (VD: "Lục bát", "Truyện ngắn")
     */
    async defineGenre(query) {
        if (!query) return { answer: 'Vui lòng cho biết thể loại cần tra cứu.', source: 'literature-agent' };

        const genres = safeArray(APP_DATA.THE_LOAI_DATA);
        const q = query.toLowerCase().trim();
        
        const genre = genres.find(g => 
            (g.name && g.name.toLowerCase().includes(q)) || 
            (g.id && g.id.toLowerCase().includes(q))
        );

        if (genre) {
            return { 
                answer: genre.description || 'Thể loại này chưa có mô tả chi tiết.', 
                detail: `Thể loại: ${genre.name}`, 
                source: 'local-data', 
                meta: [genre] 
            };
        }
        
        return { 
            answer: `Không tìm thấy thể loại "${query}" trong từ điển.`, 
            source: 'local-data' 
        };
    }
};