import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export interface Curriculum { id:string; programmeId:string; version:string; title:string; minimumCredits:number; effectiveFrom:string; effectiveTo?:string|null; status:string; isActive:boolean; programmeType:number }
export interface Course { id:string; authorityCode?:string|null; code:string; name:string; creditUnits:number; description?:string|null; courseType?:string|null; isActive:boolean }
export interface CurriculumCourse { id:string; curriculumId:string; courseId:string; yearOfStudy:number; semesterNumber:number; isCore:boolean }

export const getCurricula = () => request<Curriculum[]>('/api/curriculum-management/curricula')
export const getCourses = (authorityCode?: string) => request<Course[]>(authorityCode ? `/api/curriculum-management/courses?authorityCode=${encodeURIComponent(authorityCode)}` : '/api/curriculum-management/courses')
export const createCurriculum = (input: Omit<Curriculum,'id'|'status'|'isActive'>) => request<Curriculum>('/api/curriculum-management/curricula',{method:'POST',body:JSON.stringify(input)})
export const createCourse = (input: Omit<Course,'id'|'isActive'> & { authorityCode: string }) => request<Course>('/api/curriculum-management/courses',{method:'POST',body:JSON.stringify(input)})
export const getCurriculumCourses = (id:string) => {
  if (!id.trim()) throw new Error('Curriculum ID is required.')
  return request<CurriculumCourse[]>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses`)
}
export const addCurriculumCourse = (id:string,input:{courseId:string;yearOfStudy:number;semesterNumber:number;isCore:boolean}) => {
  if (!id.trim() || !input.courseId.trim()) throw new Error('Curriculum and course IDs are required.')
  if (input.yearOfStudy < 1 || input.semesterNumber < 1) throw new Error('Year and semester numbers must be positive.')
  return request<CurriculumCourse>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses`,{method:'POST',body:JSON.stringify(input)})
}

export interface UpdateCourseInput {
  authorityCode: string
  code: string
  name: string
  creditUnits: number
  description?: string
  courseType?: string
  isActive: boolean
}
export interface UpdateCurriculumInput {
  version: string
  title: string
  minimumCredits: number
  effectiveFrom: string
  effectiveTo?: string | null
  programmeType: number
  isActive: boolean
}
export const updateCourse = (id: string, input: UpdateCourseInput) => {
  if (!id.trim() || !input.code.trim() || !input.name.trim()) throw new Error('Course ID, code and name are required.')
  if (input.creditUnits < 0) throw new Error('Credit units cannot be negative.')
  return request<void>(`/api/curriculum-management/courses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
}
export const setCourseActive = (id: string, isActive: boolean) => request<void>(`/api/curriculum-management/courses/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
export const updateCurriculum = (id: string, input: UpdateCurriculumInput) => {
  if (!id.trim() || !input.version.trim() || !input.title.trim()) throw new Error('Curriculum ID, version and title are required.')
  if (input.minimumCredits < 0) throw new Error('Minimum credits cannot be negative.')
  return request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
}
export const setCurriculumActive = (id: string, isActive: boolean) => request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })

export const updateCurriculumCourse = (curriculumId: string, mappingId: string, input: { yearOfStudy: number; semesterNumber: number; isCore: boolean }) => {
  if (!curriculumId.trim() || !mappingId.trim()) throw new Error('Curriculum and mapping IDs are required.')
  if (input.yearOfStudy < 1 || input.semesterNumber < 1) throw new Error('Year and semester numbers must be positive.')
  return request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/courses/${encodeURIComponent(mappingId)}`, { method: 'PUT', body: JSON.stringify(input) })
}

export const deleteCurriculumCourse = (curriculumId: string, mappingId: string) =>
  request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/courses/${encodeURIComponent(mappingId)}`, { method: 'DELETE' })

export const deleteCourse = (id: string) => {
  if (!id.trim()) throw new Error('Course ID is required.')
  return request<void>(`/api/curriculum-management/courses/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export const updateCurriculumSemester = (curriculumId: string, year: number, semester: number, input: { yearOfStudy: number; semesterNumber: number }) => {
  if (!curriculumId.trim() || year < 1 || semester < 1 || input.yearOfStudy < 1 || input.semesterNumber < 1)
    throw new Error('Curriculum, year and semester numbers must be positive.')
  return request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/semesters/${year}/${semester}`, { method: 'PUT', body: JSON.stringify(input) })
}

