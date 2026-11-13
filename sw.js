/* =====================================================================
   VĂN ĐẠO SERVICE WORKER (VERSION 5.0.2 - ĐÃ FIX LỖI CACHE CSS/JS)
   ===================================================================== */

const CACHE_VERSION = 'v5.0.2';

const STATIC_CACHE  = `vandao-static-${CACHE_VERSION}`;
const HTML_CACHE    = `vandao-html-${CACHE_VERSION}`;
const DATA_CACHE    = `vandao-data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vandao-runtime-${CACHE_VERSION}`;

const NETWORK_TIMEOUT = 4000;

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    
    // CSS
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/layouts.css',
    './css/reader.css',
    
    // JS
    './js/config.js',
    './js/utils.js',
    './js/search.js',
    './js/render.js',
    './js/router.js',
    './js/offline.js',
    './js/ai.js',
    './js/main.js',
    
    // Assets
    './assets/nen.jpg',
    './assets/khung.jpg',
    './assets/favicon.ico',
    './assets/favicon.svg',
    './assets/apple-touch-icon.png',
    './assets/web-app-manifest-192x192.png',
    './assets/web-app-manifest-512x512.png',
    './assets/fonts/AlexBrush-Regular.woff2',
    
    // Data JSON
    './data/data-ly-thuyet.json',
    './data/data-tac-gia.json',
    './data/data-tac-pham.json',
    './data/data-danh-ngon.json',
    './data/data-loi-binh.json',
    './data/data-tu-dien.json',
    './data/data-the-loai.json',
    './data/data-van-khi.json',
    './data/data-tu-dien-the-loai.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return Promise.all(
                PRECACHE_ASSETS.map(url => 
                    cache.add(url).catch(err => 
                        console.warn(`[SW] Bỏ qua file lỗi: ${url}`, err)
                    )
                )
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (
                        cacheName.startsWith('vandao-') &&
                        cacheName !== STATIC_CACHE &&
                        cacheName !== HTML_CACHE &&
                        cacheName !== DATA_CACHE &&
                        cacheName !== RUNTIME_CACHE
                    ) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
    const cache = await caches.open(cacheName);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timer);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        clearTimeout(timer);
        const cached = await cache.match(request);
        if (cached) return cached;
        return caches.match('./');
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const revalidate = fetch(request)
        .then(response => {
            if (response && response.ok && response.type === 'basic') {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cached || (await revalidate);
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    
    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    const url = new URL(request.url);
    if (url.origin !== location.origin) return;

    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(networkFirstWithTimeout(request, HTML_CACHE, NETWORK_TIMEOUT));
        return;
    }

    if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    if (/\.(css|js|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

self.addEventListener('message', (event) => {
    const message = event.data;
    if (!message) return;

    if (message.type === 'SKIP_WAITING') {
        event.waitUntil(self.skipWaiting());
    }

    if (message.type === 'DOWNLOAD_BATCH' && message.batch) {
        const port = event.ports[0];
        event.waitUntil(
            (async () => {
                const cache = await caches.open(DATA_CACHE);
                const results = [];
                
                for (const item of message.batch) {
                    try {
                        const res = await fetch(item.url);
                        if (res.ok && res.type === 'basic') {
                            await res.clone().json(); 
                            await cache.put(item.url, res);
                            results.push({ id: item.id, status: 'success' });
                        } else {
                            results.push({ id: item.id, status: 'error', reason: 'HTTP Error' });
                        }
                    } catch (e) {
                        results.push({ id: item.id, status: 'error', reason: e.message });
                    }
                }
                
                if (port) port.postMessage({ type: 'BATCH_COMPLETED', results });
            })()
        );
    }
});
