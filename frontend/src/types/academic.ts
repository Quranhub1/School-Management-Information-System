export interface TranscriptEntry {
  id: string
  studentId: string
  courseRegistrationId: string
  academicYearId: string
  semesterId: string
  courseCode: string
  courseTitle: string
  creditUnits: number
  score: number
  grade: string | null
  gradePoint: number
  isPass: boolean
}

export interface AcademicResultSummary {
  id: string
  studentId: string
  academicYearId: string
  semesterId: string
  totalCreditUnits: number
  totalGradePoints: number
  gpa: number
  cgpa: number | null
  standing: string
  isApproved: boolean
  approvedAt: string | null
}
