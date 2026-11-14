/**
 * ==========================================================
 * VĂN ĐẠO AI - MEMORY ENGINE (KÝ ỨC & HỌC HỎI)
 * Vị trí: js/ai/memory-engine.js
 * Version: 2.0.0 (Long-term Memory & Learning)
 * ==========================================================
 */

const MEMORY_KEY = 'vandao_memory_v2';
const MAX_HISTORY = 10; 
const MAX_LESSONS = 50;

export const MemoryEngine = {
    // 1. Lưu lượt hội thoại
    saveTurn(query, result) {
        const data = this._loadData();
        
        // Trích xuất thực thể chính (để nhớ ngữ cảnh)
        const entities = result.meta ? result.meta.map(m => m.id) : [];
        
        data.history.push({
            query,
            answer: result.answer,
            entities,
            timestamp: Date.now()
        });

        if (data.history.length > MAX_HISTORY) data.history.shift();
        
        this._saveData(data);
    },

    // 2. Ghi nhận bài học (Khi người dùng sửa lỗi hoặc cung cấp kiến thức mới)
    learnLesson(topic, lessonContent) {
        const data = this._loadData();
        data.lessons.push({
            topic,
            content: lessonContent,
            timestamp: Date.now()
        });
        if (data.lessons.length > MAX_LESSONS) data.lessons.shift();
        this._saveData(data);
        console.log(`[LEARNING] Ta đã ghi nhớ bài học về: ${topic}`);
    },

    // 3. Ghi nhận khoảng trống tri thức (Khi AI không trả lời được)
    logKnowledgeGap(query) {
        const data = this._loadData();
        if (!data.gaps.includes(query)) {
            data.gaps.push(query);
            this._saveData(data);
            console.log(`[LEARNING] Ta đã ghi nhận câu hỏi chưa có đáp án: "${query}"`);
        }
    },

    // 4. Lấy ngữ cảnh (Giải quyết đại từ: "nó", "ông ấy", "tác phẩm này")
    resolveContext(cleanQuery) {
        const data = this._loadData();
        if (data.history.length === 0) return null;

        const lastTurn = data.history[data.history.length - 1];
        
        // Nếu có đại từ chỉ định
        if (/(no|ong ay|ba ay|tac pham nay|tac gia nay|bai tho nay|noi dung do)/.test(cleanQuery)) {
            if (lastTurn.entities && lastTurn.entities.length > 0) {
                return {
                    targetEntity: lastTurn.entities[0],
                    previousQuery: lastTurn.query
                };
            }
        }
        return null;
    },

    // Truy xuất toàn bộ dữ liệu (dùng cho debug/audit)
    getData() { return this._loadData(); },

    _loadData() {
        try {
            const raw = localStorage.getItem(MEMORY_KEY);
            if (!raw) return { history: [], lessons: [], gaps: [] };
            return JSON.parse(raw);
        } catch {
            return { history: [], lessons: [], gaps: [] };
        }
    },

    _saveData(data) {
        localStorage.setItem(MEMORY_KEY, JSON.stringify(data));
    }
};
