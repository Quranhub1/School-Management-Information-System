import { z } from 'zod'
import { getAccessToken } from './auth'
import {
  admissionDecisionRequestSchema,
  admissionDecisionResponseSchema,
  admissionResponseSchema,
  createAdmissionRequestSchema,
  updateAdmissionRequestSchema,
} from '../schemas'
import { parseApiInput, parseApiResponse } from '../lib/validation'

export type Admission = { id: string; applicantId: string; programmeId: string; academicYearId: string; intakeId: string; status: string; decidedAt?: string }
export type AdmissionDecision = { id: string; admissionId: string; decision: string; reason?: string; decidedBy?: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage admissions.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>
}

export async function getAdmissions() {
  return parseApiResponse(z.array(admissionResponseSchema), await request<unknown>('/api/admissions'), 'admissions list') as Admission[]
}
export async function getAdmission(id: string) {
  return parseApiResponse(admissionResponseSchema, await request<unknown>(`/api/admissions/${encodeURIComponent(id)}`), 'admission') as Admission
}
export async function createAdmission(input: { applicantId: string; programmeId: string; academicYearId: string; intakeId: string }) {
  const data = parseApiInput(createAdmissionRequestSchema, input, 'create admission')
  return parseApiResponse(admissionResponseSchema, await request<unknown>('/api/admissions', { method: 'POST', body: JSON.stringify(data) }), 'created admission') as Admission
}
export async function updateAdmission(id: string, input: { id: string; status?: string }) {
  const data = parseApiInput(updateAdmissionRequestSchema, input, 'update admission')
  return parseApiResponse(admissionResponseSchema, await request<unknown>(`/api/admissions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }), 'updated admission') as Admission
}
export function deleteAdmission(id: string) {
  if (!id.trim()) throw new Error('Admission ID is required.')
  return request<void>(`/api/admissions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
export async function decideAdmission(id: string, decision: string, reason?: string, decidedBy?: string) {
  const data = parseApiInput(admissionDecisionRequestSchema, { decision, reason, decidedBy }, 'admission decision')
  return parseApiResponse(admissionDecisionResponseSchema, await request<unknown>(`/api/admissions/${encodeURIComponent(id)}/decision`, { method: 'POST', body: JSON.stringify(data) }), 'admission decision') as AdmissionDecision
}
