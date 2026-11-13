/**
 * ==========================================================
 * VĂN ĐẠO - DATA HUB (js/network/data-hub.js)
 * Vị trí: js/network/data-hub.js
 * Version: 2.0.0 (Knowledge Graph & Offline-First)
 * ==========================================================
 * CHỨC NĂNG:
 * - Trung tâm truy xuất dữ liệu duy nhất cho toàn bộ AI.
 * - Quản lý bộ nhớ đệm (RAM Cache).
 * - Tự động xây dựng Mạng lưới Tri thức (Knowledge Graph).
 * - Đảm bảo hoạt động Offline 100% (qua Service Worker).
 * ==========================================================
 */

import { APP_DATA, STATE } from '../config.js';
import { normalizeRouteText } from '../utils.js';

// Bộ nhớ đệm RAM cấp cao (Tránh việc AI hỏi đi hỏi lại 1 ID nhiều lần)
const ramCache = new Map();
// Bộ nhớ đệm các mối quan hệ (Graph Cache)
const relationCache = new Map();

export const DataHub = {
    // =================================================================
    // PHẦN 1: TRUY XUẤT CƠ BẢN (ID RESOLUTION & METADATA)
    // =================================================================

    /**
     * Tìm ID chính xác từ một chuỗi (Tên tác phẩm, tên tác giả, v.v.)
     * Dùng khi người dùng nhập tay thay vì ID.
     * @param {string} query 
     * @returns {Object|null} { id, group }
     */
    resolveIdFromQuery(query) {
        if (!query) return null;
        
        // 1. Nếu là ID chính xác trong hệ thống
        if (STATE.GLOBAL_INDEX.has(query)) {
            const record = STATE.GLOBAL_INDEX.get(query);
            return { id: record.id, group: record.group };
        }

        // 2. Tìm theo tên (không phân biệt hoa thường, dấu)
        const normalizedQuery = normalizeRouteText(query);
        for (const record of STATE.GLOBAL_RECORDS) {
            const item = record.data;
            const title = normalizeRouteText(item.title || item.name || '');
            const alias = normalizeRouteText(item.title ? item.title.replace(/^Chân Dung Tác Giả:\s*/i, '') : '');
            
            if (title === normalizedQuery || alias === normalizedQuery) {
                return { id: record.id, group: record.group };
            }
        }
        return null;
    },

    /**
     * Lấy Metadata cơ bản của một thực thể (Từ RAM / Global Index)
     * @param {string} id - ID chính xác (VD: 'truyen-kieu', 'nguyen-du')
     * @returns {Object|null} { id, group, data }
     */
    getMetadata(id) {
        if (!id) return null;
        if (ramCache.has(id)) return ramCache.get(id);

        const record = STATE.GLOBAL_INDEX.get(id);
        if (record) {
            ramCache.set(id, record);
            return record;
        }
        return null;
    },

    /**
     * Lấy NỘI DUNG CHI TIẾT của một thực thể (Offline-First)
     * Tự động ưu tiên lấy từ RAM nếu đã tải, sau đó mới Fetch.
     * @param {string} id 
     * @returns {Promise<Object>} Data chi tiết (có chứa content)
     */
    async getDetail(id) {
        const meta = this.getMetadata(id);
        if (!meta) return { content: 'Không tìm thấy dữ liệu.' };

        const cacheKey = `detail:${id}`;
        if (ramCache.has(cacheKey)) return ramCache.get(cacheKey);

        // Nếu là Lý thuyết hoặc Thể loại, nội dung đã có sẵn trong metadata
        if (meta.group === 'triet-thuyet' || meta.group === 'the-loai') {
            ramCache.set(cacheKey, meta.data);
            return meta.data;
        }

        // Nếu là Tác phẩm hoặc Tác giả, cần lấy file JSON chi tiết
        const folder = meta.group === 'tinh-hoa' ? 'tac-pham' : 'tac-gia';
        const url = `./data/${folder}/${encodeURIComponent(id)}.json`;

        try {
            // Fetch (Service Worker sẽ chặn và trả cache nếu mất mạng)
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const detail = await res.json();
            
            ramCache.set(cacheKey, detail);
            return detail;
        } catch (err) {
            console.warn(`[DATAHUB] Offline: Không tải được chi tiết "${id}". Dùng tạm tóm tắt.`);
            // Fallback: Trả về metadata nếu mất mạng hoàn toàn
            const fallback = {
                ...meta.data,
                content: meta.data.desc || meta.data.description || 'Nội dung đang được cập nhật (Offline).'
            };
            ramCache.set(cacheKey, fallback);
            return fallback;
        }
    },

    // =================================================================
    // PHẦN 2: MẠNG LƯỚI TRI THỨC (KNOWLEDGE GRAPH)
    // =================================================================

    /**
     * Xây dựng và truy xuất mạng lưới liên kết của một thực thể
     * @param {string} id - ID của thực thể gốc
     * @returns {Object} Mạng lưới các mối quan hệ { author, works, genres, relatedWorks }
     */
    getGraph(id) {
        const meta = this.getMetadata(id);
        if (!meta) return null;

        if (relationCache.has(id)) return relationCache.get(id);

        const graph = {
            author: null,
            works: [],
            genres: [],
            relatedWorks: []
        };

        const item = meta.data;

        // ---------------------------------------------------------
        // A. NẾU LÀ TÁC PHẨM (TÌM TÁC GIẢ, THỂ LOẠI, TÁC PHẨM TƯƠNG TỰ)
        // ---------------------------------------------------------
        if (meta.group === 'tinh-hoa') {
            const authorName = (item.author || '').trim();
            const genres = Array.isArray(item.the_loai) ? item.the_loai : (item.the_loai ? [item.the_loai] : []);

            // 1. Tìm Tác giả (Dựa vào tên)
            if (authorName) {
                const authorRecord = APP_DATA.AUTHOR_DATA.find(a => {
                    const cleanTitle = a.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
                    return cleanTitle.toLowerCase() === authorName.toLowerCase();
                });
                if (authorRecord) graph.author = authorRecord;
            }

            // 2. Tìm các Tác phẩm khác của cùng Tác giả
            if (authorName) {
                graph.works = APP_DATA.WORKS_DATA.filter(w => 
                    w.id !== id && w.author && w.author.toLowerCase().trim() === authorName.toLowerCase()
                ).slice(0, 5);
            }

            // 3. Tìm các Tác phẩm cùng Thể loại
            if (genres.length > 0) {
                graph.genres = genres;
                graph.relatedWorks = APP_DATA.WORKS_DATA.filter(w => {
                    if (w.id === id) return false;
                    const wGenres = Array.isArray(w.the_loai) ? w.the_loai : (w.the_loai ? [w.the_loai] : []);
                    // Giao thoa thể loại
                    return wGenres.some(g => genres.includes(g));
                }).slice(0, 5);
            }
        }

        // ---------------------------------------------------------
        // B. NẾU LÀ TÁC GIẢ (TÌM TÁC PHẨM, THỜI ĐẠI)
        // ---------------------------------------------------------
        else if (meta.group === 'ky-tai') {
            const authorName = item.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            
            // 1. Tìm tất cả Tác phẩm của Tác giả này
            graph.works = APP_DATA.WORKS_DATA.filter(w => 
                w.author && w.author.toLowerCase().trim() === authorName.toLowerCase()
            );

            // 2. Tìm các Tác giả cùng thời đại (Liên kết lỏng)
            const eras = new Set(graph.works.map(w => w.era).filter(Boolean));
            if (eras.size > 0) {
                graph.relatedWorks = APP_DATA.AUTHOR_DATA.filter(a => {
                    if (a.id === id) return false;
                    const theirWorks = APP_DATA.WORKS_DATA.filter(w => w.author && w.author.includes(a.title.replace(/^Chân Dung Tác Giả:\s*/i, '')));
                    return theirWorks.some(w => eras.has(w.era));
                }).slice(0, 5);
            }
        }

        relationCache.set(id, graph);
        return graph;
    },

    // =================================================================
    // PHẦN 3: CÁC HÀM TIỆN ÍCH KHÁC
    // =================================================================
    
    /**
     * Lấy toàn bộ Tác phẩm của một Thể loại
     */
    getWorksByGenre(genreName) {
        return APP_DATA.WORKS_DATA.filter(w => {
            const wGenres = Array.isArray(w.the_loai) ? w.the_loai : (w.the_loai ? [w.the_loai] : []);
            return wGenres.some(g => normalizeRouteText(g) === normalizeRouteText(genreName));
        });
    },

    /**
     * Xóa Cache (Dùng khi cần giải phóng bộ nhớ hoặc trong lúc test)
     */
    clearCache() {
        ramCache.clear();
        relationCache.clear();
    }
};
