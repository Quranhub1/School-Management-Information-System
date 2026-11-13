import { getAccessToken } from './auth'

export interface Programme {
  id: string
  departmentId?: string | null
  code: string
  name: string
  award: string
  awardTitle?: string | null
  durationYears: number
  durationUnit: string
  studyMode: string
  deliveryType: string
  type: number
  regulator?: string | null
  approvalReference?: string | null
  approvalDate?: string | null
  approvalStatus: string
  sourceReference?: string | null
  isReferenceOnly: boolean
  isActive: boolean
}

export interface CreateProgrammeRequest {
  departmentId?: string | null
  code: string
  name: string
  award: string
  awardTitle?: string
  durationYears: number
  durationUnit?: string
  studyMode?: string
  deliveryType?: string
  type?: number
  regulator?: string
  approvalReference?: string
  approvalDate?: string
  approvalStatus?: string
  sourceReference?: string
  isReferenceOnly?: boolean
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function getProgrammes(): Promise<Programme[]> {
  return request<Programme[]>('/api/programmes')
}

export function createProgramme(input: CreateProgrammeRequest): Promise<Programme> {
  return request<Programme>('/api/programmes', { method: 'POST', body: JSON.stringify(input) })
}

export function updateProgramme(id: string, input: CreateProgrammeRequest): Promise<Programme> {
  return request<Programme>(`/api/programmes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteProgramme(id: string): Promise<void> {
  return request<void>(`/api/programmes/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function setProgrammeActive(id: string, active: boolean): Promise<void> {
  return request<void>(`/api/programmes/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify({ active }) })
}
