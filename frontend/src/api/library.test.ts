import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sessionStore: Record<string, string> = {}
const mockSessionStorage = {
  getItem: vi.fn((key: string) => sessionStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { sessionStore[key] = value }),
  removeItem: vi.fn((key: string) => { delete sessionStore[key] }),
}

beforeEach(() => {
  Object.keys(sessionStore).forEach(key => delete sessionStore[key])
  vi.stubGlobal('sessionStorage', mockSessionStorage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('library API', () => {
  it('sends the backend book contract with a normalized ISBN', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        id: 'book-1',
        isbn: '9780306406157',
        barcodeValue: '9780306406157',
        title: 'Test Book',
        author: 'Test Author',
        totalCopies: 2,
        availableCopies: 2,
        isActive: true,
        createdAtUtc: '2026-11-17T00:00:00Z',
      }),
    })
    vi.stubGlobal('fetch', mockFetch)
    const { addBook } = await import('./library')

    await addBook({
      isbn: '978-0-30640615-7',
      title: 'Test Book',
      author: 'Test Author',
      totalCopies: 2,
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [, request] = mockFetch.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(JSON.parse(request.body)).toEqual({
      isbn: '9780306406157',
      title: 'Test Book',
      author: 'Test Author',
      totalCopies: 2,
    })
  })

  it('does not send an invalid book request to the API', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    const { addBook } = await import('./library')

    await expect(addBook({
      isbn: '978-0-30640615-8',
      title: 'Test Book',
      author: 'Test Author',
      totalCopies: 1,
    })).rejects.toThrow()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('validates issue member type before making the request', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    const { issueBook } = await import('./library')

    await expect(issueBook({
      bookId: 'book-1',
      memberId: 'member-1',
      memberType: 'Visitor' as 'Student',
      issuedAtUtc: '2026-11-17T08:00:00Z',
      dueAtUtc: '2026-11-24T08:00:00Z',
    })).rejects.toThrow()

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