export const deleteCurriculumSemester = (curriculumId: string, year: number, semester: number) =>
  request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/semesters/${year}/${semester}`, { method: 'DELETE' })

export interface LogbookCompetencyRequirement { id: string; logbookRequirementId: string; code: string; name: string; requiredCount: number; isMandatory: boolean; isActive: boolean }
export interface LogbookRequirement { id: string; curriculumId: string; title: string; description?: string | null; yearOfStudy: number; semesterNumber: number; requiredQuantity: number; isMandatory: boolean; isActive: boolean; competencies: LogbookCompetencyRequirement[] }
export interface StudentLogbook { id: string; studentId: string; logbookRequirementId: string; serialNumber: string; issuedOn: string; submittedOn?: string | null; status: string; issuedBy?: string | null; remarks?: string | null }
export interface StudentLogbookCompetency { id: string; studentLogbookId: string; competencyRequirementId: string; studentPlacementId?: string | null; outcome: string; assessedOn?: string | null; assessorName?: string | null; assessorRole?: string | null; evidenceReference?: string | null; remarks?: string | null }
export interface LogbookEligibility { studentId: string; curriculumId: string; hasRequirements: boolean; isComplete: boolean; notice: string; requirements: Array<{ id: string; title: string; requiredLogbooks: number; issuedLogbooks: number; logbooksComplete: boolean; competenciesComplete: boolean; competencies: Array<{ code: string; name: string; required: number; achieved: number; complete: boolean }> }> }
export interface UhpabFeeReference { id: string; category: string; programmeCode?: string | null; programmeName?: string | null; description: string; amount: number; currency: string; sourceUrl: string; sourceTitle: string; sourceCheckedOn: string; effectiveFrom: string; effectiveTo?: string | null; isActive: boolean }
export const getLogbookRequirements = (curriculumId: string) => request<LogbookRequirement[]>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/logbook-requirements`)
export const createLogbookRequirement = (curriculumId: string, input: { title: string; description?: string; yearOfStudy: number; semesterNumber: number; requiredQuantity: number; isMandatory: boolean }) => request<LogbookRequirement>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/logbook-requirements`, { method: 'POST', body: JSON.stringify(input) })
export const createLogbookCompetency = (requirementId: string, input: { code: string; name: string; requiredCount: number; isMandatory: boolean }) => request<LogbookCompetencyRequirement>(`/api/curriculum-management/logbook-requirements/${encodeURIComponent(requirementId)}/competencies`, { method: 'POST', body: JSON.stringify(input) })
export const getStudentLogbooks = (studentId: string, curriculumId?: string) => request<Array<{ logbook: StudentLogbook; requirement: LogbookRequirement; competencies: StudentLogbookCompetency[] }>>(`/api/curriculum-management/students/${encodeURIComponent(studentId)}/logbooks${curriculumId ? `?curriculumId=${encodeURIComponent(curriculumId)}` : ''}`)
export const assessStudentLogbookCompetency = (logbookId: string, assessmentId: string, input: { outcome: string; assessedOn?: string | null; assessorName?: string; assessorRole?: string; studentPlacementId?: string | null; evidenceReference?: string; remarks?: string }) => request<void>(`/api/curriculum-management/student-logbooks/${encodeURIComponent(logbookId)}/competencies/${encodeURIComponent(assessmentId)}`, { method: 'PUT', body: JSON.stringify(input) })
export const updateStudentLogbookStatus = (logbookId: string, status: string, remarks?: string) => request<void>(`/api/curriculum-management/student-logbooks/${encodeURIComponent(logbookId)}/status`, { method: 'PATCH', body: JSON.stringify({ status, remarks }) })
export const getLogbookEligibility = (studentId: string, curriculumId: string) => request<LogbookEligibility>(`/api/curriculum-management/students/${encodeURIComponent(studentId)}/logbook-eligibility/${encodeURIComponent(curriculumId)}`)
export const issueStudentLogbook = (studentId: string, input: { logbookRequirementId: string; serialNumber: string; issuedOn: string; issuedBy?: string; remarks?: string }) => request<StudentLogbook>(`/api/curriculum-management/students/${encodeURIComponent(studentId)}/logbooks`, { method: 'POST', body: JSON.stringify(input) })
export const getUhpabFeeReferences = (programmeCode?: string) => request<UhpabFeeReference[]>(`/api/curriculum-management/uhpab-fee-references${programmeCode ? `?programmeCode=${encodeURIComponent(programmeCode)}` : ''}`)
export const createUhpabFeeReference = (input: Omit<UhpabFeeReference, 'id' | 'isActive'>) => request<UhpabFeeReference>('/api/curriculum-management/uhpab-fee-references', { method: 'POST', body: JSON.stringify(input) })

export interface CurriculumApprovalHistory {
  id: string
  curriculumId: string
  fromStatus?: string | null
  toStatus: string
  notes?: string | null
  actor: string
  changedAtUtc: string
}
export interface CurriculumComparison {
  programmeCode: string
  programmeName: string
  versions: Array<{ id: string; version: string; title: string; effectiveFrom: string; effectiveTo?: string | null; status: string; minimumCredits: number }>
  firstOnly: Array<{ curriculumId: string; id: string; code: string; name: string; creditUnits: number; yearOfStudy: number; semesterNumber: number; isCore: boolean }>
  secondOnly: Array<{ curriculumId: string; id: string; code: string; name: string; creditUnits: number; yearOfStudy: number; semesterNumber: number; isCore: boolean }>
  changedPlacement: Array<{ curriculumId: string; id: string; code: string; name: string; creditUnits: number; yearOfStudy: number; semesterNumber: number; isCore: boolean }>
}
export const getCurriculumApprovalHistory = (id: string) =>
  request<CurriculumApprovalHistory[]>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/approval-history`)
const curriculumTransition = (id: string, action: 'submit-for-review' | 'approve' | 'reject' | 'retire', notes?: string) =>
  request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/${action}`, { method: 'POST', body: JSON.stringify({ notes }) })
export const submitCurriculumForReview = (id: string, notes?: string) => curriculumTransition(id, 'submit-for-review', notes)
export const approveCurriculum = (id: string, notes?: string) => curriculumTransition(id, 'approve', notes)
export const rejectCurriculum = (id: string, notes: string) => curriculumTransition(id, 'reject', notes)
export const retireCurriculum = (id: string, notes: string) => curriculumTransition(id, 'retire', notes)
export const cloneCurriculum = (id: string, input: { version: string; title: string; effectiveFrom: string; effectiveTo?: string | null }) =>
  request<Curriculum>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/clone`, { method: 'POST', body: JSON.stringify(input) })
export const compareCurricula = (id: string, otherId: string) =>
  request<CurriculumComparison>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/compare/${encodeURIComponent(otherId)}`)
