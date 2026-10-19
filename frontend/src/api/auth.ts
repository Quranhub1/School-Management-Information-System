export interface AuthResponse {
  accessToken: string
  expiresAt: string
  username: string
  roles: string[]
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const TOKEN_KEY = 'smis.accessToken'
const SESSION_KEY = 'smis.session'

type StoredSession = Omit<AuthResponse, 'accessToken'>

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch {
    // Keep the app usable if browser storage is unavailable; the other store may still work.
  }
}

function removeStorage(storage: Storage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // Ignore unavailable storage during sign-out.
  }
}

/**
 * Keep a durable copy in localStorage and a tab-scoped copy in sessionStorage.
 * The session copy supports existing API modules; the durable copy lets the app
 * recover after a tab/session storage reset or a normal browser restart.
 */
export function saveAuthSession(session: AuthResponse): void {
  const storedSession: StoredSession = {
    expiresAt: session.expiresAt,
    username: session.username,
    roles: session.roles,
  }
  const serialized = JSON.stringify(storedSession)

  writeStorage(localStorage, TOKEN_KEY, session.accessToken)
  writeStorage(localStorage, SESSION_KEY, serialized)
  writeStorage(sessionStorage, TOKEN_KEY, session.accessToken)
  writeStorage(sessionStorage, SESSION_KEY, serialized)
}

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
  saveAuthSession(session)
  return session
}

export function getAccessToken(): string | null {
  const token = readStorage(sessionStorage, TOKEN_KEY) ?? readStorage(localStorage, TOKEN_KEY)
  if (token) writeStorage(sessionStorage, TOKEN_KEY, token)
  return token
}

export function getSession(): StoredSession | null {
  const raw = readStorage(sessionStorage, SESSION_KEY) ?? readStorage(localStorage, SESSION_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as StoredSession
    const expiry = Date.parse(session.expiresAt ?? '')
    const token = readStorage(sessionStorage, TOKEN_KEY) ?? readStorage(localStorage, TOKEN_KEY)

    // Never show a user as signed in without a usable token or after expiry.
    if (!session.username || !Array.isArray(session.roles) || !Number.isFinite(expiry) || expiry <= Date.now() || !token) {
      if (Number.isFinite(expiry) && expiry <= Date.now()) logout()
      return null
    }

    // Rehydrate tab storage so existing API modules that read sessionStorage
    // directly continue to attach the saved access token after a session reset.
    writeStorage(sessionStorage, TOKEN_KEY, token)
    writeStorage(sessionStorage, SESSION_KEY, raw)
    return session
  } catch {
    return null
  }
}

export function logout(): void {
  removeStorage(sessionStorage, TOKEN_KEY)
  removeStorage(sessionStorage, SESSION_KEY)
  removeStorage(localStorage, TOKEN_KEY)
  removeStorage(localStorage, SESSION_KEY)
}
