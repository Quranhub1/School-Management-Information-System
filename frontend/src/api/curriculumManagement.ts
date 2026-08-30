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
export interface Course { id:string; code:string; name:string; creditUnits:number; description?:string|null; courseType?:string|null; isActive:boolean }
export interface CurriculumCourse { id:string; curriculumId:string; courseId:string; yearOfStudy:number; semesterNumber:number; isCore:boolean }

export const getCurricula = () => request<Curriculum[]>('/api/curriculum-management/curricula')
export const getCourses = () => request<Course[]>('/api/curriculum-management/courses')
export const createCurriculum = (input: Omit<Curriculum,'id'|'status'|'isActive'>) => request<Curriculum>('/api/curriculum-management/curricula',{method:'POST',body:JSON.stringify(input)})
export const createCourse = (input: Omit<Course,'id'|'isActive'>) => request<Course>('/api/curriculum-management/courses',{method:'POST',body:JSON.stringify(input)})
export const getCurriculumCourses = (id:string) => {
  if (!id.trim()) throw new Error('Curriculum ID is required.')
  return request<CurriculumCourse[]>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses`)
}
export const addCurriculumCourse = (id:string,input:{courseId:string;yearOfStudy:number;semesterNumber:number;isCore:boolean}) => {
  if (!id.trim() || !input.courseId.trim()) throw new Error('Curriculum and course IDs are required.')
  if (input.yearOfStudy < 1 || input.semesterNumber < 1) throw new Error('Year and semester numbers must be positive.')
  return request<CurriculumCourse>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses`,{method:'POST',body:JSON.stringify(input)})
}
