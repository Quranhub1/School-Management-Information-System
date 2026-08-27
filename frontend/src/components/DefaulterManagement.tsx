import { useEffect, useState } from 'react'
import {
  getDefaulterOverview,
  getDefaulters,
  getStudentDefaulterDetails,
  getFollowUpActions,
  type DefaulterOverview,
  type Defaulter,
  type DefaulterDetail,
  type FollowUpAction,
} from '../api/defaulters'

type Tab = 'overview' | 'list' | 'actions'

export function DefaulterManagement() {
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<DefaulterOverview | null>(null)
  const [defaulters, setDefaulters] = useState<Defaulter[]>([])
  const [actions, setActions] = useState<FollowUpAction[]>([])
  const [selectedStudent, setSelectedStudent] = useState<DefaulterDetail | null>(null)
  const [filterSeverity, setFilterSeverity] = useState('')

  async function loadOverview() {
    setLoading(true)
    setError('')
    try {
      const data = await getDefaulterOverview()
      setOverview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load defaulter overview.')
    } finally {
      setLoading(false)
    }
  }

  async function loadDefaulters() {
    setLoading(true)
    setError('')
    try {
      const data = await getDefaulters(filterSeverity || undefined)
      setDefaulters(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load defaulters list.')
    } finally {
      setLoading(false)
    }
  }

  async function loadActions() {
    setLoading(true)
    setError('')
    try {
      const data = await getFollowUpActions()
      setActions(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load follow-up actions.')
    } finally {
      setLoading(false)
    }
  }

  async function viewStudent(studentId: string) {
    setLoading(true)
    setError('')
    try {
      const data = await getStudentDefaulterDetails(studentId)
      setSelectedStudent(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load student details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'overview') void loadOverview()
    else if (tab === 'list') void loadDefaulters()
    else if (tab === 'actions') void loadActions()
  }, [tab, filterSeverity])

  function getSeverityColor(severity: string): string {
    if (severity === 'Critical') return '#dc2626'
    if (severity === 'Warning') return '#d97706'
    return '#2563eb'
  }

  return (
    <section className="panel" aria-label="Defaulter management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FINANCE</span>
          <h2>Fee Defaulters Management</h2>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Defaulter sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
        <button role="tab" aria-selected={tab === 'list'} className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>Defaulters List</button>
        <button role="tab" aria-selected={tab === 'actions'} className={tab === 'actions' ? 'active' : ''} onClick={() => setTab('actions')}>Follow-up Actions</button>
      </div>

      {loading ? (
        <p className="empty">Loading...</p>
      ) : tab === 'overview' && overview ? (
        <div className="summary-grid" style={{ marginBottom: 22 }}>
          <div className="summary-card">
            <span>Total Outstanding</span>
            <strong style={{ color: '#dc2626' }}>UGX {overview.totalOutstanding.toLocaleString()}</strong>
          </div>
          <div className="summary-card">
            <span>Total Defaulters</span>
            <strong>{overview.totalDefaulters}</strong>
          </div>
          <div className="summary-card">
            <span>Critical (60+ days)</span>
            <strong style={{ color: '#dc2626' }}>{overview.criticalCount}</strong>
          </div>
          <div className="summary-card">
            <span>Warning (30-60 days)</span>
            <strong style={{ color: '#d97706' }}>{overview.warningCount}</strong>
          </div>
        </div>
      ) : tab === 'list' ? (
        <>
          <div className="form-row" style={{ marginBottom: 18 }}>
            <label>
              Filter by Severity
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                <option value="">All</option>
                <option value="Critical">Critical</option>
                <option value="Warning">Warning</option>
                <option value="Recent">Recent</option>
              </select>
            </label>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Balance</th>
                  <th>Severity</th>
                  <th>Invoices</th>
                  <th>Oldest Invoice</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.length === 0 ? (
                  <tr><td colSpan={6} className="empty">No defaulters found</td></tr>
                ) : (
                  defaulters.map(d => (
                    <tr key={d.studentId}>
                      <td><strong>{d.studentNumber}</strong> {d.studentName}</td>
                      <td style={{ color: '#dc2626', fontWeight: 700 }}>{d.currency} {d.totalBalance.toLocaleString()}</td>
                      <td>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getSeverityColor(d.severity), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                          {d.severity}
                        </span>
                      </td>
                      <td>{d.invoiceCount}</td>
                      <td>{new Date(d.oldestInvoice).toLocaleDateString('en-UG')}</td>
                      <td>
                        <button className="secondary-button" onClick={() => viewStudent(d.studentId)}>View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === 'actions' ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Balance</th>
                <th>Severity</th>
                <th>Suggested Actions</th>
              </tr>
            </thead>
            <tbody>
              {actions.length === 0 ? (
                <tr><td colSpan={4} className="empty">No follow-up actions required</td></tr>
              ) : (
                actions.map(a => (
                  <tr key={a.studentId}>
                    <td><strong>{a.studentName}</strong></td>
                    <td style={{ color: '#dc2626', fontWeight: 700 }}>UGX {a.totalBalance.toLocaleString()}</td>
                    <td>
                      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getSeverityColor(a.severity), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                        {a.severity}
                      </span>
                    </td>
                    <td>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {a.suggestedActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedStudent && (
        <div className="panel" style={{ padding: 22, marginTop: 22 }} aria-label="Student defaulter details">
          <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
            <div>
              <span className="eyebrow">STUDENT DETAILS</span>
              <h3>{selectedStudent.studentName} ({selectedStudent.studentNumber})</h3>
            </div>
            <button className="secondary-button" onClick={() => setSelectedStudent(null)}>Close</button>
          </div>
          <div className="summary-grid" style={{ marginBottom: 22 }}>
            <div className="summary-card">
              <span>Total Balance</span>
              <strong style={{ color: '#dc2626' }}>UGX {selectedStudent.totalBalance.toLocaleString()}</strong>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {selectedStudent.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoiceNumber}</strong></td>
                    <td>{inv.feeType}</td>
                    <td>{inv.currency} {inv.amount.toLocaleString()}</td>
                    <td>{inv.currency} {inv.paidAmount.toLocaleString()}</td>
                    <td style={{ color: '#dc2626', fontWeight: 700 }}>{inv.currency} {inv.balance.toLocaleString()}</td>
                    <td>{inv.status}</td>
                    <td>{new Date(inv.issuedAt).toLocaleDateString('en-UG')}</td>
                    <td style={{ color: inv.daysOverdue > 60 ? '#dc2626' : inv.daysOverdue > 30 ? '#d97706' : 'inherit', fontWeight: inv.daysOverdue > 30 ? 700 : 400 }}>
                      {inv.daysOverdue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
