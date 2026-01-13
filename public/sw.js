const CACHE_NAME = 'levelone-cache-v2'; // Changed version to force update
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.webmanifest',
    '/icon-192.png',
    '/icon-512.png',
    '/globals.css'
];

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Try to cache all assets, but don't fail if some are missing
            return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
                console.warn('[Service Worker] Failed to cache some assets:', error);
                // Cache assets individually to avoid failing on missing files
                return Promise.all(
                    ASSETS_TO_CACHE.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('[Service Worker] Failed to cache:', url, err);
                        })
                    )
                );
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    // Take control of all pages immediately
    event.waitUntil(
        clients.claim().then(() => {
            // Clean up old caches
            return caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only intercept GET requests to avoid breaking Server Actions (POST)
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
