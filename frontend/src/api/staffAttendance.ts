import { readApiErrorMessage } from './errors'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
function token() { return sessionStorage.getItem('smis.accessToken') }
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {})
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
