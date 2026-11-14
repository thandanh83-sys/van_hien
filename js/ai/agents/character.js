/**
 * ==========================================================
 * VĂN ĐẠO AI - CHARACTER AGENT (js/ai/agents/character.js)
 * Vị trí: js/ai/agents/character.js
 * Version: 1.1.0 (Special Detector for Character)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tìm kiếm thông tin về nhân vật văn học (Thúy Kiều, Chí Phèo, Tấm, Cám...).
 * - Xác định nhân vật xuất hiện trong tác phẩm nào.
 * - Nhận diện câu hỏi dạng "X là ai" nếu X là Nhân vật.
 * 
 * LỊCH SỬ PHIÊN BẢN:
 * - v1.0.0: Plugin Architecture.
 * - v1.1.0: Thêm `specialDetector` để nhận diện intent `get-character-info`
 *           từ câu hỏi tự nhiên (VD: "Thúy Kiều là ai?").
 *           Giúp IntentRouter phân biệt giữa Tác giả và Nhân vật.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { normalizeRouteText } from '../../utils.js';
import { DataHub } from '../../network/data-hub.js';

export const CharacterAgent = {
    // =================================================================
    // 1. HÀM XỬ LÝ CHÍNH (Được gọi từ MasterAI)
    // =================================================================
    /**
     * Lấy thông tin về một nhân vật văn học.
     * Câu hỏi: "Thúy Kiều là ai?", "Chí Phèo xuất hiện trong tác phẩm nào?"
     * 
     * @param {string} input - Tên nhân vật (VD: "Thúy Kiều")
     * @returns {Promise<Object>} Kết quả chuẩn (answer, detail, source, meta)
     */
    async getCharacterInfo(input) {
        if (!input) {
            return { 
                answer: 'Bạn muốn tìm hiểu về nhân vật nào?', 
                source: 'character' 
            };
        }

        // Bước 1: Làm sạch tên nhân vật (Loại bỏ các từ thừa)
        const cleanName = this._cleanCharacterName(input);
        if (!cleanName) {
            return { answer: 'Tên nhân vật không hợp lệ.', source: 'character' };
        }

        const normalizedQuery = normalizeRouteText(cleanName);

        // Bước 2: Quét trong kho Tác phẩm để tìm manh mối
        const findings = this._scanWorksForCharacter(normalizedQuery);

        if (findings.length === 0) {
            return this._handleNotFound(cleanName);
        }

        // Bước 3: Tổng hợp kết quả
        return this._synthesizeCharacterInfo(cleanName, findings);
    },

    // =================================================================
    // 2. CÁC HÀM HỖ TRỢ NỘI BỘ (PRIVATE METHODS)
    // =================================================================

    /**
     * Làm sạch tên nhân vật (VD: "nhân vật Thúy Kiều" -> "Thúy Kiều").
     */
    _cleanCharacterName(input) {
        return input
            .replace(/\b(nhân vật|nhan vat|ai là|ai la|cho tôi biết|thông tin về|về)\b/gi, '')
            .replace(/[?!.]/g, '')
            .trim();
    },

    /**
     * Quét toàn bộ kho Tác phẩm để tìm nhân vật.
     * Trả về mảng các tác phẩm có chứa tên nhân vật.
     */
    _scanWorksForCharacter(normalizedQuery) {
        const findings = [];

        for (const work of APP_DATA.WORKS_DATA) {
            let matched = false;
            let context = '';

            // 1. Kiểm tra xem tên nhân vật có nằm trong Tiêu đề tác phẩm không
            // (VD: "Chí Phèo" là tên tác phẩm)
            if (normalizeRouteText(work.title).includes(normalizedQuery)) {
                matched = true;
                context = `Tác phẩm "${work.title}" được lấy tên theo nhân vật chính.`;
            }

            // 2. Kiểm tra trong phần mô tả (desc)
            if (!matched && work.desc && normalizeRouteText(work.desc).includes(normalizedQuery)) {
                matched = true;
                context = `Nhân vật xuất hiện trong tác phẩm "${work.title}".`;
            }

            if (matched) {
                findings.push({
                    work: work,
                    context: context
                });
            }
        }

        return findings;
    },

    /**
     * Tổng hợp thông tin nhân vật từ các manh mối tìm được.
     */
    _synthesizeCharacterInfo(characterName, findings) {
        const mainWork = findings[0].work;
        const otherWorks = findings.slice(1);

        let answer = `Nhân vật "${characterName}" là một hình tượng văn học đặc sắc. `;
        
        if (findings.length === 1) {
            answer += `Nhân vật này gắn liền với tác phẩm "${mainWork.title}" của tác giả ${mainWork.author}. `;
        } else {
            answer += `Nhân vật này xuất hiện trong ${findings.length} tác phẩm, tiêu biểu nhất là "${mainWork.title}". `;
        }

        // Thêm nhận xét văn chương
        answer += `Trong dòng chảy văn học, mỗi nhân vật đều mang một số phận, một tiếng lòng riêng. Để hiểu rõ hơn về "${characterName}", bạn có thể đọc trực tiếp tác phẩm hoặc sử dụng tính năng Phân tích.`;

        // Chuẩn bị Detail
        let detail = `Tác giả: ${mainWork.author}. Thời kỳ: ${mainWork.era || 'Không rõ'}.`;
        if (otherWorks.length > 0) {
            detail += ` Ngoài ra, tên nhân vật còn xuất hiện trong: ${otherWorks.map(w => w.title).join(', ')}.`;
        }

        // Chuẩn bị Meta (Các tác phẩm liên quan để UI render nút bấm)
        const metaList = findings.map(f => f.work);

        return {
            answer: answer,
            detail: detail,
            source: 'character',
            meta: metaList
        };
    },

    /**
     * Xử lý khi không tìm thấy nhân vật trong hệ thống.
     */
    _handleNotFound(characterName) {
        return {
            answer: `Kho tàng hiện tại chưa có dữ liệu chi tiết về nhân vật "${characterName}".`,
            detail: 'Văn Đạo liên tục được cập nhật. Bạn có thể thử tra cứu tên tác phẩm hoặc tác giả liên quan.',
            source: 'character',
            meta: []
        };
    }
};

