import { readApiErrorMessage } from './errors'
import { z } from 'zod'
import { parseApiInput } from '../lib/validation'
import { leaveRequestSchema, staffCreateRequestSchema } from '../schemas'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

function token() { return sessionStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  // Staff lists must always be read from the API/database, never from a browser HTTP cache.
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, cache: method === 'GET' ? 'no-store' : init.cache, headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache', 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(await readApiErrorMessage(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type StaffCourseUnit = { id: string; code: string; name: string; creditUnits: number };
export type StaffDepartment = { id: string; code: string; name: string };
export type StaffMember = { id:string; userId?:string|null; staffNumber:string; firstName:string; lastName:string; otherNames?:string|null; displayName?:string; nationalId?:string; phoneNumber?:string; email?:string; employmentType:string; staffType:string; isActive:boolean; departmentId?:string|null; jobTitle?:string|null; highestQualification?:string|null; speciality?:string|null; professionalRegistration?:string|null; dateJoined?:string|null; dateOfBirth?:string|null; gender?:string|null; address?:string|null; bankName?:string|null; bankAccountNumber?:string|null; bankAddress?:string|null; basicSalary?:number|null; attendanceMode?:string|null; photographDataUrl?:string|null; courseUnitIds?:string[] };
export type StaffProfileInput = Omit<StaffMember, 'id' | 'isActive'>;
export type StaffPermission = { id: string; code: string; name: string; groupKey: string; description?: string | null };
export type StaffRole = { id: string; name: string; description?: string | null; permissionCodes: string[] };
export type StaffAccount = { linked: boolean; username: string | null; permissions: string[]; isActive?: boolean };
export function getStaffAccount(id: string) {
  if (!id.trim()) throw new Error('Staff ID is required.');
  return request<StaffAccount>(`/api/staff/${encodeURIComponent(id)}/account`);
}
export function saveStaffAccount(id: string, input: { username: string; password?: string; permissions: string[] }) {
  if (!id.trim()) throw new Error('Staff ID is required.');
  return request<StaffAccount>(`/api/staff/${encodeURIComponent(id)}/account`, { method: 'PUT', body: JSON.stringify(input) });
}
export type StaffCreateInput = StaffProfileInput & { createLoginAccount?: boolean; username?: string; password?: string; roleNames?: string[]; permissionCodes?: string[]; deniedPermissionCodes?: string[] };
export type LeaveRequest = { id:string; staffMemberId:string; leaveType:string; startDate:string; endDate:string; reason:string; status:string; approvedBy?:string; approvedAt?:string };
export const STAFF_CHANGED_EVENT = 'smis:staff-changed'

export function notifyStaffChanged(staff?: StaffMember) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STAFF_CHANGED_EVENT, { detail: { staff, changedAt: Date.now() } }))
  }
}

export function listStaffPermissionCatalog(){ return request<StaffPermission[]>('/api/permissions/catalog'); }
export function listStaffRoles(){ return request<StaffRole[]>('/api/permissions/roles'); }
export function listStaff(activeOnly=true){ return request<StaffMember[]>(`/api/staff?activeOnly=${activeOnly}`); }
export function listStaffCourseUnits(){ return request<StaffCourseUnit[]>('/api/staff/course-units'); }
export function listStaffDepartments(){ return request<StaffDepartment[]>('/api/staff/departments'); }
export async function createStaff(input: StaffCreateInput) {
  const { createLoginAccount, username, password, roleNames, permissionCodes, deniedPermissionCodes, ...profile } = input
  const validated = parseApiInput(staffCreateRequestSchema, profile, 'create staff record')
  const payload = createLoginAccount
    ? { ...validated, createLoginAccount, username, password, roleNames, permissionCodes, deniedPermissionCodes }
    : validated
  const created = await request<StaffMember>('/api/staff',{method:'POST',body:JSON.stringify(payload)})
  notifyStaffChanged(created)
  return created
}
export function deactivateStaff(id:string){ return request<void>(`/api/staff/${id}/deactivate`,{method:'PATCH'}); }
export function activateStaff(id:string){ return request<void>(`/api/staff/${id}/activate`,{method:'PATCH'}); }
export function listLeave(staffId:string){ return request<LeaveRequest[]>(`/api/staff/${staffId}/leave`); }
export function requestLeave(staffId:string,input: Omit<LeaveRequest,'id'|'status'|'approvedBy'|'approvedAt'>){ const validated = parseApiInput(leaveRequestSchema, input, 'staff leave request'); return request<LeaveRequest>(`/api/staff/${encodeURIComponent(staffId)}/leave`,{method:'POST',body:JSON.stringify(validated)}); }
export function approveLeave(id:string,approvedBy:string|null,approved:boolean){ return request<void>(`/api/staff/leave/${id}/approve`,{method:'PATCH',body:JSON.stringify({approvedBy,approved})}); }
export type UpdateStaffRequest = StaffProfileInput & { id:string }
export function updateStaff(id:string, input: UpdateStaffRequest){ if (!id.trim()) throw new Error('Staff ID is required.'); const validated = parseApiInput(staffCreateRequestSchema.extend({ id: z.string().optional() }), input, 'update staff record'); return request<StaffMember>(`/api/staff/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(validated)}); }
export function updateStaffCourseUnits(id:string, courseUnitIds:string[]){ return request<StaffMember>(`/api/staff/${id}/course-units`,{method:'PATCH',body:JSON.stringify({ courseUnitIds })}); }
export function deleteStaff(id:string){ return request<void>(`/api/staff/${id}`,{method:'DELETE'}); }
