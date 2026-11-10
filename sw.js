/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (RESET VERSION 11.0)
   Tác giả: Văn Đạo
   Mô tả: 
   - Chiến lược "Cache First" toàn diện: Tải tức thì (0.01s), chống lag.
   - Hỗ trợ Local Fonts và ảnh nén.
   - Tự động dọn dẹp bộ nhớ rác khi nâng cấp phiên bản.
   - Tuân thủ: 100% Text, không Emoji.
   ===================================================================== */

// =====================================================================
// I. CẤU HÌNH PHIÊN BẢN VÀ BỘ NHỚ ĐỆM
// =====================================================================
// LƯU Ý: Mỗi khi bạn sửa code (HTML, CSS, JS, JSON), BẮT BUỘC phải đổi số Version này
// để trình duyệt biết có phiên bản mới và tự động xóa cache cũ.
const CACHE_VERSION = 'vandao-cache-v11.0'; 
const PRECACHE_NAME = CACHE_VERSION;
const RUNTIME_NAME = `${CACHE_VERSION}-runtime`;

// Danh sách các file TĨNH cần tải về máy ngay từ lần đầu tiên (App Shell).
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
    './assets/fonts/cinzel-bold.woff2',
    './assets/fonts/cinzel-regular.woff2',
    
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
        caches.open(PRECACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Đang tải các file tĩnh vào Precache...');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Cài đặt thành công. Đang chờ kích hoạt...');
                // Bỏ qua trạng thái chờ để kích hoạt SW mới ngay lập tức
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Lỗi khi tải file vào bộ nhớ đệm:', error);
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
                    if (cacheName.startsWith('vandao-') && cacheName !== PRECACHE_NAME && cacheName !== RUNTIME_NAME) {
                        console.log('[Service Worker] Phát hiện bộ nhớ đệm cũ, tiến hành xóa:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Đã dọn dẹp xong. Giành quyền kiểm soát toàn bộ App.');
            return self.clients.claim();
        })
    );
});

// =====================================================================
// IV. SỰ KIỆN FETCH (LẤY DỮ LIỆU) - CHIẾN LƯỢC TỐI ƯU
// =====================================================================
self.addEventListener('fetch', (event) => {
    // Bỏ qua các request không phải GET hoặc request từ extension
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);

    // -----------------------------------------------------------------
    // CHIẾN LƯỢC 1: STALE-WHILE-REVALIDATE cho Tác phẩm chi tiết
    // (Dùng cho data/tac-pham/ - Tải từ Cache ngay lập tức, 
    // đồng thời ngầm tải bản mới để cập nhật cho lần sau)
    // -----------------------------------------------------------------
    if (url.pathname.includes('/data/tac-pham/')) {
        event.respondWith(
            caches.open(RUNTIME_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);
                
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // -----------------------------------------------------------------
    // CHIẾN LƯỢC 2: CACHE FIRST cho Hình ảnh & Font
    // (Tải từ Cache trước, giúp tiết kiệm Data 3G/4G và tăng tốc độ)
    // -----------------------------------------------------------------
    const isAsset = /\.(jpg|jpeg|png|gif|svg|webp|woff2|woff|ttf)$/i.test(url.pathname);

    if (isAsset) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }
                    return caches.open(RUNTIME_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // -----------------------------------------------------------------
    // CHIẾN LƯỢC 3: CACHE FIRST cho Code (HTML/CSS/JS/JSON chính)
    // (Đã sửa từ Network First thành Cache First để chống lag)
    // Lấy từ bộ nhớ máy ra dùng ngay lập tức, không chờ mạng
    // -----------------------------------------------------------------
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Trả về ngay (0.01s)
            }
            // Nếu chưa có trong cache (lần đầu mở), mới tải từ mạng
            return fetch(event.request).then((networkResponse) => {
                return caches.open(PRECACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
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
