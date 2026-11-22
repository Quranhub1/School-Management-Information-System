import { describe, expect, it } from 'vitest'
import type { TimetableOptions } from '../api/timetable'
import { deriveTimetableSelection, filterTutorsForCourse } from './timetableSelection'

const options: TimetableOptions = {
  programmes: [
    { id: 'programme-a', code: 'A', label: 'Programme A', durationYears: 3 },
    { id: 'programme-b', code: 'B', label: 'Programme B', durationYears: 2 },
    { id: 'programme-bridge', code: 'SB-BRIDGE', label: 'Bridging Programme', durationYears: 9, durationUnit: 'Months' },
  ],
  curricula: [
    { id: 'curriculum-a', programmeId: 'programme-a', label: 'A Curriculum' },
    { id: 'curriculum-a-old', programmeId: 'programme-a', label: 'A Old Curriculum' },
    { id: 'curriculum-b', programmeId: 'programme-b', label: 'B Curriculum' },
    { id: 'curriculum-bridge', programmeId: 'programme-bridge', label: 'Bridge Curriculum' },
  ],
  curriculumCourses: [
    { curriculumId: 'curriculum-a', programmeId: 'programme-a', courseId: 'course-a1', courseLabel: 'A101 — Anatomy', yearOfStudy: 1, semesterNumber: 1, isCore: true },
    { curriculumId: 'curriculum-a', programmeId: 'programme-a', courseId: 'course-a2', courseLabel: 'A102 — Physiology', yearOfStudy: 1, semesterNumber: 2, isCore: true },
    { curriculumId: 'curriculum-a', programmeId: 'programme-a', courseId: 'course-a3', courseLabel: 'A201 — Pharmacology', yearOfStudy: 2, semesterNumber: 1, isCore: true },
    { curriculumId: 'curriculum-b', programmeId: 'programme-b', courseId: 'course-b1', courseLabel: 'B101 — ICT', yearOfStudy: 1, semesterNumber: 1, isCore: true },
  ],
  courses: [
    { id: 'course-a1', label: 'A101 — Anatomy' },
    { id: 'course-a2', label: 'A102 — Physiology' },
    { id: 'course-a3', label: 'A201 — Pharmacology' },
    { id: 'course-b1', label: 'B101 — ICT' },
  ],
  teachingGroups: [
    { id: 'group-a1', label: 'A1', programmeId: 'programme-a', semesterId: 'period-1', courseId: 'course-a1' },
    { id: 'group-a1b', label: 'A1B', programmeId: 'programme-a', semesterId: 'period-1', courseId: 'course-a1' },
    { id: 'group-a2', label: 'A2', programmeId: 'programme-a', semesterId: 'period-1', courseId: 'course-a2' },
    { id: 'group-a3', label: 'A3', programmeId: 'programme-a', semesterId: 'period-2', courseId: 'course-a3' },
    { id: 'group-b1', label: 'B1', programmeId: 'programme-b', semesterId: 'period-1', courseId: 'course-b1' },
  ],
  teachers: [
    { id: 'tutor-a1', label: 'Tutor A1', courseUnitIds: ['course-a1'] },
    { id: 'tutor-a2', label: 'Tutor A2', courseUnitIds: ['course-a2'] },
    { id: 'tutor-general', label: 'Unassigned teaching tutor', courseUnitIds: [] },
  ],
  semesters: [],
}

