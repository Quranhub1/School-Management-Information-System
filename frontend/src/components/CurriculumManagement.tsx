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

type Tab = 'full' | 'short'

const UHPAB_SHORT_COURSES = [
  { name: 'Certificate in Public Health', award: 'Certificate', duration: 1, regulator: 'UHPAB', authority: 'UHPAB', family: 'Health' as const },
  { name: 'Diploma in Public Health', award: 'Diploma', duration: 2, regulator: 'UHPAB', authority: 'UHPAB', family: 'Health' as const },
  { name: 'Certificate in Laboratory Technology', award: 'Certificate', duration: 1, regulator: 'UHPAB', authority: 'UHPAB', family: 'Health' as const },
  { name: 'Certificate in Pharmacy Technician', award: 'Certificate', duration: 2, regulator: 'UHPAB', authority: 'UHPAB', family: 'Health' as const },
]

const UVTAB_SHORT_COURSES = [
  { name: 'Certificate in Automotive Engineering', award: 'Certificate', duration: 1, regulator: 'UVTAB', authority: 'UVTAB', family: 'Automotive' as const },
  { name: 'Diploma in Electrical Installation', award: 'Diploma', duration: 2, regulator: 'UVTAB', authority: 'UVTAB', family: 'ElectricalElectronics' as const },
  { name: 'Certificate in Plumbing', award: 'Certificate', duration: 1, regulator: 'UVTAB', authority: 'UVTAB', family: 'Construction' as const },
  { name: 'Certificate in Building Construction', award: 'Certificate', duration: 1, regulator: 'UVTAB', authority: 'UVTAB', family: 'Construction' as const },
]

export function CurriculumManagement({ canManage }: { canManage: boolean }) {
  const [tab, setTab] = useState<Tab>('full')
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [selected, setSelected] = useState('')
  const [mappings, setMappings] = useState<CurriculumCourse[]>([])
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
      const [a, b, c] = await Promise.all([getCurricula(), getCourses(), getProgrammes()])
      setCurricula(a)
      setCourses(b)
      setProgrammes(c)
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

  function applyShortCourseTemplate(course: typeof UHPAB_SHORT_COURSES[0] | typeof UVTAB_SHORT_COURSES[0]) {
    setCf({
      programmeId: '',
      version: '1.0',
      title: course.name,
      minimumCredits: String(course.duration * 30),
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: '',
      type: 'ShortCourse',
    })
  }

  if (!canManage) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Academic Structure</p>
          <h2>Curriculum & Courses</h2>
        </div>
        <span>{curricula.length} curricula · {courses.length} courses</span>
      </div>
      {error && <div className="error">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Curriculum sections">
        <button role="tab" aria-selected={tab === 'full'} className={tab === 'full' ? 'active' : ''} onClick={() => setTab('full')}>Full Programmes</button>
        <button role="tab" aria-selected={tab === 'short'} className={tab === 'short' ? 'active' : ''} onClick={() => setTab('short')}>Short Courses (UHPAB/UVTAB)</button>
      </div>

      {tab === 'full' && (
        <>
          <div className="summary-grid">
            <form className="student-form" onSubmit={saveCurriculum}>
              <h3>New curriculum version</h3>
              <input required placeholder="Programme UUID" value={cf.programmeId} onChange={e => setCf({ ...cf, programmeId: e.target.value })} />
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
            <select value={selected} onChange={e => void refreshMappings(e.target.value)}>
              <option value="">Select curriculum</option>
              {curricula.map(c => (
                <option key={c.id} value={c.id}>{c.title} · v{c.version}</option>
              ))}
            </select>
            <select value={mf.courseId} onChange={e => setMf({ ...mf, courseId: e.target.value })}>
              <option value="">Select course</option>
              {courses.map(c => (
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
          <h3>UHPAB Short Courses (Health)</h3>
          <p className="section-description">School-based courses regulated by UHPAB. Click to apply as a curriculum template.</p>
          <div className="short-course-grid">
            {UHPAB_SHORT_COURSES.map(course => (
              <div key={course.name} className="short-course-card" onClick={() => applyShortCourseTemplate(course)}>
                <h4>{course.name}</h4>
                <p>Regulator: {course.regulator}</p>
                <p>Award: {course.award}</p>
                <p>Duration: {course.duration} year(s)</p>
                <span className="badge">{course.family}</span>
              </div>
            ))}
          </div>

          <h3>UVTAB Short Courses (TVET)</h3>
          <p className="section-description">Competency-based short courses regulated by UVTAB. Click to apply as a curriculum template.</p>
          <div className="short-course-grid">
            {UVTAB_SHORT_COURSES.map(course => (
              <div key={course.name} className="short-course-card" onClick={() => applyShortCourseTemplate(course)}>
                <h4>{course.name}</h4>
                <p>Regulator: {course.regulator}</p>
                <p>Award: {course.award}</p>
                <p>Duration: {course.duration} year(s)</p>
                <span className="badge">{course.family}</span>
              </div>
            ))}
          </div>

          <div className="short-course-form-panel">
            <h4>Create Short-Course Curriculum</h4>
            <form className="student-form" onSubmit={saveCurriculum}>
              <div className="form-row">
                <input required placeholder="Programme UUID (create short-course programme first)" value={cf.programmeId} onChange={e => setCf({ ...cf, programmeId: e.target.value })} />
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
