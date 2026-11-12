/**
 * ==========================================================
 * VĂN ĐẠO - SEARCH MODULE (js/search.js)
 * Chức năng: Cỗ máy tìm kiếm VDSearchEngine.
 * Áp dụng thuật toán Inverted Index + TF-IDF, không phân biệt dấu.
 * ==========================================================
 */

import { STATE } from './config.js';
import { normalizeRouteText, getRecordTitleAlias } from './utils.js';

export const VDSearchEngine = (() => {
    let invertedIndex = Object.create(null);
    let docLengths = Object.create(null);
    let totalDocs = 0;
    let isIndexed = false;

    // Danh sách các từ dừng (Stopwords) - Những từ quá phổ biến, không cần đưa vào Index
    const STOPWORDS = new Set([
        "cua", "va", "la", "co", "trong", "cho", "nhung", "cac", "mot", 
        "duoc", "voi", "da", "de", "khi", "ra", "ve", "tu", "nhu", "nguoi", 
        "tai", "thi", "ma", "nay", "do"
    ]);

    /**
     * Hàm tách từ (Tokenizer): Làm sạch text và chia thành mảng các từ đơn
     */
    function tokenize(text) {
        if (!text) return [];
        // Xóa các thẻ HTML (nếu có) và chuẩn hóa text (bỏ dấu, viết thường)
        const clean = normalizeRouteText(String(text).replace(/<[^>]*>/g, ' '));
        // Tách theo khoảng trắng, giữ lại các từ dài hơn 1 ký tự và không nằm trong STOPWORDS
        return (clean.match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    /**
     * Hàm xây dựng chỉ mục (Index Builder): Chạy 1 lần khi khởi động App
     */
    async function buildIndexAsync() {
        invertedIndex = Object.create(null);
        docLengths = Object.create(null);
        
        // Lấy toàn bộ dữ liệu từ State
        const entries = STATE.GLOBAL_RECORDS.slice();
        totalDocs = entries.length;
        
        const CHUNK_SIZE = 50; // Chia lô 50 tài liệu để không chặn UI
        
        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
            const chunk = entries.slice(i, i + CHUNK_SIZE);
            
            chunk.forEach(record => {
                const item = record.data;
                const key = record.key;
                
                // Gom Tên tác phẩm, Tác giả, Mô tả, Nội dung để đưa vào bộ lọc tìm kiếm
                const titleText = item.title || item.name || '';
                const words = tokenize([titleText, item.author, item.desc, item.description, item.content].join(' '));
                
                // Lưu độ dài tài liệu (dùng cho thuật toán TF-IDF)
                docLengths[key] = Math.max(words.length, 1);
                
                // Đưa từng từ vào Inverted Index
                words.forEach(w => {
                    if (!invertedIndex[w]) invertedIndex[w] = Object.create(null);
                    invertedIndex[w][key] = (invertedIndex[w][key] || 0) + 1;
                });
            });
            
            // Nhường luồng (Yield) để trình duyệt kịp vẽ UI, tránh bị đơ
            await new Promise(r => setTimeout(r, 0));
        }
        
        isIndexed = true;
        console.log(`[SEARCH ENGINE] Đã xây dựng xong Inverted Index cho ${totalDocs} tài liệu.`);
    }

    /**
     * Hàm Tìm kiếm chính (Search)
     * @param {string} query - Từ khóa người dùng nhập
     * @returns {Array} Danh sách kết quả đã sắp xếp theo điểm số
     */
    function search(query) {
        const qNorm = normalizeRouteText(query);
        const tokens = tokenize(qNorm);
        if (!qNorm) return [];
        
        const scores = new Map();

        // BƯỚC 1: Tìm kiếm chính xác (Exact Match) dựa trên Tiêu đề và Tác giả
        for (const record of STATE.GLOBAL_RECORDS) {
            const item = record.data;
            const titleText = item.title || item.name || '';
            const title = normalizeRouteText(titleText);
            const titleAlias = normalizeRouteText(getRecordTitleAlias(item, record.group));
            const author = normalizeRouteText(item.author);
            
            let score = 0;
            // Ưu tiên khớp chính xác tiêu đề
            if (title === qNorm || titleAlias === qNorm) score += 700;
            else if (title.includes(qNorm) || titleAlias.includes(qNorm)) score += 360;
            
            // Ưu tiên khớp tên tác giả (điểm cao hơn nếu tìm ở nhóm Tác giả 'ky-tai')
            if (author && author === qNorm) score += record.group === 'ky-tai' ? 620 : 260;
            else if (author && author.includes(qNorm)) score += 120;
            
            if (score) scores.set(record.key, score);
        }

        // BƯỚC 2: Tìm kiếm mờ (Fuzzy Match) dựa trên Inverted Index và TF-IDF
        if (isIndexed && tokens.length) {
            tokens.forEach(w => {
                const docs = invertedIndex[w];
                if (!docs) return;
                
                const docCount = Object.keys(docs).length;
                // Công thức IDF (Inverse Document Frequency): Từ nào xuất hiện ở ít tài liệu thì điểm càng cao
                const idf = Math.log((totalDocs || 1) / Math.max(docCount, 1)) + 1;
                
                for (const [key, count] of Object.entries(docs)) {
                    const record = STATE.GLOBAL_INDEX_BY_KEY.get(key);
                    if (!record) continue;
                    
                    // Công thức TF (Term Frequency)
                    const tf = count / (docLengths[key] || 1);
                    let score = tf * idf;
                    
                    // Nhân hệ số ưu tiên nếu từ khóa nằm trong Tiêu đề hoặc Tác giả
                    const titleText = record.data.title || record.data.name || '';
                    const title = normalizeRouteText(titleText);
                    const author = normalizeRouteText(record.data.author);
                    if (title.includes(w)) score *= 5;
                    else if (author.includes(w)) score *= 3;
                    
                    scores.set(key, (scores.get(key) || 0) + score);
                }
            });
        }

        // BƯỚC 3: Chuyển Map thành Mảng và Sắp xếp giảm dần theo điểm
        return Array.from(scores, ([key, score]) => {
            const record = STATE.GLOBAL_INDEX_BY_KEY.get(key);
            return record ? { key, id: record.id, group: record.group, score } : null;
        }).filter(Boolean).sort((a, b) => b.score - a.score);
    }

    return { 
        buildIndexAsync, 
        search, 
        getIndexStatus: () => isIndexed 
    };
})();

/**
 * Hàm kích hoạt chạy ngầm việc xây dựng Index (được gọi từ main.js)
 * Ngăn việc gọi hàm buildIndexAsync nhiều lần không cần thiết.
 */
export function triggerAsyncSearchIndex() {
    if (!VDSearchEngine.getIndexStatus()) {
        VDSearchEngine.buildIndexAsync();
    }
}
