import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

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

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  isActive: boolean
}

export interface AcademicPeriod {
  id: string
  academicYearId: string
  name: string
  sequence: number
  startDate: string
  endDate: string
  isCurrent: boolean
  isActive: boolean
}

export interface AcademicYearInput { name: string; startDate: string; endDate: string }
export interface AcademicPeriodInput { academicYearId: string; name: string; sequence: number; startDate: string; endDate: string }
export interface AcademicPeriodUpdate { name: string; sequence: number; startDate: string; endDate: string }

export const getAcademicYears = () => request<AcademicYear[]>('/api/academic-calendar/years')
export const getAcademicPeriods = (yearId: string) => {
  if (!yearId.trim()) throw new Error('Academic year ID is required.')
  return request<AcademicPeriod[]>(`/api/academic-calendar/years/${encodeURIComponent(yearId)}/periods`)
}
export const createAcademicYear = (input: AcademicYearInput) => request<AcademicYear>('/api/academic-calendar/years', { method: 'POST', body: JSON.stringify(input) })
export const updateAcademicYear = (id: string, input: AcademicYearInput) => request<void>(`/api/academic-calendar/years/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
export const setAcademicYearActive = (id: string, isActive: boolean) => request<void>(`/api/academic-calendar/years/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
export const setCurrentAcademicYear = (id: string) => request<void>(`/api/academic-calendar/years/${encodeURIComponent(id)}/current`, { method: 'PATCH' })
export const createAcademicPeriod = (input: AcademicPeriodInput) => request<AcademicPeriod>('/api/academic-calendar/periods', { method: 'POST', body: JSON.stringify(input) })
export const updateAcademicPeriod = (yearId: string, periodId: string, input: AcademicPeriodUpdate) => request<void>(`/api/academic-calendar/years/${encodeURIComponent(yearId)}/periods/${encodeURIComponent(periodId)}`, { method: 'PUT', body: JSON.stringify(input) })
export const setAcademicPeriodActive = (yearId: string, periodId: string, isActive: boolean) => request<void>(`/api/academic-calendar/years/${encodeURIComponent(yearId)}/periods/${encodeURIComponent(periodId)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
export const setCurrentAcademicPeriod = (yearId: string, periodId: string) => request<void>(`/api/academic-calendar/years/${encodeURIComponent(yearId)}/periods/${encodeURIComponent(periodId)}/current`, { method: 'PATCH' })
