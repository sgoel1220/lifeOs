const CACHE_NAME = 'lifeos-v1';
const SYNC_TAG = 'sync-thoughts';
const DB_NAME = 'lifeos-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-thoughts';

// ===== Install — pre-cache the capture app shell =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add('/capture'))
      .then(() => self.skipWaiting())
  );
});

// ===== Activate — purge old caches =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ===== Fetch — network-first for HTML, cache-first for static assets =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first for Next.js static chunks (content-hashed, safe to cache forever)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
      )
    );
    return;
  }

  // Network-first for HTML pages — fall back to cache when offline
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});

// ===== Background Sync — replay queued thoughts when back online =====
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingThoughts());
  }
});

async function syncPendingThoughts() {
  const thoughts = await getPendingThoughts();
  for (const thought of thoughts) {
    try {
      const { id: _localId, queuedAt: _ts, ...payload } = thought;
      const response = await fetch('/api/inkwell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await removePendingThought(thought.id);
        // Notify open tabs to refresh the list
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_COMPLETE' });
        }
      }
    } catch {
      // Will retry on the next sync event
    }
  }
}

// ===== IndexedDB helpers =====
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getPendingThoughts() {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
      })
  );
}

function removePendingThought(id) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
      })
  );
}
