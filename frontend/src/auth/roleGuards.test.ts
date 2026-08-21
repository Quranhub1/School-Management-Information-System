import { describe, expect, it } from 'vitest'
import { canManageAcademics, canManageExaminations, canManageFinance } from './roleGuards'

describe('frontend role guards', () => {
  it('maps institutional management roles to authorized modules', () => {
    expect(canManageAcademics(['AcademicRegistrar'])).toBe(true)
    expect(canManageFinance(['FinanceOfficer'])).toBe(true)
    expect(canManageExaminations(['ExaminationsOfficer'])).toBe(true)
  })

  it('does not grant management modules to students', () => {
    expect(canManageAcademics(['Student'])).toBe(false)
    expect(canManageFinance(['Student'])).toBe(false)
    expect(canManageExaminations(['Student'])).toBe(false)
  })
})
