import { useEffect, useState } from 'react'
import { getResidentDirectorDashboard, getResidentDirectorStudents, getResidentDirectorStaff, type ResidentDirectorDashboard, type StudentOverview, type StaffOverview } from '../api/residentDirector'
import { HRManagerControlCenter } from './HRManagerControlCenter'

export function ResidentDirectorHRDashboard({ onNavigate }: { onNavigate: (module: 'students' | 'staff' | 'finance' | 'reports') => void }) {
  const [dashboard, setDashboard] = useState<ResidentDirectorDashboard | null>(null)
  const [students, setStudents] = useState<StudentOverview[]>([])
  const [staff, setStaff] = useState<StaffOverview[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getResidentDirectorDashboard(), getResidentDirectorStudents(), getResidentDirectorStaff()])
      .then(([d, s, st]) => { setDashboard(d); setStudents(s); setStaff(st) })
      .catch(e => setError(e instanceof Error ? e.message : 'Unable to load Resident Director dashboard.'))
  }, [])

  function openHrWorkspace(subsection: 'staff' | 'payroll' | 'leave' | 'recruitment') {
    onNavigate('staff')
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('smis:navigate-subsection', { detail: { module: 'staff', subsection } }))
    }, 0)
  }

  return <section className="panel" aria-label="Resident Director HR dashboard">
    <div className="panel-heading">
      <div>
        <span className="eyebrow">RESIDENT DIRECTOR • HUMAN RESOURCES</span>
        <h2>Human Resource Manager Dashboard</h2>
        <p style={{marginTop:6,color:'#64748b'}}>The Resident Director is the institution's Human Resource Manager: workforce oversight, HR approvals, payroll review and people operations are controlled from this workspace.</p>
      </div>
      <span className="status-badge">HR authority</span>
    </div>

    {error && <div className="error" role="alert">{error}</div>}

    {dashboard && <>
      <div className="summary-grid">
        <div className="summary-card"><span>Active students</span><strong>{dashboard.activeStudents}</strong></div>
        <div className="summary-card"><span>Total staff</span><strong>{dashboard.totalStaff}</strong></div>
        <div className="summary-card"><span>Programmes</span><strong>{dashboard.totalProgrammes}</strong></div>
        <div className="summary-card"><span>Outstanding invoices</span><strong>{dashboard.outstandingInvoices}</strong></div>
      </div>

      <div className="grid-form" style={{marginTop:22}}>
        <button className="secondary-button" onClick={() => openHrWorkspace('staff')}>Staff Records</button>
        <button className="secondary-button" onClick={() => openHrWorkspace('payroll')}>Payroll</button>
        <button className="secondary-button" onClick={() => openHrWorkspace('leave')}>Leave</button>
        <button className="secondary-button" onClick={() => openHrWorkspace('recruitment')}>Recruitment & Onboarding</button>
        <button className="secondary-button" onClick={() => onNavigate('students')}>Student Records — read only</button>
        <button className="secondary-button" onClick={() => onNavigate('finance')}>Finance — read only</button>
        <button className="secondary-button" onClick={() => onNavigate('reports')}>Institutional Reports</button>
      </div>
    </>}

    <HRManagerControlCenter onNavigate={openHrWorkspace} />

    {dashboard && <div className="panel" style={{marginTop:22,padding:20}}>
      <h3>Institution-wide HR visibility</h3>
      <p style={{color:'#64748b',marginTop:6}}>The Resident Director retains broad institutional read visibility while HR actions are routed through the existing Staff, Payroll, Leave and Recruitment workspaces. System administration and unrelated technical controls remain outside this role.</p>
      <div className="summary-grid" style={{marginTop:16}}>
        <div className="summary-card"><span>Student records loaded</span><strong>{students.length}</strong></div>
        <div className="summary-card"><span>Staff records loaded</span><strong>{staff.length}</strong></div>
        <div className="summary-card"><span>Recent admissions</span><strong>{dashboard.recentAdmissions.length}</strong></div>
        <div className="summary-card"><span>Large-balance alerts</span><strong>{dashboard.outstandingBalances.length}</strong></div>
      </div>
    </div>}
  </section>
}
