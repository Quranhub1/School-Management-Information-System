import { useEffect, useState, type FormEvent } from 'react'
import {
  getPrincipalDashboard,
  getStaffPerformance,
  getDepartmentalSummary,
  type PrincipalDashboard,
  type StaffPerformance,
  type DepartmentalSummary,
} from '../api/principal'

type MainTab = 'overview' | 'academics' | 'staff' | 'departments'

export function PrincipalDashboard() {
  const [mainTab, setMainTab] = useState<MainTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<PrincipalDashboard | null>(null)
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [departments, setDepartments] = useState<DepartmentalSummary[]>([])

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [dash, staff, depts] = await Promise.all([
        getPrincipalDashboard(),
        getStaffPerformance(),
        getDepartmentalSummary(),
      ])
      setDashboard(dash)
      setStaffPerformance(staff)
      setDepartments(depts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load principal dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  function getStatusColor(status: string): string {
    if (status === 'Active' || status === 'Paid' || status === 'Accepted' || status === 'Passed') return '#059669'
    if (status === 'Pending' || status === 'UnderReview' || status === 'Submitted') return '#d97706'
    return '#dc2626'
  }

  return (
    <section className="panel" aria-label="Principal dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PRINCIPAL</span>
          <h2>Institutional Dashboard</h2>
        </div>
        <button className="secondary-button" onClick={() => void loadAll()}>Refresh</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Principal sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={mainTab === 'overview'} className={mainTab === 'overview' ? 'active' : ''} onClick={() => setMainTab('overview')}>Overview</button>
        <button role="tab" aria-selected={mainTab === 'academics'} className={mainTab === 'academics' ? 'active' : ''} onClick={() => setMainTab('academics')}>Academics</button>
        <button role="tab" aria-selected={mainTab === 'staff'} className={mainTab === 'staff' ? 'active' : ''} onClick={() => setMainTab('staff')}>Staff Performance</button>
        <button role="tab" aria-selected={mainTab === 'departments'} className={mainTab === 'departments' ? 'active' : ''} onClick={() => setMainTab('departments')}>Departments</button>
      </div>

      {loading ? (
        <p className="empty">Loading principal dashboard…</p>
      ) : dashboard ? (
        <>
          {mainTab === 'overview' && (
            <>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Total Students</span>
                  <strong>{dashboard.totalStudents}</strong>
                </div>
                <div className="summary-card">
                  <span>Active Students</span>
                  <strong style={{ color: '#059669' }}>{dashboard.activeStudents}</strong>
                </div>
                <div className="summary-card">
                  <span>Total Staff</span>
                  <strong>{dashboard.totalStaff}</strong>
                </div>
                <div className="summary-card">
                  <span>Programmes</span>
                  <strong>{dashboard.totalProgrammes}</strong>
                </div>
                <div className="summary-card">
                  <span>Courses</span>
                  <strong>{dashboard.totalCourses}</strong>
                </div>
                <div className="summary-card">
                  <span>Outstanding Invoices</span>
                  <strong style={{ color: '#dc2626' }}>{dashboard.outstandingInvoices}</strong>
                </div>
                <div className="summary-card">
                  <span>Total Invoiced</span>
                  <strong>UGX {dashboard.totalInvoiced.toLocaleString()}</strong>
                </div>
                <div className="summary-card">
                  <span>Total Collected</span>
                  <strong style={{ color: '#059669' }}>UGX {dashboard.totalPaid.toLocaleString()}</strong>
                </div>
              </div>

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">ADMISSIONS</span>
                    <h3>Admissions Overview</h3>
                  </div>
                </div>
                <div className="summary-grid" style={{ marginBottom: 22 }}>
                  <div className="summary-card">
                    <span>Pending</span>
                    <strong style={{ color: '#d97706' }}>{dashboard.pendingAdmissions}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Accepted</span>
                    <strong style={{ color: '#059669' }}>{dashboard.acceptedAdmissions}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Rejected</span>
                    <strong style={{ color: '#dc2626' }}>{dashboard.rejectedAdmissions}</strong>
                  </div>
                </div>

                <h4 style={{ marginBottom: 10 }}>Recent Admissions</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Programme</th>
                        <th>Academic Year</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentAdmissions.length === 0 ? (
                        <tr><td colSpan={4} className="empty">No recent admissions</td></tr>
                      ) : (
                        dashboard.recentAdmissions.map(admission => (
                          <tr key={admission.id}>
                            <td>
                              <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(admission.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                                {admission.status}
                              </span>
                            </td>
                            <td>{admission.programmeId}</td>
                            <td>{admission.academicYearId}</td>
                            <td>{new Date(admission.createdAt).toLocaleDateString('en-UG')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">FINANCE</span>
                    <h3>Outstanding Balances</h3>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Programme</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.outstandingBalances.length === 0 ? (
                        <tr><td colSpan={3} className="empty">No outstanding balances</td></tr>
                      ) : (
                        dashboard.outstandingBalances.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.studentNumber}</strong> {item.studentName}</td>
                            <td>{item.programmeName}</td>
                            <td style={{ color: '#dc2626', fontWeight: 700 }}>{item.currency} {item.balance.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">FINANCE</span>
                    <h3>Recent Payments</h3>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Receipt No.</th>
                        <th>Student</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentPayments.length === 0 ? (
                        <tr><td colSpan={5} className="empty">No recent payments</td></tr>
                      ) : (
                        dashboard.recentPayments.map(payment => (
                          <tr key={payment.id}>
                            <td><strong>{payment.receiptNumber}</strong></td>
                            <td>{payment.studentName}</td>
                            <td style={{ color: '#059669', fontWeight: 700 }}>UGX {payment.amount.toLocaleString()}</td>
                            <td>{payment.paymentMethod}</td>
                            <td>{new Date(payment.paidAt).toLocaleDateString('en-UG')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {mainTab === 'academics' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">ACADEMICS</span>
                  <h3>Academic Overview</h3>
                </div>
              </div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Total Results</span>
                  <strong>{dashboard.totalResults}</strong>
                </div>
                <div className="summary-card">
                  <span>Passed</span>
                  <strong style={{ color: '#059669' }}>{dashboard.passedResults}</strong>
                </div>
                <div className="summary-card">
                  <span>Failed</span>
                  <strong style={{ color: '#dc2626' }}>{dashboard.failedResults}</strong>
                </div>
                <div className="summary-card">
                  <span>Pass Rate</span>
                  <strong>{dashboard.totalResults > 0 ? Math.round((dashboard.passedResults / dashboard.totalResults) * 100) : 0}%</strong>
                </div>
                <div className="summary-card">
                  <span>Attendance Sessions</span>
                  <strong>{dashboard.attendanceSessions}</strong>
                </div>
                <div className="summary-card">
                  <span>Attendance Records</span>
                  <strong>{dashboard.attendanceRecords}</strong>
                </div>
                <div className="summary-card">
                  <span>Absent</span>
                  <strong style={{ color: '#dc2626' }}>{dashboard.absentRecords}</strong>
                </div>
                <div className="summary-card">
                  <span>Attendance Rate</span>
                  <strong>{dashboard.attendanceRecords > 0 ? Math.round(((dashboard.attendanceRecords - dashboard.absentRecords) / dashboard.attendanceRecords) * 100) : 0}%</strong>
                </div>
              </div>

              <h4 style={{ marginBottom: 10 }}>Recent Results</h4>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentResults.length === 0 ? (
                      <tr><td colSpan={4} className="empty">No results found</td></tr>
                    ) : (
                      dashboard.recentResults.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.studentName}</strong></td>
                          <td>{r.score}</td>
                          <td><strong>{r.grade}</strong></td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: r.passed ? '#059669' : '#dc2626', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {r.passed ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'staff' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">STAFF</span>
                  <h3>Staff Performance Overview</h3>
                </div>
              </div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Pending Payroll</span>
                  <strong style={{ color: '#d97706' }}>{dashboard.pendingPayroll}</strong>
                </div>
                <div className="summary-card">
                  <span>Paid Payroll</span>
                  <strong style={{ color: '#059669' }}>{dashboard.paidPayroll}</strong>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Staff No.</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th>Classes</th>
                      <th>Students</th>
                      <th>Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerformance.length === 0 ? (
                      <tr><td colSpan={8} className="empty">No staff data found</td></tr>
                    ) : (
                      staffPerformance.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.staffNumber}</strong></td>
                          <td>{s.firstName} {s.lastName}</td>
                          <td>{s.department || '—'}</td>
                          <td>{s.position || '—'}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(s.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {s.status}
                            </span>
                          </td>
                          <td>{s.classCount}</td>
                          <td>{s.studentCount}</td>
                          <td>{s.resultCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'departments' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">DEPARTMENTS</span>
                  <h3>Departmental Summary</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Programmes</th>
                      <th>Staff</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.length === 0 ? (
                      <tr><td colSpan={4} className="empty">No departments found</td></tr>
                    ) : (
                      departments.map(d => (
                        <tr key={d.id}>
                          <td><strong>{d.name}</strong></td>
                          <td>{d.programmeCount}</td>
                          <td>{d.staffCount}</td>
                          <td>{d.studentCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="empty">No data available.</p>
      )}
    </section>
  )
}
