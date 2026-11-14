/**
 * ==========================================================
 * NGỌC THANH SERVICE WORKER (VERSION 14.2.0 - ULTIMATE OPTIMIZATION)
 * Tác giả: Văn Đạo
 * 
 * TRIẾT LÝ THIẾT KẾ:
 * 1. TĨNH TẠI & TỐI GIẢN: Không precache (tải trước) các file ảnh nặng 
 *    (jpg, png) hay file từ điển quá lớn. Chỉ cache những gì cốt lõi 
 *    nhất để trang web tải lên trong tích tắc.
 * 2. TỰ ĐỘNG DỌN DẸP: Khi kích hoạt (activate), tự động quét và xóa 
 *    sạch mọi cache cũ (v12, v13...). Đảm bảo không bao giờ bị kẹt 
 *    file JS cũ gây lỗi.
 * 3. FAIL-SAFE: Dùng Promise.allSettled khi cài đặt. Nếu 1 file bị lỗi 
 *    404, các file khác vẫn được cache bình thường, web không bị sập.
 * 4. OFFLINE-FIRST: Hỗ trợ tải toàn bộ dữ liệu (DOWNLOAD_BATCH) để đọc 
 *    offline mượt mà.
 * ==========================================================
 */

'use strict';

// =====================================================================
// I. KHAI BÁO PHIÊN BẢN (BẮT BUỘC ĐỔI MỖI KHI SỬA CODE)
// =====================================================================
// Đã nâng lên v14.2.0 để đồng bộ với các bản cập nhật CSS/JS mới nhất.
const CACHE_VERSION = 'v14.2.0';

const STATIC_CACHE  = `ngocthanh-static-${CACHE_VERSION}`;   
const HTML_CACHE    = `ngocthanh-html-${CACHE_VERSION}`;     
const DATA_CACHE    = `ngocthanh-data-${CACHE_VERSION}`;     
const RUNTIME_CACHE = `ngocthanh-runtime-${CACHE_VERSION}`;  

const NETWORK_TIMEOUT = 4000; // Thời gian chờ mạng tối đa (4 giây) trước khi lấy từ Cache
const MANIFEST_URL = './data/manifests/static-assets.json';

