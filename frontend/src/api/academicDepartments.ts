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

export interface FacultyOption { id: string; code: string; name: string; isActive: boolean }
export interface AcademicDepartment { id: string; facultyId: string; facultyName: string; code: string; name: string; isActive: boolean }
export interface DepartmentInput { facultyId: string; code: string; name: string }
export const getAcademicFaculties = () => request<FacultyOption[]>('/api/academic-departments/faculties')
export const getAcademicDepartments = () => request<AcademicDepartment[]>('/api/academic-departments')
export const createAcademicDepartment = (input: DepartmentInput) => request<AcademicDepartment>('/api/academic-departments', { method: 'POST', body: JSON.stringify(input) })
export const updateAcademicDepartment = (id: string, input: DepartmentInput & { isActive: boolean }) => request<void>(`/api/academic-departments/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
export const setAcademicDepartmentActive = (id: string, isActive: boolean) => request<void>(`/api/academic-departments/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
