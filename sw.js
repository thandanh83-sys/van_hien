/* =====================================================================
   VĂN ĐẠO SERVICE WORKER (VERSION 7.0.0 - ULTIMATE LIVING NETWORK)
   Tác giả: Văn Đạo

   TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
   
   1. DYNAMIC PRECACHE (Tự động hóa 100%):
      Đọc file data/manifests/static-assets.json do Python sinh ra.
      Không cần sửa file này khi thêm Agent, CSS, hay JS mới.
      
   2. NAVIGATION PRELOAD (Tăng tốc HTML):
      Kích hoạt tính năng tải trước của trình duyệt, giúp trang web
      hiện ra ngay lập tức ngay cả khi mạng chậm.

   3. OFFLINE FALLBACK UI (Giao diện mất mạng):
      Nếu mất mạng và không có cache, hiển thị một trang HTML tuyệt đẹp
      mang phong cách Bạch Ngọc thay vì trang lỗi trắng xóa của trình duyệt.

   4. SMART CACHING STRATEGIES (Chiến lược thông minh):
      - HTML: Network-First (có Timeout 3.5s) + Fallback.
      - JSON Data: Stale-While-Revalidate (Tốc độ là ưu tiên).
      - JS/CSS/Images: Stale-While-Revalidate.

   5. SỰ TĨNH TẠI (No Auto-Skip):
      SW mới cài xong sẽ ở trạng thái "Waiting". Chờ người dùng bấm 
      nút "Cập nhật" (SKIP_WAITING) để không làm gián đoạn việc đọc.

   6. TỦ SÁCH OFFLINE (Batch Download):
      Hỗ trợ tải theo lô (DOWNLOAD_BATCH) và xác minh JSON trước khi cache.
   ===================================================================== */

'use strict';

// =====================================================================
// I. KHAI BÁO PHIÊN BẢN VÀ TÊN BỘ NHỚ ĐỆM
// =====================================================================

/**
 * ĐỔI VERSION NÀY mỗi khi bạn cập nhật code để xóa cache cũ.
 */
const CACHE_VERSION = 'v7.0.0';

const STATIC_CACHE  = `vandao-static-${CACHE_VERSION}`;   // CSS, JS, ảnh, font
const HTML_CACHE    = `vandao-html-${CACHE_VERSION}`;     // Trang HTML
const DATA_CACHE    = `vandao-data-${CACHE_VERSION}`;     // JSON data + manifests
const RUNTIME_CACHE = `vandao-runtime-${CACHE_VERSION}`;  // Request khác

const NETWORK_TIMEOUT = 3500; // 3.5 giây chờ mạng tối đa cho HTML
const MANIFEST_URL = './data/manifests/static-assets.json';

