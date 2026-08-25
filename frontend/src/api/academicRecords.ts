import type { AcademicResultSummary, TranscriptEntry } from '../types/academic'
import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function getJson<T>(path: string): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function getStudentTranscript(studentId: string, academicYearId?: string, semesterId?: string): Promise<TranscriptEntry[]> {
  if (!studentId.trim()) throw new Error('Student ID is required.')
  const params = new URLSearchParams()
  if (academicYearId) params.set('academicYearId', academicYearId)
  if (semesterId) params.set('semesterId', semesterId)
  const query = params.toString()
  return getJson<TranscriptEntry[]>(`/api/academic-records/students/${encodeURIComponent(studentId)}/transcript${query ? `?${query}` : ''}`)
}

export function getStudentAcademicSummaries(studentId: string): Promise<AcademicResultSummary[]> {
  if (!studentId.trim()) throw new Error('Student ID is required.')
  return getJson<AcademicResultSummary[]>(`/api/academic-records/students/${encodeURIComponent(studentId)}/summaries`)
}
