const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return localStorage.getItem('accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type Notice = { id:string; title:string; body:string; priority:string; audience:string; expiresAt?:string; createdBy:string; createdAt:string };
export function listNotices(){ return request<Notice[]>('/api/notices/board'); }
export function createNotice(input: Omit<Notice,'id'|'createdAt'|'createdBy'>){ return request<Notice>('/api/notices/board',{method:'POST',body:JSON.stringify(input)}); }
