import { getAccessToken } from './auth'

export interface ChronicAbsentee {
  studentId: string
  studentNumber: string | null
  studentName: string | null
  phoneNumber: string | null
  absenceCount: number
  totalSessions: number
  absenceRate: number
  isChronic: boolean
}

export interface AbsenteeAlert {
  studentId: string
  studentNumber: string | null
  studentName: string | null
  phoneNumber: string | null
  absenceCount: number
  absenceRate: number
  severity: string
  suggestedAction: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view attendance reports.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getChronicAbsenteeReport = (thresholdDays?: number, periodDays?: number) => {
  const params = new URLSearchParams()
  if (thresholdDays) params.set('thresholdDays', thresholdDays.toString())
  if (periodDays) params.set('periodDays', periodDays.toString())
  const qs = params.toString()
  return request<ChronicAbsentee[]>(`/api/attendance/chronic/report${qs ? `?${qs}` : ''}`)
}
export const getAbsenteeAlerts = (periodDays?: number) => {
  const params = new URLSearchParams()
  if (periodDays) params.set('periodDays', periodDays.toString())
  const qs = params.toString()
  return request<AbsenteeAlert[]>(`/api/attendance/chronic/alerts${qs ? `?${qs}` : ''}`)
}
