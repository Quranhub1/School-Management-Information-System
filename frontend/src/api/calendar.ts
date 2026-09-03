const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return sessionStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type CalendarEvent = { id:string; title:string; description?:string; eventType:string; startDate:string; endDate:string; location?:string; isActive:boolean };
export function listEvents(){ return request<CalendarEvent[]>('/api/calendar'); }
export function createEvent(input: Omit<CalendarEvent,'id'|'isActive'>){ return request<CalendarEvent>('/api/calendar',{method:'POST',body:JSON.stringify(input)}); }
export function deactivateEvent(id:string){ return request<void>(`/api/calendar/${id}`,{method:'DELETE'}); }
