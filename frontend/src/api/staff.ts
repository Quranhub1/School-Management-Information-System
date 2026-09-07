const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return sessionStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type StaffMember = { id:string; staffNumber:string; firstName:string; lastName:string; nationalId?:string; phoneNumber?:string; email?:string; employmentType:string; isActive:boolean };
export type LeaveRequest = { id:string; staffMemberId:string; leaveType:string; startDate:string; endDate:string; reason:string; status:string; approvedBy?:string; approvedAt?:string };
export function listStaff(activeOnly=true){ return request<StaffMember[]>(`/api/staff?activeOnly=${activeOnly}`); }
export function createStaff(input: Omit<StaffMember,'id'|'isActive'>){ return request<StaffMember>('/api/staff',{method:'POST',body:JSON.stringify(input)}); }
export function deactivateStaff(id:string){ return request<void>(`/api/staff/${id}/deactivate`,{method:'PATCH'}); }
export function listLeave(staffId:string){ return request<LeaveRequest[]>(`/api/staff/${staffId}/leave`); }
export function requestLeave(staffId:string,input: Omit<LeaveRequest,'id'|'status'|'approvedBy'|'approvedAt'>){ return request<LeaveRequest>(`/api/staff/${staffId}/leave`,{method:'POST',body:JSON.stringify(input)}); }
export function approveLeave(id:string,approvedBy:string,approved:boolean){ return request<void>(`/api/staff/leave/${id}/approve`,{method:'PATCH',body:JSON.stringify({approvedBy,approved})}); }
export type UpdateStaffRequest = { id:string; staffNumber:string; firstName:string; lastName:string; nationalId?:string; phoneNumber?:string; email?:string; employmentType:string }
export function updateStaff(id:string, input: UpdateStaffRequest){ return request<StaffMember>(`/api/staff/${id}`,{method:'PUT',body:JSON.stringify(input)}); }
export function deleteStaff(id:string){ return request<void>(`/api/staff/${id}`,{method:'DELETE'}); }
