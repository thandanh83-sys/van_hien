/* =====================================================================
   VĂN ĐẠO SERVICE WORKER (VERSION 5.0.0 - FULL OFFLINE MASTERY)
   Tác giả: Văn Đạo
   
   TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
   1. Bộ nhớ đệm lai (Hybrid Cache):
      - HTML: Network First (Luôn ưu tiên bản mới để nhận cập nhật cấu trúc).
      - JSON: Stale-While-Revalidate (Tốc độ là ưu tiên, cập nhật ngầm).
      - CSS/JS/Ảnh/Font: Stale-While-Revalidate.
   2. Sự tĩnh tại (No Auto-Skip): TUYỆT ĐỐI KHÔNG gọi skipWaiting() trong 
      install. SW mới phải chờ người dùng xác nhận (qua banner cập nhật).
   3. Smart Offline (Tủ Sách Offline): Hỗ trợ tải theo lô (Batch Download), 
      xác thực JSON trước khi lưu, và trả kết quả về cho script.js qua 
      event.source.postMessage để cập nhật thanh tiến trình.
   ===================================================================== */

// =====================================================================
// I. KHAI BÁO PHIÊN BẢN VÀ TÊN BỘ NHỚ ĐỆM
// =====================================================================
// Nâng cấp lên v5.0.0 để đồng bộ với script.js và style.css mới
const CACHE_VERSION = 'v5.0.0';

const STATIC_CACHE  = `vandao-static-${CACHE_VERSION}`;
const HTML_CACHE    = `vandao-html-${CACHE_VERSION}`;
const DATA_CACHE    = `vandao-data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vandao-runtime-${CACHE_VERSION}`;

// Timeout cho chiến lược Network First của HTML (4 giây)
const NETWORK_TIMEOUT = 4000;

// Danh sách "App Shell" - Những file tối quan trọng phải tải ngay lập tức
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './style.css',
    './script.js',
    
    // --- Hình ảnh Bạch Ngọc & Icons ---
    './assets/nen.jpg',
    './assets/khung.jpg',
    './assets/favicon.ico',
    './assets/favicon.svg',
    './assets/apple-touch-icon.png',
    './assets/web-app-manifest-192x192.png',
    './assets/web-app-manifest-512x512.png',
    
    // --- Font chữ cục bộ ---
    './assets/fonts/AlexBrush-Regular.woff2',
    
    // --- Toàn bộ 9 file Data JSON (Danh mục) ---
    './data/data-ly-thuyet.json',
    './data/data-tac-gia.json',
    './data/data-tac-pham.json',
    './data/data-danh-ngon.json',
    './data/data-loi-binh.json',
    './data/data-tu-dien.json',
    './data/data-the-loai.json',
    './data/data-van-khi.json',
    './data/data-tu-dien-the-loai.json'
];

// =====================================================================
// II. SỰ KIỆN CÀI ĐẶT (INSTALL)
// =====================================================================
self.addEventListener('install', (event) => {
    console.log('[SW] Đang tải App Shell (Precache)...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return Promise.all(
                PRECACHE_ASSETS.map(url => 
                    cache.add(url).catch(err => 
                        console.warn(`[SW] Bỏ qua file không tồn tại: ${url}`, err)
                    )
                )
            );
        })
    );
    // KHÔNG gọi self.skipWaiting() ở đây. SW sẽ chờ người dùng xác nhận qua banner.
});

// =====================================================================
// III. SỰ KIỆN KÍCH HOẠT (ACTIVATE)
// =====================================================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Đang kích hoạt phiên bản mới...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Xóa các cache cũ không thuộc phiên bản hiện tại
                    if (
                        cacheName.startsWith('vandao-') &&
                        cacheName !== STATIC_CACHE &&
                        cacheName !== HTML_CACHE &&
                        cacheName !== DATA_CACHE &&
                        cacheName !== RUNTIME_CACHE
                    ) {
                        console.log('[SW] Phát hiện cache cũ, tiến hành xóa:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Đã dọn dẹp xong. Giành quyền kiểm soát toàn bộ App.');
            return self.clients.claim();
        })
    );
});

