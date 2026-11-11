import { useEffect, useState } from 'react'
import './AcademicStructures.css'
import { createAcademicClass, getClassesByProgramme, setAcademicClassStatus, updateAcademicClass, type AcademicClass } from '../api/academicClasses'
import { getProgrammes, type Programme } from '../api/programmes'
import { getStreamsByClass, createStream, updateStream, type Stream } from '../api/streams'
import { getCourses, type Course } from '../api/curriculumManagement'
import { getSubjectsByProgramme, createSubject, updateSubject, type Subject } from '../api/subjects'
import { getAcademicYears, getPeriodsForYear, type AcademicPeriod, type AcademicYear } from '../api/academicStructure'

interface AcademicStructuresProps {
  canManage: boolean
}

type StructureView = 'classes' | 'streams' | 'subjects'

export function AcademicStructures({ canManage }: AcademicStructuresProps) {
  const [view, setView] = useState<StructureView>('classes')
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [selectedProgramme, setSelectedProgramme] = useState('')
  const [classes, setClasses] = useState<AcademicClass[]>([])
  const [streams, setStreams] = useState<Stream[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [classSearch, setClassSearch] = useState('')
  const [classStatusFilter, setClassStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [classForm, setClassForm] = useState({ code: '', name: '', yearOfStudy: '1', periodId: '', maxEnrolment: '' })
  const [streamForm, setStreamForm] = useState({ code: '', name: '' })
  const [subjectForm, setSubjectForm] = useState({ courseId: '', yearOfStudy: '1', periodSequence: '', isCompulsory: true, electiveGroup: '' })

  useEffect(() => {
    if (!canManage) return
    void loadProgrammes()
    void loadAcademicYears()
  }, [canManage])

  useEffect(() => {
    if (!selectedAcademicYear || !canManage) {
      setPeriods([])
      setClassForm(current => ({ ...current, periodId: '' }))
      return
    }
    let cancelled = false
    setLoading(true)
    getPeriodsForYear(selectedAcademicYear)
      .then(items => {
        if (cancelled) return
        setPeriods(items)
        setClassForm(current => ({ ...current, periodId: items.some(period => period.id === current.periodId) ? current.periodId : '' }))
      })
      .catch(e => {
        if (!cancelled) {
          setPeriods([])
          setError(e instanceof Error ? e.message : 'Unable to load academic periods.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedAcademicYear, canManage])

  useEffect(() => {
    if (!selectedProgramme || !canManage) return
    void loadProgrammeData(selectedProgramme)
  }, [selectedProgramme, canManage])

  useEffect(() => {
    if (!selectedClass || !canManage) {
      setStreams([])
      return
    }
    let cancelled = false
    getStreamsByClass(selectedClass)
      .then(items => { if (!cancelled) setStreams(items) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load streams.') })
    return () => { cancelled = true }
  }, [selectedClass, canManage])

  async function loadAcademicYears() {
    try {
      const items = await getAcademicYears()
      setAcademicYears(items)
      const preferred = items.find(year => year.isCurrent && year.isActive) ?? items.find(year => year.isActive)
      if (preferred) setSelectedAcademicYear(current => current || preferred.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load academic years.')
    }
  }

  async function loadProgrammes() {
    try {
      setError('')
      setProgrammes(await getProgrammes())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load programmes.')
    }
  }

  async function loadProgrammeData(programmeId: string) {
    setLoading(true)
    try {
      setError('')
      const [cls, crs] = await Promise.all([
        getClassesByProgramme(programmeId),
        getCourses(),
      ])
      setClasses(cls)
      setSelectedClass(current => cls.some(item => item.id === current) ? current : (cls[0]?.id ?? ''))
      setCourses(crs)
      setSubjects(await getSubjectsByProgramme(programmeId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load programme data.')
    } finally {
      setLoading(false)
    }
  }

  function loadStreams(classId: string) {
    setSelectedClass(classId)
    if (!classId) setStreams([])
  }

  async function saveClass(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProgramme || !classForm.code.trim() || !classForm.periodId) return
    setLoading(true)
    try {
      const values = {
        code: classForm.code.trim(),
        name: classForm.name.trim() || undefined,
        yearOfStudy: Number(classForm.yearOfStudy),
        maxEnrolment: classForm.maxEnrolment ? Number(classForm.maxEnrolment) : undefined,
      }
      if (editingClassId) {
        const existing = classes.find(item => item.id === editingClassId)
        await updateAcademicClass(editingClassId, { id: editingClassId, ...values, status: existing?.status ?? 0 })
        setMessage('Class updated.')
      } else {
        await createAcademicClass({ programmeId: selectedProgramme, academicPeriodId: classForm.periodId, ...values })
        setMessage('Class created.')
      }
      setEditingClassId(null)
      setClassForm({ ...classForm, code: '', name: '', maxEnrolment: '' })
      if (selectedProgramme) await loadProgrammeData(selectedProgramme)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create class.')
    } finally {
      setLoading(false)
    }
  }

  function editClass(item: AcademicClass) {
    setEditingClassId(item.id)
    setClassForm({
      code: item.code,
      name: item.name ?? '',
      yearOfStudy: String(item.yearOfStudy),
      periodId: item.academicPeriodId,
      maxEnrolment: item.maxEnrolment == null ? '' : String(item.maxEnrolment),
    })
    setSelectedAcademicYear(periods.find(period => period.id === item.academicPeriodId)?.academicYearId ?? selectedAcademicYear)
    setMessage('')
  }

  async function toggleClassStatus(item: AcademicClass) {
    const nextStatus = item.status === 0 ? 1 : 0
    try {
      setLoading(true)
      setError('')
      await setAcademicClassStatus(item.id, nextStatus)
      setClasses(current => current.map(row => row.id === item.id ? { ...row, status: nextStatus } : row))
      setMessage(nextStatus === 0 ? 'Class reactivated.' : 'Class closed.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update class status.')
    } finally {
      setLoading(false)
    }
  }

  async function saveStream(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClass || !streamForm.code.trim()) return
    setLoading(true)
    try {
      const values = { code: streamForm.code.trim(), name: streamForm.name.trim() || undefined }
      if (editingStreamId) {
        const existing = streams.find(item => item.id === editingStreamId)
        await updateStream(editingStreamId, { ...values, isActive: existing?.isActive ?? true })
        setMessage('Stream updated.')
      } else {
        await createStream({ academicClassId: selectedClass, ...values })
        setMessage('Stream created.')
      }
      setEditingStreamId(null)
      setStreamForm({ code: '', name: '' })
      if (selectedClass) setStreams(await getStreamsByClass(selectedClass))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create stream.')
    } finally {
      setLoading(false)
    }
  }

  function editStream(item: Stream) {
    setEditingStreamId(item.id)
    setStreamForm({ code: item.code, name: item.name ?? '' })
    setMessage('')
  }

  async function toggleStream(item: Stream) {
    try {
      setLoading(true); setError('')
      await updateStream(item.id, { code: item.code, name: item.name ?? undefined, isActive: !item.isActive })
      setStreams(current => current.map(row => row.id === item.id ? { ...row, isActive: !row.isActive } : row))
      setMessage(item.isActive ? 'Stream deactivated.' : 'Stream activated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update stream.') }
    finally { setLoading(false) }
  }

  async function saveSubject(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProgramme || !subjectForm.courseId) return
    setLoading(true)
    try {
      const values = {
        courseId: subjectForm.courseId,
        yearOfStudy: Number(subjectForm.yearOfStudy),
        periodSequence: subjectForm.periodSequence ? Number(subjectForm.periodSequence) : undefined,
        isCompulsory: subjectForm.isCompulsory,
        electiveGroup: subjectForm.electiveGroup.trim() || undefined,
      }
      if (editingSubjectId) {
        const existing = subjects.find(item => item.id === editingSubjectId)
        await updateSubject(editingSubjectId, { ...values, isActive: existing?.isActive ?? true })
        setMessage('Subject updated.')
      } else {
        await createSubject({ programmeId: selectedProgramme, ...values })
        setMessage('Subject added.')
      }
      setEditingSubjectId(null)
      setSubjectForm({ ...subjectForm, courseId: '', electiveGroup: '' })
      if (selectedProgramme) await loadProgrammeData(selectedProgramme)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add subject.')
    } finally {
      setLoading(false)
    }
  }

  function editSubject(item: Subject) {
    setEditingSubjectId(item.id)
    setSubjectForm({
      courseId: item.courseId,
      yearOfStudy: String(item.yearOfStudy),
      periodSequence: item.periodSequence == null ? '' : String(item.periodSequence),
      isCompulsory: item.isCompulsory,
      electiveGroup: item.electiveGroup ?? '',
    })
    setMessage('')
  }

  async function toggleSubject(item: Subject) {
    try {
      setLoading(true); setError('')
      await updateSubject(item.id, {
        courseId: item.courseId, yearOfStudy: item.yearOfStudy,
        periodSequence: item.periodSequence ?? undefined, isCompulsory: item.isCompulsory,
        electiveGroup: item.electiveGroup ?? undefined, isActive: !item.isActive,
      })
      setSubjects(current => current.map(row => row.id === item.id ? { ...row, isActive: !row.isActive } : row))
      setMessage(item.isActive ? 'Subject deactivated.' : 'Subject activated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update subject.') }
    finally { setLoading(false) }
  }

  if (!canManage) {
    return <section className="panel"><h3>Academic Structures</h3><p className="empty">Your role does not have academic-management access.</p></section>
  }

  const periodIds = new Set(periods.map(period => period.id))
  const query = classSearch.trim().toLocaleLowerCase()
  const visibleClasses = classes.filter(item => {
    const matchesYear = !selectedAcademicYear || periods.length === 0 || periodIds.has(item.academicPeriodId)
    const matchesPeriod = periodFilter === 'all' || item.academicPeriodId === periodFilter
    const matchesStatus = classStatusFilter === 'all' || String(item.status) === classStatusFilter
    const matchesSearch = !query || item.code.toLocaleLowerCase().includes(query) || (item.name ?? '').toLocaleLowerCase().includes(query)
    return matchesYear && matchesPeriod && matchesStatus && matchesSearch
  })

  const selectedClassRecord = classes.find(item => item.id === selectedClass)

  return (
    <section className="academic-workspace academic-structures-screen" aria-label="Academic structures workspace">
      <header className="academic-structures-header">
        <div>
          <p className="eyebrow">Academic Management</p>
          <h2>Class Register</h2>
          <p className="academic-structures-subtitle">Manage programme classes, streams and subjects.</p>
        </div>
        <div className="academic-structures-header-actions">
          <button type="button" className="academic-structures-primary" onClick={() => { setView('classes'); setEditingClassId(null); setClassForm({ code: '', name: '', yearOfStudy: '1', periodId: '', maxEnrolment: '' }) }} disabled={!selectedProgramme}>Add class</button>
        </div>
      </header>

      <div className="academic-structures-filters">
        <label>
          <span>Programme</span>
          <select id="structure-programme" value={selectedProgramme} onChange={e => { setSelectedProgramme(e.target.value); setSelectedClass(''); setStreams([]) }}>
            <option value="">Select programme</option>
            {programmes.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </select>
        </label>
        <label>
          <span>Academic year</span>
          <select id="structure-academic-year" value={selectedAcademicYear} onChange={e => { setSelectedAcademicYear(e.target.value); setPeriodFilter('all') }}>
            <option value="">Select academic year</option>
            {academicYears.filter(year => year.isActive).map(year => <option key={year.id} value={year.id}>{year.name}{year.isCurrent ? ' (Current)' : ''}</option>)}
          </select>
        </label>
        <label>
          <span>Period</span>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} disabled={!selectedAcademicYear || periods.length === 0}>
            <option value="all">All periods</option>
            {periods.filter(period => period.isActive).map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
          </select>
        </label>
      </div>

      <nav className="academic-structures-tabs" role="tablist" aria-label="Academic structure views">
        <button type="button" role="tab" aria-selected={view === 'classes'} className={view === 'classes' ? 'active' : ''} onClick={() => setView('classes')}>Classes</button>
        <button type="button" role="tab" aria-selected={view === 'streams'} className={view === 'streams' ? 'active' : ''} onClick={() => setView('streams')}>Streams</button>
        <button type="button" role="tab" aria-selected={view === 'subjects'} className={view === 'subjects' ? 'active' : ''} onClick={() => setView('subjects')}>Subjects</button>
      </nav>

      {error && <div className="error academic-structures-alert" role="alert">{error}</div>}
      {message && <p className="success academic-structures-alert" role="status">{message}</p>}
      {loading && <p className="academic-structures-loading" aria-live="polite">Loading academic records…</p>}

      {!selectedProgramme && <div className="academic-structures-empty">Select a programme to view and manage its academic structure.</div>}

      {view === 'classes' && selectedProgramme && (
        <div className="academic-classes-layout">
          <div className="academic-structures-stats" aria-label="Class summary">
            <article><span>Total classes</span><strong>{visibleClasses.length}</strong></article>
            <article><span>Active</span><strong>{visibleClasses.filter(item => item.status === 0).length}</strong></article>
            <article><span>Closed</span><strong>{visibleClasses.filter(item => item.status === 1).length}</strong></article>
            <article><span>Streams in selected class</span><strong>{selectedClass ? streams.length : '—'}</strong></article>
          </div>

          <section className="academic-structures-panel">
            <div className="academic-structures-section-heading">
              <div><h3>Classes</h3><span>{visibleClasses.length} of {classes.length} records</span></div>
              <button type="button" className="academic-structures-primary" onClick={() => { setEditingClassId(null); setClassForm({ code: '', name: '', yearOfStudy: '1', periodId: '', maxEnrolment: '' }) }}>Add class</button>
            </div>

            <div className="academic-structures-toolbar">
              <label className="academic-structures-search">
                <span className="sr-only">Search classes</span>
                <input type="search" value={classSearch} onChange={e => setClassSearch(e.target.value)} placeholder="Search by class code or name" />
              </label>
              <label>
                <span className="sr-only">Filter class status</span>
                <select value={classStatusFilter} onChange={e => setClassStatusFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="0">Active</option>
                  <option value="1">Closed</option>
                  <option value="2">Cancelled</option>
                </select>
              </label>
            </div>

            <div className="table-wrap academic-structures-table-wrap">
              <table>
                <thead><tr><th>Class code</th><th>Class name</th><th>Year</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {visibleClasses.length === 0 ? <tr><td colSpan={6} className="empty">No classes match the selected filters.</td></tr> : visibleClasses.map(item => (
                    <tr key={item.id} className={selectedClass === item.id ? 'is-selected' : ''} >
                      <td><strong>{item.code}</strong></td><td>{item.name || '—'}</td><td>{item.yearOfStudy}</td><td>{item.maxEnrolment ?? 'Not set'}</td>
                      <td><span className={`academic-class-status status-${item.status}`}>{item.status === 0 ? 'Active' : item.status === 1 ? 'Closed' : 'Cancelled'}</span></td>
                      <td className="academic-structures-row-actions">
                        <button type="button" className="academic-structures-link-button" onClick={event => { event.stopPropagation(); void loadStreams(item.id) }}>View</button>
                        <button type="button" className="academic-structures-link-button" onClick={event => { event.stopPropagation(); editClass(item) }}>Edit</button>
                        <button type="button" className="academic-structures-secondary" disabled={item.status === 2 || loading} onClick={event => { event.stopPropagation(); void toggleClassStatus(item) }}>{item.status === 0 ? 'Close' : 'Reopen'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="academic-classes-bottom-grid">
            <section className="academic-structures-panel academic-class-form-panel">
              <div className="academic-structures-section-heading">
                <div><h3>{editingClassId ? 'Edit class' : 'Add a class'}</h3><span>Class details and academic placement</span></div>
                {editingClassId && <button type="button" className="academic-structures-secondary" onClick={() => { setEditingClassId(null); setClassForm({ code: '', name: '', yearOfStudy: '1', periodId: '', maxEnrolment: '' }) }}>Cancel edit</button>}
              </div>
              <form className="academic-structures-form" onSubmit={saveClass}>
                <label><span>Class code *</span><input required maxLength={40} value={classForm.code} onChange={e => setClassForm({ ...classForm, code: e.target.value })} placeholder="e.g. DPH-Y1" /></label>
                <label><span>Display name</span><input maxLength={120} value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} placeholder="e.g. Diploma Year 1" /></label>
                <label><span>Year of study *</span><input required type="number" min="1" max="20" value={classForm.yearOfStudy} onChange={e => setClassForm({ ...classForm, yearOfStudy: e.target.value })} /></label>
                <label><span>Academic period *</span><select required value={classForm.periodId} onChange={e => setClassForm({ ...classForm, periodId: e.target.value })}><option value="">Select period</option>{periods.filter(period => period.isActive).map(period => <option key={period.id} value={period.id}>{period.name}</option>)}</select></label>
                <label><span>Maximum enrolment</span><input type="number" min="1" value={classForm.maxEnrolment} onChange={e => setClassForm({ ...classForm, maxEnrolment: e.target.value })} placeholder="Optional capacity" /></label>
                <div className="academic-structures-form-actions"><button type="submit" className="academic-structures-primary" disabled={loading || !classForm.periodId}>{editingClassId ? 'Save changes' : 'Create class'}</button></div>
              </form>
            </section>

            <section className="academic-structures-panel academic-class-detail-panel">
              <div className="academic-structures-section-heading">
                <div><h3>{selectedClassRecord ? selectedClassRecord.name || selectedClassRecord.code : 'Class details'}</h3><span>{selectedClassRecord ? selectedClassRecord.code : 'Select a class from the register'}</span></div>
                {selectedClassRecord && <span className={`academic-class-status status-${selectedClassRecord.status}`}>{selectedClassRecord.status === 0 ? 'Active' : selectedClassRecord.status === 1 ? 'Closed' : 'Cancelled'}</span>}
              </div>
              {selectedClassRecord ? (
                <>
                  <dl className="academic-class-facts">
                    <div><dt>Year of study</dt><dd>{selectedClassRecord.yearOfStudy}</dd></div>
                    <div><dt>Maximum enrolment</dt><dd>{selectedClassRecord.maxEnrolment ?? 'Not configured'}</dd></div>
                    <div><dt>Streams</dt><dd>{streams.length}</dd></div>
                    <div><dt>Academic period</dt><dd>{periods.find(period => period.id === selectedClassRecord.academicPeriodId)?.name ?? 'See selected academic year'}</dd></div>
                  </dl>
                  <div className="academic-structures-stream-preview">
                    <div className="academic-structures-section-heading"><h4>Streams</h4><button type="button" className="academic-structures-link-button" onClick={() => setView('streams')}>Manage streams</button></div>
                    {streams.length ? streams.map(stream => <div className="academic-stream-preview-row" key={stream.id}><span><strong>{stream.code}</strong>{stream.name && <small>{stream.name}</small>}</span><span>{stream.capacity == null ? 'Capacity not set' : `Capacity: ${stream.capacity}`}</span><span className={stream.isActive ? 'academic-stream-active' : 'academic-stream-inactive'}>{stream.isActive ? 'Active' : 'Inactive'}</span></div>) : <p className="academic-structures-muted">No streams have been configured for this class.</p>}
                  </div>
                </>
              ) : <div className="academic-structures-empty compact">Select a class to inspect its streams and details.</div>}
            </section>
          </div>
        </div>
      )}

      {view === 'streams' && selectedProgramme && (
        <>
          <section className="academic-structures-panel">
            <div className="academic-structures-section-heading"><div><h3>Stream management</h3><span>Choose a class, then add or maintain its streams.</span></div></div>
            <div className="academic-structures-toolbar">
              <label><span>Class</span><select value={selectedClass} onChange={e => void loadStreams(e.target.value)}><option value="">Select class</option>{classes.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name || item.code}</option>)}</select></label>
            </div>
            {selectedClass && (
              <form className="academic-structures-form academic-stream-form" onSubmit={saveStream}>
                <label><span>Stream code *</span><input required maxLength={30} value={streamForm.code} onChange={e => setStreamForm({ ...streamForm, code: e.target.value })} placeholder="e.g. A" /></label>
                <label><span>Stream name</span><input maxLength={100} value={streamForm.name} onChange={e => setStreamForm({ ...streamForm, name: e.target.value })} placeholder="Optional name" /></label>
                <div className="academic-structures-form-actions"><button type="submit" className="academic-structures-primary" disabled={loading}>{editingStreamId ? 'Save stream' : 'Add stream'}</button>{editingStreamId && <button type="button" className="academic-structures-secondary" onClick={() => { setEditingStreamId(null); setStreamForm({ code: '', name: '' }) }}>Cancel</button>}</div>
              </form>
            )}
            <div className="table-wrap academic-structures-table-wrap"><table><thead><tr><th>Code</th><th>Name</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead><tbody>{streams.length === 0 ? <tr><td colSpan={5} className="empty">No streams configured for this class.</td></tr> : streams.map(stream => <tr key={stream.id}><td><strong>{stream.code}</strong></td><td>{stream.name || '—'}</td><td>{stream.capacity ?? 'Not set'}</td><td>{stream.isActive ? 'Active' : 'Inactive'}</td><td className="academic-structures-row-actions"><button type="button" className="academic-structures-link-button" onClick={() => editStream(stream)}>Edit</button><button type="button" className="academic-structures-secondary" disabled={loading} onClick={() => void toggleStream(stream)}>{stream.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>
          </section>
        </>
      )}

      {view === 'subjects' && selectedProgramme && (
        <section className="academic-structures-panel">
          <div className="academic-structures-section-heading"><div><h3>Programme subjects</h3><span>Map existing courses to years and academic periods.</span></div></div>
          <form className="academic-structures-form academic-subject-form" onSubmit={saveSubject}>
            <label><span>Course *</span><select required value={subjectForm.courseId} onChange={e => setSubjectForm({ ...subjectForm, courseId: e.target.value })}><option value="">Select course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.code} — {course.name}</option>)}</select></label>
            <label><span>Year of study *</span><input type="number" min="1" value={subjectForm.yearOfStudy} onChange={e => setSubjectForm({ ...subjectForm, yearOfStudy: e.target.value })} /></label>
            <label><span>Period sequence</span><input type="number" min="1" value={subjectForm.periodSequence} onChange={e => setSubjectForm({ ...subjectForm, periodSequence: e.target.value })} placeholder="Optional" /></label>
            <label className="academic-subject-checkbox"><span>Course requirement</span><span><input type="checkbox" checked={subjectForm.isCompulsory} onChange={e => setSubjectForm({ ...subjectForm, isCompulsory: e.target.checked })} /> Compulsory</span></label>
            <label><span>Elective group</span><input value={subjectForm.electiveGroup} onChange={e => setSubjectForm({ ...subjectForm, electiveGroup: e.target.value })} placeholder="Optional" /></label>
            <div className="academic-structures-form-actions"><button type="submit" className="academic-structures-primary" disabled={loading}>{editingSubjectId ? 'Save subject' : 'Add subject'}</button>{editingSubjectId && <button type="button" className="academic-structures-secondary" onClick={() => { setEditingSubjectId(null); setSubjectForm({ courseId: '', yearOfStudy: '1', periodSequence: '', isCompulsory: true, electiveGroup: '' }) }}>Cancel</button>}</div>
          </form>
          <div className="table-wrap academic-structures-table-wrap"><table><thead><tr><th>Course</th><th>Year</th><th>Period</th><th>Type</th><th>Elective group</th><th>Status</th><th>Actions</th></tr></thead><tbody>{subjects.length === 0 ? <tr><td colSpan={7} className="empty">No subjects configured.</td></tr> : subjects.map(subject => <tr key={subject.id}><td>{courses.find(course => course.id === subject.courseId)?.code ?? subject.courseId}</td><td>{subject.yearOfStudy}</td><td>{subject.periodSequence ?? '—'}</td><td>{subject.isCompulsory ? 'Compulsory' : 'Elective'}</td><td>{subject.electiveGroup ?? '—'}</td><td>{subject.isActive ? 'Active' : 'Inactive'}</td><td className="academic-structures-row-actions"><button type="button" className="academic-structures-link-button" onClick={() => editSubject(subject)}>Edit</button><button type="button" className="academic-structures-secondary" disabled={loading} onClick={() => void toggleSubject(subject)}>{subject.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>
        </section>
      )}
    </section>
  )
}