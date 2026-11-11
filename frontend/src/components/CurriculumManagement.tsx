import { useEffect, useState } from 'react'
import {
  addCurriculumCourse,
  createCourse,
  createCurriculum,
  getCourses,
  getCurricula,
  getCurriculumCourses,
  type Course,
  type Curriculum,
  type CurriculumCourse,
} from '../api/curriculumManagement'
import { createProgramme, getProgrammes, setProgrammeActive, updateProgramme, type CreateProgrammeRequest, type Programme } from '../api/programmes'
import { resolveAcademicAuthority } from '../utils/academicAuthorities'
import { createAcademicAuthority, getAcademicAuthorities, setAcademicAuthorityActive, updateAcademicAuthority, type AcademicAuthority } from '../api/academicAuthorities'

type Tab = 'full' | 'short'

export function CurriculumManagement({ canManage }: { canManage?: boolean }) {
  const [tab, setTab] = useState<Tab>('full')
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [authorities, setAuthorities] = useState<AcademicAuthority[]>([])
  const [selected, setSelected] = useState('')
  const [authority, setAuthority] = useState('SCHOOL_BASED')
  const [editingAuthority, setEditingAuthority] = useState<string | null>(null)
  const [authorityForm, setAuthorityForm] = useState({ code: '', name: '', description: '', sourceReference: '', sortOrder: '10' })
  const [editingProgrammeId, setEditingProgrammeId] = useState<string | null>(null)
  const [programmeForm, setProgrammeForm] = useState({ code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: true, type: '0' })
  const [mappings, setMappings] = useState<CurriculumCourse[]>([])
  const [allMappings, setAllMappings] = useState<CurriculumCourse[]>([])
  const authorityOfProgramme = (programmeId: string) => resolveAcademicAuthority(programmes.find(p => p.id === programmeId)?.regulator)
  const authorityCurricula = curricula.filter(c => authorityOfProgramme(c.programmeId) === authority)
  const authorityProgrammes = programmes.filter(p => p.isActive && authorityOfProgramme(p.id) === authority)
  const authorityCurriculumIds = new Set(authorityCurricula.map(c => c.id))
  const authorityCourses = courses.filter(course => {
    const associations = allMappings.filter(mapping => mapping.courseId === course.id)
    return associations.length === 0 || associations.some(mapping => authorityCurriculumIds.has(mapping.curriculumId))
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [cf, setCf] = useState({ programmeId: '', version: '1.0', title: '', minimumCredits: '', effectiveFrom: '', effectiveTo: '', type: 'FullProgramme' as 'FullProgramme' | 'ShortCourse' })
  const [uf, setUf] = useState({ code: '', name: '', creditUnits: '', description: '', courseType: '' })
  const [mf, setMf] = useState({ courseId: '', yearOfStudy: '1', semesterNumber: '1', isCore: true })

  useEffect(() => {
    if (canManage) void load()
  }, [canManage])

  async function load() {
    try {
      setError('')
      const [a, b, c, d] = await Promise.all([getCurricula(), getCourses(), getProgrammes(), getAcademicAuthorities(true)])
      const courseMappings = (await Promise.all(a.map(curriculum => getCurriculumCourses(curriculum.id).catch(() => [])))).flat()
      setCurricula(a)
      setCourses(b)
      setProgrammes(c)
      setAuthorities(d)
      setAuthority(current => d.some(item => item.code === current) ? current : (d.find(item => item.isActive)?.code ?? ''))
      setAllMappings(courseMappings)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load curriculum data.')
    }
  }

  async function refreshMappings(id: string) {
    setSelected(id)
    if (id) {
      try {
        setMappings(await getCurriculumCourses(id))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load mappings.')
      }
    }
  }

  async function saveAuthority(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const input = { ...authorityForm, sortOrder: Number(authorityForm.sortOrder) }
      if (editingAuthority) await updateAcademicAuthority(editingAuthority, input)
      else await createAcademicAuthority(input)
      setAuthorityForm({ code: '', name: '', description: '', sourceReference: '', sortOrder: '10' })
      setEditingAuthority(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save academic authority.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAuthority(item: AcademicAuthority) {
    try {
      await setAcademicAuthorityActive(item.code, !item.isActive)
      await load()
      if (item.isActive && authority === item.code) setAuthority('')
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
        departmentId: null,
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
      setProgrammeForm({ code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: true, type: '0' })
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

  function editProgramme(item: Programme) {
    setEditingProgrammeId(item.id)
    setProgrammeForm({
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
    setSaving(true)
    try {
      await createCurriculum({
        programmeId: cf.programmeId,
        version: cf.version,
        title: cf.title,
        minimumCredits: Number(cf.minimumCredits),
        effectiveFrom: cf.effectiveFrom,
        effectiveTo: cf.effectiveTo || null,
        programmeType: cf.type === 'ShortCourse' ? 1 : 0,
      })
      setCf({ programmeId: '', version: '1.0', title: '', minimumCredits: '', effectiveFrom: '', effectiveTo: '', type: 'FullProgramme' })
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
      await createCourse({
        code: uf.code,
        name: uf.name,
        creditUnits: Number(uf.creditUnits),
        description: uf.description,
        courseType: uf.courseType,
      })
      setUf({ code: '', name: '', creditUnits: '', description: '', courseType: '' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save course.')
    } finally {
      setSaving(false)
    }
  }

  async function saveMapping(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      await addCurriculumCourse(selected, {
        courseId: mf.courseId,
        yearOfStudy: Number(mf.yearOfStudy),
        semesterNumber: Number(mf.semesterNumber),
        isCore: mf.isCore,
      })
      await refreshMappings(selected)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to map course.')
    } finally {
      setSaving(false)
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
        <span>{curricula.length} curricula · {courses.length} courses</span>
      </div>
      {error && <div className="error">{error}</div>}

      <div className="form-row academic-authority-picker">
        <label>Curriculum authority
          <select value={authority} onChange={e => { setAuthority(e.target.value); setSelected(''); setMappings([]); setMf(current => ({ ...current, courseId: '' })); setCf(current => ({ ...current, programmeId: '' })) }}>
            {authorities.filter(item => item.isActive).map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </label>
      </div>
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
      <section className="catalogue-board" aria-label="Programme register">
        <h3>Programmes under {authorities.find(item => item.code === authority)?.name ?? 'selected authority'}</h3>
        <form className="student-form" onSubmit={saveProgramme}>
          <div className="form-row">
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
          {editingProgrammeId && <button type="button" className="secondary-button" onClick={() => { setEditingProgrammeId(null); setProgrammeForm({ code: '', name: '', award: 'Certificate', awardTitle: '', durationYears: '2', durationUnit: 'Years', studyMode: 'Full-time', deliveryType: 'Academic', approvalReference: '', approvalDate: '', approvalStatus: 'NeedsVerification', sourceReference: '', isReferenceOnly: true, type: '0' }) }}>Cancel edit</button>}
        </form>
        <div className="table-wrap"><table><thead><tr><th>Code</th><th>Programme</th><th>Award</th><th>Duration</th><th>Verification</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {programmes.filter(item => resolveAcademicAuthority(item.regulator) === authority).map(item => <tr key={item.id}><td>{item.code}</td><td>{item.name}</td><td>{item.award}</td><td>{item.durationYears} {item.durationUnit}</td><td>{item.isReferenceOnly ? 'Reference only' : item.approvalStatus}</td><td>{item.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => editProgramme(item)}>Edit</button> <button type="button" className="secondary-button" onClick={() => void toggleProgramme(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
          {programmes.filter(item => resolveAcademicAuthority(item.regulator) === authority).length === 0 && <tr><td colSpan={7}>No programmes are saved under this authority yet.</td></tr>}
        </tbody></table></div>
      </section>
      <div className="library-workspace-tabs" role="tablist" aria-label="Curriculum sections">
        <button role="tab" aria-selected={tab === 'full'} className={tab === 'full' ? 'active' : ''} onClick={() => { setTab('full'); setCf(current => ({ ...current, type: 'FullProgramme' })) }}>Full Programmes</button>
        <button role="tab" aria-selected={tab === 'short'} className={tab === 'short' ? 'active' : ''} onClick={() => { setTab('short'); setCf(current => ({ ...current, type: 'ShortCourse' })) }}>Short Courses</button>
      </div>

      {tab === 'full' && (
        <>
          <div className="summary-grid">
            <form className="student-form" onSubmit={saveCurriculum}>
              <h3>New curriculum version</h3>
              <select required value={cf.programmeId} onChange={e => setCf({ ...cf, programmeId: e.target.value })}><option value="">Select programme</option>{authorityProgrammes.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
              <div className="form-row">
                <input required placeholder="Version" value={cf.version} onChange={e => setCf({ ...cf, version: e.target.value })} />
                <input required placeholder="Title" value={cf.title} onChange={e => setCf({ ...cf, title: e.target.value })} />
              </div>
              <div className="form-row">
                <input type="number" min="0" placeholder="Minimum credits" value={cf.minimumCredits} onChange={e => setCf({ ...cf, minimumCredits: e.target.value })} />
                <input required type="date" value={cf.effectiveFrom} onChange={e => setCf({ ...cf, effectiveFrom: e.target.value })} />
                <input type="date" value={cf.effectiveTo} onChange={e => setCf({ ...cf, effectiveTo: e.target.value })} />
              </div>
              <select value={cf.type} onChange={e => setCf({ ...cf, type: e.target.value as 'FullProgramme' | 'ShortCourse' })}>
                <option value="FullProgramme">Full Programme</option>
                <option value="ShortCourse">Short Course</option>
              </select>
              <button type="submit" disabled={saving}>Add curriculum</button>
            </form>

            <form className="student-form" onSubmit={saveCourse}>
              <h3>Course / unit catalogue</h3>
              <div className="form-row">
                <input required placeholder="Unit code" value={uf.code} onChange={e => setUf({ ...uf, code: e.target.value })} />
                <input required placeholder="Unit name" value={uf.name} onChange={e => setUf({ ...uf, name: e.target.value })} />
              </div>
              <div className="form-row">
                <input required type="number" min="0" placeholder="Credit units" value={uf.creditUnits} onChange={e => setUf({ ...uf, creditUnits: e.target.value })} />
                <input placeholder="Course type" value={uf.courseType} onChange={e => setUf({ ...uf, courseType: e.target.value })} />
              </div>
              <input placeholder="Description (optional)" value={uf.description} onChange={e => setUf({ ...uf, description: e.target.value })} />
              <button type="submit" disabled={saving}>Add course</button>
            </form>
          </div>

          <div className="form-row">
            <select value={selected} onChange={e => { setMf(current => ({ ...current, courseId: '' })); void refreshMappings(e.target.value) }}>
              <option value="">Select curriculum</option>
              {authorityCurricula.map(c => (
                <option key={c.id} value={c.id}>{c.title} · v{c.version}</option>
              ))}
            </select>
            <select value={mf.courseId} onChange={e => setMf({ ...mf, courseId: e.target.value })}>
              <option value="">Select course</option>
              {authorityCourses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
            <input type="number" min="1" placeholder="Year" value={mf.yearOfStudy} onChange={e => setMf({ ...mf, yearOfStudy: e.target.value })} />
            <input type="number" min="1" placeholder="Semester" value={mf.semesterNumber} onChange={e => setMf({ ...mf, semesterNumber: e.target.value })} />
            <label>
              <input type="checkbox" checked={mf.isCore} onChange={e => setMf({ ...mf, isCore: e.target.checked })} /> Core
            </label>
            <button onClick={saveMapping} disabled={saving || !selected}>Map course</button>
          </div>

          {selected && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Semester</th>
                    <th>Core</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map(m => {
                    const course = courses.find(c => c.id === m.courseId)
                    return (
                      <tr key={m.id}>
                        <td>{course?.code} — {course?.name}</td>
                        <td>{m.yearOfStudy}</td>
                        <td>{m.semesterNumber}</td>
                        <td>{m.isCore ? 'Yes' : 'No'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'short' && (
        <div className="short-course-section">
          <div className="short-course-form-panel">
            <h4>Create Short-Course Curriculum</h4>
            <form className="student-form" onSubmit={saveCurriculum}>
              <div className="form-row">
                <select required value={cf.programmeId} onChange={e => setCf({ ...cf, programmeId: e.target.value })}><option value="">Select the programme this short course belongs to</option>{authorityProgrammes.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
                <input required placeholder="Version" value={cf.version} onChange={e => setCf({ ...cf, version: e.target.value })} />
              </div>
              <input required placeholder="Curriculum title (e.g. Certificate in Public Health)" value={cf.title} onChange={e => setCf({ ...cf, title: e.target.value })} />
              <div className="form-row">
                <input type="number" min="0" placeholder="Minimum credits" value={cf.minimumCredits} onChange={e => setCf({ ...cf, minimumCredits: e.target.value })} />
                <input required type="date" value={cf.effectiveFrom} onChange={e => setCf({ ...cf, effectiveFrom: e.target.value })} />
                <input type="date" value={cf.effectiveTo} onChange={e => setCf({ ...cf, effectiveTo: e.target.value })} />
              </div>
              <select value={cf.type} onChange={e => setCf({ ...cf, type: e.target.value as 'FullProgramme' | 'ShortCourse' })}>
                <option value="FullProgramme">Full Programme</option>
                <option value="ShortCourse">Short Course</option>
              </select>
              <button type="submit" disabled={saving}>Add short-course curriculum</button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
