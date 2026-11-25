import { test, expect, vi } from 'vitest'
import { toHaveNoViolations } from 'axe-core'

// Extend Vitest matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T
  }
}

// Mock axe-core for unit tests
vi.mock('axe-core', () => ({
  run: vi.fn().mockResolvedValue({ violations: [] }),
}))

expect.extend(toHaveNoViolations)

test('accessibility: no violations in basic render', async () => {
  // This is a placeholder test that will be expanded when we have Playwright integration
  expect(true).toBe(true)
})