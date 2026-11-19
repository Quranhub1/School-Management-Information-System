import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('../api/timetable', () => ({
  listTimetable: vi.fn().mockResolvedValue([]),
  generateTimetable: vi.fn().mockResolvedValue({
    entries: [{ id: 'entry-1', teachingGroupId: 'group-1', courseId: 'course-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '08:00:00', endTime: '09:00:00', room: 'Room 1', sessionType: 'Lecture', isActive: true }],
    optimizationScore: 95,
    isConflictFree: true,
    conflicts: [],
    warnings: [],
    unscheduled: [],
  }),
  getTimetableTemplate: vi.fn().mockResolvedValue({ teachingGroupId: 'group-1', layoutJson: null, updatedAtUtc: null }),
  saveTimetableTemplate: vi.fn().mockResolvedValue([]),
  getTimetableOptions: vi.fn().mockResolvedValue({
    teachingGroups: [{ id: 'group-1', label: 'CPH-Y1-S1', programmeId: 'programme-1', semesterId: 'period-1', courseId: 'course-1' }],
    courses: [{ id: 'course-1', label: 'CPH 101 — Pharmacy Practice' }],
    teachers: [{ id: 'teacher-1', label: 'Test Teacher' }],
    semesters: [{ id: 'period-1', label: 'Semester 1 2026', academicYearId: 'year-1', academicYearLabel: '2026/2027', startDate: '2026-01-01', endDate: '2026-06-30', isCurrent: true, isActive: true }],
    programmes: [
      { id: 'programme-1', label: 'Certificate in Pharmacy (Certificate)', code: 'CPH' },
      { id: 'programme-duplicate', label: 'Certificate in Pharmacy (Certificate)', code: 'CPH' },
      { id: 'programme-2', label: 'Diploma in Pharmacy (Diploma)', code: 'DPH' },
      { id: 'programme-2-duplicate', label: 'Diploma in Pharmacy (Diploma)', code: 'DPH' },
    ],
    curricula: [
      { id: 'curriculum-1', programmeId: 'programme-1', label: 'Certificate in Pharmacy — 2026' },
      { id: 'curriculum-duplicate', programmeId: 'programme-duplicate', label: 'Certificate in Pharmacy — alternate record' },
      { id: 'curriculum-2', programmeId: 'programme-2', label: 'Diploma in Pharmacy — 2026' },
      { id: 'curriculum-2-duplicate', programmeId: 'programme-2-duplicate', label: 'Diploma in Pharmacy — alternate record' },
    ],
    curriculumCourses: [
      { curriculumId: 'curriculum-1', programmeId: 'programme-1', courseId: 'course-1', courseLabel: 'CPH 101 — Pharmacy Practice', yearOfStudy: 1, semesterNumber: 1, isCore: true },
      { curriculumId: 'curriculum-duplicate', programmeId: 'programme-duplicate', courseId: 'course-1', courseLabel: 'CPH 101 — Pharmacy Practice', yearOfStudy: 1, semesterNumber: 1, isCore: true },
      { curriculumId: 'curriculum-1', programmeId: 'programme-1', courseId: 'course-2', courseLabel: 'CPH 102 — Pharmaceutics', yearOfStudy: 1, semesterNumber: 2, isCore: true },
      { curriculumId: 'curriculum-1', programmeId: 'programme-1', courseId: 'course-3', courseLabel: 'CPH 201 — Clinical Pharmacy', yearOfStudy: 2, semesterNumber: 1, isCore: true },
      { curriculumId: 'curriculum-1', programmeId: 'programme-1', courseId: 'course-4', courseLabel: 'CPH 202 — Dispensing Practice', yearOfStudy: 2, semesterNumber: 2, isCore: true },
    ],
  }),
}))

vi.mock('./InstitutionSettingsContext', () => ({
  useInstitutionSettings: vi.fn(() => ({
    institution: { id: 'institution-1', institutionName: 'KAMPALA SCHOOL OF HEALTH SCIENCES', abbreviation: 'KSHS', motto: 'Health is Life', address: '', phone: '', email: '', website: '', postalAddress: '', country: 'Uganda', institutionType: 'School', logoPath: null, primaryColor: '#0505cc', accentColor: '#0735ed', isActive: true, updatedAt: '' },
    loaded: true,
  })),
}))

import { saveTimetableTemplate } from '../api/timetable'
import { TimetableManagement } from './TimetableManagement'

describe('TimetableManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the timetable management shell', () => {
    render(<TimetableManagement />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })


  it('prints generated class timetables for the full semester using Institution Settings', async () => {
    render(<TimetableManagement />)
    fireEvent.click(screen.getByRole('button', { name: /generate timetable/i }))
    fireEvent.change(await screen.findByLabelText('Programme'), { target: { value: 'programme-1' } })
    fireEvent.change(screen.getByLabelText('Curriculum'), { target: { value: 'curriculum-1' } })
    fireEvent.change(screen.getByLabelText('Year of study'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Curriculum semester'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Academic period'), { target: { value: 'period-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate schedule' }))
    expect(await screen.findByText('KAMPALA SCHOOL OF HEALTH SCIENCES')).toBeTruthy()
    expect(screen.getByText(/VALID FOR: 01 Jan 2026 – 30 Jun 2026/)).toBeTruthy()
  })

  it('shows live system data from the central timetable options API', async () => {
    render(<TimetableManagement />)
    fireEvent.click(screen.getByRole('button', { name: 'System Data & Sync' }))
    expect(await screen.findByText('System Data & SMIS Bridge')).toBeTruthy()
    expect(screen.getByText('Programmes')).toBeTruthy()
    expect(screen.getByText('Course units')).toBeTruthy()
    expect(screen.getByText('Staff / tutors')).toBeTruthy()
    expect(screen.getByText(/central database remains the source of truth/i)).toBeTruthy()
  })

  it('supports weekend visibility control', () => {
    render(<TimetableManagement />)
    const toggle = screen.getByRole('checkbox', { name: /show saturday/i })
    expect(toggle).toBeTruthy()
    fireEvent.click(toggle)
    expect((toggle as HTMLInputElement).checked).toBe(false)
  })

  it('renders the official document designer with editable heading, signature and merge controls', async () => {
    render(<TimetableManagement />)
    fireEvent.click(screen.getAllByRole('button', { name: /open semester template/i })[0])
    fireEvent.click(await screen.findByRole('button', { name: /load class/i }))
    expect(await screen.findByLabelText('Timetable document title')).toBeTruthy()
    expect(screen.getByLabelText('Day column heading')).toBeTruthy()
    expect(screen.getByLabelText('Registrar name')).toBeTruthy()
    expect(screen.getByLabelText('Registrar title')).toBeTruthy()
    expect(screen.getByLabelText('Footer text')).toBeTruthy()
    expect(screen.getByRole('button', { name: /edit monday 08:00 period/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /edit saturday 08:00 period/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /edit sunday 08:00 period/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /edit monday 08:00 period/i }))
    expect(screen.getByRole('dialog', { name: /edit timetable period/i })).toBeTruthy()
    expect(screen.getByLabelText('Merge down (days)')).toBeTruthy()
    expect(screen.getByLabelText('Merge across periods')).toBeTruthy()
    expect(screen.queryByText('REPUBLIC OF UGANDA')).toBeNull()
  })

  it('persists edited document metadata and merged-cell layout through the timetable API', async () => {
    render(<TimetableManagement />)
    fireEvent.click(screen.getAllByRole('button', { name: /open semester template/i })[0])
    fireEvent.click(await screen.findByRole('button', { name: /load class/i }))
    fireEvent.change(await screen.findByLabelText('Timetable document title'), { target: { value: 'OFFICIAL CLASS TIMETABLE' } })
    fireEvent.change(screen.getByLabelText('Registrar name'), { target: { value: 'JANE DOE' } })
    fireEvent.click(screen.getByRole('button', { name: /edit monday 08:00 period/i }))
    fireEvent.change(screen.getByLabelText('Merge down (days)'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    fireEvent.click(screen.getByRole('button', { name: /save timetable template/i }))
    await waitFor(() => expect(saveTimetableTemplate).toHaveBeenCalled())
    expect(saveTimetableTemplate).toHaveBeenCalledWith('group-1', [], expect.objectContaining({
      title: 'OFFICIAL CLASS TIMETABLE',
      registrarName: 'JANE DOE',
      cells: expect.objectContaining({ '1-0': expect.objectContaining({ rowSpan: '2' }) }),
    }))
  })

  it('supports readOnly mode', () => {
    render(<TimetableManagement readOnly />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('shows each programme code only once while retaining curricula attached to duplicate records', async () => {
    render(<TimetableManagement />)
    fireEvent.click(screen.getByRole('button', { name: /generate timetable/i }))
    const programmeSelect = await screen.findByLabelText('Programme') as HTMLSelectElement
    const programmeOptions = Array.from(programmeSelect.options).map(option => option.textContent)
    expect(programmeOptions.filter(label => label?.includes('(Certificate)'))).toHaveLength(1)
    expect(programmeOptions.filter(label => label?.includes('(Diploma)'))).toHaveLength(1)
    expect(programmeOptions).toHaveLength(3)
    fireEvent.change(programmeSelect, { target: { value: 'programme-1' } })
    const curriculumSelect = screen.getByLabelText('Curriculum') as HTMLSelectElement
    expect(Array.from(curriculumSelect.options).some(option => option.value === 'curriculum-duplicate')).toBe(true)
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
 
  it('shows a separate blank timetable template for every mapped curriculum semester', async () => {
    render(<TimetableManagement />)
    expect(await screen.findByRole('heading', { name: /semester templates/i })).toBeTruthy()
    expect(screen.getByText(/4 separate templates/)).toBeTruthy()
    expect(screen.getAllByRole('heading', { name: 'Semester 1' })).toHaveLength(2)
    expect(screen.getAllByRole('heading', { name: 'Semester 2' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /open semester template/i })).toHaveLength(4)
    expect(screen.getAllByText(/Blank template ready/)).toHaveLength(4)
    fireEvent.click(screen.getAllByRole('button', { name: /open semester template/i })[0])
    expect(await screen.findByRole('heading', { name: /edit the timetable grid/i })).toBeTruthy()
  })

})
