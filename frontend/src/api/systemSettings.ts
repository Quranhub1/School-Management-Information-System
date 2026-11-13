import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\\/$/, '') ?? ''

export interface SystemCurrencySettings {
  code: string
  locale: string
  fractionDigits: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const getSystemCurrencySettings = () =>
  request<SystemCurrencySettings>('/api/administration/institution-settings/system-currency')

export const saveSystemCurrencySettings = (code: string) =>
  request<SystemCurrencySettings>('/api/administration/institution-settings/system-currency', {
    method: 'PUT',
    body: JSON.stringify({ code }),
  })
