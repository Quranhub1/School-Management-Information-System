import { useEffect, useState } from 'react'
import { getStudentReportCard, type StudentReportCard } from '../api/reports'

interface ReportCardsProps { canManage: boolean }

export function ReportCards({ canManage }: ReportCardsProps) {
  const [studentId, setStudentId] = useState('')
  const [report, setReport] = useState<StudentReportCard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    if (!studentId.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await getStudentReportCard(studentId.trim())
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load report card.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId.trim()) void load()
  }, [studentId])

  function printReport() {
    window.print()
  }

  return (
    <section className="panel" aria-label="Student report cards">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">REPORTS</span>
          <h3>Student Report Cards</h3>
        </div>
        <button className="secondary-button" onClick={printReport} disabled={!report}>Print Report Card</button>
      </div>

      <form className="student-form" onSubmit={e => { e.preventDefault(); void load() }} style={{ marginBottom: 22 }}>
        <div className="form-row">
          <label>Student ID<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student ID" required /></label>
          <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Generate'}</button>
        </div>
      </form>

      {error && <div className="error" role="alert">{error}</div>}

      {report && (
        <div className="report-card" id="report-card-print">
          <div className="report-card-header">
            <div>
              <h4>Report Card</h4>
              <p>Student: {report.studentName} ({report.studentNumber})</p>
            </div>
            <div className="report-card-meta">
              <span>GPA: {report.gpa.toFixed(2)}</span>
              <span>Position: {report.classRank} / {report.totalInCohort}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Course</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Grade Point</th>
                <th>Status</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((r, i) => (
                <tr key={i}>
                  <td>{r.courseCode}</td>
                  <td>{r.courseName}</td>
                  <td>{r.score ?? '-'}</td>
                  <td>{r.grade ?? '-'}</td>
                  <td>{r.gradePoint ?? '-'}</td>
                  <td>{r.status}</td>
                  <td>{r.isFinal ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!report && !loading && (
        <p className="empty">Enter a student ID to generate a report card.</p>
      )}
    </section>
  )
}
