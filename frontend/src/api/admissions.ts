import { apiFetch } from './client'

export type Applicant = { id: string; applicationNumber: string; firstName: string; lastName: string; otherNames?: string; dateOfBirth?: string; gender?: string; nationalId?: string; phoneNumber?: string; email?: string; status: string; appliedAt: string }

export function listApplicants(status?: string) { return apiFetch<Applicant[]>(`/api/admissions${status ? `?status=${encodeURIComponent(status)}` : ''}`) }
export function submitApplicant(input: Omit<Applicant, 'id'|'applicationNumber'|'status'|'appliedAt'>) { return apiFetch<Applicant>('/api/admissions', { method: 'POST', body: JSON.stringify(input) }) }
export function updateAdmissionStatus(id: string, status: string) { return apiFetch<Applicant>(`/api/admissions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }) }
