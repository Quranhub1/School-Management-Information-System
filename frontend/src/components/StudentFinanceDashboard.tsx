import { useEffect, useMemo, useState } from 'react'
import { getInvoices, getPayments, getStudentFinanceProfile, recordPayment, type Invoice, type StudentFinanceProfile } from '../api/finance'
import { formatCurrency, SYSTEM_CURRENCY } from '../lib/currency'

type Props = { initialSearch?: string }
const money = (n: number) => formatCurrency(n, SYSTEM_CURRENCY)
const statusFor = (balance: number, billed: number, paid: number) => {
  if (balance < 0) return { label: '+ Credit Balance', color: '#3B82F6', bg: '#EFF6FF', progress: 100 }
  if (balance === 0 && billed > 0) return { label: '✓ Fully Paid', color: '#10B981', bg: '#ECFDF5', progress: 100 }
  const progress = billed > 0 ? Math.min(100, Math.max(0, paid / billed * 100)) : 0
  if (progress < 40) return { label: '! Critical Balance', color: '#EF4444', bg: '#FEF2F2', progress }
  return { label: '● Partial', color: '#F59E0B', bg: '#FFFBEB', progress }
}

export function StudentFinanceDashboard({ initialSearch = '' }: Props) {
  const [query, setQuery] = useState(initialSearch)
  const [profile, setProfile] = useState<StudentFinanceProfile | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [reference, setReference] = useState('')

  async function loadStudent(value = query) {
    if (!value.trim()) return
    setLoading(true); setError('')
    try {
      const p = await getStudentFinanceProfile(value.trim())
      const [inv, pay] = await Promise.all([getInvoices(p.id), getPayments(p.id)])
      setProfile(p); setInvoices(inv); setPayments(pay)
    } catch (e) {
      setProfile(null); setInvoices([]); setPayments([])
      setError(e instanceof Error ? e.message : 'Unable to load student finance account.')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (initialSearch.trim()) void loadStudent(initialSearch) }, [initialSearch])

  const summary = useMemo(() => {
    const billed = invoices.reduce((s, x) => s + x.amount, 0)
    const paid = invoices.reduce((s, x) => s + x.paidAmount, 0)
    const balance = invoices.reduce((s, x) => s + x.balance, 0)
    return { billed, paid, balance, status: statusFor(balance, billed, paid) }
  }, [invoices])

  const breakdown = useMemo(() => {
    const map = new Map<string, { billed: number; paid: number; balance: number }>()
    for (const invoice of invoices) {
      const key = invoice.feeType || 'Other Fees'
      const row = map.get(key) ?? { billed: 0, paid: 0, balance: 0 }
      row.billed += invoice.amount; row.paid += invoice.paidAmount; row.balance += invoice.balance
      map.set(key, row)
    }
    return [...map.entries()].map(([feeType, row]) => ({ feeType, ...row }))
  }, [invoices])

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!paymentInvoice) return
    try {
      await recordPayment(paymentInvoice.id, { amount: Number(paymentAmount), receiptNumber: receiptNumber.trim(), paymentMethod, reference: reference.trim(), currency: SYSTEM_CURRENCY })
      setPaymentInvoice(null); setPaymentAmount(''); setReceiptNumber(''); setReference('')
      await loadStudent(profile?.studentNumber ?? query)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to record payment.') }
  }

  async function copyCode() {
    if (!profile) return
    await navigator.clipboard?.writeText(profile.studentNumber)
  }

  function shareSms() {
    if (!profile) return
    const body = encodeURIComponent('School fees account for ' + profile.name + ': Student Code ' + profile.studentNumber + '. Outstanding balance: ' + money(summary.balance) + '.')
    window.location.href = 'sms:?body=' + body
  }

  return <section className="finance-student-dashboard" aria-label="Student finance dashboard">
    <div className="finance-search-card">
      <div><p className="eyebrow">STUDENT ACCOUNT</p><h3>Fee account & payment status</h3><p className="finance-muted">Search by student number or internal student ID.</p></div>
      <form onSubmit={e => { e.preventDefault(); void loadStudent() }} className="finance-search-form">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. 9912001842" aria-label="Student number or ID" />
        <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Open Account'}</button>
      </form>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    {profile && <>
      <div className="finance-student-banner">
        <div><span className="finance-muted">Student</span><strong>{profile.name}</strong><small>{profile.status} · {profile.email || profile.phoneNumber || 'No contact recorded'}</small></div>
        <div className="finance-code-box"><span>SchoolPay / Registration Code</span><strong>{profile.studentNumber}</strong><div><button className="secondary-button" onClick={() => void copyCode()}>Copy Code</button><button className="secondary-button" onClick={shareSms}>Share via SMS</button></div></div>
      </div>
      <div className="summary-grid finance-summary-grid">
        <div className="summary-card"><span>Total Billed Term Fees</span><strong>{money(summary.billed)}</strong></div>
        <div className="summary-card"><span>Total Amount Paid</span><strong style={{color:'#059669'}}>{money(summary.paid)}</strong></div>
        <div className="summary-card"><span>Outstanding Balance</span><strong style={{color:summary.status.color}}>{money(summary.balance)}</strong></div>
      </div>
      <div className="finance-progress-card">
        <div className="finance-progress-head"><div><span>Payment Progress</span><strong>{summary.status.progress.toFixed(0)}%</strong></div><span className="finance-status-badge" style={{color:summary.status.color,background:summary.status.bg}}>{summary.status.label}</span></div>
        <div className="finance-progress-track"><div style={{width:summary.status.progress + '%',background:summary.status.color}} /></div>
      </div>
      <div className="panel finance-inner-panel">
        <div className="panel-heading"><div><p className="eyebrow">ITEMIZED FEES</p><h3>Fee Breakdown</h3></div></div>
        <div className="table-wrap"><table><thead><tr><th>Item</th><th>Billed</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>
          {breakdown.map(row => { const s=statusFor(row.balance,row.billed,row.paid); return <tr key={row.feeType}><td><strong>{row.feeType}</strong></td><td>{money(row.billed)}</td><td style={{color:'#059669',fontWeight:700}}>{money(row.paid)}</td><td style={{color:s.color,fontWeight:800}}>{money(row.balance)}</td><td><span className="finance-status-badge" style={{color:s.color,background:s.bg}}>{s.label}</span></td></tr> })}
          {breakdown.length===0 && <tr><td colSpan={5}>No fees have been billed to this student.</td></tr>}
        </tbody></table></div>
      </div>
      <div className="panel finance-inner-panel">
        <div className="panel-heading"><div><p className="eyebrow">TRANSACTIONS</p><h3>Payment History</h3></div></div>
        {payments.length===0 ? <p className="empty">No payments recorded for this student.</p> : <div className="finance-timeline">{payments.map((p,i)=><div className="finance-timeline-item" key={p.id ?? i}><span className="finance-timeline-dot" /><div><strong>{money(Number(p.amount))}</strong><span>{p.paymentMethod} · Receipt {p.receiptNumber}</span><small>{new Date(p.paidAt).toLocaleString('en-UG')}{p.reference ? ' · Ref: ' + p.reference : ''}</small></div></div>)}</div>}
      </div>
      <div className="panel finance-inner-panel">
        <div className="panel-heading"><div><p className="eyebrow">INVOICES</p><h3>Billable Items</h3></div></div>
        <div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Fee Type</th><th>Issued</th><th>Billed</th><th>Paid</th><th>Balance</th><th /></tr></thead><tbody>{invoices.map(inv=><tr key={inv.id}><td><strong>{inv.invoiceNumber}</strong></td><td>{inv.feeType}</td><td>{new Date(inv.issuedAt).toLocaleDateString('en-UG')}</td><td>{money(inv.amount)}</td><td style={{color:'#059669'}}>{money(inv.paidAmount)}</td><td style={{fontWeight:800}}>{money(inv.balance)}</td><td>{inv.balance>0 && <button className="secondary-button" onClick={()=>setPaymentInvoice(inv)}>Record Payment</button>}</td></tr>)}</tbody></table></div>
      </div>
    </>}
    {paymentInvoice && <div className="modal-backdrop"><form className="auth-card" onSubmit={submitPayment}><p className="eyebrow">PAYMENT</p><h3>{paymentInvoice.feeType} · {paymentInvoice.invoiceNumber}</h3><p>Outstanding: {money(paymentInvoice.balance)}</p><input type="number" min="0.01" max={paymentInvoice.balance} step="0.01" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} placeholder="Amount" required /><input value={receiptNumber} onChange={e=>setReceiptNumber(e.target.value)} placeholder="Receipt number" required /><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option>Cash</option><option>Bank Deposit - Centenary</option><option>Bank Deposit - Stanbic</option><option>MTN Mobile Money</option><option>Airtel Money</option><option>Card</option><option>Cheque</option></select><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="SchoolPay / bank / mobile reference" /><div className="topbar-actions"><button type="button" className="secondary-button" onClick={()=>setPaymentInvoice(null)}>Cancel</button><button type="submit">Post Payment</button></div></form></div>}
  </section>
}
