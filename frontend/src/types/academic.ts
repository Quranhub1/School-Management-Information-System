export interface TranscriptEntry {
  id: string
  studentId: string
  academicYearId: string
  semesterId: string
  courseCode: string
  courseName: string
  creditUnits: number
  score: number
  grade: string
  gradePoint: number
}

export interface AcademicResultSummary {
  id: string
  studentId: string
  academicYearId: string
  semesterId: string
  gpa: number
  cgpa: number
  standing: string
}
