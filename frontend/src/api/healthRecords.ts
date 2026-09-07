import { getAccessToken } from './auth'

export interface MedicalRecord {
  id: string
  recordType: string
  condition: string | null
  treatment: string | null
  medication: string | null
  notes: string | null
  attendedBy: string | null
  visitDate: string
  createdAtUtc: string
}

export interface RecentClinicVisit {
  id: string
  studentId: string
  studentNumber: string
  studentName: string
  recordType: string
  condition: string | null
  treatment: string | null
  visitDate: string
  attendedBy: string | null
}

export interface AddMedicalRecordRequest {
  recordType: string
  condition?: string
  treatment?: string
  medication?: string
  notes?: string
  attendedBy?: string
  visitDate: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view health records.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getStudentMedicalRecords = (studentId: string) => request<MedicalRecord[]>(`/api/health-records/student/${encodeURIComponent(studentId)}`)
export const getRecentClinicVisits = (days?: number) => request<RecentClinicVisit[]>(`/api/health-records/recent${days ? `?days=${days}` : ''}`)
export const addMedicalRecord = (studentId: string, data: AddMedicalRecordRequest) => request<{ id: string }>(`/api/health-records/student/${encodeURIComponent(studentId)}`, {
  method: 'POST',
  body: JSON.stringify(data),
})