// =====================================================================
// AGENT INFO - Tự mô tả metadata cho Auto-Registry (v7.0.0+)
// =====================================================================
/**
 * Metadata tự mô tả của CharacterAgent.
 * Chuyên trách tra cứu nhân vật văn học.
 */
CharacterAgent.agentInfo = {
    // ---- Định danh ----
    key: 'character',
    name: 'Nhân Vật AI',
    description: 'Chuyên trách tra cứu nhân vật văn học.',

    // ---- Năng lực ----
    capabilities: {
        'get-character-info': 'getCharacterInfo' // "Thúy Kiều là ai?"
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['literature', 'knowledge'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        // Đã xóa 'la ai' để tránh xung đột với KnowledgeAgent.
        // Việc nhận diện 'la ai' sẽ do specialDetector đảm nhận.
        'get-character-info': ['nhan vat', 'character', 'nhan vat nao']
    },

    // =================================================================
    // [v1.1.0 - THÊM MỚI] SPECIAL DETECTOR
    // =================================================================
    /**
     * Nhận diện câu hỏi dạng "X là ai" nếu X là Nhân vật.
     * 
     * Cơ chế:
     * - Kiểm tra mẫu câu "X là ai" hoặc "X là gì".
     * - Trích xuất tên thực thể X.
     * - Quét trong kho tác phẩm (APP_DATA.WORKS_DATA).
     * - Nếu tìm thấy X xuất hiện trong tác phẩm -> Trả về intent 'get-character-info'.
     * - Nếu không tìm thấy (VD: là Tác giả, Thuật ngữ), trả về null để Agent khác xử lý.
     * 
     * Lưu ý: Logic này chạy SAU KnowledgeAgent (do thứ tự trong AGENT_CLASSES).
     * Nếu KnowledgeAgent đã nhận diện là Tác giả, CharacterAgent sẽ không được gọi.
     * Nếu KnowledgeAgent trả về null (không phải Tác giả), CharacterAgent sẽ thử sức.
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
        
        // 2. Làm sạch tên thực thể
        const entityName = match[1]
            .replace(/\b(nhan vat|character|thong tin ve)\b/g, '')
            .trim();
            
        if (!entityName) return null;

        // 3. Quét trong kho tác phẩm để tìm nhân vật
        const normalizedQuery = normalizeRouteText(entityName);
        const findings = CharacterAgent._scanWorksForCharacter(normalizedQuery);
        
        // 4. Nếu tìm thấy nhân vật -> Nhận diện
        if (findings.length > 0) {
            return 'get-character-info';
        }
        
        // Nếu không tìm thấy -> Nhường cho Agent khác (PoeticsAgent, ...)
        return null;
    }
};
