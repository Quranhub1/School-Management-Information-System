import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, BellRing, BookOpenCheck, BrainCircuit, CalendarClock, CheckCircle2, CircleDollarSign, GraduationCap, RefreshCw, Search, ShieldAlert, UsersRound, Wallet, X } from 'lucide-react'
import { getModernDashboard, getStudentRisk, getStudent360, getWorkflowSummary, type ModernDashboard, type StudentRisk, type Student360, type WorkflowSummary } from '../api/modern'
import { getAccessToken } from '../api/auth'
import './ModernInformationHub.css'

const number = (n: number) => new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0)
const money = (n: number) => number(n)
type Destination = 'students' | 'finance' | 'admissions' | 'reports' | 'timetable'
function goTo(module: Destination) {
  window.dispatchEvent(new CustomEvent('smis:navigate-module', { detail: module === 'admissions' ? 'students' : module }))
}

export function ModernInformationHub() {
  const [dashboard, setDashboard] = useState<ModernDashboard | null>(null)
  const [risk, setRisk] = useState<StudentRisk[]>([])
  const [workflow, setWorkflow] = useState<WorkflowSummary | null>(null)
  const [selected, setSelected] = useState<Student360 | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [assistantLoading, setAssistantLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      setError('')
      const [d, r, w] = await Promise.all([getModernDashboard(), getStudentRisk(), getWorkflowSummary()])
      setDashboard(d); setRisk(r); setWorkflow(w)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load dashboard data.')
    } finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [])
  async function openStudent(id: string) {
    try { setSelected(await getStudent360(id)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load student profile.') }
  }
  async function askAssistant() {
    if (!question.trim() || assistantLoading) return
    setAssistantLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ question }) })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json() as { answer: string }
      setAnswer(data.answer)
    } catch (e) { setError(e instanceof Error ? e.message : 'Assistant unavailable.') }
    finally { setAssistantLoading(false) }
  }

  const metrics = dashboard ? [
    { label: 'Active students', value: number(dashboard.activeStudents), note: `${number(dashboard.totalStudents)} total records`, icon: UsersRound, tone: 'blue' },
    { label: 'Pending admissions', value: number(dashboard.pendingAdmissions), note: 'Applications awaiting action', icon: GraduationCap, tone: 'violet' },
    { label: 'Fees outstanding', value: `UGX ${money(dashboard.outstanding)}`, note: `UGX ${money(dashboard.totalPaid)} collected`, icon: Wallet, tone: 'amber' },
    { label: 'Attendance rate', value: `${number(dashboard.attendanceRate)}%`, note: 'Institution-wide', icon: CalendarClock, tone: 'green' },
  ] : []

  return <section className="modern-hub modern-dashboard" aria-label="Institution dashboard">
    <div className="dashboard-page-heading">
      <div><p className="eyebrow">SCHOOL OVERVIEW</p><h2>Dashboard</h2><p>Your institution at a glance. Review key indicators and follow up on work that needs attention.</p></div>
      <button className="dashboard-refresh" onClick={() => void refresh()} disabled={loading}><RefreshCw size={16} className={loading ? 'dashboard-spin' : ''}/>{loading ? 'Refreshing' : 'Refresh data'}</button>
    </div>
    {error && <div className="dashboard-alert" role="alert"><ShieldAlert size={18}/><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss message"><X size={16}/></button></div>}
    <div className="dashboard-kpi-grid">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return <article className={`dashboard-kpi dashboard-kpi-${metric.tone}`} key={metric.label}>
          <div className="dashboard-kpi-top"><span>{metric.label}</span><span className="dashboard-kpi-icon"><Icon size={19}/></span></div>
          <strong className={index === 2 ? 'dashboard-kpi-money' : ''}>{metric.value}</strong>
          <small>{metric.note}</small>
        </article>
      })}
    </div>
    <div className="dashboard-secondary-grid">
      <article className="dashboard-panel dashboard-performance">
        <div className="dashboard-panel-heading"><div><span className="dashboard-section-kicker">ACADEMIC OUTCOMES</span><h3>Learning & clinical progress</h3></div><BookOpenCheck size={19}/></div>
        <div className="dashboard-progress-row"><div className="dashboard-progress-copy"><span>Assessment average</span><strong>{dashboard ? `${number(dashboard.averageAssessment)}%` : '—'}</strong></div><div className="dashboard-progress-track"><span style={{ width: `${Math.min(100, Math.max(0, dashboard?.averageAssessment ?? 0))}%` }}/></div></div>
        <div className="dashboard-progress-row"><div className="dashboard-progress-copy"><span>Clinical placement completion</span><strong>{dashboard ? `${number(dashboard.placementCompletionRate)}%` : '—'}</strong></div><div className="dashboard-progress-track dashboard-progress-clinical"><span style={{ width: `${Math.min(100, Math.max(0, dashboard?.placementCompletionRate ?? 0))}%` }}/></div></div>
        <div className="dashboard-panel-footnote"><CheckCircle2 size={15}/> Figures reflect data currently recorded in SMIS.</div>
      </article>
      <article className="dashboard-panel dashboard-work-queue">
        <div className="dashboard-panel-heading"><div><span className="dashboard-section-kicker">FOLLOW-UP</span><h3>Action queue</h3></div><BellRing size={19}/></div>
        <button className="dashboard-queue-item" onClick={() => goTo('admissions')}><span className="dashboard-queue-icon queue-violet"><GraduationCap size={17}/></span><span><strong>Admissions</strong><small>Applications awaiting review</small></span><b>{workflow?.pendingAdmissions ?? dashboard?.pendingAdmissions ?? '—'}</b><ArrowRight size={16}/></button>
        <button className="dashboard-queue-item" onClick={() => goTo('finance')}><span className="dashboard-queue-icon queue-amber"><CircleDollarSign size={17}/></span><span><strong>Financial follow-ups</strong><small>Outstanding account actions</small></span><b>{workflow?.financialFollowUps ?? '—'}</b><ArrowRight size={16}/></button>
        <button className="dashboard-queue-item" onClick={() => goTo('reports')}><span className="dashboard-queue-icon queue-blue"><CalendarClock size={17}/></span><span><strong>Clinical placements</strong><small>Placements awaiting completion</small></span><b>{workflow?.pendingPlacements ?? '—'}</b><ArrowRight size={16}/></button>
      </article>
    </div>
    <div className="dashboard-bottom-grid">
      <article className="dashboard-panel dashboard-risk-panel">
        <div className="dashboard-panel-heading"><div><span className="dashboard-section-kicker">STUDENT SUPPORT</span><h3>Early-warning list</h3><p>Review learners flagged by recorded attendance and assessment indicators.</p></div><span className="dashboard-count-pill">{risk.length} records</span></div>
        {loading && !dashboard ? <div className="dashboard-empty-state">Loading current student indicators…</div> : risk.length === 0 ? <div className="dashboard-empty-state"><CheckCircle2 size={22}/><strong>No student risk records</strong><span>There are no early-warning records to display at the moment.</span></div> :
          <div className="dashboard-risk-list">{risk.slice(0, 8).map(student => <button className="dashboard-risk-row" key={student.studentId} onClick={() => void openStudent(student.studentId)}>
            <span className="dashboard-student-avatar">{student.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'S'}</span>
            <span className="dashboard-risk-name"><strong>{student.name}</strong><small>{student.studentNumber}</small></span>
            <span className="dashboard-risk-measure"><strong>{number(student.attendanceRate)}%</strong><small>Attendance</small></span>
            <span className="dashboard-risk-measure"><strong>{number(student.averageScore)}%</strong><small>Assessment</small></span>
            <span className={`dashboard-risk-badge risk-${student.riskLevel.toLowerCase()}`}>{student.riskLevel}</span><ArrowRight size={16}/>
          </button>)}</div>}
        {risk.length > 8 && <button className="dashboard-view-all" onClick={() => goTo('students')}>View student records <ArrowRight size={15}/></button>}
      </article>
      <article className="dashboard-panel dashboard-assistant-panel">
        <div className="dashboard-assistant-banner"><span className="dashboard-assistant-icon"><BrainCircuit size={21}/></span><div><span className="dashboard-section-kicker">AI WORKSPACE</span><h3>Ask the SMIS assistant</h3><p>Ask a question about school operations or recorded information.</p></div></div>
        <form className="dashboard-assistant-form" onSubmit={event => { event.preventDefault(); void askAssistant() }}>
          <label htmlFor="dashboard-assistant-question">Your question</label>
          <div className="dashboard-assistant-input"><Search size={17}/><input id="dashboard-assistant-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about attendance, admissions…" /></div>
          <button type="submit" disabled={!question.trim() || assistantLoading}>{assistantLoading ? 'Thinking…' : 'Ask assistant'} <ArrowUpRight size={16}/></button>
        </form>
        {answer && <div className="dashboard-assistant-answer">{answer}</div>}
        <div className="dashboard-assistant-note"><CheckCircle2 size={14}/> Uses the configured SMIS assistant service.</div>
      </article>
    </div>
    {selected && <div className="student360-modal" role="dialog" aria-modal="true" aria-label="Student profile"><div className="student360-card dashboard-student-modal">
      <button className="close-button" onClick={() => setSelected(null)} aria-label="Close student profile">×</button><p className="eyebrow">STUDENT PROFILE</p><h3>{selected.name}</h3><p>{selected.studentNumber} · {selected.status}</p>
      <div className="student360-grid"><div><span>Attendance</span><b>{selected.attendanceRate}%</b></div><div><span>Assessment</span><b>{selected.averageAssessment}%</b></div><div><span>Fees outstanding</span><b>UGX {money(selected.outstanding)}</b></div><div><span>Placements</span><b>{selected.completedPlacements}/{selected.placementCount}</b></div><div><span>Certificates</span><b>{selected.certificateCount}</b></div><div><span>Admission documents</span><b>{selected.admissionDocumentCount}</b></div></div>
      <div className="student360-details"><p><b>Phone:</b> {selected.phone || 'Not recorded'}</p><p><b>Email:</b> {selected.email || 'Not recorded'}</p><p><b>Gender:</b> {selected.gender || 'Not recorded'}</p></div>
    </div></div>}
  </section>
}
