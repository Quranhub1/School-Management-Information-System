import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export interface AcademicAuthority {
  id: string
  code: string
  name: string
  description?: string | null
  sourceReference?: string | null
  isActive: boolean
  sortOrder: number
}

export interface SaveAcademicAuthorityRequest {
  code: string
  name: string
  description?: string
  sourceReference?: string
  sortOrder: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export const getAcademicAuthorities = (includeInactive = false) =>
  request<AcademicAuthority[]>(`/api/academic-authorities?includeInactive=${includeInactive}`)
export const createAcademicAuthority = (input: SaveAcademicAuthorityRequest) =>
  request<AcademicAuthority>('/api/academic-authorities', { method: 'POST', body: JSON.stringify(input) })
export const updateAcademicAuthority = (code: string, input: SaveAcademicAuthorityRequest) =>
  request<void>(`/api/academic-authorities/${encodeURIComponent(code)}`, { method: 'PUT', body: JSON.stringify(input) })
export const setAcademicAuthorityActive = (code: string, active: boolean) =>
  request<void>(`/api/academic-authorities/${encodeURIComponent(code)}/active`, { method: 'PATCH', body: JSON.stringify({ active }) })
