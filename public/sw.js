/* Service Worker for ALiF PWA */

const CACHE_NAME = 'alif-v6';

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
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const reqUrl = new URL(event.request.url);

  // Never intercept studio/admin routes, API functions, or video/media range streams
  if (
    reqUrl.pathname.startsWith('/curate') ||
    reqUrl.pathname.startsWith('/.netlify/') ||
    reqUrl.port === '4322' ||
    event.request.headers.has('range') ||
    reqUrl.pathname.endsWith('.mp4') ||
    reqUrl.pathname.endsWith('.webm') ||
    reqUrl.hostname.includes('cloudinary.com')
  ) {
    return;
  }

  // Navigation / HTML requests: Fast Network-first with 600ms timeout fallback to cache
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600);
          const networkResponse = await fetch(event.request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (_err) {
          // Network took >600ms or offline: immediately fall through to cache
        }

        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
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

  // Immutable hashed bundles & static image assets: Pure Cache-First (eliminates duplicate background re-fetches)
  const isStaticAsset =
    reqUrl.pathname.startsWith('/_astro/') ||
    reqUrl.pathname.startsWith('/thumbs/') ||
    reqUrl.pathname.startsWith('/uploads/') ||
    reqUrl.pathname.startsWith('/banner/') ||
    reqUrl.pathname.startsWith('/icons/') ||
    reqUrl.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
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
    return;
  }

  // Other GET assets (e.g., search.json, font CSS): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
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
