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

export interface Subject {
  id: string
  programmeId: string
  courseId: string
  yearOfStudy: number
  periodSequence?: number | null
  isCompulsory: boolean
  electiveGroup?: string | null
  isActive: boolean
}

export interface CreateSubjectRequest {
  programmeId: string
  courseId: string
  yearOfStudy: number
  periodSequence?: number
  isCompulsory: boolean
  electiveGroup?: string
}

export const getSubjectsByProgramme = (programmeId: string) => {
  if (!programmeId.trim()) throw new Error('Programme ID is required.')
  return request<Subject[]>(`/api/subjects/by-programme/${encodeURIComponent(programmeId)}`)
}

export const getSubjectsByProgrammeAndYear = (programmeId: string, yearOfStudy: number) => {
  if (!programmeId.trim()) throw new Error('Programme ID is required.')
  if (yearOfStudy < 1) throw new Error('Year of study must be at least 1.')
  return request<Subject[]>(`/api/subjects/by-programme/${encodeURIComponent(programmeId)}/year/${yearOfStudy}`)
}

export const createSubject = (input: CreateSubjectRequest) => {
  if (!input.programmeId.trim() || !input.courseId.trim()) throw new Error('Programme and course IDs are required.')
  if (input.yearOfStudy < 1) throw new Error('Year of study must be at least 1.')
  return request<Subject>('/api/subjects', { method: 'POST', body: JSON.stringify(input) })
}
