const CACHE_NAME = 'levelone-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.webmanifest',
    '/icon-192.png',
    '/icon-512.png',
    '/globals.css'
];

self.addEventListener('install', (event: any) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event: any) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
