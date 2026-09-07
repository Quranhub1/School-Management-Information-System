import { getAccessToken } from './auth'

export interface ResidentDirectorDashboard {
  totalStudents: number
  activeStudents: number
  totalStaff: number
  totalProgrammes: number
  totalInvoices: number
  outstandingInvoices: number
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
}

export interface StudentOverview {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  otherNames?: string
  gender?: string
  status: string
  admissionId?: string
  createdAt: string
}

export interface StaffOverview {
  id: string
  staffNumber: string
  firstName: string
  lastName: string
  otherNames?: string
  email?: string
  phoneNumber?: string
  department?: string
  position?: string
  employmentType?: string
  status: string
  createdAt: string
}

export interface HostelStatus {
  totalHouses: number
  totalRooms: number
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  occupancyRate: number
}

export interface AttendanceSummary {
  sessions: number
  studentRecords: number
  attendanceRecords: number
  absentToday: number
}

export interface WelfareAlert {
  studentId?: string
  studentNumber?: string
  studentName?: string
  date?: string
  balance?: number
  currency?: string
  programmeName?: string
  alertType: string
}

export interface WelfareAlerts {
  studentsWithLargeBalances: WelfareAlert[]
  absentStudents: WelfareAlert[]
  totalAlerts: number
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

export const getResidentDirectorDashboard = () => request<ResidentDirectorDashboard>('/api/resident-director/dashboard')
export const getResidentDirectorStudents = () => request<StudentOverview[]>('/api/resident-director/students')
export const getResidentDirectorStaff = () => request<StaffOverview[]>('/api/resident-director/staff')
export const getResidentDirectorHostelStatus = () => request<HostelStatus>('/api/resident-director/hostel-status')
export const getResidentDirectorAttendanceSummary = () => request<AttendanceSummary>('/api/resident-director/attendance-summary')
export const getResidentDirectorWelfareAlerts = () => request<WelfareAlerts>('/api/resident-director/welfare-alerts')
