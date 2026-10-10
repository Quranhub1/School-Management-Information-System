import { useEffect, useState } from 'react'
import { getSession } from '../api/auth'
import { getUsers } from '../api/administration'
import { getStudents } from '../api/students'
import { listStaff } from '../api/staff'
import { getInvoices } from '../api/finance'
import { listPayroll } from '../api/payroll'
import { InventoryStockSettings } from './InventoryStockSettings'

type Tab = 'overview' | 'users' | 'students' | 'staff' | 'finance' | 'monitoring' | 'stock-settings'
type ChartSegment = { label: string; value: number; color: string; displayValue?: string }

const chartColors = {
  teal: '#0d9488',
  blue: '#3b82f6',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  red: '#ef4444',
  gray: '#cbd5e1',
  green: '#16a34a',
}

const numberFormat = new Intl.NumberFormat('en-UG')
const moneyFormat = (value: number) => `UGX ${numberFormat.format(Math.round(value || 0))}`

function DonutChart({
  title,
  description,
  segments,
  centerValue,
  centerCaption,
}: {
  title: string
  description: string
  segments: ChartSegment[]
  centerValue: string
  centerCaption: string
}) {
  const radius = 39
  const circumference = 2 * Math.PI * radius
  const safeSegments = segments.map(segment => ({ ...segment, value: Math.max(0, Number.isFinite(segment.value) ? segment.value : 0) }))
  const total = safeSegments.reduce((sum, segment) => sum + segment.value, 0)
  let offset = 0

  return (
    <article className="admin-chart-card">
      <div className="admin-chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="admin-chart-body">
        <div className="admin-donut-wrap" role="img" aria-label={`${title}: ${safeSegments.map(s => `${s.label} ${s.value}`).join(', ')}`}>
          <svg className="admin-donut" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="admin-donut-track" cx="50" cy="50" r={radius} />
            {total > 0 ? safeSegments.filter(segment => segment.value > 0).map(segment => {
              const length = (segment.value / total) * circumference
              const dashOffset = offset
              offset += length
              return (
                <circle
                  key={segment.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="12"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-dashOffset}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="butt"
                />
              )
            }) : null}
          </svg>
          <div className="admin-donut-center">
            <strong>{centerValue}</strong>
            <span>{centerCaption}</span>
          </div>
        </div>
        <ul className="admin-chart-legend">
          {safeSegments.map(segment => (
            <li key={segment.label}>
              <span className="admin-legend-label"><i style={{ background: segment.color }} />{segment.label}</span>
              <strong>{segment.displayValue ?? numberFormat.format(segment.value)}</strong>
            </li>
          ))}
          {total === 0 && <li className="admin-chart-empty">No records to display</li>}
        </ul>
      </div>
    </article>
  )
}

