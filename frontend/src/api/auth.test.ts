import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Mock sessionStorage
const store: Record<string, string> = {}
const mockStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
}

beforeEach(() => {
  vi.stubGlobal('sessionStorage', mockStorage)
  Object.keys(store).forEach(k => delete store[k])
  mockStorage.getItem.mockClear()
  mockStorage.setItem.mockClear()
  mockStorage.removeItem.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('auth API — login', () => {
  it('stores token and session on successful login', async () => {
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
    expect(mockStorage.setItem).toHaveBeenCalledWith('smis.accessToken', 'test-token')
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'smis.session',
      expect.stringContaining('SystemAdministrator')
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
  it('removes token and session from storage', async () => {
    const { logout } = await import('./auth')
    logout()

    expect(mockStorage.removeItem).toHaveBeenCalledWith('smis.accessToken')
    expect(mockStorage.removeItem).toHaveBeenCalledWith('smis.session')
  })
})

describe('auth API — getSession', () => {
  it('returns null when no session exists', async () => {
    const { getSession } = await import('./auth')
    expect(getSession()).toBeNull()
  })
})
