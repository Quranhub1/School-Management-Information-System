import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  getStaffAccount: vi.fn().mockResolvedValue({ linked: false, username: null, permissions: [] }),
  saveStaffAccount: vi.fn().mockResolvedValue({ linked: true, username: 'staff.user', permissions: [] }),
  STAFF_CHANGED_EVENT: 'smis:staff-changed',
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
import { listStaff } from '../api/staff'

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

  it('shows the staff access checklist and supports marking module permissions', async () => {
    render(<StaffManagement canManage />)
    expect(screen.getByRole('heading', { name: 'Administrator Permissions' })).toBeTruthy()
    expect(screen.getByLabelText('Manage timetable')).toBeTruthy()
    expect(screen.getByLabelText('Manage admissions')).toBeTruthy()
    expect(screen.getByLabelText('Manage settings (System Administrator only)')).toBeDisabled()
    fireEvent.click(screen.getByLabelText('Manage timetable'))
    expect(screen.getByText('1 Selected')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Unmark All' }))
    expect(screen.getByText('0 Selected')).toBeTruthy()
  })

  it('shows the redesigned leave request form and only offers active staff', async () => {
    vi.mocked(listStaff).mockResolvedValue([
      { id: 'active-id', staffNumber: 'ST-001', firstName: 'Amina', lastName: 'Nabirye', employmentType: 'Permanent', staffType: 'Teaching', isActive: true },
      { id: 'inactive-id', staffNumber: 'ST-002', firstName: 'John', lastName: 'Okello', employmentType: 'Permanent', staffType: 'Teaching', isActive: false },
    ])
    render(<StaffManagement canManage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Leave' }))
    expect(screen.getByRole('heading', { name: 'Leave request' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Recent leave requests' })).toBeTruthy()
    expect(screen.getByLabelText('Name of staff')).toBeTruthy()
    expect(screen.getByText('Single day')).toBeTruthy()
    expect(screen.getByText('Multiple days')).toBeTruthy()
    await waitFor(() => expect(screen.getByRole('option', { name: /Amina Nabirye/ })).toBeTruthy())
    expect(screen.queryByRole('option', { name: /John Okello/ })).toBeNull()
  })
})
