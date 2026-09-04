import { getAccessToken } from './auth'

export interface CourseAnalytics {
  courseId: string
  courseCode: string
  courseTitle: string
  averageScore?: number
  medianScore?: number
  passRate: number
  failRate: number
  gradeDistribution: Record<string, number>
}

export interface StudentRiskAnalytics {
  studentId: string
  studentName: string
  averageScore?: number
  attendancePercentage: number
  riskLevel: string
  riskFactors: string[]
}

export interface TeacherWorkload {
  teacherId: string
  teacherName: string
  department: string
  teachingHours: number
  sessionsPerWeek: number
  coursesAssigned: number
  cohortsAssigned: number
  practicalSessions: number
  assessmentCount: number
  attendanceResponsibilities: number
  examResponsibilities: number
  workloadScore: number
  warningLevel: string
}

export interface DepartmentWorkloadSummary {
  departmentId: string
  departmentName: string
  totalTeachers: number
  averageWorkload: number
  highestWorkload: number
  lowestWorkload: number
}

export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  pendingAdmissions: number
  attendanceRate: number
  outstandingFees: number
  examPerformance?: number
  placementCompletion: number
  certificatesIssued: number
  workflowItemsAwaitingAction: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view analytics.')
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getCourseAnalytics = (semesterId: string) => request<CourseAnalytics[]>(`/api/analytics/examination/courses?semesterId=${encodeURIComponent(semesterId)}`)
export const getAtRiskStudents = (semesterId: string) => request<StudentRiskAnalytics[]>(`/api/analytics/examination/at-risk?semesterId=${encodeURIComponent(semesterId)}`)
export const getTeacherWorkload = (semesterId: string) => request<TeacherWorkload[]>(`/api/analytics/teacher-workload?semesterId=${encodeURIComponent(semesterId)}`)
export const getDepartmentWorkload = (semesterId: string) => request<DepartmentWorkloadSummary[]>(`/api/analytics/teacher-workload/departments?semesterId=${encodeURIComponent(semesterId)}`)
export const getDashboardStats = () => request<DashboardStats>('/api/analytics/dashboard')
export const answerQuestion = (question: string) => request<{ question: string; answer: string }>('/api/analytics/assistant', { method: 'POST', body: JSON.stringify({ question }) }).then(r => r.answer)
