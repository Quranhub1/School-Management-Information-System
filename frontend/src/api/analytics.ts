import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export interface SupersetConfig {
  enabled: boolean
  supersetDomain?: string
  dashboardId?: string
}

async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

export async function getSupersetConfig(): Promise<SupersetConfig> {
  const response = await authorizedFetch('/api/analytics/config')
  if (!response.ok) throw new Error(`Unable to load analytics configuration (${response.status}).`)
  return await response.json() as SupersetConfig
}

export async function getSupersetGuestToken(): Promise<string> {
  const response = await authorizedFetch('/api/analytics/guest-token', { method: 'POST' })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Unable to authenticate analytics (${response.status}).`)
  }
  const payload = await response.json() as { token?: string }
  if (!payload.token) throw new Error('Analytics server returned no guest token.')
  return payload.token
}
