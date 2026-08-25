const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return localStorage.getItem('accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type GateLog = { id:string; personName:string; personType:string; purpose:string; entryTime:string; exitTime:string | null; issuedBy?:string; notes?:string };
export function searchGateLogs(personName?:string,personType?:string){ const qs = new URLSearchParams(); if(personName) qs.set('personName',personName); if(personType) qs.set('personType',personType); return request<GateLog[]>(`/api/gate${qs.toString() ? '?' + qs.toString() : ''}`); }
export function getGateLog(id:string){ return request<GateLog>(`/api/gate/${id}`); }
export function createGateLog(input: Omit<GateLog,'id'|'entryTime'|'exitTime'>){ return request<GateLog>('/api/gate',{method:'POST',body:JSON.stringify(input)}); }
export function logGateExit(id:string){ return request<void>(`/api/gate/${id}/exit`,{method:'PATCH'}); }
