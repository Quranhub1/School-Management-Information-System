import { useState } from 'react'
import type { FormEvent } from 'react'
import { getExaminationSummaries, getExaminationTranscript } from '../api/examinationResults'
import type { AcademicResultSummary, TranscriptEntry } from '../types/academic'

export function ExaminationResults() {
  const [studentId, setStudentId] = useState('')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [summaries, setSummaries] = useState<AcademicResultSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function retrieve(event: FormEvent) {
    event.preventDefault()
    if (!studentId.trim()) return
    setLoading(true)
    setError('')
    try {
      const id = studentId.trim()
      const [entries, resultSummaries] = await Promise.all([
        getExaminationTranscript(id),
        getExaminationSummaries(id),
      ])
      setTranscript(entries)
      setSummaries(resultSummaries)
    } catch (requestError) {
      setTranscript([])
      setSummaries([])
      setError(requestError instanceof Error ? requestError.message : 'Unable to load examination results.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="academic-workspace" aria-label="Examination and results workspace">
      <div className="panel-heading">
        <div><p className="eyebrow">Examinations & Results</p><h2>Results verification</h2></div>
        <span>{transcript.length} course results</span>
      </div>

      <form className="student-form" onSubmit={retrieve}>
        <label htmlFor="exam-student-id">Student ID</label>
        <div className="form-row">
          <input id="exam-student-id" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter student UUID" />
          <button type="submit" disabled={loading || !studentId.trim()}>{loading ? 'Loading…' : 'Retrieve results'}</button>
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
          <thead><tr><th>Course</th><th>Title</th><th>Units</th><th>Score</th><th>Grade</th><th>Point</th><th>Outcome</th></tr></thead>
          <tbody>
            {transcript.length === 0 ? <tr><td colSpan={7} className="empty">No examination results loaded.</td></tr> : transcript.map((entry) => (
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
