const CACHE_NAME = 'smis-v5';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/icon.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/fix/vite-hmr-service-worker-provider
      Promise.all(
        keys
          .filter((key) => key.startsWith('smis-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
<<<<<<< HEAD
=======
      Promise.all(keys.filter((key) => key.startsWith('smis-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
>>>>>>> origin/feat/dexie-offline-data-sync
=======
>>>>>>> origin/fix/vite-hmr-service-worker-provider
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
<<<<<<< HEAD
<<<<<<< HEAD
  if (url.origin !== self.location.origin) return;
=======
  // API data is managed by Dexie in the authenticated page context, never by
  // the shared service-worker cache. This prevents cross-user cache leakage.
=======
  if (url.origin !== self.location.origin) return;

  // Never cache API data, authentication endpoints, or the standalone login.
>>>>>>> origin/fix/vite-hmr-service-worker-provider
  if (url.pathname.startsWith('/api/') || url.pathname === '/institution-login.html') {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })));
    return;
  }
>>>>>>> origin/feat/dexie-offline-data-sync

<<<<<<< HEAD
  // Never cache API data, authentication endpoints, or the standalone login.
  if (url.pathname.startsWith('/api/') || url.pathname === '/institution-login.html') {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })));
    return;
  }

=======
>>>>>>> origin/fix/vite-hmr-service-worker-provider
  // Dexie owns user-scoped API read caching; this worker only caches the app shell/assets.
  // Always prefer the current HTML shell; fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || Response.error()),
    );
    return;
  }

  // Cache static assets for offline use. Hashed build assets are immutable;
  // newly deployed HTML points to the new hashes.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type !== 'opaque') {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

self.addEventListener('sync', (event) => {
<<<<<<< HEAD
<<<<<<< HEAD
  if (event.tag === 'smis-sync') event.waitUntil(doBackgroundSync());
=======
  if (event.tag === 'smis-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_REQUIRED' }));
      })
    );
  }
>>>>>>> origin/feat/dexie-offline-data-sync
=======
  if (event.tag === 'smis-sync') event.waitUntil(doBackgroundSync());
>>>>>>> origin/fix/vite-hmr-service-worker-provider
});

async function doBackgroundSync() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage({ type: 'SYNC_REQUIRED' }));
}
