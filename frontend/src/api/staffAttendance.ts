import { readApiErrorMessage } from './errors'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
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
      ...(init.headers ?? {})
    }
  })
  if (!response.ok) throw new Error(await readApiErrorMessage(response))
  return response.json() as Promise<T>
}

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

export function recordManualStaffAttendance(staffMemberId: string, eventType: 'IN' | 'OUT') {
  return request<{ id: string; staffMemberId: string; eventType: string; recordedAtUtc: string }>(
    `/api/staff-attendance/${encodeURIComponent(staffMemberId)}/manual-event`,
    { method: 'POST', body: JSON.stringify({ eventType }) }
  )
}
