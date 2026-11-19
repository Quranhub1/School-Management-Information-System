import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import React from 'react'

const { mockAuthorityList, mockProgrammes, mockCurricula, mockCourses } = vi.hoisted(() => ({
  mockAuthorityList: [
    { id: 'authority-school', code: 'SCHOOL_BASED', name: 'School-based', isActive: true, sortOrder: 1 },
    { id: 'authority-uhpab', code: 'UHPAB', name: 'UHPAB', isActive: true, sortOrder: 2 },
    { id: 'authority-uvtab', code: 'UVTAB', name: 'UVTAB', isActive: true, sortOrder: 3 },
  ],
  mockProgrammes: [
    { id: 'programme-school', code: 'SB-CPH', name: 'Certificate in Public Health', award: 'Certificate', durationYears: 2, durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalStatus: 'Approved', type: 0, regulator: 'SCHOOL_BASED', isActive: true, isReferenceOnly: false },
    { id: 'programme-pharmacy', code: 'CPH', name: 'Certificate in Pharmacy', award: 'Certificate', durationYears: 2, durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalStatus: 'Approved', type: 0, regulator: 'UHPAB', isActive: true, isReferenceOnly: false },
    { id: 'programme-short', code: 'UHPAB-SHORT', name: 'Basic Life Support', award: 'Certificate', durationYears: 1, durationUnit: 'Days', studyMode: 'Full-time', deliveryType: 'ShortCourse', approvalStatus: 'Approved', type: 1, regulator: 'UHPAB', isActive: true, isReferenceOnly: false },
    { id: 'programme-uvtab', code: 'UVTAB-DBA', name: 'Diploma in Business Administration', award: 'Diploma', durationYears: 0, durationUnit: 'Not published', studyMode: 'Full-time', deliveryType: 'CompetencyBased', approvalStatus: 'NeedsVerification', type: 0, regulator: 'UVTAB', isActive: true, isReferenceOnly: false },
  ],
  mockCurricula: [
    // The stale programmeType value must not hide a curriculum whose programme is FullProgramme.
    { id: 'curriculum-pharmacy', programmeId: 'programme-pharmacy', version: '1.0', title: 'Certificate in Pharmacy Curriculum', minimumCredits: 0, effectiveFrom: '2026-01-01', status: 'Active', isActive: true, isDeleted: false, programmeType: 1 },
    { id: 'curriculum-short-inactive', programmeId: 'programme-short', version: '1.0', title: 'Inactive short curriculum', minimumCredits: 0, effectiveFrom: '2026-01-01', status: 'Inactive', isActive: false, isDeleted: false, programmeType: 1 },
    { id: 'curriculum-school', programmeId: 'programme-school', version: '1.0', title: 'KSHS School-Based Curriculum', minimumCredits: 0, effectiveFrom: '2026-01-01', status: 'Active', isActive: true, isDeleted: false, programmeType: 0 },
    { id: 'curriculum-uvtab', programmeId: 'programme-uvtab', version: '1.0', title: 'UVTAB Business Curriculum', minimumCredits: 0, effectiveFrom: '2026-01-01', status: 'Active', isActive: true, isDeleted: false, programmeType: 0 },
  ],
  mockCourses: [
    { id: 'course-pharm-1', authorityCode: 'UHPAB', code: 'PH101', name: 'Introduction to Pharmacy', creditUnits: 3, isActive: true, isDeleted: false, courseType: 'Lecture' },
  ],
}))

