import { useEffect, useState } from 'react'
import { createInvoice, getInvoices, recordPayment, type Invoice } from '../api/finance'

export function FinanceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentId, setStudentId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')

  async function load() {
    setLoading(true); setError('')
    try { setInvoices(await getInvoices()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load finance records.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function submitInvoice(event: React.FormEvent) {
    event.preventDefault()
    try {
      await createInvoice({ studentId: studentId.trim(), invoiceNumber: invoiceNumber.trim(), amount: Number(amount), currency: 'UGX' })
      setStudentId(''); setInvoiceNumber(''); setAmount(''); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create invoice.') }
  }

  async function submitPayment(event: React.FormEvent) {
    event.preventDefault(); if (!paymentInvoice) return
    try {
      await recordPayment(paymentInvoice.id, { amount: Number(paymentAmount), receiptNumber: receiptNumber.trim(), paymentMethod, currency: paymentInvoice.currency })
      setPaymentInvoice(null); setPaymentAmount(''); setReceiptNumber(''); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to record payment.') }
  }

  return <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Finance Management</p><h2>Fees, invoices & payments</h2></div><button className="secondary-button" onClick={() => void load()}>Refresh</button></div>
    <form className="student-form" onSubmit={submitInvoice}><h3>Create invoice</h3><input aria-label="Student ID" placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} /><input aria-label="Invoice number" placeholder="Invoice number" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} /><input aria-label="Amount" type="number" min="1" step="0.01" placeholder="Amount (UGX)" value={amount} onChange={e => setAmount(e.target.value)} /><button type="submit">Create invoice</button></form>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading finance records…</p> : <div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Student</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead><tbody>{invoices.map(invoice => <tr key={invoice.id}><td>{invoice.invoiceNumber}</td><td>{invoice.studentId}</td><td>{invoice.currency} {invoice.amount.toLocaleString()}</td><td>{invoice.currency} {invoice.paidAmount.toLocaleString()}</td><td>{invoice.currency} {invoice.balance.toLocaleString()}</td><td>{invoice.status}</td><td>{invoice.balance > 0 ? <button className="secondary-button" onClick={() => setPaymentInvoice(invoice)}>Record payment</button> : '—'}</td></tr>)}</tbody></table>{invoices.length === 0 && <p className="empty">No invoices recorded yet.</p>}</div>}
    {paymentInvoice && <div className="modal-backdrop"><form className="auth-card" onSubmit={submitPayment}><p className="eyebrow">Payment</p><h3>{paymentInvoice.invoiceNumber}</h3><p>Outstanding: {paymentInvoice.currency} {paymentInvoice.balance.toLocaleString()}</p><input aria-label="Payment amount" type="number" min="0.01" max={paymentInvoice.balance} step="0.01" placeholder="Amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /><input aria-label="Receipt number" placeholder="Receipt number" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} /><select aria-label="Payment method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Cash</option><option>Bank</option><option>Mobile Money</option><option>Card</option></select><div className="topbar-actions"><button type="button" className="secondary-button" onClick={() => setPaymentInvoice(null)}>Cancel</button><button type="submit">Record payment</button></div></form></div>}
  </section>
}
