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

export interface AcademicYear { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; isActive: boolean }
export interface AcademicPeriod { id: string; academicYearId: string; name: string; sequence: number; startDate: string; endDate: string; isCurrent: boolean }

export const getAcademicYears = () => request<AcademicYear[]>('/api/academic-structure/years')
export const getPeriodsForYear = (yearId: string) => {
  if (!yearId.trim()) throw new Error('Academic year ID is required.')
  return request<AcademicPeriod[]>(`/api/academic-structure/years/${encodeURIComponent(yearId)}/periods`)
}
