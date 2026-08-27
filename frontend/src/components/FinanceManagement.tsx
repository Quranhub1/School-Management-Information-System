import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createInvoice, getInvoices, recordPayment, type Invoice } from '../api/finance'

type PaymentTab = 'new' | 'history' | 'receipts'

const STATUS_COLORS: Record<string, string> = {
  Paid: '#059669',
  Pending: '#d97706',
  Overdue: '#dc2626',
  Partial: '#2563eb',
  Draft: '#78716c',
}

export function FinanceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [tab, setTab] = useState<PaymentTab>('new')

  const [studentId, setStudentId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getInvoices(selectedStudent || undefined)
      setInvoices(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load finance records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedStudent) {
      void load()
    }
  }, [selectedStudent])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    setSelectedStudent(searchQuery.trim())
  }

  function clearSearch() {
    setSearchQuery('')
    setSelectedStudent(null)
    setInvoices([])
  }

  async function submitInvoice(event: FormEvent) {
    event.preventDefault()
    try {
      await createInvoice({ studentId: studentId.trim(), invoiceNumber: invoiceNumber.trim(), feeType: 'Tuition', amount: Number(amount), currency: 'UGX' })
      setStudentId('')
      setInvoiceNumber('')
      setAmount('')
      setTab('history')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create invoice.')
    }
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault()
    if (!paymentInvoice) return
    try {
      await recordPayment(paymentInvoice.id, { amount: Number(paymentAmount), receiptNumber: receiptNumber.trim(), paymentMethod, currency: paymentInvoice.currency })
      setPaymentInvoice(null)
      setPaymentAmount('')
      setReceiptNumber('')
      setTab('history')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to record payment.')
    }
  }

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0)

  return (
    <section className="panel" aria-label="Finance management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FINANCE</span>
          <h2>Fees, Invoices & Payments</h2>
        </div>
        <button className="secondary-button" onClick={() => void load()}>Refresh</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <form className="student-form" onSubmit={handleSearch} style={{ marginBottom: 22 }}>
        <h3>Student Lookup</h3>
        <div className="form-row">
          <input aria-label="Student ID or code" placeholder="Enter student ID or code" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <button type="submit">Search</button>
          {selectedStudent && <button type="button" className="secondary-button" onClick={clearSearch}>Clear</button>}
        </div>
      </form>

      {selectedStudent && (
        <>
          <div className="summary-grid" style={{ marginBottom: 22 }}>
            <div className="summary-card">
              <span>Total Billed</span>
              <strong>UGX {totalBilled.toLocaleString()}</strong>
            </div>
            <div className="summary-card">
              <span>Total Paid</span>
              <strong style={{ color: '#059669' }}>UGX {totalPaid.toLocaleString()}</strong>
            </div>
            <div className="summary-card">
              <span>Outstanding Balance</span>
              <strong style={{ color: totalBalance > 0 ? '#dc2626' : '#059669' }}>UGX {totalBalance.toLocaleString()}</strong>
            </div>
            <div className="summary-card">
              <span>Invoices</span>
              <strong>{invoices.length}</strong>
            </div>
          </div>

          <div className="library-workspace-tabs" role="tablist" aria-label="Finance sections" style={{ marginBottom: 18 }}>
            <button role="tab" aria-selected={tab === 'new'} className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>New Invoice</button>
            <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Payment History</button>
            <button role="tab" aria-selected={tab === 'receipts'} className={tab === 'receipts' ? 'active' : ''} onClick={() => setTab('receipts')}>Receipts</button>
          </div>

          {tab === 'new' && (
            <form className="student-form" onSubmit={submitInvoice}>
              <h3>Create Invoice</h3>
              <div className="form-row">
                <label>Student ID<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student ID" required /></label>
                <label>Invoice Number<input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-001" required /></label>
                <label>Amount (UGX)<input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required /></label>
              </div>
              <button type="submit">Create Invoice</button>
            </form>
          )}

          {tab === 'history' && (
            <div className="table-wrap">
              {loading ? (
                <p className="empty">Loading payment history…</p>
              ) : invoices.length === 0 ? (
                <p className="empty">No invoices found for this student.</p>
              ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Fee Type</th>
                        <th>Invoice</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(invoice => (
                        <tr key={invoice.id}>
                          <td><strong>{invoice.feeType}</strong></td>
                          <td><strong>{invoice.invoiceNumber}</strong></td>
                          <td>{invoice.currency} {invoice.amount.toLocaleString()}</td>
                          <td style={{ color: '#059669' }}>{invoice.currency} {invoice.paidAmount.toLocaleString()}</td>
                          <td style={{ color: invoice.balance > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                            {invoice.currency} {invoice.balance.toLocaleString()}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: STATUS_COLORS[invoice.status] ?? '#78716c',
                              color: 'white',
                              fontSize: '.72rem',
                              fontWeight: 800,
                            }}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>{new Date(invoice.issuedAt).toLocaleDateString('en-UG')}</td>
                          <td>
                            {invoice.balance > 0 && (
                              <button className="secondary-button" onClick={() => setPaymentInvoice(invoice)}>
                                Record Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              )}
            </div>
          )}

          {tab === 'receipts' && (
            <div className="table-wrap">
              {loading ? (
                <p className="empty">Loading receipts…</p>
              ) : invoices.filter(inv => inv.paidAmount > 0).length === 0 ? (
                <p className="empty">No receipts found for this student.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Amount Paid</th>
                      <th>Currency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.filter(inv => inv.paidAmount > 0).map(invoice => (
                      <tr key={invoice.id}>
                        <td><strong>{invoice.invoiceNumber}</strong></td>
                        <td style={{ color: '#059669' }}>{invoice.currency} {invoice.paidAmount.toLocaleString()}</td>
                        <td>{invoice.currency}</td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: STATUS_COLORS[invoice.status] ?? '#78716c',
                            color: 'white',
                            fontSize: '.72rem',
                            fontWeight: 800,
                          }}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {!selectedStudent && (
        <div className="empty">
          <p>Search for a student by ID or code to view their fee balance, invoices, and payment history.</p>
        </div>
      )}

      {paymentInvoice && (
        <div className="modal-backdrop">
          <form className="auth-card" onSubmit={submitPayment}>
            <p className="eyebrow">Payment</p>
            <h3>{paymentInvoice.invoiceNumber}</h3>
            <p>Outstanding: {paymentInvoice.currency} {paymentInvoice.balance.toLocaleString()}</p>
            <input aria-label="Payment amount" type="number" min="0.01" max={paymentInvoice.balance} step="0.01" placeholder="Amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
            <input aria-label="Receipt number" placeholder="Receipt number" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} required />
            <select aria-label="Payment method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option>Cash</option>
              <option>Bank</option>
              <option>Mobile Money</option>
              <option>Card</option>
            </select>
            <div className="topbar-actions">
              <button type="button" className="secondary-button" onClick={() => setPaymentInvoice(null)}>Cancel</button>
              <button type="submit">Record Payment</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
