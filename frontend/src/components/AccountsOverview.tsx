import { useEffect, useState, type FormEvent } from 'react'
import { getAccountsOverviewDashboard, getAccountsOverviewOutstanding, getAccountsOverviewPayments, getAccountsOverviewPayroll, type AccountsOverviewDashboard, type AccountsOverviewOutstanding, type AccountsOverviewPayment, type AccountsOverviewPayroll } from '../api/finance'

export function AccountsOverview() {
  const [dashboard, setDashboard] = useState<AccountsOverviewDashboard | null>(null)
  const [outstanding, setOutstanding] = useState<AccountsOverviewOutstanding[]>([])
  const [payments, setPayments] = useState<AccountsOverviewPayment[]>([])
  const [payroll, setPayroll] = useState<AccountsOverviewPayroll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [paymentsFilterMethod, setPaymentsFilterMethod] = useState('')
  const [paymentsFrom, setPaymentsFrom] = useState('')
  const [paymentsTo, setPaymentsTo] = useState('')

  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear())

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [dash, outstandingData, paymentsData, payrollData] = await Promise.all([
        getAccountsOverviewDashboard(),
        getAccountsOverviewOutstanding(),
        getAccountsOverviewPayments(),
        getAccountsOverviewPayroll(payrollMonth, payrollYear),
      ])
      setDashboard(dash)
      setOutstanding(outstandingData)
      setPayments(paymentsData)
      setPayroll(payrollData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load accounts overview.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  useEffect(() => {
    if (!loading) {
      void getAccountsOverviewPayroll(payrollMonth, payrollYear)
        .then(setPayroll)
        .catch(() => {})
    }
  }, [payrollMonth, payrollYear])

  function handlePaymentsFilter(e: FormEvent) {
    e.preventDefault()
    void loadAll()
  }

  function exportCSV(filename: string, headers: string[], rows: string[][] | number[][]) {
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportOutstandingCSV() {
    const headers = ['Student Number', 'Name', 'Programme', 'Balance', 'Status']
    const rows = outstanding.map(o => [o.studentNumber, o.studentName, o.programmeName, o.balance.toLocaleString(), o.status])
    exportCSV('outstanding_balances.csv', headers, rows)
  }

  function exportPaymentsCSV() {
    const headers = ['Receipt No.', 'Student Name', 'Invoice', 'Amount', 'Payment Method', 'Date']
    const rows = payments.map(p => [p.receiptNumber, p.studentName, p.invoiceNumber, p.amount.toLocaleString(), p.paymentMethod, p.paidAt])
    exportCSV('recent_payments.csv', headers, rows)
  }

  function exportPayrollCSV() {
    const headers = ['Staff Name', 'Staff No.', 'Basic Salary', 'Allowances', 'Deductions', 'Net Pay', 'Status', 'Payment Method']
    const rows = payroll.map(r => [r.staffName, r.staffNumber, r.basicSalary.toFixed(2), r.allowances.toFixed(2), r.deductions.toFixed(2), r.netPay.toFixed(2), r.status, r.paymentMethod ?? ''])
    exportCSV('staff_payroll.csv', headers, rows)
  }

  return (
    <section className="panel" aria-label="Accounts overview">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ACCOUNTS</span>
          <h2>Accounts Overview</h2>
        </div>
        <div className="topbar-actions">
          <span className="secondary-button" style={{ background: '#f59e0b', color: '#fff', cursor: 'default' }}>READ ONLY</span>
          <button className="secondary-button" onClick={() => void loadAll()}>Refresh</button>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {loading ? (
        <p className="empty">Loading accounts overview…</p>
      ) : (
        <>
          {dashboard && (
            <div className="summary-grid">
              <div className="summary-card">
                <span>Total Billed</span>
                <strong>UGX {dashboard.totalBilled.toLocaleString()}</strong>
              </div>
              <div className="summary-card">
                <span>Total Paid</span>
                <strong style={{ color: '#059669' }}>UGX {dashboard.totalPaid.toLocaleString()}</strong>
              </div>
              <div className="summary-card">
                <span>Outstanding Balance</span>
                <strong style={{ color: dashboard.totalOutstanding > 0 ? '#dc2626' : '#059669' }}>
                  UGX {dashboard.totalOutstanding.toLocaleString()}
                </strong>
              </div>
              <div className="summary-card">
                <span>Today's Collection</span>
                <strong>UGX {dashboard.todayCollection.toLocaleString()}</strong>
              </div>
              <div className="summary-card">
                <span>Invoice Count</span>
                <strong>{dashboard.invoiceCount}</strong>
              </div>
              <div className="summary-card">
                <span>Payment Count</span>
                <strong>{dashboard.paymentCount}</strong>
              </div>
              <div className="summary-card">
                <span>Outstanding Invoices Count</span>
                <strong>{dashboard.outstandingCount}</strong>
              </div>
            </div>
          )}

          <div className="panel" style={{ marginTop: 24 }}>
            <div className="panel-heading">
              <h3>Outstanding Balances</h3>
              <button className="secondary-button" onClick={exportOutstandingCSV}>Export to CSV</button>
            </div>
            <div className="table-wrap">
              {outstanding.length === 0 ? (
                <p className="empty">No outstanding balances.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Student Number</th>
                      <th>Name</th>
                      <th>Programme</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstanding.map((item, index) => (
                      <tr key={`${item.studentId}-${index}`}>
                        <td>{item.studentNumber}</td>
                        <td>{item.studentName}</td>
                        <td>{item.programmeName}</td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>
                          {item.currency} {item.balance.toLocaleString()}
                        </td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 24 }}>
            <div className="panel-heading">
              <h3>Recent Payments</h3>
              <button className="secondary-button" onClick={exportPaymentsCSV}>Export to CSV</button>
            </div>
            <form onSubmit={handlePaymentsFilter} style={{ marginBottom: 16 }}>
              <div className="form-row">
                <input
                  type="date"
                  aria-label="From date"
                  value={paymentsFrom}
                  onChange={e => setPaymentsFrom(e.target.value)}
                />
                <input
                  type="date"
                  aria-label="To date"
                  value={paymentsTo}
                  onChange={e => setPaymentsTo(e.target.value)}
                />
                <select
                  aria-label="Payment method"
                  value={paymentsFilterMethod}
                  onChange={e => setPaymentsFilterMethod(e.target.value)}
                >
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Card">Card</option>
                </select>
                <button type="submit">Apply Filters</button>
              </div>
            </form>
            <div className="table-wrap">
              {payments.length === 0 ? (
                <p className="empty">No payments recorded.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Receipt No.</th>
                      <th>Student Name</th>
                      <th>Invoice</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{payment.receiptNumber}</td>
                        <td>{payment.studentName}</td>
                        <td>{payment.invoiceNumber}</td>
                        <td style={{ color: '#059669', fontWeight: 700 }}>UGX {payment.amount.toLocaleString()}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>{new Date(payment.paidAt).toLocaleDateString('en-UG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 24 }}>
            <div className="panel-heading">
              <h3>Staff Payroll Summary</h3>
              <button className="secondary-button" onClick={exportPayrollCSV}>Export to CSV</button>
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <select aria-label="Month" value={payrollMonth} onChange={e => setPayrollMonth(Number(e.target.value))}>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <input
                type="number"
                aria-label="Year"
                value={payrollYear}
                onChange={e => setPayrollYear(Number(e.target.value))}
                min="2000"
                max="2100"
              />
            </div>
            <div className="table-wrap">
              {payroll.length === 0 ? (
                <p className="empty">No payroll records found.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Staff No.</th>
                      <th>Basic Salary</th>
                      <th>Allowances</th>
                      <th>Deductions</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                      <th>Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.map(record => (
                      <tr key={record.id}>
                        <td>{record.staffName}</td>
                        <td>{record.staffNumber}</td>
                        <td>{record.basicSalary.toFixed(2)}</td>
                        <td>{record.allowances.toFixed(2)}</td>
                        <td>{record.deductions.toFixed(2)}</td>
                        <td style={{ fontWeight: 700 }}>{record.netPay.toFixed(2)}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            background: record.status === 'Paid' ? '#dcfce7' : record.status === 'Approved' ? '#dbeafe' : '#ffedd5',
                            color: record.status === 'Paid' ? '#166534' : record.status === 'Approved' ? '#1e40af' : '#9a3412',
                          }}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.paymentMethod ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
