import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { isPersistableQuery, QUERY_CACHE_MAX_AGE } from './queryClient'

describe('TanStack Query persistence policy', () => {
  it('persists only successful queries explicitly marked as safe to persist', () => {
    const client = new QueryClient()
    client.setQueryDefaults(['offline-dashboard'], { meta: { persist: true } })
    client.setQueryData(['offline-dashboard'], { activeStudents: 120 })
    client.setQueryData(['student-profile', 'student-1'], { name: 'Private learner' })

    const allowed = client.getQueryCache().find({ queryKey: ['offline-dashboard'] })
    const privateQuery = client.getQueryCache().find({ queryKey: ['student-profile', 'student-1'] })

    expect(allowed).toBeDefined()
    expect(privateQuery).toBeDefined()
    expect(isPersistableQuery(allowed!)).toBe(true)
    expect(isPersistableQuery(privateQuery!)).toBe(false)
    client.clear()
  })

  it('does not persist queries that have not completed successfully', () => {
    const client = new QueryClient()
    client.setQueryDefaults(['pending'], { meta: { persist: true } })
    const query = client.getQueryCache().build(client, { queryKey: ['pending'] })

    expect(isPersistableQuery(query)).toBe(false)
    client.clear()
  })

  it('keeps persisted cache lifetime bounded to 24 hours', () => {
    expect(QUERY_CACHE_MAX_AGE).toBe(24 * 60 * 60 * 1000)
  })
})
