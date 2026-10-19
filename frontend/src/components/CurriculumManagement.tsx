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

type CatalogueEntry = { name: string; award: string; duration: number | null; regulator: 'UHPAB' | 'UVTAB'; family: string; review?: boolean }

const UHPAB_LONG_COURSES: CatalogueEntry[] = [
  { name: 'Certificate in Nursing', award: 'Certificate', duration: 2.5, regulator: 'UHPAB', family: 'Nursing' },
  { name: 'Certificate in Midwifery', award: 'Certificate', duration: 2.5, regulator: 'UHPAB', family: 'Midwifery' },
  { name: 'Certificate in Mental Health Nursing', award: 'Certificate', duration: 2.5, regulator: 'UHPAB', family: 'Nursing' },
  { name: 'Certificate in Emergency Care', award: 'Certificate', duration: 2, regulator: 'UHPAB', family: 'Allied Health' },
  { name: 'Certificate in Environmental Health Sciences', award: 'Certificate', duration: 2, regulator: 'UHPAB', family: 'Allied Health' },
  { name: 'Certificate in Medical Laboratory Techniques', award: 'Certificate', duration: 2, regulator: 'UHPAB', family: 'Laboratory' },
  { name: 'Certificate in Medical Records and Health Informatics', award: 'Certificate', duration: 2, regulator: 'UHPAB', family: 'Health Informatics' },
  { name: 'Certificate in Medical Theatre Techniques', award: 'Certificate', duration: 2, regulator: 'UHPAB', family: 'Allied Health' },
  { name: 'Certificate in Pharmacy', award: 'Certificate', duration: 2, regulator: 'UHPAB', family: 'Pharmacy' },
  { name: 'Diploma in Nursing', award: 'Diploma', duration: null, regulator: 'UHPAB', family: 'Nursing' },
  { name: 'Diploma in Midwifery', award: 'Diploma', duration: null, regulator: 'UHPAB', family: 'Midwifery' },
  { name: 'Diploma in Mental Health Nursing', award: 'Diploma', duration: null, regulator: 'UHPAB', family: 'Nursing' },
  { name: 'Diploma in Paediatrics and Child Health Nursing', award: 'Diploma', duration: null, regulator: 'UHPAB', family: 'Nursing' },
  { name: 'Diploma in Public Health Nursing', award: 'Diploma', duration: null, regulator: 'UHPAB', family: 'Nursing' },
  { name: 'Diploma in Comprehensive Nursing (legacy intake)', award: 'Diploma', duration: null, regulator: 'UHPAB', family: 'Nursing', review: true },
  { name: 'Advanced Diploma in Palliative Care Nursing', award: 'Advanced Diploma', duration: null, regulator: 'UHPAB', family: 'Nursing' },
]

const UVTAB_LONG_COURSES: CatalogueEntry[] = [
  { name: 'National Certificate — Technology Education and Training', award: 'National Certificate', duration: 2, regulator: 'UVTAB', family: 'Technology', review: true },
  { name: 'Uganda Certificate in Practical Competencies (UCPC) — Technology', award: 'UCPC', duration: 3, regulator: 'UVTAB', family: 'Technology', review: true },
  { name: 'National Certificate — Agriculture Education and Training', award: 'National Certificate', duration: 2, regulator: 'UVTAB', family: 'Agriculture', review: true },
  { name: 'Uganda Certificate in Practical Competencies (UCPC) — Agriculture', award: 'UCPC', duration: 3, regulator: 'UVTAB', family: 'Agriculture', review: true },
  { name: 'National Certificate — Home Science Education and Training', award: 'National Certificate', duration: 2, regulator: 'UVTAB', family: 'Home Science', review: true },
  { name: 'Uganda Certificate in Practical Competencies (UCPC) — Home Science', award: 'UCPC', duration: 3, regulator: 'UVTAB', family: 'Home Science', review: true },
  { name: 'Hotel and Institutional Catering', award: 'National Certificate', duration: 2, regulator: 'UVTAB', family: 'Hospitality', review: true },
  { name: 'Cosmetology and Beauty', award: 'National Certificate', duration: 2, regulator: 'UVTAB', family: 'Beauty', review: true },
  { name: 'Fashion and Design', award: 'National Certificate', duration: 2, regulator: 'UVTAB', family: 'Fashion', review: true },
  { name: 'Leather Tanning', award: 'National Certificate', duration: 2, regulator: 'UVTAB', family: 'Manufacturing', review: true },
  { name: 'Building and Construction trades', award: 'Vocational / Technical award', duration: null, regulator: 'UVTAB', family: 'Construction', review: true },
  { name: 'Electrical Installation trades', award: 'Vocational / Technical award', duration: null, regulator: 'UVTAB', family: 'Electrical', review: true },
  { name: 'Mechanical Engineering trades', award: 'Vocational / Technical award', duration: null, regulator: 'UVTAB', family: 'Engineering', review: true },
  { name: 'Business-related programmes', award: 'Vocational / Technical award', duration: null, regulator: 'UVTAB', family: 'Business', review: true },
  { name: 'Animal Production, Fisheries and Agribusiness', award: 'Vocational / Technical award', duration: null, regulator: 'UVTAB', family: 'Agriculture', review: true },
  { name: 'Forestry, Beekeeping and Agroforestry', award: 'Vocational / Technical award', duration: null, regulator: 'UVTAB', family: 'Natural Resources', review: true },
]

