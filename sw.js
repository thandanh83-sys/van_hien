/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (OFFLINE CACHE V2)
   Tác giả: Văn Đạo
   Mô tả: Quản lý bộ nhớ đệm (Cache) cho phép ứng dụng hoạt động 100% 
          khi không có kết nối mạng (Offline).
   Lưu ý: Đã cập nhật tiền tố "anh-" cho tất cả các file hình ảnh.
   ===================================================================== */

// 1. ĐẶT TÊN CHO BỘ NHỚ ĐỆM (CACHE VERSION)
// Mỗi khi bạn cập nhật code (HTML, CSS, JS, JSON, hoặc thay ảnh mới),
// BẮT BUỘC phải đổi số 'v2' thành 'v3', 'v4'... để trình duyệt biết 
// có phiên bản mới và tự động tải lại.
const CACHE_NAME = 'vandao-cache-v2';

// 2. DANH SÁCH CÁC FILE CẦN TẢI XUỐNG ĐỂ CHẠY OFFLINE (ASSETS)
// Đã cập nhật chính xác tên file ảnh mới của bạn (có chữ "anh-")
const ASSETS_TO_CACHE = [
    // Các file gốc của trang web
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    
    // Các file cơ sở dữ liệu tri thức (JSON)
    './data-ly-thuyet.json',
    './data-tac-gia.json',
    './data-tac-pham.json',
    './data-danh-ngon.json',
    
    // Các file hình ảnh & logo (ĐÃ CẬP NHẬT TÊN MỚI)
    './anh-khung_sang.jpg',
    './anh-khung_toi.jpg',
    './anh-nen_sang.jpg',
    './anh-nen_toi.jpg',
    './anh-logo_trang.png',
    './anh-logo_toi.png'
];

// =====================================================================
// 3. SỰ KIỆN CÀI ĐẶT (INSTALL)
// Diễn ra khi trình duyệt tải Service Worker lần đầu tiên.
// Nhiệm vụ: Tải toàn bộ danh sách file ở trên và lưu vào bộ nhớ điện thoại.
// =====================================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đang tải dữ liệu vào bộ nhớ đệm...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Kích hoạt Service Worker mới ngay lập tức mà không cần đợi
                // người dùng đóng tất cả các tab đang mở.
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Lỗi khi tải file vào bộ nhớ đệm:', error);
            })
    );
});

// =====================================================================
// 4. SỰ KIỆN KÍCH HOẠT (ACTIVATE)
// Diễn ra khi Service Worker mới được kích hoạt.
// Nhiệm vụ: Dọn dẹp các bộ nhớ đệm cũ (nếu bạn đã đổi CACHE_NAME).
// =====================================================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Nếu tên bộ nhớ đệm khác với CACHE_NAME hiện tại -> Xóa nó đi
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Đã xóa bộ nhớ đệm cũ:', cacheName);
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
// 5. SỰ KIỆN LẤY DỮ LIỆU (FETCH)
// Diễn ra mỗi khi app yêu cầu tải một file (ảnh, json, css...).
// Nhiệm vụ: Ưu tiên tìm trong bộ nhớ đệm. Nếu không có mới lên mạng tải.
// =====================================================================
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // TRƯỜNG HỢP 1: Tìm thấy file trong bộ nhớ đệm (Đang Offline hoặc đã tải trước đó)
                if (cachedResponse) {
                    return cachedResponse;
                }

                // TRƯỜNG HỢP 2: Không có trong bộ nhớ đệm, phải lên mạng tải
                return fetch(event.request).then((networkResponse) => {
                    // Nếu tải thành công từ mạng, lưu luôn vào bộ nhớ đệm cho lần sau
                    if (event.request.method === 'GET' && networkResponse.status === 200) {
                        return caches.open(CACHE_NAME).then((cache) => {
                            // Lưu bản sao của dữ liệu vào cache
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // TRƯỜNG HỢP 3: Mất mạng và file không có trong bộ nhớ đệm
                    // (Thường xảy ra với các file chưa từng được tải, hoặc lỗi mạng)
                    console.log('[Service Worker] Không có mạng và không tìm thấy trong bộ nhớ đệm:', event.request.url);
                });
            })
    );
});
