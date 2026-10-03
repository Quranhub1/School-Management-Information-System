const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export interface ApiErrorPayload {
  title?: string
  detail?: string
  message?: string
  errors?: Record<string, string[] | string>
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('smis.accessToken')

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (response.status === 401) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to access this resource.')
  }

  if (response.status === 404) {
    throw new Error('The requested resource could not be found.')
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ApiErrorPayload | null
    const detail = payload?.detail ?? payload?.message ?? payload?.title ?? `Request failed with status ${response.status}`
    throw new Error(detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
