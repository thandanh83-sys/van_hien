/**
 * ==========================================================
 * VĂN ĐẠO - DATA HUB (js/network/data-hub.js)
 * Vị trí: js/network/data-hub.js
 * Version: 3.0.0 (Unified Intelligence Network)
 * ==========================================================
 * CHỨC NĂNG:
 * - Trung tâm truy xuất dữ liệu duy nhất cho toàn bộ AI.
 * - Quản lý bộ nhớ đệm (RAM Cache).
 * - Xây dựng Đồ thị Tri thức có cấu trúc (Knowledge Graph).
 * - Cho phép AI truy xuất dữ liệu theo trường (Field Selection).
 * - Đảm bảo hoạt động Offline 100% (qua Service Worker).
 * 
 * TRIẾT LÝ:
 * - Mọi AI chỉ giao tiếp qua ID.
 * - Không AI nào tự ý fetch JSON.
 * - DataHub tự lo phần lấy dữ liệu, xử lý cache và fallback.
 * ==========================================================
 */

import { APP_DATA, STATE } from '../config.js';
import { normalizeRouteText } from '../utils.js';

// =====================================================================
// BỘ NHỚ ĐỆM (CACHES)
// =====================================================================

// 1. Cache Metadata (Lưu trữ các record cơ bản từ Global Index)
const metadataCache = new Map();

// 2. Cache Chi tiết (Lưu trữ nội dung đầy đủ của file JSON)
const detailCache = new Map();

// 3. Cache Đồ thị (Lưu trữ các cạnh liên kết để tránh tính toán lại)
const graphCache = new Map();

