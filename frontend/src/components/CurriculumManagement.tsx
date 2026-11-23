import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  addCurriculumCourse,
  updateCurriculumCourse,
  deleteCurriculumCourse,
  deleteCourse,
  updateCurriculumSemester,
  deleteCurriculumSemester,
  createCourse,
  createCurriculum,
  updateCurriculum,
  setCurriculumActive,
  updateCourse,
  setCourseActive,
  getCourses,
  getCurricula,
  getCurriculum,
  getCurriculumCourses,
  getCreditLoad,
  getPrerequisites,
  submitCurriculumForReview,
  approveCurriculum,
  publishCurriculum,
  bulkAddCurriculumCourses,
  type Course,
  type Curriculum,
  type CurriculumCourse,
  type CreditLoadInfo,
  type CoursePrerequisiteDto,
} from '../api/curriculumManagement'
import { createProgramme, deleteProgramme, getProgrammes, setProgrammeActive, updateProgramme, type CreateProgrammeRequest, type Programme } from '../api/programmes'
import { resolveAcademicAuthority } from '../utils/academicAuthorities'
import { CurriculumCard } from './CurriculumCard'
import { CurriculumLogbookManagement } from './CurriculumLogbookManagement'
import { CurriculumGovernancePanel } from './CurriculumGovernancePanel'
import { CurriculumFilterPanel, type CurriculumFilters } from './CurriculumFilterPanel'
import { showConfirmDialog } from '../utils/confirmDialog'
import { createAcademicAuthority, getAcademicAuthorities, setAcademicAuthorityActive, updateAcademicAuthority, type AcademicAuthority } from '../api/academicAuthorities'
import { createAcademicDepartment, createAcademicFaculty, getAcademicCampuses, getAcademicDepartments, getAcademicFaculties, setAcademicDepartmentActive, setAcademicFacultyActive, updateAcademicDepartment, updateAcademicFaculty, type AcademicDepartment, type CampusOption, type FacultyOption } from '../api/academicDepartments'

type Tab = 'full' | 'short'

// ASP.NET serializes enums as strings in API responses. Accept both the current
// string contract and legacy numeric payloads so filtering never hides curricula.
function normalizeProgrammeType(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const normalized = String(value ?? '').trim().toLowerCase().replace(/[ _-]/g, '')
  if (normalized === 'fullprogramme' || normalized === 'fullprogram' || normalized === '0') return 0
  if (normalized === 'shortcourse' || normalized === '1') return 1
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : -1
}

