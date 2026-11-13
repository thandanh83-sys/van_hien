/**
 * ==========================================================
 * VĂN ĐẠO - DATA HUB (js/network/data-hub.js)
 * Vị trí: js/network/data-hub.js
 * Version: 3.1.0 (Modular Facade Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Cửa ngõ duy nhất (Facade) cho toàn bộ AI truy xuất dữ liệu.
 * - Bên trong được module hóa thành 4 khối chuyên trách:
 *   1. ID Router (Định tuyến ID, tìm đường dẫn)
 *   2. Source Manager (Quản lý nguồn, Cache, Fallback)
 *   3. Graph Engine (Xử lý đồ thị tri thức)
 *   4. Validator (Kiểm tra dữ liệu)
 * 
 * TRIẾT LÝ:
 * - Mọi AI chỉ giao tiếp qua ID.
 * - Không AI nào tự ý fetch JSON.
 * - Offline-First: Ưu tiên RAM -> Cache -> GitHub.
 * ==========================================================
 */

import { APP_DATA, STATE } from '../config.js';
import { normalizeRouteText } from '../utils.js';

// =====================================================================
// I. CÁC MODULE NỘI BỘ (PRIVATE MODULES)
// =====================================================================

/**
 * 1. ID ROUTER: Chịu trách nhiệm tìm kiếm và định tuyến ID.
 */
const IDRouter = {
    getMetadata(id) {
        if (!id) return null;
        const record = STATE.GLOBAL_INDEX.get(id);
        return record ? { id: record.id, group: record.group, data: record.data } : null;
    },

    resolveIdFromQuery(query) {
        if (!query) return null;
        
        // Thử ID trực tiếp
        if (STATE.GLOBAL_INDEX.has(query)) {
            const record = STATE.GLOBAL_INDEX.get(query);
            return { id: record.id, group: record.group };
        }

        // Thử tìm theo tên
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

    getDetailUrl(id, group) {
        if (group === 'tinh-hoa') return `./data/tac-pham/${encodeURIComponent(id)}.json`;
        if (group === 'ky-tai') return `./data/tac-gia/${encodeURIComponent(id)}.json`;
        return null;
    }
};

/**
 * 2. SOURCE MANAGER: Chịu trách nhiệm lấy dữ liệu (Cache, Fetch, Fallback).
 */
const SourceManager = {
    metadataCache: new Map(),
    detailCache: new Map(),

    getMetadata(id) {
        if (this.metadataCache.has(id)) return this.metadataCache.get(id);
        const meta = IDRouter.getMetadata(id);
        if (meta) this.metadataCache.set(id, meta);
        return meta;
    },

    async getDetail(id) {
        const meta = this.getMetadata(id);
        if (!meta) return { content: 'Không tìm thấy dữ liệu.' };

        if (this.detailCache.has(id)) return this.detailCache.get(id);

        if (meta.group === 'triet-thuyet' || meta.group === 'the-loai') {
            this.detailCache.set(id, meta.data);
            return meta.data;
        }

        const url = IDRouter.getDetailUrl(id, meta.group);
        if (!url) return meta.data;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const detail = await res.json();
            this.detailCache.set(id, detail);
            return detail;
        } catch (err) {
            console.warn(`[SOURCE] Offline: Không tải được "${id}". Dùng tạm Metadata.`);
            const fallback = {
                ...meta.data,
                content: meta.data.desc || meta.data.description || 'Nội dung đang được cập nhật (Offline).'
            };
            this.detailCache.set(id, fallback);
            return fallback;
        }
    },

    async getEntity(id, fields = []) {
        const meta = this.getMetadata(id);
        if (!meta) return null;
        if (fields.length === 0) return meta.data;

        const result = {};
        let needDetail = false;

        fields.forEach(field => {
            if (meta.data[field] !== undefined) {
                result[field] = meta.data[field];
            } else if (field === 'content') {
                needDetail = true;
            }
        });

        if (needDetail) {
            const detail = await this.getDetail(id);
            if (detail && detail.content) result.content = detail.content;
        }
        return result;
    }
};

/**
 * 3. GRAPH ENGINE: Chịu trách nhiệm tính toán các mối quan hệ (Edges).
 */
