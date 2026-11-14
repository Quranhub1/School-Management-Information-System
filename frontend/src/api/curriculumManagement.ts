import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export interface Curriculum { id:string; programmeId:string; version:string; title:string; minimumCredits:number; effectiveFrom:string; effectiveTo?:string|null; status:string; isActive:boolean; programmeType:number }
export interface Course { id:string; authorityCode?:string|null; code:string; name:string; creditUnits:number; description?:string|null; courseType?:string|null; isActive:boolean }
export interface CurriculumCourse { id:string; curriculumId:string; courseId:string; yearOfStudy:number; semesterNumber:number; isCore:boolean }

export const getCurricula = () => request<Curriculum[]>('/api/curriculum-management/curricula')
export const getCourses = (authorityCode?: string) => request<Course[]>(authorityCode ? `/api/curriculum-management/courses?authorityCode=${encodeURIComponent(authorityCode)}` : '/api/curriculum-management/courses')
export const createCurriculum = (input: Omit<Curriculum,'id'|'status'|'isActive'>) => request<Curriculum>('/api/curriculum-management/curricula',{method:'POST',body:JSON.stringify(input)})
export const createCourse = (input: Omit<Course,'id'|'isActive'> & { authorityCode: string }) => request<Course>('/api/curriculum-management/courses',{method:'POST',body:JSON.stringify(input)})
export const getCurriculumCourses = (id:string) => {
  if (!id.trim()) throw new Error('Curriculum ID is required.')
  return request<CurriculumCourse[]>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses`)
}
export const addCurriculumCourse = (id:string,input:{courseId:string;yearOfStudy:number;semesterNumber:number;isCore:boolean}) => {
  if (!id.trim() || !input.courseId.trim()) throw new Error('Curriculum and course IDs are required.')
  if (input.yearOfStudy < 1 || input.semesterNumber < 1) throw new Error('Year and semester numbers must be positive.')
  return request<CurriculumCourse>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses`,{method:'POST',body:JSON.stringify(input)})
}

export interface UpdateCourseInput {
  authorityCode: string
  code: string
  name: string
  creditUnits: number
  description?: string
  courseType?: string
  isActive: boolean
}
export interface UpdateCurriculumInput {
  version: string
  title: string
  minimumCredits: number
  effectiveFrom: string
  effectiveTo?: string | null
  programmeType: number
  isActive: boolean
}
export const updateCourse = (id: string, input: UpdateCourseInput) => {
  if (!id.trim() || !input.code.trim() || !input.name.trim()) throw new Error('Course ID, code and name are required.')
  if (input.creditUnits < 0) throw new Error('Credit units cannot be negative.')
  return request<void>(`/api/curriculum-management/courses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
}
export const setCourseActive = (id: string, isActive: boolean) => request<void>(`/api/curriculum-management/courses/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
export const updateCurriculum = (id: string, input: UpdateCurriculumInput) => {
  if (!id.trim() || !input.version.trim() || !input.title.trim()) throw new Error('Curriculum ID, version and title are required.')
  if (input.minimumCredits < 0) throw new Error('Minimum credits cannot be negative.')
  return request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
}
export const setCurriculumActive = (id: string, isActive: boolean) => request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })

export const updateCurriculumCourse = (curriculumId: string, mappingId: string, input: { yearOfStudy: number; semesterNumber: number; isCore: boolean }) => {
  if (!curriculumId.trim() || !mappingId.trim()) throw new Error('Curriculum and mapping IDs are required.')
  if (input.yearOfStudy < 1 || input.semesterNumber < 1) throw new Error('Year and semester numbers must be positive.')
  return request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/courses/${encodeURIComponent(mappingId)}`, { method: 'PUT', body: JSON.stringify(input) })
}

export const deleteCurriculumCourse = (curriculumId: string, mappingId: string) =>
  request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/courses/${encodeURIComponent(mappingId)}`, { method: 'DELETE' })

export const deleteCourse = (id: string) => {
  if (!id.trim()) throw new Error('Course ID is required.')
  return request<void>(`/api/curriculum-management/courses/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export const updateCurriculumSemester = (curriculumId: string, year: number, semester: number, input: { yearOfStudy: number; semesterNumber: number }) => {
  if (!curriculumId.trim() || year < 1 || semester < 1 || input.yearOfStudy < 1 || input.semesterNumber < 1)
    throw new Error('Curriculum, year and semester numbers must be positive.')
  return request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/semesters/${year}/${semester}`, { method: 'PUT', body: JSON.stringify(input) })
}

export const deleteCurriculumSemester = (curriculumId: string, year: number, semester: number) =>
  request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/semesters/${year}/${semester}`, { method: 'DELETE' })
