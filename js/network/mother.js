/**
 * ==========================================================
 * VĂN ĐẠO — MOTHER NODE (Máy Mẹ) v1.0.0
 * ==========================================================
 * 
 * CHỨC NĂNG:
 * ─────────────────────────────────────────────────────────
 * Máy Mẹ là "bản đồ tri thức" của toàn hệ thống. Nó KHÔNG
 * lưu trữ dữ liệu thực (dữ liệu nằm ở các Máy Con), mà chỉ:
 * 
 *   1. Nắm bản đồ định tuyến (routing table):
 *      "Group X → Node Y sở hữu"
 * 
 *   2. Load manifest của từng Máy Con:
 *      Manifest = "chứng minh thư" của node (id, endpoint,
 *      capabilities, lastUpdate...)
 * 
 *   3. Trả lời pull request từ Máy Con:
 *      "Con cần dữ liệu group X → Mẹ chỉ cho node Y"
 * 
 *   4. Phát broadcast (push):
 *      "Mẹ có update mới → gửi tất cả con" hoặc "gửi riêng con Z"
 * 
 *   5. Health check:
 *      "Node nào còn online? Node nào đã chết?"
 * 
 *   6. Locate (tra ngược):
 *      "Bài thơ X thuộc node nào?"
 * 
 * TRIẾT LÝ:
 * ─────────────────────────────────────────────────────────
 * "Danh bất chính tắc ngôn bất thuận" — Nho gia
 * 
 * Máy Mẹ không phải là server tập quyền. Nó là "tấm bản đồ"
 * — có thể offline, có thể thay thế, có thể không tồn tại.
 * Khi Máy Mẹ chết, các Máy Con vẫn chạy được (dùng dữ liệu
 * local của mình). Đây là tinh thần "vô vi nhi vô bất vi"
 * của Lão Tử: không làm gì (không nắm quyền) mà không gì
 * không làm được (vẫn điều phối được toàn mạng).
 * 
 * VERSION: 1.0.0
 * ==========================================================
 */

import { APP_DATA, STATE } from '../config.js';
import { VDBus } from './bus.js';

// ==========================================================
// PHẦN 1: CẤU HÌNH
// ==========================================================
const CONFIG = Object.freeze({
    // Identity
    MOTHER_ID: 'mother-00',
    VERSION: '1.0.0',

    // Paths
    INDEX_PATH: './data/manifests/index.json',
    MANIFEST_BASE: './data/manifests/',

    // Network behavior
    FETCH_TIMEOUT: 5000,      // 5 giây timeout mỗi fetch
    RETRY_ATTEMPTS: 2,        // 2 lần thử lại khi fail
    RETRY_DELAY: 800,         // 800ms base (exponential backoff)

    // Cache TTL (milliseconds)
    CACHE_TTL: {
        INDEX: 5 * 60 * 1000,      // 5 phút
        MANIFEST: 10 * 60 * 1000,  // 10 phút
        HEALTH: 30 * 1000          // 30 giây
    },

    // Group aliases (đồng bộ với utils.js)
    GROUP_ALIASES: Object.freeze({
        'triet-thuyet': 'triet-thuyet', 'ly-thuyet': 'triet-thuyet', 'theory': 'triet-thuyet',
        'ky-tai': 'ky-tai', 'tac-gia': 'ky-tai', 'author': 'ky-tai', 'authors': 'ky-tai',
        'tinh-hoa': 'tinh-hoa', 'tac-pham': 'tinh-hoa', 'work': 'tinh-hoa', 'works': 'tinh-hoa', 'heritage': 'tinh-hoa',
        'the-loai': 'the-loai', 'genre': 'the-loai', 'genres': 'the-loai'
    })
});

// ==========================================================
// PHẦN 2: UTILITIES
// ==========================================================

/** Sleep helper — dùng cho retry backoff */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch với timeout — tránh treo vô hạn khi mạng yếu
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = CONFIG.FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Retry fetch với exponential backoff
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} attempts
 * @returns {Promise<Response>}
 */
