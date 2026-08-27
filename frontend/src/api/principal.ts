import { getAccessToken } from './auth'

export interface PrincipalDashboard {
  totalStudents: number
  activeStudents: number
  totalStaff: number
  totalProgrammes: number
  totalCourses: number
  totalInvoices: number
  outstandingInvoices: number
  totalInvoiced: number
  totalPaid: number
  pendingAdmissions: number
  acceptedAdmissions: number
  rejectedAdmissions: number
  totalResults: number
  passedResults: number
  failedResults: number
  attendanceSessions: number
  studentAttendanceRecords: number
  attendanceRecords: number
  absentRecords: number
  pendingPayroll: number
  paidPayroll: number
  recentAdmissions: Array<{
    id: string
    applicantId: string
    programmeId: string
    academicYearId: string
    status: string
    createdAt: string
  }>
  outstandingBalances: Array<{
    studentId: string
    studentNumber: string
    studentName: string
    balance: number
    currency: string
    programmeName: string
  }>
  recentPayments: Array<{
    id: string
    receiptNumber: string
    amount: number
    paymentMethod: string
    paidAt: string
    studentName: string
    invoiceNumber: string
  }>
  recentResults: Array<{
    id: string
    studentName: string
    score: number
    grade: string
    passed: boolean
  }>
}

export interface StaffPerformance {
  id: string
  staffNumber: string
  firstName: string
  lastName: string
  department?: string
  position?: string
  status: string
  classCount: number
  studentCount: number
  resultCount: number
}

export interface DepartmentalSummary {
  id: string
  name: string
  programmeCount: number
  staffCount: number
  studentCount: number
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

export const getPrincipalDashboard = () => request<PrincipalDashboard>('/api/principal/dashboard')
export const getStaffPerformance = () => request<StaffPerformance[]>('/api/principal/staff-performance')
export const getDepartmentalSummary = () => request<DepartmentalSummary[]>('/api/principal/departmental-summary')
