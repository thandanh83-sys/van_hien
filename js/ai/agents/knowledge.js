/**
 * ==========================================================
 * VĂN ĐẠO AI - KNOWLEDGE AGENT (js/ai/agents/knowledge.js)
 * Vị trí: js/ai/agents/knowledge.js
 * Version: 2.1.0 (Special Detector for Author)
 * ==========================================================
 * CHỨC NĂNG:
 * - Xử lý các truy vấn về mối quan hệ (Tác giả - Tác phẩm - Thể loại).
 * - Nhận diện câu hỏi dạng "X là ai" nếu X là Tác giả.
 * - Sử dụng DataHub để truy xuất dữ liệu (Offline-First).
 * 
 * LỊCH SỬ PHIÊN BẢN:
 * - v2.0.0: Network Explorer.
 * - v2.1.0: Thêm `specialDetector` để nhận diện intent `find-author-info`
 *           từ câu hỏi tự nhiên (VD: "Nguyễn Du là ai?").
 *           Giúp IntentRouter phân biệt giữa Tác giả và Nhân vật.
 * ==========================================================
 */

import { DataHub } from '../../network/data-hub.js';
import { normalizeRouteText } from '../../utils.js';

export const KnowledgeAgent = {
    /**
     * 1. Tìm tác phẩm liên quan (Cùng tác giả, cùng thể loại)
     * Câu hỏi: "Tác phẩm nào giống Truyện Kiều?", "Truyện Kiều cùng thể loại với bài nào?"
     * 
     * @param {string} input - Tên tác phẩm
     * @returns {Promise<Object>} 
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
     * 
     * @param {string} input - Tên tác giả
     * @returns {Promise<Object>} 
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
     * 
     * @param {string} input - Tên tác giả
     * @returns {Promise<Object>} 
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
     * 
     * @param {string} input 
     * @returns {Promise<Object>|null}
     */
    async exploreEntity(input) {
        const target = DataHub.resolveIdFromQuery(input);
        if (!target) return null; // Trả về null để MasterAI chuyển cho Agent khác

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

// =====================================================================
// AGENT INFO - Tự mô tả metadata cho Auto-Registry (v7.0.0+)
// =====================================================================
/**
 * Metadata tự mô tả của KnowledgeAgent.
 * Chuyên trách mạng lưới liên kết: quan hệ tác giả - tác phẩm - thể loại.
 */
KnowledgeAgent.agentInfo = {
    // ---- Định danh ----
    key: 'knowledge',
    name: 'Tri Thức AI',
    description: 'Chuyên trách Mạng lưới liên kết (Tác giả - Tác phẩm - Thể loại).',

    // ---- Năng lực (task -> method) ----
    capabilities: {
        'find-related': 'findRelated',          // "Tác phẩm giống Truyện Kiều?"
        'find-author-info': 'getAuthorInfo',    // "Tiểu sử Nguyễn Du?"
        'list-author-works': 'listAuthorWorks', // "Nguyễn Du có tác phẩm nào?"
        'explore': 'exploreEntity'              // Fallback khám phá thực thể
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author', 'genre', 'symbol'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['literature', 'poetics', 'history'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'find-related': ['lien quan', 'giong', 'tuong tu', 'cung the loai', 'cung tac gia'],
        'find-author-info': ['tieu su', 'cuoc doi', 'su nghiep', 'thong tin ve tac gia'],
        'list-author-works': ['tac pham cua', 'sang tac nhung tac pham nao', 'co nhung tac pham nao', 'liet ke tac pham']
    },

    // =================================================================
    // [v2.1.0 - THÊM MỚI] SPECIAL DETECTOR
    // =================================================================
    /**
     * Nhận diện câu hỏi dạng "X là ai" nếu X là Tác giả.
     * 
     * Cơ chế:
     * - Kiểm tra mẫu câu "X là ai" hoặc "X là gì".
     * - Trích xuất tên thực thể X.
     * - Dùng DataHub để tra cứu. Nếu X thuộc nhóm 'ky-tai' (Tác giả), trả về intent 'find-author-info'.
     * - Nếu không phải Tác giả (VD: là Nhân vật, Thuật ngữ), trả về null để Agent khác xử lý.
     * 
     * @param {string} text - Câu đã chuẩn hóa (không dấu, không dấu câu).
     * @returns {string|null} 
     */
    specialDetector: (text) => {
        if (!text || typeof text !== 'string') return null;

        // 1. Kiểm tra mẫu câu kết thúc bằng "la ai" hoặc "la gi"
        if (!/\b(la ai|la gi)\b/.test(text)) return null;
        
        const match = text.match(/^(.+?)\s+(la ai|la gi)$/);
        if (!match) return null;
        
        // 2. Làm sạch tên thực thể (loại bỏ các từ chỉ loại nếu có)
        const entityName = match[1]
            .replace(/\b(tac gia|nha tho|nha van|thong tin ve)\b/g, '')
            .trim();
            
        if (!entityName) return null;

        // 3. Tra cứu trong DataHub
        const target = DataHub.resolveIdFromQuery(entityName);
        
        // 4. Chỉ nhận diện nếu thực thể là Tác giả
        if (target && target.group === 'ky-tai') {
            return 'find-author-info';
        }
        
        // Nếu không phải Tác giả -> Nhường cho CharacterAgent hoặc PoeticsAgent
        return null;
    }
};
