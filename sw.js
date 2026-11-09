/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (OFFLINE CACHE)
   Tác giả: Văn Đạo
   Mô tả: Lưu trữ toàn bộ tài nguyên (HTML, CSS, JS, JSON, Ảnh) vào bộ nhớ
          đệm để ứng dụng có thể chạy hoàn toàn OFFLINE.
   ===================================================================== */

// 1. Đặt tên cho bộ nhớ đệm (Mỗi khi bạn cập nhật code, hãy đổi v1 -> v2, v3...)
const CACHE_NAME = 'vandao-cache-v1';

// 2. Danh sách TẤT CẢ các file cần tải xuống để chạy offline
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
    './khung_sang.jpg',
    './khung_toi.jpg',
    './nen_sang.jpg',
    './nen_toi.jpg',
    './logo_trang.png',
    './logo_toi.png'
];

// 3. Sự kiện Cài đặt (Install): Tải và lưu tất cả file vào bộ nhớ đệm
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đang tải dữ liệu vào bộ nhớ đệm...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Kích hoạt Service Worker mới ngay lập tức mà không cần đợi
                return self.skipWaiting();
            })
    );
});

// 4. Sự kiện Kích hoạt (Activate): Xóa các bộ nhớ đệm cũ (nếu bạn đổi version)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Đã xóa bộ nhớ đệm cũ:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Kiểm soát tất cả các tab đang mở ngay lập tức
            return self.clients.claim();
        })
    );
});

// 5. Sự kiện Fetch (Lấy dữ liệu): Ưu tiên lấy từ bộ nhớ đệm, nếu không có mới lên mạng
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Nếu tìm thấy file trong bộ nhớ đệm, trả về luôn (chạy offline)
                if (response) {
                    return response;
                }
                // Nếu không có, tiến hành tải từ mạng (ví dụ: lần đầu mở app)
                return fetch(event.request).then((networkResponse) => {
                    // (Tùy chọn) Lưu các file mới tải từ mạng vào bộ nhớ đệm
                    return caches.open(CACHE_NAME).then((cache) => {
                        // Chỉ cache các request GET hợp lệ
                        if (event.request.method === 'GET' && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                });
            }).catch(() => {
                // Nếu mất mạng và không có trong bộ nhớ đệm, có thể hiển thị một trang báo lỗi offline
                // (Hiện tại app đã lưu tất cả nên hiếm khi rơi vào trường hợp này)
                console.log('[Service Worker] Không có kết nối mạng và không tìm thấy trong cache.');
            })
    );
});