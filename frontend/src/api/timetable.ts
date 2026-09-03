import { getAccessToken } from './auth'

export type TimetableEntry = {
  id: string
  teachingGroupId: string
  staffMemberId?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string
  sessionType?: string
  isActive: boolean
}

export type CreateTimetableEntry = Omit<TimetableEntry, 'id' | 'isActive'>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage timetables.')
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>
}

export const listTimetable = (teachingGroupId?: string) => request<TimetableEntry[]>(`/api/timetable${teachingGroupId ? `?teachingGroupId=${encodeURIComponent(teachingGroupId)}` : ''}`)
export const createTimetableEntry = (input: CreateTimetableEntry) => request<TimetableEntry>('/api/timetable', { method: 'POST', body: JSON.stringify(input) })
export const deactivateTimetableEntry = (id: string) => request<void>(`/api/timetable/${id}`, { method: 'DELETE' })
