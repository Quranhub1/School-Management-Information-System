import { getAccessToken } from './auth'

export interface CertificateDto {
  id: string
  studentId: string
  name: string
  programme: string
  awardType: string
  graduationDate: string
  serialNumber: string
  verificationHash: string
  issuedAt: string
  issuedBy: string
  isRevoked: boolean
  revokedAt: string | null
  revokedBy: string | null
  revocationReason: string | null
}

export interface GenerateCertificateRequest {
  studentId: string
  programme: string
  awardType: string
  graduationDate: string
  issuedBy: string
}

export interface RevokeCertificateRequest {
  revokedBy: string
  reason?: string
}

export interface CertificatePrintView {
  certificate: CertificateDto
  printReady: boolean
  issuedAt: string
  graduationDate: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage certificates.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const generateCertificate = (studentId: string, body: GenerateCertificateRequest) => request<CertificateDto>(`/api/certificates/generate/${studentId}`, { method: 'POST', body: JSON.stringify({ ...body, studentId }) })
export const getCertificate = (id: string) => request<CertificateDto>(`/api/certificates/${id}`)
export const printCertificate = (id: string) => request<CertificatePrintView>(`/api/certificates/${id}/print`)
export const revokeCertificate = (id: string, body: RevokeCertificateRequest) => request<void>(`/api/certificates/${id}/revoke`, { method: 'POST', body: JSON.stringify(body) })
export const verifyCertificate = (serialNumber: string) => request<CertificateDto>(`/api/certificates/verify/${encodeURIComponent(serialNumber)}`)
