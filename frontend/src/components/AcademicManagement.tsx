import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getStudentAcademicSummaries, getStudentTranscript } from '../api/academicRecords'
import { createProgramme, getProgrammes, setProgrammeActive, type Programme } from '../api/programmes'
import type { AcademicResultSummary, TranscriptEntry } from '../types/academic'

interface AcademicManagementProps {
  canManage?: boolean
}

type AcademicView = 'records' | 'programmes'

export function AcademicManagement({ canManage }: AcademicManagementProps) {
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
    if (!canManage || !studentId.trim()) return
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

  if (!canManage) {
    return <section className="panel"><h3>Academic Management</h3><p className="empty">Your role does not have academic-management access.</p></section>
  }

  return (
    <section className="academic-workspace" aria-label="Academic management workspace">
      <div className="panel-heading">
        <div><p className="eyebrow">Academic Management</p><h2>{view === 'records' ? 'Student academic records' : 'Programme management'}</h2></div>
        <span>{view === 'records' ? `${transcript.length} course results` : `${programmes.length} programmes`}</span>
      </div>

      <div className="form-row" role="tablist" aria-label="Academic management views">
        <button type="button" aria-selected={view === 'records'} onClick={() => setView('records')}>Academic Records</button>
        <button type="button" aria-selected={view === 'programmes'} onClick={() => setView('programmes')}>Programmes</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {view === 'records' ? (
        <>
          <form className="student-form" onSubmit={loadRecords}>
            <label htmlFor="academic-student-id">Student ID</label>
            <div className="form-row">
              <input id="academic-student-id" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter student UUID" />
              <button type="submit" disabled={loading || !studentId.trim()}>{loading ? 'Loading…' : 'Retrieve records'}</button>
            </div>
          </form>
          <div className="summary-grid">
            {summaries.map((summary) => (
              <article className="summary-card" key={summary.id}>
                <span>Semester</span><strong>{summary.semesterId}</strong>
                <div className="metrics"><span>GPA <b>{summary.gpa.toFixed(2)}</b></span><span>CGPA <b>{summary.cgpa?.toFixed(2) ?? '—'}</b></span></div>
                <small>{summary.standing}{summary.isApproved ? ' · Approved' : ' · Pending approval'}</small>
              </article>
            ))}
          </div>
          <div className="table-wrap">
            <table><thead><tr><th>Course</th><th>Title</th><th>Units</th><th>Score</th><th>Grade</th><th>Point</th><th>Status</th></tr></thead>
              <tbody>{transcript.length === 0 ? <tr><td colSpan={7} className="empty">No academic records loaded.</td></tr> : transcript.map((entry) => <tr key={entry.id}><td>{entry.courseCode}</td><td>{entry.courseTitle}</td><td>{entry.creditUnits}</td><td>{entry.score}</td><td>{entry.grade ?? '—'}</td><td>{entry.gradePoint.toFixed(2)}</td><td>{entry.isPass ? 'Pass' : 'Fail'}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <form className="student-form" onSubmit={saveProgramme}>
            <div className="form-row"><input required value={programmeForm.departmentId} onChange={(e) => setProgrammeForm({ ...programmeForm, departmentId: e.target.value })} placeholder="Department UUID" /><input required value={programmeForm.code} onChange={(e) => setProgrammeForm({ ...programmeForm, code: e.target.value })} placeholder="Programme code" /></div>
            <div className="form-row"><input required value={programmeForm.name} onChange={(e) => setProgrammeForm({ ...programmeForm, name: e.target.value })} placeholder="Programme name" /><input required value={programmeForm.award} onChange={(e) => setProgrammeForm({ ...programmeForm, award: e.target.value })} placeholder="Award" /></div>
            <div className="form-row"><input value={programmeForm.awardTitle} onChange={(e) => setProgrammeForm({ ...programmeForm, awardTitle: e.target.value })} placeholder="Award title (optional)" /><input type="number" min="1" value={programmeForm.durationYears} onChange={(e) => setProgrammeForm({ ...programmeForm, durationYears: e.target.value })} placeholder="Duration" /></div>
            <div className="form-row"><select value={programmeForm.studyMode} onChange={(e) => setProgrammeForm({ ...programmeForm, studyMode: e.target.value })}><option>Full-time</option><option>Part-time</option><option>Evening</option><option>Weekend</option></select><select value={programmeForm.deliveryType} onChange={(e) => setProgrammeForm({ ...programmeForm, deliveryType: e.target.value })}><option>Academic</option><option>CBET</option><option>Blended</option><option>Practical</option></select><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add programme'}</button></div>
          </form>
          <div className="table-wrap"><table><thead><tr><th>Code</th><th>Programme</th><th>Award</th><th>Duration</th><th>Mode</th><th>Delivery</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{programmes.length === 0 ? <tr><td colSpan={8} className="empty">No programmes configured.</td></tr> : programmes.map((programme) => <tr key={programme.id}><td>{programme.code}</td><td>{programme.name}</td><td>{programme.award}</td><td>{programme.durationYears} {programme.durationUnit}</td><td>{programme.studyMode}</td><td>{programme.deliveryType}</td><td>{programme.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => void toggleProgramme(programme)}>{programme.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody>
          </table></div>
        </>
      )}
    </section>
  )
}
