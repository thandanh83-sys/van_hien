/**
 * ==========================================================
 * VĂN ĐẠO AI - LITERATURE AGENT (js/ai/agents/literature.js)
 * Vị trí: js/ai/agents/literature.js
 * Version: 1.5.0 (ID-Centric & Offline-First)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tìm kiếm, tra cứu Tác phẩm, Tác giả, Thể loại.
 * - Hỗ trợ truy xuất dữ liệu bằng TẤT CẢ ID (qua resolveAndFetch).
 * - Tóm tắt thông minh: Ưu tiên đọc nội dung chi tiết, Fallback về desc nếu Offline.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { VDSearchEngine } from '../../search.js';
import { resolveAndFetch } from '../core.js'; // Kết nối với Máy Mẹ qua Core

export const LiteratureAgent = {
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

        // Bước 2: Nếu không phải ID, dùng Search Engine để tìm ra ID
        const top = VDSearchEngine.search(input).find(r => r.group === 'tinh-hoa');
        if (top) {
            // Có ID rồi, tiếp tục dùng resolveAndFetch để lấy full dữ liệu
            resolved = await resolveAndFetch(top.id);
            if (resolved) {
                return { ok: true, record: resolved.record, detail: resolved.detail };
            }
        }
        
        return { ok: false };
    },

    /**
     * Tìm tác giả của một tác phẩm.
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

    /**
     * Tóm tắt tác phẩm (Ưu tiên lấy nội dung chi tiết, tự động fallback nếu Offline).
     */
    async summarize(input) {
        const workInfo = await this.getWorkInfo(input);
        
        if (workInfo.ok) {
            const work = workInfo.record;
            // 1. Lấy desc làm fallback mặc định
            let summaryText = work.desc || 'Tác phẩm này chưa có tóm tắt.';
            
            // 2. Nếu có nội dung chi tiết (từ Máy Mẹ), dùng nó để tóm tắt
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

    /**
     * Tìm kiếm tự do (Dùng khi Master AI chuyển tiếp câu hỏi Fallback).
     */
    async search(query) {
        const results = VDSearchEngine.search(query);
        if (results.length > 0) {
            const topResults = results.slice(0, 5).map(r => {
                const idx = APP_DATA.WORKS_DATA.find(w => w.id === r.id) || APP_DATA.AUTHOR_DATA.find(a => a.id === r.id);
                return { id: r.id, _group: r.group, title: idx ? (idx.title || idx.name) : r.id };
            });
            return { answer: `Tìm thấy ${results.length} mục`, detail: 'Nhấn để xem chi tiết', source: 'search-engine', meta: topResults };
        }
        return { answer: 'Không tìm thấy kết quả phù hợp.', source: 'search-engine' };
    },

    /**
     * Gợi ý đọc tác phẩm.
     */
    async recommend(genre) {
        let works = Array.isArray(APP_DATA.WORKS_DATA) ? APP_DATA.WORKS_DATA : [];
        
        if (genre) {
            const q = genre.toLowerCase();
            works = works.filter(w => (w.the_loai && w.the_loai.join(' ').toLowerCase().includes(q)));
        }
        
        // Fisher-Yates shuffle
        for (let i = works.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [works[i], works[j]] = [works[j], works[i]];
        }
        
        const selected = works.slice(0, 4);
        if (selected.length > 0) {
            return { answer: `Gợi ý: ${selected.map(w => w.title).join(' · ')}`, detail: 'Dựa trên sở thích của bạn', source: 'local-data', meta: selected };
        }
        return { answer: 'Chưa có tác phẩm phù hợp.', source: 'local-data' };
    },

    /**
     * Định nghĩa thể loại (Hỗ trợ cả ID và Tên).
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