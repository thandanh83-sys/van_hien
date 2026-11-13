/* =====================================================================
   VĂN ĐẠO SERVICE WORKER (VERSION 6.0.0 - DYNAMIC PRECACHE NETWORK)
   Tác giả: Văn Đạo

   TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):

   1. BỘ NHỚ ĐỆM LAI (Hybrid Cache):
      - HTML: Network First (Luôn ưu tiên bản mới để nhận cập nhật cấu trúc).
      - JSON (Data & Manifests): Stale-While-Revalidate (Tốc độ là ưu tiên).
      - CSS/JS/Ảnh/Font: Stale-While-Revalidate.
      - Mọi request khác: Stale-While-Revalidate vào RUNTIME_CACHE.

   2. TỰ ĐỘNG HÓA PRECACHE (Dynamic Precache):
      KHÔNG còn mảng PRECACHE_ASSETS cứng. Khi install, SW fetch
      ./data/manifests/static-assets.json (file này được sinh tự động
      bởi tools/update_manifests.py) và gộp 9 nhóm file:
        root, css, js_core, js_ai, js_agents,
        js_network, json_data, json_manifests, assets.
      Nhờ đó, khi thêm file mới (Agent, CSS, JS, ảnh...), con người
      chỉ cần chạy script Python — SW sẽ tự động cache file mới mà
      không cần sửa bất kỳ dòng code nào trong file này.

   3. SỰ TĨNH TẠI (No Auto-Skip):
      TUYỆT ĐỐI KHÔNG gọi self.skipWaiting() trong install. SW mới
      phải chờ người dùng xác nhận (qua banner UI) trước khi kích hoạt.
      Điều này tránh việc reload giữa lúc người dùng đang đọc.

   4. SMART OFFLINE (Batch Download):
      Hỗ trợ tải theo lô (Batch Download) cho Tủ Sách Offline.
      Mỗi lô gồm nhiều file JSON; SW xác minh JSON hợp lệ trước khi
      cache để tránh lưu file HTML lỗi (VD: trang 404) vào cache.

   5. PHÒNG THỦ NHIỀU TẦNG (Multi-Layer Defense):
      - Layer 1: Nếu static-assets.json tải lỗi → dùng FALLBACK_ASSETS cứng.
      - Layer 2: Nếu một file trong manifest tải lỗi → bỏ qua file đó,
        vẫn cache các file còn lại (không "all-or-nothing").
      - Layer 3: Nếu HTML mất mạng hoàn toàn → fallback về trang chủ.
      - Layer 4: Nếu fetch revalidate lỗi → giữ cache cũ, không xóa.

   6. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
      - Vẫn hỗ trợ message SKIP_WAITING (từ banner UI).
      - Vẫn hỗ trợ message DOWNLOAD_BATCH (từ js/offline.js).
      - Vẫn dùng 4 cache name prefix `vandao-*` để clearOfflineData()
        trong offline.js xóa đúng.
      - Vẫn xóa cache cũ khi activate (dựa trên CACHE_VERSION).
   ===================================================================== */

'use strict';

// =====================================================================
// I. KHAI BÁO PHIÊN BẢN VÀ TÊN BỘ NHỚ ĐỆM
// =====================================================================

/**
 * ĐỔI VERSION NÀY mỗi khi bạn cập nhật code để xóa cache cũ.
 * Format khuyến nghị: 'vMAJOR.MINOR.PATCH'
 * Ví dụ: 'v6.0.0' → 'v6.0.1' khi sửa nhỏ, 'v6.1.0' khi thêm feature.
 */
const CACHE_VERSION = 'v6.0.0';

const STATIC_CACHE  = `vandao-static-${CACHE_VERSION}`;   // CSS, JS, ảnh, font
const HTML_CACHE    = `vandao-html-${CACHE_VERSION}`;     // Trang HTML
const DATA_CACHE    = `vandao-data-${CACHE_VERSION}`;     // JSON data + manifests
const RUNTIME_CACHE = `vandao-runtime-${CACHE_VERSION}`;  // Request khác

/**
 * Timeout cho chiến lược Network First của HTML.
 * Nếu mạng chậm quá 4 giây → trả cache (nếu có) để tránh treo UI.
 */
const NETWORK_TIMEOUT = 4000;