export function CurriculumManagement({ canManage }: { canManage?: boolean }) {
  const [tab, setTab] = useState<Tab>('full')
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [authorities, setAuthorities] = useState<AcademicAuthority[]>([])
  const [departments, setDepartments] = useState<AcademicDepartment[]>([])
  const [faculties, setFaculties] = useState<FacultyOption[]>([])
  const [campuses, setCampuses] = useState<CampusOption[]>([])
  const [selectedCampusId, setSelectedCampusId] = useState('')
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null)
  const [facultyForm, setFacultyForm] = useState({ code: '', name: '', description: '' })
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [departmentForm, setDepartmentForm] = useState({ facultyId: '', code: '', name: '' })
  const [selected, setSelected] = useState('')
  const [curriculumFilters, setCurriculumFilters] = useState<CurriculumFilters>({ status: [], programmeType: [], creditRange: { min: 0, max: 10000 }, searchTerm: '' })
  const [curriculumSummaries, setCurriculumSummaries] = useState<Record<string, { courseCount: number; totalCredits: number }>>({})
  const selectedCurriculumRef = useRef('')
  const [authority, setAuthority] = useState('')
  const [editingAuthority, setEditingAuthority] = useState<string | null>(null)
  const [authorityForm, setAuthorityForm] = useState({ code: '', name: '', description: '', sourceReference: '', sortOrder: '10' })
  const [editingProgrammeId, setEditingProgrammeId] = useState<string | null>(null)
  const [editingCurriculumId, setEditingCurriculumId] = useState<string | null>(null)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [programmeForm, setProgrammeForm] = useState({ departmentId: '', code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: false, type: '0' })
  const [mappings, setMappings] = useState<CurriculumCourse[]>([])
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null)
  const selectedAuthority = resolveAcademicAuthority(authority)
  const authorityOfProgramme = (programmeId: string) => resolveAcademicAuthority(programmes.find(p => p.id === programmeId)?.regulator)
  const expectedProgrammeType = tab === 'short' ? 1 : 0
  // The Programme record is the source of truth for category; older curriculum rows
  // may carry a stale ProgrammeType value from before category validation existed.
  const authorityCurricula = curricula.filter(c => {
    const programme = programmes.find(item => item.id === c.programmeId)
    return Boolean(programme) &&
      normalizeProgrammeType(programme?.type) === expectedProgrammeType &&
      authorityOfProgramme(c.programmeId) === selectedAuthority
  })
  const authorityProgrammes = programmes.filter(p => p.isActive && !p.isReferenceOnly && normalizeProgrammeType(p.type) === expectedProgrammeType && authorityOfProgramme(p.id) === selectedAuthority)
  // The API already scopes courses to the selected authority (including legacy unassigned courses).
  // Keep this derived array stable: it drives prerequisite loading and must not retrigger
  // that effect on every render (which would repeatedly request prerequisites).
  const authorityCourses = useMemo(() => courses.filter(course =>
    !course.authorityCode || resolveAcademicAuthority(course.authorityCode) === selectedAuthority
  ), [courses, selectedAuthority])
  // Keep the authority catalogue readable: course codes are programme-prefixed
  // (for example DPH 1101). Group by the longest matching programme code so
  // short codes do not accidentally capture another programme's units.
  const groupedAuthorityCourses = useMemo(() => {
    const orderedProgrammes = [...authorityProgrammes].sort((a, b) => b.code.length - a.code.length)
    const groups = new Map<string, { programme: Programme | null; courses: Course[] }>()
    for (const course of authorityCourses) {
      const programme = orderedProgrammes.find(item =>
        course.code.trim().toUpperCase().startsWith(item.code.trim().toUpperCase())
      ) ?? null
      const key = programme?.id ?? '__unassigned__'
      const group = groups.get(key) ?? { programme, courses: [] }
      group.courses.push(course)
      groups.set(key, group)
    }
    return [...groups.values()]
      .map(group => ({ ...group, courses: group.courses.sort((a, b) => a.code.localeCompare(b.code)) }))
      .sort((a, b) => (a.programme?.name ?? 'Other / unassigned').localeCompare(b.programme?.name ?? 'Other / unassigned'))
  }, [authorityCourses, authorityProgrammes])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const loadRequest = useRef(0)
  const authorityCoursesRequest = useRef(0)
  const mappingsRequest = useRef(0)
  const [semesterEdit, setSemesterEdit] = useState<{ year: number; semester: number; nextYear: string; nextSemester: string } | null>(null)

  const [creditLoad, setCreditLoad] = useState<Record<string, CreditLoadInfo[]>>({})
  const [bulkCourseIds, setBulkCourseIds] = useState<string[]>([])
  const [bulkYear, setBulkYear] = useState('1')
  const [bulkSemester, setBulkSemester] = useState('1')
  const [bulkIsCore, setBulkIsCore] = useState(true)
  const [coursePrereqs, setCoursePrereqs] = useState<Record<string, CoursePrerequisiteDto[]>>({})

  const filteredCurricula = useMemo(() => authorityCurricula.filter(item => {
    const programme = programmes.find(row => row.id === item.programmeId)
    const status = item.isActive ? 'active' : 'inactive'
    const searchText = [item.title, item.version, programme?.code, programme?.name].filter(Boolean).join(' ').toLowerCase()
    return (!curriculumFilters.status.length || curriculumFilters.status.includes(status)) &&
      (!curriculumFilters.programmeType.length || curriculumFilters.programmeType.includes(String(normalizeProgrammeType(programme?.type)))) &&
      item.minimumCredits >= curriculumFilters.creditRange.min &&
      item.minimumCredits <= curriculumFilters.creditRange.max &&
      (!curriculumFilters.searchTerm.trim() || searchText.includes(curriculumFilters.searchTerm.trim().toLowerCase()))
  }), [authorityCurricula, programmes, curriculumFilters])

  const [cf, setCf] = useState({ programmeId: '', version: '1.0', title: '', minimumCredits: '', effectiveFrom: '', effectiveTo: '', type: 'FullProgramme' as 'FullProgramme' | 'ShortCourse' })
  const [uf, setUf] = useState({ code: '', name: '', creditUnits: '', description: '', courseType: '' })
  const [mf, setMf] = useState({ courseId: '', yearOfStudy: '1', semesterNumber: '1', isCore: true })
  const [schoolUnitForm, setSchoolUnitForm] = useState({ code: '', name: '', creditUnits: '0', courseType: '', description: '', yearOfStudy: '1', semesterNumber: '1', isCore: true })


  useEffect(() => {
    if (canManage) void load()
  }, [canManage])

  useEffect(() => {
    let cancelled = false
    const eligibleCurricula = curricula.filter(item => {
      const programme = programmes.find(row => row.id === item.programmeId)
      return Boolean(programme) &&
        normalizeProgrammeType(programme?.type) === (tab === 'short' ? 1 : 0) &&
        resolveAcademicAuthority(programme?.regulator) === resolveAcademicAuthority(authority)
    })
    if (eligibleCurricula.length === 0) {
      setCurriculumSummaries({})
      return () => { cancelled = true }
    }
    void Promise.all(eligibleCurricula.map(async item => {
      try {
        const rows = await getCurriculumCourses(item.id)
        const totalCredits = rows.reduce((sum, row) => sum + (authorityCourses.find(course => course.id === row.courseId)?.creditUnits ?? 0), 0)
        return [item.id, { courseCount: rows.length, totalCredits }] as const
      } catch {
        return [item.id, { courseCount: 0, totalCredits: 0 }] as const
      }
    })).then(entries => {
      if (!cancelled) setCurriculumSummaries(Object.fromEntries(entries))
    })
    return () => { cancelled = true }
  }, [curricula, programmes, authority, tab, courses])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const prereqs: Record<string, CoursePrerequisiteDto[]> = {}
      for (const course of authorityCourses) {
        try {
          const p = await getPrerequisites(course.id)
          if (!cancelled) prereqs[course.id] = p
        } catch { /* non-critical */ }
      }
      if (!cancelled) setCoursePrereqs(prereqs)
    })()
    return () => { cancelled = true }
  }, [authorityCourses])

  async function load(tabForAuthority: Tab = tab) {
    const loadRequestId = ++loadRequest.current
    const courseRequestId = ++authorityCoursesRequest.current
    mappingsRequest.current += 1
    setLoading(true)
    setError('')
    setMessage('')
    try {
      // Load the academic catalog independently from the optional campus structure.
      // A campus/faculty/department endpoint failure must never blank the three
      // curriculum selectors.
      const [curriculaResult, programmesResult, authoritiesResult] = await Promise.allSettled([
        getCurricula(),
        getProgrammes(),
        getAcademicAuthorities(true),
      ])
      if (loadRequest.current !== loadRequestId) return

      const failures: string[] = []
      const nextCurricula = curriculaResult.status === 'fulfilled' ? curriculaResult.value : []
      const nextProgrammes = programmesResult.status === 'fulfilled' ? programmesResult.value : []
      const nextAuthorities = authoritiesResult.status === 'fulfilled' ? authoritiesResult.value : []

      if (curriculaResult.status === 'rejected') failures.push(`Curricula: ${curriculaResult.reason instanceof Error ? curriculaResult.reason.message : 'could not be loaded'}`)
      if (programmesResult.status === 'rejected') failures.push(`Programmes: ${programmesResult.reason instanceof Error ? programmesResult.reason.message : 'could not be loaded'}`)
      if (authoritiesResult.status === 'rejected') failures.push(`Academic authorities: ${authoritiesResult.reason instanceof Error ? authoritiesResult.reason.message : 'could not be loaded'}`)

      // Prefer an authority that actually owns eligible programmes for the
      // current tab. SCHOOL_BASED sorts first, but the seeded full-programme
      // catalogue is primarily UHPAB; blindly selecting the first authority
      // leaves Programme, Curriculum and Course selectors disabled/empty.
      const authoritiesWithEligibleProgrammes = new Set(
        nextProgrammes
          .filter(programme =>
            programme.isActive &&
            !programme.isReferenceOnly &&
            normalizeProgrammeType(programme.type) === (tabForAuthority === 'short' ? 1 : 0)
          )
          .map(programme => resolveAcademicAuthority(programme.regulator))
          .filter(Boolean)
      )
      const currentAuthority = nextAuthorities.find(item =>
        item.code === authority &&
        item.isActive &&
        authoritiesWithEligibleProgrammes.has(resolveAcademicAuthority(item.code))
      )
      const nextAuthority = currentAuthority?.code ??
        nextAuthorities.find(item =>
          item.isActive && authoritiesWithEligibleProgrammes.has(resolveAcademicAuthority(item.code))
        )?.code ??
        nextAuthorities.find(item => item.isActive)?.code ??
        ''

      // Publish successful core results immediately; do not wait for campus data.
      setCurricula(nextCurricula)
      setProgrammes(nextProgrammes)
      setAuthorities(nextAuthorities)
      setAuthority(nextAuthority)

      if (nextAuthority) {
        try {
          const nextCourses = await getCourses(nextAuthority)
          if (loadRequest.current === loadRequestId && authorityCoursesRequest.current === courseRequestId) setCourses(nextCourses)
        } catch (courseError) {
          if (loadRequest.current === loadRequestId && authorityCoursesRequest.current === courseRequestId) {
            setCourses([])
            failures.push(`Courses: ${courseError instanceof Error ? courseError.message : 'could not be loaded'}`)
          }
        }
      } else {
        if (loadRequest.current !== loadRequestId) return
        authorityCoursesRequest.current += 1
        setCourses([])
        if (authoritiesResult.status === 'fulfilled' && nextAuthorities.length === 0) {
          failures.push('No active academic authority is configured. Activate an authority to load programmes and courses.')
        }
      }

      if (loadRequest.current !== loadRequestId) return
      const currentSelection = selectedCurriculumRef.current
      if (currentSelection && !nextCurricula.some(item =>
        item.id === currentSelection &&
        resolveAcademicAuthority(nextProgrammes.find(programme => programme.id === item.programmeId)?.regulator) === resolveAcademicAuthority(nextAuthority)
      )) {
        selectedCurriculumRef.current = ''
        setSelected('')
        setMappings([])
      }

      // Campus/faculty/department data is ancillary. Load it in the background so a
      // slow campus endpoint cannot keep the core authority selectors in a loading state.
      void (async () => {
        try {
          const campusList = await getAcademicCampuses()
          if (loadRequest.current !== loadRequestId) return
          const campusId = selectedCampusId && campusList.some(item => item.id === selectedCampusId)
            ? selectedCampusId
            : (campusList.find(item => item.isActive)?.id ?? '')
          setCampuses(campusList)
          setSelectedCampusId(campusId)
          if (!campusId) {
            setDepartments([])
            setFaculties([])
            return
          }
          const [departmentResult, facultyResult] = await Promise.allSettled([
            getAcademicDepartments(campusId),
            getAcademicFaculties(campusId),
          ])
          if (loadRequest.current !== loadRequestId) return
          if (departmentResult.status === 'fulfilled') setDepartments(departmentResult.value)
          else setDepartments([])
          if (facultyResult.status === 'fulfilled') setFaculties(facultyResult.value)
          else setFaculties([])
          const campusFailures = [
            departmentResult.status === 'rejected' ? 'Departments could not be loaded.' : '',
            facultyResult.status === 'rejected' ? 'Faculties could not be loaded.' : '',
          ].filter(Boolean)
          if (campusFailures.length) setError(current => [current, ...campusFailures].filter(Boolean).join(' · '))
        } catch (campusError) {
          if (loadRequest.current !== loadRequestId) return
          setCampuses([])
          setDepartments([])
          setFaculties([])
          setError(current => [current, campusError instanceof Error ? campusError.message : 'Campus structure could not be loaded.'].filter(Boolean).join(' · '))
        }
      })()

      if (loadRequest.current === loadRequestId && failures.length) setError(failures.join(' · '))
    } catch (e) {
      if (loadRequest.current === loadRequestId) setError(e instanceof Error ? e.message : 'Unable to load curriculum data.')
    } finally {
      if (loadRequest.current === loadRequestId) setLoading(false)
    }
  }

  async function refreshMappings(id: string) {
    const requestId = ++mappingsRequest.current
    selectedCurriculumRef.current = id
    setSelected(id)
    setError('')
    if (!id) { setMappings([]); setCreditLoad({}); return }
    try {
      const nextMappings = await getCurriculumCourses(id)
      if (mappingsRequest.current === requestId) setMappings(nextMappings)
      try {
        const load = await getCreditLoad(id)
        if (mappingsRequest.current === requestId) setCreditLoad(current => ({ ...current, [id]: load }))
      } catch { /* credit load is non-critical */ }
    } catch (e) {
      if (mappingsRequest.current === requestId) {
        setMappings([])
        setError(e instanceof Error ? e.message : 'Unable to load curriculum course units. Please retry.')
      }
    }
  }

  async function saveFaculty(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCampusId) { setError('Add or select an active campus first.'); return }
    setSaving(true); setError('')
    try {
      const input = { campusId: selectedCampusId, ...facultyForm }
      if (editingFacultyId) {
        const existing = faculties.find(item => item.id === editingFacultyId)
        await updateAcademicFaculty(editingFacultyId, { ...input, isActive: existing?.isActive ?? true })
        setMessage('Faculty updated.')
      } else { await createAcademicFaculty(input); setMessage('Faculty created.') }
      setEditingFacultyId(null); setFacultyForm({ code: '', name: '', description: '' }); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save faculty.') }
    finally { setSaving(false) }
  }

  async function toggleFaculty(item: FacultyOption) {
    try { await setAcademicFacultyActive(item.id, !item.isActive); setFaculties(current => current.map(row => row.id === item.id ? { ...row, isActive: !row.isActive } : row)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update faculty status.') }
  }

  async function saveDepartment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (editingDepartmentId) {
        const existing = departments.find(item => item.id === editingDepartmentId)
        await updateAcademicDepartment(editingDepartmentId, { ...departmentForm, isActive: existing?.isActive ?? true })
        setMessage('Department updated.')
      } else {
        await createAcademicDepartment(departmentForm)
        setMessage('Department created.')
      }
      setEditingDepartmentId(null)
      setDepartmentForm({ facultyId: '', code: '', name: '' })
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save department.') }
    finally { setSaving(false) }
  }

  async function toggleDepartment(item: AcademicDepartment) {
    try {
      await setAcademicDepartmentActive(item.id, !item.isActive)
      setDepartments(current => current.map(row => row.id === item.id ? { ...row, isActive: !row.isActive } : row))
      setMessage(item.isActive ? 'Department deactivated.' : 'Department activated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update department status.') }
  }

  async function saveAuthority(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const input = { ...authorityForm, code: authorityForm.code.trim().toUpperCase(), name: authorityForm.name.trim(), sortOrder: Number(authorityForm.sortOrder) }
      let savedAuthority: AcademicAuthority | undefined
      if (editingAuthority) {
        await updateAcademicAuthority(editingAuthority, input)
        setMessage('Academic authority updated successfully.')
      } else {
        savedAuthority = await createAcademicAuthority(input)
        setMessage('Academic authority created successfully.')
      }
      setAuthorityForm({ code: '', name: '', description: '', sourceReference: '', sortOrder: '10' })
      setEditingAuthority(null)
      await load()
      if (savedAuthority?.isActive) {
        setAuthority(savedAuthority.code)
        const nextCourses = await getCourses(savedAuthority.code)
        setCourses(nextCourses)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save academic authority.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAuthority(item: AcademicAuthority) {
    setError('')
    setMessage('')
    try {
      await setAcademicAuthorityActive(item.code, !item.isActive)
      if (item.isActive && authority === item.code) {
        setAuthority('')
        setCourses([])
        selectedCurriculumRef.current = ''
        setSelected('')
        setMappings([])
      }
      setMessage(item.isActive ? `Academic authority ${item.name} deactivated.` : `Academic authority ${item.name} activated.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update academic authority.')
    }
  }

  async function saveProgramme(e: React.FormEvent) {
    e.preventDefault()
    if (!authority) {
      setError('Create or activate an academic authority before adding a programme.')
      return
    }
    setSaving(true)
    try {
      const input: CreateProgrammeRequest = {
        departmentId: programmeForm.departmentId || null,
        code: programmeForm.code,
        name: programmeForm.name,
        award: programmeForm.award,
        awardTitle: programmeForm.awardTitle || undefined,
        durationYears: Number(programmeForm.durationYears),
        durationUnit: programmeForm.durationUnit,
        studyMode: programmeForm.studyMode,
        deliveryType: programmeForm.deliveryType,
        regulator: authority,
        approvalReference: programmeForm.approvalReference || undefined,
        approvalDate: programmeForm.approvalDate || undefined,
        approvalStatus: programmeForm.approvalStatus,
        sourceReference: programmeForm.sourceReference || undefined,
        isReferenceOnly: programmeForm.isReferenceOnly,
        type: Number(programmeForm.type),
      }
      if (editingProgrammeId) await updateProgramme(editingProgrammeId, input)
      else await createProgramme(input)
      setEditingProgrammeId(null)
      setProgrammeForm({ departmentId: '', code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: false, type: '0' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save programme.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleProgramme(item: Programme) {
    try {
      await setProgrammeActive(item.id, !item.isActive)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update programme status.')
    }
  }

  async function removeProgramme(item: Programme) {
    const confirmed = await showConfirmDialog(`Delete programme ${item.code} — ${item.name}? This cannot be undone.`, {
      title: 'Delete programme',
      confirmLabel: 'Delete programme',
      destructive: true,
    })
    if (!confirmed) return
    setError('')
    setMessage('')
    try {
      await deleteProgramme(item.id)
      if (editingProgrammeId === item.id) {
        setEditingProgrammeId(null)
        setProgrammeForm({ departmentId: '', code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: false, type: '0' })
      }
      setMessage(`Programme ${item.code} deleted successfully.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete programme.')
    }
  }

  function editProgramme(item: Programme) {
    setEditingProgrammeId(item.id)
    setProgrammeForm({
      departmentId: item.departmentId ?? '',
      code: item.code,
      name: item.name,
      award: item.award,
      awardTitle: item.awardTitle ?? '',
      durationYears: String(item.durationYears),
      durationUnit: item.durationUnit || 'Years',
      studyMode: item.studyMode || 'Full-time',
      deliveryType: item.deliveryType || 'Academic',
      approvalReference: item.approvalReference ?? '',
      approvalDate: item.approvalDate?.slice(0, 10) ?? '',
      approvalStatus: item.approvalStatus || 'NeedsVerification',
      sourceReference: item.sourceReference ?? '',
      isReferenceOnly: item.isReferenceOnly,
      type: String(item.type),
    })
  }

  async function saveCurriculum(e: React.FormEvent) {
    e.preventDefault()
    if (!cf.programmeId) { setError('Select a programme before saving its curriculum.'); return }
    setSaving(true)
    try {
      const values = {
        version: cf.version,
        title: cf.title,
        minimumCredits: Number(cf.minimumCredits),
        effectiveFrom: cf.effectiveFrom,
        effectiveTo: cf.effectiveTo || null,
        programmeType: cf.type === 'ShortCourse' ? 1 : 0,
      }
      if (editingCurriculumId) {
        const existing = curricula.find(item => item.id === editingCurriculumId)
        await updateCurriculum(editingCurriculumId, { ...values, isActive: existing?.isActive ?? true })
        setMessage('Curriculum updated.')
      } else {
        await createCurriculum({ programmeId: cf.programmeId, ...values })
        setMessage('Curriculum created.')
      }
      setEditingCurriculumId(null)
      setCf({ programmeId: '', version: '1.0', title: '', minimumCredits: '', effectiveFrom: '', effectiveTo: '', type: tab === 'short' ? 'ShortCourse' : 'FullProgramme' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save curriculum.')
    } finally {
      setSaving(false)
    }
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (!authority) throw new Error('Select an active academic authority before saving a course.')
      const values = {
        authorityCode: authority,
        code: uf.code,
        name: uf.name,
        creditUnits: Number(uf.creditUnits),
        description: uf.description,
        courseType: uf.courseType,
      }
      if (editingCourseId) {
        const existing = courses.find(item => item.id === editingCourseId)
        await updateCourse(editingCourseId, { ...values, isActive: existing?.isActive ?? true })
        setMessage('Course updated.')
      } else {
        await createCourse(values)
        setMessage('Course created.')
      }
      setEditingCourseId(null)
      setUf({ code: '', name: '', creditUnits: '', description: '', courseType: '' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save course.')
    } finally {
      setSaving(false)
    }
  }

  function editCurriculum(item: Curriculum) {
    setEditingCurriculumId(item.id)
    mappingsRequest.current += 1
    selectedCurriculumRef.current = ''
    setSelected('')
    setMappings([])
    const programmeType = normalizeProgrammeType(programmes.find(programme => programme.id === item.programmeId)?.type ?? item.programmeType)
    setTab(programmeType === 1 ? 'short' : 'full')
    setCf({
      programmeId: item.programmeId, version: item.version, title: item.title,
      minimumCredits: String(item.minimumCredits), effectiveFrom: item.effectiveFrom,
      effectiveTo: item.effectiveTo ?? '', type: programmeType === 1 ? 'ShortCourse' : 'FullProgramme',
    })
  }

  async function toggleCurriculum(item: Curriculum) {
    try {
      await setCurriculumActive(item.id, !item.isActive)
      setCurricula(current => current.map(row => row.id === item.id ? { ...row, isActive: !row.isActive } : row))
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update curriculum status.') }
  }

  function editCourse(item: Course) {
    setEditingCourseId(item.id)
    setUf({ code: item.code, name: item.name, creditUnits: String(item.creditUnits), description: item.description ?? '', courseType: item.courseType ?? '' })
  }

  async function toggleCourse(item: Course) {
    try {
      await setCourseActive(item.id, !item.isActive)
      setCourses(current => current.map(row => row.id === item.id ? { ...row, isActive: !row.isActive } : row))
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update course status.') }
  }

  function editMapping(item: CurriculumCourse) {
    setEditingMappingId(item.id)
    setMf({ courseId: item.courseId, yearOfStudy: String(item.yearOfStudy), semesterNumber: String(item.semesterNumber), isCore: item.isCore })
  }

  async function saveMapping(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      const values = {
        yearOfStudy: Number(mf.yearOfStudy),
        semesterNumber: Number(mf.semesterNumber),
        isCore: mf.isCore,
      }
      if (editingMappingId) {
        await updateCurriculumCourse(selected, editingMappingId, values)
        setMessage('Curriculum course mapping updated.')
      } else {
        await addCurriculumCourse(selected, { courseId: mf.courseId, ...values })
        setMessage('Course mapped to curriculum.')
      }
      setEditingMappingId(null)
      setMf({ courseId: '', yearOfStudy: '1', semesterNumber: '1', isCore: true })
      await refreshMappings(selected)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to map course.')
    } finally {
      setSaving(false)
    }
  }

  async function saveEditableAuthorityCourseUnit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !['SCHOOL_BASED', 'UVTAB', 'UHPAB'].includes(resolveAcademicAuthority(authority))) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const created = await createCourse({
        authorityCode: resolveAcademicAuthority(authority),
        code: schoolUnitForm.code.trim(),
        name: schoolUnitForm.name.trim(),
        creditUnits: Number(schoolUnitForm.creditUnits),
        courseType: schoolUnitForm.courseType,
        description: schoolUnitForm.description,
      })
      await addCurriculumCourse(selected, {
        courseId: created.id,
        yearOfStudy: Number(schoolUnitForm.yearOfStudy),
        semesterNumber: Number(schoolUnitForm.semesterNumber),
        isCore: schoolUnitForm.isCore,
      })
      setSchoolUnitForm({ code: '', name: '', creditUnits: '0', courseType: '', description: '', yearOfStudy: '1', semesterNumber: '1', isCore: true })
      setMessage(`${authority === 'UVTAB' ? 'UVTAB competence area/unit' : authority === 'UHPAB' ? 'UHPAB course unit' : 'School-based course unit'} created and added to the selected programme curriculum semester.`)
      const [nextCourses] = await Promise.all([getCourses(authority), refreshMappings(selected)])
      setCourses(nextCourses)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create and map the course unit.')
      // If the catalogue record was saved but mapping failed, refresh the catalogue
      // so the unit remains available for a retry without creating a duplicate.
      try { setCourses(await getCourses(authority)) } catch { /* retain the original error */ }
    } finally {
      setSaving(false)
    }
  }

  async function saveBulkMapping(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    if (bulkCourseIds.length === 0) { setError('Select at least one course.'); return }
    setSaving(true)
    try {
      await bulkAddCurriculumCourses(selected, {
        courseIds: bulkCourseIds,
        yearOfStudy: Number(bulkYear),
        semesterNumber: Number(bulkSemester),
        isCore: bulkIsCore,
      })
      setMessage(`${bulkCourseIds.length} course(s) added to curriculum.`)
      setBulkCourseIds([])
      setBulkYear('1')
      setBulkSemester('1')
      await refreshMappings(selected)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to add courses in bulk.'
      if (msg.includes('errors')) {
        setError('Some courses could not be added. Check prerequisites and credit load limits.')
      } else {
        setError(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  async function removeCourseUnit(mapping: CurriculumCourse) {
    const course = courses.find(item => item.id === mapping.courseId)
    const confirmed = await showConfirmDialog(`Remove ${course?.code ?? 'this course unit'} from this curriculum? The course remains in the catalogue and historical registrations are not deleted.`, { title: 'Remove course unit', confirmLabel: 'Remove course unit', destructive: true })
    if (!confirmed) return
    try {
      await deleteCurriculumCourse(selected, mapping.id)
      if (editingMappingId === mapping.id) {
        setEditingMappingId(null)
        setMf({ courseId: '', yearOfStudy: '1', semesterNumber: '1', isCore: true })
      }
      setMessage('Course unit removed from this curriculum.')
      await refreshMappings(selected)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove course unit.')
    }
  }

  function beginSemesterEdit(year: number, semester: number) {
    setSemesterEdit({ year, semester, nextYear: String(year), nextSemester: String(semester) })
  }

  async function saveSemesterEdit() {
    if (!selected || !semesterEdit) return
    setSaving(true)
    try {
      await updateCurriculumSemester(selected, semesterEdit.year, semesterEdit.semester, {
        yearOfStudy: Number(semesterEdit.nextYear),
        semesterNumber: Number(semesterEdit.nextSemester),
      })
      setSemesterEdit(null)
      setMessage('Semester updated. All its course units were moved together.')
      await refreshMappings(selected)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update semester.')
    } finally {
      setSaving(false)
    }
  }

  async function removeSemester(year: number, semester: number, count: number) {
    const confirmed = await showConfirmDialog(`Delete Year ${year}, Semester ${semester} and remove its ${count} course-unit assignment(s) from this curriculum? The course catalogue and historical registrations will remain.`, { title: 'Delete semester', confirmLabel: 'Delete semester', destructive: true })
    if (!confirmed) return
    try {
      await deleteCurriculumSemester(selected, year, semester)
      if (semesterEdit?.year === year && semesterEdit.semester === semester) setSemesterEdit(null)
      setMessage(`Year ${year}, Semester ${semester} deleted from this curriculum.`)
      await refreshMappings(selected)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete semester.')
    }
  }

  const selectedCurriculum = authorityCurricula.find(item => item.id === selected)
  const selectedProgrammeCode = programmes.find(item => item.id === selectedCurriculum?.programmeId)?.code ?? ''
  const semesterCodePrefix = selectedProgrammeCode
    .replace(/^(?:UHPAB|UVTAB|KSHS|SB)[-_]/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
  const semesterGroups = Array.from(
    mappings.reduce((groups, mapping) => {
      const key = `${mapping.yearOfStudy}-${mapping.semesterNumber}`
      const group = groups.get(key) ?? { year: mapping.yearOfStudy, semester: mapping.semesterNumber, mappings: [] as CurriculumCourse[] }
      group.mappings.push(mapping)
      groups.set(key, group)
      return groups
    }, new Map<string, { year: number; semester: number; mappings: CurriculumCourse[] }>()).values()
  )
    .sort((left, right) => left.year - right.year || left.semester - right.semester)
    .map(group => ({
      ...group,
      code: semesterCodePrefix ? `${semesterCodePrefix}${group.year}${group.semester}` : `Y${group.year}S${group.semester}`,
    }))

  function getCreditLoadText(curriculumId: string, year: number, semester: number): string {
    const load = creditLoad[curriculumId]?.find(l => l.year === year && l.semester === semester)
    if (!load) return ''
    return `${load.totalCredits} credits / 24 max`
  }

  function getCreditLoadClass(curriculumId: string, year: number, semester: number): string {
    const load = creditLoad[curriculumId]?.find(l => l.year === year && l.semester === semester)
    if (!load) return ''
    if (load.totalCredits > 24) return 'credit-load-over'
    if (load.totalCredits >= 20) return 'credit-load-high'
    return 'credit-load-ok'
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab)
    mappingsRequest.current += 1
    selectedCurriculumRef.current = ''
    setSelected('')
    setMappings([])
    setSemesterEdit(null)
    setEditingMappingId(null)
    setMf({ courseId: '', yearOfStudy: '1', semesterNumber: '1', isCore: true })
    setEditingCurriculumId(null)
    setCf({ programmeId: '', version: '1.0', title: '', minimumCredits: '', effectiveFrom: '', effectiveTo: '', type: nextTab === 'short' ? 'ShortCourse' : 'FullProgramme' })

    if (loading) {
      void load(nextTab)
      return
    }

    const programmeType = nextTab === 'short' ? 1 : 0
    const currentHasProgrammes = programmes.some(programme =>
      programme.isActive &&
      !programme.isReferenceOnly &&
      normalizeProgrammeType(programme.type) === programmeType &&
      resolveAcademicAuthority(programme.regulator) === resolveAcademicAuthority(authority)
    )
    if (!currentHasProgrammes) {
      const preferredAuthority = authorities.find(item =>
        item.isActive && programmes.some(programme =>
          programme.isActive &&
          !programme.isReferenceOnly &&
          normalizeProgrammeType(programme.type) === programmeType &&
          resolveAcademicAuthority(programme.regulator) === resolveAcademicAuthority(item.code)
        )
      )
      if (preferredAuthority && preferredAuthority.code !== authority) {
        loadRequest.current += 1
        setLoading(false)
        setAuthority(preferredAuthority.code)
        setCourses([])
        setEditingProgrammeId(null)
        setProgrammeForm({ departmentId: '', code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: false, type: nextTab === 'short' ? '1' : '0' })
        setEditingCourseId(null)
        setUf({ code: '', name: '', creditUnits: '', description: '', courseType: '' })
        const requestId = ++authorityCoursesRequest.current
        void getCourses(preferredAuthority.code)
          .then(nextCourses => {
            if (authorityCoursesRequest.current === requestId) setCourses(nextCourses)
          })
          .catch(loadError => {
            if (authorityCoursesRequest.current === requestId) {
              setCourses([])
              setError(loadError instanceof Error ? loadError.message : 'Unable to load this authority course catalogue.')
            }
          })
      }
    }
  }

  if (!canManage) return null

  return (
    <section className="panel curriculum-management">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Academic Structure</p>
          <h2>Curriculum & Courses</h2>
        </div>
        <div className="curriculum-management-header-actions">
          <span>{curricula.length} curricula · {courses.length} courses</span>
          <button type="button" className="curriculum-refresh-button" onClick={() => void load()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh data'}</button>
        </div>
      </div>
      {loading && <p role="status">Loading curriculum data…</p>}
      {error && <div className="error" role="alert">{error}</div>}
      {message && <p role="status">{message}</p>}

      <section className="curriculum-authority-picker-card catalogue-board" aria-label="Curriculum authority picker">
        <h3>Curriculum authority</h3>
        <p className="eyebrow">Select the academic authority that owns the programmes and curricula you want to manage.</p>
        <div className="form-row authority-select-row">
          <label>Authority
            <select value={authority} disabled={loading && authorities.length === 0} onChange={async e => {
              const nextAuthority = e.target.value
              loadRequest.current += 1
              setLoading(false)
              const requestId = ++authorityCoursesRequest.current
              mappingsRequest.current += 1
              setError('')
              setAuthority(nextAuthority)
              setCourses([])
              selectedCurriculumRef.current = ''
              setSelected('')
              setMappings([])
              setSemesterEdit(null)
              setEditingMappingId(null)
              setMf({ courseId: '', yearOfStudy: '1', semesterNumber: '1', isCore: true })
              setEditingProgrammeId(null)
              setProgrammeForm({ departmentId: '', code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: false, type: tab === 'short' ? '1' : '0' })
              setEditingCurriculumId(null)
              setCf({ programmeId: '', version: '1.0', title: '', minimumCredits: '', effectiveFrom: '', effectiveTo: '', type: tab === 'short' ? 'ShortCourse' : 'FullProgramme' })
              setEditingCourseId(null)
              setUf({ code: '', name: '', creditUnits: '', description: '', courseType: '' })
              if (!nextAuthority) return
              try {
                const nextCourses = await getCourses(nextAuthority)
                if (authorityCoursesRequest.current === requestId) setCourses(nextCourses)
              } catch (loadError) {
                if (authorityCoursesRequest.current === requestId) {
                  setCourses([])
                  setError(loadError instanceof Error ? loadError.message : 'Unable to load this authority course catalogue.')
                }
              }
            }}>
              <option value="">Select a curriculum authority</option>
              {authorities.filter(item => item.isActive).map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>
        </div>
        {!authority && (
          <div className="empty">
            <p>No authority selected. Choose one from the list above to load its programmes, curricula, and course units.</p>
          </div>
        )}
        {authority && authorities.some(item => item.code === authority && item.isActive) && (
          <div className="success" role="status">
            <p>Authority <strong>{authorities.find(item => item.code === authority)?.name}</strong> selected. You can now create programmes, curricula, and course units.</p>
          </div>
        )}
      </section>
      <section className="catalogue-board" aria-label="Academic authority register">
        <h3>Academic authorities</h3>
        <form className="student-form" onSubmit={saveAuthority}>
          <div className="form-row">
            <input required maxLength={40} placeholder="Authority code" value={authorityForm.code} disabled={Boolean(editingAuthority)} onChange={e => setAuthorityForm({ ...authorityForm, code: e.target.value.toUpperCase() })} />
            <input required maxLength={160} placeholder="Authority name" value={authorityForm.name} onChange={e => setAuthorityForm({ ...authorityForm, name: e.target.value })} />
            <input type="number" placeholder="Sort order" value={authorityForm.sortOrder} onChange={e => setAuthorityForm({ ...authorityForm, sortOrder: e.target.value })} />
          </div>
          <div className="form-row">
            <input placeholder="Description" value={authorityForm.description} onChange={e => setAuthorityForm({ ...authorityForm, description: e.target.value })} />
            <input placeholder="Source / reference" value={authorityForm.sourceReference} onChange={e => setAuthorityForm({ ...authorityForm, sourceReference: e.target.value })} />
          </div>
          <button type="submit" disabled={saving}>{editingAuthority ? 'Save authority changes' : 'Add authority'}</button>
          {editingAuthority && <button type="button" className="secondary-button" onClick={() => { setEditingAuthority(null); setAuthorityForm({ code: '', name: '', description: '', sourceReference: '', sortOrder: '10' }) }}>Cancel edit</button>}
        </form>
        <div className="table-wrap"><table><thead><tr><th>Code</th><th>Authority</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {authorities.map(item => <tr key={item.id}><td>{item.code}</td><td>{item.name}</td><td>{item.description || '—'}</td><td>{item.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => { setEditingAuthority(item.code); setAuthorityForm({ code: item.code, name: item.name, description: item.description ?? '', sourceReference: item.sourceReference ?? '', sortOrder: String(item.sortOrder) }) }}>Edit</button> <button type="button" className="secondary-button" onClick={() => void toggleAuthority(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
          {authorities.length === 0 && <tr><td colSpan={5}>No authorities configured.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="catalogue-board" aria-label="Faculty register">
        <h3>Faculties</h3>
        <div className="form-row">
          <label>Campus
            <select value={selectedCampusId} onChange={async event => {
              const campusId = event.target.value
              setSelectedCampusId(campusId)
              setEditingFacultyId(null); setFacultyForm({ code: '', name: '', description: '' })
              setEditingDepartmentId(null); setDepartmentForm({ facultyId: '', code: '', name: '' }); setProgrammeForm(current => ({ ...current, departmentId: '' }))
              if (!campusId) { setFaculties([]); setDepartments([]); return }
              try {
                const [nextFaculties, nextDepartments] = await Promise.all([getAcademicFaculties(campusId), getAcademicDepartments(campusId)])
                setFaculties(nextFaculties); setDepartments(nextDepartments)
              } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load campus academic structure.') }
            }}>
              <option value="">Select campus</option>
              {campuses.map(campus => <option key={campus.id} value={campus.id}>{campus.name} ({campus.code})</option>)}
            </select>
          </label>
        </div>
        <form className="student-form" onSubmit={saveFaculty}>
          <div className="form-row">
            <input required maxLength={40} placeholder="Faculty code" value={facultyForm.code} onChange={event => setFacultyForm({ ...facultyForm, code: event.target.value.toUpperCase() })} />
            <input required maxLength={160} placeholder="Faculty name" value={facultyForm.name} onChange={event => setFacultyForm({ ...facultyForm, name: event.target.value })} />
            <input placeholder="Description (optional)" value={facultyForm.description} onChange={event => setFacultyForm({ ...facultyForm, description: event.target.value })} />
            <button type="submit" disabled={saving || !selectedCampusId}>{editingFacultyId ? 'Save faculty' : 'Add faculty'}</button>
            {editingFacultyId && <button type="button" className="secondary-button" onClick={() => { setEditingFacultyId(null); setFacultyForm({ code: '', name: '', description: '' }) }}>Cancel edit</button>}
          </div>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Code</th><th>Faculty</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {faculties.map(item => <tr key={item.id}><td>{item.code}</td><td>{item.name}</td><td>{item.description || '—'}</td><td>{item.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => { setEditingFacultyId(item.id); setFacultyForm({ code: item.code, name: item.name, description: item.description ?? '' }) }}>Edit</button> <button type="button" className="secondary-button" onClick={() => void toggleFaculty(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
          {faculties.length === 0 && <tr><td colSpan={5}>{selectedCampusId ? 'No faculties configured for this campus.' : 'Select a campus to manage faculties.'}</td></tr>}
        </tbody></table></div>
      </section>
      <section className="catalogue-board" aria-label="Department register">
        <h3>Departments</h3>
        <form className="student-form" onSubmit={saveDepartment}>
          <div className="form-row">
            <select required value={departmentForm.facultyId} onChange={e => setDepartmentForm({ ...departmentForm, facultyId: e.target.value })}>
              <option value="">Select faculty</option>{faculties.map(faculty => <option key={faculty.id} value={faculty.id} disabled={!faculty.isActive}>{faculty.code} — {faculty.name}{!faculty.isActive ? ' (inactive)' : ''}</option>)}
            </select>
            {faculties.length === 0 && <p className="empty">No faculties configured. Add a faculty first before creating departments.</p>}
            <input required maxLength={40} placeholder="Department code" value={departmentForm.code} onChange={e => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })} />
            <input required maxLength={160} placeholder="Department name" value={departmentForm.name} onChange={e => setDepartmentForm({ ...departmentForm, name: e.target.value })} />
            <button type="submit" disabled={saving || faculties.length === 0 || !selectedCampusId}>{editingDepartmentId ? 'Save department' : 'Add department'}</button>
            {editingDepartmentId && <button type="button" className="secondary-button" onClick={() => { setEditingDepartmentId(null); setDepartmentForm({ facultyId: '', code: '', name: '' }) }}>Cancel edit</button>}
          </div>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Code</th><th>Department</th><th>Faculty</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {departments.map(item => <tr key={item.id}><td>{item.code}</td><td>{item.name}</td><td>{item.facultyName}</td><td>{item.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => { setEditingDepartmentId(item.id); setDepartmentForm({ facultyId: item.facultyId, code: item.code, name: item.name }) }}>Edit</button> <button type="button" className="secondary-button" onClick={() => void toggleDepartment(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
          {departments.length === 0 && <tr><td colSpan={5}>No departments configured.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="catalogue-board" aria-label="Programme register">
        <h3>Programmes under {authorities.find(item => item.code === authority)?.name ?? 'selected authority'}</h3>
        <form className="student-form" onSubmit={saveProgramme}>
          <div className="form-row">
            <select value={programmeForm.departmentId} onChange={e => setProgrammeForm({ ...programmeForm, departmentId: e.target.value })}><option value="">Unassigned department</option>{departments.filter(item => item.isActive).map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select>
            <input required maxLength={40} placeholder="Programme code" value={programmeForm.code} onChange={e => setProgrammeForm({ ...programmeForm, code: e.target.value.toUpperCase() })} />
            <input required placeholder="Programme name" value={programmeForm.name} onChange={e => setProgrammeForm({ ...programmeForm, name: e.target.value })} />
            <select value={programmeForm.award} onChange={e => setProgrammeForm({ ...programmeForm, award: e.target.value })}><option>Certificate</option><option>Diploma</option><option>Advanced Diploma</option><option>National Certificate</option><option>National Technician Diploma</option><option>Short Course</option><option>Vocational Award</option></select>
          </div>
          <div className="form-row">
            <input type="number" min="0" required placeholder="Duration" value={programmeForm.durationYears} onChange={e => setProgrammeForm({ ...programmeForm, durationYears: e.target.value })} />
            <select value={programmeForm.durationUnit} onChange={e => setProgrammeForm({ ...programmeForm, durationUnit: e.target.value })}><option>Years</option><option>Months</option><option>Weeks</option></select>
            <select value={programmeForm.type} onChange={e => setProgrammeForm({ ...programmeForm, type: e.target.value })}><option value="0">Full programme</option><option value="1">Short course</option></select>
            <input placeholder="Award title (optional)" value={programmeForm.awardTitle} onChange={e => setProgrammeForm({ ...programmeForm, awardTitle: e.target.value })} />
          </div>
          <div className="form-row">
            <select value={programmeForm.studyMode} onChange={e => setProgrammeForm({ ...programmeForm, studyMode: e.target.value })}><option>Full-time</option><option>Part-time</option><option>Evening</option><option>Weekend</option><option>Distance</option></select>
            <select value={programmeForm.deliveryType} onChange={e => setProgrammeForm({ ...programmeForm, deliveryType: e.target.value })}><option>Academic</option><option>CompetencyBased</option><option>Modular</option><option>Blended</option></select>
            <input placeholder="Approval reference" value={programmeForm.approvalReference} onChange={e => setProgrammeForm({ ...programmeForm, approvalReference: e.target.value })} />
            <input type="date" aria-label="Approval date" value={programmeForm.approvalDate} onChange={e => setProgrammeForm({ ...programmeForm, approvalDate: e.target.value })} />
          </div>
          <div className="form-row">
            <select value={programmeForm.approvalStatus} onChange={e => setProgrammeForm({ ...programmeForm, approvalStatus: e.target.value })}><option value="NeedsVerification">Needs verification</option><option value="ListedForReview">Listed for review</option><option value="Institutional">Institutional</option><option value="Verified">Verified</option><option value="Approved">Approved</option><option value="ReferenceOnly">Reference only</option></select>
            <input placeholder="Programme source / reference" value={programmeForm.sourceReference} onChange={e => setProgrammeForm({ ...programmeForm, sourceReference: e.target.value })} />
            <label><input type="checkbox" checked={programmeForm.isReferenceOnly} onChange={e => setProgrammeForm({ ...programmeForm, isReferenceOnly: e.target.checked })} /> Reference only — do not offer for admission</label>
          </div>
          <button type="submit" disabled={saving || !authority}>{editingProgrammeId ? 'Save programme changes' : 'Add programme'}</button>
          {editingProgrammeId && <button type="button" className="secondary-button" onClick={() => { setEditingProgrammeId(null); setProgrammeForm({ departmentId: '', code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: false, type: '0' }) }}>Cancel edit</button>}
        </form>
        <div className="table-wrap"><table><thead><tr><th>Code</th><th>Programme</th><th>Award</th><th>Duration</th><th>Verification</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {programmes.filter(item => resolveAcademicAuthority(item.regulator) === selectedAuthority).map(item => <tr key={item.id}><td>{item.code}</td><td>{item.name}</td><td>{item.award}</td><td>{item.durationYears} {item.durationUnit}</td><td>{item.isReferenceOnly ? 'Reference only' : item.approvalStatus}</td><td>{item.isActive ? 'Active' : 'Inactive'}</td><td><details className="programme-row-actions"><summary aria-label={`Actions for ${item.name}`}>Actions</summary><div className="programme-row-actions-menu"><button type="button" onClick={() => editProgramme(item)}>Edit</button><button type="button" className="secondary-button" onClick={() => void toggleProgramme(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button><button type="button" className="danger-button" onClick={() => void removeProgramme(item)}>Delete</button></div></details></td></tr>)}
          {programmes.filter(item => resolveAcademicAuthority(item.regulator) === selectedAuthority).length === 0 && <tr><td colSpan={7}>No programmes are saved under this authority yet.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="catalogue-board curriculum-register" aria-label="Curriculum register">
        <div className="panel-heading">
          <div><h3>Curriculum register</h3><p>{filteredCurricula.length} of {authorityCurricula.length} curricula</p></div>
        </div>
        <CurriculumFilterPanel
          curricula={authorityCurricula}
          onFilterChange={setCurriculumFilters}
          onClearFilters={() => setCurriculumFilters({ status: [], programmeType: [], creditRange: { min: 0, max: 10000 }, searchTerm: '' })}
        />
        <div className="curriculum-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 14 }}>
          {filteredCurricula.map(item => {
            const programme = programmes.find(row => row.id === item.programmeId)
            const summary = curriculumSummaries[item.id] ?? { courseCount: 0, totalCredits: 0 }
            return (
              <CurriculumCard
                key={item.id}
                curriculum={item}
                programmeName={programme ? `${programme.code} — ${programme.name}` : 'Unknown programme'}
                courseCount={summary.courseCount}
                totalCredits={summary.totalCredits}
                onEdit={() => editCurriculum(item)}
                onToggleStatus={() => void toggleCurriculum(item)}
                onSelect={() => { setSemesterEdit(null); setEditingMappingId(null); setMf(current => ({ ...current, courseId: '' })); void refreshMappings(item.id) }}
                isSelected={selected === item.id}
              />
            )
          })}
          {filteredCurricula.length === 0 && <p className="empty">{authorityCurricula.length === 0 ? 'No curricula configured under this authority.' : 'No curricula match the selected filters.'}</p>}
        </div>
      </section>
      <div className="library-workspace-tabs" role="tablist" aria-label="Curriculum sections">
        <button role="tab" aria-selected={tab === 'full'} className={tab === 'full' ? 'active' : ''} onClick={() => changeTab('full')}>Full Programmes</button>
        <button role="tab" aria-selected={tab === 'short'} className={tab === 'short' ? 'active' : ''} onClick={() => changeTab('short')}>Short Courses</button>
      </div>

      {tab === 'full' && (
        <>
          <div className="summary-grid">
            <form className="student-form" onSubmit={saveCurriculum}>
              <h3>New curriculum version</h3>
              <select aria-label="Select programme" required value={cf.programmeId} disabled={!authority || authorityProgrammes.length === 0} onChange={e => setCf({ ...cf, programmeId: e.target.value })}><option value="">{authority ? 'Select programme' : 'Select a curriculum authority first'}</option>{authorityProgrammes.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name} · {p.approvalStatus}</option>)}</select>
              {authorityProgrammes.length === 0 && <p className="empty">{authority ? 'No active, eligible full programmes are available under this authority.' : 'Select a curriculum authority to load its programmes.'}</p>}
              <div className="form-row">
                <input required placeholder="Version" value={cf.version} onChange={e => setCf({ ...cf, version: e.target.value })} />
                <input required placeholder="Title" value={cf.title} onChange={e => setCf({ ...cf, title: e.target.value })} />
              </div>
              <div className="form-row">
                <input type="number" min="0" placeholder="Minimum credits" value={cf.minimumCredits} onChange={e => setCf({ ...cf, minimumCredits: e.target.value })} />
                <input required type="date" value={cf.effectiveFrom} onChange={e => setCf({ ...cf, effectiveFrom: e.target.value })} />
                <input type="date" value={cf.effectiveTo} onChange={e => setCf({ ...cf, effectiveTo: e.target.value })} />
              </div>
              <button type="submit" disabled={saving}>{editingCurriculumId ? 'Save curriculum' : 'Add curriculum'}</button>{editingCurriculumId && <button type="button" className="secondary-button" onClick={() => { setEditingCurriculumId(null); setCf({ programmeId: '', version: '1.0', title: '', minimumCredits: '', effectiveFrom: '', effectiveTo: '', type: 'FullProgramme' }) }}>Cancel edit</button>}
            </form>

            <form className="student-form" onSubmit={saveCourse}>
              <h3>Course / unit catalogue</h3>
              <div className="form-row">
                <input required placeholder="Unit code" value={uf.code} onChange={e => setUf({ ...uf, code: e.target.value })} />
                <input required placeholder="Unit name" value={uf.name} onChange={e => setUf({ ...uf, name: e.target.value })} />
              </div>
              <div className="form-row">
              <input required type="number" min="0" placeholder="Credit units" value={uf.creditUnits} onChange={e => setUf({ ...uf, creditUnits: e.target.value })} />
              <select aria-label="Course unit type" required value={uf.courseType} onChange={e => setUf({ ...uf, courseType: e.target.value })}><option value="">Select course unit type</option><option value="Lecture">Lecture</option><option value="Practical">Practical</option><option value="Tutorial">Tutorial</option><option value="Seminar">Seminar</option><option value="Laboratory">Laboratory</option><option value="Examination">Examination</option><option value="Other">Other</option></select>
              </div>
              <input placeholder="Description (optional)" value={uf.description} onChange={e => setUf({ ...uf, description: e.target.value })} />
              <button type="submit" disabled={saving || !authority}>{editingCourseId ? 'Save course' : 'Add course'}</button>{editingCourseId && <button type="button" className="secondary-button" onClick={() => { setEditingCourseId(null); setUf({ code: '', name: '', creditUnits: '', description: '', courseType: '' }) }}>Cancel edit</button>}
            </form>
            <div className="table-wrap"><table><thead><tr><th>Code</th><th>Course / unit</th><th>Credits</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {authorityCourses.map(course => <tr key={course.id}><td>{course.code}</td><td>{course.name} {coursePrereqs[course.id]?.filter(p => p.isMandatory).length > 0 && <span className="prereq-badge" title={`Mandatory prerequisites: ${coursePrereqs[course.id]?.map(p => p.prerequisiteCode).join(', ')}`}>↗</span>}</td><td>{course.creditUnits}</td><td>{course.courseType || '—'}</td><td>{!course.authorityCode ? 'Unassigned legacy course' : course.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => editCourse(course)}>Edit</button> <button type="button" className="secondary-button" onClick={() => void toggleCourse(course)}>{course.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
              {authorityCourses.length === 0 && <tr><td colSpan={6}>No course units are registered under this authority. Add course units above to make them available for curriculum mapping.</td></tr>}
            </tbody></table></div>
          </div>

          <div className="form-row curriculum-course-mapping-form">
            <select aria-label="Select curriculum" value={selected} disabled={!authority || authorityCurricula.filter(item => item.isActive || item.id === selected).length === 0} onChange={e => { setSemesterEdit(null); setEditingMappingId(null); setMf(current => ({ ...current, courseId: '' })); void refreshMappings(e.target.value) }}>
              <option value="">{authority ? 'Select curriculum' : 'Select a curriculum authority first'}</option>
              {authorityCurricula.filter(item => item.isActive || item.id === selected).map(c => (
                <option key={c.id} value={c.id}>{c.title} · v{c.version}</option>
              ))}
            </select>
            <select aria-label="Select course" value={mf.courseId} disabled={!selected || Boolean(editingMappingId) || authorityCourses.filter(course => course.isActive || course.id === mf.courseId).length === 0} onChange={e => setMf({ ...mf, courseId: e.target.value })}>
              <option value="">{!selected ? 'Select a curriculum first' : 'Select course'}</option>
              {authorityCourses.filter(c => c.isActive || c.id === mf.courseId).map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
            <input type="number" min="1" placeholder="Year" value={mf.yearOfStudy} onChange={e => setMf({ ...mf, yearOfStudy: e.target.value })} />
            <input type="number" min="1" placeholder="Semester" value={mf.semesterNumber} onChange={e => setMf({ ...mf, semesterNumber: e.target.value })} />
            <label>
              <input type="checkbox" checked={mf.isCore} onChange={e => setMf({ ...mf, isCore: e.target.checked })} /> Core
            </label>
            <div className="curriculum-mapping-actions">
              <button type="button" onClick={saveMapping} disabled={saving || !selected || !mf.courseId}>{editingMappingId ? 'Save course-unit placement' : 'Add course unit to semester'}</button>
              {editingMappingId && <button type="button" className="secondary-button" onClick={() => { setEditingMappingId(null); setMf({ courseId: '', yearOfStudy: '1', semesterNumber: '1', isCore: true }) }}>Cancel edit</button>}
            </div>
          </div>

          <div className="form-row curriculum-course-mapping-form bulk-mapping-form">
            <h4>Bulk add courses</h4>
            <div className="form-row">
              <textarea placeholder="Course IDs (comma-separated)" value={bulkCourseIds.join(', ')} onChange={e => setBulkCourseIds(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} rows={2} />
            </div>
            <div className="form-row">
              <input type="number" min="1" placeholder="Year" value={bulkYear} onChange={e => setBulkYear(e.target.value)} />
              <input type="number" min="1" placeholder="Semester" value={bulkSemester} onChange={e => setBulkSemester(e.target.value)} />
              <label>
                <input type="checkbox" checked={bulkIsCore} onChange={e => setBulkIsCore(e.target.checked)} /> Core
              </label>
            </div>
            <button type="button" onClick={saveBulkMapping} disabled={saving || !selected || bulkCourseIds.length === 0}>Add {bulkCourseIds.length} courses in bulk</button>
          </div>
          {authorityCurricula.filter(item => item.isActive || item.id === selected).length === 0 && <p className="empty">{authority ? 'No active curricula are available under this authority.' : 'Select a curriculum authority to load curricula.'}</p>}
          {selected && authorityCourses.filter(course => course.isActive || course.id === mf.courseId).length === 0 && <p className="empty">No active courses are available in this authority catalogue.</p>}

          {selected && ['SCHOOL_BASED', 'UVTAB', 'UHPAB'].includes(resolveAcademicAuthority(authority)) && (
            <form className="student-form curriculum-school-course-form" onSubmit={saveEditableAuthorityCourseUnit}>
              <h3>{authority === 'UVTAB' ? 'Add UVTAB competence area / unit' : authority === 'UHPAB' ? 'Add or correct UHPAB course unit for this programme' : 'Add school-based course unit directly to this curriculum'}</h3>
              <p className="empty">{authority === 'UVTAB' ? 'Enter the verified competence area or competence unit from the UVTAB training package. Map it to the appropriate year and semester.' : authority === 'UHPAB' ? 'Enter the course unit exactly as it should appear in this programme curriculum. It is saved to the UHPAB catalogue and linked to this programme curriculum and semester.' : 'Enter the unit from the institution’s approved curriculum. It will be saved in the SCHOOL_BASED catalogue and placed in the selected year and semester.'}</p>
              <div className="form-row">
                <input required placeholder={authority === 'UVTAB' ? 'Competence code' : authority === 'UHPAB' ? 'UHPAB course-unit code' : 'Course/unit code'} value={schoolUnitForm.code} onChange={e => setSchoolUnitForm({ ...schoolUnitForm, code: e.target.value })} />
                <input required placeholder={authority === 'UVTAB' ? 'Competence area / unit name' : authority === 'UHPAB' ? 'UHPAB course-unit name' : 'Course/unit name'} value={schoolUnitForm.name} onChange={e => setSchoolUnitForm({ ...schoolUnitForm, name: e.target.value })} />
              </div>
              <div className="form-row">
                <input required type="number" min="0" placeholder="Credit units" value={schoolUnitForm.creditUnits} onChange={e => setSchoolUnitForm({ ...schoolUnitForm, creditUnits: e.target.value })} />
                <select aria-label={authority === 'UVTAB' ? 'Competence type' : authority === 'UHPAB' ? 'UHPAB course unit type' : 'School-based course unit type'} required value={schoolUnitForm.courseType} onChange={e => setSchoolUnitForm({ ...schoolUnitForm, courseType: e.target.value })}>
                  {authority === 'UVTAB' ? <><option value="">Select competence type</option><option value="Competence Area">Competence Area</option><option value="Competence Unit">Competence Unit</option><option value="Workplace Practice">Workplace Practice</option><option value="Theory">Theory</option><option value="Assessment">Assessment</option><option value="Other">Other</option></> : <><option value="">Select course unit type</option><option value="Lecture">Lecture</option><option value="Practical">Practical</option><option value="Tutorial">Tutorial</option><option value="Seminar">Seminar</option><option value="Laboratory">Laboratory</option><option value="Examination">Examination</option><option value="Other">Other</option></>}
                </select>
              </div>
              <input placeholder="Description / learning outcomes (optional)" value={schoolUnitForm.description} onChange={e => setSchoolUnitForm({ ...schoolUnitForm, description: e.target.value })} />
              <div className="form-row">
                <label>Year of study<input required type="number" min="1" value={schoolUnitForm.yearOfStudy} onChange={e => setSchoolUnitForm({ ...schoolUnitForm, yearOfStudy: e.target.value })} /></label>
                <label>Semester<input required type="number" min="1" value={schoolUnitForm.semesterNumber} onChange={e => setSchoolUnitForm({ ...schoolUnitForm, semesterNumber: e.target.value })} /></label>
                <label><input type="checkbox" checked={schoolUnitForm.isCore} onChange={e => setSchoolUnitForm({ ...schoolUnitForm, isCore: e.target.checked })} /> Core unit</label>
              </div>
              <button type="submit" disabled={saving || !selected || !schoolUnitForm.code.trim() || !schoolUnitForm.name.trim()}>Save and add to semester</button>
            </form>
          )}

          {selected && (
            <div className="curriculum-semester-list">
              <div className="form-row curriculum-semester-actions">
                <button type="button" onClick={async () => {
                  try {
                    const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}/api/curriculum-management/curricula/${encodeURIComponent(selected)}/courses/export`)
                    if (res.ok) {
                      const blob = await res.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `curriculum-${selected}.csv`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                  } catch { /* non-critical */ }
                }}>Export curriculum as CSV</button>
              </div>
              {semesterGroups.map(group => (
                <section className="catalogue-board curriculum-semester" key={`${group.year}-${group.semester}`}>
                  <div className="panel-heading">
                    <h3>{group.code} · Year {group.year}</h3>
                    <div className="curriculum-semester-actions">
                      {selected && creditLoad[selected] && (
                        <span className={`credit-load-badge ${getCreditLoadClass(selected, group.year, group.semester)}`}>
                          {getCreditLoadText(selected, group.year, group.semester)}
                        </span>
                      )}
                      <button type="button" className="secondary-button" onClick={() => beginSemesterEdit(group.year, group.semester)}>Edit {group.code}</button>
                      <button type="button" className="danger-button" onClick={() => void removeSemester(group.year, group.semester, group.mappings.length)}>Remove {group.code}</button>
                    </div>
                  </div>
                  {semesterEdit?.year === group.year && semesterEdit.semester === group.semester && (
                    <div className="form-row curriculum-semester-edit">
                      <label>Year
                        <input type="number" min="1" value={semesterEdit.nextYear} onChange={event => setSemesterEdit({ ...semesterEdit, nextYear: event.target.value })} />
                      </label>
                      <label>Semester
                        <input type="number" min="1" value={semesterEdit.nextSemester} onChange={event => setSemesterEdit({ ...semesterEdit, nextSemester: event.target.value })} />
                      </label>
                      <button type="button" onClick={() => void saveSemesterEdit()} disabled={saving || Number(semesterEdit.nextYear) < 1 || Number(semesterEdit.nextSemester) < 1}>Save semester</button>
                      <button type="button" className="secondary-button" onClick={() => setSemesterEdit(null)}>Cancel</button>
                    </div>
                  )}
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Course unit</th><th>Credit units</th><th>Core / Elective</th><th>Actions</th></tr></thead>
                      <tbody>
                        {group.mappings.map(mapping => {
                          const course = courses.find(item => item.id === mapping.courseId)
                          return (
                            <tr key={mapping.id}>
                              <td>{course?.code ?? '—'} — {course?.name ?? 'Unknown course'}</td>
                              <td>{course?.creditUnits ?? '—'}</td>
                              <td>{mapping.isCore ? 'Core' : 'Elective'}</td>
                              <td>
                                <button type="button" onClick={() => editMapping(mapping)}>Edit</button>
                                <button type="button" className="danger-button" onClick={() => void removeCourseUnit(mapping)}>Remove</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
              {semesterGroups.length === 0 && <p className="empty">No course-unit groupings configured.</p>}
            </div>
          )}
        </>
      )}

      {tab === 'short' && (
        <div className="short-course-section">
          <div className="short-course-form-panel">
            <h4>Create Short-Course Curriculum</h4>
          {authorityProgrammes.length === 0 && <p className="empty">No eligible programmes.</p>}
            <form className="student-form" onSubmit={saveCurriculum}>
              <div className="form-row">
                <select aria-label="Select programme" required value={cf.programmeId} disabled={!authority || authorityProgrammes.length === 0} onChange={e => setCf({ ...cf, programmeId: e.target.value })}><option value="">Select the programme this short course belongs to</option>{authorityProgrammes.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name} · {p.approvalStatus}</option>)}</select>
                <input required placeholder="Version" value={cf.version} onChange={e => setCf({ ...cf, version: e.target.value })} />
              </div>
              <input required placeholder="Curriculum title (e.g. Certificate in Public Health)" value={cf.title} onChange={e => setCf({ ...cf, title: e.target.value })} />
              <div className="form-row">
                <input type="number" min="0" placeholder="Minimum credits" value={cf.minimumCredits} onChange={e => setCf({ ...cf, minimumCredits: e.target.value })} />
                <input required type="date" value={cf.effectiveFrom} onChange={e => setCf({ ...cf, effectiveFrom: e.target.value })} />
                <input type="date" value={cf.effectiveTo} onChange={e => setCf({ ...cf, effectiveTo: e.target.value })} />
              </div>
              <button type="submit" disabled={saving}>{editingCurriculumId ? 'Save short-course curriculum' : 'Add short-course curriculum'}</button>{editingCurriculumId && <button type="button" className="secondary-button" onClick={() => { setEditingCurriculumId(null); setCf({ programmeId: '', version: '1.0', title: '', minimumCredits: '', effectiveFrom: '', effectiveTo: '', type: 'ShortCourse' }) }}>Cancel edit</button>}
            </form>
          </div>
          <section className="catalogue-board" aria-label="Short-course course catalogue">
            <form className="student-form" onSubmit={saveCourse}>
              <h3>Course / unit catalogue</h3>
              <div className="form-row">
                <input required placeholder="Unit code" value={uf.code} onChange={e => setUf({ ...uf, code: e.target.value })} />
                <input required placeholder="Unit name" value={uf.name} onChange={e => setUf({ ...uf, name: e.target.value })} />
              </div>
              <div className="form-row">
              <input required type="number" min="0" placeholder="Credit units" value={uf.creditUnits} onChange={e => setUf({ ...uf, creditUnits: e.target.value })} />
              <select aria-label="Course unit type" required value={uf.courseType} onChange={e => setUf({ ...uf, courseType: e.target.value })}><option value="Lecture">Lecture</option><option value="Practical">Practical</option><option value="Tutorial">Tutorial</option><option value="Seminar">Seminar</option><option value="Laboratory">Laboratory</option><option value="Examination">Examination</option><option value="Other">Other</option></select>
              </div>
              <input placeholder="Description (optional)" value={uf.description} onChange={e => setUf({ ...uf, description: e.target.value })} />
              <button type="submit" disabled={saving || !authority}>{editingCourseId ? 'Save course' : 'Add course'}</button>{editingCourseId && <button type="button" className="secondary-button" onClick={() => { setEditingCourseId(null); setUf({ code: '', name: '', creditUnits: '', description: '', courseType: '' }) }}>Cancel edit</button>}
            </form>
            <div className="table-wrap"><table><thead><tr><th>Code</th><th>Course / unit</th><th>Credits</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {groupedAuthorityCourses.map(group => <Fragment key={`group-${group.programme?.id ?? 'other'}`}>
                <tr className="course-catalogue-group"><th colSpan={6}>{group.programme ? `${group.programme.code} — ${group.programme.name}` : 'Other / unassigned courses'} <span>({group.courses.length})</span></th></tr>
                {group.courses.map(course => <tr key={course.id}><td>{course.code}</td><td>{course.name} {coursePrereqs[course.id]?.filter(p => p.isMandatory).length > 0 && <span className="prereq-badge" title={`Mandatory prerequisites: ${coursePrereqs[course.id]?.map(p => p.prerequisiteCode).join(', ')}`}>↗</span>}</td><td>{course.creditUnits}</td><td>{course.courseType || '—'}</td><td>{!course.authorityCode ? 'Unassigned legacy course' : course.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => editCourse(course)}>Edit</button> <button type="button" className="secondary-button" onClick={() => void toggleCourse(course)}>{course.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
              </Fragment>)}
              {authorityCourses.length === 0 && <tr><td colSpan={6}>No courses registered.</td></tr>}
            </tbody></table></div>
          </section>
          <div className="form-row curriculum-course-mapping-form">
            <select aria-label="Select curriculum" value={selected} disabled={!authority || authorityCurricula.filter(item => item.isActive || item.id === selected).length === 0} onChange={e => { setSemesterEdit(null); setEditingMappingId(null); setMf(current => ({ ...current, courseId: '' })); void refreshMappings(e.target.value) }}>
              <option value="">{authority ? 'Select curriculum' : 'Select a curriculum authority first'}</option>
              {authorityCurricula.filter(item => item.isActive || item.id === selected).map(c => (
                <option key={c.id} value={c.id}>{c.title} · v{c.version}</option>
              ))}
            </select>
            <select aria-label="Select course" value={mf.courseId} disabled={!selected || Boolean(editingMappingId) || authorityCourses.filter(course => course.isActive || course.id === mf.courseId).length === 0} onChange={e => setMf({ ...mf, courseId: e.target.value })}>
              <option value="">Select course</option>
              {authorityCourses.filter(c => c.isActive || c.id === mf.courseId).map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
            <input type="number" min="1" placeholder="Year" value={mf.yearOfStudy} onChange={e => setMf({ ...mf, yearOfStudy: e.target.value })} />
            <input type="number" min="1" placeholder="Semester" value={mf.semesterNumber} onChange={e => setMf({ ...mf, semesterNumber: e.target.value })} />
            <label>
              <input type="checkbox" checked={mf.isCore} onChange={e => setMf({ ...mf, isCore: e.target.checked })} /> Core
            </label>
            <div className="curriculum-mapping-actions">
              <button type="button" onClick={saveMapping} disabled={saving || !selected || !mf.courseId}>{editingMappingId ? 'Save course-unit placement' : 'Add course unit to semester'}</button>
              {editingMappingId && <button type="button" className="secondary-button" onClick={() => { setEditingMappingId(null); setMf({ courseId: '', yearOfStudy: '1', semesterNumber: '1', isCore: true }) }}>Cancel edit</button>}
            </div>
          </div>

          <div className="form-row curriculum-course-mapping-form bulk-mapping-form">
            <h4>Bulk add courses</h4>
            <div className="form-row">
              <textarea placeholder="Course IDs (comma-separated)" value={bulkCourseIds.join(', ')} onChange={e => setBulkCourseIds(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} rows={2} />
            </div>
            <div className="form-row">
              <input type="number" min="1" placeholder="Year" value={bulkYear} onChange={e => setBulkYear(e.target.value)} />
              <input type="number" min="1" placeholder="Semester" value={bulkSemester} onChange={e => setBulkSemester(e.target.value)} />
              <label>
                <input type="checkbox" checked={bulkIsCore} onChange={e => setBulkIsCore(e.target.checked)} /> Core
              </label>
            </div>
            <button type="button" onClick={saveBulkMapping} disabled={saving || !selected || bulkCourseIds.length === 0}>Add {bulkCourseIds.length} courses in bulk</button>
          </div>
          {authorityCurricula.filter(item => item.isActive || item.id === selected).length === 0 && <p className="empty">{authority ? 'No active curricula are available under this authority.' : 'Select a curriculum authority to load curricula.'}</p>}
          {selected && authorityCourses.filter(course => course.isActive || course.id === mf.courseId).length === 0 && <p className="empty">No active courses are available in this authority catalogue.</p>}

          {selected && (
            <div className="curriculum-semester-list">
              <div className="form-row curriculum-semester-actions">
                <button type="button" onClick={async () => {
                  try {
                    const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}/api/curriculum-management/curricula/${encodeURIComponent(selected)}/courses/export`)
                    if (res.ok) {
                      const blob = await res.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `curriculum-${selected}.csv`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                  } catch { /* non-critical */ }
                }}>Export curriculum as CSV</button>
              </div>
              {semesterGroups.map(group => (
                <section className="catalogue-board curriculum-semester" key={`${group.year}-${group.semester}`}>
                  <div className="panel-heading">
                    <h3>{group.code} · Year {group.year}</h3>
                    <div className="curriculum-semester-actions">
                      {selected && creditLoad[selected] && (
                        <span className={`credit-load-badge ${getCreditLoadClass(selected, group.year, group.semester)}`}>
                          {getCreditLoadText(selected, group.year, group.semester)}
                        </span>
                      )}
                      <button type="button" className="secondary-button" onClick={() => beginSemesterEdit(group.year, group.semester)}>Edit {group.code}</button>
                      <button type="button" className="danger-button" onClick={() => void removeSemester(group.year, group.semester, group.mappings.length)}>Remove {group.code}</button>
                    </div>
                  </div>
                  {semesterEdit?.year === group.year && semesterEdit.semester === group.semester && (
                    <div className="form-row curriculum-semester-edit">
                      <label>Year
                        <input type="number" min="1" value={semesterEdit.nextYear} onChange={event => setSemesterEdit({ ...semesterEdit, nextYear: event.target.value })} />
                      </label>
                      <label>Semester
                        <input type="number" min="1" value={semesterEdit.nextSemester} onChange={event => setSemesterEdit({ ...semesterEdit, nextSemester: event.target.value })} />
                      </label>
                      <button type="button" onClick={() => void saveSemesterEdit()} disabled={saving || Number(semesterEdit.nextYear) < 1 || Number(semesterEdit.nextSemester) < 1}>Save semester</button>
                      <button type="button" className="secondary-button" onClick={() => setSemesterEdit(null)}>Cancel</button>
                    </div>
                  )}
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Course unit</th><th>Credit units</th><th>Core / Elective</th><th>Actions</th></tr></thead>
                      <tbody>
                        {group.mappings.map(mapping => {
                          const course = courses.find(item => item.id === mapping.courseId)
                          return (
                            <tr key={mapping.id}>
                              <td>{course?.code ?? '—'} — {course?.name ?? 'Unknown course'}</td>
                              <td>{course?.creditUnits ?? '—'}</td>
                              <td>{mapping.isCore ? 'Core' : 'Elective'}</td>
                              <td>
                                <button type="button" onClick={() => editMapping(mapping)}>Edit</button>
                                <button type="button" className="danger-button" onClick={() => void removeCourseUnit(mapping)}>Remove</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
              {semesterGroups.length === 0 && <p className="empty">No course-unit groupings configured.</p>}
            </div>
          )}
        </div>
      )}
      <CurriculumLogbookManagement curricula={authorityCurricula} selectedCurriculumId={selected} onSelectCurriculum={id => void refreshMappings(id)} />
      <CurriculumGovernancePanel curricula={authorityCurricula} selectedCurriculumId={selected} onSelectCurriculum={id => void refreshMappings(id)} canManage={canManage} onChanged={() => void load()} />
    </section>
  )
}
