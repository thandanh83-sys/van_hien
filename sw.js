/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (AUTO-UPDATE & OFFLINE CACHE)
   Tác giả: Văn Đạo
   Phiên bản: v27 (Đồng bộ với cấu trúc file hiện tại)
   Mô tả: 
   - Tự động tải bản cập nhật ngầm (Network First cho Code).
   - Lưu trữ Offline (Cache First cho Hình ảnh).
   - Xóa bộ nhớ đệm cũ khi đổi Version.
   ===================================================================== */

// ⚠️ LƯU Ý QUAN TRỌNG: Mỗi khi bạn sửa code (HTML, CSS, JS, hoặc thay ảnh mới),
// BẮT BUỘC phải đổi số 'v27' này thành 'v28', 'v29'... 
// Nếu không đổi, App sẽ không biết có code mới để tải ngầm!
const CACHE_NAME = 'vandao-cache-v27'; 

// Danh sách TẤT CẢ các file cần tải về máy để chạy Offline.
// Đã đồng bộ chính xác 100% với thư mục dự án của bạn.
const ASSETS_TO_CACHE = [
    // Trang chủ và các file cấu hình
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    
    // Cơ sở dữ liệu tri thức (4 file JSON)
    './data-ly-thuyet.json',
    './data-tac-gia.json',
    './data-tac-pham.json',
    './data-danh-ngon.json',
    
    // Hình ảnh và Logo (Tiền tố "anh-")
    './anh-khung_sang.jpg',
    './anh-khung_toi.jpg',
    './anh-nen_sang.jpg',
    './anh-nen_toi.jpg',
    './anh-logo_trang.png',
    './anh-logo_toi.png'
];

// =====================================================================
// 1. SỰ KIỆN CÀI ĐẶT (INSTALL) - TẢI TÀI NGUYÊN XUỐNG MÁY
// =====================================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đang tải toàn bộ dữ liệu vào bộ nhớ đệm...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Kích hoạt Service Worker mới ngay lập tức
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Lỗi khi tải file vào bộ nhớ đệm:', error);
            })
    );
});

// =====================================================================
// 2. SỰ KIỆN KÍCH HOẠT (ACTIVATE) - DỌN DẸP BỘ NHỚ CŨ
// =====================================================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Nếu tên bộ nhớ đệm khác với CACHE_NAME hiện tại -> Xóa nó đi
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Đã phát hiện bộ nhớ đệm cũ, tiến hành xóa:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Giành quyền kiểm soát tất cả các trang đang mở ngay lập tức
            return self.clients.claim();
        })
    );
});

// =====================================================================
// 3. SỰ KIỆN FETCH (LẤY DỮ LIỆU) - TỐI ƯU HÓA TỐC ĐỘ
// =====================================================================
self.addEventListener('fetch', (event) => {
    // Bỏ qua các request không phải GET (như POST từ form)
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    
    // Kiểm tra xem request này có phải là file hình ảnh không
    const isImage = url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);

    if (isImage) {
        // ---------------------------------------------------------
        // CHIẾN LƯỢC CHO HÌNH ẢNH: CACHE FIRST (Bộ nhớ ưu tiên)
        // Giúp tải ảnh siêu nhanh và không tốn 3G/4G
        // ---------------------------------------------------------
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        // ---------------------------------------------------------
        // CHIẾN LƯỢC CHO CODE (HTML, CSS, JS, JSON): NETWORK FIRST
        // Giúp App tự động cập nhật giao diện mới ngay khi có mạng
        // ---------------------------------------------------------
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
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
// 4. SỰ KIỆN NHẬN TIN NHẮN (MESSAGE)
// =====================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});