export function AdminDashboard() {
  const session = getSession()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [users, setUsers] = useState<{ total: number; active: number; admins: number }>({ total: 0, active: 0, admins: 0 })
  const [students, setStudents] = useState<{ total: number; active: number }>({ total: 0, active: 0 })
  const [staff, setStaff] = useState<{ total: number; active: number }>({ total: 0, active: 0 })
  const [finance, setFinance] = useState<{ totalBilled: number; totalPaid: number; outstanding: number; invoices: number }>({ totalBilled: 0, totalPaid: 0, outstanding: 0, invoices: 0 })
  const [payroll, setPayroll] = useState<{ totalPaid: number; paid: number; pending: number; other: number }>({ totalPaid: 0, paid: 0, pending: 0, other: 0 })

  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<{ id: string; studentNumber: string; name: string; status: string }[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [staffResults, setStaffResults] = useState<{ id: string; staffNumber: string; name: string; department: string; status: string }[]>([])

  async function loadMetrics() {
    setLoading(true)
    setError('')
    try {
      const [usersRes, studentsRes, staffRes, invoicesRes, payrollRes] = await Promise.all([
        getUsers(),
        getStudents(),
        listStaff(),
        getInvoices(),
        listPayroll(),
      ])
      setUsers({
        total: usersRes.length,
        active: usersRes.filter(u => u.isActive).length,
        admins: usersRes.filter(u => u.roles.includes('SystemAdministrator')).length,
      })
      setStudents({ total: studentsRes.length, active: studentsRes.filter(s => s.status === 'Active').length })
      setStaff({ total: staffRes.length, active: staffRes.filter(s => s.isActive).length })
      const totalBilled = invoicesRes.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)
      const totalPaid = invoicesRes.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0)
      const outstanding = invoicesRes.reduce((sum, inv) => sum + (Number.isFinite(Number(inv.balance)) ? Math.max(0, Number(inv.balance)) : Math.max(0, (Number(inv.amount) || 0) - (Number(inv.paidAmount) || 0))), 0)
      setFinance({ totalBilled, totalPaid, outstanding, invoices: invoicesRes.length })
      const payrollRecords = payrollRes as { status?: string; netPay?: number }[]
      const paidRecords = payrollRecords.filter(p => (p.status || '').toLowerCase() === 'paid')
      const pendingRecords = payrollRecords.filter(p => (p.status || '').toLowerCase() === 'pending')
      setPayroll({
        totalPaid: paidRecords.reduce((sum, p) => sum + (Number(p.netPay) || 0), 0),
        paid: paidRecords.length,
        pending: pendingRecords.length,
        other: payrollRecords.length - paidRecords.length - pendingRecords.length,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
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
    { key: 'finance', label: 'Finance' },
    { key: 'monitoring', label: 'Monitoring' },
    { key: 'stock-settings', label: 'Stock Thresholds' },
  ]

  const studentSegments: ChartSegment[] = [
    { label: 'Active', value: students.active, color: chartColors.teal },
    { label: 'Inactive / other', value: Math.max(0, students.total - students.active), color: chartColors.gray },
  ]
  const staffSegments: ChartSegment[] = [
    { label: 'Active', value: staff.active, color: chartColors.green },
    { label: 'Inactive', value: Math.max(0, staff.total - staff.active), color: chartColors.gray },
  ]
  const userSegments: ChartSegment[] = [
    { label: 'Active', value: users.active, color: chartColors.blue },
    { label: 'Inactive', value: Math.max(0, users.total - users.active), color: chartColors.gray },
  ]
  const feeSegments: ChartSegment[] = [
    { label: 'Collected', value: Math.max(0, finance.totalPaid), color: chartColors.teal, displayValue: moneyFormat(finance.totalPaid) },
    { label: 'Outstanding', value: Math.max(0, finance.outstanding), color: chartColors.amber, displayValue: moneyFormat(finance.outstanding) },
  ]
  const payrollSegments: ChartSegment[] = [
    { label: 'Paid', value: payroll.paid, color: chartColors.green },
    { label: 'Pending', value: payroll.pending, color: chartColors.amber },
    { label: 'Other statuses', value: payroll.other, color: chartColors.purple },
  ]

  return (
    <section className="panel admin-dashboard" aria-label="Administrator dashboard">
      <div className="panel-heading admin-dashboard-heading">
        <div>
          <p className="eyebrow">SYSTEM ADMINISTRATION</p>
          <h2>Welcome, {session?.username ?? 'Admin'}</h2>
          <p className="admin-dashboard-subtitle">A live overview of school operations and key records.</p>
        </div>
        <div className="admin-dashboard-heading-actions">
          <span className="admin-dashboard-date">{new Date().toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <button className="admin-refresh-button" type="button" onClick={() => void loadMetrics()} disabled={loading}>
            <span aria-hidden="true">↻</span> {loading ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
      </div>

      <div className="library-workspace-tabs admin-dashboard-tabs" role="tablist" aria-label="Admin sections">
        {tabs.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="error admin-dashboard-error" role="alert"><strong>Dashboard data could not be loaded.</strong><span>{error}</span><button type="button" onClick={() => void loadMetrics()}>Try again</button></div>}

      {tab === 'overview' && (
        <div className="admin-dashboard-content">
          {loading && <p className="admin-dashboard-loading" role="status">Updating school metrics…</p>}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card"><span className="admin-kpi-icon teal">ST</span><div><span>Students</span><strong>{numberFormat.format(students.total)}</strong><small>{numberFormat.format(students.active)} active</small></div></div>
            <div className="admin-kpi-card"><span className="admin-kpi-icon green">SF</span><div><span>Staff members</span><strong>{numberFormat.format(staff.total)}</strong><small>{numberFormat.format(staff.active)} active</small></div></div>
            <div className="admin-kpi-card"><span className="admin-kpi-icon blue">US</span><div><span>System users</span><strong>{numberFormat.format(users.total)}</strong><small>{numberFormat.format(users.active)} active accounts</small></div></div>
            <div className="admin-kpi-card"><span className="admin-kpi-icon amber">UGX</span><div><span>Fees collected</span><strong>{moneyFormat(finance.totalPaid)}</strong><small>{numberFormat.format(finance.invoices)} invoices</small></div></div>
          </div>

          <div className="admin-section-title">
            <div><h3>School at a glance</h3><p>Colour-coded breakdowns of the latest records returned by SMIS.</p></div>
            <span className="admin-data-note"><i /> Based on loaded records</span>
          </div>
          <div className="admin-charts-grid">
            <DonutChart title="Student status" description="Active compared with other statuses" segments={studentSegments} centerValue={numberFormat.format(students.total)} centerCaption="students" />
            <DonutChart title="Staff status" description="Current active staff records" segments={staffSegments} centerValue={numberFormat.format(staff.total)} centerCaption="staff" />
            <DonutChart title="User accounts" description="Active and inactive accounts" segments={userSegments} centerValue={numberFormat.format(users.total)} centerCaption="accounts" />
            <DonutChart title="Fee collection" description="Collected fees compared with outstanding" segments={feeSegments} centerValue={moneyFormat(finance.totalPaid)} centerCaption="collected" />
            <DonutChart title="Payroll records" description="Paid, pending, and other statuses" segments={payrollSegments} centerValue={numberFormat.format(payroll.paid + payroll.pending + payroll.other)} centerCaption="records" />
          </div>

          <div className="admin-dashboard-bottom-grid">
            <div className="admin-dashboard-action-card">
              <div><h3>Quick actions</h3><p>Jump directly to common administrative tasks.</p></div>
              <div className="admin-quick-actions">
                <button type="button" onClick={() => setTab('students')}>Search students <span>→</span></button>
                <button type="button" onClick={() => setTab('staff')}>Search staff <span>→</span></button>
                <button type="button" onClick={() => setTab('finance')}>Review finance <span>→</span></button>
                <button type="button" onClick={() => setTab('monitoring')}>System monitoring <span>→</span></button>
              </div>
            </div>
            <div className="admin-dashboard-action-card admin-attention-card">
              <div><h3>Needs attention</h3><p>Items that may need a follow-up.</p></div>
              <div className="admin-attention-list">
                <div><span className="admin-attention-dot amber" /><span>Outstanding fees</span><strong>{moneyFormat(finance.outstanding)}</strong></div>
                <div><span className="admin-attention-dot purple" /><span>Pending payroll</span><strong>{numberFormat.format(payroll.pending)}</strong></div>
                <div><span className="admin-attention-dot gray" /><span>Inactive user accounts</span><strong>{numberFormat.format(Math.max(0, users.total - users.active))}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="table-wrap admin-tab-content">
          <h3>All Users</h3>
          {loading ? <p className="empty">Loading users…</p> : <p className="empty">{users.total} total users, {users.active} active, {users.admins} system administrators</p>}
        </div>
      )}

      {tab === 'students' && (
        <div className="admin-tab-content">
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
          {!studentResults.length && <p className="admin-search-hint">Search by student number, first name, or last name.</p>}
        </div>
      )}

      {tab === 'staff' && (
        <div className="admin-tab-content">
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
          {!staffResults.length && <p className="admin-search-hint">Search by staff number, first name, or last name.</p>}
        </div>
      )}

      {tab === 'finance' && (
        <div className="admin-tab-content">
          <div className="admin-kpi-grid admin-finance-kpis">
            <div className="admin-kpi-card"><span className="admin-kpi-icon blue">BL</span><div><span>Total billed</span><strong>{moneyFormat(finance.totalBilled)}</strong></div></div>
            <div className="admin-kpi-card"><span className="admin-kpi-icon teal">PD</span><div><span>Total paid</span><strong>{moneyFormat(finance.totalPaid)}</strong></div></div>
            <div className="admin-kpi-card"><span className="admin-kpi-icon amber">OS</span><div><span>Outstanding</span><strong>{moneyFormat(finance.outstanding)}</strong></div></div>
            <div className="admin-kpi-card"><span className="admin-kpi-icon purple">IN</span><div><span>Invoices</span><strong>{numberFormat.format(finance.invoices)}</strong></div></div>
          </div>
          <DonutChart title="Fee collection overview" description="Based on invoice totals loaded from the finance API" segments={feeSegments} centerValue={moneyFormat(finance.totalPaid)} centerCaption="collected" />
          <p className="admin-dashboard-footnote">For payment-level detail, receipts, and reconciliation, use the Finance module.</p>
        </div>
      )}

      {tab === 'stock-settings' && <InventoryStockSettings />}

      {tab === 'monitoring' && (
        <div className="admin-tab-content">
          <div className="admin-kpi-grid admin-monitoring-kpis">
            <div className="admin-kpi-card"><span className="admin-kpi-icon green">PR</span><div><span>Payroll paid</span><strong>{moneyFormat(payroll.totalPaid)}</strong><small>{numberFormat.format(payroll.paid)} paid records</small></div></div>
            <div className="admin-kpi-card"><span className="admin-kpi-icon amber">PN</span><div><span>Payroll pending</span><strong>{numberFormat.format(payroll.pending)}</strong><small>Records awaiting payment</small></div></div>
          </div>
          <div className="admin-monitoring-notice"><strong>Health checks are not connected to this dashboard yet.</strong><span>Service and database availability are intentionally not labelled as operational until backed by a real health-check endpoint.</span></div>
          <p className="admin-dashboard-footnote">Audit logs, backups, and detailed service checks remain in their existing administration modules.</p>
        </div>
      )}
    </section>
  )
}
