const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function token() {
  return sessionStorage.getItem('smis.accessToken') ?? localStorage.getItem('accessToken')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(init.headers ?? {})
    }
  })
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`)
  if (response.status === 204) return undefined as T
  return await response.json() as T
}

export type StaffAllowance = {
  id: string
  staffMemberId: string
  staffName: string
  staffNumber: string
  allowanceType: string
  amount: number
  currency: string
  effectiveFrom: string
  effectiveTo?: string | null
  frequency: string
  reason?: string | null
  status: string
  authorizedBy?: string | null
  authorizedAt?: string | null
  recordedBy?: string | null
  recordedAt?: string | null
  reference?: string | null
}

export type AuthorizeStaffAllowanceRequest = {
  staffMemberId: string
  allowanceType: string
  amount: number
  effectiveFrom: string
  effectiveTo?: string
  frequency: string
  currency?: string
  reason?: string
  reference?: string
}

export function listStaffAllowances(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request<StaffAllowance[]>(`/api/finance/staff-allowances${query}`)
}

export function authorizeStaffAllowance(payload: AuthorizeStaffAllowanceRequest) {
  return request<StaffAllowance>('/api/finance/staff-allowances/authorize', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function recordStaffAllowance(id: string) {
  return request<StaffAllowance>(`/api/finance/staff-allowances/${id}/record`, {
    method: 'POST'
  })
}
