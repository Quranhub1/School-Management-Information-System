export type AssessmentResultStatus = 'Draft' | 'Approved' | 'Published';

export interface AssessmentResultSummary {
  studentId: string;
  studentName: string;
  registrationId?: string;
  totalScore: number;
  maximumScore: number;
  percentage: number;
  grade?: string;
  competencyStatus?: string;
  status: AssessmentResultStatus;
}

export function calculatePercentage(totalScore: number, maximumScore: number): number {
  if (maximumScore <= 0) return 0;
  return Math.round((totalScore / maximumScore) * 10000) / 100;
}

export function calculateGrade(percentage: number): string {
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

export function buildAssessmentResult(
  input: Omit<AssessmentResultSummary, 'percentage' | 'grade' | 'status'> & { status?: AssessmentResultStatus }
): AssessmentResultSummary {
  const percentage = calculatePercentage(input.totalScore, input.maximumScore);
  return {
    ...input,
    percentage,
    grade: input.competencyStatus ? undefined : calculateGrade(percentage),
    status: input.status ?? 'Draft'
  };
}
