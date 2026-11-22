import type { TimetableOptions } from '../api/timetable'

export type TimetableSelection = {
  curricula: TimetableOptions['curricula']
  selectedCurriculum?: TimetableOptions['curricula'][number]
  studyYears: number[]
  curriculumSemesters: number[]
  courseUnits: TimetableOptions['courses']
  teachingGroups: TimetableOptions['teachingGroups']
  tutors: TimetableOptions['teachers']
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
      .map(item => Number(item.durationYears) || 0)
  )
  const studyYears = [
    ...new Set([
      ...Array.from({ length: durationYears }, (_, index) => index + 1),
      ...mappedYears,
    ]),
  ].sort((a, b) => a - b)

  const curriculumSemesters = [
    ...new Set(
      mappings
        .filter(item => !yearOfStudy || item.yearOfStudy === Number(yearOfStudy))
        .map(item => item.semesterNumber)
    ),
  ].sort((a, b) => a - b)

  const eligibleMappings = mappings.filter(
    item =>
      (!yearOfStudy || item.yearOfStudy === Number(yearOfStudy)) &&
      (!curriculumSemester || item.semesterNumber === Number(curriculumSemester))
  )
  const eligibleCourseIds = new Set(eligibleMappings.map(item => item.courseId))
  const courseUnits = options.courses.filter(item => eligibleCourseIds.has(item.id))
  const selectedCourseId = courseUnitId && eligibleCourseIds.has(courseUnitId)
    ? courseUnitId
    : ''
  const groupCourseIds = selectedCourseId ? new Set([selectedCourseId]) : eligibleCourseIds
  const teachingGroups = options.teachingGroups.filter(
    item =>
      item.programmeId === selectedCurriculum?.programmeId &&
      item.semesterId === academicPeriodId &&
      groupCourseIds.has(item.courseId)
  )
  const tutors = options.teachers.filter(
    item =>
      !item.courseUnitIds?.length ||
      !selectedCourseId ||
      item.courseUnitIds.includes(selectedCourseId)
  )

  return {
    curricula,
    selectedCurriculum,
    studyYears,
    curriculumSemesters,
    courseUnits,
    teachingGroups,
    tutors,
  }
}
