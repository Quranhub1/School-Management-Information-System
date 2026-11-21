import { getAccessToken } from './auth'
import { parseApiInput } from '../lib/validation'
import { bulkCurriculumCourseMappingRequestSchema, createCourseRequestSchema, createCurriculumRequestSchema, curriculumCourseMappingRequestSchema, logbookCompetencyRequestSchema, logbookRequirementRequestSchema, studentLogbookCompetencyAssessmentRequestSchema, updateCourseRequestSchema, updateCurriculumRequestSchema } from '../schemas'

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

export interface Curriculum { id:string; programmeId:string; version:string; title:string; minimumCredits:number; effectiveFrom:string; effectiveTo?:string|null; status:string; isActive:boolean; isDeleted:boolean; deletedAt?:string|null; programmeType:number }
export interface Course { id:string; authorityCode?:string|null; code:string; name:string; creditUnits:number; description?:string|null; courseType?:string|null; isActive:boolean; isDeleted:boolean; deletedAt?:string|null }
export interface CurriculumCourse { id:string; curriculumId:string; courseId:string; yearOfStudy:number; semesterNumber:number; isCore:boolean; isDeleted:boolean; deletedAt?:string|null }
export interface CoursePrerequisiteDto { id:string; prerequisiteCourseId:string; prerequisiteCode:string; prerequisiteName:string; isMandatory:boolean; minimumGrade?:string|null }
export interface CreditLoadInfo { year:number; semester:number; courseCount:number; totalCredits:number }

