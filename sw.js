/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (ULTIMATE VERSION - STALE-WHILE-REVALIDATE)
   Tác giả: Văn Đạo
   Mô tả: 
   - Tự động cập nhật từ Git mà không cần đổi CACHE_VERSION.
   - Hiển thị ngay từ Cache (0.01s) để chạy Offline 100%.
   - Ngầm cập nhật bản mới từ mạng (Network) để lần sau mở App sẽ thấy code mới.
   - Chống lỗi 404 khi cài đặt (Install) nếu thiếu 1 file.
   ===================================================================== */

// =====================================================================
// I. CẤU HÌNH PHIÊN BẢN VÀ BỘ NHỚ ĐỆM
// =====================================================================
// Tên bộ nhớ đệm. Bạn không cần đổi tên này mỗi khi sửa code nữa.
const CACHE_NAME = 'vandao-auto-cache-v1'; 
const RUNTIME_NAME = 'vandao-auto-runtime-v1';

// Danh sách các file TĨNH cần tải về máy ngay từ lần đầu tiên (App Shell).
// KHÔNG đưa các file trong 'data/tac-pham/' vào đây để tránh tải hàng ngàn file cùng lúc.
const PRECACHE_ASSETS = [
    // --- Lõi giao diện ---
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    
    // --- Hình ảnh Bạch Ngọc (Đã nén) ---
    './assets/nen.jpg',
    './assets/khung.jpg',
    './assets/logo.png',
    
    // --- Font chữ cục bộ (Chạy Offline 100%) ---
    './assets/fonts/alex-brush.woff2',
    './assets/fonts/AlexBrush-Regular.ttf',
    
    // --- Dữ liệu danh mục và lý thuyết (Tải sẵn để dùng Offline) ---
    './data/data-ly-thuyet.json',
    './data/data-tac-gia.json',
    './data/data-danh-ngon.json',
    './data/data-tac-pham.json' // File danh mục tác phẩm (Index)
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
                // Nếu tải từ mạng thành công, cập nhật lại vào Cache để lần sau dùng
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
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
