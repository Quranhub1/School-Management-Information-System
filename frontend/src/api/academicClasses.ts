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

export interface AcademicClass {
  id: string
  programmeId: string
  academicPeriodId: string
  code: string
  name?: string | null
  yearOfStudy: number
  maxEnrolment?: number | null
  status: number
  createdAtUtc: string
}

export interface CreateAcademicClassRequest {
  programmeId: string
  academicPeriodId: string
  code: string
  name?: string
  yearOfStudy: number
  maxEnrolment?: number
}

export const getClassesByProgramme = (programmeId: string) => {
  if (!programmeId.trim()) throw new Error('Programme ID is required.')
  return request<AcademicClass[]>(`/api/academic-classes/by-programme/${encodeURIComponent(programmeId)}`)
}

export const getClassesByPeriod = (periodId: string) => {
  if (!periodId.trim()) throw new Error('Period ID is required.')
  return request<AcademicClass[]>(`/api/academic-classes/by-period/${encodeURIComponent(periodId)}`)
}

export const createAcademicClass = (input: CreateAcademicClassRequest) => {
  if (!input.code.trim()) throw new Error('Class code is required.')
  if (!input.programmeId.trim() || !input.academicPeriodId.trim()) throw new Error('Programme and period IDs are required.')
  return request<AcademicClass>('/api/academic-classes', { method: 'POST', body: JSON.stringify(input) })
}
