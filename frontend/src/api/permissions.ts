import { readApiErrorMessage } from './errors'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export async function getMyEffectivePermissions(): Promise<string[]> {
  const token = sessionStorage.getItem('smis.accessToken') ?? localStorage.getItem('smis.accessToken')
  const response = await fetch(`${API_BASE_URL}/api/permissions/me`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!response.ok) throw new Error(await readApiErrorMessage(response))
  const payload = await response.json() as { permissions?: unknown }
  return Array.isArray(payload.permissions)
    ? payload.permissions.filter((permission): permission is string => typeof permission === 'string')
    : []
}
