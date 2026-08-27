import { getAccessToken } from './auth'

export type Applicant = { id: string; applicationNumber: string; firstName: string; lastName: string; otherNames?: string; dateOfBirth?: string; gender?: string; nationalId?: string; phoneNumber?: string; email?: string; status: string; appliedAt: string }
export type AdmissionRequirement = { id: string; programmeId: string; requirementType: string; description: string; isMandatory: boolean; displayOrder: number; isActive: boolean }

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

export function listApplicants(status?: string) { return request<Applicant[]>(`/api/admissions${status ? `?status=${encodeURIComponent(status)}` : ''}`) }
export function submitApplicant(input: Omit<Applicant, 'id'|'applicationNumber'|'status'|'appliedAt'>) { return request<Applicant>('/api/admissions', { method: 'POST', body: JSON.stringify(input) }) }
export function updateAdmissionStatus(id: string, status: string) { return request<Applicant>(`/api/admissions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }) }
export function getAdmissionRequirements(programmeId?: string) { return request<AdmissionRequirement[]>('/api/admissions/requirements' + (programmeId ? `?programmeId=${encodeURIComponent(programmeId)}` : '')) }
export function createAdmissionRequirement(body: { programmeId: string; requirementType: string; description: string; isMandatory: boolean; displayOrder: number }) { return request<AdmissionRequirement>('/api/admissions/requirements', { method: 'POST', body: JSON.stringify(body) }) }
export function deleteAdmissionRequirement(id: string) { return request<void>(`/api/admissions/requirements/${id}`, { method: 'DELETE' }) }
