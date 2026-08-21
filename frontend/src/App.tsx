import { FormEvent, useState } from 'react'
import { getStudentAcademicSummaries, getStudentTranscript } from './api/academicRecords'
import type { AcademicResultSummary, TranscriptEntry } from './types/academic'

function App() {
  const [studentId, setStudentId] = useState('')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [summaries, setSummaries] = useState<AcademicResultSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadAcademicRecords(event: FormEvent) {
    event.preventDefault()
    if (!studentId.trim()) return

    setLoading(true)
    setError('')
    try {
      const [entries, resultSummaries] = await Promise.all([
        getStudentTranscript(studentId.trim()),
        getStudentAcademicSummaries(studentId.trim()),
      ])
      setTranscript(entries)
      setSummaries(resultSummaries)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load academic records.')
      setTranscript([])
      setSummaries([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">SMIS</span>
          <h1>Academic Records</h1>
        </div>
        <span className="status">LAN-first</span>
      </header>

      <section className="hero">
        <p className="eyebrow">Student services</p>
        <h2>Transcript and academic performance</h2>
        <p>Retrieve a student's transcript entries and semester summaries directly from the SMIS API.</p>

        <form className="student-form" onSubmit={loadAcademicRecords}>
          <label htmlFor="student-id">Student ID</label>
          <div className="form-row">
            <input
              id="student-id"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="Enter student UUID"
            />
            <button type="submit" disabled={loading || !studentId.trim()}>
              {loading ? 'Loading…' : 'Load records'}
            </button>
          </div>
        </form>
      </section>

      {error && <div className="error" role="alert">{error}</div>}

      <section className="summary-grid" aria-label="Academic summaries">
        {summaries.map((summary) => (
          <article className="summary-card" key={summary.id}>
            <span>Semester</span>
            <strong>{summary.semesterId}</strong>
            <div className="metrics">
              <span>GPA <b>{summary.gpa.toFixed(2)}</b></span>
              <span>CGPA <b>{summary.cgpa.toFixed(2)}</b></span>
            </div>
            <small>{summary.standing}</small>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Transcript</p>
            <h3>Course results</h3>
          </div>
          <span>{transcript.length} entries</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Course name</th>
                <th>Units</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Point</th>
              </tr>
            </thead>
            <tbody>
              {transcript.length === 0 ? (
                <tr><td colSpan={6} className="empty">No academic records loaded.</td></tr>
              ) : transcript.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.courseCode}</td>
                  <td>{entry.courseName}</td>
                  <td>{entry.creditUnits}</td>
                  <td>{entry.score}</td>
                  <td><span className="grade">{entry.grade}</span></td>
                  <td>{entry.gradePoint.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default App
