import { getAccessToken } from './auth'

export interface GatePass {
  id: string
  studentId: string
  studentNumber: string
  studentName: string
  passType: string
  reason: string | null
  destination: string | null
  authorizedBy: string | null
  parentGuardianContact: string | null
  expectedReturnDate: string
  issuedAtUtc: string
  approvedAtUtc: string | null
}

export interface GatePassDetail {
  id: string
  passType: string
  reason: string | null
  destination: string | null
  authorizedBy: string | null
  parentGuardianContact: string | null
  expectedReturnDate: string
  status: string
  issuedAtUtc: string
  approvedAtUtc: string | null
  usedAtUtc: string | null
  returnedAtUtc: string | null
  notes: string | null
}

export interface RequestGatePassRequest {
  studentId: string
  passType: string
  reason?: string
  destination?: string
  authorizedBy?: string
  parentGuardianContact?: string
  expectedReturnDate: string
  notes?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage gate passes.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getPendingGatePasses = () => request<GatePass[]>('/api/gate-passes/pending')
export const getStudentGatePasses = (studentId: string) => request<GatePassDetail[]>(`/api/gate-passes/student/${encodeURIComponent(studentId)}`)
export const requestGatePass = (data: RequestGatePassRequest) => request<{ id: string }>('/api/gate-passes/request', {
  method: 'POST',
  body: JSON.stringify(data),
})
export const approveGatePass = (id: string) => request<{ message: string }>(`/api/gate-passes/${encodeURIComponent(id)}/approve`, { method: 'POST' })
export const rejectGatePass = (id: string) => request<{ message: string }>(`/api/gate-passes/${encodeURIComponent(id)}/reject`, { method: 'POST' })
export const markGatePassUsed = (id: string) => request<{ message: string }>(`/api/gate-passes/${encodeURIComponent(id)}/use`, { method: 'POST' })
export const markGatePassReturned = (id: string) => request<{ message: string }>(`/api/gate-passes/${encodeURIComponent(id)}/return`, { method: 'POST' })
