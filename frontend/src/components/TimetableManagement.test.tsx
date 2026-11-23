import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('../api/timetable', () => ({
  listTimetable: vi.fn().mockResolvedValue([]),
  listSavedTimetableTemplates: vi.fn().mockResolvedValue([{ teachingGroupId: 'group-1', teachingGroupLabel: 'CPH-Y1-S1', programmeId: 'programme-1', curriculumId: 'curriculum-1', yearOfStudy: 1, semesterId: 'period-1', semesterLabel: 'Semester 1', updatedAtUtc: '2026-11-23T10:00:00Z', sessionCount: 3 }]),
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
    teachingGroups: [
      { id: 'group-1', label: 'CPH-Y1-S1', programmeId: 'programme-1', semesterId: 'period-1', courseId: 'course-1', curriculumId: 'curriculum-1', yearOfStudy: 1, semesterNumber: 1, isProgrammeYearClass: true },
      { id: 'group-2', label: 'CPH-Y1-S1-B', programmeId: 'programme-1', semesterId: 'period-1', courseId: 'course-not-in-selected-curriculum' },
    ],
    courses: [
      { id: 'course-1', label: 'CPH 101 — Pharmacy Practice' },
      { id: 'course-2', label: 'CPH 102 — Pharmaceutics' },
      { id: 'course-3', label: 'CPH 201 — Clinical Pharmacy' },
      { id: 'course-4', label: 'CPH 202 — Dispensing Practice' },
      { id: 'course-5', label: 'DPH 101 — Foundations' },
      { id: 'course-6', label: 'DPH 301 — Advanced Practice' },
    ],
    teachers: [{ id: 'teacher-1', label: 'Test Teacher' }],
    semesters: [{ id: 'period-1', label: 'Semester 1 2026', academicYearId: 'year-1', academicYearLabel: '2026/2027', startDate: '2026-01-01', endDate: '2026-06-30', isCurrent: true, isActive: true }],
    programmes: [
      { id: 'programme-1', label: 'Certificate in Pharmacy (Certificate)', code: 'CPH', durationYears: 0 },
      { id: 'programme-duplicate', label: 'Certificate in Pharmacy (Certificate)', code: 'CPH', durationYears: 2 },
      { id: 'programme-legacy-code', label: 'Certificate in Pharmacy (Certificate)', code: 'CPH-LEGACY', durationYears: 1 },
      { id: 'programme-2', label: 'Diploma in Pharmacy (Diploma)', code: 'DPH', durationYears: 0 },
      { id: 'programme-2-duplicate', label: 'Diploma in Pharmacy (Diploma)', code: 'DPH', durationYears: 3 },
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
      { curriculumId: 'curriculum-2', programmeId: 'programme-2', courseId: 'course-5', courseLabel: 'DPH 101 — Foundations', yearOfStudy: 1, semesterNumber: 2, isCore: true },
      { curriculumId: 'curriculum-2', programmeId: 'programme-2', courseId: 'course-6', courseLabel: 'DPH 301 — Advanced Practice', yearOfStudy: 3, semesterNumber: 1, isCore: true },
    ],
  }),
}))

vi.mock('../lib/pdfmake', () => ({
  downloadInstitutionalPdf: vi.fn(),
  printInstitutionalPdf: vi.fn(),
}))

vi.mock('./InstitutionSettingsContext', () => ({
  useInstitutionSettings: vi.fn(() => ({
    institution: { id: 'institution-1', institutionName: 'KAMPALA SCHOOL OF HEALTH SCIENCES', abbreviation: 'KSHS', motto: 'Health is Life', address: '', phone: '', email: '', website: '', postalAddress: '', country: 'Uganda', institutionType: 'School', logoPath: null, primaryColor: '#0505cc', accentColor: '#0735ed', isActive: true, updatedAt: '' },
    loaded: true,
  })),
}))

import { generateTimetable, getTimetableTemplate, saveTimetableTemplate } from '../api/timetable'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { TimetableManagement } from './TimetableManagement'