// =====================================================================
// II. GIAO DIỆN OFFLINE (Khi mất mạng hoàn toàn)
// =====================================================================
const OFFLINE_HTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ngọc Thanh — Tĩnh Tại</title>
    <style>
        body { background-color: #f7fcf9; color: #112a20; font-family: 'Times New Roman', Times, serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; background-image: radial-gradient(circle at center, #ffffff 0%, #f7fcf9 100%); }
        .container { padding: 40px; max-width: 500px; }
        h1 { color: #2e8b57; font-size: 2.5rem; margin-bottom: 20px; font-style: italic; font-family: 'Alex Brush', cursive, serif; }
        p { color: #4a6b5d; font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px; }
        button { background: transparent; border: 1px solid #2e8b57; color: #1a5232; padding: 10px 24px; border-radius: 30px; font-family: inherit; font-size: 1rem; cursor: pointer; transition: all 0.3s; }
        button:hover { background: #2e8b57; color: #fff; box-shadow: 0 4px 15px rgba(46,139,87,0.3); }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vạn vật đều vô thường</h1>
        <p>Duyên chưa tụ, mạng chưa thông. Nhưng tri thức Ngọc Thanh vẫn luôn ở đây cùng bạn. Hãy kiểm tra kết nối và thử lại.</p>
        <button onclick="window.location.reload()">Kết nối lại</button>
    </div>
</body>
</html>
`;

// =====================================================================
// III. DANH SÁCH DỰ PHÒNG (Chỉ dùng khi Manifest bị lỗi 404)
// =====================================================================
const FALLBACK_ASSETS = [
    './', './index.html', './manifest.json',
    './css/variables.css', './css/base.css', './css/components.css', './css/layouts.css', './css/reader.css',
    './js/config.js', './js/utils.js', './js/search.js', './js/render.js', './js/router.js', './js/offline.js', './js/audit.js', './js/ask-dao.js', './js/main.js', './js/ai.js',
    './js/ai/core.js', './js/ai/nlp-tools.js', './js/ai/input-ai.js', './js/ai/master.js', './js/ai/output-ai.js', 
    './js/ai/smart-input-parser.js', './js/ai/literary-engine.js', './js/ai/memory-engine.js', './js/ai/identity.js', './js/ai/dialogue-engine.js',
    './js/ai/agents/index.js', './js/network/data-hub.js', './js/network/bus.js', './js/network/index.js'
];

// =====================================================================
// IV. LẤY DANH SÁCH PRECACHE TỪ MANIFEST (ĐÃ TỐI ƯU)
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
                // [TỐI ƯU HÓA] Loại bỏ ảnh nặng và file từ điển lớn ra khỏi Precache
                // Chỉ cache HTML, CSS, JS, Fonts, và các file JSON nhẹ (Index, Manifest)
                const isHeavyAsset = /\.(jpe?g|png|gif|webp|ico|bmp)$/i.test(item);
                const isDictionary = item.includes('tu-dien'); // Từ điển sẽ được tải qua Lazy-load
                
                if (!isHeavyAsset && !isDictionary && typeof item === 'string' && item.trim()) {
                    allAssets.add(item);
                }
            }
        }

        const result = Array.from(allAssets).sort();
        console.log(`[SW ${CACHE_VERSION}] Manifest tối ưu: ${result.length} file lõi.`);
        return result;
    } catch (err) {
        console.warn(`[SW ${CACHE_VERSION}] Lỗi Manifest. Dùng FALLBACK_ASSETS.`, err.message);
        // Lọc bỏ ảnh trong fallback để đồng bộ logic
        return [...FALLBACK_ASSETS].filter(a => !/\.(jpe?g|png|gif|webp|ico|bmp)$/i.test(a));
    }
}

// =====================================================================
// V. SỰ KIỆN CÀI ĐẶT (INSTALL) - TẢI VÀ LƯU CÁC FILE CỐT LÕI
// =====================================================================
self.addEventListener('install', (event) => {
    console.log(`[SW ${CACHE_VERSION}] Bắt đầu cài đặt...`);
    event.waitUntil(
        (async () => {
            const assets = await getDynamicPrecacheAssets();
            const cache = await caches.open(STATIC_CACHE);

            // Dùng Promise.allSettled để 1 file lỗi (404) không làm sập toàn bộ
            const results = await Promise.allSettled(
                assets.map(async (url) => {
                    try {
                        const response = await fetch(url, { cache: 'no-store' });
                        // Chỉ cache nếu hợp lệ (200 OK và không phải CORS)
                        if (response.ok && response.type === 'basic') {
                            await cache.put(url, response);
                            return { url, status: 'success' };
                        }
                        return { url, status: 'failed', reason: `HTTP ${response.status}` };
                    } catch (err) {
                        return { url, status: 'failed', reason: err.message };
                    }
                })
            );

            const success = results.filter(r => r.value?.status === 'success').length;
            const failed = results.filter(r => r.value?.status === 'failed').length;
            
            console.log(`[SW ${CACHE_VERSION}] Precache hoàn tất: ${success} thành công, ${failed} thất bại.`);
            if (failed > 0) {
                console.warn(`[SW ${CACHE_VERSION}] Các file lỗi:`, results.filter(r => r.value?.status === 'failed').map(r => r.value.url));
            }
        })()
    );
});

// =====================================================================
// VI. SỰ KIỆN KÍCH HOẠT (ACTIVATE) - DỌN DẸP TUYỆT ĐỐI CACHE CŨ
// =====================================================================
self.addEventListener('activate', (event) => {
    console.log(`[SW ${CACHE_VERSION}] Bắt đầu kích hoạt...`);
    event.waitUntil(
        (async () => {
            // 1. Bật Navigation Preload (Giúp tải HTML nhanh hơn trên mobile)
            if ('navigationPreload' in self.registration) {
                await self.registration.navigationPreload.enable();
            }

            // 2. Quét và xóa sạch mọi cache cũ (vandao-*, ngocthanh-*)
            const cacheNames = await caches.keys();
            const cachesToDelete = cacheNames.filter((name) => {
                // Nếu là cache của mình nhưng không phải phiên bản hiện tại -> XÓA SẠCH
                if ((name.startsWith('ngocthanh-') || name.startsWith('vandao-')) && 
                    ![STATIC_CACHE, HTML_CACHE, DATA_CACHE, RUNTIME_CACHE].includes(name)) {
                    return true;
                }
                return false;
            });

            if (cachesToDelete.length > 0) {
                await Promise.all(cachesToDelete.map((name) => caches.delete(name)));
                console.log(`[SW ${CACHE_VERSION}] Đã xóa ${cachesToDelete.length} cache cũ:`, cachesToDelete);
            }

            // 3. Giành quyền kiểm soát (Bắt buộc để reload ngay lập tức)
            await self.clients.claim();
            console.log(`[SW ${CACHE_VERSION}] Kích hoạt hoàn tất.`);
        })()
    );
});

// =====================================================================
// VII. CHIẾN LƯỢC FETCH (SMART CACHING)
// =====================================================================

// Hàm fetch có timeout (Tránh treo web khi mạng chập chờn)
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

// Chiến lược: Stale-While-Revalidate (Trả cache cũ, ngầm cập nhật bản mới)
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            // CHỈ CACHE NẾU: HTTP 200 OK và cùng origin
            if (response && response.ok && response.type === 'basic') {
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        })
        .catch(() => null);

    return cached || await fetchPromise || new Response('Offline', { status: 503 });
}

self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Bỏ qua các request không phải GET hoặc không phải HTTP (ví dụ: chrome-extension://)
    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    let url;
    try { url = new URL(request.url); } catch (e) { return; }
    
    // Bỏ qua cross-origin (Các request đến từ tên miền khác)
    if (url.origin !== self.location.origin) return;

    // 1. HTML (Điều hướng trang) -> Network First (Ưu tiên mạng, mạng yếu lấy cache)
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            (async () => {
                try {
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) return preloadResponse;

                    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
                    const cache = await caches.open(HTML_CACHE);
                    cache.put(request, networkResponse.clone()).catch(() => {});
                    return networkResponse;
                } catch (error) {
                    const cache = await caches.open(HTML_CACHE);
                    const cached = await cache.match(request);
                    if (cached) return cached;
                    // Nếu không có mạng và không có cache -> Hiện trang Offline
                    return new Response(OFFLINE_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
                }
            })()
        );
        return;
    }

    // 2. JSON trong /data/ -> Stale-While-Revalidate
    if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    // 3. CSS, JS, Font -> Stale-While-Revalidate
    if (/\.(css|js|mjs|woff2?|ttf|otf|eot)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    // 4. Hình ảnh (jpg, png, svg...) -> Stale-While-Revalidate (Chỉ cache khi xem)
    if (/\.(png|jpe?g|gif|svg|webp|ico|bmp)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
        return;
    }

    // 5. Các request khác -> Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// =====================================================================
// VIII. MESSAGE (Giao tiếp với UI)
// =====================================================================
self.addEventListener('message', (event) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;

    // 1. Xử lý SKIP_WAITING (Từ Update Banner trên giao diện)
    if (message.type === 'SKIP_WAITING') {
        console.log(`[SW ${CACHE_VERSION}] Nhận SKIP_WAITING — Kích hoạt ngay.`);
        event.waitUntil(self.skipWaiting());
        return;
    }

    // 2. Xử lý Tải Offline hàng loạt (DOWNLOAD_BATCH)
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
                        // Ép kiểu JSON để kiểm tra tính hợp lệ trước khi cache
                        await res.clone().json();
                        await cache.put(item.url, res);
                        results.push({ id: item.id, status: 'success' });
                    } catch (err) {
                        results.push({ id: item.id, status: 'error', reason: err.message });
                    }
                }

                // Gửi kết quả về lại cho giao diện (Offline Library)
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
