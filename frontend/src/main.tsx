import { apiRequest } from '../lib/api'

export interface AcademicClass {
  id: string
  programmeId: string
  academicPeriodId: string
  code: string
  name?: string | null
  yearOfStudy: number
  maxEnrolment?: number | null
  status: number
  createdAtUtc: string
}

export interface CreateAcademicClassRequest {
  programmeId: string
  academicPeriodId: string
  code: string
  name?: string
  yearOfStudy: number
  maxEnrolment?: number
}

export const getClassesByProgramme = (programmeId: string) => {
  if (!programmeId.trim()) throw new Error('Programme ID is required.')
  return apiRequest<AcademicClass[]>(`/api/academic-classes/by-programme/${encodeURIComponent(programmeId)}`)
}

export const getClassesByPeriod = (periodId: string) => {
  if (!periodId.trim()) throw new Error('Period ID is required.')
  return apiRequest<AcademicClass[]>(`/api/academic-classes/by-period/${encodeURIComponent(periodId)}`)
}

export const createAcademicClass = (input: CreateAcademicClassRequest) => {
  if (!input.code.trim()) throw new Error('Class code is required.')
  if (!input.programmeId.trim() || !input.academicPeriodId.trim()) throw new Error('Programme and period IDs are required.')
  return apiRequest<AcademicClass>('/api/academic-classes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

