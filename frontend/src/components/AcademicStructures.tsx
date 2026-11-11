import { useEffect, useMemo, useState } from 'react'
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
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [classSearch, setClassSearch] = useState('')
  const [classStatusFilter, setClassStatusFilter] = useState('all')

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
      setCourses(crs)
      setSubjects(await getSubjectsByProgramme(programmeId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load programme data.')
    } finally {
      setLoading(false)
    }
  }

  async function loadStreams(classId: string) {
    setSelectedClass(classId)
    if (!classId) { setStreams([]); return }
    try {
      setStreams(await getStreamsByClass(classId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load streams.')
    }
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
      if (selectedClass) await loadStreams(selectedClass)
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

  const visibleClasses = useMemo(() => classes.filter(item => {
    const matchesSearch = `${item.code} ${item.name ?? ''}`.toLowerCase().includes(classSearch.trim().toLowerCase())
    const matchesStatus = classStatusFilter === 'all' || (classStatusFilter === 'active' && item.status === 0) || (classStatusFilter === 'closed' && item.status === 1) || (classStatusFilter === 'cancelled' && item.status === 2)
    const matchesYear = !selectedAcademicYear || periods.some(period => period.id === item.academicPeriodId)
    return matchesSearch && matchesStatus && matchesYear
  }), [classes, classSearch, classStatusFilter, selectedAcademicYear, periods])
  const activeClassCount = classes.filter(item => item.status === 0).length
  const closedClassCount = classes.filter(item => item.status === 1).length

  if (!canManage) {
    return <section className="panel"><h3>Academic Structures</h3><p className="empty">Your role does not have academic-management access.</p></section>
  }

  return (
    <section className="academic-workspace" aria-label="Academic structures workspace">
      <div className="panel-heading">
        <div><p className="eyebrow">Academic Structures</p><h2>Classes, Streams &amp; Subjects</h2></div>
      </div>

      <label htmlFor="structure-programme">Programme</label>
      <select id="structure-programme" value={selectedProgramme} onChange={e => setSelectedProgramme(e.target.value)}>
        <option value="">Select programme</option>
        {programmes.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
      </select>

      <div className="form-row" role="tablist" aria-label="Academic structure views">
        <button type="button" aria-selected={view === 'classes'} onClick={() => setView('classes')}>Classes</button>
        <button type="button" aria-selected={view === 'streams'} onClick={() => setView('streams')}>Streams</button>
        <button type="button" aria-selected={view === 'subjects'} onClick={() => setView('subjects')}>Subjects</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {message && <p role="status">{message}</p>}
      {loading && <p>Loading…</p>}

      {view === 'classes' && selectedProgramme && (
        <div className="classes-register">
          <div className="classes-register__toolbar">
            <div className="classes-register__filters">
              <div className="classes-register__filter">
                <label htmlFor="structure-academic-year">Academic year</label>
                <select id="structure-academic-year" value={selectedAcademicYear} onChange={e => { setSelectedAcademicYear(e.target.value); setSelectedClass(''); setStreams([]) }}>
                  <option value="">All academic years</option>
                  {academicYears.filter(year => year.isActive).map(year => <option key={year.id} value={year.id}>{year.name}{year.isCurrent ? ' (Current)' : ''}</option>)}
                </select>
              </div>
              <div className="classes-register__filter classes-register__filter--search">
                <label htmlFor="class-register-search">Find a class</label>
                <input id="class-register-search" type="search" value={classSearch} onChange={e => setClassSearch(e.target.value)} placeholder="Search class code or name" />
              </div>
              <div className="classes-register__filter">
                <label htmlFor="class-status-filter">Status</label>
                <select id="class-status-filter" value={classStatusFilter} onChange={e => setClassStatusFilter(e.target.value)}>
                  <option value="all">All statuses</option><option value="active">Active</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="classes-register__actions">
              <button type="button" className="classes-button classes-button--primary" onClick={() => { setEditingClassId(null); setClassForm({ code: '', name: '', yearOfStudy: '1', periodId: '', maxEnrolment: '' }); document.getElementById('class-editor-code')?.focus() }}>Add class</button>
              <button type="button" className="classes-button classes-button--secondary" onClick={() => void loadProgrammeData(selectedProgramme)} disabled={loading}>Refresh</button>
            </div>
          </div>

          <div className="classes-register__summary" aria-label="Class summary">
            <article><span>Total classes</span><strong>{classes.length}</strong></article>
            <article><span>Active classes</span><strong>{activeClassCount}</strong></article>
            <article><span>Closed classes</span><strong>{closedClassCount}</strong></article>
            <article><span>Streams in selected class</span><strong>{selectedClass ? streams.length : '—'}</strong></article>
          </div>

          <div className="classes-register__editor">
            <div className="classes-register__section-heading">
              <div><h3>{editingClassId ? 'Edit class' : 'Class details'}</h3><p>{editingClassId ? 'Update the selected class information.' : 'Create a class or select a row to manage its streams.'}</p></div>
              {editingClassId && <span className="classes-register__editing">Editing</span>}
            </div>
            <form className="classes-register__form" onSubmit={saveClass}>
              <div className="classes-register__field">
                <label htmlFor="class-editor-code">Class code <span aria-hidden="true">*</span></label>
                <input id="class-editor-code" required maxLength={40} value={classForm.code} onChange={e => setClassForm({ ...classForm, code: e.target.value })} placeholder="e.g. DPH-Y1" />
              </div>
              <div className="classes-register__field">
                <label htmlFor="class-editor-name">Display name</label>
                <input id="class-editor-name" maxLength={120} value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} placeholder="e.g. Diploma in Public Health — Year 1" />
              </div>
              <div className="classes-register__field classes-register__field--small">
                <label htmlFor="class-editor-year">Year of study</label>
                <input id="class-editor-year" type="number" min="1" max="20" required value={classForm.yearOfStudy} onChange={e => setClassForm({ ...classForm, yearOfStudy: e.target.value })} />
              </div>
              <div className="classes-register__field">
                <label htmlFor="class-editor-period">Academic period <span aria-hidden="true">*</span></label>
                <select id="class-editor-period" required disabled={Boolean(editingClassId)} value={classForm.periodId} onChange={e => setClassForm({ ...classForm, periodId: e.target.value })}>
                  <option value="">Select period</option>
                  {periods.filter(period => period.isActive).map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
                </select>
              </div>
              <div className="classes-register__field classes-register__field--small">
                <label htmlFor="class-editor-capacity">Maximum enrolment</label>
                <input id="class-editor-capacity" type="number" min="1" value={classForm.maxEnrolment} onChange={e => setClassForm({ ...classForm, maxEnrolment: e.target.value })} placeholder="Optional" />
              </div>
              <div className="classes-register__form-actions">
                <button type="submit" className="classes-button classes-button--primary" disabled={loading || !classForm.periodId}>{loading ? 'Saving…' : editingClassId ? 'Save changes' : 'Save class'}</button>
                {editingClassId && <button type="button" className="classes-button classes-button--secondary" onClick={() => { setEditingClassId(null); setClassForm({ code: '', name: '', yearOfStudy: '1', periodId: '', maxEnrolment: '' }) }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="classes-register__table-section">
            <div className="classes-register__section-heading">
              <div><h3>Class register</h3><p>{visibleClasses.length} of {classes.length} classes shown</p></div>
            </div>
            <div className="table-wrap classes-register__table-wrap">
              <table>
                <thead><tr><th>Class code</th><th>Class name</th><th>Year</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {visibleClasses.length === 0 ? <tr><td colSpan={6} className="empty">{classes.length === 0 ? 'No classes have been configured for this programme.' : 'No classes match the selected filters.'}</td></tr> : visibleClasses.map(item => (
                    <tr key={item.id} className={selectedClass === item.id ? 'classes-register__selected-row' : undefined}>
                      <td><button type="button" className="classes-register__class-link" onClick={() => void loadStreams(item.id)} aria-pressed={selectedClass === item.id}>{item.code}</button></td>
                      <td>{item.name || '—'}</td><td>{item.yearOfStudy}</td><td>{item.maxEnrolment ?? 'Not set'}</td>
                      <td><span className={`classes-status classes-status--${item.status === 0 ? 'active' : item.status === 1 ? 'closed' : 'cancelled'}`}>{item.status === 0 ? 'Active' : item.status === 1 ? 'Closed' : 'Cancelled'}</span></td>
                      <td><div className="classes-register__row-actions"><button type="button" className="classes-button classes-button--small classes-button--secondary" onClick={() => editClass(item)}>Edit</button><button type="button" className="classes-button classes-button--small classes-button--secondary" disabled={item.status === 2 || loading} onClick={() => void toggleClassStatus(item)}>{item.status === 0 ? 'Close' : 'Reopen'}</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedClass && (
            <section className="classes-register__stream-panel" aria-label="Selected class streams">
              <div className="classes-register__section-heading">
                <div><h3>Streams · {classes.find(item => item.id === selectedClass)?.code ?? 'Selected class'}</h3><p>Manage the streams belonging to this class.</p></div>
                <button type="button" className="classes-button classes-button--primary" onClick={() => { setView('streams'); setEditingStreamId(null); setStreamForm({ code: '', name: '' }) }}>Manage streams</button>
              </div>
              {streams.length === 0 ? <p className="classes-register__empty">No streams are configured for this class yet.</p> : (
                <div className="classes-register__stream-list">{streams.map(stream => <div key={stream.id}><strong>{stream.code}</strong><span>{stream.name || 'No display name'}</span><span className={stream.isActive ? 'classes-status classes-status--active' : 'classes-status classes-status--closed'}>{stream.isActive ? 'Active' : 'Inactive'}</span></div>)}</div>
              )}
            </section>
          )}
        </div>
      )}

      {view === 'streams' && selectedProgramme && (
        <>
          <label htmlFor="stream-class">Class</label>
          <select id="stream-class" value={selectedClass} onChange={e => void loadStreams(e.target.value)}>
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name || c.code}</option>)}
          </select>
          {selectedClass && (
            <form className="student-form" onSubmit={saveStream}>
              <div className="form-row">
                <input required value={streamForm.code} onChange={e => setStreamForm({ ...streamForm, code: e.target.value })} placeholder="Stream code (e.g. A)" />
                <input value={streamForm.name} onChange={e => setStreamForm({ ...streamForm, name: e.target.value })} placeholder="Name (optional)" />
                
                <button type="submit" disabled={loading}>{editingStreamId ? 'Save Stream' : 'Add Stream'}</button>{editingStreamId && <button type="button" className="secondary-button" onClick={() => { setEditingStreamId(null); setStreamForm({ code: '', name: '' }) }}>Cancel Edit</button>}
              </div>
            </form>
          )}
          <div className="table-wrap"><table><thead><tr><th>Code</th><th>Name</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>{streams.length === 0 ? <tr><td colSpan={4} className="empty">No streams configured.</td></tr> : streams.map(s => <tr key={s.id}><td>{s.code}</td><td>{s.name || '—'}</td><td>{s.isActive ? 'Yes' : 'No'}</td><td><button type="button" onClick={() => editStream(s)}>Edit</button> <button type="button" className="secondary-button" disabled={loading} onClick={() => void toggleStream(s)}>{s.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody>
          </table></div>
        </>
      )}

      {view === 'subjects' && selectedProgramme && (
        <>
          <form className="student-form" onSubmit={saveSubject}>
            <div className="form-row">
              <select required value={subjectForm.courseId} onChange={e => setSubjectForm({ ...subjectForm, courseId: e.target.value })}>
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
              <input type="number" min="1" value={subjectForm.yearOfStudy} onChange={e => setSubjectForm({ ...subjectForm, yearOfStudy: e.target.value })} placeholder="Year" />
              <input type="number" min="1" value={subjectForm.periodSequence} onChange={e => setSubjectForm({ ...subjectForm, periodSequence: e.target.value })} placeholder="Period seq." />
            </div>
            <div className="form-row">
              <label><input type="checkbox" checked={subjectForm.isCompulsory} onChange={e => setSubjectForm({ ...subjectForm, isCompulsory: e.target.checked })} /> Compulsory</label>
              <input value={subjectForm.electiveGroup} onChange={e => setSubjectForm({ ...subjectForm, electiveGroup: e.target.value })} placeholder="Elective group (optional)" />
              <button type="submit" disabled={loading}>{editingSubjectId ? 'Save Subject' : 'Add Subject'}</button>{editingSubjectId && <button type="button" className="secondary-button" onClick={() => { setEditingSubjectId(null); setSubjectForm({ courseId: '', yearOfStudy: '1', periodSequence: '', isCompulsory: true, electiveGroup: '' }) }}>Cancel Edit</button>}
            </div>
          </form>
          <div className="table-wrap"><table><thead><tr><th>Course</th><th>Year</th><th>Period</th><th>Type</th><th>Elective</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{subjects.length === 0 ? <tr><td colSpan={7} className="empty">No subjects configured.</td></tr> : subjects.map(s => <tr key={s.id}><td>{courses.find(course => course.id === s.courseId)?.code ?? s.courseId}</td><td>{s.yearOfStudy}</td><td>{s.periodSequence ?? '—'}</td><td>{s.isCompulsory ? 'Compulsory' : 'Elective'}</td><td>{s.electiveGroup ?? '—'}</td><td>{s.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => editSubject(s)}>Edit</button> <button type="button" className="secondary-button" disabled={loading} onClick={() => void toggleSubject(s)}>{s.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody>
          </table></div>
        </>
      )}
    </section>
  )
}
