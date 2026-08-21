export interface AuthResponse {
  accessToken: string
  expiresAt: string
  username: string
  roles: string[]
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const TOKEN_KEY = 'smis.accessToken'
const SESSION_KEY = 'smis.session'

export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Login failed with status ${response.status}`)
  }

  const session = await response.json() as AuthResponse
  sessionStorage.setItem(TOKEN_KEY, session.accessToken)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    expiresAt: session.expiresAt,
    username: session.username,
    roles: session.roles,
  }))
  return session
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getSession(): Omit<AuthResponse, 'accessToken'> | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Omit<AuthResponse, 'accessToken'>
  } catch {
    return null
  }
}

export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
