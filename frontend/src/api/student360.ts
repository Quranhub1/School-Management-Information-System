import { getAccessToken } from './auth'

export interface Student360ProfileDto {
  studentId: string
  studentNumber: string
  fullName: string
  status: string
  dateOfBirth?: string
  gender?: string
  email?: string
  phoneNumber?: string
  admissionId?: string
  admissionDate?: string
  admissionStatus: string
  programmeId?: string
  programmeName?: string
  department?: string
  faculty?: string
  currentSemester: string
  enrollmentStatus: string
  attendancePercentage: number
  totalSessions: number
  presentSessions: number
  absentSessions: number
  lateSessions: number
  averageScore?: number
  gpa?: number
  assessmentCount: number
  averageExamScore?: number
  examCount: number
  passRate: number
  outstandingBalance: number
  totalInvoiced: number
  totalPaid: number
  activePlacements: number
  completedPlacements: number
  placementCompletionRate?: number
  certificateCount: number
  latestCertificateDate?: string
  documentCount: number
  riskIndicators: string[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view this profile.')
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getStudent360Profile = (studentId: string) => request<Student360ProfileDto>(`/api/student360/${encodeURIComponent(studentId)}`)
