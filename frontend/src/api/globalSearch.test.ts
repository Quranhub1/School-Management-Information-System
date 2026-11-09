import { describe, expect, it } from 'vitest'
import { globalSearchQueryKeys, normalizeSearchTerm } from './globalSearch'

describe('global search query keys', () => {
  it('normalizes mixed-case and compatibility-equivalent search terms', () => {
    expect(normalizeSearchTerm('  JANE DOE  ')).toBe('jane doe')
    expect(normalizeSearchTerm('ＫＳＨＳ')).toBe('kshs')
    expect(globalSearchQueryKeys.results('STUDENT')).toEqual(
      globalSearchQueryKeys.results('student'),
    )
  })

  it('normalizes search terms to avoid duplicate cache entries by letter case', () => {
    expect(globalSearchQueryKeys.results('Jane Doe')).toEqual(
      globalSearchQueryKeys.results('jane doe'),
    )
  })

  it('separates results when date filters change', () => {
    expect(globalSearchQueryKeys.results('student', '2026-01-01', '2026-06-30')).not.toEqual(
      globalSearchQueryKeys.results('student', '2026-02-01', '2026-06-30'),
    )
  })

  it('keeps unfiltered and filtered search results in separate cache entries', () => {
    expect(globalSearchQueryKeys.results('KSHS')).not.toEqual(
      globalSearchQueryKeys.results('KSHS', '2026-01-01', undefined),
    )
  })
})
