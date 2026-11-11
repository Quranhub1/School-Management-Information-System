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
import { getProgrammes, type Programme } from '../api/programmes'
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
