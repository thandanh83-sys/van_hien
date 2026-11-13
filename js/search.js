/**
 * ==========================================================
 * VĂN ĐẠO - SEARCH MODULE (js/search.js)
 * Vị trí: js/search.js
 * Version: 1.0.0
 * ==========================================================
 * Chức năng: 
 * - Xây dựng Inverted Index từ GLOBAL_RECORDS.
 * - Tìm kiếm thông minh (TF-IDF + Fuzzy Match).
 * - Không phân biệt dấu, hỗ trợ tiếng Việt.
 * ==========================================================
 */

import { STATE } from './config.js';
import { normalizeRouteText, getRecordTitleAlias } from './utils.js';

export const VDSearchEngine = (() => {
    let invertedIndex = Object.create(null);
    let docLengths = Object.create(null);
    let totalDocs = 0;
    let isIndexed = false;

    // Danh sách Stopwords (Từ dừng - Quá phổ biến, bỏ qua để tăng tốc)
    const STOPWORDS = new Set([
        "cua", "va", "la", "co", "trong", "cho", "nhung", "cac", "mot", 
        "duoc", "voi", "da", "de", "khi", "ra", "ve", "tu", "nhu", "nguoi", 
        "tai", "thi", "ma", "nay", "do"
    ]);

    /**
     * Tách từ (Tokenize) và làm sạch văn bản
     */
    function tokenize(text) {
        if (!text) return [];
        const clean = normalizeRouteText(String(text).replace(/<[^>]*>/g, ' '));
        return (clean.match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    /**
     * Xây dựng chỉ mục (Chạy 1 lần khi khởi động)
     */
    async function buildIndexAsync() {
        invertedIndex = Object.create(null);
        docLengths = Object.create(null);
        
        const entries = STATE.GLOBAL_RECORDS.slice();
        totalDocs = entries.length;
        if (totalDocs === 0) return;

        const CHUNK_SIZE = 50; // Xử lý theo lô để không đơ UI
        
        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
            const chunk = entries.slice(i, i + CHUNK_SIZE);
            
            chunk.forEach(record => {
                const item = record.data;
                const key = record.key;
                
                const titleText = item.title || item.name || '';
                // Nối các trường quan trọng để tìm kiếm
                const words = tokenize([
                    titleText, 
                    item.author, 
                    item.desc, 
                    item.description, 
                    item.content
                ].join(' '));
                
                docLengths[key] = Math.max(words.length, 1);
                
                words.forEach(w => {
                    if (!invertedIndex[w]) invertedIndex[w] = Object.create(null);
                    invertedIndex[w][key] = (invertedIndex[w][key] || 0) + 1;
                });
            });
            
            // Nhường luồng cho UI
            await new Promise(r => setTimeout(r, 0));
        }
        
        isIndexed = true;
        console.log(`[SEARCH] Đã xây dựng xong Inverted Index cho ${totalDocs} tài liệu.`);
    }

    /**
     * Hàm Tìm kiếm chính
     * @param {string} query - Từ khóa
     * @returns {Array} Danh sách { key, id, group, score }
     */
    function search(query) {
        const qNorm = normalizeRouteText(query);
        const tokens = tokenize(qNorm);
        if (!qNorm) return [];
        
        const scores = new Map();

        // BƯỚC 1: Exact Match & Substring Match (Ưu tiên Tiêu đề & Tác giả)
        for (const record of STATE.GLOBAL_RECORDS) {
            const item = record.data;
            const titleText = item.title || item.name || '';
            const title = normalizeRouteText(titleText);
            const titleAlias = normalizeRouteText(getRecordTitleAlias(item, record.group));
            const author = normalizeRouteText(item.author);
            
            let score = 0;
            
            // Khớp tiêu đề
            if (title === qNorm || titleAlias === qNorm) score += 700;
            else if (title.includes(qNorm) || titleAlias.includes(qNorm)) score += 360;
            
            // Khớp tác giả
            if (author && author === qNorm) score += (record.group === 'ky-tai' ? 620 : 260);
            else if (author && author.includes(qNorm)) score += 120;
            
            if (score > 0) scores.set(record.key, score);
        }

        // BƯỚC 2: Fuzzy Match (Inverted Index + TF-IDF)
        if (isIndexed && tokens.length) {
            tokens.forEach(w => {
                const docs = invertedIndex[w];
                if (!docs) return;
                
                const docCount = Object.keys(docs).length;
                // IDF: Từ xuất hiện ở ít tài liệu thì điểm càng cao
                const idf = Math.log((totalDocs || 1) / Math.max(docCount, 1)) + 1;
                
                for (const [key, count] of Object.entries(docs)) {
                    const record = STATE.GLOBAL_INDEX_BY_KEY.get(key);
                    if (!record) continue;
                    
                    // TF: Tần suất xuất hiện trong tài liệu
                    const tf = count / (docLengths[key] || 1);
                    let score = tf * idf;
                    
                    // Boost điểm nếu từ khóa nằm trong Tiêu đề / Tác giả
                    const titleText = record.data.title || record.data.name || '';
                    const title = normalizeRouteText(titleText);
                    const author = normalizeRouteText(record.data.author);
                    
                    if (title.includes(w)) score *= 5;
                    else if (author.includes(w)) score *= 3;
                    
                    scores.set(key, (scores.get(key) || 0) + score);
                }
            });
        }

        // BƯỚC 3: Sắp xếp và trả về
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
 * Kích hoạt xây dựng Index (Ngầm)
 */
export function triggerAsyncSearchIndex() {
    if (!VDSearchEngine.getIndexStatus()) {
        VDSearchEngine.buildIndexAsync();
    }
}