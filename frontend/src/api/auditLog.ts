const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return sessionStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type AuditLog = { id:string; userId?:string; action:string; entityType:string; entityId?:string; changes?:string; ipAddress?:string; userAgent?:string; timestamp:string };
export function searchAuditLogs(userId?:string,action?:string,entityType?:string){ const qs = new URLSearchParams(); if(userId) qs.set('userId',userId); if(action) qs.set('action',action); if(entityType) qs.set('entityType',entityType); return request<AuditLog[]>(`/api/audit${qs.toString() ? '?' + qs.toString() : ''}`); }
export function getAuditLog(id:string){ return request<AuditLog>(`/api/audit/${id}`); }
