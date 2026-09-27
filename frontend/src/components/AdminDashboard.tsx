import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, GraduationCap, ShieldCheck, UsersRound } from 'lucide-react'
import { getSession } from '../api/auth'
import { getUsers } from '../api/administration'
import { getStudents } from '../api/students'
import { listStaff } from '../api/staff'

type Tab = 'overview' | 'users' | 'students' | 'staff' | 'monitoring'

export function AdminDashboard() {
  const session = getSession()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [users, setUsers] = useState<{ total: number; active: number; admins: number }>({ total: 0, active: 0, admins: 0 })
  const [students, setStudents] = useState<{ total: number; active: number }>({ total: 0, active: 0 })
  const [staff, setStaff] = useState<{ total: number; active: number }>({ total: 0, active: 0 })

  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<{ id: string; studentNumber: string; name: string; status: string }[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [staffResults, setStaffResults] = useState<{ id: string; staffNumber: string; name: string; department: string; status: string }[]>([])

  async function loadMetrics() {
    setLoading(true); setError('')
    try {
      const [usersRes, studentsRes, staffRes] = await Promise.all([
        getUsers(),
        getStudents(),
        listStaff(),
      ])
      setUsers({
        total: usersRes.length,
        active: usersRes.filter(u => u.isActive).length,
        admins: usersRes.filter(u => u.roles.includes('SystemAdministrator')).length,
      })
      setStudents({ total: studentsRes.length, active: studentsRes.filter(s => s.status === 'Active').length })
      setStaff({ total: staffRes.length, active: staffRes.filter(s => s.isActive).length })
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load dashboard data.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadMetrics() }, [])

  async function searchStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!studentSearch.trim()) return
    try {
      const all = await getStudents()
      const q = studentSearch.trim().toLowerCase()
      setStudentResults(all.filter(s => s.studentNumber.toLowerCase().includes(q) || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)).slice(0, 20).map(s => ({ id: s.id, studentNumber: s.studentNumber, name: `${s.firstName} ${s.lastName}`.trim(), status: s.status })))
    } catch { setError('Unable to search students.') }
  }

  async function searchStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!staffSearch.trim()) return
    try {
      const all = await listStaff()
      const q = staffSearch.trim().toLowerCase()
      setStaffResults(all.filter(s => s.staffNumber.toLowerCase().includes(q) || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)).slice(0, 20).map(s => ({ id: s.id, staffNumber: s.staffNumber, name: `${s.firstName} ${s.lastName}`.trim(), department: (s as { department?: string }).department || '—', status: s.isActive ? 'Active' : 'Inactive' })))
    } catch { setError('Unable to search staff.') }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'students', label: 'Students' },
    { key: 'staff', label: 'Staff' },
    { key: 'monitoring', label: 'Monitoring' },
  ]

  const statCards = [
    { label: 'Students', value: students.total, detail: `${students.active} active`, icon: GraduationCap, tone: 'blue' },
    { label: 'Staff members', value: staff.total, detail: `${staff.active} active`, icon: UsersRound, tone: 'violet' },
    { label: 'Active users', value: users.active, detail: `${users.total} registered`, icon: ShieldCheck, tone: 'green' },
    { label: 'School operations', value: 'Ready', detail: 'All core systems available', icon: CheckCircle2, tone: 'amber' },
  ] as const

  return (
    <section className="dashboard-screen" aria-label="Administrator dashboard">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">Administrator overview</p>
          <h2>Welcome back, {session?.username ?? 'Admin'}</h2>
          <p>Here is what is happening across your school today.</p>
        </div>
        <div className="dashboard-date"><span>Today</span><strong>{new Date().toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
      </div>

      <div className="dashboard-stat-grid">
        {statCards.map(({ label, value, detail, icon: Icon, tone }) => <div className={`dashboard-stat-card ${tone}`} key={label}>
          <div className="dashboard-stat-icon"><Icon size={20} aria-hidden="true" /></div>
          <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
          <ArrowUpRight className="dashboard-stat-arrow" size={18} aria-hidden="true" />
        </div>)}
      </div>

      <div className="library-workspace-tabs dashboard-tabs" role="tablist" aria-label="Admin sections">
        {tabs.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {tab === 'overview' && (
        <div>
          <div className="dashboard-overview-grid">
            <div className="dashboard-overview-card dashboard-overview-card-wide">
              <div className="dashboard-card-heading"><div><span className="dashboard-card-kicker">School pulse</span><h3>Today at a glance</h3></div><span className="dashboard-live-dot">Live</span></div>
              <div className="dashboard-pulse-list">
                <div><span>Active students</span><strong>{students.active} <small>of {students.total}</small></strong><i><b style={{ width: `${students.total ? Math.min(100, students.active / students.total * 100) : 0}%` }} /></i></div>
                <div><span>Active staff</span><strong>{staff.active} <small>of {staff.total}</small></strong><i><b className="teal" style={{ width: `${staff.total ? Math.min(100, staff.active / staff.total * 100) : 0}%` }} /></i></div>
              </div>
            </div>
            <div className="dashboard-overview-card dashboard-status-card">
              <div className="dashboard-card-heading"><div><span className="dashboard-card-kicker">System health</span><h3>All systems normal</h3></div><CheckCircle2 size={22} aria-hidden="true" /></div>
              <p>Your school workspace is connected and ready for today&apos;s operations.</p>
              <div className="dashboard-status-row"><span><b />Database</span><span>Connected</span></div>
              <div className="dashboard-status-row"><span><b />Student records</span><span>Available</span></div>
            </div>
            <div className="dashboard-overview-card dashboard-actions-card">
              <div className="dashboard-card-heading"><div><span className="dashboard-card-kicker">Workspace</span><h3>Quick actions</h3></div></div>
              <div className="dashboard-action-list">
                <button onClick={() => setTab('students')}><GraduationCap size={17} aria-hidden="true" /><span>Search students</span><ArrowUpRight size={15} aria-hidden="true" /></button>
                <button onClick={() => setTab('staff')}><UsersRound size={17} aria-hidden="true" /><span>Find staff member</span><ArrowUpRight size={15} aria-hidden="true" /></button>
                <button onClick={() => setTab('monitoring')}><ShieldCheck size={17} aria-hidden="true" /><span>Open monitoring</span><ArrowUpRight size={15} aria-hidden="true" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="table-wrap">
          <h3>All Users</h3>
          {loading ? <p className="empty">Loading users…</p> : <p className="empty">{users.total} total users, {users.active} active, {users.admins} administrators</p>}
        </div>
      )}

      {tab === 'students' && (
        <div>
          <form className="student-form" onSubmit={searchStudent} style={{ marginBottom: 22 }}>
            <h3>Student Search</h3>
            <div className="form-row">
              <input aria-label="Student search" placeholder="Search by student number or name..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              <button type="submit">Search</button>
            </div>
          </form>
          {studentResults.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student Number</th><th>Name</th><th>Status</th></tr></thead>
                <tbody>
                  {studentResults.map(s => <tr key={s.id}><td>{s.studentNumber}</td><td>{s.name}</td><td><span className="badge" style={{ background: s.status === 'Active' ? '#d1fae5' : '#fee2e2', color: s.status === 'Active' ? '#065f46' : '#991b1b' }}>{s.status}</span></td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <form className="student-form" onSubmit={searchStaff} style={{ marginBottom: 22 }}>
            <h3>Staff Search</h3>
            <div className="form-row">
              <input aria-label="Staff search" placeholder="Search by staff number or name..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
              <button type="submit">Search</button>
            </div>
          </form>
          {staffResults.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Staff Number</th><th>Name</th><th>Department</th><th>Status</th></tr></thead>
                <tbody>
                  {staffResults.map(s => <tr key={s.id}><td>{s.staffNumber}</td><td>{s.name}</td><td>{s.department}</td><td><span className="badge" style={{ background: s.status === 'Active' ? '#d1fae5' : '#fee2e2', color: s.status === 'Active' ? '#065f46' : '#991b1b' }}>{s.status}</span></td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'monitoring' && (
        <div>
          <div className="summary-grid" style={{ marginBottom: 22 }}>
            <div className="summary-card"><span>System Status</span><strong style={{ color: '#059669' }}>Operational</strong></div>
            <div className="summary-card"><span>Database</span><strong style={{ color: '#059669' }}>Connected</strong></div>
            <div className="summary-card"><span>Active Students</span><strong>{students.active}</strong></div>
            <div className="summary-card"><span>Active Staff</span><strong>{staff.active}</strong></div>
          </div>
          <p className="empty">System monitoring and audit logs are available in the respective modules.</p>
        </div>
      )}
    </section>
  )
}
