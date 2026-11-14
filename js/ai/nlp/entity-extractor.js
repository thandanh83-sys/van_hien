/**
 * ==========================================================
 * VĂN ĐẠO AI - ENTITY EXTRACTOR (js/ai/nlp/entity-extractor.js)
 * Vị trí: js/ai/nlp/entity-extractor.js
 * ==========================================================
 * MỤC ĐÍCH:
 * - Tìm các thực thể (Tác giả, Tác phẩm, Thể loại) trong câu.
 * - Sử dụng DataHub để dịch Tên thành ID.
 * ==========================================================
 */

import { DataHub } from '../../network/data-hub.js';
import { normalizeRouteText } from '../../utils.js';

export const EntityExtractor = {
    /**
     * Tìm kiếm thực thể dựa trên văn bản.
     * @param {string} text - Câu đã được chuẩn hóa.
     * @returns {Array} Mảng các thực thể tìm thấy: { id, group, name }
     */
    extract(text) {
        const entities = [];
        const words = text.split(/\s+/);
        
        // 1. Thử tìm kiếm các cụm từ dài trước (Tên tác phẩm thường dài)
        // Thuật toán: Duyệt từ trái sang phải, gộp tối đa 5 từ để check.
        for (let i = 0; i < words.length; i++) {
            for (let len = Math.min(5, words.length - i); len >= 1; len--) {
                const phrase = words.slice(i, i + len).join(' ');
                
                // Bỏ qua các từ quá ngắn (trừ khi là tên viết tắt đặc biệt)
                if (phrase.length < 3) continue;

                const target = DataHub.resolveIdFromQuery(phrase);
                if (target) {
                    // Kiểm tra trùng lặp
                    if (!entities.some(e => e.id === target.id)) {
                        const meta = DataHub.getMetadata(target.id);
                        entities.push({
                            id: target.id,
                            group: target.group,
                            name: meta ? meta.data.title : phrase
                        });
                    }
                }
            }
        }
        
        return entities;
    }
};
