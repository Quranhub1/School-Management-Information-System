import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../api/timetable', () => ({
  listTimetable: vi.fn().mockResolvedValue([]),
  getTimetableOptions: vi.fn().mockResolvedValue({
    teachingGroups: [{ id: 'group-1', label: 'CPH-Y1-S1', programmeId: 'programme-1', semesterId: 'period-1', courseId: 'course-1' }],
    courses: [{ id: 'course-1', label: 'CPH 101 — Pharmacy Practice' }],
    teachers: [{ id: 'teacher-1', label: 'Test Teacher' }],
    semesters: [{ id: 'period-1', label: 'Semester 1 2026', academicYearId: 'year-1', isCurrent: true, isActive: true }],
    programmes: [{ id: 'programme-1', label: 'Certificate in Pharmacy' }],
    curricula: [{ id: 'curriculum-1', programmeId: 'programme-1', label: 'Certificate in Pharmacy — 2026' }],
    curriculumCourses: [{ curriculumId: 'curriculum-1', programmeId: 'programme-1', courseId: 'course-1', courseLabel: 'CPH 101 — Pharmacy Practice', yearOfStudy: 1, semesterNumber: 1, isCore: true }],
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

  it('shows programme curriculum selectors when a timetable workflow is opened', async () => {
    render(<TimetableManagement />)
    fireEvent.click(screen.getByRole('button', { name: /generate timetable/i }))
    expect(await screen.findByLabelText('Programme')).toBeTruthy()
    expect(screen.getByLabelText('Curriculum')).toBeTruthy()
    expect(screen.getByLabelText('Year of study')).toBeTruthy()
    expect(screen.getByLabelText('Curriculum semester')).toBeTruthy()
    expect(screen.getByText(/CPH 101 — Pharmacy Practice/)).toBeTruthy()
  })
})
