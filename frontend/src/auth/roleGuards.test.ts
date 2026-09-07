import { describe, expect, it } from 'vitest'
import {
  canManageAdministration,
  canManageAcademics,
  canManageFinance,
  canManageExaminations,
  canManageStudents,
  canManageAdmissions,
  canManageTimetable,
  canReadStaff,
  canManageStaff,
  canReadLibrary,
  canManageLibrary,
} from './roleGuards'

describe('role guards — administration', () => {
  it('grants administration to System Administrator', () => {
    expect(canManageAdministration(['SystemAdministrator'])).toBe(true)
  })

  it('denies administration to other roles', () => {
    expect(canManageAdministration(['Registrar'])).toBe(false)
    expect(canManageAdministration(['FinanceOfficer'])).toBe(false)
    expect(canManageAdministration([])).toBe(false)
  })
})

describe('role guards — academics', () => {
  it('grants academic management to authorized roles', () => {
    expect(canManageAcademics(['SystemAdministrator'])).toBe(true)
    expect(canManageAcademics(['Registrar'])).toBe(true)
    expect(canManageAcademics(['AcademicRegistrar'])).toBe(true)
  })

  it('denies academic management to students and lecturers', () => {
    expect(canManageAcademics(['Student'])).toBe(false)
    expect(canManageAcademics(['Lecturer'])).toBe(false)
  })
})

describe('role guards — finance', () => {
  it('grants finance management to authorized roles', () => {
    expect(canManageFinance(['SystemAdministrator'])).toBe(true)
    expect(canManageFinance(['FinanceOfficer'])).toBe(true)
  })

  it('denies finance management to non-finance roles', () => {
    expect(canManageFinance(['Lecturer'])).toBe(false)
    expect(canManageFinance(['Registrar'])).toBe(false)
  })
})

describe('role guards — library', () => {
  it('grants read access to librarians and registrars', () => {
    expect(canReadLibrary(['Librarian'])).toBe(true)
    expect(canReadLibrary(['Registrar'])).toBe(true)
  })

  it('grants manage access only to librarian and admin', () => {
    expect(canManageLibrary(['Librarian'])).toBe(true)
    expect(canManageLibrary(['System Administrator'])).toBe(true)
    expect(canManageLibrary(['Lecturer'])).toBe(false)
  })

  it('denies library access to students', () => {
    expect(canReadLibrary(['Student'])).toBe(false)
    expect(canManageLibrary(['Student'])).toBe(false)
  })
})

describe('role guards — staff', () => {
  it('grants read staff to authorized roles', () => {
    expect(canReadStaff(['HR Manager'])).toBe(true)
    expect(canReadStaff(['Lecturer'])).toBe(true)
  })

  it('grants manage staff to authorized roles', () => {
    expect(canManageStaff(['HR Manager'])).toBe(true)
    expect(canManageStaff(['System Administrator'])).toBe(true)
  })

  it('denies manage staff to lecturers', () => {
    expect(canManageStaff(['Lecturer'])).toBe(false)
  })
})
