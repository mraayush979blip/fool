const CACHE_VERSION = 'levelone-v2.5';
const CACHE_NAME = `levelone-cache-${CACHE_VERSION}`;

/**
 * Levelone Service Worker
 * Strategy: Network-First with Stale-While-Revalidate fallback.
 * CRITICAL: Bypasses all POST requests to ensure Next.js Server Actions 
 * and Supabase mutations work without 405 errors.
 */

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. BYPASS Strategy: Skip all POST, PUT, DELETE requests (Next.js Server Actions)
    if (request.method !== 'GET') return;

    // 2. BYPASS Strategy: Skip chrome-extension, internal, and specific API urls
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.pathname.startsWith('/api/')) return;

    // 3. NETWORK-FIRST Strategy: For HTML/Next.js pages/navigates
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // 4. STALE-WHILE-REVALIDATE Strategy: For static assets (JS, CSS, images)
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/) ||
        url.pathname.startsWith('/_next/static/')
    ) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    const fetchedResponse = fetch(request).then((networkResponse) => {
                        if (networkResponse.ok && networkResponse.status === 200) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => null);

                    return cachedResponse || fetchedResponse;
                });
            })
        );
        return;
    }

    // 5. DEFAULT: Network-first
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});
