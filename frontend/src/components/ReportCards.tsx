import { useEffect, useState } from 'react'
import { getStudentReportCard, type StudentReportCard } from '../api/reports'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useInstitutionSettings } from './InstitutionSettingsContext'

interface ReportCardsProps { canManage?: boolean }

export function ReportCards({ canManage = false }: ReportCardsProps) {
  const [studentId, setStudentId] = useState('')
  const [report, setReport] = useState<StudentReportCard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { institution, loaded: institutionLoaded } = useInstitutionSettings()

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

  function reportPdfOptions() {
    if (!report) return null
    const rows = [
      [{ text: 'Code', style: 'tableHeader' }, { text: 'Course', style: 'tableHeader' }, { text: 'Score', style: 'tableHeader' }, { text: 'Grade', style: 'tableHeader' }, { text: 'Grade Point', style: 'tableHeader' }, { text: 'Status', style: 'tableHeader' }, { text: 'Final', style: 'tableHeader' }],
      ...report.results.map(item => [item.courseCode, item.courseName, item.score ?? '—', item.grade ?? '—', item.gradePoint ?? '—', item.status, item.isFinal ? 'Yes' : 'No']),
    ]
    return {
      title: 'Student Report Card',
      filename: 'report-card-' + report.studentNumber + '.pdf',
      institutionName: institutionLoaded && institution.isActive ? institution.institutionName : undefined,
      motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
      contactLines: institutionLoaded && institution.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
      accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
      content: [
        { columns: [{ text: [{ text: 'Student: ', bold: true }, report.studentName] }, { text: [{ text: 'Student No: ', bold: true }, report.studentNumber], alignment: 'right' }] },
        { columns: [{ text: [{ text: 'GPA: ', bold: true }, report.gpa.toFixed(2)] }, { text: [{ text: 'Class position: ', bold: true }, report.classRank + ' / ' + report.totalInCohort], alignment: 'right' }], margin: [0, 8, 0, 12] },
        { table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'], body: rows }, layout: 'lightHorizontalLines' },
      ],
    }
  }

  function printReport() {
    const options = reportPdfOptions()
    if (options) printInstitutionalPdf(options)
  }

  function downloadReport() {
    const options = reportPdfOptions()
    if (options) downloadInstitutionalPdf(options)
  }

  return (
    <section className="panel" aria-label="Student report cards">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">REPORTS</span>
          <h3>Student Report Cards</h3>
        </div>
          <button className="secondary-button" onClick={printReport} disabled={!report}>Print Report Card</button>
          <button className="secondary-button" onClick={downloadReport} disabled={!studentId.trim() || !report}>Download PDF</button>
      </div>

      <form className="student-form" onSubmit={e => { e.preventDefault(); void load() }} style={{ marginBottom: 22 }}>
        <div className="form-row">
          <label>Student ID<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student ID" required /></label>
          <button type="submit" disabled={loading}>{loading ? <><span className="spinner spinner--small" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index} />)}</span> Loading…</> : 'Generate'}</button>
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
