import { getAccessToken } from './auth'
import { createCorrelationId } from '../lib/logging'
import { useQuery } from '@tanstack/react-query'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getAccessToken()
  const correlationId = createCorrelationId()
  const response = await fetch('/api' + path, {
    ...init,
    headers: { Accept: 'application/json', 'X-Correlation-ID': correlationId, ...(init?.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!response.ok) throw new ApiError(await response.text() || `Request failed (${response.status})`, response.status)
  return response.json() as Promise<T>
}

export type ModernDashboard = { totalStudents: number; activeStudents: number; pendingAdmissions: number; totalBilled: number; totalPaid: number; outstanding: number; attendanceRate: number; averageAssessment: number; placementCompletionRate: number; generatedAt: string }
export type StudentRisk = { studentId: string; studentNumber: string; name: string; riskScore: number; riskLevel: string; attendanceRate: number; averageScore: number; outstandingBalance: number }
export type Student360 = { id: string; studentNumber: string; name: string; dateOfBirth?: string; gender?: string; phone?: string; email?: string; status: string; attendanceRate: number; averageAssessment: number; totalBilled: number; totalPaid: number; outstanding: number; placementCount: number; completedPlacements: number; certificateCount: number; admissionDocumentCount: number }
export type WorkflowSummary = { pendingAdmissions: number; financialFollowUps: number; pendingPlacements: number; generatedAt: string }

export const getModernDashboard = () => api<ModernDashboard>('/modern/dashboard')
export const getStudentRisk = () => api<StudentRisk[]>('/modern/risk')
export const getStudent360 = (id: string) => api<Student360>(`/modern/students/${id}/360`)
export const getModernSearch = (q: string) => api<{ type: string; id: string; key: string; title: string; module: string }[]>(`/modern/search?q=${encodeURIComponent(q)}`)
export const getWorkflowSummary = () => api<WorkflowSummary>('/modern/workflows')

export async function uploadAdmissionDocument(admissionId: string, file: File) {
  const form = new FormData(); form.append('file', file)
  const token = getAccessToken()
  const response = await fetch('/api/modern/admissions/' + admissionId + '/documents', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  if (!response.ok) throw new Error(await response.text() || 'Upload failed')
  return response.json()
}


export const modernQueryKeys = {
  all: ['modern'] as const,
  dashboard: ['modern', 'dashboard'] as const,
  risk: ['modern', 'risk'] as const,
  student360: (id: string) => ['modern', 'student360', id] as const,
  workflows: ['modern', 'workflows'] as const,
}

/** Institution-level aggregates are persisted per authenticated user for offline dashboard access. */
export function useModernDashboardQuery() {
  return useQuery({
    queryKey: modernQueryKeys.dashboard,
    queryFn: getModernDashboard,
    staleTime: 60_000,
    meta: { persist: true },
  })
}

/** Student risk rows include identifiable learner information and are deliberately memory-only. */
export function useStudentRiskQuery() {
  return useQuery({
    queryKey: modernQueryKeys.risk,
    queryFn: getStudentRisk,
    staleTime: 30_000,
    meta: { persist: false },
  })
}

/** Student 360 profiles contain personal and financial details and are never written to the persisted query cache. */
export function useStudent360Query(id: string | null) {
  return useQuery({
    queryKey: modernQueryKeys.student360(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('Student ID is required')
      return getStudent360(id)
    },
    enabled: Boolean(id),
    staleTime: 30_000,
    meta: { persist: false },
  })
}

export function useWorkflowSummaryQuery() {
  return useQuery({
    queryKey: modernQueryKeys.workflows,
    queryFn: getWorkflowSummary,
    staleTime: 60_000,
    meta: { persist: true },
  })
}
