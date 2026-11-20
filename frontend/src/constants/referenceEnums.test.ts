import { describe, expect, it } from 'vitest'
import { LEAVE_TYPE_OPTIONS, LEAVE_TYPE_VALUES, STAFF_TYPE_OPTIONS, STAFF_TYPE_VALUES } from './referenceEnums'
import { leaveRequestSchema } from '../schemas/api-contracts.schema'

describe('shared backend enum options', () => {
  it('keeps staff type options aligned with the backend enum values', () => {
    expect(STAFF_TYPE_OPTIONS.map(option => option.value)).toEqual([...STAFF_TYPE_VALUES])
    expect(STAFF_TYPE_VALUES).toEqual(['Teaching', 'NonTeaching'])
  })

  it('keeps leave form options and API validation on the same values', () => {
    expect(LEAVE_TYPE_OPTIONS.map(option => option.value)).toEqual([...LEAVE_TYPE_VALUES])
    for (const leaveType of LEAVE_TYPE_VALUES) {
      const result = leaveRequestSchema.safeParse({
        staffMemberId: 'staff-1',
        leaveType,
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        reason: 'Personal leave request',
      })
      expect(result.success).toBe(true)
    }
    expect(leaveRequestSchema.safeParse({
      staffMemberId: 'staff-1',
      leaveType: 'Compassionate',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      reason: 'Personal leave request',
    }).success).toBe(false)
  })
})
