/* =====================================================================
   VĂN ĐẠO SERVICE WORKER (VERSION 5.1.0 - MODULAR & AUDIT INTEGRATION)
   Tác giả: Văn Đạo
   
   TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
   1. Bộ nhớ đệm lai (Hybrid Cache):
      - HTML: Network First (Luôn ưu tiên bản mới để nhận cập nhật cấu trúc).
      - JSON: Stale-While-Revalidate (Tốc độ là ưu tiên, cập nhật ngầm).
      - CSS/JS/Ảnh/Font: Stale-While-Revalidate.
   2. Sự tĩnh tại (No Auto-Skip): TUYỆT ĐỐI KHÔNG gọi skipWaiting() trong 
      install. SW mới phải chờ người dùng xác nhận (qua banner).
   3. Smart Offline: Hỗ trợ tải theo lô (Batch Download) cho Tủ Sách Offline.
   4. Audit Ready: Đã bao gồm file audit.js để Bác Sĩ hoạt động Offline.
   ===================================================================== */

// =====================================================================
// I. KHAI BÁO PHIÊN BẢN VÀ TÊN BỘ NHỚ ĐỆM
// =====================================================================
// ĐỔI VERSION NÀY MỖI KHI BẠN CẬP NHẬT CODE ĐỂ XÓA CACHE CŨ
const CACHE_VERSION = 'v5.1.0';

const STATIC_CACHE  = `vandao-static-${CACHE_VERSION}`;
const HTML_CACHE    = `vandao-html-${CACHE_VERSION}`;
const DATA_CACHE    = `vandao-data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vandao-runtime-${CACHE_VERSION}`;

// Timeout cho chiến lược Network First của HTML (4 giây)
const NETWORK_TIMEOUT = 4000;

// =====================================================================
// II. DANH SÁCH "APP SHELL" - NHỮNG FILE TỐI QUAN TRỌNG
// Cập nhật chính xác 100% theo cấu trúc thư mục mới
// =====================================================================
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    
    // --- Toàn bộ CSS ---
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/layouts.css',
    './css/reader.css',
    
    // --- Toàn bộ JS (Cấu trúc Module) ---
    './js/config.js',
    './js/utils.js',
    './js/search.js',
    './js/render.js',
    './js/router.js',
    './js/offline.js',
    './js/ai.js',
    './js/audit.js',      // Thêm file Bác Sĩ Audit
    './js/main.js',
    
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
    
    // --- Toàn bộ 9 file Data JSON Index ---
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
// III. SỰ KIỆN CÀI ĐẶT (INSTALL)
// =====================================================================
self.addEventListener('install', (event) => {
    console.log('[SW] Đang tải App Shell (Precache)...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            // Dùng cache.add cho từng file để tránh lỗi "All or Nothing" 
            // Nếu 1 file lỗi, các file khác vẫn được cache thành công.
            return Promise.all(
                PRECACHE_ASSETS.map(url => 
                    cache.add(url).catch(err => 
                        console.warn(`[SW] Bỏ qua file không tồn tại hoặc lỗi mạng: ${url}`, err)
                    )
                )
            );
        })
    );
    // KHÔNG gọi self.skipWaiting() ở đây. SW sẽ chờ người dùng xác nhận.
});

// =====================================================================
// IV. SỰ KIỆN KÍCH HOẠT (ACTIVATE)
// =====================================================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Đang kích hoạt phiên bản mới...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Xóa các cache cũ (không phải phiên bản hiện tại)
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
// V. CÁC CHIẾN LƯỢC CACHE (CACHE STRATEGIES)
// =====================================================================

// Chiến lược 1: Network First (Mạng ưu tiên, mạng yếu thì lấy Cache)
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
        return caches.match('./'); // Fallback về trang chủ nếu mất mạng hoàn toàn
    }
}

// Chiến lược 2: Stale-While-Revalidate (Lấy Cache hiện ra ngay, cập nhật ngầm)
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const revalidate = fetch(request)
        .then(response => {
            // Chỉ cache các response hợp lệ từ server của mình (type basic)
            if (response && response.ok && response.type === 'basic') {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cached || (await revalidate);
}

// =====================================================================
// VI. SỰ KIỆN FETCH - ĐIỀU PHỐI CÁC CHIẾN LƯỢC
// =====================================================================
self.addEventListener('fetch', (event) => {
    const request = event.request;
    
    // Bỏ qua các request không phải GET (như POST) hoặc không phải HTTP
    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    const url = new URL(request.url);
    // Bỏ qua các request đến domain khác (ví dụ: Google Fonts, Analytics)
    if (url.origin !== location.origin) return;

    // 1. HTML -> Network First (Để luôn nhận được cấu trúc mới)
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(networkFirstWithTimeout(request, HTML_CACHE, NETWORK_TIMEOUT));
        return;
    }

    // 2. JSON (Data) -> Stale-While-Revalidate
    if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    // 3. CSS, JS, Fonts, Hình ảnh -> Stale-While-Revalidate
    if (/\.(css|js|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    // 4. Các request khác -> Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// =====================================================================
// VII. SỰ KIỆN NHẬN TIN NHẮN (MESSAGE)
// Dùng để xử lý cập nhật App và Tải dữ liệu Offline
// =====================================================================
self.addEventListener('message', (event) => {
    const message = event.data;
    if (!message) return;

    // 1. Xử lý kích hoạt SW mới (Khi người dùng bấm nút "Cập nhật" trên banner)
    if (message.type === 'SKIP_WAITING') {
        event.waitUntil(self.skipWaiting());
    }

    // 2. Xử lý tải theo lô cho Tủ Sách Offline (Giao tiếp với js/offline.js)
    if (message.type === 'DOWNLOAD_BATCH' && message.batch) {
        const port = event.ports[0];
        event.waitUntil(
            (async () => {
                const cache = await caches.open(DATA_CACHE);
                const results = [];
                
                for (const item of message.batch) {
                    try {
                        const res = await fetch(item.url);
                        // Xác minh JSON hợp lệ trước khi cache để tránh lưu file HTML lỗi
                        if (res.ok && res.type === 'basic') {
                            await res.clone().json(); 
                            await cache.put(item.url, res);
                            results.push({ id: item.id, status: 'success' });
                        } else {
                            results.push({ id: item.id, status: 'error', reason: 'HTTP Error' });
                        }
                    } catch (e) {
                        results.push({ id: item.id, status: 'error', reason: e.message });
                    }
                }
                
                // Trả kết quả về cho js/offline.js
                if (port) port.postMessage({ type: 'BATCH_COMPLETED', results });
            })()
        );
    }
});
