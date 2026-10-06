import { useEffect, useState } from 'react'
import { getResidentDirectorDashboard, getResidentDirectorStudents, getResidentDirectorStaff, type ResidentDirectorDashboard, type StudentOverview, type StaffOverview } from '../api/residentDirector'

export function ResidentDirectorHRDashboard({ onNavigate }: { onNavigate: (module: 'students' | 'staff' | 'finance' | 'reports') => void }) {
  const [dashboard, setDashboard] = useState<ResidentDirectorDashboard | null>(null)
  const [students, setStudents] = useState<StudentOverview[]>([])
  const [staff, setStaff] = useState<StaffOverview[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([getResidentDirectorDashboard(), getResidentDirectorStudents(), getResidentDirectorStaff()])
      .then(([d, s, st]) => { setDashboard(d); setStudents(s); setStaff(st) })
      .catch(e => setError(e instanceof Error ? e.message : 'Unable to load HR dashboard.'))
  }, [])
  return <section className="panel" aria-label="Resident Director HR dashboard">
    <div className="panel-heading"><div><span className="eyebrow">RESIDENT DIRECTOR • HR</span><h2>Human Resource Manager Dashboard</h2><p style={{marginTop:6,color:'#64748b'}}>Institution-wide HR authority with broad read visibility and controlled write privileges.</p></div><span className="status-badge">HR authority</span></div>
    {error && <div className="error" role="alert">{error}</div>}
    {!dashboard ? <p className="empty">Loading HR dashboard…</p> : <>
      <div className="summary-grid">
        <div className="summary-card"><span>Active students</span><strong>{dashboard.activeStudents}</strong></div>
        <div className="summary-card"><span>Total staff</span><strong>{dashboard.totalStaff}</strong></div>
        <div className="summary-card"><span>Programmes</span><strong>{dashboard.totalProgrammes}</strong></div>
        <div className="summary-card"><span>Outstanding invoices</span><strong>{dashboard.outstandingInvoices}</strong></div>
      </div>
      <div className="grid-form" style={{marginTop:22}}>
        <button className="secondary-button" onClick={() => onNavigate('staff')}>HR / Staff Management</button>
        <button className="secondary-button" onClick={() => onNavigate('students')}>Student Records — read only</button>
        <button className="secondary-button" onClick={() => onNavigate('finance')}>Finance — read only</button>
        <button className="secondary-button" onClick={() => onNavigate('reports')}>Institutional Reports</button>
      </div>
      <div className="panel" style={{marginTop:22,padding:20}}>
        <h3>Institution-wide read access</h3>
        <p style={{color:'#64748b',marginTop:6}}>The Resident Director can inspect admissions and student records, academic/attendance information exposed by the authorized modules, finance visibility and institutional reports. Student, admission, finance and system edits remain denied unless a specific HR or delegated executive permission authorizes them.</p>
        <div className="summary-grid" style={{marginTop:16}}>
          <div className="summary-card"><span>Student records loaded</span><strong>{students.length}</strong></div>
          <div className="summary-card"><span>Staff records loaded</span><strong>{staff.length}</strong></div>
          <div className="summary-card"><span>Recent admissions</span><strong>{dashboard.recentAdmissions.length}</strong></div>
          <div className="summary-card"><span>Large-balance alerts</span><strong>{dashboard.outstandingBalances.length}</strong></div>
        </div>
      </div>
    </>}
  </section>
}
