/**
 * ==========================================================
 * VĂN ĐẠO AI - LITERATURE AGENT (js/ai/agents/literature.js)
 * Vị trí: js/ai/agents/literature.js
 * Version: 1.3.0 (Deep Summary Upgrade)
 * ==========================================================
 * CHỨC NĂNG:
 * - Chịu trách nhiệm tra cứu Tác phẩm, Tác giả, Thể loại.
 * - NÂNG CẤP: Hàm summarize() fetch file chi tiết để đọc nội dung
 *   thay vì chỉ trả về đoạn mô tả ngắn (desc) trong file Index.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { VDSearchEngine } from '../../search.js';

export const LiteratureAgent = {
    /**
     * Tìm kiếm tác phẩm, tác giả, thể loại dựa trên từ khóa.
     * Dùng khi Master AI chuyển tiếp một câu hỏi tự do (Fallback).
     */
    async search(query) {
        const results = VDSearchEngine.search(query);
        const works = Array.isArray(APP_DATA.WORKS_DATA) ? APP_DATA.WORKS_DATA : [];
        const authors = Array.isArray(APP_DATA.AUTHOR_DATA) ? APP_DATA.AUTHOR_DATA : [];
        
        if (results.length > 0) {
            const topResults = results.slice(0, 5).map(r => {
                const idx = works.find(w => w.id === r.id) || authors.find(a => a.id === r.id);
                return { id: r.id, _group: r.group, title: idx ? (idx.title || idx.name) : r.id };
            });
            return { 
                answer: `Tìm thấy ${results.length} mục`, 
                detail: 'Nhấn để xem chi tiết', 
                source: 'search-engine', 
                meta: topResults 
            };
        }
        return { answer: 'Không tìm thấy kết quả phù hợp.', source: 'search-engine' };
    },

    /**
     * Tìm tác giả của một tác phẩm cụ thể.
     */
    async findAuthor(title) {
        const top = VDSearchEngine.search(title).find(r => r.group === 'tinh-hoa');
        if (top) {
            const work = APP_DATA.WORKS_DATA.find(w => w.id === top.id);
            if (work) {
                return { 
                    answer: `Tác giả: ${work.author || 'Không rõ'}`, 
                    detail: `Tác phẩm: "${work.title}"`, 
                    source: 'local-data', 
                    meta: [work] 
                };
            }
        }
        return { answer: `Không tìm thấy tác phẩm "${title}".`, source: 'local-data' };
    },

    /**
     * [NÂNG CẤP] Tóm tắt nội dung tác phẩm.
     * Thay vì chỉ lấy desc ngắn ngủi, hàm này sẽ fetch file chi tiết
     * và trích xuất một đoạn văn dài ~300 ký tự.
     */
    async summarize(title) {
        const top = VDSearchEngine.search(title).find(r => r.group === 'tinh-hoa');
        if (top) {
            const work = APP_DATA.WORKS_DATA.find(w => w.id === top.id);
            if (work) {
                // 1. Mặc định lấy mô tả ngắn từ index phòng trường hợp fetch lỗi
                let summaryText = work.desc || 'Tác phẩm này chưa có tóm tắt.';
                
                // 2. Fetch file chi tiết (chứa nội dung đầy đủ)
                try {
                    const res = await fetch(`./data/tac-pham/${encodeURIComponent(work.id)}.json`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.content) {
                            // 3. Xóa thẻ HTML và lấy 300 ký tự đầu tiên
                            const plainText = data.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            
                            // Nếu nội dung thực sự có (dài hơn 50 ký tự)
                            if (plainText.length > 50) {
                                summaryText = plainText.substring(0, 300) + '...';
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[LITERATURE AGENT] Không tải được nội dung chi tiết:', e);
                }

                return { 
                    answer: summaryText, 
                    detail: `Tác phẩm: "${work.title}" của ${work.author}`, 
                    source: 'local-data', 
                    meta: [work] 
                };
            }
        }
        return { answer: `Không tìm thấy tác phẩm "${title}".`, source: 'local-data' };
    },

    /**
     * Lấy dữ liệu thô của tác phẩm (Dùng cho AnalysisAgent phân tích).
     */
    async getWorkInfo(title) {
        const top = VDSearchEngine.search(title).find(r => r.group === 'tinh-hoa');
        if (top) {
            const work = APP_DATA.WORKS_DATA.find(w => w.id === top.id);
            if (work) return { ok: true, data: work };
        }
        return { ok: false, answer: `Không tìm thấy "${title}".`, source: 'local-data' };
    },

    /**
     * Gợi ý tác phẩm để đọc.
     */
    async recommend(genre) {
        let works = APP_DATA.WORKS_DATA || [];
        
        // Lọc theo thể loại nếu có
        if (genre) {
            const q = genre.toLowerCase();
            works = works.filter(w => {
                const wGenre = Array.isArray(w.the_loai) ? w.the_loai.join(' ').toLowerCase() : '';
                return wGenre.includes(q);
            });
        }
        
        // Thuật toán xáo trộn Fisher-Yates
        for (let i = works.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [works[i], works[j]] = [works[j], works[i]];
        }
        
        const selected = works.slice(0, 4);
        if (selected.length > 0) {
            return { 
                answer: `Gợi ý: ${selected.map(w => w.title).join(' · ')}`, 
                detail: 'Dựa trên sở thích của bạn', 
                source: 'local-data', 
                meta: selected 
            };
        }
        return { answer: 'Chưa có tác phẩm phù hợp.', source: 'local-data' };
    },

    /**
     * Định nghĩa thể loại văn học.
     */
    async defineGenre(query) {
        const genres = Array.isArray(APP_DATA.THE_LOAI_DATA) ? APP_DATA.THE_LOAI_DATA : [];
        const genre = genres.find(g => g.name.toLowerCase().includes(query.toLowerCase()));
        
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