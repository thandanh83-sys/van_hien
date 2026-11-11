/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (ULTIMATE VERSION - VÁ LỖI HOÀN HẢO)
   Tác giả: Văn Đạo
   Mô tả: 
   - Tự động cập nhật từ Git mà không cần đổi CACHE_VERSION.
   - Hiển thị ngay từ Cache (0.01s) để chạy Offline 100%.
   - Ngầm cập nhật bản mới từ mạng (Network).
   - VÁ LỖI 404: Không tải file logo.png cũ đã bị xóa.
   - VÁ LỖI CLONE: Kiểm tra an toàn trước khi nhân bản dữ liệu để lưu Cache.
   ===================================================================== */

// =====================================================================
// I. CẤU HÌNH PHIÊN BẢN VÀ BỘ NHỚ ĐỆM
// =====================================================================
// Tên bộ nhớ đệm. Bạn không cần đổi tên này mỗi khi sửa code nữa.
const CACHE_NAME = 'vandao-auto-cache-v3'; // Đã tăng lên v3 để ép trình duyệt xóa cache lỗi cũ
const RUNTIME_NAME = 'vandao-auto-runtime-v3';

// Danh sách các file TĨNH cần tải về máy ngay từ lần đầu tiên (App Shell).
// KHÔNG đưa các file trong 'data/tac-pham/' vào đây để tránh tải hàng ngàn file cùng lúc.
const PRECACHE_ASSETS = [
    // --- Lõi giao diện ---
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    
    // --- Hình ảnh Bạch Ngọc ---
    './assets/nen.jpg',
    './assets/khung.jpg',
    
    // --- Bộ Icon Hoa Sen mới (Đã thêm vào để tải trước) ---
    './assets/favicon.ico',
    './assets/favicon.svg',
    './assets/apple-touch-icon.png',
    './assets/web-app-manifest-192x192.png',
    './assets/web-app-manifest-512x512.png',
    
    // --- Font chữ cục bộ (Chạy Offline 100%) ---
    './assets/fonts/AlexBrush-Regular.woff2',
    
    // --- Dữ liệu danh mục và lý thuyết (Tải sẵn để dùng Offline) ---
    './data/data-ly-thuyet.json',
    './data/data-tac-gia.json',
    './data/data-danh-ngon.json',
    './data/data-tac-pham.json' // File danh mục tác phẩm (Index)
    
    // ĐÃ XÓA HOÀN TOÀN: './assets/logo.png' (Gây lỗi 404)
];

// =====================================================================
// II. SỰ KIỆN CÀI ĐẶT (INSTALL) - TẢI TÀI NGUYÊN VÀO BỘ NHỚ ĐỆM
// =====================================================================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Đang tiến hành cài đặt phiên bản mới...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đang tải các file tĩnh vào Precache...');
                // SỬ DỤNG VÒNG LẶP THAY VÌ cache.addAll ĐỂ CHỐNG LỖI SẬP NGUỒN NẾU THIẾU 1 FILE
                return Promise.all(
                    PRECACHE_ASSETS.map((url) => {
                        return cache.add(url).catch((err) => {
                            console.warn(`[Service Worker] Bỏ qua file không tồn tại: ${url}`, err);
                        });
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Cài đặt thành công. Đang chờ kích hoạt...');
                // Bỏ qua trạng thái chờ để kích hoạt SW mới ngay lập tức
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Lỗi nghiêm trọng khi cài đặt:', error);
            })
    );
});

// =====================================================================
// III. SỰ KIỆN KÍCH HOẠT (ACTIVATE) - DỌN DẸP BỘ NHỚ CŨ
// =====================================================================
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Đang kích hoạt phiên bản mới...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Nếu tên bộ nhớ đệm bắt đầu bằng 'vandao-' nhưng KHÔNG PHẢI là phiên bản hiện tại -> Xóa
                    if (cacheName.startsWith('vandao-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_NAME) {
                        console.log('[Service Worker] Phát hiện bộ nhớ đệm cũ, tiến hành xóa:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Đã dọn dẹp xong. Giành quyền kiểm soát toàn bộ App.');
            // Giành quyền kiểm soát tất cả các tab đang mở ngay lập tức
            return self.clients.claim();
        })
    );
});

// =====================================================================
// IV. SỰ KIỆN FETCH (LẤY DỮ LIỆU) - CHIẾN LƯỢC STALE-WHILE-REVALIDATE
// =====================================================================
self.addEventListener('fetch', (event) => {
    // Bỏ qua các request không phải GET (như POST) hoặc request từ extension trình duyệt
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 1. TẠO TIẾN TRÌNH NGẦM (FETCH TỪ GITHUB)
            // Dù có cache hay không, nó vẫn lén ra mạng để tải bản mới nhất
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // VÁ LỖI CLONE: Chỉ xử lý nếu phản hồi hợp lệ (Status 200) và không bị lỗi CORS
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    // Nhân bản AN TOÀN trước khi đưa vào Cache để tránh lỗi "Response body is already used"
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Nếu mất mạng, không làm gì cả, trả về bản trong máy
                return cachedResponse;
            });

            // 2. HIỂN THỊ NGAY LẬP TỨC
            // Nếu đã có trong bộ nhớ máy (cachedResponse) -> Trả ra NGAY (Tốc độ 0.01s, dùng Offline)
            // Nếu chưa có (lần đầu mở) -> Mới chờ tải từ mạng (fetchPromise)
            return cachedResponse || fetchPromise;
        })
    );
});

// =====================================================================
// V. SỰ KIỆN NHẬN TIN NHẮN (MESSAGE) - CẬP NHẬT NGẦM
// =====================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
