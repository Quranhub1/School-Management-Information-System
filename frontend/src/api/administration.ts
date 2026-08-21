import { getAccessToken } from './auth'

export interface UserSummary { id: string; username: string; firstName: string; lastName: string; email?: string | null; isActive: boolean; createdAt: string; lastLoginAt?: string | null; roles: string[] }
export interface CreateUserRequest { username: string; password: string; firstName: string; lastName: string; email?: string; roles: string[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Only System Administrators can manage users.')
  if (!response.ok) { const payload = await response.json().catch(() => null) as { message?: string } | null; throw new Error(payload?.message ?? `Request failed with status ${response.status}`) }
  return response.json() as Promise<T>
}

export const getUsers = () => request<UserSummary[]>('/api/administration/users')
export const createUser = (body: CreateUserRequest) => request<UserSummary>('/api/administration/users', { method: 'POST', body: JSON.stringify(body) })
export const setUserActive = (id: string, active: boolean) => request<UserSummary>(`/api/administration/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) })
