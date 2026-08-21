import { getAccessToken } from './auth'

export interface Student {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  otherNames?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  nationalId?: string | null
  phoneNumber?: string | null
  email?: string | null
  status: string
  admissionId?: string | null
  createdAt: string
}

export interface CreateStudentRequest {
  studentNumber: string
  firstName: string
  lastName: string
  otherNames?: string
  dateOfBirth?: string
  gender?: string
  nationalId?: string
  phoneNumber?: string
  email?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage students.')
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getStudents = () => request<Student[]>('/api/students')
export const getStudent = (id: string) => request<Student>(`/api/students/${id}`)
export const createStudent = (requestBody: CreateStudentRequest) => request<Student>('/api/students', { method: 'POST', body: JSON.stringify(requestBody) })
