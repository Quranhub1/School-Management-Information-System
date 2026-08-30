import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export interface InstitutionSettings {
  id: string
  institutionName: string
  abbreviation?: string | null
  motto?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  postalAddress?: string | null
  country?: string | null
  institutionType?: string | null
  logoPath?: string | null
  primaryColor?: string | null
  accentColor?: string | null
  isActive: boolean
  updatedAt: string
}

export interface CreateInstitutionSettingsRequest {
  institutionName: string
  abbreviation?: string
  motto?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  postalAddress?: string
  country?: string
  institutionType?: string
  logoPath?: string
  primaryColor?: string
  accentColor?: string
}

export const getInstitutionSettings = () => request<InstitutionSettings[]>('/api/administration/institution-settings')
export const getActiveInstitutionSettings = () => request<InstitutionSettings>('/api/administration/institution-settings/active')
export const createInstitutionSettings = (input: CreateInstitutionSettingsRequest) => request<InstitutionSettings>('/api/administration/institution-settings', { method: 'POST', body: JSON.stringify(input) })
