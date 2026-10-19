import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const sessionStore: Record<string, string> = {}
const localStore: Record<string, string> = {}
function storageFor(store: Record<string, string>) {
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
  }
}
const mockSessionStorage = storageFor(sessionStore)
const mockLocalStorage = storageFor(localStore)

beforeEach(() => {
  Object.keys(sessionStore).forEach(k => delete sessionStore[k])
  Object.keys(localStore).forEach(k => delete localStore[k])
  for (const storage of [mockSessionStorage, mockLocalStorage]) {
    storage.getItem.mockClear()
    storage.setItem.mockClear()
    storage.removeItem.mockClear()
  }
  vi.stubGlobal('sessionStorage', mockSessionStorage)
  vi.stubGlobal('localStorage', mockLocalStorage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('auth API — login', () => {
  it('stores token and session in durable and tab storage on successful login', async () => {
    const mockResponse = {
      accessToken: 'test-token',
      expiresAt: '2026-12-31T00:00:00Z',
      username: 'admin',
      roles: ['SystemAdministrator'],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { login } = await import('./auth')
    const result = await login('admin', 'password')

    expect(result.accessToken).toBe('test-token')
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('smis.accessToken', 'test-token')
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'smis.session',
      expect.stringContaining('SystemAdministrator'),
    )
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('smis.accessToken', 'test-token')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'smis.session',
      expect.stringContaining('SystemAdministrator'),
    )
  })

  it('throws on failed login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    }))

    const { login } = await import('./auth')
    await expect(login('admin', 'wrong')).rejects.toThrow('Invalid credentials')
  })
})

describe('auth API — logout', () => {
  it('removes token and session from both stores', async () => {
    const { logout } = await import('./auth')
    logout()

    for (const storage of [mockSessionStorage, mockLocalStorage]) {
      expect(storage.removeItem).toHaveBeenCalledWith('smis.accessToken')
      expect(storage.removeItem).toHaveBeenCalledWith('smis.session')
    }
  })
})

describe('auth API — getSession', () => {
  it('returns null when no session exists', async () => {
    const { getSession } = await import('./auth')
    expect(getSession()).toBeNull()
  })

  it('recovers session and token from durable storage when tab storage is empty', async () => {
    localStore['smis.accessToken'] = 'durable-token'
    localStore['smis.session'] = JSON.stringify({
      expiresAt: '2026-12-31T00:00:00Z',
      username: 'admin',
      roles: ['SystemAdministrator'],
    })

    const { getSession, getAccessToken } = await import('./auth')
    expect(getSession()?.username).toBe('admin')
    expect(getAccessToken()).toBe('durable-token')
    expect(sessionStore['smis.accessToken']).toBe('durable-token')
    expect(sessionStore['smis.session']).toBe(localStore['smis.session'])
  })
})
