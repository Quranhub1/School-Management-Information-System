import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../api/staff', () => ({
  listStaff: vi.fn().mockResolvedValue([]),
  listStaffDepartments: vi.fn().mockResolvedValue([]),
  listStaffCourseUnits: vi.fn().mockResolvedValue([]),
  createStaff: vi.fn().mockResolvedValue(null),
  updateStaff: vi.fn().mockResolvedValue(null),
  deleteStaff: vi.fn().mockResolvedValue(null),
  activateStaff: vi.fn().mockResolvedValue(null),
  deactivateStaff: vi.fn().mockResolvedValue(null),
  listLeave: vi.fn().mockResolvedValue([]),
  requestLeave: vi.fn().mockResolvedValue(null),
  approveLeave: vi.fn().mockResolvedValue(null),
}))

vi.mock('../api/payroll', () => ({
  listPayroll: vi.fn().mockResolvedValue([]),
  generatePayroll: vi.fn().mockResolvedValue(null),
  markPayrollPaid: vi.fn().mockResolvedValue(null),
}))

vi.mock('./GlobalNotifications', () => ({
  notify: vi.fn(),
}))

import { StaffManagement } from './StaffManagement'

describe('StaffManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the staff management shell', () => {
    render(<StaffManagement />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('supports permission flags', () => {
    render(<StaffManagement canManage canReadPayroll />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
