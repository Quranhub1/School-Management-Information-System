import { getAccessToken } from './auth'
import { z } from 'zod'
import { parseApiInput, parseApiResponse } from '../lib/validation'
import { studentCreateRequestSchema, studentResponseSchema } from '../schemas'

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
  campusId?: string | null
  createdAt: string
  isArchived?: boolean
  archivedAt?: string | null
  archivedBy?: string | null
  archiveReason?: string | null
  statusBeforeArchive?: string | null
}

export interface StudentGuardian {
  id: string
  studentId: string
  fullName: string
  relationship?: string | null
  address?: string | null
  phoneNumber?: string | null
  email?: string | null
  isPrimary: boolean
}

export interface GuardianInput {
  fullName: string
  relationship?: string
  address?: string
  phoneNumber?: string
  email?: string
  isPrimary: boolean
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
  campusId?: string
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
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>
}

export interface UpdateStudentRequest {
  id: string
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

export async function getStudents() { return parseApiResponse(z.array(studentResponseSchema), await request<unknown>('/api/students'), 'students list') as Student[] }
export async function getArchivedStudents(search = '') {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  return parseApiResponse(z.array(studentResponseSchema), await request<unknown>(`/api/students/archived${params.size ? `?${params}` : ''}`), 'archived students') as Student[]
}
export const archiveStudent = (id: string, reason?: string) => request<{ id: string; studentNumber: string; isArchived: boolean; archivedAt: string }>(`/api/students/${encodeURIComponent(id)}/archive`, { method: 'POST', body: JSON.stringify({ reason: reason?.trim() || null }) })
export const restoreStudent = (id: string) => request<{ id: string; studentNumber: string; isArchived: boolean }>(`/api/students/${encodeURIComponent(id)}/restore`, { method: 'POST' })

export async function getStudent(id: string) { if (!id.trim()) throw new Error('Student ID is required.'); return parseApiResponse(studentResponseSchema, await request<unknown>(`/api/students/${encodeURIComponent(id)}`), 'student record') as Student }
export async function createStudent(requestBody: CreateStudentRequest) { const input = parseApiInput(studentCreateRequestSchema, requestBody, 'create student'); return parseApiResponse(studentResponseSchema, await request<unknown>('/api/students', { method: 'POST', body: JSON.stringify(input) }), 'created student') as Student }
export async function updateStudent(id: string, requestBody: UpdateStudentRequest) { if (!id.trim()) throw new Error('Student ID is required.'); const input = parseApiInput(studentCreateRequestSchema.extend({ id: z.string().optional() }), requestBody, 'update student'); return parseApiResponse(studentResponseSchema, await request<unknown>(`/api/students/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }), 'updated student') as Student }
export const deleteStudent = (id: string) => request<void>(`/api/students/${id}`, { method: 'DELETE' })
export const getStudentGuardians = (studentId: string) => request<StudentGuardian[]>(`/api/students/${studentId}/guardians`)
export const addStudentGuardian = (studentId: string, input: GuardianInput) => request<StudentGuardian>(`/api/students/${studentId}/guardians`, { method: 'POST', body: JSON.stringify(input) })
export const updateStudentGuardian = (studentId: string, guardianId: string, input: GuardianInput) => request<StudentGuardian>(`/api/students/${studentId}/guardians/${guardianId}`, { method: 'PUT', body: JSON.stringify(input) })
export const deleteStudentGuardian = (studentId: string, guardianId: string) => request<void>(`/api/students/${studentId}/guardians/${guardianId}`, { method: 'DELETE' })
export const getStudentQrCode = (id: string) => {
  const token = getAccessToken()
  return `${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}/api/students/${id}/qrcode`
}

export interface SaveStudentApplicationFormRequest {
  application: Record<string, unknown>
  photographBase64?: string | null
  photographContentType?: string | null
  photographFileName?: string | null
}
export const saveStudentApplicationForm = (studentId: string, input: SaveStudentApplicationFormRequest) =>
  request<{ id: string; studentId: string; submittedAt: string; status: string }>(`/api/students/${studentId}/application-form`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
export const getStudentApplicationForm = (studentId: string) =>
  request<{ id: string; studentId: string; application: Record<string, unknown>; photographContentType?: string; photographFileName?: string; submittedAt: string; status: string }>(`/api/students/${studentId}/application-form`)