async function retryFetch(url, options = {}, attempts = CONFIG.RETRY_ATTEMPTS) {
    let lastError;
    for (let i = 0; i <= attempts; i++) {
        try {
            const res = await fetchWithTimeout(url, options);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} ${res.statusText}`);
            }
            return res;
        } catch (err) {
            lastError = err;
            if (i < attempts) {
                const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
                console.warn(
                    `[MOTHER] Fetch thất bại (lần ${i + 1}/${attempts + 1}): ${err.message}.`,
                    `Thử lại sau ${delay}ms...`
                );
                await sleep(delay);
            }
        }
    }
    throw lastError;
}

/**
 * Normalize group name (alias → canonical form)
 * @param {string} group
 * @returns {string|null}
 */
function normalizeGroup(group) {
    if (!group) return null;
    const key = String(group).toLowerCase().trim();
    return CONFIG.GROUP_ALIASES[key] || key;
}

/**
 * Resolve URL tương đối từ thư mục data/manifests/
 * @param {string} relativePath
 * @returns {string} Absolute URL
 */
function resolveManifestUrl(relativePath) {
    if (!relativePath) return '';
    if (/^https?:\/\//i.test(relativePath)) return relativePath;
    const base = new URL(CONFIG.MANIFEST_BASE, window.location.href);
    return new URL(relativePath, base).href;
}

// ==========================================================
// PHẦN 3: CACHE MANAGER
// ==========================================================
class CacheEntry {
    constructor(value, ttlMs) {
        this.value = value;
        this.expiresAt = Date.now() + ttlMs;
    }
    isExpired() {
        return Date.now() > this.expiresAt;
    }
    isValid() {
        return !this.isExpired();
    }
}

const cache = {
    index: null,
    manifests: new Map(),
    health: null,

    getIndex() {
        return this.index && this.index.isValid() ? this.index.value : null;
    },
    setIndex(value) {
        this.index = new CacheEntry(value, CONFIG.CACHE_TTL.INDEX);
    },

    getManifest(nodeId) {
        const entry = this.manifests.get(nodeId);
        return entry && entry.isValid() ? entry.value : null;
    },
    setManifest(nodeId, value) {
        this.manifests.set(nodeId, new CacheEntry(value, CONFIG.CACHE_TTL.MANIFEST));
    },

    getHealth() {
        return this.health && this.health.isValid() ? this.health.value : null;
    },
    setHealth(value) {
        this.health = new CacheEntry(value, CONFIG.CACHE_TTL.HEALTH);
    },

    clear() {
        this.index = null;
        this.manifests.clear();
        this.health = null;
    }
};

// ==========================================================
// PHẦN 4: LOCAL DATA ACCESS (FALLBACK)
// ==========================================================

/**
 * Lấy dữ liệu từ APP_DATA (đã load lúc boot)
 * Đây là "dữ liệu local" — nhanh nhất, không cần fetch
 * @param {string} group
 * @returns {Array}
 */
function getLocalData(group) {
    const canonical = normalizeGroup(group);
    switch (canonical) {
        case 'triet-thuyet': return APP_DATA.THEORY_DATA || [];
        case 'ky-tai':       return APP_DATA.AUTHOR_DATA || [];
        case 'tinh-hoa':     return APP_DATA.WORKS_DATA || [];
        case 'the-loai':     return APP_DATA.THE_LOAI_DATA || [];
        default:             return [];
    }
}

// ==========================================================
// PHẦN 5: MANIFEST LOADER
// ==========================================================

/**
 * Load index.json (bản đồ mạng)
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Object>} { motherId, routing, nodes }
 */
async function loadIndex(forceRefresh = false) {
    if (!forceRefresh) {
        const cached = cache.getIndex();
        if (cached) return cached;
    }

    try {
        const res = await retryFetch(CONFIG.INDEX_PATH);
        const data = await res.json();
        cache.setIndex(data);
        console.log(`[MOTHER] Đã load index.json: ${(data.nodes || []).length} nodes`);
        return data;
    } catch (err) {
        console.warn(`[MOTHER] Không load được index.json: ${err.message}. Dùng fallback nội bộ.`);
        const fallback = {
            motherId: CONFIG.MOTHER_ID,
            version: CONFIG.VERSION,
            routing: {},
            nodes: []
        };
        cache.setIndex(fallback);
        return fallback;
    }
}

/**
 * Load manifest của một node
 * @param {string} nodeId
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Object|null>}
 */
async function loadManifest(nodeId, forceRefresh = false) {
    if (!forceRefresh) {
        const cached = cache.getManifest(nodeId);
        if (cached) return cached;
    }

    try {
        const index = await loadIndex();
        const node = (index.nodes || []).find(n => n.id === nodeId);
        if (!node) {
            console.warn(`[MOTHER] Node "${nodeId}" không có trong index.json`);
            return null;
        }

        const url = resolveManifestUrl(node.manifest);
        const res = await retryFetch(url);
        const manifest = await res.json();
        cache.setManifest(nodeId, manifest);
        return manifest;
    } catch (err) {
        console.warn(`[MOTHER] Không load được manifest "${nodeId}": ${err.message}`);
        return null;
    }
}

// ==========================================================
// PHẦN 6: REQUEST HANDLER (PULL)
// ==========================================================

/**
 * Máy Con hỏi Máy Mẹ: "Cho tôi dữ liệu của group X"
 *
 * Chiến lược:
 *   1. Ưu tiên APP_DATA (đã load lúc boot) → nhanh nhất
 *   2. Nếu APP_DATA rỗng → fetch từ manifest endpoint
 *   3. Nếu mọi thứ fail → trả về rỗng với error
 *
 * @param {object} params
 * @param {string} params.group - Group cần lấy
 * @param {boolean} [params.forceRefresh=false] - Bỏ qua cache manifest
 * @returns {Promise<{source, records, endpoint?, cached?, count, error?}>}
 */
async function request({ group, forceRefresh = false } = {}) {
    const canonical = normalizeGroup(group);
    if (!canonical) {
        return { source: 'invalid', records: [], count: 0, error: 'Invalid group name' };
    }

    // Bước 1: Ưu tiên dữ liệu đã có (từ boot)
    const local = getLocalData(canonical);
    if (local.length > 0) {
        const index = await loadIndex(forceRefresh);
        const nodeId = (index.routing || {})[canonical] || 'mother-local';
        return {
            source: nodeId,
            records: local,
            cached: true,
            count: local.length
        };
    }

    // Bước 2: Fallback — fetch từ endpoint
    const index = await loadIndex(forceRefresh);
    const targetNodeId = (index.routing || {})[canonical];
    if (!targetNodeId) {
        return {
            source: 'mother-local',
            records: [],
            count: 0,
            error: `Group "${canonical}" không có trong routing table`
        };
    }

    const manifest = await loadManifest(targetNodeId, forceRefresh);
    if (!manifest || !manifest.endpoint) {
        return {
            source: 'fallback',
            records: [],
            count: 0,
            error: `Manifest của "${targetNodeId}" không khả dụng`
        };
    }

    try {
        const endpointUrl = resolveManifestUrl(manifest.endpoint);
        const res = await retryFetch(endpointUrl);
        const records = await res.json();
        return {
            source: manifest.nodeId,
            endpoint: manifest.endpoint,
            records,
            cached: false,
            count: records.length
        };
    } catch (err) {
        return {
            source: 'fallback',
            records: [],
            count: 0,
            error: `Node "${targetNodeId}" offline: ${err.message}`
        };
    }
}

// ==========================================================
// PHẦN 7: LOCATOR (TRA NGƯỢC)
// ==========================================================

/**
 * Tra ngược: "Record với ID này thuộc node nào?"
 * @param {string} id
 * @returns {Promise<{nodeId, group, record}|null>}
 */
async function locate(id) {
    if (!id) return null;

    const index = await loadIndex();

    // Bước 1: Quét local data
    for (const [group, nodeId] of Object.entries(index.routing || {})) {
        const records = getLocalData(group);
        const found = records.find(r => r.id === id);
        if (found) {
            return { nodeId, group, record: found };
        }
    }

    // Bước 2: Fallback quét GLOBAL_RECORDS
    for (const record of STATE.GLOBAL_RECORDS || []) {
        if (record.id === id) {
            return {
                nodeId: (index.routing || {})[record.group] || 'unknown',
                group: record.group,
                record: record.data
            };
        }
    }

    return null;
}

// ==========================================================
// PHẦN 8: HEALTH CHECK
// ==========================================================

/**
 * Kiểm tra node nào còn online
 * Dùng HEAD request để nhẹ băng thông, timeout 3s/node
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Array<{id, label, status, latency}>>}
 */
async function healthCheck(forceRefresh = false) {
    if (!forceRefresh) {
        const cached = cache.getHealth();
        if (cached) return cached;
    }

    const index = await loadIndex();
    const nodes = index.nodes || [];

    if (nodes.length === 0) return [];

    const results = await Promise.all(
        nodes.map(async (node) => {
            const start = performance.now();
            try {
                const url = resolveManifestUrl(node.manifest);
                const res = await fetchWithTimeout(url, { method: 'HEAD' }, 3000);
                const latency = Math.round(performance.now() - start);
                return {
                    id: node.id,
                    label: node.id.replace('node-', ''),
                    status: res.ok ? 'online' : 'offline',
                    latency
                };
            } catch {
                return {
                    id: node.id,
                    label: node.id.replace('node-', ''),
                    status: 'error',
                    latency: null
                };
            }
        })
    );

    cache.setHealth(results);
    return results;
}

// ==========================================================
// PHẦN 9: BROADCAST (PUSH)
// ==========================================================

/**
 * Máy Mẹ phát tin đến tất cả (hoặc 1) Máy Con
 * @param {string} type - Loại message
 * @param {*} data - Payload
 * @param {string} [to='all'] - 'all' hoặc nodeId cụ thể
 */
function broadcast(type, data, to = 'all') {
    VDBus.publish(type, data, to);
}

/**
 * Máy Con đăng ký nhận tin từ Máy Mẹ
 * @param {string} type
 * @param {Function} handler - (data, from) => void
 * @returns {Function} unsubscribe
 */
function onBroadcast(type, handler) {
    return VDBus.subscribe(type, handler);
}

/**
 * Convenience: thông báo tri thức vừa được cập nhật
 * @param {string} group
 * @param {Object} [stats]
 */
function notifyKnowledgeUpdate(group, stats = {}) {
    VDBus.publish('knowledge-update', {
        group: normalizeGroup(group),
        stats,
        timestamp: Date.now()
    }, 'all');
}

// ==========================================================
// PHẦN 10: PUBLIC API
// ==========================================================
export const MotherNode = Object.freeze({
    // Metadata
    id: CONFIG.MOTHER_ID,
    version: CONFIG.VERSION,

    // Core API
    request,
    locate,
    healthCheck,

    // Broadcast
    broadcast,
    onBroadcast,
    notifyKnowledgeUpdate,

    // Manifest access
    loadIndex,
    loadManifest,

    // Utilities
    normalizeGroup,
    getLocalData,

    // Cache management
    clearCache: () => cache.clear(),

    // Debug
    debug: async () => {
        const index = await loadIndex();
        const health = await healthCheck();
        return {
            motherId: CONFIG.MOTHER_ID,
            version: CONFIG.VERSION,
            routing: index.routing || {},
            nodes: index.nodes || [],
            health,
            cache: {
                hasIndex: !!cache.index,
                manifestCount: cache.manifests.size,
                hasHealth: !!cache.health
            }
        };
    }
});