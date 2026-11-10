/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (ULTIMATE EDITION V6.0)
   Tác giả: Văn Đạo
   Mô tả: 
   - Quản lý Offline Cache cho toàn bộ PWA.
   - Chiến lược tối ưu: Network-First cho Code, Cache-First cho Ảnh/CDN, 
     Stale-While-Revalidate cho chi tiết tác phẩm.
   - Tự động dọn dẹp bộ nhớ rác khi nâng cấp phiên bản.
   ===================================================================== */

// =====================================================================
// I. CẤU HÌNH PHIÊN BẢN VÀ BỘ NHỚ ĐỆM
// =====================================================================
// LƯU Ý: Mỗi khi bạn sửa bất kỳ file code, ảnh hay dữ liệu nào, 
// BẮT BUỘC phải tăng số Version này để trình duyệt tải bản mới.
const CACHE_VERSION = 'vandao-cache-v6.0'; 
const PRECACHE_NAME = CACHE_VERSION;
const RUNTIME_NAME = `${CACHE_VERSION}-runtime`;

// Danh sách các file TĨNH cần tải về máy ngay từ lần đầu tiên (App Shell).
// Lưu ý: TUYỆT ĐỐI KHÔNG đưa các file trong 'data/tac-pham/' vào đây 
// để tránh việc tải hàng ngàn file cùng lúc làm treo App.
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
    './assets/logo.png',
    
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
                // addAll sẽ tải tất cả file. Nếu 1 file lỗi, toàn bộ quá trình sẽ lỗi.
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
                    // Nếu tên bộ nhớ đệm bắt đầu bằng 'vandao-' nhưng KHÔNG PHẢI là phiên bản hiện tại -> Xóa nó đi
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
    // (Dùng cho thư mục data/tac-pham/ - Tải từ Cache ngay lập tức, 
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
    // CHIẾN LƯỢC 2: CACHE FIRST cho Hình ảnh & CDN (Fonts, GSAP)
    // (Tải từ Cache trước, giúp tiết kiệm Data 3G/4G và tăng tốc độ)
    // -----------------------------------------------------------------
    const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url.pathname);
    const isCDN = url.hostname.includes('fonts.googleapis.com') || 
                  url.hostname.includes('fonts.gstatic.com') || 
                  url.hostname.includes('cdnjs.cloudflare.com') ||
                  url.hostname.includes('jsdelivr.net');

    if (isImage || isCDN) {
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
    // CHIẾN LƯỢC 3: NETWORK FIRST cho Code (HTML/CSS/JS/JSON chính)
    // (Luôn cố gắng lấy code mới nhất từ mạng. Nếu mất mạng mới lấy Cache)
    // -----------------------------------------------------------------
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Nếu fetch thành công, cập nhật lại Cache
                return caches.open(PRECACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // Nếu mất mạng, lấy bản cũ trong Cache ra chạy
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Nếu không có cả trong cache, có thể trả về một trang offline tùy chỉnh
                    // return caches.match('/offline.html'); 
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
