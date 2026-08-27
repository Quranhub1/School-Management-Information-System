import { getAccessToken } from './auth'

export interface DeputyPrincipalDashboard {
  totalStudents: number
  activeStudents: number
  totalStaff: number
  totalProgrammes: number
  totalCourses: number
  pendingAdmissions: number
  acceptedAdmissions: number
  rejectedAdmissions: number
  totalResults: number
  passedResults: number
  failedResults: number
  attendanceSessions: number
  attendanceRecords: number
  absentRecords: number
  timetableEntries: number
  timetableConflicts: number
  recentAdmissions: Array<{
    id: string
    applicantId: string
    programmeId: string
    academicYearId: string
    status: string
    createdAt: string
  }>
  recentResults: Array<{
    id: string
    studentName: string
    score: number
    grade: string
    passed: boolean
  }>
  staffPerformance: Array<{
    id: string
    staffNumber: string
    firstName: string
    lastName: string
    department?: string
    position?: string
    classCount: number
    resultCount: number
  }>
}

export interface AcademicPerformance {
  id: string
  name: string
  totalStudents: number
  totalResults: number
  passRate: number
  avgScore: number
}

export interface ExaminationSummary {
  id: string
  name: string
  examType: string
  status: string
  startDate: string
  endDate: string
  entryCount: number
  resultCount: number
}

export interface TimetableEntry {
  id: string
  day: string
  period: number
  room: string
  staffName: string
  courseName: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view this data.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getDeputyPrincipalDashboard = () => request<DeputyPrincipalDashboard>('/api/deputy-principal/dashboard')
export const getAcademicPerformance = () => request<AcademicPerformance[]>('/api/deputy-principal/academic-performance')
export const getExaminationSummary = () => request<ExaminationSummary[]>('/api/deputy-principal/examination-summary')
export const getTimetableOverview = () => request<TimetableEntry[]>('/api/deputy-principal/timetable-overview')