describe('timetable programme-to-template selection flow', () => {
  it('loads only the curricula belonging to the selected programme', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], '', '', '', 'period-1', '')
    expect(result.curricula.map(item => item.id)).toEqual(['curriculum-a', 'curriculum-a-old'])
    expect(result.selectedCurriculum?.id).toBe('curriculum-a')
  })

  it('drops a stale curriculum when the programme changes', () => {
    const result = deriveTimetableSelection(options, ['programme-b'], 'curriculum-a', '', '', 'period-1', '')
    expect(result.selectedCurriculum?.id).toBe('curriculum-b')
    expect(result.studyYears).toEqual([1, 2])
    expect(result.courseUnits.map(item => item.id)).toEqual(['course-b1'])
  })

  it('loads only semesters belonging to the selected year of study', () => {
    const yearOne = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '1', '', 'period-1', '')
    const yearTwo = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '2', '', 'period-1', '')
    const allYears = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '', '', 'period-1', '')
    expect(yearOne.studyYears).toEqual([1, 2, 3])
    expect(yearOne.curriculumSemesters.map(item => item.code)).toEqual(['A11', 'A12'])
    expect(yearTwo.curriculumSemesters.map(item => item.code)).toEqual(['A21'])
    expect(allYears.curriculumSemesters.map(item => item.code)).toEqual(['A11', 'A12', 'A21'])
  })

  it('loads only course units mapped to the selected year and curriculum semester', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '1', 'A12', 'period-1', '')
    expect(result.courseUnits.map(item => item.id)).toEqual(['course-a2'])
  })

  it('loads teaching groups for the selected course unit and academic period', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '1', 'A11', 'period-1', 'course-a1')
    expect(result.teachingGroups.map(item => item.id)).toEqual(['group-a1'])
    expect(result.allTeachingGroups.map(item => item.id)).toEqual(['group-a1', 'group-a1b'])
  })

  it('loads tutors assigned to the selected course unit plus unassigned teaching tutors', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '1', 'A11', 'period-1', 'course-a1')
    expect(result.tutors.map(item => item.id)).toEqual(['tutor-a1', 'tutor-general'])
  })


  it('converts month-based programme duration into study years', () => {
    const result = deriveTimetableSelection(options, ['programme-bridge'], 'curriculum-bridge', '', '', 'period-1', '')
    expect(result.studyYears).toEqual([1])
  })

  it('retains all five semester mappings for a five-semester certificate', () => {
    const nursingOptions: TimetableOptions = {
      ...options,
      programmes: [{ id: 'programme-cn', code: 'CN', label: 'Certificate in Nursing', durationYears: 0 }],
      curricula: [{ id: 'curriculum-cn', programmeId: 'programme-cn', label: 'CN curriculum' }],
      curriculumCourses: [
        { curriculumId: 'curriculum-cn', programmeId: 'programme-cn', courseId: 'cn-11', courseLabel: 'CNUR 1101', yearOfStudy: 1, semesterNumber: 1, isCore: true },
        { curriculumId: 'curriculum-cn', programmeId: 'programme-cn', courseId: 'cn-12', courseLabel: 'CNUR 1201', yearOfStudy: 1, semesterNumber: 2, isCore: true },
        { curriculumId: 'curriculum-cn', programmeId: 'programme-cn', courseId: 'cn-21', courseLabel: 'CNUR 2101', yearOfStudy: 2, semesterNumber: 1, isCore: true },
        { curriculumId: 'curriculum-cn', programmeId: 'programme-cn', courseId: 'cn-22', courseLabel: 'CNUR 2201', yearOfStudy: 2, semesterNumber: 2, isCore: true },
        { curriculumId: 'curriculum-cn', programmeId: 'programme-cn', courseId: 'cn-31', courseLabel: 'CNUR 3101', yearOfStudy: 3, semesterNumber: 1, isCore: true },
      ],
      courses: [
        { id: 'cn-11', label: 'CNUR 1101' },
        { id: 'cn-12', label: 'CNUR 1201' },
        { id: 'cn-21', label: 'CNUR 2101' },
        { id: 'cn-22', label: 'CNUR 2201' },
        { id: 'cn-31', label: 'CNUR 3101' },
      ],
      teachingGroups: [],
    }
    const result = deriveTimetableSelection(nursingOptions, ['programme-cn'], 'curriculum-cn', '', '', 'period-1', '')
    expect(result.curriculumSemesters.map(item => item.code)).toEqual(['CN11', 'CN12', 'CN21', 'CN22', 'CN31'])
  })

  it('filters assigned tutors by course unit and retains tutors without a course restriction', () => {
    expect(filterTutorsForCourse(options.teachers, 'course-a2').map(item => item.id))
      .toEqual(['tutor-a2', 'tutor-general'])
  })

  it('uses programme duration only when curriculum year mappings are absent', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a-old', '', '', 'period-1', '')
    expect(result.studyYears).toEqual([1, 2, 3])
    expect(result.curriculumSemesters).toEqual([])
    expect(result.courseUnits).toEqual([])
  })
})
