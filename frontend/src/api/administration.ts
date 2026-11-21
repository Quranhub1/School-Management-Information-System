import { getAccessToken } from './auth'
import { parseApiInput } from '../lib/validation'
import { createUserRequestSchema, permissionCodesRequestSchema, resetUserPasswordRequestSchema, setUserActiveRequestSchema, updateUserRequestSchema } from '../schemas'

export interface UserSummary { id: string; username: string; firstName: string; lastName: string; email?: string | null; isActive: boolean; createdAt: string; lastLoginAt?: string | null; roles: string[] }
export interface CreateUserRequest { username: string; password: string; firstName: string; lastName: string; email?: string; roles: string[] }
export interface UpdateUserRequest { firstName: string; lastName: string; email?: string | null; roles: string[] }
export interface ResetPasswordRequest { newPassword: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Only System Administrators can manage users.')
  if (!response.ok) { const payload = await response.json().catch(() => null) as { message?: string } | null; throw new Error(payload?.message ?? `Request failed with status ${response.status}`) }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const getUsers = () => request<UserSummary[]>('/api/administration/users')
export const createUser = (body: CreateUserRequest) => { const validated = parseApiInput(createUserRequestSchema, body, 'create user'); return request<UserSummary>('/api/administration/users', { method: 'POST', body: JSON.stringify(validated) }) }
export const setUserActive = (id: string, active: boolean) => { const validated = parseApiInput(setUserActiveRequestSchema, { active }, 'update user status'); if (!id.trim()) throw new Error('User ID is required.'); return request<UserSummary>(`/api/administration/users/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify(validated) }) }

export const updateUser = (id: string, body: UpdateUserRequest) => { const validated = parseApiInput(updateUserRequestSchema, body, 'update user'); if (!id.trim()) throw new Error('User ID is required.'); return request<UserSummary>(`/api/administration/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(validated) }) }
export const resetUserPassword = (id: string, newPassword: string) => { const validated = parseApiInput(resetUserPasswordRequestSchema, { newPassword }, 'reset user password'); if (!id.trim()) throw new Error('User ID is required.'); return request<void>(`/api/administration/users/${encodeURIComponent(id)}/password`, { method: 'PATCH', body: JSON.stringify(validated) }) }

export interface PermissionItem { id: string; label: string; description?: string | null }
export interface PermissionGroup { id: string; label: string; permissions: PermissionItem[] }
export interface PermissionRole { id: string; name: string; description?: string | null; isSystemRole: boolean }
export interface UserPermissionSummary { userId: string; directPermissionCodes: string[]; inheritedPermissionCodes: string[]; effectivePermissionCodes: string[] }
export const getPermissionCatalogue = () => request<PermissionGroup[]>('/api/permissions/catalogue')
export const getPermissionRoles = () => request<PermissionRole[]>('/api/permissions/roles')
export const getRolePermissionCodes = (roleId: string) => request<{ roleId: string; permissionCodes: string[] }>(`/api/permissions/roles/${roleId}`)
export const setRolePermissionCodes = (roleId: string, permissionCodes: string[]) => { const validated = parseApiInput(permissionCodesRequestSchema, { permissionCodes }, 'update role permissions'); if (!roleId.trim()) throw new Error('Role ID is required.'); return request<{ roleId: string; assignedCount: number }>(`/api/permissions/roles/${encodeURIComponent(roleId)}`, { method: 'PUT', body: JSON.stringify(validated) }) }
export const getUserPermissionSummary = (userId: string) => request<UserPermissionSummary>(`/api/permissions/users/${userId}`)
export const setUserPermissionCodes = (userId: string, permissionCodes: string[]) => { const validated = parseApiInput(permissionCodesRequestSchema, { permissionCodes }, 'update user permissions'); if (!userId.trim()) throw new Error('User ID is required.'); return request<{ userId: string; directPermissionCount: number }>(`/api/permissions/users/${encodeURIComponent(userId)}`, { method: 'PUT', body: JSON.stringify(validated) }) }