const UVTAB_SHORT_COURSES: CatalogueEntry[] = [
  { name: 'Worker-acquired skills assessment', award: 'Modular / skills award', duration: null, regulator: 'UVTAB', family: 'Skills assessment', review: true },
  { name: 'Occupational skills Levels I–IV', award: 'Occupational award', duration: null, regulator: 'UVTAB', family: 'Modular TVET', review: true },
  { name: 'Short modular vocational training package', award: 'Modular award', duration: null, regulator: 'UVTAB', family: 'Vocational', review: true },
]

export function CurriculumManagement({ canManage }: { canManage?: boolean }) {
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

  function applyCourseTemplate(course: CatalogueEntry, type: 'FullProgramme' | 'ShortCourse') {
    setCf({
      programmeId: '',
      version: '1.0',
      title: course.name,
      minimumCredits: '',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: '',
      type,
    })
  }

  function renderCatalogue(entries: CatalogueEntry[], type: 'FullProgramme' | 'ShortCourse') {
    return (
      <div className="catalogue-table-wrap">
        <table className="catalogue-table">
          <thead>
            <tr>
              <th>Programme / course</th>
              <th>Award</th>
              <th>Duration</th>
              <th>Area</th>
              <th>Review</th>
              <th aria-label="Action"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(course => (
              <tr key={course.name}>
                <td className="catalogue-course-name">{course.name}</td>
                <td>{course.award}</td>
                <td>{course.duration ? `${course.duration} years*` : 'Not confirmed'}</td>
                <td>{course.family}</td>
                <td>
                  <span className={course.review ? 'catalogue-status needs-review' : 'catalogue-status'}>
                    {course.review ? 'Verify' : 'Reference'}
                  </span>
                </td>
                <td className="catalogue-action-cell">
                  <button type="button" onClick={() => applyCourseTemplate(course, type)}>Use draft</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="catalogue-footnote">* Indicative duration where listed. Confirm against the approved programme document before publishing.</p>
      </div>
    )
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

      <div className="library-workspace-tabs" role="tablist" aria-label="Curriculum sections">
        <button role="tab" aria-selected={tab === 'full'} className={tab === 'full' ? 'active' : ''} onClick={() => setTab('full')}>Full Programmes</button>
        <button role="tab" aria-selected={tab === 'short'} className={tab === 'short' ? 'active' : ''} onClick={() => setTab('short')}>Short Courses</button>
      </div>

      {tab === 'full' && (
        <>
          <div className="catalogue-intro">
            <h3>Long-course catalogue</h3>
            <p>Select a row to prefill a draft. Nothing is saved until you submit the form; entries marked Verify need title or duration confirmation.</p>
          </div>
          <section className="catalogue-board" aria-labelledby="uhpab-long-title">
            <h3 id="uhpab-long-title">UHPAB · Health programmes</h3>
            {renderCatalogue(UHPAB_LONG_COURSES, 'FullProgramme')}
          </section>
          <section className="catalogue-board uvtab-catalogue" aria-labelledby="uvtab-long-title">
            <h3 id="uvtab-long-title">UVTAB · Vocational and technical programmes</h3>
            {renderCatalogue(UVTAB_LONG_COURSES, 'FullProgramme')}
          </section>
          <div className="summary-grid">
            <form className="student-form" onSubmit={saveCurriculum}>
              <h3>New curriculum version</h3>
              <select required value={cf.programmeId} onChange={e => setCf({ ...cf, programmeId: e.target.value })}><option value="">Select programme</option>{programmes.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
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
          <div className="catalogue-intro">
            <h3>Short and modular training</h3>
            <p>Select a row to prefill a draft. Confirm the approved title, award and duration before publishing.</p>
          </div>
          <section className="catalogue-board uvtab-catalogue">
            <h3>UVTAB · Modular and occupational skills</h3>
            {renderCatalogue(UVTAB_SHORT_COURSES, 'ShortCourse')}
          </section>
          <section className="catalogue-board">
            <h3>UHPAB · Health short courses</h3>
            <p>No standalone UHPAB short-course list has been verified in the reviewed catalogue. Add health short training here only after confirming the relevant authority, provider and award.</p>
          </section>

          <div className="short-course-form-panel">
            <h4>Create Short-Course Curriculum</h4>
            <form className="student-form" onSubmit={saveCurriculum}>
              <div className="form-row">
                <select required value={cf.programmeId} onChange={e => setCf({ ...cf, programmeId: e.target.value })}><option value="">Select the programme this short course belongs to</option>{programmes.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
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
