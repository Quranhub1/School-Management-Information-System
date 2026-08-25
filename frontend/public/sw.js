const CACHE = 'smis-offline-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncOfflineMutations());
  }
});

async function syncOfflineMutations() {
  const db = await openDB();
  const records = await db.getAll('mutations');
  for (const record of records) {
    try {
      await fetch(record.url, { method: record.method, body: record.body, headers: record.headers });
      await db.delete('mutations', record.id);
    } catch { /* will retry next sync */ }
  }
}

function openDB() {
  return new Promise<any>((resolve, reject) => {
    const request = indexedDB.open('smis-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('mutations')) db.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true });
    };
  });
}
