import { useEffect, useState } from 'react'
import {
  getCourseAnalytics,
  getAtRiskStudents,
  getTeacherWorkload,
  getDepartmentWorkload,
  getDashboardStats,
  answerQuestion,
  type CourseAnalytics,
  type StudentRiskAnalytics,
  type TeacherWorkload,
  type DepartmentWorkloadSummary,
  type DashboardStats,
} from '../api/analytics'

type Tab = 'examination' | 'teacher-workload' | 'dashboard' | 'assistant'

export function AnalyticsDashboard() {
  const [tab, setTab] = useState<Tab>('examination')
  const [semesterId, setSemesterId] = useState('')
  const [courses, setCourses] = useState<CourseAnalytics[]>([])
  const [atRisk, setAtRisk] = useState<StudentRiskAnalytics[]>([])
  const [teacherWorkload, setTeacherWorkload] = useState<TeacherWorkload[]>([])
  const [departments, setDepartments] = useState<DepartmentWorkloadSummary[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadExamination() {
    if (!semesterId.trim()) return
    setLoading(true); setError('')
    try {
      const [c, a] = await Promise.all([getCourseAnalytics(semesterId.trim()), getAtRiskStudents(semesterId.trim())])
      setCourses(c); setAtRisk(a)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load analytics.') } finally { setLoading(false) }
  }

  async function loadTeacherWorkload() {
    if (!semesterId.trim()) return
    setLoading(true); setError('')
    try {
      const [tw, d] = await Promise.all([getTeacherWorkload(semesterId.trim()), getDepartmentWorkload(semesterId.trim())])
      setTeacherWorkload(tw); setDepartments(d)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load workload.') } finally { setLoading(false) }
  }

  async function loadDashboard() {
    setLoading(true); setError('')
    try { setDashboardStats(await getDashboardStats()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load dashboard.') } finally { setLoading(false) }
  }

  async function handleQuestion(e: React.FormEvent) {
    e.preventDefault(); setError(''); setAnswer('')
    if (!question.trim()) return
    setLoading(true)
    try { setAnswer(await answerQuestion(question.trim())) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to get answer.') } finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'dashboard') void loadDashboard()
  }, [tab])

  return (
    <section className="panel" aria-label="Analytics">
      <div className="panel-heading"><div><p className="eyebrow">Analytics</p><h2>Analytics Dashboard</h2></div></div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Analytics sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'examination'} className={tab === 'examination' ? 'active' : ''} onClick={() => setTab('examination')}>Examination</button>
        <button role="tab" aria-selected={tab === 'teacher-workload'} className={tab === 'teacher-workload' ? 'active' : ''} onClick={() => setTab('teacher-workload')}>Teacher Workload</button>
        <button role="tab" aria-selected={tab === 'dashboard'} className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Dashboard</button>
        <button role="tab" aria-selected={tab === 'assistant'} className={tab === 'assistant' ? 'active' : ''} onClick={() => setTab('assistant')}>Assistant</button>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {tab === 'examination' && (
        <div>
          <form className="student-form" onSubmit={e => { e.preventDefault(); void loadExamination() }} style={{ marginBottom: 18 }}>
            <label>Semester ID<input value={semesterId} onChange={e => setSemesterId(e.target.value)} placeholder="Semester GUID" required /></label>
            <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Load'}</button>
          </form>
          <h3>Course Analytics</h3>
          <div className="table-wrap">
            <table><thead><tr><th>Course</th><th>Average</th><th>Median</th><th>Pass Rate</th><th>Fail Rate</th></tr></thead>
              <tbody>{courses.map(c => <tr key={c.courseId}><td>{c.courseCode} - {c.courseTitle}</td><td>{c.averageScore?.toFixed(2) ?? '—'}</td><td>{c.medianScore?.toFixed(2) ?? '—'}</td><td>{c.passRate.toFixed(1)}%</td><td>{c.failRate.toFixed(1)}%</td></tr>)}{courses.length === 0 && <tr><td colSpan={5} className="empty">No data.</td></tr>}</tbody></table>
          </div>
          <h3 style={{ marginTop: 22 }}>At-Risk Students</h3>
          <div className="table-wrap">
            <table><thead><tr><th>Student</th><th>Avg Score</th><th>Attendance</th><th>Risk</th><th>Factors</th></tr></thead>
              <tbody>{atRisk.map(s => <tr key={s.studentId}><td>{s.studentName}</td><td>{s.averageScore?.toFixed(1) ?? '—'}</td><td>{s.attendancePercentage.toFixed(1)}%</td><td>{s.riskLevel}</td><td>{s.riskFactors.join(', ')}</td></tr>)}{atRisk.length === 0 && <tr><td colSpan={5} className="empty">No data.</td></tr>}</tbody></table>
          </div>
        </div>
      )}
      {tab === 'teacher-workload' && (
        <div>
          <form className="student-form" onSubmit={e => { e.preventDefault(); void loadTeacherWorkload() }} style={{ marginBottom: 18 }}>
            <label>Semester ID<input value={semesterId} onChange={e => setSemesterId(e.target.value)} placeholder="Semester GUID" required /></label>
            <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Load'}</button>
          </form>
          <h3>Teacher Workload</h3>
          <div className="table-wrap">
            <table><thead><tr><th>Teacher</th><th>Department</th><th>Hours</th><th>Sessions</th><th>Courses</th><th>Score</th><th>Warning</th></tr></thead>
              <tbody>{teacherWorkload.map(w => <tr key={w.teacherId}><td>{w.teacherName}</td><td>{w.department}</td><td>{w.teachingHours}</td><td>{w.sessionsPerWeek}</td><td>{w.coursesAssigned}</td><td>{w.workloadScore}</td><td>{w.warningLevel}</td></tr>)}{teacherWorkload.length === 0 && <tr><td colSpan={7} className="empty">No data.</td></tr>}</tbody></table>
          </div>
          <h3 style={{ marginTop: 22 }}>Department Summary</h3>
          <div className="table-wrap">
            <table><thead><tr><th>Department</th><th>Teachers</th><th>Avg Score</th><th>Max</th><th>Min</th></tr></thead>
              <tbody>{departments.map(d => <tr key={d.departmentId}><td>{d.departmentName}</td><td>{d.totalTeachers}</td><td>{d.averageWorkload}</td><td>{d.highestWorkload}</td><td>{d.lowestWorkload}</td></tr>)}{departments.length === 0 && <tr><td colSpan={5} className="empty">No data.</td></tr>}</tbody></table>
          </div>
        </div>
      )}
      {tab === 'dashboard' && (
        <div>
          <button className="secondary-button" onClick={loadDashboard} disabled={loading} style={{ marginBottom: 18 }}>Refresh</button>
          {dashboardStats && (
            <div className="summary-grid">
              <div className="summary-card"><span>Total Students</span><strong>{dashboardStats.totalStudents}</strong></div>
              <div className="summary-card"><span>Active</span><strong>{dashboardStats.activeStudents}</strong></div>
              <div className="summary-card"><span>Pending Admissions</span><strong>{dashboardStats.pendingAdmissions}</strong></div>
              <div className="summary-card"><span>Attendance Rate</span><strong>{dashboardStats.attendanceRate.toFixed(1)}%</strong></div>
              <div className="summary-card"><span>Outstanding Fees</span><strong>{dashboardStats.outstandingFees.toFixed(2)}</strong></div>
              <div className="summary-card"><span>Exam Performance</span><strong>{dashboardStats.examPerformance?.toFixed(1) ?? '—'}</strong></div>
              <div className="summary-card"><span>Placement Completion</span><strong>{dashboardStats.placementCompletion.toFixed(1)}%</strong></div>
              <div className="summary-card"><span>Certificates</span><strong>{dashboardStats.certificatesIssued}</strong></div>
              <div className="summary-card"><span>Workflows Pending</span><strong>{dashboardStats.workflowItemsAwaitingAction}</strong></div>
            </div>
          )}
        </div>
      )}
      {tab === 'assistant' && (
        <form className="student-form" onSubmit={handleQuestion} style={{ marginBottom: 18 }}>
          <label>Ask a question<input value={question} onChange={e => setQuestion(e.target.value)} placeholder="How many students are enrolled?" required /></label>
          <button type="submit" disabled={loading}>{loading ? 'Thinking…' : 'Ask'}</button>
        </form>
      )}
      {tab === 'assistant' && answer && <div style={{ padding: 12, background: '#f0f9ff', borderRadius: 6 }}><strong>Answer:</strong> {answer}</div>}
    </section>
  )
}