vi.mock('../api/curriculumManagement', () => ({
  addCurriculumCourse: vi.fn(),
  updateCurriculumCourse: vi.fn(),
  deleteCurriculumCourse: vi.fn(),
  deleteCourse: vi.fn(),
  updateCurriculumSemester: vi.fn(),
  deleteCurriculumSemester: vi.fn(),
  createCourse: vi.fn(),
  createCurriculum: vi.fn(),
  updateCurriculum: vi.fn(),
  setCurriculumActive: vi.fn(),
  updateCourse: vi.fn(),
  setCourseActive: vi.fn(),
  getCourses: vi.fn(async (authorityCode?: string) => authorityCode === 'UHPAB' ? mockCourses : []),
  getCurricula: vi.fn(async () => mockCurricula),
  getCurriculumCourses: vi.fn(async () => []),
  getLogbookRequirements: vi.fn(async () => []),
  createLogbookRequirement: vi.fn(),
  createLogbookCompetency: vi.fn(),
  getStudentLogbooks: vi.fn(async () => []),
  getLogbookEligibility: vi.fn(async () => null),
  assessStudentLogbookCompetency: vi.fn(),
  updateStudentLogbookStatus: vi.fn(),
  issueStudentLogbook: vi.fn(),
  getUhpabFeeReferences: vi.fn(async () => []),
  createUhpabFeeReference: vi.fn(),
}))
vi.mock('../api/programmes', () => ({
  createProgramme: vi.fn(),
  deleteProgramme: vi.fn(),
  getProgrammes: vi.fn(async () => mockProgrammes),
  setProgrammeActive: vi.fn(),
  updateProgramme: vi.fn(),
}))
vi.mock('../api/academicAuthorities', () => ({
  createAcademicAuthority: vi.fn(),
  getAcademicAuthorities: vi.fn(async () => mockAuthorityList),
  setAcademicAuthorityActive: vi.fn(),
  updateAcademicAuthority: vi.fn(),
}))
vi.mock('../api/academicDepartments', () => ({
  createAcademicDepartment: vi.fn(),
  createAcademicFaculty: vi.fn(),
  getAcademicCampuses: vi.fn(async () => []),
  getAcademicDepartments: vi.fn(async () => []),
  getAcademicFaculties: vi.fn(async () => []),
  setAcademicDepartmentActive: vi.fn(),
  setAcademicFacultyActive: vi.fn(),
  updateAcademicDepartment: vi.fn(),
  updateAcademicFaculty: vi.fn(),
}))
vi.mock('../utils/academicAuthorities', () => ({
  resolveAcademicAuthority: (value?: string | null) => (value ?? '').trim().toUpperCase().replace(/[ -]+/g, '_'),
}))
vi.mock('../utils/confirmDialog', () => ({ showConfirmDialog: vi.fn(async () => true) }))

import { CurriculumManagement } from './CurriculumManagement'
import { addCurriculumCourse, createCourse, getCourses } from '../api/curriculumManagement'
import { getProgrammes } from '../api/programmes'

