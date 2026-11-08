const CACHE_NAME = 'smis-v5';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/icon.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('smis-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // API data is managed by Dexie in the authenticated page context, never by
  // the shared service-worker cache. This prevents cross-user cache leakage.
  if (url.pathname.startsWith('/api/') || url.pathname === '/institution-login.html') {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => Response.error());
    })
  );
});

// The service worker only wakes open clients. It never replays queued writes;
// module-specific replay remains disabled until its server safety contract exists.
self.addEventListener('sync', (event) => {
  if (event.tag === 'smis-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_REQUIRED' }));
      })
    );
  }
});
