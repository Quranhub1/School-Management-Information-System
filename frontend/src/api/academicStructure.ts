import { getAcademicYears as getYears, getAcademicPeriods } from './academicCalendar'
export type { AcademicYear, AcademicPeriod } from './academicCalendar'

export const getAcademicYears = getYears
export const getPeriodsForYear = getAcademicPeriods
