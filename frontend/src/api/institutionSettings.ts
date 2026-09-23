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
  if (token) init = { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } }
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

export interface GalleryItem {
  id: string
  title: string
  caption?: string | null
  imageUrl: string
  uploadedAt: string
  source: 'upload' | 'url'
}

export const getPublicInstitutionSettings = () => request<InstitutionSettings>('/api/public/institution-settings/active')
export const getInstitutionSettings = () => authedRequest<InstitutionSettings[]>('/api/administration/institution-settings')
export const getActiveInstitutionSettings = () => authedRequest<InstitutionSettings>('/api/administration/institution-settings/active')
export const createInstitutionSettings = (input: CreateInstitutionSettingsRequest) => authedRequest<InstitutionSettings>('/api/administration/institution-settings', { method: 'POST', body: JSON.stringify(input) })

export async function uploadInstitutionLogo(file: File): Promise<InstitutionSettings> {
  const form = new FormData()
  form.append('file', file)
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/api/administration/institution-settings/logo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<InstitutionSettings>
}

export const getGallery = () => request<GalleryItem[]>('/api/public/institution-gallery')

export async function uploadGalleryImage(file: File, title: string, caption: string): Promise<GalleryItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('title', title)
  form.append('caption', caption)
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/api/administration/institution-gallery/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Upload failed with status ${response.status}`)
  }
  return response.json() as Promise<GalleryItem>
}

export const addGalleryUrl = (url: string, title: string, caption: string) =>
  authedRequest<GalleryItem>('/api/administration/institution-gallery/url', {
    method: 'POST',
    body: JSON.stringify({ url, title, caption }),
  })

export const deleteGalleryItem = (id: string) =>
  authedRequest<void>(`/api/administration/institution-gallery/${id}`, { method: 'DELETE' })
