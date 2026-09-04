import { useEffect, useState } from 'react'
import { getStudent360Profile, type Student360ProfileDto } from '../api/student360'

export function Student360Page() {
  const [studentId, setStudentId] = useState('')
  const [profile, setProfile] = useState<Student360ProfileDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    if (!studentId.trim()) return
    setLoading(true); setError(''); setProfile(null)
    try {
      const data = await getStudent360Profile(studentId.trim())
      setProfile(data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load student profile.') } finally { setLoading(false) }
  }

  return (
    <section className="panel" aria-label="Student 360">
      <div className="panel-heading"><div><p className="eyebrow">STUDENT</p><h2>Student 360° Profile</h2></div></div>
      <form className="student-form" onSubmit={e => { e.preventDefault(); void load() }} style={{ marginBottom: 18 }}>
        <label>Student ID<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student GUID" required /></label>
        <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Load Profile'}</button>
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
