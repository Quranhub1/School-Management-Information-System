import { getAccessToken } from './auth'
import type { TranscriptEntry, AcademicResultSummary } from '../types/academic'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export interface StudentPortalProfile {
  studentId: string
  studentNumber: string
  fullName: string
  status: string
}

export interface StudentSemesterResult {
  academicYearId: string
  semesterId: string
  totalCreditUnits: number
  totalGradePoints: number
  gpa: number
  cgpa: number | null
  standing: string
  isApproved: boolean
  approvedAt: string | null
  courses: TranscriptEntry[]
}

export function getStudentPortalProfile(): Promise<StudentPortalProfile> {
  return request<StudentPortalProfile>('/api/student-portal/me')
}

export function getStudentTranscript(academicYearId?: string, semesterId?: string): Promise<TranscriptEntry[]> {
  const qs = new URLSearchParams()
  if (academicYearId) qs.set('academicYearId', academicYearId)
  if (semesterId) qs.set('semesterId', semesterId)
  return request<TranscriptEntry[]>(`/api/student-portal/me/transcript${qs.toString() ? `?${qs.toString()}` : ''}`)
}

export function getStudentSummaries(): Promise<AcademicResultSummary[]> {
  return request<AcademicResultSummary[]>('/api/student-portal/me/summaries')
}
