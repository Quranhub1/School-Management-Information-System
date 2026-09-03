import { enqueue, processQueue, queueSize } from './sync';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export type OfflineApiOptions = RequestInit & { skipQueue?: boolean };

async function getToken(): Promise<string | undefined> {
  return sessionStorage.getItem('smis.accessToken') ?? undefined;
}

export async function offlineRequest<T>(path: string, options: OfflineApiOptions = {}): Promise<T> {
  const { skipQueue = false, ...init } = options;
  const token = await getToken();
  const url = `${API_BASE_URL}${path}`;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes((init.method ?? 'GET').toUpperCase());
  const online = navigator.onLine;

  if (isMutation && !online && !skipQueue) {
    await enqueue({
      url,
      method: init.method ?? 'POST',
      body: init.body ? JSON.parse(init.body as string) : undefined,
      headers: init.headers ? JSON.parse(JSON.stringify(init.headers)) : undefined
    });
    return undefined as T;
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;

  if (isMutation && online) {
    try {
      await processQueue(token ?? '');
    } catch {
      // best-effort background sync
    }
  }

  return response.json() as Promise<T>;
}

export function getOnlineStatus(): boolean {
  return navigator.onLine;
}

export async function getPendingSyncCount(): Promise<number> {
  return queueSize();
}
