import { getAccessToken } from './auth'

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

export function getAdmissions() { return request<Admission[]>('/api/admissions') }
export function getAdmission(id: string) { return request<Admission>(`/api/admissions/${id}`) }
export function createAdmission(input: { applicantId: string; programmeId: string; academicYearId: string; intakeId: string }) { return request<Admission>('/api/admissions', { method: 'POST', body: JSON.stringify(input) }) }
export function updateAdmission(id: string, input: { id: string; status?: string }) { return request<Admission>(`/api/admissions/${id}`, { method: 'PUT', body: JSON.stringify(input) }) }
export function deleteAdmission(id: string) { return request<void>(`/api/admissions/${id}`, { method: 'DELETE' }) }
export function decideAdmission(id: string, decision: string, reason?: string, decidedBy?: string) { return request<AdmissionDecision>(`/api/admissions/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason, decidedBy }) }) }
