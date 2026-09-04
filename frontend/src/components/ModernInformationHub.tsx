import { useEffect, useState } from 'react'
import { getModernDashboard, getStudentRisk, getStudent360, getWorkflowSummary, type ModernDashboard, type StudentRisk, type Student360, type WorkflowSummary } from '../api/modern'
import './ModernInformationHub.css'

const money = (n: number) => new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(n)

export function ModernInformationHub() {
  const [dashboard, setDashboard] = useState<ModernDashboard | null>(null)
  const [risk, setRisk] = useState<StudentRisk[]>([])
  const [workflow, setWorkflow] = useState<WorkflowSummary | null>(null)
  const [selected, setSelected] = useState<Student360 | null>(null)
  const [error, setError] = useState('')

  async function refresh() {
    try {
      setError('')
      const [d, r, w] = await Promise.all([getModernDashboard(), getStudentRisk(), getWorkflowSummary()])
      setDashboard(d); setRisk(r); setWorkflow(w)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load modern information hub.') }
  }
  useEffect(() => { void refresh() }, [])

  async function openStudent(id: string) {
    try { setSelected(await getStudent360(id)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load student profile.') }
  }

  const cards = dashboard ? [
    ['Students', dashboard.activeStudents, `${dashboard.totalStudents} total`],
    ['Pending admissions', dashboard.pendingAdmissions, 'Needs workflow action'],
    ['Outstanding fees', `UGX ${money(dashboard.outstanding)}`, `Paid UGX ${money(dashboard.totalPaid)}`],
    ['Attendance', `${dashboard.attendanceRate}%`, 'Institution-wide'],
    ['Assessment average', `${dashboard.averageAssessment}%`, 'Current recorded assessments'],
    ['Clinical completion', `${dashboard.placementCompletionRate}%`, 'Completed placements'],
  ] : []

  return <section className="modern-hub">
    <div className="modern-hero">
      <div><p className="eyebrow">Modern Information Hub</p><h2>Institution command centre</h2><p>Offline-first intelligence across admissions, students, academics, attendance, finance, staff, examinations and clinical training.</p></div>
      <button className="secondary-button" onClick={() => void refresh()}>Refresh local data</button>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="modern-cards">{cards.map(([label, value, hint]) => <article className="modern-card" key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}</div>
    <div className="modern-grid">
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">Predictive analytics</p><h3>Student early-warning list</h3></div></div>
        {risk.length === 0 ? <p className="empty">No student risk records yet.</p> : <div className="risk-list">{risk.slice(0, 12).map(s => <button className="risk-row" key={s.studentId} onClick={() => void openStudent(s.studentId)}><span><b>{s.studentNumber}</b> {s.name}</span><span>{s.attendanceRate}% attendance · {s.averageScore}% score</span><strong className={`risk-${s.riskLevel.toLowerCase()}`}>{s.riskLevel} · {s.riskScore}</strong></button>)}</div>}
      </article>
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">Workflow automation</p><h3>Action queue</h3></div></div>
        <div className="workflow-list"><div><b>{workflow?.pendingAdmissions ?? '—'}</b><span>Admissions awaiting action</span></div><div><b>{workflow?.financialFollowUps ?? '—'}</b><span>Financial follow-ups</span></div><div><b>{workflow?.pendingPlacements ?? '—'}</b><span>Clinical placements pending</span></div></div>
      </article>
    </div>
    <div className="modern-feature-grid">{['AI-assisted administration','Student 360° profiles','Intelligent timetable','QR attendance','Teacher workload','Examination analytics','Clinical placements','Digital certificates','Document management','Global search','Security & audit','Offline-first PWA'].map(x => <div key={x} className="feature-chip"><span>✓</span>{x}</div>)}</div>
    {selected && <div className="student360-modal" role="dialog" aria-modal="true"><div className="student360-card"><button className="close-button" onClick={() => setSelected(null)}>×</button><p className="eyebrow">Student 360°</p><h3>{selected.name}</h3><p>{selected.studentNumber} · {selected.status}</p><div className="student360-grid"><div><span>Attendance</span><b>{selected.attendanceRate}%</b></div><div><span>Assessment</span><b>{selected.averageAssessment}%</b></div><div><span>Fees outstanding</span><b>UGX {money(selected.outstanding)}</b></div><div><span>Placements</span><b>{selected.completedPlacements}/{selected.placementCount}</b></div><div><span>Certificates</span><b>{selected.certificateCount}</b></div><div><span>Admission documents</span><b>{selected.admissionDocumentCount}</b></div></div><div className="student360-details"><p><b>Phone:</b> {selected.phone || 'Not recorded'}</p><p><b>Email:</b> {selected.email || 'Not recorded'}</p><p><b>Gender:</b> {selected.gender || 'Not recorded'}</p></div></div></div>}
  </section>
}
