import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  getDashboard,
  getOutstandingBalances,
  getInvoices,
  getPayments,
  recordPayment,
  type FinanceDashboard,
  type Invoice,
  type OutstandingBalance,
} from '../api/finance'

type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank' | 'Card'

interface QuickPayState {
  studentId: string
  invoices: Invoice[]
  studentName: string
}

interface PaymentModalState {
  invoiceId: string
  amount: string
  receiptNumber: string
  paymentMethod: PaymentMethod
}

type PaymentRecord = {
  id: string
  receiptNumber: string
  amount: number
  paymentMethod: string
  paidAt: string
}

export function FinanceDashboard() {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null)
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalance[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [quickPaySearch, setQuickPaySearch] = useState('')
  const [quickPayResult, setQuickPayResult] = useState<QuickPayState | null>(null)
  const [quickPayLoading, setQuickPayLoading] = useState(false)

  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null)
  const [paying, setPaying] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [dash, outstanding, recentPayments] = await Promise.all([
        getDashboard(),
        getOutstandingBalances(),
        getPayments(),
      ])
      setDashboard(dash)
      setOutstandingBalances(outstanding)
      setPayments(recentPayments)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load finance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  async function handleQuickPaySearch(e: FormEvent) {
    e.preventDefault()
    setQuickPayLoading(true)
    setError('')
    try {
      const studentId = quickPaySearch.trim()
      if (!studentId) return
      const invoices = await getInvoices(studentId)
      const student = outstandingBalances.find(o => o.studentId === studentId)
      setQuickPayResult({
        studentId,
        invoices,
        studentName: student?.studentName || studentId,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to search student.')
    } finally {
      setQuickPayLoading(false)
    }
  }

  function openPaymentModal() {
    if (!quickPayResult || quickPayResult.invoices.length === 0) return
    const firstOutstanding = quickPayResult.invoices.find(inv => inv.balance > 0)
    setPaymentModal({
      invoiceId: firstOutstanding ? firstOutstanding.id : quickPayResult.invoices[0].id,
      amount: '',
      receiptNumber: '',
      paymentMethod: 'Cash',
    })
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault()
    if (!paymentModal) return
    setPaying(true)
    try {
      await recordPayment(paymentModal.invoiceId, {
        amount: Number(paymentModal.amount),
        receiptNumber: paymentModal.receiptNumber.trim(),
        paymentMethod: paymentModal.paymentMethod,
        currency: 'UGX',
      })
      setPaymentModal(null)
      setQuickPayResult(null)
      setQuickPaySearch('')
      void loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to record payment.')
    } finally {
      setPaying(false)
    }
  }

  function exportOutstandingCSV() {
    const headers = ['Student Number', 'Name', 'Programme', 'Balance (UGX)', 'Status']
    const rows = outstandingBalances.map(o => [
      o.studentNumber,
      o.studentName,
      o.programmeName,
      o.balance.toLocaleString(),
      o.status,
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'outstanding_balances.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const paymentMethodTotals = payments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount
    return acc
  }, {})

  const recentPayments = payments.slice(0, 10)

  return (
    <section className="panel" aria-label="Finance dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FINANCE</span>
          <h2>Finance Dashboard</h2>
        </div>
        <button className="secondary-button" onClick={() => void loadAll()}>Refresh</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {loading ? (
        <p className="empty">Loading dashboard…</p>
      ) : dashboard && (
        <>
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

          <div className="panel" style={{ marginTop: 24 }}>
            <div className="panel-heading">
              <h3>Quick Pay</h3>
            </div>
            <form onSubmit={handleQuickPaySearch}>
              <div className="form-row">
                <input
                  aria-label="Student ID or code"
                  placeholder="Enter student ID or code"
                  value={quickPaySearch}
                  onChange={e => setQuickPaySearch(e.target.value)}
                />
                <button type="submit" disabled={quickPayLoading}>
                  {quickPayLoading ? 'Searching…' : 'Search'}
                </button>
              </div>
            </form>

            {quickPayResult && (
              <div className="summary-grid" style={{ marginTop: 16 }}>
                <div className="summary-card">
                  <span>Student</span>
                  <strong>{quickPayResult.studentName}</strong>
                </div>
                <div className="summary-card">
                  <span>Current Balance</span>
                  <strong style={{ color: quickPayResult.invoices.reduce((sum, inv) => sum + inv.balance, 0) > 0 ? '#dc2626' : '#059669' }}>
                    UGX {quickPayResult.invoices.reduce((sum, inv) => sum + inv.balance, 0).toLocaleString()}
                  </strong>
                </div>
                <div className="summary-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button type="button" onClick={openPaymentModal} disabled={quickPayResult.invoices.length === 0}>
                    Pay Now
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="panel" style={{ marginTop: 24 }}>
            <div className="panel-heading">
              <h3>Outstanding Balances</h3>
              <button className="secondary-button" onClick={exportOutstandingCSV}>Export to CSV</button>
            </div>
            <div className="table-wrap">
              {outstandingBalances.length === 0 ? (
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
                    {outstandingBalances.map((item, index) => (
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
            </div>
            <div className="table-wrap">
              {recentPayments.length === 0 ? (
                <p className="empty">No payments recorded.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map(payment => (
                      <tr key={payment.id}>
                        <td>{payment.receiptNumber}</td>
                        <td style={{ color: '#059669' }}>UGX {payment.amount.toLocaleString()}</td>
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
              <h3>Payment by Method</h3>
            </div>
            <div className="summary-grid">
              {(Object.keys(paymentMethodTotals) as PaymentMethod[]).map(method => (
                <div className="summary-card" key={method}>
                  <span>{method}</span>
                  <strong>UGX {(paymentMethodTotals[method] || 0).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {paymentModal && quickPayResult && (
        <div className="modal-backdrop">
          <form className="auth-card" onSubmit={submitPayment}>
            <p className="eyebrow">Payment</p>
            <h3>Record Payment - {quickPayResult.studentName}</h3>
            {quickPayResult.invoices.length > 1 && (
              <label>
                Invoice
                <select
                  aria-label="Select invoice"
                  value={paymentModal.invoiceId}
                  onChange={e => setPaymentModal(prev => prev ? { ...prev, invoiceId: e.target.value } : null)}
                >
                  {quickPayResult.invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} (Balance: {inv.currency} {inv.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <input
              aria-label="Payment amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={paymentModal.amount}
              onChange={e => setPaymentModal(prev => prev ? { ...prev, amount: e.target.value } : null)}
              required
            />
            <input
              aria-label="Receipt number"
              placeholder="Receipt number"
              value={paymentModal.receiptNumber}
              onChange={e => setPaymentModal(prev => prev ? { ...prev, receiptNumber: e.target.value } : null)}
              required
            />
            <select
              aria-label="Payment method"
              value={paymentModal.paymentMethod}
              onChange={e => setPaymentModal(prev => prev ? { ...prev, paymentMethod: e.target.value as PaymentMethod } : null)}
            >
              <option>Cash</option>
              <option>Bank</option>
              <option>Mobile Money</option>
              <option>Card</option>
            </select>
            <div className="topbar-actions">
              <button type="button" className="secondary-button" onClick={() => setPaymentModal(null)}>Cancel</button>
              <button type="submit" disabled={paying}>
                {paying ? 'Processing…' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