describe('TimetableManagement', () => {
  const renderTimetable = async (props: { readOnly?: boolean } = {}) => {
    let rendered: ReturnType<typeof render> | undefined
    await act(async () => {
      rendered = render(<TimetableManagement {...props} />)
      await Promise.resolve()
      await Promise.resolve()
    })
    return rendered!
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the timetable management shell', async () => {
    await renderTimetable()
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('shows the saved timetable library entry in the management header', async () => {
    await renderTimetable()
    const savedButton = screen.getByRole('button', { name: /saved timetables/i })
    expect(savedButton.closest('.timetable-hero-heading')).toBeTruthy()
    expect(savedButton.className).toContain('timetable-saved-entry')
    expect(savedButton.className).toContain('primary')
  })

  it('opens the saved timetable library, supports back navigation, and opens a saved class template', async () => {
    await renderTimetable()
    fireEvent.click(screen.getByRole('button', { name: /saved timetables/i }))
    expect(await screen.findByRole('heading', { name: 'Saved timetables' })).toBeTruthy()
    expect(screen.getByText(/Only timetables you save from the designer appear here/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /back to main editor/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /saved timetables/i })).toBeNull()
    expect(screen.getByRole('heading', { name: 'CPH-Y1-S1' })).toBeTruthy()
    expect(screen.getByText('3 scheduled sessions')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /open timetable/i }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Saved timetables' })).toBeNull())
    expect(screen.getByLabelText('Programme')).toBeTruthy()
    expect(screen.getByLabelText('Class / teaching group')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /saved timetables/i })).toBeNull()
    const programmeSelect = screen.getByLabelText('Programme') as HTMLSelectElement
    expect(Array.from(programmeSelect.options).map(option => option.textContent?.trim())).toEqual([
      'Select programme',
      'Certificate in Pharmacy (Certificate)',
      'Diploma in Pharmacy (Diploma)',
    ])

    fireEvent.click(screen.getByRole('button', { name: /back to main editor/i }))
    expect(await screen.findByRole('button', { name: /saved timetables/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /saved timetables/i }))
    expect(await screen.findByRole('heading', { name: 'Saved timetables' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /back to main editor/i }))
    expect(screen.getByRole('heading', { name: 'Timetable management' })).toBeTruthy()
  }, 15000)

  it('shows the editable official timetable designer as the primary management view', async () => {
    await renderTimetable()
    expect(screen.getByRole('region', { name: 'Editable timetable template' })).toBeTruthy()
    expect(screen.getByLabelText('Class / teaching group')).toBeTruthy()
  })


  it('keeps course-unit selection inside the template and limits it to the selected semester', async () => {
    await renderTimetable()
    expect(screen.queryByLabelText('Course unit selection')).toBeNull()

    fireEvent.change(await screen.findByLabelText('Programme'), { target: { value: 'programme-2' } })
    const curriculum = screen.getByLabelText('Curriculum') as HTMLSelectElement
    expect(curriculum.value).toBe('curriculum-2')

    const year = screen.getByLabelText('Year of study') as HTMLSelectElement
    expect(Array.from(year.options).map(option => option.value)).toEqual(['', '1', '2', '3'])
    fireEvent.change(year, { target: { value: '3' } })
    const curriculumSemester = screen.getByLabelText('Curriculum semester') as HTMLSelectElement
    expect(Array.from(curriculumSemester.options).map(option => option.value)).toEqual(['', 'DPH31'])
    fireEvent.change(curriculumSemester, { target: { value: 'DPH31' } })

    const templateButtons = await screen.findAllByRole('button', { name: /open semester template/i })
    fireEvent.click(templateButtons[templateButtons.length - 1])
    const courseUnits = screen.getAllByLabelText('Course unit') as HTMLSelectElement[]
    expect(courseUnits.length).toBeGreaterThan(0)
    expect(Array.from(courseUnits[0].options).map(option => option.value)).toEqual(['', 'course-6'])
    expect(Array.from(courseUnits[0].options).some(option => option.value === 'course-5')).toBe(false)
  }, 15000)

  it('prints generated class timetables for the full semester using Institution Settings', async () => {
    await renderTimetable()
    fireEvent.click(screen.getByRole('button', { name: /generate timetable/i }))
    fireEvent.change(await screen.findByLabelText('Programme'), { target: { value: 'programme-1' } })
    fireEvent.change(screen.getByLabelText('Curriculum'), { target: { value: 'curriculum-1' } })
    fireEvent.change(screen.getByLabelText('Year of study'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Curriculum semester'), { target: { value: 'CPH11' } })
    fireEvent.change(screen.getByLabelText('Academic period'), { target: { value: 'period-1' } })
    const teachingGroups = screen.getByLabelText('Teaching groups') as HTMLSelectElement
    teachingGroups.options[0].selected = true
    fireEvent.change(teachingGroups)
    fireEvent.click(screen.getByRole('button', { name: 'Generate schedule' }))
    expect(await screen.findByText('KAMPALA SCHOOL OF HEALTH SCIENCES')).toBeTruthy()
    expect(screen.getByText(/VALID FOR: 01 Jan 2026 – 30 Jun 2026/)).toBeTruthy()
  }, 15000)

  it('sends all explicitly selected teaching groups in one generation request', async () => {
    await renderTimetable()
    fireEvent.click(screen.getByRole('button', { name: /generate timetable/i }))
    fireEvent.change(await screen.findByLabelText('Programme'), { target: { value: 'programme-1' } })
    fireEvent.change(screen.getByLabelText('Curriculum'), { target: { value: 'curriculum-1' } })
    fireEvent.change(screen.getByLabelText('Year of study'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Curriculum semester'), { target: { value: 'CPH11' } })
    fireEvent.change(screen.getByLabelText('Academic period'), { target: { value: 'period-1' } })
    const teachingGroups = screen.getByLabelText('Teaching groups') as HTMLSelectElement
    Array.from(teachingGroups.options).forEach(option => { option.selected = true })
    fireEvent.change(teachingGroups)
    fireEvent.click(screen.getByRole('button', { name: 'Generate schedule' }))
    await waitFor(() => expect(generateTimetable).toHaveBeenCalledTimes(1))
    expect(generateTimetable).toHaveBeenCalledWith('period-1', ['group-1', 'group-2'], 'curriculum-1', 1, 1, 'programme-1')
  }, 15000)

  it('shows live system data from the central timetable options API', async () => {
    await renderTimetable()
    fireEvent.click(screen.getByRole('button', { name: 'System Data & Sync' }))
    expect(await screen.findByText('System Data & SMIS Bridge')).toBeTruthy()
    expect(screen.getByText('Programmes')).toBeTruthy()
    expect(screen.getByText('Course units')).toBeTruthy()
    expect(screen.getByText('Staff / tutors')).toBeTruthy()
    expect(screen.getByText(/central database remains the source of truth/i)).toBeTruthy()
  })

  it('supports weekend visibility control', async () => {
    await renderTimetable()
    const toggle = screen.getByRole('checkbox', { name: /show weekend days/i })
    expect(toggle).toBeTruthy()
    fireEvent.click(toggle)
    expect((toggle as HTMLInputElement).checked).toBe(false)
  })

  it('renders the official document designer with editable heading, signature and merge controls', async () => {
    await renderTimetable()
    fireEvent.click((await screen.findAllByRole('button', { name: /open semester template/i }))[0])
    const loadClassButton = await screen.findByRole('button', { name: /load class/i })
    await act(async () => {
      fireEvent.click(loadClassButton)
      await vi.mocked(getTimetableTemplate).mock.results.slice(-1)[0]?.value
    })
    expect(await screen.findByLabelText('Timetable document title')).toBeTruthy()
    expect(screen.getByLabelText('Day column heading')).toBeTruthy()
    expect(screen.getByLabelText('Registrar name')).toBeTruthy()
    expect(screen.getByLabelText('Registrar title')).toBeTruthy()
    expect(screen.getByLabelText('Footer text')).toBeTruthy()
    expect(screen.getAllByLabelText('Course unit').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Lecturer').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Merge days').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Merge periods').length).toBeGreaterThan(0)
    expect(screen.queryByText('REPUBLIC OF UGANDA')).toBeNull()
  }, 15000)

  it('renders a full-height vertical break divider in the timetable design', async () => {
    const { container } = await renderTimetable()
    fireEvent.click((await screen.findAllByRole('button', { name: /open semester template/i }))[0])
    const loadClassButton = await screen.findByRole('button', { name: /load class/i })
    await act(async () => {
      fireEvent.click(loadClassButton)
      await vi.mocked(getTimetableTemplate).mock.results.slice(-1)[0]?.value
    })
    fireEvent.change(screen.getByLabelText('Divider after period'), { target: { value: '1' } })
    expect(container.querySelector('.timetable-template-divider-header[aria-label="BREAK"]')).toBeTruthy()
  })

  it('persists edited document metadata and merged-cell layout through the timetable API', async () => {
    await renderTimetable()
    fireEvent.click((await screen.findAllByRole('button', { name: /open semester template/i }))[0])
    const loadClassButton = await screen.findByRole('button', { name: /load class/i })
    await act(async () => {
      fireEvent.click(loadClassButton)
      await vi.mocked(getTimetableTemplate).mock.results.slice(-1)[0]?.value
    })
    fireEvent.change(await screen.findByLabelText('Timetable document title'), { target: { value: 'OFFICIAL CLASS TIMETABLE' } })
    fireEvent.change(screen.getByLabelText('Registrar name'), { target: { value: 'JANE DOE' } })
    fireEvent.change(screen.getAllByLabelText('Course unit')[0], { target: { value: 'course-1' } })
    fireEvent.change(screen.getAllByLabelText('Lecturer')[0], { target: { value: 'teacher-1' } })
    fireEvent.change(screen.getAllByLabelText('Merge days')[0], { target: { value: '2' } })
    fireEvent.change(screen.getAllByLabelText('Merge periods')[0], { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save timetable' }))
    await waitFor(() => expect(saveTimetableTemplate).toHaveBeenCalled())
    expect(saveTimetableTemplate).toHaveBeenCalledWith('group-1', expect.arrayContaining([
      expect.objectContaining({ dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00', courseId: 'course-1', teacherId: 'teacher-1' }),
      expect.objectContaining({ dayOfWeek: 2, startTime: '08:00:00', endTime: '10:00:00', courseId: 'course-1', teacherId: 'teacher-1' }),
    ]), expect.objectContaining({
      title: 'OFFICIAL CLASS TIMETABLE',
      registrarName: 'JANE DOE',
      cells: expect.objectContaining({ '1-0': expect.objectContaining({ rowSpan: '2', colSpan: '2' }) }),
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(downloadInstitutionalPdf).toHaveBeenCalledWith(expect.objectContaining({
      orientation: 'landscape',
      title: 'OFFICIAL CLASS TIMETABLE',
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Print' }))
    expect(printInstitutionalPdf).toHaveBeenCalledWith(expect.objectContaining({
      orientation: 'landscape',
      title: 'OFFICIAL CLASS TIMETABLE',
    }))
    const pdfOptions = vi.mocked(downloadInstitutionalPdf).mock.calls[0][0]
    expect(pdfOptions.content[1]).toMatchObject({
      table: {
        body: expect.arrayContaining([
          expect.arrayContaining([expect.objectContaining({ rowSpan: 2, colSpan: 2 })]),
        ]),
      },
    })
  }, 15000)

  it('supports readOnly mode', async () => {
    await renderTimetable({ readOnly: true })
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('loads the full programme → curriculum → semester → year → academic period → course-unit cascade', async () => {
    await renderTimetable()
    fireEvent.click(screen.getByRole('button', { name: /generate timetable/i }))

    const programme = await screen.findByLabelText('Programme') as HTMLSelectElement
    fireEvent.change(programme, { target: { value: 'programme-1' } })

    const curriculum = screen.getByLabelText('Curriculum') as HTMLSelectElement
    await waitFor(() => expect(curriculum.value).toBe('curriculum-1'))
    expect(Array.from(curriculum.options).find(option => option.value === 'curriculum-1')?.textContent?.trim()).toBe('2026 Curriculum')
    expect(Array.from(curriculum.options).every(option => (option.textContent?.trim().length ?? 0) <= 36)).toBe(true)
    expect(Array.from(curriculum.options).find(option => option.value === 'curriculum-duplicate')?.textContent?.trim()).toBe('Alternate curriculum')
    expect(Array.from(curriculum.options).map(option => option.value)).toContain('curriculum-duplicate')

    const semesters = screen.getByLabelText('Curriculum semester') as HTMLSelectElement
    expect(Array.from(semesters.options).map(option => option.value)).toEqual(['', 'CPH11', 'CPH12', 'CPH21', 'CPH22'])
    expect(Array.from(semesters.options).slice(1).map(option => option.textContent?.trim())).toEqual(['CPH11', 'CPH12', 'CPH21', 'CPH22'])
    const years = screen.getByLabelText('Year of study') as HTMLSelectElement
    expect(Array.from(years.options).map(option => option.value)).toEqual(['', '1', '2'])
    fireEvent.change(semesters, { target: { value: 'CPH21' } })
    expect(years.value).toBe('2')
    expect(Array.from(semesters.options).map(option => option.value)).toEqual(['', 'CPH21', 'CPH22'])
    fireEvent.change(years, { target: { value: '1' } })
    expect(Array.from(semesters.options).map(option => option.value)).toEqual(['', 'CPH11', 'CPH12'])
    fireEvent.change(semesters, { target: { value: 'CPH11' } })
    expect(years.value).toBe('1')

    const courseSelect = screen.getAllByLabelText('Course unit')[0] as HTMLSelectElement
    expect(Array.from(courseSelect.options).map(option => option.value)).toEqual(['', 'course-1'])
    expect(Array.from(courseSelect.options).some(option => option.value === 'course-2')).toBe(false)
  }, 15000)

  it('uses programme duration for year options but does not invent unmapped semesters or course units', async () => {
    await renderTimetable()
    fireEvent.click(screen.getByRole('button', { name: /generate timetable/i }))
    const programme = await screen.findByLabelText('Programme') as HTMLSelectElement
    fireEvent.change(programme, { target: { value: 'programme-2' } })

    const curriculum = screen.getByLabelText('Curriculum') as HTMLSelectElement
    await waitFor(() => expect(curriculum.value).toBe('curriculum-2'))
    const semesters = screen.getByLabelText('Curriculum semester') as HTMLSelectElement
    expect(Array.from(semesters.options).map(option => option.value)).toEqual(['', 'DPH12', 'DPH31'])

    const years = screen.getByLabelText('Year of study') as HTMLSelectElement
    expect(Array.from(years.options).map(option => option.value)).toEqual(['', '1', '2', '3'])
    fireEvent.change(years, { target: { value: '2' } })
    expect(Array.from(semesters.options).map(option => option.value)).toEqual(['', 'DPH12', 'DPH31'])
    expect(screen.getByText(/No course units are mapped to this programme, year and semester/i)).toBeTruthy()
  }, 15000)

  it('shows each programme code only once while retaining curricula attached to duplicate records', async () => {
    await renderTimetable()
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

  it('lists all active teaching groups for the selected programme and academic period in Load class', async () => {
    await renderTimetable()
    fireEvent.click((await screen.findAllByRole('button', { name: /open semester template/i }))[0])
    const classSelect = await screen.findByLabelText('Class / teaching group') as HTMLSelectElement
    expect(Array.from(classSelect.options).map(option => option.textContent)).toContain('CPH-Y1-S1')
    expect(Array.from(classSelect.options).map(option => option.textContent)).toContain('CPH-Y1-S1-B')
  })

  it('shows programme curriculum selectors when a timetable workflow is opened', async () => {
    await renderTimetable()
    fireEvent.click(screen.getByRole('button', { name: /generate timetable/i }))
    expect(await screen.findByLabelText('Programme')).toBeTruthy()
    expect(screen.getByLabelText('Curriculum')).toBeTruthy()
    expect(screen.getByLabelText('Year of study')).toBeTruthy()
    expect(screen.getByLabelText('Curriculum semester')).toBeTruthy()
    expect(screen.getAllByRole('option', { name: /CPH 101 — Pharmacy Practice/ }).length).toBeGreaterThan(0)
  })
 
  it('shows a separate blank timetable template for every mapped curriculum semester', async () => {
    await renderTimetable()
    expect(await screen.findByRole('heading', { name: /semester templates/i })).toBeTruthy()
    expect(screen.getByText(/4 separate templates/)).toBeTruthy()
    expect(screen.getAllByRole('heading', { name: 'Semester 1' })).toHaveLength(2)
    expect(screen.getAllByRole('heading', { name: 'Semester 2' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /open semester template/i })).toHaveLength(4)
    expect(screen.getAllByText(/Blank template ready/)).toHaveLength(4)
    fireEvent.click((await screen.findAllByRole('button', { name: /open semester template/i }))[0])
    expect(await screen.findByRole('heading', { name: /edit the timetable grid/i })).toBeTruthy()
  })

})
