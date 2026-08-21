import { useState } from 'react'
import type { FormEvent } from 'react'
import { getStudentAcademicSummaries, getStudentTranscript } from '../api/academicRecords'
import type { AcademicResultSummary, TranscriptEntry } from '../types/academic'

interface AcademicManagementProps {
  canManage: boolean
}

export function AcademicManagement({ canManage }: AcademicManagementProps) {
  const [studentId, setStudentId] = useState('')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [summaries, setSummaries] = useState<AcademicResultSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  if (!canManage) {
    return <section className="panel"><h3>Academic Management</h3><p className="empty">Your role does not have academic-management access.</p></section>
  }

  return (
    <section className="academic-workspace" aria-label="Academic management workspace">
      <div className="panel-heading">
        <div><p className="eyebrow">Academic Management</p><h2>Student academic records</h2></div>
        <span>{transcript.length} course results</span>
      </div>

      <form className="student-form" onSubmit={loadRecords}>
        <label htmlFor="academic-student-id">Student ID</label>
        <div className="form-row">
          <input id="academic-student-id" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter student UUID" />
          <button type="submit" disabled={loading || !studentId.trim()}>{loading ? 'Loading…' : 'Retrieve records'}</button>
        </div>
      </form>

      {error && <div className="error" role="alert">{error}</div>}

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
        <table>
          <thead><tr><th>Course</th><th>Title</th><th>Units</th><th>Score</th><th>Grade</th><th>Point</th><th>Status</th></tr></thead>
          <tbody>
            {transcript.length === 0 ? <tr><td colSpan={7} className="empty">No academic records loaded.</td></tr> : transcript.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.courseCode}</td><td>{entry.courseTitle}</td><td>{entry.creditUnits}</td><td>{entry.score}</td><td>{entry.grade ?? '—'}</td><td>{entry.gradePoint.toFixed(2)}</td><td>{entry.isPass ? 'Pass' : 'Fail'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
