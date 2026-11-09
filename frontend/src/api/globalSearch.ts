import { useQuery } from '@tanstack/react-query'
import { getAccessToken } from './auth'
import { createCorrelationId } from '../lib/logging'
import { readApiErrorMessage } from './errors'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class GlobalSearchApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'GlobalSearchApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'X-Correlation-ID': createCorrelationId(),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    // Reuse the shared API error handler so server diagnostics and stack traces
    // are never exposed in the global search palette.
    const message = await readApiErrorMessage(response)
    throw new GlobalSearchApiError(message, response.status)
  }
  return response.json() as Promise<T>
}

export interface StudentSearchResult { id: string; studentNumber: string; fullName: string; status: string; programmeName?: string | null; yearOfStudy?: number | null; academicYear?: string | null }
export interface StaffSearchResult { id: string; staffNumber: string; fullName: string; employmentType: string }
export interface CourseSearchResult { id: string; code: string; name: string; creditUnits: number }
export interface ProgrammeSearchResult { id: string; code: string; name: string; award: string }
export interface AcademicYearSearchResult { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }
export interface SemesterSearchResult { id: string; name: string; sequence: number; startDate: string; endDate: string; academicYearId: string }
export interface TeachingGroupSearchResult { id: string; groupCode: string; name?: string; courseOfferingId: string }
export interface ApplicantSearchResult { id: string; applicationNumber: string; fullName: string; status: string }
export interface AlumniSearchResult { id: string; studentId: string; fullName: string; graduationDate: string }

export interface GlobalSearchResponse {
  query: string
  students: StudentSearchResult[]
  staff: StaffSearchResult[]
  courses: CourseSearchResult[]
  programmes: ProgrammeSearchResult[]
  academicYears: AcademicYearSearchResult[]
  semesters: SemesterSearchResult[]
  teachingGroups: TeachingGroupSearchResult[]
  applicants: ApplicantSearchResult[]
  alumni: AlumniSearchResult[]
}

/** Normalize terms consistently before caching and sending them to the API. */
export function normalizeSearchTerm(query: string): string {
  return query.normalize('NFKC').trim().toLowerCase()
}

export const globalSearchQueryKeys = {
  all: ['global-search'] as const,
  results: (query: string, from?: string, to?: string) =>
    ['global-search', normalizeSearchTerm(query), from ?? '', to ?? ''] as const,
}

export function globalSearch(q: string, from?: string, to?: string, signal?: AbortSignal, scope?: string): Promise<GlobalSearchResponse> {
  const qs = new URLSearchParams()
  qs.set('q', normalizeSearchTerm(q))
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  if (scope && scope !== 'dashboard') qs.set('scope', scope)
  return request<GlobalSearchResponse>('/api/search?' + qs.toString(), { signal })
}

/** Search results include personal records; keep them in memory only, never in IndexedDB. */
export function useGlobalSearchQuery(q: string, from?: string, to?: string) {
  const term = normalizeSearchTerm(q)
  return useQuery({
    queryKey: globalSearchQueryKeys.results(term, from, to),
    queryFn: () => globalSearch(term, from, to),
    enabled: term.length >= 2,
    staleTime: 15_000,
    gcTime: 2 * 60_000,
    meta: { persist: false },
  })
}
