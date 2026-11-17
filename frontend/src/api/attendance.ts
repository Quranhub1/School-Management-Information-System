import { readApiErrorMessage } from './errors'
import { z } from 'zod'
import {
  attendanceMarkRequestSchema,
  attendanceBulkMarkRequestSchema,
  attendanceEligibleStudentSchema,
  attendanceSessionSummarySchema,
  staffCheckEventSchema,
} from '../schemas'

const API_BASE_URL =
  (typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
    : '')

function token() { return sessionStorage.getItem('smis.accessToken') }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) throw new Error(await readApiErrorMessage(response))
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

/** ---------- Types ---------- */

export type AttendanceSession = {
  id: string
  timetableEntryId: string
  sessionDate: string
  status: 'Open' | 'Closed' | 'Cancelled'
  recordedByUserId?: string | null
  remarks?: string | null
}

export type AttendanceRecord = {
  id: string
  attendanceSessionId: string
  studentId: string
  status: 'Present' | 'Absent' | 'Late' | 'Excused'
  remarks?: string | null
}

export type EligibleStudent = {
  studentId: string
  studentNumber: string
  firstName: string
  lastName: string
  otherNames?: string | null
  displayName: string
  campusId?: string | null
  alreadyMarked: boolean
}

export type SessionSummary = {
  sessionId: string
  timetableEntryId: string
  sessionDate: string
  status: string
  totalEnrolled: number
  markedPresent: number
  markedAbsent: number
  markedLate: number
  markedExcused: number
  unmarked: number
  attendancePercentage: number
}


export type StaffCheckEvent = {
  id: string
  staffMemberId: string
  staffName: string
  staffNumber: string
  eventType: 'IN' | 'OUT'
  recordedAtUtc: string
  confirmation: string
}

/** ---------- Session management ---------- */

export async function openAttendanceSession(input: {
  timetableEntryId: string
  sessionDate: string
  recordedByUserId?: string | null
  remarks?: string | null
}) {
  return request<AttendanceSession>('/api/attendance/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function closeAttendanceSession(sessionId: string) {
  return request<AttendanceSession>(
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/close`,
    { method: 'POST' },
  )
}

/** ---------- Student marking ---------- */

export async function markAttendance(
  sessionId: string,
  studentId: string,
  status: 'Present' | 'Absent' | 'Late' | 'Excused',
  remarks?: string | null,
) {
  return request<AttendanceRecord>(
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/records`,
    {
      method: 'POST',
      body: JSON.stringify({ studentId, status, remarks: remarks?.trim() || null }),
    },
  )
}

export async function bulkMarkAttendance(
  sessionId: string,
  marks: Array<{
    studentId: string
    status: 'Present' | 'Absent' | 'Late' | 'Excused'
    remarks?: string | null
  }>,
) {
  return request<{
    markedCount: number
    records: Array<{ id: string; studentId: string; status: string; remarks?: string | null }>
  }>(
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/bulk-mark`,
    {
      method: 'POST',
      body: JSON.stringify({ marks }),
    },
  )
}

/** ---------- Eligible students & summary ---------- */

export async function getEligibleStudents(sessionId: string) {
  return request<EligibleStudent[]>(
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/eligible-students`,
  )
}

export async function getSessionSummary(sessionId: string) {
  return request<SessionSummary>(
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/summary`,
  )
}

/** ---------- Student history ---------- */

export async function getStudentAttendanceHistory(
  studentId: string,
  from?: string,
  to?: string,
) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  return request<AttendanceRecord[]>(
    `/api/attendance/students/${encodeURIComponent(studentId)}?${params.toString()}`,
  )
}

/** ---------- Staff check-in/check-out ---------- */

export async function checkInStaff(staffMemberId: string) {
  return request<StaffCheckEvent>(
    `/api/staff-attendance/${encodeURIComponent(staffMemberId)}/checkin`,
    { method: 'POST' },
  )
}

export async function checkOutStaff(staffMemberId: string) {
  return request<StaffCheckEvent>(
    `/api/staff-attendance/${encodeURIComponent(staffMemberId)}/checkout`,
    { method: 'POST' },
  )
}

/** ---------- Staff daily attendance (existing) ---------- */

export type StaffDailyAttendanceRow = {
  staffMemberId: string
  staffNumber: string
  name: string
  departmentId: string | null
  date: string
  checkIn: string | null
  checkOut: string | null
  hoursWorked: number | null
  status: 'Absent' | 'Checked in' | 'Complete' | string
  eventCount: number
}

export function listStaffDailyAttendance(filters: {
  from: string
  to: string
  search?: string
  departmentId?: string
}) {
  const params = new URLSearchParams({ from: filters.from, to: filters.to })
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  if (filters.departmentId) params.set('departmentId', filters.departmentId)
  return request<StaffDailyAttendanceRow[]>(`/api/staff-attendance/daily?${params.toString()}`)
}
