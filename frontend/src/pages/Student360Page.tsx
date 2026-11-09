import { useEffect, useState } from 'react'
import { getStudent360Profile, getStudentClearances, type Student360ProfileDto, type StudentOfficeClearance } from '../api/student360'

export function Student360Page() {
  const [studentId, setStudentId] = useState('')
  const [profile, setProfile] = useState<Student360ProfileDto | null>(null)
  const [clearances, setClearances] = useState<StudentOfficeClearance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    if (!studentId.trim()) return
    setLoading(true); setError(''); setProfile(null)
    try {
      const data = await getStudent360Profile(studentId.trim())
      const officeRecords = await getStudentClearances(studentId.trim())
      setProfile(data)
      setClearances(officeRecords)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load student profile.') } finally { setLoading(false) }
  }

  return (
    <section className="panel" aria-label="Student 360">
      <div className="panel-heading"><div><p className="eyebrow">STUDENT</p><h2>Student 360° Profile</h2></div></div>
      <form className="student-form" onSubmit={e => { e.preventDefault(); void load() }} style={{ marginBottom: 18 }}>
        <label>Student ID<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student GUID" required /></label>
        <button type="submit" disabled={loading}>{loading ? <><span className="spinner spinner--small" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index} />)}</span> Loading…</> : 'Load Profile'}</button>
      </form>
      {error && <div className="error" role="alert">{error}</div>}
      {profile && (
        <div>
          <div className="summary-grid">
            <div className="summary-card"><span>Student</span><strong>{profile.fullName}</strong><small>{profile.studentNumber}</small></div>
            <div className="summary-card"><span>Status</span><strong>{profile.status}</strong><small>Enrollment</small></div>
            <div className="summary-card"><span>Programme</span><strong>{profile.programmeName ?? '—'}</strong><small>{profile.department ?? ''}</small></div>
            <div className="summary-card"><span>GPA</span><strong>{profile.gpa?.toFixed(2) ?? '—'}</strong><small>Cumulative</small></div>
          </div>
          <div className="summary-grid" style={{ marginTop: 14 }}>
            <div className="summary-card"><span>Attendance</span><strong>{profile.attendancePercentage.toFixed(1)}%</strong><small>{profile.presentSessions}/{profile.totalSessions} sessions</small></div>
            <div className="summary-card"><span>Avg Score</span><strong>{profile.averageScore?.toFixed(1) ?? '—'}</strong><small>Assessment</small></div>
            <div className="summary-card"><span>Exam Avg</span><strong>{profile.averageExamScore?.toFixed(1) ?? '—'}</strong><small>Examination</small></div>
            <div className="summary-card"><span>Outstanding</span><strong>{profile.outstandingBalance.toFixed(2)}</strong><small>Fees</small></div>
          </div>
          <div className="panel" style={{ marginTop: 16, padding: 14 }}>
            <div className="panel-heading"><div><p className="eyebrow">CENTRALISED STUDENT RECORD</p><h3>Office clearance register</h3></div><strong>{clearances.filter(item => item.isCompleted || item.status === 'Cleared').length}/{clearances.length} cleared</strong></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Office</th><th>Status</th><th>Record / note</th><th>Last updated</th></tr></thead>
                <tbody>{clearances.map(item => <tr key={item.id}>
                  <td><strong>{item.office}</strong></td>
                  <td><span className={item.isCompleted || item.status === 'Cleared' ? 'status-badge status-badge--success' : 'status-badge status-badge--warning'}>{item.status}</span></td>
                  <td>{item.notes || 'Awaiting office review'}</td>
                  <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-UG') : '—'}</td>
                </tr>)}
                {clearances.length === 0 && <tr><td colSpan={4}>No office clearance records have been created for this student.</td></tr>}</tbody>
              </table>
            </div>
          </div>
          {profile.riskIndicators.length > 0 && (
            <div style={{ marginTop: 14, padding: 12, background: '#fff3cd', borderRadius: 6 }}>
              <strong>Risk Indicators:</strong>
              <ul>{profile.riskIndicators.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
