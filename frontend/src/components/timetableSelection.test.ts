import { describe, expect, it } from 'vitest'
import type { TimetableOptions } from '../api/timetable'
import { deriveTimetableSelection } from './timetableSelection'

const options: TimetableOptions = {
  programmes: [
    { id: 'programme-a', code: 'A', label: 'Programme A', durationYears: 3 },
    { id: 'programme-b', code: 'B', label: 'Programme B', durationYears: 2 },
  ],
  curricula: [
    { id: 'curriculum-a', programmeId: 'programme-a', label: 'A Curriculum' },
    { id: 'curriculum-a-old', programmeId: 'programme-a', label: 'A Old Curriculum' },
    { id: 'curriculum-b', programmeId: 'programme-b', label: 'B Curriculum' },
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
    expect(result.studyYears).toEqual([1])
    expect(result.courseUnits.map(item => item.id)).toEqual(['course-b1'])
  })

  it('loads mapped years, then only semesters belonging to the selected year', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '1', '', 'period-1', '')
    expect(result.studyYears).toEqual([1, 2, 3])
    expect(result.curriculumSemesters).toEqual([1, 2])
  })

  it('loads only course units mapped to the selected year and curriculum semester', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '1', '2', 'period-1', '')
    expect(result.courseUnits.map(item => item.id)).toEqual(['course-a2'])
  })

  it('loads teaching groups for the selected course unit and academic period', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '1', '1', 'period-1', 'course-a1')
    expect(result.teachingGroups.map(item => item.id)).toEqual(['group-a1'])
  })

  it('loads tutors assigned to the selected course unit plus unassigned teaching tutors', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a', '1', '1', 'period-1', 'course-a1')
    expect(result.tutors.map(item => item.id)).toEqual(['tutor-a1', 'tutor-general'])
  })

  it('uses programme duration only when curriculum year mappings are absent', () => {
    const result = deriveTimetableSelection(options, ['programme-a'], 'curriculum-a-old', '', '', 'period-1', '')
    expect(result.studyYears).toEqual([1, 2, 3])
    expect(result.curriculumSemesters).toEqual([])
    expect(result.courseUnits).toEqual([])
  })
})