export const getCurricula = () => request<Curriculum[]>('/api/curriculum-management/curricula')
export const getCurriculum = (id:string) => request<Curriculum>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}`)
export const getCourses = (authorityCode?: string) => request<Course[]>(authorityCode ? `/api/curriculum-management/courses?authorityCode=${encodeURIComponent(authorityCode)}` : '/api/curriculum-management/courses')
export const createCurriculum = (input: Omit<Curriculum,'id'|'status'|'isActive'|'isDeleted'|'deletedAt'>) => { const validated = parseApiInput(createCurriculumRequestSchema, input, 'create curriculum'); return request<Curriculum>('/api/curriculum-management/curricula',{method:'POST',body:JSON.stringify(validated)}) }
export const createCourse = (input: Omit<Course,'id'|'isActive'|'isDeleted'|'deletedAt'> & { authorityCode: string }) => { const validated = parseApiInput(createCourseRequestSchema, input, 'create course'); return request<Course>('/api/curriculum-management/courses',{method:'POST',body:JSON.stringify(validated)}) }
export const getCurriculumCourses = (id:string) => {
  if (!id.trim()) throw new Error('Curriculum ID is required.')
  return request<CurriculumCourse[]>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses`)
}
export const addCurriculumCourse = (id:string,input:{courseId:string;yearOfStudy:number;semesterNumber:number;isCore:boolean}) => {
  if (!id.trim()) throw new Error('Curriculum ID is required.')
  const validated = parseApiInput(curriculumCourseMappingRequestSchema, input, 'add curriculum course')
  return request<CurriculumCourse>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses`,{method:'POST',body:JSON.stringify(validated)})
}
export const bulkAddCurriculumCourses = (id:string,input:{courseIds:string[];yearOfStudy:number;semesterNumber:number;isCore:boolean}) => {
  if (!id.trim()) throw new Error('Curriculum ID is required.')
  const validated = parseApiInput(bulkCurriculumCourseMappingRequestSchema, input, 'bulk add curriculum courses')
  return request<CurriculumCourse[]>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}/courses/bulk`,{method:'POST',body:JSON.stringify(validated)})
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
  if (!id.trim()) throw new Error('Course ID is required.')
  const validated = parseApiInput(updateCourseRequestSchema, input, 'update course')
  return request<void>(`/api/curriculum-management/courses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(validated) })
}
export const setCourseActive = (id: string, isActive: boolean) => request<void>(`/api/curriculum-management/courses/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
export const updateCurriculum = (id: string, input: UpdateCurriculumInput) => {
  if (!id.trim()) throw new Error('Curriculum ID is required.')
  const validated = parseApiInput(updateCurriculumRequestSchema, input, 'update curriculum')
  return request<void>(`/api/curriculum-management/curricula/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(validated) })
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
export const createLogbookRequirement = (curriculumId: string, input: { title: string; description?: string; yearOfStudy: number; semesterNumber: number; requiredQuantity: number; isMandatory: boolean }) => { if (!curriculumId.trim()) throw new Error('Curriculum ID is required.'); const validated = parseApiInput(logbookRequirementRequestSchema, input, 'create logbook requirement'); return request<LogbookRequirement>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/logbook-requirements`, { method: 'POST', body: JSON.stringify(validated) }) }
export const createLogbookCompetency = (requirementId: string, input: { code: string; name: string; requiredCount: number; isMandatory: boolean }) => { if (!requirementId.trim()) throw new Error('Logbook requirement ID is required.'); const validated = parseApiInput(logbookCompetencyRequestSchema, input, 'create logbook competency'); return request<LogbookCompetencyRequirement>(`/api/curriculum-management/logbook-requirements/${encodeURIComponent(requirementId)}/competencies`, { method: 'POST', body: JSON.stringify(validated) }) }
export const getStudentLogbooks = (studentId: string, curriculumId?: string) => request<Array<{ logbook: StudentLogbook; requirement: LogbookRequirement; competencies: StudentLogbookCompetency[] }>>(`/api/curriculum-management/students/${encodeURIComponent(studentId)}/logbooks${curriculumId ? `?curriculumId=${encodeURIComponent(curriculumId)}` : ''}`)
export const assessStudentLogbookCompetency = (logbookId: string, assessmentId: string, input: { outcome: string; assessedOn?: string | null; assessorName?: string; assessorRole?: string; studentPlacementId?: string | null; evidenceReference?: string; remarks?: string }) => { if (!logbookId.trim() || !assessmentId.trim()) throw new Error('Logbook and competency assessment IDs are required.'); const validated = parseApiInput(studentLogbookCompetencyAssessmentRequestSchema, input, 'assess logbook competency'); return request<void>(`/api/curriculum-management/student-logbooks/${encodeURIComponent(logbookId)}/competencies/${encodeURIComponent(assessmentId)}`, { method: 'PUT', body: JSON.stringify(validated) }) }
export const updateStudentLogbookStatus = (logbookId: string, status: string, remarks?: string) => request<void>(`/api/curriculum-management/student-logbooks/${encodeURIComponent(logbookId)}/status`, { method: 'PATCH', body: JSON.stringify({ status, remarks }) })
export const getLogbookEligibility = (studentId: string, curriculumId: string) => request<LogbookEligibility>(`/api/curriculum-management/students/${encodeURIComponent(studentId)}/logbook-eligibility/${encodeURIComponent(curriculumId)}`)
export const issueStudentLogbook = (studentId: string, input: { logbookRequirementId: string; serialNumber: string; issuedOn: string; issuedBy?: string; remarks?: string }) => request<StudentLogbook>(`/api/curriculum-management/students/${encodeURIComponent(studentId)}/logbooks`, { method: 'POST', body: JSON.stringify(input) })
export const getUhpabFeeReferences = (programmeCode?: string) => request<UhpabFeeReference[]>(`/api/curriculum-management/uhpab-fee-references${programmeCode ? `?programmeCode=${encodeURIComponent(programmeCode)}` : ''}`)
export const createUhpabFeeReference = (input: Omit<UhpabFeeReference, 'id' | 'isActive'>) => request<UhpabFeeReference>('/api/curriculum-management/uhpab-fee-references', { method: 'POST', body: JSON.stringify(input) })

export const getPrerequisites = (courseId: string) => request<CoursePrerequisiteDto[]>(`/api/curriculum-management/courses/${encodeURIComponent(courseId)}/prerequisites`)
export const addPrerequisite = (courseId: string, input: { prerequisiteCourseId: string; isMandatory?: boolean; minimumGrade?: string }) => request<void>(`/api/curriculum-management/courses/${encodeURIComponent(courseId)}/prerequisites`, { method: 'POST', body: JSON.stringify(input) })
export const removePrerequisite = (courseId: string, prerequisiteId: string) => request<void>(`/api/curriculum-management/courses/${encodeURIComponent(courseId)}/prerequisites/${encodeURIComponent(prerequisiteId)}`, { method: 'DELETE' })
export const getCreditLoad = (curriculumId: string) => request<CreditLoadInfo[]>(`/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/credit-load`)
export const submitCurriculumForReview = (id: string, notes?: string) => request<void>(`/api/curriculum-governance/curricula/${encodeURIComponent(id)}/submit-for-review`, { method: 'POST', body: JSON.stringify({ notes }) })
export const approveCurriculum = (id: string, notes?: string) => request<void>(`/api/curriculum-governance/curricula/${encodeURIComponent(id)}/approve`, { method: 'POST', body: JSON.stringify({ notes }) })
export const publishCurriculum = (id: string, notes?: string) => request<void>(`/api/curriculum-governance/curricula/${encodeURIComponent(id)}/publish`, { method: 'POST', body: JSON.stringify({ notes }) })
export const exportCurriculumCsv = (curriculumId: string) => fetch(`${API_BASE_URL}/api/curriculum-management/curricula/${encodeURIComponent(curriculumId)}/courses/export`)

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
  changedPlacement: Array<{ id: string; code: string; name: string; creditUnits: number; firstYear: number; firstSemester: number; firstIsCore: boolean; secondYear: number; secondSemester: number; secondIsCore: boolean }>
}
const governanceBase = (id: string) => `/api/curriculum-governance/curricula/${encodeURIComponent(id)}`
export const getCurriculumApprovalHistory = (id: string) => request<CurriculumApprovalHistory[]>(`${governanceBase(id)}/approval-history`)
const curriculumTransition = (id: string, action: 'submit-for-review' | 'approve' | 'reject' | 'publish' | 'retire', notes?: string) =>
  request<void>(`${governanceBase(id)}/${action}`, { method: 'POST', body: JSON.stringify({ notes }) })
export const rejectCurriculum = (id: string, notes: string) => curriculumTransition(id, 'reject', notes)
export const retireCurriculum = (id: string, notes: string) => curriculumTransition(id, 'retire', notes)
export const cloneCurriculum = (id: string, input: { version: string; title: string; effectiveFrom: string; effectiveTo?: string | null }) =>
  request<Curriculum>(`${governanceBase(id)}/clone`, { method: 'POST', body: JSON.stringify(input) })
export const compareCurricula = (id: string, otherId: string) =>
  request<CurriculumComparison>(`${governanceBase(id)}/compare/${encodeURIComponent(otherId)}`)