// =====================================================================
// II. GIAO DIỆN OFFLINE (BẠCH NGỌC FALLBACK)
// =====================================================================
const OFFLINE_HTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Văn Đạo — Tĩnh Tại</title>
    <style>
        body { background-color: #fdfbf7; color: #2c3e38; font-family: 'Times New Roman', Times, serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
        .container { padding: 40px; max-width: 500px; }
        h1 { color: #557a6f; font-size: 2.5rem; margin-bottom: 20px; font-style: italic; }
        p { color: #6a7c76; font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px; }
        button { background: transparent; border: 1px solid #8bb8a8; color: #557a6f; padding: 10px 20px; border-radius: 30px; font-family: inherit; font-size: 1rem; cursor: pointer; transition: all 0.3s; }
        button:hover { background: #8bb8a8; color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vạn vật đều vô thường</h1>
        <p>Duyên chưa tụ, mạng chưa thông. Nhưng tri thức Văn Đạo vẫn luôn ở đây cùng bạn. Hãy kiểm tra kết nối và thử lại.</p>
        <button onclick="window.location.reload()">Kết nối lại</button>
    </div>
</body>
</html>
`;

// =====================================================================
// III. FALLBACK ASSETS (Chỉ dùng khi Manifest tải lỗi)
// =====================================================================
const FALLBACK_ASSETS = [
    './', './index.html', './manifest.json',
    './css/variables.css', './css/base.css', './css/components.css', './css/layouts.css', './css/reader.css',
    './js/config.js', './js/utils.js', './js/search.js', './js/render.js', './js/router.js', './js/offline.js', './js/audit.js', './js/ask-dao.js', './js/main.js', './js/ai.js',
    './js/ai/core.js', './js/ai/nlp-tools.js', './js/ai/input-ai.js', './js/ai/master.js', './js/ai/output-ai.js', './js/ai/agents/index.js', './js/ai/literary-engine.js', './js/ai/memory-engine.js', './js/ai/identity.js', './js/ai/dialogue-engine.js',
    './js/network/data-hub.js', './js/network/bus.js', './js/network/index.js',
    './data/manifests/static-assets.json'
];

// =====================================================================
// IV. HÀM TẢI DANH SÁCH APP SHELL ĐỘNG
// =====================================================================
async function getDynamicPrecacheAssets() {
    try {
        const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const manifest = await res.json();

        const allAssets = new Set(['./']);
        const groups = [
            manifest.root, manifest.css, manifest.js_core, manifest.js_ai, 
            manifest.js_agents, manifest.js_network, manifest.json_data, 
            manifest.json_manifests, manifest.assets
        ];

        for (const group of groups) {
            if (!Array.isArray(group)) continue;
            for (const item of group) {
                if (typeof item === 'string' && item.trim()) allAssets.add(item);
            }
        }

        const result = Array.from(allAssets).sort();
        console.log(`[SW v${CACHE_VERSION}] Manifest tải thành công: ${result.length} file.`);
        return result;
    } catch (err) {
        console.warn(`[SW v${CACHE_VERSION}] Lỗi Manifest. Dùng FALLBACK_ASSETS.`, err.message);
        return [...FALLBACK_ASSETS];
    }
}

// =====================================================================
// V. SỰ KIỆN CÀI ĐẶT (INSTALL)
// =====================================================================
self.addEventListener('install', (event) => {
    console.log(`[SW v${CACHE_VERSION}] Bắt đầu cài đặt (Precache)...`);
    event.waitUntil(
        (async () => {
            const assets = await getDynamicPrecacheAssets();
            const cache = await caches.open(STATIC_CACHE);

            let successCount = 0;
            await Promise.all(
                assets.map(async (url) => {
                    try {
                        await cache.add(url);
                        successCount++;
                    } catch (err) {
                        // Bỏ qua file lỗi, không làm sập toàn bộ quá trình install
                    }
                })
            );
            console.log(`[SW v${CACHE_VERSION}] Đã cache ${successCount}/${assets.length} file.`);
        })()
    );
});

// =====================================================================
// VI. SỰ KIỆN KÍCH HOẠT (ACTIVATE) & NAVIGATION PRELOAD
// =====================================================================
self.addEventListener('activate', (event) => {
    console.log(`[SW v${CACHE_VERSION}] Bắt đầu kích hoạt...`);
    event.waitUntil(
        (async () => {
            // 1. Bật Navigation Preload (Tăng tốc HTML)
            if ('navigationPreload' in self.registration) {
                await self.registration.navigationPreload.enable();
                console.log(`[SW v${CACHE_VERSION}] Đã bật Navigation Preload.`);
            }

            // 2. Dọn dẹp cache cũ
            const cacheNames = await caches.keys();
            const cachesToDelete = cacheNames.filter((name) => {
                if (!name.startsWith('vandao-')) return false;
                return ![STATIC_CACHE, HTML_CACHE, DATA_CACHE, RUNTIME_CACHE].includes(name);
            });

            if (cachesToDelete.length > 0) {
                await Promise.all(cachesToDelete.map((name) => caches.delete(name)));
                console.log(`[SW v${CACHE_VERSION}] Đã xóa ${cachesToDelete.length} cache cũ.`);
            }

            // 3. Giành quyền kiểm soát
            await self.clients.claim();
        })()
    );
});

// =====================================================================
// VII. CHIẾN LƯỢC CACHE (FETCH STRATEGIES)
// =====================================================================

// Hàm fetch có Timeout (Tránh treo UI khi mạng quá chậm)
async function fetchWithTimeout(request, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timer);
        return response;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    let url;
    try { url = new URL(request.url); } catch (e) { return; }
    
    // Bỏ qua cross-origin
    if (url.origin !== self.location.origin) return;

    // -----------------------------------------------------------------
    // 1. HTML (NAVIGATE) -> Network First + Preload + Timeout + Fallback
    // -----------------------------------------------------------------
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            (async () => {
                try {
                    // Ưu tiên dùng Navigation Preload
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) return preloadResponse;

                    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
                    
                    // Cache bản HTML mới nhất
                    const cache = await caches.open(HTML_CACHE);
                    cache.put(request, networkResponse.clone()).catch(() => {});
                    
                    return networkResponse;
                } catch (error) {
                    // Nếu mất mạng hoặc timeout
                    const cache = await caches.open(HTML_CACHE);
                    const cached = await cache.match(request);
                    if (cached) return cached;

                    // Fallback: Trả về giao diện Bạch Ngọc
                    return new Response(OFFLINE_HTML, {
                        status: 503,
                        headers: { 'Content-Type': 'text/html; charset=utf-8' }
                    });
                }
            })()
        );
        return;
    }

    // -----------------------------------------------------------------
    // 2. JSON trong /data/ -> Stale-While-Revalidate
    // -----------------------------------------------------------------
    if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    // -----------------------------------------------------------------
    // 3. CSS, JS, Font, Ảnh -> Stale-While-Revalidate
    // -----------------------------------------------------------------
    if (/\.(css|js|mjs|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|ico|bmp)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    // 4. Các request khác -> Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// Hàm Stale-While-Revalidate
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response && response.ok && response.type === 'basic') {
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        })
        .catch(() => null);

    return cached || await fetchPromise || new Response('Offline', { status: 503 });
}

// =====================================================================
// VIII. MESSAGE (GIAO TIẾP VỚI UI VÀ TỦ SÁCH OFFLINE)
// =====================================================================
self.addEventListener('message', (event) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;

    // 1. SKIP_WAITING (Từ nút "Cập nhật" trên banner)
    if (message.type === 'SKIP_WAITING') {
        console.log(`[SW v${CACHE_VERSION}] Nhận SKIP_WAITING — Kích hoạt ngay.`);
        event.waitUntil(self.skipWaiting());
        return;
    }

    // 2. DOWNLOAD_BATCH (Từ Tủ Sách Offline)
    if (message.type === 'DOWNLOAD_BATCH' && Array.isArray(message.batch)) {
        const port = event.ports[0];
        const batch = message.batch;

        event.waitUntil(
            (async () => {
                const cache = await caches.open(DATA_CACHE);
                const results = [];

                for (const item of batch) {
                    if (!item || typeof item.url !== 'string') continue;

                    try {
                        const res = await fetch(item.url, { cache: 'no-store' });
                        if (!res.ok || res.type !== 'basic') continue;

                        // Xác minh JSON hợp lệ trước khi cache
                        await res.clone().json();
                        await cache.put(item.url, res);
                        results.push({ id: item.id, status: 'success' });
                    } catch (err) {
                        results.push({ id: item.id, status: 'error' });
                    }
                }

                if (port) {
                    port.postMessage({
                        type: 'BATCH_COMPLETED',
                        results,
                        summary: {
                            total: batch.length,
                            success: results.filter(r => r.status === 'success').length,
                            failed: results.filter(r => r.status === 'error').length
                        }
                    });
                }
            })()
        );
    }
});
