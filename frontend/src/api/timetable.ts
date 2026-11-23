import { getAccessToken } from './auth'

export type TimetableEntry = {
  id: string
  teachingGroupId: string
  courseId: string
  teacherId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string
  sessionType?: string
  isActive: boolean
  generatedAt?: string
  generationSource?: string
}

export type CreateTimetableEntry = Omit<TimetableEntry, 'id' | 'isActive' | 'generatedAt' | 'generationSource'> & { curriculumId: string; yearOfStudy: number; curriculumSemesterNumber: number }
export type TimetableOptions = {
  teachingGroups: { id: string; label: string; programmeId: string; semesterId: string; courseId: string; curriculumId?: string | null; yearOfStudy?: number | null; semesterNumber?: number; isProgrammeYearClass?: boolean }[]
  courses: { id: string; label: string }[]
  teachers: { id: string; label: string; courseUnitIds?: string[] }[]
  semesters: { id: string; label: string; academicYearId: string; academicYearLabel: string; startDate: string; endDate: string; isCurrent: boolean; isActive: boolean }[]
  programmes: { id: string; label: string; code?: string; durationYears?: number; durationUnit?: string }[]
  curricula: { id: string; programmeId: string; label: string }[]
  curriculumCourses: { curriculumId: string; programmeId: string; courseId: string; courseLabel: string; yearOfStudy: number; semesterNumber: number; isCore: boolean }[]
}
export type GenerateTimetableResult = {
  entries: TimetableEntry[]
  conflicts: string[]
  warnings: string[]
  optimizationScore: number
  unscheduled: string[]
  isConflictFree: boolean
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage timetables.')
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = await response.json() as { message?: string; title?: string; errors?: Record<string, string[]> }
      message = payload.message || payload.title || Object.values(payload.errors ?? {}).flat().join(' ') || message
    } catch {
      // Keep the status-based message when the server does not return JSON.
    }
    throw new Error(message)
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>
}

export const getTimetableOptions = () => request<TimetableOptions>('/api/timetable/options')
export const listTimetable = (teachingGroupId?: string) => request<TimetableEntry[]>(`/api/timetable${teachingGroupId ? `?teachingGroupId=${encodeURIComponent(teachingGroupId)}` : ''}`)
export const createTimetableEntry = (input: CreateTimetableEntry) => request<TimetableEntry>('/api/timetable', { method: 'POST', body: JSON.stringify(input) })
export const updateTimetableEntry = (id: string, input: CreateTimetableEntry) => request<TimetableEntry>(`/api/timetable/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
export const deactivateTimetableEntry = (id: string) => request<void>(`/api/timetable/${id}`, { method: 'DELETE' })
export const generateTimetable = (semesterId: string, teachingGroupIds: string[], curriculumId: string, yearOfStudy: number, curriculumSemesterNumber: number, programmeId: string) => request<GenerateTimetableResult>('/api/timetable/generate', {
  method: 'POST',
  body: JSON.stringify({
    semesterId,
    teachingGroupIds: [...new Set(teachingGroupIds)],
    curriculumId,
    yearOfStudy,
    curriculumSemesterNumber,
    programmeId,
    rotationIntervalMinutes: 15,
    generationSource: 'Manual',
  }),
})


export type TimetableTemplateLayout = {
  teachingGroupId: string
  layoutJson: string | null
  updatedAtUtc: string | null
}
export const getTimetableTemplate = (teachingGroupId: string) => request<TimetableTemplateLayout>(`/api/timetable/template/${encodeURIComponent(teachingGroupId)}`)
export const saveTimetableTemplate = (teachingGroupId: string, entries: CreateTimetableEntry[], layout: unknown) =>
  request<TimetableEntry[]>(`/api/timetable/template/${encodeURIComponent(teachingGroupId)}`, {
    method: 'PUT',
    body: JSON.stringify({ teachingGroupId, entries, layoutJson: JSON.stringify(layout) }),
  })
