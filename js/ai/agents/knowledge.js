/**
 * ==========================================================
 * VĂN ĐẠO AI - KNOWLEDGE AGENT (js/ai/agents/knowledge.js)
 * Vị trí: js/ai/agents/knowledge.js
 * Version: 2.0.0 (Network Explorer)
 * ==========================================================
 * CHỨC NĂNG:
 * - Xử lý các truy vấn về mối quan hệ (Tác giả - Tác phẩm - Thể loại).
 * - Sử dụng DataHub để truy xuất dữ liệu (Offline-First).
 * ==========================================================
 */

import { DataHub } from '../../network/data-hub.js';
import { normalizeRouteText } from '../../utils.js';

export const KnowledgeAgent = {
    /**
     * 1. Tìm tác phẩm liên quan (Cùng tác giả, cùng thể loại)
     * Câu hỏi: "Tác phẩm nào giống Truyện Kiều?", "Truyện Kiều cùng thể loại với bài nào?"
     */
    async findRelated(input) {
        const target = DataHub.resolveIdFromQuery(input);
        if (!target || target.group !== 'tinh-hoa') {
            return { answer: `Không tìm thấy tác phẩm "${input}" để tìm liên kết.`, source: 'knowledge' };
        }

        const graph = DataHub.getGraph(target.id);
        if (!graph) return { answer: 'Không thể xây dựng mạng lưới liên kết.', source: 'knowledge' };

        const related = graph.relatedWorks;
        if (related.length === 0) {
            return { answer: `Chưa tìm thấy tác phẩm nào có nét tương đồng với "${input}".`, source: 'knowledge' };
        }

        const titles = related.map(w => w.title).join(', ');
        return {
            answer: `Các tác phẩm có nét tương đồng với "${input}": ${titles}.`,
            detail: 'Dựa trên thể loại và mạng lưới liên kết tri thức.',
            source: 'knowledge',
            meta: related // Trả về mảng object để UI render thành nút bấm
        };
    },

    /**
     * 2. Lấy tiểu sử Tác giả và danh sách tác phẩm
     * Câu hỏi: "Tiểu sử Nguyễn Du", "Nguyễn Du có những tác phẩm nào?"
     */
    async getAuthorInfo(input) {
        const target = DataHub.resolveIdFromQuery(input);
        
        // Nếu người dùng nhập tên tác phẩm, tự động lần ngược ra tác giả
        let authorId = target?.id;
        if (target && target.group === 'tinh-hoa') {
            const graph = DataHub.getGraph(target.id);
            if (graph && graph.author) authorId = graph.author.id;
        }

        const meta = DataHub.getMetadata(authorId);
        if (!meta || meta.group !== 'ky-tai') {
            return { answer: `Không tìm thấy thông tin tác giả "${input}".`, source: 'knowledge' };
        }

        const detail = await DataHub.getDetail(authorId);
        const authorName = meta.data.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
        
        // Trích xuất văn bản ngắn gọn
        let summary = detail.content
            ? detail.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 250) + '...'
            : (meta.data.desc || 'Chưa có tiểu sử chi tiết.');

        const graph = DataHub.getGraph(authorId);
        const works = graph ? graph.works : [];

        return {
            answer: summary,
            detail: `Tác giả ${authorName} có ${works.length} tác phẩm trong hệ thống.`,
            source: 'knowledge',
            meta: works.slice(0, 5)
        };
    },

    /**
     * 3. Liệt kê tác phẩm của một Tác giả
     * Câu hỏi: "Các tác phẩm của Nam Cao", "Nam Cao viết những gì?"
     */
    async listAuthorWorks(input) {
        const target = DataHub.resolveIdFromQuery(input);
        let authorId = target?.id;
        
        if (target && target.group === 'tinh-hoa') {
            const graph = DataHub.getGraph(target.id);
            if (graph && graph.author) authorId = graph.author.id;
        }

        const meta = DataHub.getMetadata(authorId);
        if (!meta || meta.group !== 'ky-tai') {
            return { answer: `Không tìm thấy tác giả "${input}".`, source: 'knowledge' };
        }

        const graph = DataHub.getGraph(authorId);
        const works = graph ? graph.works : [];
        const authorName = meta.data.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();

        if (works.length === 0) {
            return { answer: `Chưa có tác phẩm nào của ${authorName} trong hệ thống.`, source: 'knowledge' };
        }

        return {
            answer: `Tác giả ${authorName} có ${works.length} tác phẩm:`,
            detail: 'Nhấn vào từng tác phẩm để xem chi tiết.',
            source: 'knowledge',
            meta: works
        };
    },

    /**
     * 4. Khám phá Toàn cảnh Mạng lưới (Dùng khi hỏi các câu chung chung)
     * Câu hỏi: "Nói về Truyện Kiều", "Truyện Kiều có gì đặc biệt?"
     */
    async exploreEntity(input) {
        const target = DataHub.resolveIdFromQuery(input);
        if (!target) return null; // Trả về null để MasterAI chuyển cho Agent khác (như AnalysisAgent)

        const meta = DataHub.getMetadata(target.id);
        const graph = DataHub.getGraph(target.id);
        
        let answer = '';
        let detail = '';
        let metaList = [];

        if (target.group === 'tinh-hoa') {
            const work = meta.data;
            const authorName = graph.author ? graph.author.title.replace(/^Chân Dung Tác Giả:\s*/i, '') : (work.author || 'Khuyết danh');
            const genres = graph.genres.join(', ') || 'Chưa rõ';
            
            answer = `Tác phẩm "${work.title}" do ${authorName} sáng tác.`;
            detail = `Thể loại: ${genres}. Thời kỳ: ${work.era || 'Không rõ'}.`;
            
            if (graph.author) metaList.push(graph.author);
            metaList = metaList.concat(graph.works.slice(0, 3));
            
        } else if (target.group === 'ky-tai') {
            const author = meta.data;
            const authorName = author.title.replace(/^Chân Dung Tác Giả:\s*/i, '');
            answer = `Hồ sơ tác giả: ${authorName}.`;
            detail = `Có ${graph.works.length} tác phẩm được lưu trữ.`;
            metaList = graph.works.slice(0, 4);
        }

        return {
            answer,
            detail,
            source: 'knowledge',
            meta: metaList
        };
    }
};