// =====================================================================
// IV. CÁC CHIẾN LƯỢC CACHE (CACHE STRATEGIES)
// =====================================================================

/**
 * Chiến lược Network First (Ưu tiên mạng, fallback về cache)
 * Dùng cho HTML. Đảm bảo người dùng luôn nhận được bản cập nhật mới nhất nếu có mạng.
 */
async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
    const cache = await caches.open(cacheName);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timer);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        clearTimeout(timer);
        const cached = await cache.match(request);
        if (cached) return cached;
        // Fallback cuối cùng nếu mất mạng hoàn toàn
        return caches.match('./index.html'); 
    }
}

/**
 * Chiến lược Stale-While-Revalidate (Trả cache ngay, cập nhật ngầm)
 * Dùng cho JSON, CSS, JS, Ảnh, Font. Đảm bảo tốc độ tải tức thì.
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const revalidate = fetch(request)
        .then(response => {
            // Chỉ cache các response hợp lệ (tránh cache lỗi 404, 500)
            if (response && response.ok && response.type === 'basic') {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cached || (await revalidate);
}

// =====================================================================
// V. SỰ KIỆN FETCH - ĐIỀU PHỐI CÁC CHIẾN LƯỢC
// =====================================================================
self.addEventListener('fetch', (event) => {
    const request = event.request;
    
    // Bỏ qua các request không phải GET hoặc không phải HTTP/HTTPS
    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    const url = new URL(request.url);
    // Bỏ qua các request gọi đến API bên ngoài (Cross-Origin)
    if (url.origin !== location.origin) return;

    // 1. Xử lý HTML (Điều hướng trang)
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(networkFirstWithTimeout(request, HTML_CACHE, NETWORK_TIMEOUT));
        return;
    }

    // 2. Xử lý dữ liệu JSON (Tác phẩm, Tác giả, v.v.)
    if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    // 3. Xử lý Tài nguyên tĩnh (CSS, JS, Ảnh, Font)
    if (/\.(css|js|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    // 4. Các loại khác (Fallback)
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// =====================================================================
// VI. SỰ KIỆN NHẬN TIN NHẮN (MESSAGE)
// =====================================================================
self.addEventListener('message', (event) => {
    const message = event.data;
    if (!message) return;

    // -----------------------------------------------------------------
    // 1. Xử lý kích hoạt SW mới (Từ Update Banner)
    // -----------------------------------------------------------------
    if (message.type === 'SKIP_WAITING') {
        event.waitUntil(self.skipWaiting());
        return;
    }

    // -----------------------------------------------------------------
    // 2. Xử lý tải theo lô cho Tủ Sách Offline
    // -----------------------------------------------------------------
    if (message.type === 'DOWNLOAD_BATCH' && message.batch) {
        event.waitUntil(
            (async () => {
                const cache = await caches.open(DATA_CACHE);
                const results = [];
                
                for (const item of message.batch) {
                    try {
                        const res = await fetch(item.url);
                        
                        // Xác thực: Phải là JSON hợp lệ thì mới cache
                        if (res.ok && res.type === 'basic') {
                            await res.clone().json(); // Thử parse JSON để chắc chắn không bị lỗi
                            await cache.put(item.url, res);
                            results.push({ id: item.id, status: 'success' });
                        } else {
                            results.push({ id: item.id, status: 'error', reason: 'HTTP Error' });
                        }
                    } catch (e) {
                        results.push({ id: item.id, status: 'error', reason: e.message });
                    }
                }
                
                // [QUAN TRỌNG]: Trả kết quả về cho script.js
                // Dùng event.source.postMessage để đồng bộ với cách lắng nghe trong script.js V5.0
                if (event.source) {
                    event.source.postMessage({ type: 'BATCH_COMPLETED', results });
                } else {
                    // Fallback nếu không lấy được source (gửi cho tất cả clients)
                    const clients = await self.clients.matchAll();
                    clients.forEach(client => {
                        client.postMessage({ type: 'BATCH_COMPLETED', results });
                    });
                }
            })()
        );
    }
});
