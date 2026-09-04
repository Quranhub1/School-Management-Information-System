import { apiFetch } from './auth'

export type ModernDashboard = {
  totalStudents: number; activeStudents: number; pendingAdmissions: number
  totalBilled: number; totalPaid: number; outstanding: number
  attendanceRate: number; averageAssessment: number; placementCompletionRate: number
  generatedAt: string
}
export type StudentRisk = { studentId: string; studentNumber: string; name: string; riskScore: number; riskLevel: string; attendanceRate: number; averageScore: number; outstandingBalance: number }
export type Student360 = { id: string; studentNumber: string; name: string; dateOfBirth?: string; gender?: string; phone?: string; email?: string; status: string; attendanceRate: number; averageAssessment: number; totalBilled: number; totalPaid: number; outstanding: number; placementCount: number; completedPlacements: number; certificateCount: number; admissionDocumentCount: number }
export type WorkflowSummary = { pendingAdmissions: number; financialFollowUps: number; pendingPlacements: number; generatedAt: string }

export const getModernDashboard = () => apiFetch<ModernDashboard>('/modern/dashboard')
export const getStudentRisk = () => apiFetch<StudentRisk[]>('/modern/risk')
export const getStudent360 = (id: string) => apiFetch<Student360>(`/modern/students/${id}/360`)
export const getModernSearch = (q: string) => apiFetch<{ type: string; id: string; key: string; title: string; module: string }[]>(`/modern/search?q=${encodeURIComponent(q)}`)
export const getWorkflowSummary = () => apiFetch<WorkflowSummary>('/modern/workflows')

export async function uploadAdmissionDocument(admissionId: string, file: File) {
  const form = new FormData(); form.append('file', file)
  const token = localStorage.getItem('smis_token')
  const response = await fetch('/api/modern/admissions/' + admissionId + '/documents', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  if (!response.ok) throw new Error(await response.text() || 'Upload failed')
  return response.json()
}
