import { describe, expect, it } from 'vitest'
import { validateBulkImportRows } from './bulk-import-validation'

describe('bulk import row validation', () => {
  it('validates each student row and reports row/field-specific errors', () => {
    const errors = validateBulkImportRows('student', [
      { StudentNumber: 'STU001', FirstName: 'Jane', LastName: 'Doe', DateOfBirth: '2000-01-01', Email: 'jane@example.com' },
      { StudentNumber: 'STU002', FirstName: '', LastName: 'Smith', DateOfBirth: 'not-a-date', Email: 'invalid-email' },
    ])

    expect(errors.some(error => error.startsWith('Row 3, firstName:'))).toBe(true)
    expect(errors.some(error => error.startsWith('Row 3, dateOfBirth:'))).toBe(true)
    expect(errors.some(error => error.startsWith('Row 3, email:'))).toBe(true)
  })


  it('normalizes Excel Date cells to ISO dates before validating student rows', () => {
    const errors = validateBulkImportRows('student', [
      { StudentNumber: 'STU003', FirstName: 'Grace', LastName: 'Hopper', DateOfBirth: new Date('2000-01-01T00:00:00.000Z') },
    ])

    expect(errors).toEqual([])
  })

  it('rejects duplicate student or staff identifiers within the same file', () => {
    const studentErrors = validateBulkImportRows('student', [
      { StudentNumber: 'STU001', FirstName: 'Jane', LastName: 'Doe' },
      { StudentNumber: 'stu001', FirstName: 'John', LastName: 'Smith' },
    ])
    const staffErrors = validateBulkImportRows('staff', [
      { StaffNumber: 'STF001', FirstName: 'Jane', LastName: 'Doe', EmploymentType: 'Permanent', StaffType: 'Teaching' },
      { StaffNumber: 'stf001', FirstName: 'John', LastName: 'Smith', EmploymentType: 'Permanent', StaffType: 'NonTeaching' },
    ])

    expect(studentErrors.some(error => error.includes('duplicate value'))).toBe(true)
    expect(staffErrors.some(error => error.includes('duplicate value'))).toBe(true)
  })

  it('requires valid backend staff type values for staff rows', () => {
    const errors = validateBulkImportRows('staff', [
      { StaffNumber: 'STF001', FirstName: 'Jane', LastName: 'Doe', EmploymentType: 'Permanent', StaffType: 'Contractor' },
    ])

    expect(errors.some(error => error.startsWith('Row 2, staffType:'))).toBe(true)
  })
})
