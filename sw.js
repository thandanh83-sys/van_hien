/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (ULTIMATE VERSION 1.1)
   Tác giả: Văn Đạo
   Mô tả: 
   - Quản lý Offline Cache bền bỉ, chống lỗi 404 file.
   - Chiến lược "Cache First" toàn diện: Tải tức thì (0.01s), chống lag.
   - Hỗ trợ Stale-While-Revalidate cho dữ liệu chi tiết.
   - Tuân thủ: 100% Text, không Emoji.
   ===================================================================== */

// =====================================================================
// I. CẤU HÌNH PHIÊN BẢN VÀ BỘ NHỚ ĐỆM
// =====================================================================
// LƯU Ý QUAN TRỌNG: Mỗi khi bạn sửa code hoặc thêm dữ liệu, 
// BẮT BUỘC phải tăng số Version này (vd: v1.1 -> v1.2) để ép trình duyệt tải mới.
const CACHE_VERSION = 'vandao-cache-v1.1'; 
const PRECACHE_NAME = CACHE_VERSION;
const RUNTIME_NAME = `${CACHE_VERSION}-runtime`;

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
    // Nếu thiếu 1 trong 2 file này, hệ thống vẫn chạy bình thường, chỉ báo warning ở Console.
    './assets/fonts/alex-brush.woff2',
    './assets/fonts/alex-brush.ttf',
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
                    if (cacheName.startsWith('vandao-') && cacheName !== PRECACHE_NAME && cacheName !== RUNTIME_NAME) {
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
// IV. SỰ KIỆN FETCH (LẤY DỮ LIỆU) - CHIẾN LƯỢC TỐI ƯU
// =====================================================================
self.addEventListener('fetch', (event) => {
    // Bỏ qua các request không phải GET (như POST) hoặc request từ extension trình duyệt
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
                    // Nếu tải từ mạng thành công, cập nhật lại vào Cache
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Nếu mất mạng, trả về cache cũ (nếu có)
                    return cachedResponse;
                });
                
                // Trả về cache ngay nếu có (tốc độ 0.01s), nếu không thì chờ fetch
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
                    return cachedResponse; // Trả về ngay nếu có trong cache
                }
                // Nếu chưa có trong Cache, tải từ mạng và lưu lại
                return fetch(event.request).then((networkResponse) => {
                    // Chỉ cache các response hợp lệ (tránh cache lỗi 404, 500)
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
    // (Lấy từ bộ nhớ máy ra dùng ngay lập tức, không chờ mạng)
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