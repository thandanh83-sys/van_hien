/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (AUTO-UPDATE & OFFLINE CACHE)
   Tác giả: Văn Đạo
   Mô tả: 
   - Tự động phát hiện và tải bản cập nhật mới từ GitHub.
   - Xóa bộ nhớ đệm (cache) cũ để giải phóng dung lượng.
   - Chạy Offline 100% khi mất mạng.
   ===================================================================== */

// =====================================================================
// 1. KHAI BÁO PHIÊN BẢN VÀ DANH SÁCH TÀI NGUYÊN
// =====================================================================

// ⚠️ LƯU Ý QUAN TRỌNG: Mỗi khi bạn sửa code (HTML, CSS, JS) và đẩy lên GitHub, 
// BẮT BUỘC phải đổi số 'v1' này thành 'v2', 'v3'... 
// Nếu không đổi, điện thoại sẽ mãi mãi giữ code cũ trong bộ nhớ đệm!
const CACHE_NAME = 'vandao-cache-v1'; 

// Danh sách TẤT CẢ các file cần tải về máy để chạy Offline.
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
    
    // Hình ảnh và Logo (Tiền tố "anh-")
    './anh-khung_sang.jpg',
    './anh-khung_toi.jpg',
    './anh-nen_sang.jpg',
    './anh-nen_toi.jpg',
    './anh-logo_trang.png',
    './anh-logo_toi.png'
];

// =====================================================================
// 2. SỰ KIỆN CÀI ĐẶT (INSTALL) - TẢI TÀI NGUYÊN XUỐNG MÁY
// Chạy khi App được mở lần đầu tiên.
// =====================================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đang tải dữ liệu lần đầu vào bộ nhớ đệm...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Lệnh này cực kỳ quan trọng: Ép Service Worker mới kích hoạt ngay lập tức
                // mà không cần phải đợi người dùng đóng hết các tab đang mở.
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Lỗi khi tải file vào bộ nhớ đệm:', error);
            })
    );
});

// =====================================================================
// 3. SỰ KIỆN KÍCH HOẠT (ACTIVATE) - DỌN DẸP RÁC
// Chạy khi Service Worker mới được kích hoạt.
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
// 4. SỰ KIỆN FETCH (LẤY DỮ LIỆU) - TỐI ƯU HÓA TỐC ĐỘ
// Chạy mỗi khi App yêu cầu tải một file.
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
                // Nếu có ảnh trong bộ nhớ đệm, trả về luôn
                if (cachedResponse) return cachedResponse;

                // Nếu không có, tải từ mạng và lưu vào bộ nhớ đệm cho lần sau
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
// 5. SỰ KIỆN NHẬN TIN NHẮN (MESSAGE) - ÉP CẬP NHẬT
// Dùng để JS từ bên ngoài ra lệnh cho Service Worker cập nhật ngay.
// =====================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});