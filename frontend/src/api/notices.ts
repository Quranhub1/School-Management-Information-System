import { readThroughCache } from '../lib/offline/api'
import { invalidateCachedRead } from '../lib/offline/db'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function token() { return sessionStorage.getItem('smis.accessToken') ?? localStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: (init.method ?? 'GET').toUpperCase() === 'GET' ? 'no-store' : init.cache,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type Notice = { id:string; title:string; body:string; priority:string; audience:string; expiresAt?:string; createdBy:string; createdAt:string };
export function listNotices() {
  return readThroughCache('notices:board', () => request<Notice[]>('/api/notices/board'), { ttlMs: 30 * 60 * 1000 });
}
<<<<<<< HEAD
<<<<<<< HEAD
export type CreateNoticeInput = Omit<Notice, 'id' | 'createdAt' | 'createdBy' | 'expiresAt'> & { expiresAt: string | null; createdBy: string };
export async function createNotice(input: CreateNoticeInput) {
=======
export async function createNotice(input: Omit<Notice,'id'|'createdAt'|'createdBy'>) {
>>>>>>> origin/feat/dexie-offline-data-sync
=======
export type CreateNoticeInput = Omit<Notice, 'id' | 'createdAt' | 'createdBy' | 'expiresAt'> & { expiresAt: string | null; createdBy: string };
export async function createNotice(input: CreateNoticeInput) {
>>>>>>> origin/fix/notices-expiry-on-current-main
  const created = await request<Notice>('/api/notices/board',{method:'POST',body:JSON.stringify(input)});
  await invalidateCachedRead('notices:board');
  return created;
}
