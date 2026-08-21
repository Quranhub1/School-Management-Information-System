import type { AcademicResultSummary, TranscriptEntry } from '../types/academic'
import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function getJson<T>(path: string): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to access examination results.')
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export function getExaminationTranscript(studentId: string): Promise<TranscriptEntry[]> {
  return getJson<TranscriptEntry[]>(`/api/examinations/results/students/${studentId}/transcript`)
}

export function getExaminationSummaries(studentId: string): Promise<AcademicResultSummary[]> {
  return getJson<AcademicResultSummary[]>(`/api/examinations/results/students/${studentId}/summaries`)
}