export const DataHub = {
    // =================================================================
    // PHẦN 1: TRUY XUẤT CƠ BẢN (METADATA & ID RESOLUTION)
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
        if (metadataCache.has(id)) return metadataCache.get(id);

        const record = STATE.GLOBAL_INDEX.get(id);
        if (record) {
            metadataCache.set(id, record);
            return record;
        }
        return null;
    },

    // =================================================================
    // PHẦN 2: TRUY XUẤT NÂNG CAO (DETAIL & FIELD SELECTION)
    // =================================================================

    /**
     * Lấy NỘI DUNG CHI TIẾT của một thực thể (Offline-First)
     * Tự động ưu tiên lấy từ RAM nếu đã tải, sau đó mới Fetch.
     * @param {string} id 
     * @returns {Promise<Object>} Data chi tiết (có chứa content)
     */
    async getDetail(id) {
        const meta = this.getMetadata(id);
        if (!meta) return { content: 'Không tìm thấy dữ liệu.' };

        if (detailCache.has(id)) return detailCache.get(id);

        // Nếu là Lý thuyết hoặc Thể loại, nội dung đã có sẵn trong metadata
        if (meta.group === 'triet-thuyet' || meta.group === 'the-loai') {
            detailCache.set(id, meta.data);
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
            
            detailCache.set(id, detail);
            return detail;
        } catch (err) {
            console.warn(`[DATAHUB] Offline: Không tải được chi tiết "${id}". Dùng tạm tóm tắt.`);
            // Fallback: Trả về metadata nếu mất mạng hoàn toàn
            const fallback = {
                ...meta.data,
                content: meta.data.desc || meta.data.description || 'Nội dung đang được cập nhật (Offline).'
            };
            detailCache.set(id, fallback);
            return fallback;
        }
    },

    /**
     * [MỚI] Lấy dữ liệu theo các trường yêu cầu (Field Selection)
     * Giúp AI tối ưu hóa việc lấy dữ liệu, không tải toàn bộ JSON nếu không cần.
     * 
     * @param {string} id - ID thực thể
     * @param {Array<string>} fields - Mảng các trường cần lấy (VD: ['title', 'author'])
     * @returns {Promise<Object>} Object chứa các trường được yêu cầu
     */
    async getEntity(id, fields = []) {
        const meta = this.getMetadata(id);
        if (!meta) return null;

        // Nếu không yêu cầu trường cụ thể, trả về toàn bộ metadata
        if (fields.length === 0) return meta.data;

        // Nếu yêu cầu các trường cơ bản (title, author, desc), lấy từ metadata (siêu tốc)
        const result = {};
        let needDetail = false;

        fields.forEach(field => {
            if (meta.data[field] !== undefined) {
                result[field] = meta.data[field];
            } else if (field === 'content') {
                needDetail = true;
            }
        });

        // Nếu yêu cầu 'content', phải tải chi tiết
        if (needDetail) {
            const detail = await this.getDetail(id);
            if (detail && detail.content) {
                result.content = detail.content;
            }
        }

        return result;
    },

    // =================================================================
    // PHẦN 3: MẠNG LƯỚI TRI THỨC (STRUCTURED KNOWLEDGE GRAPH)
    // =================================================================

    /**
     * [MỚI] Truy xuất Đồ thị Tri thức có cấu trúc (Knowledge Graph Edges)
     * Trả về danh sách các cạnh nối: { from, relation, to, source, confidence }
     * @param {string} id - ID của thực thể gốc
     * @returns {Array} Mảng các liên kết có cấu trúc
     */
    getStructuredGraph(id) {
        const meta = this.getMetadata(id);
        if (!meta) return [];

        if (graphCache.has(id)) return graphCache.get(id);

        const edges = [];
        const item = meta.data;

        // ---------------------------------------------------------
        // A. NẾU LÀ TÁC PHẨM (TÌM TÁC GIẢ, THỂ LOẠI)
        // ---------------------------------------------------------
        if (meta.group === 'tinh-hoa') {
            const authorName = (item.author || '').trim();
            
            // 1. Cạnh: Tác phẩm -> Tác giả (written_by)
            if (authorName) {
                const authorRecord = APP_DATA.AUTHOR_DATA.find(a => {
                    const cleanTitle = a.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
                    return cleanTitle.toLowerCase() === authorName.toLowerCase();
                });
                if (authorRecord) {
                    edges.push({
                        from: `work:${id}`,
                        relation: 'written_by',
                        to: `author:${authorRecord.id}`,
                        source: 'local-data',
                        confidence: 1.0
                    });
                }
            }

            // 2. Cạnh: Tác phẩm -> Thể loại (has_genre)
            const genres = Array.isArray(item.the_loai) ? item.the_loai : (item.the_loai ? [item.the_loai] : []);
            genres.forEach(g => {
                edges.push({
                    from: `work:${id}`,
                    relation: 'has_genre',
                    to: `genre:${normalizeRouteText(g)}`,
                    source: 'local-data',
                    confidence: 1.0
                });
            });
        }

        // ---------------------------------------------------------
        // B. NẾU LÀ TÁC GIẢ (TÌM TÁC PHẨM)
        // ---------------------------------------------------------
        else if (meta.group === 'ky-tai') {
            const authorName = item.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            const works = APP_DATA.WORKS_DATA.filter(w => 
                w.author && w.author.toLowerCase().trim() === authorName.toLowerCase()
            );
            
            // Cạnh: Tác giả -> Tác phẩm (wrote)
            works.forEach(w => {
                edges.push({
                    from: `author:${id}`,
                    relation: 'wrote',
                    to: `work:${w.id}`,
                    source: 'local-data',
                    confidence: 1.0
                });
            });
        }

        graphCache.set(id, edges);
        return edges;
    },

    /**
     * Lấy Đồ thị Tri thức dạng rút gọn (Dùng cho UI render Related)
     * Trả về object chứa các mảng dữ liệu thô để render.
     */
    getGraph(id) {
        const edges = this.getStructuredGraph(id);
        const meta = this.getMetadata(id);
        if (!meta || edges.length === 0) return null;

        const graph = {
            author: null,
            works: [],
            genres: [],
            relatedWorks: []
        };

        // Xử lý dựa trên loại thực thể
        if (meta.group === 'tinh-hoa') {
            edges.forEach(edge => {
                if (edge.relation === 'written_by') {
                    const authorId = edge.to.replace('author:', '');
                    const author = APP_DATA.AUTHOR_DATA.find(a => a.id === authorId);
                    if (author) graph.author = author;
                }
                if (edge.relation === 'has_genre') {
                    graph.genres.push(edge.to.replace('genre:', ''));
                }
            });

            // Tìm các tác phẩm cùng thể loại
            if (graph.genres.length > 0) {
                graph.relatedWorks = APP_DATA.WORKS_DATA.filter(w => {
                    if (w.id === id) return false;
                    const wGenres = Array.isArray(w.the_loai) ? w.the_loai : (w.the_loai ? [w.the_loai] : []);
                    return wGenres.some(g => graph.genres.includes(normalizeRouteText(g)));
                }).slice(0, 5);
            }
        } 
        else if (meta.group === 'ky-tai') {
            graph.works = edges.filter(e => e.relation === 'wrote').map(e => {
                const workId = e.to.replace('work:', '');
                return APP_DATA.WORKS_DATA.find(w => w.id === workId);
            }).filter(Boolean);
        }

        return graph;
    },

    // =================================================================
    // PHẦN 4: TIỆN ÍCH KHÁC
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
     * Xóa toàn bộ Cache (Dùng khi cần giải phóng bộ nhớ hoặc test)
     */
    clearCache() {
        metadataCache.clear();
        detailCache.clear();
        graphCache.clear();
    }
};
