import { useEffect, useState } from 'react'
import { getAdmissions, type Admission } from '../api/admissions'
import { getStudents, type Student } from '../api/students'
import { getResidentDirectorDashboard, getResidentDirectorStaff, type ResidentDirectorDashboard, type StaffOverview } from '../api/residentDirector'

type Role = 'Secretary' | 'Receptionist' | 'HeadOfDepartment'

export function RoleSpecificDashboard({ role, onNavigate }: { role: Role; onNavigate: (module: 'students' | 'academics' | 'staff' | 'attendance' | 'reports' | 'laboratories') => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [rd, setRd] = useState<ResidentDirectorDashboard | null>(null)
  const [staff, setStaff] = useState<StaffOverview[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError('')
      try {
        if (role === 'Secretary') {
          const [a, s] = await Promise.all([getAdmissions(), getStudents()])
          if (!cancelled) { setAdmissions(a); setStudents(s) }
        } else if (role === 'HeadOfDepartment') {
          const [a, s] = await Promise.all([getAdmissions(), getStudents()])
          if (!cancelled) { setAdmissions(a); setStudents(s) }
        } else {
          const [d, st] = await Promise.all([getResidentDirectorDashboard(), getResidentDirectorStaff()])
          if (!cancelled) { setRd(d); setStaff(st) }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load dashboard data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [role])

  const title = role === 'Secretary' ? 'Secretary Dashboard' : role === 'Receptionist' ? 'Receptionist Dashboard' : 'Head of Department Dashboard'
  const subtitle = role === 'Secretary'
    ? 'Office administration, correspondence, admissions visibility and institutional records.'
    : role === 'Receptionist'
      ? 'Front desk, visitor coordination, appointments, enquiries and controlled institutional lookup.'
      : 'Department-focused academic, staff and student oversight.'

  return <section className="panel" aria-label={title}>
    <div className="panel-heading">
      <div><span className="eyebrow">{role.toUpperCase()}</span><h2>{title}</h2><p style={{ marginTop: 6, color: '#64748b' }}>{subtitle}</p></div>
      <span className="status-badge">Authorized workspace</span>
    </div>

    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading authorized workspace data…</p> : <>
      {role === 'Secretary' && <>
        <div className="summary-grid">
          <div className="summary-card"><span>Total students visible</span><strong>{students.length}</strong></div>
          <div className="summary-card"><span>Admissions visible</span><strong>{admissions.length}</strong></div>
          <div className="summary-card"><span>Pending admissions</span><strong>{admissions.filter(x => x.status === 'Pending').length}</strong></div>
          <div className="summary-card"><span>Accepted admissions</span><strong>{admissions.filter(x => x.status === 'Accepted').length}</strong></div>
        </div>
        <div className="grid-form" style={{ marginTop: 22 }}>
          <button className="secondary-button" onClick={() => onNavigate('students')}>Student Records — read only</button>
          <button className="secondary-button" onClick={() => onNavigate('reports')}>Administrative Reports</button>
        </div>
      </>}

      {role === 'Receptionist' && <>
        <div className="summary-grid">
          <div className="summary-card"><span>Front desk</span><strong>Active</strong></div>
          <div className="summary-card"><span>Visitor register</span><strong>Ready</strong></div>
          <div className="summary-card"><span>Appointments</span><strong>Ready</strong></div>
          <div className="summary-card"><span>Institution lookup</span><strong>Controlled</strong></div>
        </div>
        <div className="panel" style={{ marginTop: 22, padding: 20 }}>
          <h3>Front Desk Operations</h3>
          <p style={{ color: '#64748b', marginTop: 6 }}>Use the operational navigation for front-desk tasks. Student and staff information is exposed only where the assigned permission permits it.</p>
          <div className="grid-form" style={{ marginTop: 16 }}>
            <button className="secondary-button" onClick={() => onNavigate('attendance')}>Gate / Front Desk Log</button>
            <button className="secondary-button" onClick={() => onNavigate('reports')}>Daily Front Desk Reports</button>
          </div>
        </div>
      </>}

      {role === 'HeadOfDepartment' && <>
        <div className="summary-grid">
          <div className="summary-card"><span>Student records available</span><strong>{students.length}</strong></div>
          <div className="summary-card"><span>Admissions visibility</span><strong>{admissions.length}</strong></div>
          <div className="summary-card"><span>Academic workspace</span><strong>Enabled</strong></div>
          <div className="summary-card"><span>Write scope</span><strong>Department</strong></div>
        </div>
        <div className="panel" style={{ marginTop: 22, padding: 20 }}>
          <h3>Department Workspace</h3>
          <p style={{ color: '#64748b', marginTop: 6 }}>Departmental actions are intended to be scoped to the authenticated department. Institution-wide administration and unrelated departments remain outside this workspace.</p>
          <div className="grid-form" style={{ marginTop: 16 }}>
            <button className="secondary-button" onClick={() => onNavigate('academics')}>Academic Management</button>
            <button className="secondary-button" onClick={() => onNavigate('staff')}>Department Staff</button>
            <button className="secondary-button" onClick={() => onNavigate('reports')}>Department Reports</button>
          </div>
        </div>
      </>}

      {role === 'Receptionist' ? null : role === 'HeadOfDepartment' ? null : null}

      {role === 'Secretary' && <div className="panel" style={{ marginTop: 22, padding: 20 }}>
        <h3>Recent Admissions</h3>
        <div className="table-wrap" style={{ marginTop: 12 }}><table className="table"><thead><tr><th>Status</th><th>Programme</th><th>Created</th></tr></thead><tbody>
          {admissions.slice(0, 10).map(a => <tr key={a.id}><td>{a.status}</td><td>{a.programmeId}</td><td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-UG') : '—'}</td></tr>)}
        </tbody></table></div>
      </div>}

      {role === 'Receptionist' ? null : role === 'HeadOfDepartment' ? null : null}

      {rd && role === 'Receptionist' ? null : null}
    </>}
  </section>
}