/**
 * Đường dẫn tương đối tới file manifest do `tools/update_manifests.py` sinh.
 * File này chứa 9 nhóm file (root, css, js_core, js_ai, js_agents,
 * js_network, json_data, json_manifests, assets).
 */
const MANIFEST_URL = './data/manifests/static-assets.json';

// =====================================================================
// II. DANH SÁCH FALLBACK (Chỉ dùng khi manifest tải lỗi)
// =====================================================================
// Đây là danh sách TỐI THIỂU để App vẫn boot được nếu vì lý do nào đó
// không fetch được static-assets.json (VD: manifest bị xóa, JSON hỏng).
// KHÔNG phải nguồn sự thật chính — nguồn chính là manifest.
// =====================================================================

const FALLBACK_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/layouts.css',
    './css/reader.css',
    './js/config.js',
    './js/utils.js',
    './js/search.js',
    './js/render.js',
    './js/router.js',
    './js/offline.js',
    './js/audit.js',
    './js/ask-dao.js',
    './js/main.js',
    './js/ai.js',
    './js/ai/core.js',
    './js/ai/nlp-tools.js',
    './js/ai/input-ai.js',
    './js/ai/master.js',
    './js/ai/output-ai.js',
    './js/ai/agents/index.js',
    './js/network/data-hub.js',
    './js/network/bus.js',
    './js/network/index.js',
    './data/manifests/static-assets.json'
];

// =====================================================================
// III. HÀM TỰ ĐỘNG TẢI DANH SÁCH APP SHELL (TRÁI TIM CỦA v6.0.0)
// =====================================================================

/**
 * Tải manifest động và gộp 9 nhóm file thành một danh sách phẳng.
 *
 * QUY TRÌNH:
 *   1. Fetch ./data/manifests/static-assets.json.
 *   2. Kiểm tra response.ok.
 *   3. Parse JSON.
 *   4. Gộp 9 nhóm (root, css, js_core, js_ai, js_agents, js_network,
 *      json_data, json_manifests, assets) thành 1 mảng.
 *   5. Luôn đảm bảo './' có mặt (fallback root).
 *   6. Loại trùng bằng Set.
 *   7. Sắp xếp ổn định để dễ debug.
 *
 * NẾU LỖI:
 *   - Log warning chi tiết.
 *   - Trả FALLBACK_ASSETS (danh sách tối thiểu ở trên).
 *
 * @returns {Promise<string[]>} - Danh sách đường dẫn tương đối.
 */
