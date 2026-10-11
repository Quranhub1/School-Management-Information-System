import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getStudentAcademicSummaries, getStudentTranscript } from '../api/academicRecords'
import { ExaminationResults } from './ExaminationResults'
import { createProgramme, getProgrammes, setProgrammeActive, type Programme } from '../api/programmes'
import type { AcademicResultSummary, TranscriptEntry } from '../types/academic'

interface AcademicManagementProps {
  canManage?: boolean
  readOnly?: boolean
}

type AcademicView = 'records' | 'programmes' | 'examinations' | 'classes' | 'courses'

export function AcademicManagement({ canManage = false, readOnly = false }: AcademicManagementProps) {
  const [view, setView] = useState<AcademicView>('records')
  const [studentId, setStudentId] = useState('')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [summaries, setSummaries] = useState<AcademicResultSummary[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [programmeForm, setProgrammeForm] = useState({
    departmentId: '', code: '', name: '', award: '', awardTitle: '', durationYears: '2',
    studyMode: 'Full-time', deliveryType: 'Academic', regulator: '', approvalReference: '', approvalDate: '',
  })

  useEffect(() => {
    if (canManage) void loadProgrammes()
  }, [canManage])

  // Handle subsection navigation from sidebar
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ module?: string; subsection?: string }>).detail
      if (detail?.module !== 'academics') return
      const nextView: AcademicView | undefined = detail.subsection === 'records' ? 'records'
        : detail.subsection === 'programmes' ? 'programmes'
        : detail.subsection === 'examinations' ? 'examinations'
        : detail.subsection === 'classes' ? 'classes'
        : detail.subsection === 'courses' ? 'courses'
        : undefined
      if (nextView) setView(nextView)
    }
    window.addEventListener('smis:navigate-subsection', handler)
    return () => window.removeEventListener('smis:navigate-subsection', handler)
  }, [])

  async function loadProgrammes() {
    try {
      setError('')
      setProgrammes(await getProgrammes())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load programmes.')
    }
  }

  async function loadRecords(event: FormEvent) {
    event.preventDefault()
    if ((!canManage && !readOnly) || !studentId.trim()) return
    setLoading(true)
    setError('')
    try {
      const id = studentId.trim()
      const [entries, resultSummaries] = await Promise.all([
        getStudentTranscript(id),
        getStudentAcademicSummaries(id),
      ])
      setTranscript(entries)
      setSummaries(resultSummaries)
    } catch (requestError) {
      setTranscript([])
      setSummaries([])
      setError(requestError instanceof Error ? requestError.message : 'Unable to load academic records.')
    } finally {
      setLoading(false)
    }
  }

  async function saveProgramme(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createProgramme({
        departmentId: programmeForm.departmentId.trim(),
        code: programmeForm.code.trim(),
        name: programmeForm.name.trim(),
        award: programmeForm.award.trim(),
        awardTitle: programmeForm.awardTitle.trim() || undefined,
        durationYears: Number(programmeForm.durationYears),
        studyMode: programmeForm.studyMode,
        deliveryType: programmeForm.deliveryType,
        regulator: programmeForm.regulator.trim() || undefined,
        approvalReference: programmeForm.approvalReference.trim() || undefined,
        approvalDate: programmeForm.approvalDate || undefined,
      })
      setProgrammeForm({ ...programmeForm, code: '', name: '', award: '', awardTitle: '', regulator: '', approvalReference: '', approvalDate: '' })
      await loadProgrammes()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create programme.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleProgramme(programme: Programme) {
    try {
      setError('')
      await setProgrammeActive(programme.id, !programme.isActive)
      setProgrammes((items) => items.map((item) => item.id === programme.id ? { ...item, isActive: !item.isActive } : item))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update programme.')
    }
  }

  if (!canManage && !readOnly) {
    return <section className="panel"><h3>Academic Management</h3><p className="empty">Your role does not have academic-management access.</p></section>
  }

  return (
    <section className="academic-workspace" aria-label="Academic management workspace" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <p className="eyebrow">Academic Management</p>
        </div>
        <div>
          <h2>{readOnly ? 'Student academic records · Read-only' : view === 'records' ? 'Student academic records' : view === 'programmes' ? 'Programme management' : view === 'examinations' ? 'Examinations & Results' : view === 'classes' ? 'Class Management' : 'Course Management'}</h2>
        </div>
        <div style={{ flex: '1' }}>
          <span>{view === 'records' ? `${transcript.length} course results` : view === 'programmes' ? ${programmes.length} programmes` : view === 'classes' ? 'Managing class schedules' : view === 'courses' ? 'Managing course catalog' : ${programmes.length} programmes`}</span>
        </div>
      </div>

      <div className="form-row" role="tablist" aria-label="Academic management views" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        <button type="button" aria-selected={view === 'records'} onClick={() => setView('records')}>Academic Records</button>
        {!readOnly && <button type="button" aria-selected={view === 'programmes'} onClick={() => setView('programmes')}>Programmes</button>}
        {!readOnly && <button type="button" aria-selected={view === 'examinations'} onClick={() => setView('examinations')}>Examinations & Results</button>}
        {!readOnly && <button type="button" aria-selected={view === 'classes'} onClick={() => setView('classes')}>Class Management</button>}
        {!readOnly && <button type="button" aria-selected={view === 'courses'} onClick={() => setView('courses')}>Course Management</button>}
      </div>

      <div className="sheet-content" style={{ flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
        {error && <div className="error" role="alert" style={{ margin: '16px' }}>{error}</div>

        {view === 'examinations' ? (
          <div className="academic-examinations-workspace" style={{ flex: '1', minHeight: '0' }}>
            <div className="panel-heading" style={{ marginBottom: '12px', padding: '0 16px' }}>
              <div>
                <p className="eyebrow">ACADEMIC MANAGEMENT</p>
              </div>
              <h3>Examinations & Results</h3>
              <p>Examination setup, marks, results processing and academic record approval are managed from the academic workspace.</p>
            </div>
            <ExaminationResults />
          </div>
        ) : view === 'records' ? (
          <>
            <form className="student-form" onSubmit={loadRecords} style={{ margin: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label htmlFor="academic-student-id">Student ID</label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <input id="academic-student-id" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter student UUID" />
              </div>
              <button type="submit" disabled={loading || !studentId.trim()}>{loading ? 'Loading…' : 'Retrieve records'}</button>
            </form>
            <div className="summary-grid" style={{ margin: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {summaries.map((summary) => (
                <article className="summary-card" key={summary.id} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Semester</span>
                  <strong>{summary.semesterId}</strong>
                  <div className="metrics" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>GPA <b>{summary.gpa.toFixed(2)}</b></span>
                    <span>CGPA <b>{summary.cgpa?.toFixed(2) ?? '—'}</b></span>
                  </div>
                  <small>{summary.standing}{summary.isApproved ? ' · Approved' : ' · Pending approval'}</small>
                </article>
              ))}
            </div>
            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Course</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Title</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Units</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Score</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Grade</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Point</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transcript.length === 0 ? (
                      <tr style={{ height: '60px' }}>
                        <td colSpan={7} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No academic records loaded.</td
                    ) : (
                      transcript.map((entry) => (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <td style={{ padding: '12px 16px' }}>{entry.courseCode}</td>
                          <td style={{ padding: '12px 16px' }}>{entry.courseTitle}</td>
                          <td style={{ padding: '12px 16px' }}>{entry.creditUnits}</td
                          <td style={{ padding: '12px 16px' }}>{entry.score}</td
                          <td style={{ padding: '12px 16px' }}>{entry.grade ?? '—'}</td
                          <td style={{ padding: '12px 16px' }}>{entry.gradePoint.toFixed(2)}</td
                          <td style={{ padding: '12px 16px' }}>{entry.isPass ? 'Pass' : 'Fail'}</td
                        </tr
                      ))}
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : view === 'programmes' ? (
          <>
            <form className="student-form" onSubmit={saveProgramme} style={{ margin: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <input required value={programmeForm.departmentId} onChange={(e) => setProgrammeForm({ ...programmeForm, departmentId: e.target.value })} placeholder="Department UUID" />
                <input required value={programmeForm.code} onChange={(e) => setProgrammeForm({ ...programmeForm, code: e.target.value })} placeholder="Programme code" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <input required value={programmeForm.name} onChange={(e) => setProgrammeForm({ ...programmeForm, name: e.target.value })} placeholder="Programme name" />
                <input required value={programmeForm.award} onChange={(e) => setProgrammeForm({ ...programmeForm, award: e.target.value })} placeholder="Award" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <input value={programmeForm.awardTitle} onChange={(e) => setProgrammeForm({ ...programmeForm, awardTitle: e.target.value })} placeholder="Award title (optional)" />
                <input type="number" min="1" value={programmeForm.durationYears} onChange={(e) => setProgrammeForm({ ...programmeForm, durationYears: e.target.value })} placeholder="Duration" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <select value={programmeForm.studyMode} onChange={(e) => setProgrammeForm({ ...programmeForm, studyMode: e.target.value })}><option>Full-time</option><option>Part-time</option><option>Evening</option><option>Weekend</option></select>
                <select value={programmeForm.deliveryType} onChange={(e) => setProgrammeForm({ ...programmeForm, deliveryType: e.target.value })}><option>Academic</option><option>CBET</option><option>Blended</option><option>Practical</option></select>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add programme'}</button>
              </div>
            </form>
            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Code</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Programme</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Award</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Duration</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Mode</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Delivery</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Action</th
                    </tr>
                  </thead>
                  <tbody>
                    {programmes.length === 0 ? (
                      <tr style={{ height: '60px' }}>
                        <td colSpan={8} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No programmes configured.</td
                    ) : (
                      programmes.map((programme) => (
                        <tr key={programme.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px' }}>{programme.code}</td
                          <td style={{ padding: '12px 16px' }}>{programme.name}</td
                          <td style={{ padding: '12px 16px' }}>{programme.award}</td
                          <td style={{ padding: '12px 16px' }}>{programme.durationYears} {programme.durationUnit}</td
                          <td style={{ padding: '12px 16px' }}>{programme.studyMode}</td
                          <td style={{ padding: '12px 16px' }}>{programme.deliveryType}</td
                          <td style={{ padding: '12px 16px' }}>{programme.isActive ? 'Active' : 'Inactive'}</td
                          <td style={{ padding: '12px 16px' }}><button type="button" onClick={() => void toggleProgramme(programme)}>{programme.isActive ? 'Deactivate' : 'Activate'}</button>
                        </tr
                      ))}
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : view === 'classes' ? (
          <div className="panel" style={{ flex: '1', minHeight: '0' }}>
            <div className="panel-heading" style={{ marginBottom: '12px', padding: '0 16px' }}>
              <div>
                <p className="eyebrow">CLASS MANAGEMENT</p>
              </div>
              <h3>Class Scheduling & Management</h3>
              <p>Manage class timetables, room allocations, and instructor assignments.</p>
            </div>
            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Class Code</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Course</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Instructor</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Room</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Schedule</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Action</th
                    </tr>
                  </thead>
                  <tbody>
                    {/* Placeholder - in a real implementation, this would fetch class data */}
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>CS101-01</td
                      <td style={{ padding: '12px 16px' }}>Introduction to Programming</td
                      <td style={{ padding: '12px 16px' }}>John Doe</td
                      <td style={{ padding: '12px 16px' }}>Lab 301</td
                      <td style={{ padding: '12px 16px' }}>Mon/Wed/Fri 09:00-10:30</td
                      <td style={{ padding: '12px 16px', color: '#059669' }}>Active</td
                      <td style={{ padding: '12px 16px' }}>
                        <button type="button" className="secondary-button">Edit Schedule</button
                      </td
                    </tr
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>MTH205-02</td
                      <td style={{ padding: '12px 16px' }}>Calculus II</td
                      <td style={{ padding: '12px 16px' }}>Jane Smith</td
                      <td style={{ padding: '12px 16px' }}>Room 205</td
                      <td style={{ padding: '12px 16px' }}>Tue/Thu 14:00-15:30</td
                      <td style={{ padding: '12px 16px', color: '#059669' }}>Active</td
                      <td style={{ padding: '12px 16px' }}>
                        <button type="button" className="secondary-button">Edit Schedule</button
                      </td
                    </tr
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : view === 'courses' ? (
          <div className="panel" style={{ flex: '1', minHeight: '0' }}>
            <div className="panel-heading" style={{ marginBottom: '12px', padding: '0 16px' }}>
              <div>
                <p className="eyebrow">COURSE MANAGEMENT</p>
              </div
              <h3>Course Catalog & Curriculum</h3>
              <p>Manage course offerings, descriptions, prerequisites, and academic levels.</p>
            </div
            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Course Code</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Course Name</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Department</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Level</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Credits</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Action</th
                    </tr
                  </thead>
                  <tbody>
                    {/* Placeholder - in a real implementation, this would fetch course data */}
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>CS101</td
                      <td style={{ padding: '12px 16px' }}>Introduction to Programming</td
                      <td style={{ padding: '12px 16px' }}>Computer Science</td
                      <td style={{ padding: '12px 16px' }}>Undergraduate</td
                      <td style={{ padding: '12px 16px' }}>3</td
                      <td style={{ padding: '12px 16px', color: '#059669' }}>Active</td
                      <td style={{ padding: '12px 16px' }}>
                        <button type="button" className="secondary-button">Edit Course</button
                      </td
                    </tr
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>MTH205</td
                      <td style={{ padding: '12px 16px' }}>Calculus II</td
                      <td style={{ padding: '12px 16px' }}>Mathematics</td
                      <td style={{ padding: '12px 16px' }}>Undergraduate</td
                      <td style={{ padding: '12px 16px' }}>4</td
                      <td style={{ padding: '12px 16px', color: '#059669' }}>Active</td
                      <td style={{ padding: '12px 16px' }}>
                        <button type="button" className="secondary-button">Edit Course</button
                      </td
                    </tr
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>ENG301</td
                      <td style={{ padding: '12px 16px' }}>Advanced Technical Writing</td
                      <td style={{ padding: '12px 16px' }}>English</td
                      <td style={{ padding: '12px 16px' }}>Undergraduate</td
                      <td style={{ padding: '12px 16px' }}>3</td
                      <td style={{ padding: '12px 16px', color: '#059669' }}>Active</td
                      <td style={{ padding: '12px 16px' }}>
                        <button type="button" className="secondary-button">Edit Course</button
                      </td
                    </tr
                  </tbody
                </table>
              </div>
            </div
          </div>
        ) : (
          <>
            <form className="student-form" onSubmit={saveProgramme} style={{ margin: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <input required value={programmeForm.departmentId} onChange={(e) => setProgrammeForm({ ...programmeForm, departmentId: e.target.value })} placeholder="Department UUID" />
                <input required value={programmeForm.code} onChange={(e) => setProgrammeForm({ ...programmeForm, code: e.target.value })} placeholder="Programme code" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <input required value={programmeForm.name} onChange={(e) => setProgrammeForm({ ...programmeForm, name: e.target.value })} placeholder="Programme name" />
                <input required value={programmeForm.award} onChange={(e) => setProgrammeForm({ ...programmeForm, award: e.target.value })} placeholder="Award" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <input value={programmeForm.awardTitle} onChange={(e) => setProgrammeForm({ ...programmeForm, awardTitle: e.target.value })} placeholder="Award title (optional)" />
                <input type="number" min="1" value={programmeForm.durationYears} onChange={(e) => setProgrammeForm({ ...programmeForm, durationYears: e.target.value })} placeholder="Duration" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <select value={programmeForm.studyMode} onChange={(e) => setProgrammeForm({ ...programmeForm, studyMode: e.target.value })}><option>Full-time</option><option>Part-time</option><option>Evening</option><option>Weekend</option></select>
                <select value={programmeForm.deliveryType} onChange={(e) => setProgrammeForm({ ...programmeForm, deliveryType: e.target.value })}><option>Academic</option><option>CBET</option><option>Blended</option><option>Practical</option></select>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add programme'}</button>
              </div
            </form
            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Code</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Programme</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Award</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Duration</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Mode</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Delivery</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Action</th
                    </tr
                  </thead
                  <tbody
                    {programmes.length === 0 ? (
                      <tr style={{ height: '60px' }}>
                        <td colSpan={8} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No programmes configured.</td
                    ) : (
                      programmes.map((programme) => (
                        <tr key={programme.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px' }}>{programme.code}</td
                          <td style={{ padding: '12px 16px' }}>{programme.name}</td
                          <td style={{ padding: '12px 16px' }}>{programme.award}</td
                          <td style={{ padding: '12px 16px' }}>{programme.durationYears} {programme.durationUnit}</td
                          <td style={{ padding: '12px 16px' }}>{programme.studyMode}</td
                          <td style={{ padding: '12px 16px' }}>{programme.deliveryType}</td
                          <td style={{ padding: '12px 16px' }}>{programme.isActive ? 'Active' : 'Inactive'}</td
                          <td style={{ padding: '12px 16px' }}><button type="button" onClick={() => void toggleProgramme(programme)}>{programme.isActive ? 'Deactivate' : 'Activate'}</button
                        </tr
                      ))}
                    ))}
                  </tbody
                </table
              </div
            </div
          </>
        )}
      </div>
    </section>
  )
}