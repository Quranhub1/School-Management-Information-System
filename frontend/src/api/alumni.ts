const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return sessionStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type Alumni = { id:string; studentId:string; graduationDate:string; programme:string; currentOccupation?:string; employer?:string; contactInfo?:string; isActive:boolean };
export function listAlumni(){ return request<Alumni[]>('/api/alumni'); }
export function createAlumni(input: Omit<Alumni,'id'|'isActive'>){ return request<Alumni>('/api/alumni',{method:'POST',body:JSON.stringify(input)}); }
export function updateAlumni(id:string,input:Partial<Alumni>){ return request<void>(`/api/alumni/${id}`,{method:'PATCH',body:JSON.stringify(input)}); }
