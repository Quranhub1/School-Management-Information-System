const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return localStorage.getItem('accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type StaffMember = { id:string; staffNumber:string; firstName:string; lastName:string; nationalId?:string; phoneNumber?:string; email?:string; employmentType:string; isActive:boolean };
export function listStaff(activeOnly=true){ return request<StaffMember[]>(`/api/staff?activeOnly=${activeOnly}`); }
export function createStaff(input: Omit<StaffMember,'id'|'isActive'>){ return request<StaffMember>('/api/staff',{method:'POST',body:JSON.stringify(input)}); }
export function deactivateStaff(id:string){ return request<void>(`/api/staff/${id}/deactivate`,{method:'PATCH'}); }
