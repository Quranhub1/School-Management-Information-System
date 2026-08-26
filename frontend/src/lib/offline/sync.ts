import { get as idbGet, put as idbPut, remove as idbRemove, clear as idbClear } from './db';

const SYNC_TAG = 'smis-sync';

export type QueueItem = {
  id?: number;
  url: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  createdAt: string;
};

export async function enqueue(item: Omit<QueueItem, 'id' | 'createdAt'>): Promise<void> {
  await idbPut<QueueItem>('queue', { ...item, createdAt: new Date().toISOString() });
}

export async function dequeue(): Promise<QueueItem | undefined> {
  const items = await idbGet<QueueItem>('queue');
  const next = items[0];
  if (!next) return undefined;
  if (next.id) await idbRemove('queue', next.id);
  return next;
}

export async function queueSize(): Promise<number> {
  const items = await idbGet<QueueItem>('queue');
  return items.length;
}

export async function processQueue(token: string): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  while (true) {
    const item = await dequeue();
    if (!item) break;
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(item.headers ?? {})
        },
        body: item.body ? JSON.stringify(item.body) : undefined
      });
      if (!response.ok) {
        throw new Error(`Sync failed (${response.status})`);
      }
      processed++;
    } catch {
      failed++;
      await idbPut('queue', item);
      break;
    }
  }
  return { processed, failed };
}

export async function requestBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register(SYNC_TAG);
  }
}
