import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../api/timetable', () => ({
  listTimetable: vi.fn().mockResolvedValue([]),
  getTimetableOptions: vi.fn().mockResolvedValue({
    teachingGroups: [],
    courses: [],
    teachers: [],
    semesters: [],
  }),
}))

vi.mock('./InstitutionSettingsContext', () => ({
  useInstitutionSettings: vi.fn(() => ({
    institution: null,
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

  it('supports readOnly mode', () => {
    render(<TimetableManagement readOnly />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
