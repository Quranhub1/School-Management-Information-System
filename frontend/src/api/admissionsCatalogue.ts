import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export interface AdmissionsAuthorityOption {
  id: string
  code: string
  name: string
  sortOrder: number
  isActive: boolean
}

export interface AdmissionsProgrammeOption {
  id: string
  code: string
  name: string
  award: string
  durationYears: number
  durationUnit: string
  type: number
  regulator: string
  authorityName: string
}

export interface AdmissionsAcademicCatalogue {
  authorities: AdmissionsAuthorityOption[]
  programmes: AdmissionsProgrammeOption[]
}

export async function getAdmissionsAcademicCatalogue(): Promise<AdmissionsAcademicCatalogue> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/api/admissions/academic-catalogue`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<AdmissionsAcademicCatalogue>
}
