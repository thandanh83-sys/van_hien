/**
 * ==========================================================
 * VĂN ĐẠO - SERVICE WORKER (sw.js)
 * Chức năng: Hybrid Caching (Network First & Stale-While-Revalidate)
 * Đã cập nhật: Đường dẫn file mới trong thư mục js/ và css/
 * ==========================================================
 */

// ĐỔI VERSION NÀY MỖI KHI BẠN CẬP NHẬT CODE ĐỂ XÓA CACHE CŨ
const CACHE_NAME = 'van-dao-v5.0.0'; 

// DANH SÁCH CÁC FILE CẦN CACHE LẠI (App Shell)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    // CSS mới
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/layouts.css',
    './css/reader.css',
    // JS mới
    './js/main.js',
    './js/config.js',
    './js/router.js',
    './js/render.js',
    './js/search.js',
    './js/offline.js'
];

// 1. SỰ KIỆN INSTALL (Cài đặt Service Worker)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Đang cache App Shell...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            // Không tự động skipWaiting, chờ người dùng bấm nút cập nhật
            console.log('[SW] Cài đặt thành công.');
        })
    );
});

// 2. SỰ KIỆN ACTIVATE (Kích hoạt, dọn dẹp cache cũ)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Đang xóa cache cũ:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. SỰ KIỆN FETCH (Bắt các request mạng để trả về dữ liệu)
self.addEventListener('fetch', (event) => {
    // Bỏ qua các request không phải GET (như POST)
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Chiến lược 1: HTML (Network First) - Ưu tiên lấy mạng, mất mạng mới lấy cache
    if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Chiến lược 2: CSS, JS, JSON, Hình ảnh (Stale-While-Revalidate)
    // Ưu tiên lấy cache cho nhanh, đồng thời ngầm tải bản mới về cập nhật
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Bỏ qua lỗi mạng (khi đang offline)
            });

            return cachedResponse || fetchPromise;
        })
    );
});
