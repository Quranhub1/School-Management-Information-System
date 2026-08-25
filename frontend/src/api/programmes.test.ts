import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock sessionStorage for API tests
const store: Record<string, string> = {}
const mockStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
}

beforeEach(() => {
  vi.stubGlobal('sessionStorage', mockStorage)
  Object.keys(store).forEach(k => delete store[k])
})

describe('programmes API — input validation', () => {
  it('createProgramme sends correct request structure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'prog-1', code: 'CS101' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { createProgramme } = await import('./programmes')
    await createProgramme({
      departmentId: 'dept-1',
      code: 'CS101',
      name: 'Computer Science',
      award: 'Diploma',
      durationYears: 2,
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/programmes'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('CS101'),
      })
    )
  })
})
