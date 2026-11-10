/* =====================================================================
   VĂN ĐẠO ENGINE - SERVICE WORKER (ULTIMATE EDITION V3.0)
   Tác giả: Văn Đạo
   Mô tả: 
   - Quản lý bộ nhớ đệm (Cache) thông minh cho PWA.
   - Hỗ trợ cấu trúc thư mục mới (assets/, data/, data/tac-pham/).
   - Chiến lược: Network First (cho Code), Cache First (cho Ảnh/CDN), 
     Stale-While-Revalidate (cho chi tiết tác phẩm).
   - Tuân thủ quy tắc: 100% Text, KHÔNG dùng Emoji/Icon Unicode.
   ===================================================================== */

// =====================================================================
// I. CẤU HÌNH PHIÊN BẢN VÀ BỘ NHỚ ĐỆM
// =====================================================================
// Mỗi khi bạn sửa code (HTML/CSS/JS/JSON hoặc thay ảnh), BẮT BUỘC phải đổi số Version này
// để Service Worker biết có phiên bản mới và tự động dọn dẹp bộ nhớ cũ.
const CACHE_VERSION = 'vandao-cache-v3.0'; 
const RUNTIME_CACHE = 'vandao-runtime-v3.0';

// Danh sách các file TĨNH cần tải về máy ngay từ lần đầu tiên (Precache).
// Lưu ý: TUYỆT ĐỐI KHÔNG đưa các file trong 'data/tac-pham/' vào đây 
// để tránh việc tải hàng ngàn file cùng lúc làm treo App.
const PRECACHE_ASSETS = [
    // --- Lõi giao diện ---
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    
    // --- Hình ảnh Bạch Ngọc (Chỉ dùng 3 ảnh sáng) ---
    './assets/nen-sang.jpg',
    './assets/khung-sang.jpg',
    './assets/logo-trang.png',
    
    // --- Dữ liệu danh mục và lý thuyết (Tải sẵn để dùng Offline) ---
    './data/data-ly-thuyet.json',
    './data/data-tac-gia.json',
    './data/data-danh-ngon.json',
    './data/data-tac-pham-index.json'
];

// =====================================================================
// II. SỰ KIỆN CÀI ĐẶT (INSTALL) - TẢI TÀI NGUYÊN VÀO BỘ NHỚ ĐỆM
// =====================================================================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Đang tiến hành cài đặt phiên bản mới...');
    
    event.waitUntil(
        caches.open(CACHE_VERSION)
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
                    // Nếu tên bộ nhớ đệm khác với phiên bản hiện tại -> Xóa nó đi
                    if (cacheName !== CACHE_VERSION && cacheName !== RUNTIME_CACHE) {
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
    // Bỏ qua các request không phải GET (như POST từ form) hoặc request từ extension
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);

    // -----------------------------------------------------------------
    // CHIẾN LƯỢC 1: STALE-WHILE-REVALIDATE cho Tác phẩm chi tiết
    // (Dùng cho thư mục data/tac-pham/ - Tải từ Cache ngay lập tức, 
    // đồng thời ngầm tải bản mới để cập nhật cho lần sau)
    // -----------------------------------------------------------------
    if (url.pathname.includes('/data/tac-pham/')) {
        event.respondWith(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Nếu mất mạng, trả về cache cũ (nếu có)
                        return cachedResponse;
                    });
                    
                    // Trả về cache ngay nếu có, nếu không thì chờ fetch
                    return cachedResponse || fetchPromise;
                });
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
                    return cachedResponse;
                }
                // Nếu chưa có trong Cache, tải từ mạng và lưu lại
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                        return networkResponse;
                    }
                    return caches.open(CACHE_VERSION).then((cache) => {
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
                return caches.open(CACHE_VERSION).then((cache) => {
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