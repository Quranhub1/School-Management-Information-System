import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function authedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  if (token) {
    init = { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } }
  }
  return request<T>(path, init)
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

export const getPublicInstitutionSettings = () => request<InstitutionSettings>('/api/public/institution-settings/active')
export const getInstitutionSettings = () => authedRequest<InstitutionSettings[]>('/api/administration/institution-settings')
export const getActiveInstitutionSettings = () => authedRequest<InstitutionSettings>('/api/administration/institution-settings/active')
export const createInstitutionSettings = (input: CreateInstitutionSettingsRequest) => authedRequest<InstitutionSettings>('/api/administration/institution-settings', { method: 'POST', body: JSON.stringify(input) })