const GraphEngine = {
    graphCache: new Map(),

    getStructuredGraph(id) {
        const meta = SourceManager.getMetadata(id);
        if (!meta) return [];
        if (this.graphCache.has(id)) return this.graphCache.get(id);

        const edges = [];
        const item = meta.data;

        if (meta.group === 'tinh-hoa') {
            const authorName = (item.author || '').trim();
            if (authorName) {
                const authorRecord = APP_DATA.AUTHOR_DATA.find(a => {
                    const cleanTitle = a.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
                    return cleanTitle.toLowerCase() === authorName.toLowerCase();
                });
                if (authorRecord) {
                    edges.push({ from: `work:${id}`, relation: 'written_by', to: `author:${authorRecord.id}`, source: 'local-data', confidence: 1.0 });
                }
            }
            const genres = Array.isArray(item.the_loai) ? item.the_loai : (item.the_loai ? [item.the_loai] : []);
            genres.forEach(g => {
                edges.push({ from: `work:${id}`, relation: 'has_genre', to: `genre:${normalizeRouteText(g)}`, source: 'local-data', confidence: 1.0 });
            });
        }
        else if (meta.group === 'ky-tai') {
            const authorName = item.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            const works = APP_DATA.WORKS_DATA.filter(w => w.author && w.author.toLowerCase().trim() === authorName.toLowerCase());
            works.forEach(w => {
                edges.push({ from: `author:${id}`, relation: 'wrote', to: `work:${w.id}`, source: 'local-data', confidence: 1.0 });
            });
        }

        this.graphCache.set(id, edges);
        return edges;
    },

    getGraph(id) {
        const edges = this.getStructuredGraph(id);
        const meta = SourceManager.getMetadata(id);
        if (!meta || edges.length === 0) return null;

        const graph = { author: null, works: [], genres: [], relatedWorks: [] };

        if (meta.group === 'tinh-hoa') {
            edges.forEach(edge => {
                if (edge.relation === 'written_by') {
                    const authorId = edge.to.replace('author:', '');
                    const author = APP_DATA.AUTHOR_DATA.find(a => a.id === authorId);
                    if (author) graph.author = author;
                }
                if (edge.relation === 'has_genre') graph.genres.push(edge.to.replace('genre:', ''));
            });

            if (graph.genres.length > 0) {
                graph.relatedWorks = APP_DATA.WORKS_DATA.filter(w => {
                    if (w.id === id) return false;
                    const wGenres = Array.isArray(w.the_loai) ? w.the_loai : (w.the_loai ? [w.the_loai] : []);
                    return wGenres.some(g => graph.genres.includes(normalizeRouteText(g)));
                }).slice(0, 5);
            }
        } else if (meta.group === 'ky-tai') {
            graph.works = edges.filter(e => e.relation === 'wrote').map(e => {
                const workId = e.to.replace('work:', '');
                return APP_DATA.WORKS_DATA.find(w => w.id === workId);
            }).filter(Boolean);
        }
        return graph;
    }
};

/**
 * 4. VALIDATOR: Kiểm tra tính toàn vẹn cơ bản.
 */
const Validator = {
    isValidId(id) {
        return typeof id === 'string' && id.trim().length > 0;
    },
    isValidGroup(group) {
        return ['tinh-hoa', 'ky-tai', 'triet-thuyet', 'the-loai'].includes(group);
    }
};

// =====================================================================
// II. FACADE CÔNG KHAI (PUBLIC API)
// =====================================================================

export const DataHub = {
    resolveIdFromQuery: (query) => IDRouter.resolveIdFromQuery(query),

    getMetadata: (id) => {
        if (!Validator.isValidId(id)) return null;
        return SourceManager.getMetadata(id);
    },
    
    getDetail: async (id) => {
        if (!Validator.isValidId(id)) return { content: 'ID không hợp lệ.' };
        return await SourceManager.getDetail(id);
    },

    getEntity: async (id, fields = []) => {
        if (!Validator.isValidId(id)) return null;
        return await SourceManager.getEntity(id, fields);
    },

    getStructuredGraph: (id) => {
        if (!Validator.isValidId(id)) return [];
        return GraphEngine.getStructuredGraph(id);
    },

    getGraph: (id) => {
        if (!Validator.isValidId(id)) return null;
        return GraphEngine.getGraph(id);
    },

    getWorksByGenre: (genreName) => {
        return APP_DATA.WORKS_DATA.filter(w => {
            const wGenres = Array.isArray(w.the_loai) ? w.the_loai : (w.the_loai ? [w.the_loai] : []);
            return wGenres.some(g => normalizeRouteText(g) === normalizeRouteText(genreName));
        });
    },

    clearCache: () => {
        SourceManager.metadataCache.clear();
        SourceManager.detailCache.clear();
        GraphEngine.graphCache.clear();
    }
};
