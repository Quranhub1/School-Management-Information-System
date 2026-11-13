import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\\/$/, '') ?? ''

export interface SystemCurrencySettings {
  code: string
  locale: string
  fractionDigits: number
}

async function request<T>(path: string, init?: RequestInit, authenticated = true): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  if (authenticated) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

// Currency metadata is intentionally public and read-only so the application can
// initialize its display defaults before an administrator session is available.
export const getSystemCurrencySettings = () =>
  request<SystemCurrencySettings>('/api/public/institution-settings/currency', undefined, false)

// Changing the system default remains restricted to authorized administrators.
export const saveSystemCurrencySettings = (code: string) =>
  request<SystemCurrencySettings>('/api/administration/institution-settings/system-currency', {
    method: 'PUT',
    body: JSON.stringify({ code }),
  })
