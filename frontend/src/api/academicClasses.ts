import { apiRequest } from '../lib/api'

export interface AuthResponse {
  accessToken: string
  expiresAt: string
  username: string
  roles: string[]
}

const TOKEN_KEY = 'smis.accessToken'
const SESSION_KEY = 'smis.session'

export async function login(username: string, password: string): Promise<AuthResponse> {
  const session = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

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

