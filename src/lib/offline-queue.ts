// Must stay in sync with the constants in public/sw.js
const DB_NAME = 'lifeos-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-thoughts';
export const SYNC_TAG = 'sync-thoughts';

export interface PendingThought {
  id?: number;
  content: string;
  tags: string[];
  queuedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export async function queueThought(
  thought: Omit<PendingThought, 'id' | 'queuedAt'>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ ...thought, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(SYNC_TAG);
  }
}

export async function getPendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = (e) => resolve((e.target as IDBRequest<number>).result);
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}
