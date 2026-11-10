/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (AUTO UPDATE - NETWORK FIRST)
   Tác giả: Văn Đạo
   Mô tả: 
   - Tự động cập nhật code mới khi có mạng (không cần đổi version).
   - Chạy offline hoàn hảo khi mất mạng.
   - Tối ưu hóa việc tải hình ảnh bằng bộ nhớ đệm.
   ===================================================================== */

// 1. TÊN BỘ NHỚ ĐỆM (Cố định, không cần đổi thủ công)
const CACHE_NAME = 'vandao-auto-cache';

// 2. DANH SÁCH CÁC FILE CẦN TẢI VỀ ĐỂ CHẠY OFFLINE (ASSETS)
// Đã cập nhật chính xác tên file ảnh mới của bạn (có chữ "anh-")
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    
    './data-ly-thuyet.json',
    './data-tac-gia.json',
    './data-tac-pham.json',
    './data-danh-ngon.json',
    
    './anh-khung_sang.jpg',
    './anh-khung_toi.jpg',
    './anh-nen_sang.jpg',
    './anh-nen_toi.jpg',
    './anh-logo_trang.png',
    './anh-logo_toi.png'
];

// =====================================================================
// 3. SỰ KIỆN CÀI ĐẶT (INSTALL)
// Chạy khi App được mở lần đầu tiên. Tải toàn bộ file vào bộ nhớ đệm.
// =====================================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đang tải dữ liệu lần đầu vào bộ nhớ đệm...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Bỏ qua trạng thái chờ, kích hoạt Service Worker mới ngay lập tức
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Lỗi khi tải file vào bộ nhớ đệm:', error);
            })
    );
});

// =====================================================================
// 4. SỰ KIỆN KÍCH HOẠT (ACTIVATE)
// Chạy khi Service Worker mới được kích hoạt. Dọn dẹp bộ nhớ đệm cũ.
// =====================================================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Đã dọn dẹp bộ nhớ đệm cũ:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Áp dụng Service Worker này cho tất cả các tab đang mở ngay lập tức
            return self.clients.claim();
        })
    );
});

// =====================================================================
// 5. SỰ KIỆN LẤY DỮ LIỆU (FETCH) - TRÁI TIM CỦA TỰ ĐỘNG CẬP NHẬT
// =====================================================================
self.addEventListener('fetch', (event) => {
    // Bỏ qua các request không phải GET (như POST)
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    // Kiểm tra xem request này có phải là file hình ảnh không
    const isImage = url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);

    if (isImage) {
        // -------------------------------------------------------------
        // CHIẾN LƯỢC CHO HÌNH ẢNH: CACHE ƯU TIÊN (CACHE FIRST)
        // Giúp tải ảnh cực nhanh và tiết kiệm 3G/4G
        // -------------------------------------------------------------
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // Nếu có ảnh trong bộ nhớ đệm, trả về luôn
                if (cachedResponse) return cachedResponse;

                // Nếu không có, tải từ mạng và lưu vào bộ nhớ đệm
                return fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        // -------------------------------------------------------------
        // CHIẾN LƯỢC CHO CODE (HTML, CSS, JS, JSON): MẠNG ƯU TIÊN
        // Giúp App tự động cập nhật ngay khi bạn đẩy code mới lên GitHub
        // -------------------------------------------------------------
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                // Tải thành công từ mạng -> Lưu bản mới nhất vào bộ nhớ đệm
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                // Nếu đang Offline (mất mạng) -> Lấy bản cũ trong bộ nhớ đệm ra chạy
                return caches.match(event.request);
            })
        );
    }
});

// =====================================================================
// 6. LẮNG NGHE TIN NHẮN TỪ TRANG WEB
// Dùng để ép App cập nhật ngay lập tức nếu có lệnh từ file HTML/JS
// =====================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});