/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (AUTO-UPDATE NGẦM)
   Tác giả: Văn Đạo
   Mô tả: 
   - Tự động tải bản cập nhật ngầm khi có mạng.
   - Xóa bộ nhớ đệm cũ khi phát hiện phiên bản mới.
   - Hỗ trợ chạy Offline 100% khi mất mạng.
   ===================================================================== */

// =====================================================================
// 1. KHAI BÁO PHIÊN BẢN VÀ DANH SÁCH TÀI NGUYÊN
// =====================================================================

// ⚠️ LƯU Ý QUAN TRỌNG: Mỗi khi bạn sửa code (HTML, CSS, JS) và đẩy lên GitHub, 
// BẮT BUỘC phải đổi số 'v1' này thành 'v2', 'v3'... 
// Nếu không đổi, App sẽ không biết có code mới để tải ngầm!
const CACHE_NAME = 'vandao-cache-v1'; 

// Danh sách TẤT CẢ các file cần tải về máy để chạy Offline.
// (Đã đồng bộ chính xác với tên file ảnh có tiền tố "anh-")
const ASSETS_TO_CACHE = [
    // Trang chủ và các file cấu hình
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    
    // Cơ sở dữ liệu tri thức
    './data-ly-thuyet.json',
    './data-tac-gia.json',
    './data-tac-pham.json',
    './data-danh-ngon.json',
    
    // Hình ảnh và Logo
    './anh-khung_sang.jpg',
    './anh-khung_toi.jpg',
    './anh-nen_sang.jpg',
    './anh-nen_toi.jpg',
    './anh-logo_trang.png',
    './anh-logo_toi.png'
];

// =====================================================================
// 2. SỰ KIỆN CÀI ĐẶT (INSTALL) - TẢI TÀI NGUYÊN VÀO BỘ NHỚ ĐỆM
// =====================================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đang tải dữ liệu vào bộ nhớ đệm...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Ép Service Worker mới kích hoạt ngay lập tức (không cần chờ tắt tab)
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Lỗi khi tải file vào bộ nhớ đệm:', error);
            })
    );
});

// =====================================================================
// 3. SỰ KIỆN KÍCH HOẠT (ACTIVATE) - DỌN DẸP BỘ NHỚ CŨ
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
// 4. SỰ KIỆN FETCH (LẤY DỮ LIỆU) - CHIẾN LƯỢC TỐI ƯU
// =====================================================================
self.addEventListener('fetch', (event) => {
    // Bỏ qua các request không phải GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    // Kiểm tra xem request này có phải là file hình ảnh không
    const isImage = url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);

    if (isImage) {
        // ---------------------------------------------------------
        // HÌNH ẢNH: CACHE FIRST (Tải siêu tốc từ bộ nhớ máy)
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
        // CODE (HTML, CSS, JS, JSON): NETWORK FIRST (Luôn lấy mới nhất)
        // ---------------------------------------------------------
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                // Nếu mất mạng -> Lấy bản cũ trong bộ nhớ đệm ra chạy
                return caches.match(event.request);
            })
        );
    }
});

// =====================================================================
// 5. SỰ KIỆN NHẬN TIN NHẮN (MESSAGE)
// =====================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});