/**
 * ==========================================================
 * VĂN ĐẠO - SEARCH MODULE (js/search.js)
 * Vị trí: js/search.js
 * Version: 2.0.0 (Offline Local Index & TF-IDF)
 * ==========================================================
 * CHỨC NĂNG:
 * - Xây dựng Inverted Index (Chỉ mục ngược) từ STATE.GLOBAL_RECORDS.
 * - Thuật toán chấm điểm: Ưu tiên khớp tiêu đề (Exact/Partial) > Tác giả > Nội dung.
 * - Xử lý mượt mà với Tiếng Việt (không phân biệt dấu, viết hoa/thường).
 * ==========================================================
 */

import { STATE } from './config.js';
import { normalizeRouteText, getRecordTitleAlias } from './utils.js';

export const VDSearchEngine = (() => {
    // Bộ nhớ Index
    let invertedIndex = Object.create(null); // { "tu_khoa": { "record_key": count } }
    let docLengths = Object.create(null);    // { "record_key": length }
    let totalDocs = 0;
    let isIndexed = false;

    // Danh sách từ dừng (Loại bỏ các từ không có giá trị tìm kiếm)
    const STOPWORDS = new Set([
        "cua", "va", "la", "co", "trong", "cho", "nhung", "cac", "mot", 
        "duoc", "voi", "da", "de", "khi", "ra", "ve", "tu", "nhu", "nguoi", 
        "tai", "thi", "ma", "nay", "do", "nhung", "cung", "se", "dang"
    ]);

    /**
     * Tách từ (Tokenize) và chuẩn hóa
     */
    function tokenize(text) {
        if (!text) return [];
        // Xóa HTML tags, chuẩn hóa, bỏ từ dừng
        const clean = normalizeRouteText(String(text).replace(/<[^>]*>/g, ' '));
        return (clean.match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    /**
     * Xây dựng Index (Chạy ngầm để không treo UI)
     */
    async function buildIndexAsync() {
        invertedIndex = Object.create(null);
        docLengths = Object.create(null);
        
        const entries = STATE.GLOBAL_RECORDS.slice();
        totalDocs = entries.length;
        if (totalDocs === 0) return;

        const CHUNK_SIZE = 50; // Xử lý 50 record mỗi lần để nhường UI
        
        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
            const chunk = entries.slice(i, i + CHUNK_SIZE);
            
            chunk.forEach(record => {
                const item = record.data;
                const key = record.key;
                
                // Gom TẤT CẢ các trường có thể tìm kiếm
                const titleText = item.title || item.name || '';
                const authorText = item.author || '';
                const descText = item.desc || item.description || '';
                
                const words = tokenize([titleText, authorText, descText].join(' '));
                
                docLengths[key] = Math.max(words.length, 1);
                
                words.forEach(w => {
                    if (!invertedIndex[w]) invertedIndex[w] = Object.create(null);
                    invertedIndex[w][key] = (invertedIndex[w][key] || 0) + 1;
                });
            });
            
            // Nhường UI 1 nhịp
            await new Promise(r => setTimeout(r, 0));
        }
        
        isIndexed = true;
        console.log(`[SEARCH] Đã xây dựng xong Inverted Index cho ${totalDocs} tài liệu.`);
    }

    /**
     * Tìm kiếm (Kết hợp Exact Match và TF-IDF)
     */
    function search(query) {
        const qNorm = normalizeRouteText(query);
        const tokens = tokenize(qNorm);
        if (!qNorm) return [];
        
        const scores = new Map();

        // TẦNG 1: EXACT MATCH & MULTI-TOKEN (Ưu tiên tuyệt đối)
        for (const record of STATE.GLOBAL_RECORDS) {
            const item = record.data;
            const titleText = item.title || item.name || '';
            const title = normalizeRouteText(titleText);
            const titleAlias = normalizeRouteText(getRecordTitleAlias(item, record.group));
            const author = normalizeRouteText(item.author);
            
            let score = 0;
            
            // Khớp chính xác tiêu đề
            if (title === qNorm || titleAlias === qNorm) score += 2000;
            // Khớp một phần tiêu đề
            else if (title.includes(qNorm) || titleAlias.includes(qNorm)) score += 800;
            
            // Khớp tác giả
            if (author && author === qNorm) score += (record.group === 'ky-tai' ? 700 : 300);
            else if (author && author.includes(qNorm)) score += 150;

            // Khớp tất cả các từ khóa (Multi-token)
            if (tokens.length > 0) {
                let matchCount = 0;
                tokens.forEach(t => {
                    if (title.includes(t) || titleAlias.includes(t)) matchCount++;
                });
                if (matchCount === tokens.length) score += 1500 + (tokens.length * 200);
                else if (matchCount > 0) score += matchCount * 150;
            }
            
            if (score > 0) scores.set(record.key, score);
        }

        // TẦNG 2: FUZZY MATCH (TF-IDF)
        if (isIndexed && tokens.length) {
            tokens.forEach(w => {
                const docs = invertedIndex[w];
                if (!docs) return;
                
                const docCount = Object.keys(docs).length;
                const idf = Math.log((totalDocs || 1) / Math.max(docCount, 1)) + 1;
                
                for (const [key, count] of Object.entries(docs)) {
                    const record = STATE.GLOBAL_INDEX_BY_KEY.get(key);
                    if (!record) continue;
                    
                    const tf = count / (docLengths[key] || 1);
                    let score = tf * idf;
                    
                    // Nếu từ khóa xuất hiện trong tiêu đề, nhân điểm lên
                    const title = normalizeRouteText(record.data.title || record.data.name || '');
                    const author = normalizeRouteText(record.data.author);
                    
                    if (title.includes(w)) score *= 5;
                    else if (author.includes(w)) score *= 3;
                    
                    scores.set(key, (scores.get(key) || 0) + score);
                }
            });
        }

        // Sắp xếp và trả về
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
 * Kích hoạt xây dựng Index (Được gọi từ main.js)
 */
export function triggerAsyncSearchIndex() {
    if (!VDSearchEngine.getIndexStatus()) {
        VDSearchEngine.buildIndexAsync();
    }
}
