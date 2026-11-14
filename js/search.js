/**
 * ==========================================================
 * VĂN ĐẠO - SEARCH MODULE (js/search.js)
 * Vị trí: js/search.js
 * Version: 4.0.0 (Semantic Search & TF-IDF)
 * ==========================================================
 * CHỨC NĂNG:
 * - Xây dựng Inverted Index (Chỉ mục ngược) từ STATE.GLOBAL_RECORDS.
 * - [MỚI] Áp dụng MathUtils.calculateSimilarity (Cosine Similarity) 
 *   để tìm kiếm mờ theo ngữ nghĩa (Fuzzy Search).
 * - Xử lý mượt mà với Tiếng Việt (không phân biệt dấu, viết hoa/thường).
 * ==========================================================
 */

import { STATE } from './config.js';
import { normalizeRouteText, getRecordTitleAlias } from './utils.js';
import { MathUtils } from './ai/math-utils.js';

export const VDSearchEngine = (() => {
    let invertedIndex = Object.create(null); 
    let docLengths = Object.create(null);    
    let totalDocs = 0;
    let isIndexed = false;

    const STOPWORDS = new Set([
        "cua", "va", "la", "co", "trong", "cho", "nhung", "cac", "mot", 
        "duoc", "voi", "da", "de", "khi", "ra", "ve", "tu", "nhu", "nguoi", 
        "tai", "thi", "ma", "nay", "do", "nhung", "cung", "se", "dang"
    ]);

    function tokenize(text) {
        if (!text) return [];
        const clean = normalizeRouteText(String(text).replace(/<[^>]*>/g, ' '));
        return (clean.match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    async function buildIndexAsync() {
        invertedIndex = Object.create(null);
        docLengths = Object.create(null);
        
        const entries = STATE.GLOBAL_RECORDS.slice();
        totalDocs = entries.length;
        if (totalDocs === 0) return;

        const CHUNK_SIZE = 50; 
        
        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
            const chunk = entries.slice(i, i + CHUNK_SIZE);
            chunk.forEach(record => {
                const item = record.data;
                const key = record.key;
                
                const titleText = item.title || item.name || '';
                const authorText = item.author || '';
                const descText = item.desc || item.description || '';
                const tagsText = Array.isArray(item.tags) ? item.tags.join(' ') : '';
                const moodText = Array.isArray(item.cam_xuc) ? item.cam_xuc.join(' ') : '';
                
                const words = tokenize([titleText, authorText, descText, tagsText, moodText].join(' '));
                docLengths[key] = Math.max(words.length, 1);
                
                words.forEach(w => {
                    if (!invertedIndex[w]) invertedIndex[w] = Object.create(null);
                    invertedIndex[w][key] = (invertedIndex[w][key] || 0) + 1;
                });
            });
            await new Promise(r => setTimeout(r, 0));
        }
        isIndexed = true;
        console.log(`[SEARCH] Đã xây dựng xong Inverted Index cho ${totalDocs} tài liệu.`);
    }

    function search(query) {
        const qNorm = normalizeRouteText(query);
        const tokens = tokenize(qNorm);
        if (!qNorm) return [];
        
        const scores = new Map();

        // TẦNG 1: EXACT MATCH & MULTI-TOKEN
        for (const record of STATE.GLOBAL_RECORDS) {
            const item = record.data;
            const titleText = item.title || item.name || '';
            const title = normalizeRouteText(titleText);
            const titleAlias = normalizeRouteText(getRecordTitleAlias(item, record.group));
            const author = normalizeRouteText(item.author);
            const tags = Array.isArray(item.tags) ? normalizeRouteText(item.tags.join(' ')) : '';
            const mood = Array.isArray(item.cam_xuc) ? normalizeRouteText(item.cam_xuc.join(' ')) : '';
            
            let score = 0;
            
            if (title === qNorm || titleAlias === qNorm) score += 2000;
            else if (title.includes(qNorm) || titleAlias.includes(qNorm)) score += 800;
            
            if (author && author === qNorm) score += (record.group === 'ky-tai' ? 700 : 300);
            else if (author && author.includes(qNorm)) score += 150;

            if (tags.includes(qNorm)) score += 500;
            if (mood.includes(qNorm)) score += 500;

            if (tokens.length > 0) {
                let matchCount = 0;
                tokens.forEach(t => {
                    if (title.includes(t) || titleAlias.includes(t) || tags.includes(t) || mood.includes(t)) matchCount++;
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
                    
                    const title = normalizeRouteText(record.data.title || record.data.name || '');
                    const author = normalizeRouteText(record.data.author);
                    
                    if (title.includes(w)) score *= 5;
                    else if (author.includes(w)) score *= 3;
                    
                    scores.set(key, (scores.get(key) || 0) + score);
                }
            });
        }

        // TẦNG 3: [MỚI] SEMANTIC MATH FALLBACK (Cosine Similarity)
        // Nếu không tìm thấy kết quả nào, dùng thuật toán để tìm gần nghĩa
        if (scores.size === 0 && tokens.length > 0) {
            for (const record of STATE.GLOBAL_RECORDS) {
                const item = record.data;
                const docText = [item.title, item.desc, item.tags?.join(' '), item.cam_xuc?.join(' ')].filter(Boolean).join(' ');
                const docTokens = tokenize(docText);
                
                const simScore = MathUtils.calculateSimilarity(tokens, docTokens);
                if (simScore > 0.15) { // Ngưỡng tương đồng tối thiểu 15%
                    scores.set(record.key, simScore * 1000); // Nhân 1000 để cân bằng điểm
                }
            }
        }

        return Array.from(scores, ([key, score]) => {
            const record = STATE.GLOBAL_INDEX_BY_KEY.get(key);
            return record ? { key, id: record.id, group: record.group, score } : null;
        }).filter(Boolean).sort((a, b) => b.score - a.score);
    }

    return { buildIndexAsync, search, getIndexStatus: () => isIndexed };
})();

export function triggerAsyncSearchIndex() {
    if (!VDSearchEngine.getIndexStatus()) {
        VDSearchEngine.buildIndexAsync();
    }
}
