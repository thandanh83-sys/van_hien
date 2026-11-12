/* =====================================================================
   VĂN ĐẠO SERVICE WORKER (VERSION 4.5 - STABLE HYBRID CACHE)
   Tác giả: Văn Đạo
   
   TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
   - Bộ nhớ đệm lai (Hybrid Cache): Không dùng 1 chiến lược cho tất cả.
     + HTML: Network First (Ưu tiên bản mới để nhận cập nhật cấu trúc).
     + JSON: Stale-While-Revalidate (Tốc độ là ưu tiên, cập nhật ngầm).
     + CSS/JS/Ảnh/Font: Stale-While-Revalidate (Đảm bảo cập nhật code mới
       dù không dùng ?v=, đồng thời vẫn siêu tốc độ).
   - Sự tĩnh tại (No Auto-Skip): TUYỆT ĐỐI KHÔNG gọi skipWaiting() trong 
     install. SW mới phải chờ người dùng xác nhận (qua banner), tránh 
     việc tự động reload làm gián đoạn trải nghiệm đọc.
   - An toàn dữ liệu: Chỉ cache các response hợp lệ (Status 200, Type basic).
   ===================================================================== */

// =====================================================================
// I. CẤU HÌNH PHIÊN BẢN VÀ TÊN BỘ NHỚ ĐỆM
// =====================================================================
// Tăng số này lên mỗi khi bạn muốn ép buộc toàn bộ người dùng xóa cache cũ.
const CACHE_VERSION = 'v4.5.0';

const STATIC_CACHE  = `vandao-static-${CACHE_VERSION}`;
const HTML_CACHE    = `vandao-html-${CACHE_VERSION}`;
const DATA_CACHE    = `vandao-data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vandao-runtime-${CACHE_VERSION}`;

// Timeout cho chiến lược Network First của HTML (4 giây)
const NETWORK_TIMEOUT = 4000;

// Danh sách "App Shell" - Những file tối quan trọng phải tải ngay lập tức
// khi cài đặt Service Worker, để App có thể chạy Offline ngay từ lần 2.
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/nen.jpg',
    './assets/khung.jpg',
    './assets/favicon.ico',
    './assets/favicon.svg',
    './assets/apple-touch-icon.png',
    './assets/web-app-manifest-192x192.png',
    './assets/web-app-manifest-512x512.png',
    './assets/fonts/AlexBrush-Regular.woff2',
    // Cache sẵn các file Data tĩnh để App mở lên là có dữ liệu ngay
    './data/data-ly-thuyet.json',
    './data/data-tac-gia.json',
    './data/data-tac-pham.json',
    './data/data-danh-ngon.json',
    './data/data-loi-binh.json',
    './data/data-tu-dien.json',
    './data/data-the-loai.json',
    './data/data-van-khi.json'
];

// =====================================================================
// II. SỰ KIỆN CÀI ĐẶT (INSTALL)
// =====================================================================
self.addEventListener('install', (event) => {
    console.log('[SW] Đang tải App Shell (Precache)...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            // Dùng vòng lặp map + catch để tránh lỗi sập nguồn nếu 1 file 404
            return Promise.all(
                PRECACHE_ASSETS.map(url => 
                    cache.add(url).catch(err => 
                        console.warn(`[SW] Bỏ qua file không tồn tại: ${url}`, err)
                    )
                )
            );
        })
    );
    // ĐÃ XÓA DÒNG self.skipWaiting() TẠI ĐÂY.
    // SW mới sẽ nằm ở trạng thái "waiting" cho đến khi user bấm nút Cập nhật.
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
                    // Dọn dẹp các cache cũ không thuộc phiên bản hiện tại
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

// 1. Network First với Timeout (Dành cho HTML)
// Lấy từ mạng trước, nếu mạng lag > 4s hoặc offline thì lấy từ cache.
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
        console.log('[SW] Mạng yếu hoặc Offline, dùng HTML từ cache.');
        const cached = await cache.match(request);
        if (cached) return cached;
        return caches.match('./'); // Fallback về trang chủ
    }
}

// 2. Stale-While-Revalidate (Dành cho JSON, CSS, JS, Font, Ảnh)
// Trả về cache NGAY LẬP TỨC (0.01s). Đồng thời ngầm fetch bản mới để cập nhật.
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const revalidate = fetch(request)
        .then(response => {
            // Chỉ cache response hợp lệ và cùng origin
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
    
    // Bỏ qua các request không phải GET
    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    const url = new URL(request.url);
    if (url.origin !== location.origin) return;

    // --- ĐIỀU PHỐI (ROUTING) ---

    // 1. HTML (Document) -> Network First
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(networkFirstWithTimeout(request, HTML_CACHE, NETWORK_TIMEOUT));
        return;
    }

    // 2. Dữ liệu JSON -> Stale-While-Revalidate
    if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    // 3. Tài nguyên tĩnh: CSS, JS, Font, Ảnh -> Stale-While-Revalidate
    if (/\.(css|js|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    // 4. Các request khác -> Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// =====================================================================
// VI. SỰ KIỆN NHẬN TIN NHẮN (MESSAGE)
// =====================================================================
self.addEventListener('message', (event) => {
    // Lắng nghe tín hiệu từ script.js (Banner Cập nhật)
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Người dùng đã đồng ý cập nhật. Đang kích hoạt...');
        self.skipWaiting();
    }
});