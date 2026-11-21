import type { AcademicResultSummary, TranscriptEntry } from '../types/academic'
import { getAccessToken } from './auth'
import { parseApiInput } from '../lib/validation'
import { assessmentPlanCreateRequestSchema, recordAssessmentRequestSchema } from '../schemas'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export interface AssessmentPlan {
  id: string
  courseId: string
  name: string
  assessmentType: string
  weightPercentage: number
  isCompetencyBased: boolean
  isActive: boolean
}

export interface StudentAssessment {
  id: string
  studentId: string
  courseRegistrationId: string
  assessmentPlanId: string
  score: number
  maximumScore: number
  grade?: string | null
  competencyLevel?: string | null
  isFinalized: boolean
  recordedAt: string
}

async function getJson<T>(path: string): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to access examination results.')
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

async function sendJson<T>(path: string, body: unknown): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to record assessments.')
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function getExaminationTranscript(studentId: string): Promise<TranscriptEntry[]> {
  return getJson<TranscriptEntry[]>(`/api/examinations/results/students/${studentId}/transcript`)
}

export function getExaminationSummaries(studentId: string): Promise<AcademicResultSummary[]> {
  return getJson<AcademicResultSummary[]>(`/api/examinations/results/students/${studentId}/summaries`)
}

export function getAssessmentPlans(courseId?: string): Promise<AssessmentPlan[]> {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''
  return getJson<AssessmentPlan[]>(`/api/assessments/plans${query}`)
}


export function createAssessmentPlan(input: {
  courseId: string
  name: string
  assessmentType: string
  weightPercentage: number
  isCompetencyBased: boolean
}): Promise<AssessmentPlan> {
  const validated = parseApiInput(assessmentPlanCreateRequestSchema, input, 'create assessment plan')
  return sendJson<AssessmentPlan>('/api/assessments/plans', validated)
}

export function getStudentAssessments(courseRegistrationId: string): Promise<StudentAssessment[]> {
  return getJson<StudentAssessment[]>(`/api/assessments/registrations/${courseRegistrationId}`)
}

export function recordAssessment(input: {
  studentId: string
  courseRegistrationId: string
  assessmentPlanId: string
  score: number
  maximumScore: number
  competencyLevel?: string
}): Promise<StudentAssessment> {
  const validated = parseApiInput(recordAssessmentRequestSchema, input, 'record student assessment')
  return sendJson<StudentAssessment>('/api/assessments', validated)
}

export async function finalizeAssessment(id: string): Promise<StudentAssessment> {\n  if (!id.trim()) throw new Error('Assessment ID is required.')
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/api/assessments/records/${encodeURIComponent(id)}/finalize`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to finalize assessments.')
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<StudentAssessment>
}
