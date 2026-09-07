import { getAccessToken } from './auth'

export interface RegulatoryRegistration {
  id: string
  studentId: string
  registrationNumber: string
  regulatoryBody: string
  programmeCode: string
  programmeName: string
  level: string
  registrationDate?: string
  assessmentDate?: string
  status: string
  verificationCode?: string
  createdAt: string
}

export interface RegulatoryAssessment {
  id: string
  assessmentCode: string
  title: string
  regulatoryBody: string
  programmeCode: string
  assessmentType: string
  startDate?: string
  endDate?: string
  durationMinutes: number
  passMark: number
  totalMarks: number
  status: string
  createdAt: string
}

export interface ContinuousAssessment {
  id: string
  studentId: string
  assessmentId: string
  assessmentType: string
  title: string
  score: number
  maxScore: number
  assessorRemarks?: string
  logbookReference?: string
  reportReference?: string
  submissionDate?: string
  status: string
  createdAt: string
}

export interface AssessmentResult {
  id: string
  studentId: string
  assessmentId: string
  regulatoryBody: string
  score: number
  grade: string
  passed: boolean
  remarks?: string
  releasedAt?: string
  status: string
}

export interface AssessmentCentre {
  id: string
  centreCode: string
  centreName: string
  regulatoryBody: string
  address: string
  contactPerson?: string
  phone?: string
  email?: string
  status: string
  accreditedAt?: string
  expiresAt?: string
  createdAt: string
}

export interface RegulatoryCircular {
  id: string
  circularNumber: string
  title: string
  regulatoryBody: string
  content: string
  issueDate: string
  deadline?: string
  attachmentUrl?: string
  isActive: boolean
  createdAt: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view this data.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getRegulatoryRegistrations = (regulatoryBody?: string) => request<RegulatoryRegistration[]>('/api/regulatory/registrations' + (regulatoryBody ? `?regulatoryBody=${encodeURIComponent(regulatoryBody)}` : ''))
export const createRegulatoryRegistration = (body: { studentId: string; registrationNumber: string; regulatoryBody: string; programmeCode: string; programmeName: string; level: string; registrationDate?: string; assessmentDate?: string }) => request<RegulatoryRegistration>('/api/regulatory/registrations', { method: 'POST', body: JSON.stringify(body) })
export const getRegulatoryAssessments = (regulatoryBody?: string) => request<RegulatoryAssessment[]>('/api/regulatory/assessments' + (regulatoryBody ? `?regulatoryBody=${encodeURIComponent(regulatoryBody)}` : ''))
export const createRegulatoryAssessment = (body: { assessmentCode: string; title: string; regulatoryBody: string; programmeCode: string; assessmentType: string; startDate?: string; endDate?: string; durationMinutes: number; passMark: number; totalMarks: number }) => request<RegulatoryAssessment>('/api/regulatory/assessments', { method: 'POST', body: JSON.stringify(body) })
export const getContinuousAssessments = (studentId?: string) => request<ContinuousAssessment[]>('/api/regulatory/continuous-assessments' + (studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''))
export const createContinuousAssessment = (body: { studentId: string; assessmentId: string; assessmentType: string; title: string; score: number; maxScore: number; assessorRemarks?: string; logbookReference?: string; reportReference?: string; submissionDate?: string }) => request<ContinuousAssessment>('/api/regulatory/continuous-assessments', { method: 'POST', body: JSON.stringify(body) })
export const getAssessmentResults = (regulatoryBody?: string) => request<AssessmentResult[]>('/api/regulatory/results' + (regulatoryBody ? `?regulatoryBody=${encodeURIComponent(regulatoryBody)}` : ''))
export const createAssessmentResult = (body: { studentId: string; assessmentId: string; regulatoryBody: string; score: number; grade: string; passed: boolean; remarks?: string }) => request<AssessmentResult>('/api/regulatory/results', { method: 'POST', body: JSON.stringify(body) })
export const getAssessmentCentres = () => request<AssessmentCentre[]>('/api/regulatory/centres')
export const createAssessmentCentre = (body: { centreCode: string; centreName: string; regulatoryBody: string; address: string; contactPerson?: string; phone?: string; email?: string }) => request<AssessmentCentre>('/api/regulatory/centres', { method: 'POST', body: JSON.stringify(body) })
export const getRegulatoryCirculars = (regulatoryBody?: string) => request<RegulatoryCircular[]>('/api/regulatory/circulars' + (regulatoryBody ? `?regulatoryBody=${encodeURIComponent(regulatoryBody)}` : ''))
export const createRegulatoryCircular = (body: { circularNumber: string; title: string; regulatoryBody: string; content: string; issueDate: string; deadline?: string; attachmentUrl?: string }) => request<RegulatoryCircular>('/api/regulatory/circulars', { method: 'POST', body: JSON.stringify(body) })