async function getDynamicPrecacheAssets() {
    try {
        // 1. Fetch manifest với no-store để không bị SW cache chặn
        //    (SW đang trong install, chưa kiểm soát cache của chính nó)
        const res = await fetch(MANIFEST_URL, { cache: 'no-store' });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} khi tải manifest`);
        }

        // 2. Parse JSON
        const manifest = await res.json();

        // 3. Validate cấu trúc tối thiểu
        if (!manifest || typeof manifest !== 'object') {
            throw new Error('Manifest không phải object hợp lệ');
        }

        // 4. Gộp 9 nhóm — dùng Set để loại trùng tự động
        const allAssets = new Set();

        // 4.1 — Luôn đảm bảo './' có mặt (trang chủ)
        allAssets.add('./');

        // 4.2 — Gộp từng nhóm (defensive: nếu thiếu key → mảng rỗng)
        const groups = [
            manifest.root,
            manifest.css,
            manifest.js_core,
            manifest.js_ai,
            manifest.js_agents,
            manifest.js_network,
            manifest.json_data,
            manifest.json_manifests,
            manifest.assets
        ];

        for (const group of groups) {
            if (!Array.isArray(group)) continue;
            for (const item of group) {
                if (typeof item === 'string' && item.trim()) {
                    allAssets.add(item);
                }
            }
        }

        // 5. Chuyển Set → mảng, sắp xếp ổn định
        const result = Array.from(allAssets).sort();

        // 6. Log tổng kết (dev thấy rõ SW nạp bao nhiêu file)
        console.log(
            `[SW v${CACHE_VERSION}] Manifest tải thành công: ${result.length} file.`,
            `Nhóm: root=${(manifest.root || []).length}, ` +
            `css=${(manifest.css || []).length}, ` +
            `js_core=${(manifest.js_core || []).length}, ` +
            `js_ai=${(manifest.js_ai || []).length}, ` +
            `js_agents=${(manifest.js_agents || []).length}, ` +
            `js_network=${(manifest.js_network || []).length}, ` +
            `json_data=${(manifest.json_data || []).length}, ` +
            `json_manifests=${(manifest.json_manifests || []).length}, ` +
            `assets=${(manifest.assets || []).length}`
        );

        return result;

    } catch (err) {
        // Log chi tiết để dev biết SW đang dùng fallback
        console.warn(
            `[SW v${CACHE_VERSION}] Không tải được manifest động. ` +
            `Chuyển sang FALLBACK_ASSETS (${FALLBACK_ASSETS.length} file). ` +
            `Lý do:`,
            err.message || err
        );
        return [...FALLBACK_ASSETS];
    }
}

// =====================================================================
// IV. SỰ KIỆN CÀI ĐẶT (INSTALL)
// =====================================================================

/**
 * Khi SW mới được cài:
 *   1. Fetch manifest động để lấy danh sách file cần cache.
 *   2. Mở STATIC_CACHE.
 *   3. Cache từng file SONG SONG (Promise.all + cache.add từng file).
 *      - Nếu một file lỗi (404, network error) → chỉ log warning,
 *        KHÔNG làm fail toàn bộ install.
 *   4. KHÔNG gọi self.skipWaiting() — chờ người dùng xác nhận.
 */
self.addEventListener('install', (event) => {
    console.log(`[SW v${CACHE_VERSION}] Bắt đầu cài đặt (Dynamic Precache)...`);

    event.waitUntil(
        (async () => {
            // 1. Lấy danh sách file cần cache
            const assets = await getDynamicPrecacheAssets();

            // 2. Mở STATIC_CACHE
            const cache = await caches.open(STATIC_CACHE);

            // 3. Cache từng file — KHÔNG dùng cache.addAll() để tránh
            //    "all-or-nothing": cache.addAll() fail toàn bộ nếu 1 file lỗi.
            //    Dùng cache.add() từng file + catch để bỏ qua file lỗi.
            let successCount = 0;
            let failCount = 0;

            await Promise.all(
                assets.map(async (url) => {
                    try {
                        await cache.add(url);
                        successCount++;
                    } catch (err) {
                        failCount++;
                        console.warn(
                            `[SW v${CACHE_VERSION}] Bỏ qua file không cache được: ${url}`,
                            err.message || err
                        );
                    }
                })
            );

            console.log(
                `[SW v${CACHE_VERSION}] Precache hoàn tất: ` +
                `${successCount}/${assets.length} thành công` +
                (failCount > 0 ? `, ${failCount} bỏ qua` : '')
            );

            // 4. KHÔNG gọi self.skipWaiting() ở đây.
            //    SW mới sẽ ở trạng thái "waiting" cho đến khi:
            //    - Người dùng bấm nút "Cập nhật" trên banner UI (gửi
            //      message SKIP_WAITING xuống).
            //    - Hoặc tất cả tab cũ đóng.
        })()
    );
});

// =====================================================================
// V. SỰ KIỆN KÍCH HOẠT (ACTIVATE)
// =====================================================================

/**
 * Khi SW mới được kích hoạt:
 *   1. Quét tất cả cache name hiện có.
 *   2. Xóa cache cũ (cùng prefix 'vandao-' nhưng khác CACHE_VERSION).
 *   3. Giành quyền kiểm soát toàn bộ client (self.clients.claim()).
 */
self.addEventListener('activate', (event) => {
    console.log(`[SW v${CACHE_VERSION}] Bắt đầu kích hoạt...`);

    event.waitUntil(
        (async () => {
            // 1. Lấy tất cả cache name
            const cacheNames = await caches.keys();

            // 2. Xác định cache cần xóa
            const cachesToDelete = cacheNames.filter((name) => {
                // Chỉ xử lý cache của Văn Đạo
                if (!name.startsWith('vandao-')) return false;

                // Giữ lại 4 cache của version hiện tại
                return (
                    name !== STATIC_CACHE &&
                    name !== HTML_CACHE &&
                    name !== DATA_CACHE &&
                    name !== RUNTIME_CACHE
                );
            });

            // 3. Xóa cache cũ (song song)
            if (cachesToDelete.length > 0) {
                console.log(
                    `[SW v${CACHE_VERSION}] Xóa ${cachesToDelete.length} cache cũ:`,
                    cachesToDelete
                );
                await Promise.all(cachesToDelete.map((name) => caches.delete(name)));
            }

            // 4. Giành quyền kiểm soát toàn bộ client
            //    (để SW mới điều khiển các tab đang mở ngay lập tức)
            await self.clients.claim();

            console.log(`[SW v${CACHE_VERSION}] Kích hoạt hoàn tất.`);
        })()
    );
});

// =====================================================================
// VI. CHIẾN LƯỢC CACHE (CACHE STRATEGIES)
// =====================================================================

/**
 * Chiến lược 1: NETWORK FIRST với timeout.
 *
 * Dùng cho HTML — luôn muốn bản mới nhất. Nếu mạng chậm quá timeout,
 * trả cache (nếu có) để tránh treo UI. Nếu không có cache và mất mạng,
 * fallback về trang chủ.
 *
 * @param {Request} request - Request gốc.
 * @param {string} cacheName - Tên cache để đọc/ghi.
 * @param {number} timeoutMs - Thời gian chờ tối đa.
 * @returns {Promise<Response>}
 */
async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
    const cache = await caches.open(cacheName);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timer);

        // Chỉ cache response hợp lệ
        if (response && response.ok) {
            cache.put(request, response.clone()).catch(() => {});
        }

        return response;
    } catch (err) {
        clearTimeout(timer);

        // Mạng lỗi/timeout → thử cache
        const cached = await cache.match(request);
        if (cached) {
            console.log(`[SW v${CACHE_VERSION}] Network First fallback cache: ${request.url}`);
            return cached;
        }

        // Không có cache → fallback trang chủ (nếu có)
        const homeFallback = await caches.match('./');
        if (homeFallback) return homeFallback;

        // Cuối cùng: trả response lỗi tối thiểu
        return new Response('Offline — không có kết nối và không có cache.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

/**
 * Chiến lược 2: STALE-WHILE-REVALIDATE.
 *
 * Trả cache ngay (nếu có) để UI hiển thị tức thì, đồng thời fetch
 * bản mới ngầm để cập nhật cache lần sau.
 *
 * @param {Request} request - Request gốc.
 * @param {string} cacheName - Tên cache để đọc/ghi.
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Fetch revalidate — chạy ngầm, không block việc trả cached
    const revalidatePromise = fetch(request)
        .then((response) => {
            // Chỉ cache response hợp lệ từ chính origin (type 'basic')
            if (response && response.ok && response.type === 'basic') {
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        })
        .catch((err) => {
            // Fetch lỗi → không xóa cache cũ, chỉ log nhẹ
            // (không dùng console.warn để tránh spam khi offline)
            return null;
        });

    // Ưu tiên trả cache; nếu không có cache thì chờ revalidate
    if (cached) return cached;

    const fresh = await revalidatePromise;
    if (fresh) return fresh;

    // Không có cache và fetch lỗi → trả 503
    return new Response('Offline — không có cache cho request này.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}

// =====================================================================
// VII. SỰ KIỆN FETCH — ĐIỀU PHỐI CÁC CHIẾN LƯỢC
// =====================================================================

/**
 * Điều phối request đến đúng chiến lược cache.
 *
 * THỨ TỰ ƯU TIÊN:
 *   1. Bỏ qua request không phải GET → mặc định fetch.
 *   2. Bỏ qua request không phải HTTP(S) → mặc định fetch.
 *   3. Bỏ qua request cross-origin (CDN, Analytics, Google Fonts...) →
 *      mặc định fetch để tránh cache rác.
 *   4. HTML (navigate hoặc Accept: text/html) → Network First với timeout.
 *   5. JSON trong /data/ → Stale-While-Revalidate (DATA_CACHE).
 *   6. CSS, JS, Font, Ảnh → Stale-While-Revalidate (STATIC_CACHE).
 *   7. Còn lại → Stale-While-Revalidate (RUNTIME_CACHE).
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // 1. Chỉ xử lý GET
    if (request.method !== 'GET') return;

    // 2. Chỉ xử lý HTTP(S)
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
        return;
    }

    // 3. Bỏ qua cross-origin (để trình duyệt tự xử lý)
    let url;
    try {
        url = new URL(request.url);
    } catch (err) {
        return;
    }
    if (url.origin !== self.location.origin) return;

    // 4. HTML → Network First
    //    Điều kiện: request.mode === 'navigate' HOẶC header Accept chứa text/html
    if (
        request.mode === 'navigate' ||
        (request.headers.get('accept') || '').includes('text/html')
    ) {
        event.respondWith(networkFirstWithTimeout(request, HTML_CACHE, NETWORK_TIMEOUT));
        return;
    }

    // 5. JSON trong /data/ → Stale-While-Revalidate (DATA_CACHE)
    if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    // 6. CSS, JS, Font, Ảnh → Stale-While-Revalidate (STATIC_CACHE)
    if (/\.(css|js|mjs|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|ico|bmp)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    // 7. Mọi request khác → Stale-While-Revalidate (RUNTIME_CACHE)
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// =====================================================================
// VIII. SỰ KIỆN MESSAGE — GIAO TIẾP VỚI UI
// =====================================================================

/**
 * Nhận message từ UI (main.js, offline.js, banner cập nhật).
 *
 * HỖ TRỢ 2 LOẠI MESSAGE:
 *   1. SKIP_WAITING   — Banner cập nhật gửi khi người dùng bấm "Cập nhật".
 *   2. DOWNLOAD_BATCH — offline.js gửi để tải theo lô cho Tủ Sách Offline.
 */
self.addEventListener('message', (event) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;

    // -----------------------------------------------------------------
    // 8.1 — SKIP_WAITING: kích hoạt SW mới ngay
    // -----------------------------------------------------------------
    if (message.type === 'SKIP_WAITING') {
        console.log(`[SW v${CACHE_VERSION}] Nhận SKIP_WAITING — kích hoạt ngay.`);
        event.waitUntil(self.skipWaiting());
        return;
    }

    // -----------------------------------------------------------------
    // 8.2 — DOWNLOAD_BATCH: tải theo lô cho Tủ Sách Offline
    // -----------------------------------------------------------------
    if (message.type === 'DOWNLOAD_BATCH' && Array.isArray(message.batch)) {
        const port = event.ports[0]; // MessageChannel port để trả kết quả
        const batch = message.batch;

        event.waitUntil(
            (async () => {
                const cache = await caches.open(DATA_CACHE);
                const results = [];

                // Duyệt TUẦN TỰ từng item (không Promise.all) để tránh
                // bão hòa network khi lô lớn, và để báo cáo tiến độ chính xác.
                for (const item of batch) {
                    if (!item || typeof item.url !== 'string') {
                        results.push({
                            id: item?.id || 'unknown',
                            status: 'error',
                            reason: 'URL không hợp lệ'
                        });
                        continue;
                    }

                    try {
                        const res = await fetch(item.url, { cache: 'no-store' });

                        // Chỉ chấp nhận response hợp lệ từ chính origin
                        if (!res.ok || res.type !== 'basic') {
                            results.push({
                                id: item.id,
                                status: 'error',
                                reason: `HTTP ${res.status} hoặc cross-origin`
                            });
                            continue;
                        }

                        // Xác minh JSON hợp lệ TRƯỚC khi cache.
                        // Mục đích: tránh cache nhầm file HTML lỗi (VD: trang 404
                        // trả về HTML dù URL yêu cầu JSON).
                        await res.clone().json();

                        // Cache file
                        await cache.put(item.url, res);

                        results.push({ id: item.id, status: 'success' });
                    } catch (err) {
                        results.push({
                            id: item.id,
                            status: 'error',
                            reason: err.message || 'Fetch/parse JSON lỗi'
                        });
                    }
                }

                // Trả kết quả về cho offline.js qua port
                if (port) {
                    port.postMessage({
                        type: 'BATCH_COMPLETED',
                        results,
                        summary: {
                            total: batch.length,
                            success: results.filter((r) => r.status === 'success').length,
                            failed: results.filter((r) => r.status === 'error').length
                        }
                    });
                }
            })()
        );
        return;
    }

    // Message không nhận dạng được → bỏ qua (không log để tránh spam)
});
