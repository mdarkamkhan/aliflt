/* Service Worker for ALiF PWA */

const CACHE_NAME = 'alif-v5';

// Core static assets
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/favicon.png'
];

// 1. Install Event (Skip waiting immediately)
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. Activate Event (Claim clients and purge old cache versions)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);
  // Never cache studio / admin routes or localhost:4322 API calls
  if (reqUrl.pathname.startsWith('/curate') || reqUrl.port === '4322') {
    return;
  }

  // Navigation / HTML requests: Fast Network-first with 500ms timeout fallback to cache
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 500);
          const networkResponse = await fetch(event.request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (_err) {
          // Network took >500ms or offline: immediately fall through to cache
        }

        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          // Background revalidation
          fetch(event.request).then(async (freshResponse) => {
            if (freshResponse && freshResponse.status === 200) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(event.request, freshResponse);
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request);
      })()
    );
    return;
  }

  // Other assets: Stale-While-Revalidate or Cache-First with Network fallback
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch in background to revalidate cache
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});