describe('CurriculumManagement selectors', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads authority, programme, curriculum, course and course-unit options in sequence', async () => {
    render(<CurriculumManagement canManage />)

    const authoritySelect = await screen.findByLabelText('Authority')
    await waitFor(() => expect(within(authoritySelect).getByRole('option', { name: 'UHPAB' })).toBeInTheDocument())

    fireEvent.change(authoritySelect, { target: { value: 'UHPAB' } })
    await waitFor(() => expect(getCourses).toHaveBeenCalledWith('UHPAB'))

    const programmeSelect = screen.getByLabelText('Select programme')
    expect(within(programmeSelect).getByRole('option', { name: /CPH — Certificate in Pharmacy/ })).toBeInTheDocument()

    const curriculumSelect = screen.getByLabelText('Select curriculum')
    expect(within(curriculumSelect).getByRole('option', { name: /Certificate in Pharmacy Curriculum/ })).toBeInTheDocument()
    fireEvent.change(curriculumSelect, { target: { value: 'curriculum-pharmacy' } })

    const courseSelect = screen.getByLabelText('Select course')
    await waitFor(() => expect(courseSelect).not.toBeDisabled())
    expect(within(courseSelect).getByRole('option', { name: /PH101 — Introduction to Pharmacy/ })).toBeInTheDocument()

    const courseUnitTypeSelect = screen.getByLabelText('Course unit type')
    expect(within(courseUnitTypeSelect).getByRole('option', { name: 'Select course unit type' })).toBeInTheDocument()
    expect(within(courseUnitTypeSelect).getByRole('option', { name: 'Practical' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Short Courses' }))
    expect(within(screen.getByLabelText('Select programme')).getByRole('option', { name: /UHPAB-SHORT — Basic Life Support/ })).toBeInTheDocument()
    expect(within(screen.getByLabelText('Select curriculum')).queryByRole('option', { name: /Inactive short curriculum/ })).not.toBeInTheDocument()
  })

  it('lets administrators create and place a school-based unit directly in a curriculum semester', async () => {
    vi.mocked(createCourse).mockResolvedValue({
      id: 'course-school-new', authorityCode: 'SCHOOL_BASED', code: 'KSHS101',
      name: 'Foundations of Public Health', creditUnits: 3, courseType: 'Lecture', isActive: true, isDeleted: false,
    })
    vi.mocked(addCurriculumCourse).mockResolvedValue({
      id: 'mapping-school-new', curriculumId: 'curriculum-school', courseId: 'course-school-new',
      yearOfStudy: 1, semesterNumber: 1, isCore: true, isDeleted: false,
    })

    render(<CurriculumManagement canManage />)
    const authoritySelect = await screen.findByLabelText('Authority')
    await waitFor(() => expect(authoritySelect).toHaveValue('SCHOOL_BASED'))

    const curriculumSelect = screen.getByLabelText('Select curriculum')
    fireEvent.change(curriculumSelect, { target: { value: 'curriculum-school' } })

    expect(await screen.findByRole('heading', { name: 'Add school-based course unit directly to this curriculum' })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Course/unit code'), { target: { value: 'KSHS101' } })
    fireEvent.change(screen.getByPlaceholderText('Course/unit name'), { target: { value: 'Foundations of Public Health' } })
    fireEvent.change(screen.getByLabelText('School-based course unit type'), { target: { value: 'Lecture' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save and add to semester' }))

    await waitFor(() => expect(createCourse).toHaveBeenCalledWith(expect.objectContaining({
      authorityCode: 'SCHOOL_BASED', code: 'KSHS101', name: 'Foundations of Public Health',
    })))
    await waitFor(() => expect(addCurriculumCourse).toHaveBeenCalledWith('curriculum-school', expect.objectContaining({
      courseId: 'course-school-new', yearOfStudy: 1, semesterNumber: 1, isCore: true, isDeleted: false,
    })))
  })

  it('offers competence-area and competence-unit entry for UVTAB curricula', async () => {
    vi.mocked(createCourse).mockResolvedValue({
      id: 'uvtab-competence-1', authorityCode: 'UVTAB', code: 'UVTAB-COMP-01',
      name: 'Apply workplace safety', creditUnits: 0, courseType: 'Competence Area', isActive: true, isDeleted: false,
    })
    vi.mocked(addCurriculumCourse).mockResolvedValue({
      id: 'mapping-uvtab-1', curriculumId: 'curriculum-uvtab', courseId: 'uvtab-competence-1',
      yearOfStudy: 1, semesterNumber: 1, isCore: true, isDeleted: false,
    })

    render(<CurriculumManagement canManage />)
    const authoritySelect = await screen.findByLabelText('Authority')
    await waitFor(() => expect(authoritySelect).toHaveValue('SCHOOL_BASED'))
    fireEvent.change(authoritySelect, { target: { value: 'UVTAB' } })
    await waitFor(() => expect(authoritySelect).toHaveValue('UVTAB'))
    fireEvent.change(screen.getByLabelText('Select curriculum'), { target: { value: 'curriculum-uvtab' } })

    expect(await screen.findByRole('heading', { name: 'Add UVTAB competence area / unit' })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Competence code'), { target: { value: 'UVTAB-COMP-01' } })
    fireEvent.change(screen.getByPlaceholderText('Competence area / unit name'), { target: { value: 'Apply workplace safety' } })
    fireEvent.change(screen.getByLabelText('Competence type'), { target: { value: 'Competence Area' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save and add to semester' }))

    await waitFor(() => expect(createCourse).toHaveBeenCalledWith(expect.objectContaining({
      authorityCode: 'UVTAB', code: 'UVTAB-COMP-01', courseType: 'Competence Area',
    })))
    await waitFor(() => expect(addCurriculumCourse).toHaveBeenCalledWith('curriculum-uvtab', expect.objectContaining({
      courseId: 'uvtab-competence-1', yearOfStudy: 1, semesterNumber: 1,
    })))
  })

  it('lets administrators add and correct UHPAB course units for a selected programme curriculum', async () => {
    vi.mocked(createCourse).mockResolvedValue({
      id: 'uhpab-unit-new', authorityCode: 'UHPAB', code: 'UHPAB-PH201',
      name: 'Pharmaceutical Chemistry', creditUnits: 4, courseType: 'Lecture', isActive: true, isDeleted: false,
    })
    vi.mocked(addCurriculumCourse).mockResolvedValue({
      id: 'mapping-uhpab-new', curriculumId: 'curriculum-pharmacy', courseId: 'uhpab-unit-new',
      yearOfStudy: 2, semesterNumber: 1, isCore: true, isDeleted: false,
    })

    render(<CurriculumManagement canManage />)
    const authoritySelect = await screen.findByLabelText('Authority')
    await waitFor(() => expect(authoritySelect).toHaveValue('SCHOOL_BASED'))
    fireEvent.change(authoritySelect, { target: { value: 'UHPAB' } })
    await waitFor(() => expect(authoritySelect).toHaveValue('UHPAB'))
    fireEvent.change(screen.getByLabelText('Select curriculum'), { target: { value: 'curriculum-pharmacy' } })

    expect(await screen.findByRole('heading', { name: 'Add or correct UHPAB course unit for this programme' })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('UHPAB course-unit code'), { target: { value: 'UHPAB-PH201' } })
    fireEvent.change(screen.getByPlaceholderText('UHPAB course-unit name'), { target: { value: 'Pharmaceutical Chemistry' } })
    fireEvent.change(screen.getByLabelText('UHPAB course unit type'), { target: { value: 'Lecture' } })
    fireEvent.change(screen.getByLabelText('Year of study'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save and add to semester' }))

    await waitFor(() => expect(createCourse).toHaveBeenCalledWith(expect.objectContaining({
      authorityCode: 'UHPAB', code: 'UHPAB-PH201', name: 'Pharmaceutical Chemistry', creditUnits: 0,
    })))
    await waitFor(() => expect(addCurriculumCourse).toHaveBeenCalledWith('curriculum-pharmacy', expect.objectContaining({
      courseId: 'uhpab-unit-new', yearOfStudy: 2, semesterNumber: 1, isCore: true, isDeleted: false,
    })))
  })

  it('does not let a pending refresh override a newly selected authority', async () => {
    render(<CurriculumManagement canManage />)

    const authoritySelect = await screen.findByLabelText('Authority')
    await waitFor(() => expect(within(authoritySelect).getByRole('option', { name: 'UHPAB' })).toBeInTheDocument())
    fireEvent.change(authoritySelect, { target: { value: 'UHPAB' } })
    await waitFor(() => expect(getCourses).toHaveBeenCalledWith('UHPAB'))
    await waitFor(() => expect(screen.queryByText('Loading curriculum data…')).not.toBeInTheDocument())

    let resolveProgrammes!: (programmes: Awaited<ReturnType<typeof getProgrammes>>) => void
    const pendingProgrammes = new Promise<Awaited<ReturnType<typeof getProgrammes>>>(resolve => {
      resolveProgrammes = resolve
    })
    vi.mocked(getProgrammes).mockReturnValueOnce(pendingProgrammes)

    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    await waitFor(() => expect(getProgrammes).toHaveBeenCalledTimes(2))
    fireEvent.change(authoritySelect, { target: { value: 'SCHOOL_BASED' } })
    await waitFor(() => expect(authoritySelect).toHaveValue('SCHOOL_BASED'))

    resolveProgrammes(mockProgrammes)
    await waitFor(() => expect(authoritySelect).toHaveValue('SCHOOL_BASED'))
  })
})
