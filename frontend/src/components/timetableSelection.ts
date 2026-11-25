import type { TimetableOptions } from '../api/timetable'

export type TimetableSelection = {
  curricula: TimetableOptions['curricula']
  selectedCurriculum?: TimetableOptions['curricula'][number]
  studyYears: number[]
  curriculumSemesters: Array<{ value: string; code: string; year: number; semesterNumber: number }>
  selectedCurriculumSemester?: { value: string; code: string; year: number; semesterNumber: number }
  courseUnits: TimetableOptions['courses']
  teachingGroups: TimetableOptions['teachingGroups']
  allTeachingGroups: TimetableOptions['teachingGroups']
  tutors: TimetableOptions['teachers']
}

export function filterTutorsForCourse(
  tutors: TimetableOptions['teachers'],
  courseUnitId: string
): TimetableOptions['teachers'] {
  return tutors.filter(
    item =>
      !item.courseUnitIds?.length ||
      !courseUnitId ||
      item.courseUnitIds.includes(courseUnitId)
  )
}

/**
 * Derives each timetable dropdown from the preceding academic selection.
 * Curriculum mappings are the source of truth for semester and course-unit
 * availability; programme duration fills configured years even when some years have no mappings.
 */
export function deriveTimetableSelection(
  options: TimetableOptions,
  programmeIds: string[],
  curriculumId: string,
  yearOfStudy: string,
  curriculumSemester: string,
  academicPeriodId: string,
  courseUnitId: string
): TimetableSelection {
  const programmeIdSet = new Set(programmeIds)
  const curricula = options.curricula.filter(item => programmeIdSet.has(item.programmeId))
  const selectedCurriculum =
    curricula.find(item => item.id === curriculumId) ?? curricula[0]
  const mappings = options.curriculumCourses.filter(
    item => item.curriculumId === selectedCurriculum?.id
  )

  const mappedYears = [...new Set(mappings.map(item => item.yearOfStudy))].sort((a, b) => a - b)
  const durationYears = Math.max(
    0,
    ...options.programmes
      .filter(item => programmeIdSet.has(item.id))
      .map(item => {
        const duration = Number(item.durationYears) || 0
        const unit = item.durationUnit?.trim().toLowerCase() || 'years'
        if (unit.startsWith('month')) return Math.ceil(duration / 12)
        if (unit.startsWith('semester')) return Math.ceil(duration / 2)
        return duration
      })
  )
  const studyYears = [
    ...new Set([
      ...Array.from({ length: durationYears }, (_, index) => index + 1),
      ...mappedYears,
    ]),
  ].sort((a, b) => a - b)

  const programmeCode = options.programmes.find(item => item.id === selectedCurriculum?.programmeId)?.code ?? ''
  const semesterCodePrefix = programmeCode.trim()
    .replace(/^(?:UHPAB|UVTAB|KSHS|SB)[-_]/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
  // Show every semester mapped to this curriculum, across all study years.
  // Selecting a semester synchronizes the year selector in the UI.
  const allCurriculumSemesters = [
    ...new Map(mappings.map(item => {
      const value = `${item.yearOfStudy}-${item.semesterNumber}`
      return [value, {
        value,
        year: item.yearOfStudy,
        semesterNumber: item.semesterNumber,
        code: semesterCodePrefix ? `${semesterCodePrefix}${item.yearOfStudy}${item.semesterNumber}` : `Y${item.yearOfStudy}S${item.semesterNumber}`,
      }] as const
    })).values(),
  ].sort((a, b) => a.year - b.year || a.semesterNumber - b.semesterNumber)
  // Once a study year is selected, show only semesters mapped to that year.
  const curriculumSemesters = yearOfStudy
    ? allCurriculumSemesters.filter(item => item.year === Number(yearOfStudy))
    : allCurriculumSemesters
  // Older editor/template state stored the semester number (for example "1")
  // while the selector now stores a generated code (for example "CN11").
  // Accept both representations so existing timetable/template selections
  // continue to resolve their course mappings.
  const selectedCurriculumSemester = allCurriculumSemesters.find(
    item =>
      item.code === curriculumSemester ||
      item.value === curriculumSemester ||
      (yearOfStudy && item.year === Number(yearOfStudy) && String(item.semesterNumber) === curriculumSemester)
  )

  const eligibleMappings = mappings.filter(
    item =>
      (!yearOfStudy || item.yearOfStudy === Number(yearOfStudy)) &&
      (!curriculumSemester || (item.yearOfStudy === selectedCurriculumSemester?.year && item.semesterNumber === selectedCurriculumSemester?.semesterNumber))
  )
  const eligibleCourseIds = new Set(eligibleMappings.map(item => item.courseId))
  const courseUnits = options.courses.filter(item => eligibleCourseIds.has(item.id))
  const selectedCourseId = courseUnitId && eligibleCourseIds.has(courseUnitId)
    ? courseUnitId
    : ''
  const matchingCohortGroups = options.teachingGroups.filter(
    item =>
      programmeIdSet.has(item.programmeId) &&
      item.semesterId === academicPeriodId &&
      (!item.curriculumId || item.curriculumId === selectedCurriculum?.id) &&
      (!item.yearOfStudy || !yearOfStudy || item.yearOfStudy === Number(yearOfStudy)) &&
      (!selectedCurriculumSemester || !item.semesterNumber || item.semesterNumber === selectedCurriculumSemester.semesterNumber)
  )
  const allTeachingGroups = matchingCohortGroups
  const teachingGroups = allTeachingGroups
  const tutors = filterTutorsForCourse(options.teachers, selectedCourseId)

  return {
    curricula,
    selectedCurriculum,
    studyYears,
    curriculumSemesters,
    selectedCurriculumSemester,
    courseUnits,
    teachingGroups,
    allTeachingGroups,
    tutors,
  }
}
