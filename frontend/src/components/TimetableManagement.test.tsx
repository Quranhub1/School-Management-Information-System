import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../api/administration', () => ({
  getUsers: vi.fn().mockResolvedValue([])
}))

vi.mock('./InstitutionSettingsContext', () => ({
  useInstitutionSettings: vi.fn(() => ({
    institution: { id: 'institution-1', institutionName: 'KAMPALA SCHOOL OF HEALTH SCIENCES', abbreviation: 'KSHS', motto: 'Health is Life', address: '', phone: '', email: '', website: '', postalAddress: '', country: 'Uganda', institutionType: 'School', logoPath: null, primaryColor: '#0505cc', accentColor: '#0735ed', isActive: true, updatedAt: '' },
    loaded: true,
  })),
}))

import { TimetableManagement } from './TimetableManagement'

describe('TimetableManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the timetable management shell', () => {
    render(<TimetableManagement />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('displays the institution name from system settings', () => {
    render(<TimetableManagement />)
    expect(screen.getByText('KAMPALA SCHOOL OF HEALTH SCIENCES')).toBeTruthy()
  })

  it('renders the timetable grid with days and time slots', () => {
    render(<TimetableManagement />)
    expect(screen.getByText('MON')).toBeTruthy()
    expect(screen.getByText('8:00 AM – 10:30 AM')).toBeTruthy()
    expect(screen.getByText('5:00 PM – 6:30 PM')).toBeTruthy()
  })

  it('supports readOnly mode', () => {
    render(<TimetableManagement readOnly />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('toggles edit mode on the timetable', () => {
    render(<TimetableManagement />)
    expect(screen.getByRole('button', { name: 'Editing On' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Editing On' }))
    expect(screen.getByRole('button', { name: 'Edit Mode' })).toBeTruthy()
  })

  it('shows an empty registrar hint when no registrar is registered', () => {
    render(<TimetableManagement />)
    expect(screen.getByText(/No Academic Registrar registered in system/)).toBeTruthy()
  })

  it('opens the System Data & Sync modal', () => {
    render(<TimetableManagement />)
    fireEvent.click(screen.getByRole('button', { name: 'System Data & Sync' }))
    expect(screen.getByText('System Data & SMIS Bridge')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'API & Sync' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Course Units' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tutors' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeTruthy()
  })

})
