import { getAccessToken } from './auth'

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getAccessToken()
  const response = await fetch('/api' + path, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!response.ok) throw new Error(await response.text() || `Request failed (${response.status})`)
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
