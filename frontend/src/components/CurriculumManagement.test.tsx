import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import React from 'react'

const mockAuthorityList = [
  { id: 'authority-school', code: 'SCHOOL_BASED', name: 'School-based', isActive: true, sortOrder: 1 },
  { id: 'authority-uhpab', code: 'UHPAB', name: 'UHPAB', isActive: true, sortOrder: 2 },
]
const mockProgrammes = [
  { id: 'programme-school', code: 'SB-CPH', name: 'Certificate in Public Health', type: 0, regulator: 'SCHOOL_BASED', isActive: true, isReferenceOnly: false },
  { id: 'programme-pharmacy', code: 'CPH', name: 'Certificate in Pharmacy', type: 0, regulator: 'UHPAB', isActive: true, isReferenceOnly: false },
  { id: 'programme-short', code: 'UHPAB-SHORT', name: 'Basic Life Support', type: 1, regulator: 'UHPAB', isActive: true, isReferenceOnly: false },
]
const mockCurricula = [
  // The stale programmeType value must not hide a curriculum whose programme is FullProgramme.
  { id: 'curriculum-pharmacy', programmeId: 'programme-pharmacy', version: '1.0', title: 'Certificate in Pharmacy Curriculum', minimumCredits: 0, effectiveFrom: '2026-01-01', status: 'Active', isActive: true, programmeType: 1 },
]
const mockCourses = [
  { id: 'course-pharm-1', authorityCode: 'UHPAB', code: 'PH101', name: 'Introduction to Pharmacy', creditUnits: 3, isActive: true, courseType: 'Lecture' },
]

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
import { getCourses } from '../api/curriculumManagement'

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
  })
})
