import { useMemo } from 'react'

const areas = [
  ['INSTITUTION', 'Institution Overview', 'Departments', 'Programmes', 'Academic Years', 'Calendar'],
  ['STUDENTS', 'Student Overview', 'Attendance', 'Academic Performance', 'Discipline', 'Welfare', 'Reports'],
  ['STAFF & HR', 'Staff Overview', 'Attendance', 'Leave', 'Workload', 'Performance', 'Reports'],
  ['ACADEMICS', 'Academic Overview', 'Class Performance', 'Programme Performance', 'Examinations', 'Results', 'Reports'],
  ['ADMISSIONS', 'Overview', 'Applications', 'Decisions', 'Enrollment', 'Reports'],
  ['FINANCE', 'Financial Overview', 'Revenue', 'Expenditure', 'Budget', 'Fees', 'Reports'],
  ['OPERATIONS', 'Hostel', 'Kitchen', 'Stores', 'Library', 'Maintenance'],
  ['APPROVAL CENTRE', 'Pending Approvals', 'Approval History'],
  ['COMMUNICATION', 'Announcements', 'Notices', 'Messages'],
  ['REPORTS & ANALYTICS', 'Institutional Reports', 'KPI Dashboard', 'Executive Reports'],
] as const

export function DirectorExecutiveDashboard({ onNavigate }: { onNavigate: (module: 'students' | 'academics' | 'finance' | 'staff' | 'reports' | 'communication' | 'inventory' | 'library') => void }) {
  const summary = useMemo(() => [
    ['Institution', 'Executive oversight'],
    ['Students', 'Read & review'],
    ['Staff & HR', 'Oversight'],
    ['Academics', 'Oversight & approvals'],
    ['Finance', 'Review & approvals'],
    ['Operations', 'Institution-wide oversight'],
  ], [])
  return <section className="panel" aria-label="Director executive dashboard">
    <div className="panel-heading">
      <div><span className="eyebrow">EXECUTIVE LEADERSHIP</span><h2>Director Dashboard</h2><p style={{marginTop:6,color:'#64748b'}}>Institution-wide command centre for performance, oversight, approvals and strategic decisions.</p></div>
      <span className="status-badge">Executive authority</span>
    </div>
    <div className="summary-grid">{summary.map(([label,value]) => <div className="summary-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="panel" style={{marginTop:22,padding:20}}>
      <h3>Director's Working Areas</h3>
      <p style={{marginTop:6,color:'#64748b'}}>The Director can work across the institution, with write and approval actions determined by the underlying permission. System administration remains the System Administrator's responsibility.</p>
      <div className="office-card-grid" style={{marginTop:16}}>
        {areas.map(([group,...items]) => <button key={group} type="button" className="office-card" onClick={() => {
          const target = group === 'STUDENTS' ? 'students' : group === 'ACADEMICS' ? 'academics' : group === 'FINANCE' ? 'finance' : group === 'STAFF & HR' ? 'staff' : group === 'REPORTS & ANALYTICS' ? 'reports' : group === 'COMMUNICATION' ? 'communication' : group === 'OPERATIONS' ? 'inventory' : 'reports'
          onNavigate(target as Parameters<typeof onNavigate>[0])
        }}>
          <span className="office-card-copy"><strong>{group}</strong><small>{items.join(' • ')}</small></span><span className="office-card-link">Open →</span>
        </button>)}
      </div>
    </div>
    <div className="panel" style={{marginTop:18,padding:20}}>
      <h3>Executive authority boundary</h3>
      <ul className="office-responsibilities">
        <li>View institutional information across admissions, students, academics, staff, finance and operations.</li>
        <li>Approve institutional matters where the Director policy permits approval.</li>
        <li>Review executive reports, KPIs, budgets and institutional performance.</li>
        <li>Delegate defined functions to the Resident Director when formally acting on the Director's behalf.</li>
        <li>Cannot manage system accounts, security configuration or technical administration unless separately assigned the System Administrator role.</li>
      </ul>
    </div>
  </section>
}
