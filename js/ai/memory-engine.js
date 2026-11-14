/**
 * ==========================================================
 * VĂN ĐẠO AI - MEMORY ENGINE
 * Vị trí: js/ai/memory-engine.js
 * Version: 1.0.0 (Contextual Memory)
 * ==========================================================
 * TRIẾT LÝ:
 * - Ghi nhớ những gì người dùng vừa nói để tạo mạch hội thoại.
 * - Sử dụng localStorage (Offline-First).
 * ==========================================================
 */

const MEMORY_KEY = 'vandao_ai_memory';
const MAX_HISTORY = 5; // Lưu tối đa 5 lượt hội thoại gần nhất

export const MemoryEngine = {
    // Lưu lại lượt hội thoại
    saveTurn(query, result) {
        const history = this.getHistory();
        
        // Trích xuất thực thể chính (nếu có) để làm ngữ cảnh
        const contextEntities = result.meta ? result.meta.map(m => m.id) : [];
        
        history.push({
            query: query,
            answer: result.answer,
            entities: contextEntities,
            timestamp: Date.now()
        });

        if (history.length > MAX_HISTORY) {
            history.shift(); // Xóa cái cũ nhất
        }

        localStorage.setItem(MEMORY_KEY, JSON.stringify(history));
    },

    // Lấy lịch sử
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(MEMORY_KEY)) || [];
        } catch {
            return [];
        }
    },

    // Tìm ngữ cảnh từ câu hỏi trước đó (Giải quyết đại từ)
    resolveContext(cleanQuery) {
        const history = this.getHistory();
        if (history.length === 0) return null;

        const lastTurn = history[history.length - 1];
        
        // Nếu câu hỏi hiện tại chứa đại từ chỉ định ("nó", "ông ấy", "tác phẩm này")
        // và câu hỏi trước đó có chứa thực thể (ví dụ: "truyen-kieu")
        if (/(no|ong ay|ba ay|tac pham nay|tac gia nay|bai tho nay)/.test(cleanQuery)) {
            if (lastTurn.entities && lastTurn.entities.length > 0) {
                return {
                    targetEntity: lastTurn.entities[0], // Lấy thực thể chính của câu trước
                    previousQuery: lastTurn.query
                };
            }
        }
        return null;
    },

    // Xóa bộ nhớ
    clear() {
        localStorage.removeItem(MEMORY_KEY);
    }
};
