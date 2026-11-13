import { Fragment, useEffect, useMemo, useState } from 'react'
import { getFinanceStudents, getFeeStructures, getInvoices, getPayments, getStudentFinanceProfile, getStudentFinancialStatement, recordPayment, type FinanceStudentRegisterEntry, type FeeStructure, type Invoice, type StudentFinanceProfile, type StudentFinancialStatement } from '../api/finance'
import { formatCurrency, SYSTEM_CURRENCY, SYSTEM_LOCALE } from '../lib/currency'
import { validateForm } from '../lib/validation'
import { recordPaymentRequestSchema } from '../schemas'
import type { Payment } from './FinanceManagement'

type Props = { initialSearch?: string }
const money = (n: number, currency = SYSTEM_CURRENCY) => formatCurrency(n, currency)
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
  const [registerStudents, setRegisterStudents] = useState<FinanceStudentRegisterEntry[]>([])
  const [registerInvoices, setRegisterInvoices] = useState<Invoice[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [registerLoading, setRegisterLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [statement, setStatement] = useState<StudentFinancialStatement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [sourceChannel, setSourceChannel] = useState('Cash')
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})
  const [reference, setReference] = useState('')
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [intakeFilter, setIntakeFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [academicYearFilter, setAcademicYearFilter] = useState('')

  async function loadStudent(value = query) {
    if (!value.trim()) return
    setLoading(true); setError('')
    try {
      const p = await getStudentFinanceProfile(value.trim())
      const [inv, pay, financialStatement] = await Promise.all([getInvoices(p.id), getPayments(p.id), getStudentFinancialStatement(p.id)])
      setProfile(p); setInvoices(inv); setPayments(pay); setStatement(financialStatement)
    } catch (e) {
      setProfile(null); setInvoices([]); setPayments([]); setStatement(null)
      setError(e instanceof Error ? e.message : 'Unable to load student finance account.')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([getFinanceStudents(), getInvoices(), getFeeStructures()])
      .then(([students, allInvoices, structures]) => {
        if (cancelled) return
        setRegisterStudents(students)
        setRegisterInvoices(allInvoices)
        setFeeStructures(structures)
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load the student fee register.') })
      .finally(() => { if (!cancelled) setRegisterLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => { if (initialSearch.trim()) void loadStudent(initialSearch) }, [initialSearch])

  const feeTypeColumns = useMemo(() => {
    const columns = new Map<string, { key: string; feeType: string; currency: string; label: string }>()
    for (const invoice of registerInvoices) {
      const feeType = invoice.feeType?.trim() || 'Other Fees'
      const currency = invoice.currency?.trim().toUpperCase() || SYSTEM_CURRENCY
      const key = feeType + '|' + currency
      columns.set(key, { key, feeType, currency, label: feeType + ' (' + currency + ')' })
    }
    return [...columns.values()].sort((a, b) => a.feeType.localeCompare(b.feeType) || a.currency.localeCompare(b.currency))
  }, [registerInvoices])

  const registerCurrencies = useMemo(() => [...new Set(registerInvoices.map(invoice => invoice.currency?.trim().toUpperCase() || SYSTEM_CURRENCY))].sort(), [registerInvoices])

  const programmeOptions = useMemo(() => [...new Set(registerStudents.map(student => student.programmeCode).filter((value): value is string => Boolean(value)))].sort(), [registerStudents])
  const intakeOptions = useMemo(() => [...new Set(registerStudents.map(student => student.intakeCode || student.intakeName).filter((value): value is string => Boolean(value)))].sort(), [registerStudents])
  const classOptions = useMemo(() => [...new Set(registerStudents.map(student => student.classYear).filter((value): value is number => value != null))].sort((a, b) => a - b), [registerStudents])
  const semesterOptions = useMemo(() => [...new Set(registerStudents.map(student => student.semesterName).filter((value): value is string => Boolean(value)))].sort(), [registerStudents])
  const academicYearOptions = useMemo(() => [...new Set(registerStudents.map(student => student.academicYearName).filter((value): value is string => Boolean(value)))].sort(), [registerStudents])

  const registerRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return registerStudents.filter(student => {
      const matchesSearch = !term || [
        student.studentNumber, student.name, student.programmeCode, student.programmeName,
        student.intakeCode, student.intakeName, student.semesterName, student.academicYearName,
      ].some(value => String(value ?? '').toLowerCase().includes(term))
      return matchesSearch &&
        (!programmeFilter || student.programmeCode === programmeFilter) &&
        (!intakeFilter || (student.intakeCode || student.intakeName) === intakeFilter) &&
        (!classFilter || String(student.classYear ?? '') === classFilter) &&
        (!semesterFilter || student.semesterName === semesterFilter) &&
        (!academicYearFilter || student.academicYearName === academicYearFilter)
    }).map(student => {
      const studentInvoices = registerInvoices.filter(invoice => invoice.studentId === student.id)
      const billedByFee: Record<string, number> = {}
      const totalsByCurrency: Record<string, { billed: number; paid: number; balance: number }> = {}
      for (const invoice of studentInvoices) {
        const feeType = invoice.feeType || 'Other Fees'
        const currency = invoice.currency?.trim().toUpperCase() || SYSTEM_CURRENCY
        const key = feeType + '|' + currency
        const billed = Math.max(0, invoice.paidAmount + invoice.balance)
        billedByFee[key] = (billedByFee[key] ?? 0) + billed
        const totals = totalsByCurrency[currency] ?? { billed: 0, paid: 0, balance: 0 }
        totals.billed += billed
        totals.paid += invoice.paidAmount
        totals.balance += invoice.balance
        totalsByCurrency[currency] = totals
      }
      return { student, billedByFee, totalsByCurrency, invoiceCount: studentInvoices.length }
    })
  }, [registerStudents, registerInvoices, query, programmeFilter, intakeFilter, classFilter, semesterFilter, academicYearFilter])

  const groupedRegisterRows = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; rows: typeof registerRows }>()
    for (const row of registerRows) {
      const student = row.student
      const programme = student.programmeCode
        ? student.programmeCode + (student.programmeName ? ' — ' + student.programmeName : '')
        : student.programmeName || 'Programme not assigned'
      const intake = student.intakeCode
        ? student.intakeCode + (student.intakeName ? ' — ' + student.intakeName : '')
        : student.intakeName || 'Uptake not assigned'
      const className = student.classYear == null ? 'Class not assigned' : 'Year ' + student.classYear
      const semester = student.semesterName || 'Semester not assigned'
      const academicYear = student.academicYearName || 'Academic year not assigned'
      const label = [programme, intake, className, semester, academicYear].join('  ·  ')
      const key = [programme, intake, className, semester, academicYear].join('|')
      const group = groups.get(key)
      if (group) group.rows.push(row)
      else groups.set(key, { key, label, rows: [row] })
    }
    return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [registerRows])

  const summaryByCurrency = useMemo(() => {
    const totals = new Map<string, { billed: number; paid: number; balance: number }>()
    for (const invoice of invoices) {
      const currency = invoice.currency?.trim().toUpperCase() || SYSTEM_CURRENCY
      const row = totals.get(currency) ?? { billed: 0, paid: 0, balance: 0 }
      row.billed += invoice.amount
      row.paid += invoice.paidAmount
      row.balance += invoice.balance
      totals.set(currency, row)
    }
    return [...totals.entries()].map(([currency, totals]) => ({ currency, ...totals, status: statusFor(totals.balance, totals.billed, totals.paid) }))
  }, [invoices])

  const breakdown = useMemo(() => {
    const map = new Map<string, { feeType: string; currency: string; billed: number; paid: number; balance: number }>()
    for (const invoice of invoices) {
      const feeType = invoice.feeType || 'Other Fees'
      const currency = invoice.currency?.trim().toUpperCase() || SYSTEM_CURRENCY
      const key = feeType + '|' + currency
      const row = map.get(key) ?? { feeType, currency, billed: 0, paid: 0, balance: 0 }
      row.billed += invoice.amount; row.paid += invoice.paidAmount; row.balance += invoice.balance
      map.set(key, row)
    }
    return [...map.values()]
  }, [invoices])

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!paymentInvoice) return
    const validation = validateForm(recordPaymentRequestSchema, {
      amount: Number(paymentAmount),
      receiptNumber: receiptNumber.trim(),
      paymentMethod: sourceChannel,
      sourceChannel,
      reference: reference.trim(),
      currency: paymentInvoice.currency || SYSTEM_CURRENCY,
    })
    if (!validation.success) {
      setPaymentErrors(validation.errors)
      setError('Payment was not posted. Correct the payment fields shown below.')
      return
    }
    setPaymentErrors({})
    try {
      await recordPayment(paymentInvoice.id, validation.data)
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
    const body = encodeURIComponent('School fees account for ' + profile.name + ': Student Code ' + profile.studentNumber + '. Outstanding balance: ' + summaryByCurrency.map(row => money(row.balance, row.currency)).join(' / ') + '.')
    window.location.href = 'sms:?body=' + body
  }

  return <section className="finance-student-dashboard" aria-label="Student finance dashboard">
    <div className="finance-search-card">
      <div><p className="eyebrow">STUDENT FEES & PAYMENTS</p><h3>Student fee register</h3></div>
      <div className="finance-search-form">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter by student name or number" aria-label="Filter students by name or number" />
      </div>
      {!profile && <div className="finance-register-list" style={{ marginTop: 14, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <div style={{ padding: '9px 12px', fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>
          {registerRows.length.toLocaleString()} students · {groupedRegisterRows.length.toLocaleString()} class groups
          <small style={{ display: 'block', color: '#64748b', fontWeight: 400 }}>Grouped by programme, uptake, class/year, semester and academic year. Select a student to open the account and record a payment.</small>
        </div>
        <div className="finance-table-toolbar" style={{ padding: '10px 12px', flexWrap: 'wrap' }}>
          <select aria-label="Filter by programme" value={programmeFilter} onChange={e => setProgrammeFilter(e.target.value)}>
            <option value="">All programmes</option>
            {programmeOptions.map(code => <option key={code} value={code}>{code} — {registerStudents.find(student => student.programmeCode === code)?.programmeName || code}</option>)}
          </select>
          <select aria-label="Filter by uptake" value={intakeFilter} onChange={e => setIntakeFilter(e.target.value)}>
            <option value="">All uptakes</option>
            {intakeOptions.map(code => {
              const intake = registerStudents.find(student => (student.intakeCode || student.intakeName) === code)
              return <option key={code} value={code}>{intake?.intakeCode ? intake.intakeCode + (intake.intakeName ? ' — ' + intake.intakeName : '') : code}</option>
            })}
          </select>
          <select aria-label="Filter by class or year of study" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
            <option value="">All classes / years</option>
            {classOptions.map(year => <option key={year} value={String(year)}>Year {year}</option>)}
          </select>
          <select aria-label="Filter by semester" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
            <option value="">All semesters</option>
            {semesterOptions.map(semester => <option key={semester} value={semester}>{semester}</option>)}
          </select>
          <select aria-label="Filter by academic year" value={academicYearFilter} onChange={e => setAcademicYearFilter(e.target.value)}>
            <option value="">All academic years</option>
            {academicYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <button type="button" className="secondary-button" onClick={() => { setProgrammeFilter(''); setIntakeFilter(''); setClassFilter(''); setSemesterFilter(''); setAcademicYearFilter('') }}>Clear filters</button>
        </div>
        <table style={{ minWidth: 980, width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ textAlign: 'left', padding: '9px 10px', position: 'sticky', left: 0, background: '#f8fafc' }}>Student No.</th>
            <th style={{ textAlign: 'left', padding: '9px 10px' }}>Student Name</th>
            {feeTypeColumns.map(column => <th key={column.key} style={{ textAlign: 'right', padding: '9px 10px', whiteSpace: 'nowrap' }}>{column.label}</th>)}
            {registerCurrencies.map(currency => <Fragment key={currency}><th style={{ textAlign: 'right', padding: '9px 10px' }}>Billed ({currency})</th><th style={{ textAlign: 'right', padding: '9px 10px' }}>Paid ({currency})</th><th style={{ textAlign: 'right', padding: '9px 10px' }}>Balance ({currency})</th></Fragment>)}
          </tr></thead>
          <tbody>
            {groupedRegisterRows.map(group => <Fragment key={group.key}>
              <tr className="finance-register-group-row">
                <td colSpan={feeTypeColumns.length + registerCurrencies.length * 3 + 2} style={{ padding: '10px', background: '#f1f5f9', fontWeight: 800, borderTop: '1px solid #cbd5e1' }}>{group.label} <span style={{ color: '#64748b', fontWeight: 500 }}>· {group.rows.length} students</span></td>
              </tr>
              {group.rows.map(({ student, billedByFee, billed, paid, balance, invoiceCount }) => <tr key={student.id} onClick={() => { setQuery(student.studentNumber); void loadStudent(student.studentNumber) }} style={{ cursor: 'pointer' }} title="Open detailed student account">
                <td style={{ padding: '9px 10px', fontWeight: 700, position: 'sticky', left: 0, background: '#fff' }}>{student.studentNumber}</td>
                <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>{student.name}<small style={{ display: 'block', color: '#64748b' }}>{student.status} · {student.enrollmentStatus || 'Enrollment not recorded'} · {invoiceCount} invoices</small></td>
                {feeTypeColumns.map(column => <td key={column.key} style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>{money(billedByFee[column.key] ?? 0, column.currency)}</td>)}
                {registerCurrencies.map(currency => { const totals = totalsByCurrency[currency] ?? { billed: 0, paid: 0, balance: 0 }; return <Fragment key={currency}><td style={{ padding: '9px 10px', textAlign: 'right' }}>{money(totals.billed, currency)}</td><td style={{ padding: '9px 10px', textAlign: 'right', color: '#059669', fontWeight: 700 }}>{money(totals.paid, currency)}</td><td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800 }}>{money(totals.balance, currency)}</td></Fragment> })}
              </tr>)}
            </Fragment>)}
            {registerLoading && <tr><td colSpan={feeTypeColumns.length + 5} style={{ padding: 16 }}>Loading student fee register…</td></tr>}
            {!registerLoading && registerRows.length === 0 && <tr><td colSpan={feeTypeColumns.length + 5} style={{ padding: 16 }}>No students match the search and cohort filters.</td></tr>}
          </tbody>
        </table>
      </div>}
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    {profile && <>
      <div className="page-actions" style={{ marginBottom: 12 }}>
        <button type="button" className="secondary-button" onClick={() => { setProfile(null); setInvoices([]); setPayments([]); setStatement(null); setQuery(''); setError('') }}>Back to student register</button>
      </div>
      <div className="finance-student-banner">
        <div><span className="finance-muted">Student</span><strong>{profile.name}</strong><small>{profile.status} · {profile.email || profile.phoneNumber || 'No contact recorded'}</small></div>
        <div className="finance-code-box"><span>Payment Provider / Registration Code</span><strong>{profile.studentNumber}</strong><div><button className="secondary-button" onClick={() => void copyCode()}>Copy Code</button><button className="secondary-button" onClick={shareSms}>Share via SMS</button></div></div>
      </div>
      <div className="summary-grid finance-summary-grid">
        <div className="summary-card"><span>Total Billed Term Fees</span><strong>{summaryByCurrency.map(row => money(row.billed, row.currency)).join(' / ')}</strong></div>
        <div className="summary-card"><span>Total Amount Paid</span><strong style={{color:'#059669'}}>{summaryByCurrency.map(row => money(row.paid, row.currency)).join(' / ')}</strong></div>
        <div className="summary-card"><span>Outstanding Balance</span><strong style={{color:summaryByCurrency.length === 1 ? summaryByCurrency[0].status.color : undefined}}>{summaryByCurrency.map(row => money(row.balance, row.currency)).join(' / ')}</strong></div>
      </div>
      <div className="finance-progress-card">
        <div className="finance-progress-head"><div><span>Payment Progress</span><strong>{summaryByCurrency.map(row => row.currency + ' ' + row.status.progress.toFixed(0) + '%').join(' · ')}</strong></div><span className="finance-status-badge" style={{color:summaryByCurrency.length === 1 ? summaryByCurrency[0].status.color : undefined,background:summaryByCurrency.length === 1 ? summaryByCurrency[0].status.bg : undefined}}>{summaryByCurrency.length === 1 ? summaryByCurrency[0].status.label : 'Per-currency balances'}</span></div>
        <div className="finance-progress-track"><div style={{width:(summaryByCurrency.length === 1 ? summaryByCurrency[0].status.progress : 0) + '%',background:summaryByCurrency.length === 1 ? summaryByCurrency[0].status.color : '#64748b'}} /></div>
      </div>
      <div className="panel finance-inner-panel">
        <div className="panel-heading"><div><p className="eyebrow">ITEMIZED FEES</p><h3>Fee Breakdown</h3></div></div>
        <div className="table-wrap"><table><thead><tr><th>Item</th><th>Billed</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>
          {breakdown.map(row => { const s=statusFor(row.balance,row.billed,row.paid); return <tr key={row.feeType}><td><strong>{row.feeType}</strong><small style={{display:'block'}}>{row.currency}</small></td><td>{money(row.billed, row.currency)}</td><td style={{color:'#059669',fontWeight:700}}>{money(row.paid, row.currency)}</td><td style={{color:s.color,fontWeight:800}}>{money(row.balance, row.currency)}</td><td><span className="finance-status-badge" style={{color:s.color,background:s.bg}}>{s.label}</span></td></tr> })}
          {breakdown.length===0 && <tr><td colSpan={5}>No fees have been billed to this student.</td></tr>}
        </tbody></table></div>
      </div>
      <div className="panel finance-inner-panel">
        <div className="panel-heading"><div><p className="eyebrow">INVOICE LINE ITEMS</p><h3>Detailed Financial Statement</h3></div></div>
        {statement?.invoices.map(invoice => <div className="finance-invoice-detail" key={invoice.id}>
          <div className="panel-heading">
            <div><strong>{invoice.invoiceNumber} · {invoice.feeType}</strong><small>{new Date(invoice.issuedAt).toLocaleDateString(SYSTEM_LOCALE)}</small></div>
            <div><strong>{money(invoice.netAmount, invoice.currency)}</strong><small>Paid {money(invoice.paidAmount, invoice.currency)} · Balance {money(invoice.balance, invoice.currency)}</small></div>
          </div>
          <div className="table-wrap"><table><thead><tr><th>Code</th><th>Fee item</th><th>Amount billed</th></tr></thead><tbody>
            {invoice.lines.map(line => <tr key={line.id}><td>{line.code}</td><td>{line.description}</td><td>{money(line.amount, line.currency)}</td></tr>)}
            {invoice.lines.length===0 && <tr><td colSpan={3}>No itemized lines recorded for this invoice.</td></tr>}
          </tbody></table></div>
        </div>)}
        {statement && <p className="finance-muted">{statement.itemAllocationNote}</p>}
        {statement?.invoices.length===0 && <p className="empty">No financial statement entries are available.</p>}
      </div>
      <div className="panel finance-inner-panel">
        <div className="panel-heading"><div><p className="eyebrow">TRANSACTIONS</p><h3>Payment History</h3></div></div>
        {payments.length===0 ? <p className="empty">No payments recorded for this student.</p> : <div className="finance-timeline">{payments.map((p,i)=><div className="finance-timeline-item" key={p.id ?? i}><span className="finance-timeline-dot" /><div><strong>{money(Number(p.amount), p.currency || SYSTEM_CURRENCY)}</strong><span>{p.paymentSource}{p.sourceChannel && ' · ' + p.sourceChannel} · Receipt {p.receiptNumber}</span><small>{new Date(p.paidAt).toLocaleString(SYSTEM_LOCALE)}{p.reference ? ' · Ref: ' + p.reference : ''}</small></div></div>)}</div>}
      </div>
      <div className="panel finance-inner-panel">
        <div className="panel-heading"><div><p className="eyebrow">INVOICES</p><h3>Billable Items</h3></div></div>
        <div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Fee Type</th><th>Currency</th><th>Issued</th><th>Billed</th><th>Paid</th><th>Balance</th><th /></tr></thead><tbody>{invoices.map(inv=><tr key={inv.id}><td><strong>{inv.invoiceNumber}</strong></td><td>{inv.feeType}</td><td>{inv.currency}</td><td>{new Date(inv.issuedAt).toLocaleDateString(SYSTEM_LOCALE)}</td><td>{money(inv.amount, inv.currency)}</td><td style={{color:'#059669'}}>{money(inv.paidAmount, inv.currency)}</td><td style={{fontWeight:800}}>{money(inv.balance, inv.currency)}</td><td>{inv.balance>0 && <button className="secondary-button" onClick={()=>setPaymentInvoice(inv)}>Record Payment</button>}</td></tr>)}</tbody></table></div>
      </div>
    </>}
    {paymentInvoice && <div className="modal-backdrop"><form className="auth-card" onSubmit={submitPayment}><p className="eyebrow">PAYMENT</p><h3>{paymentInvoice.feeType} · {paymentInvoice.invoiceNumber} ({paymentInvoice.currency})</h3><p>Outstanding: {money(paymentInvoice.balance, paymentInvoice.currency)}</p>{Object.keys(paymentErrors).length > 0 && <div className="error" role="alert"><ul>{Object.entries(paymentErrors).map(([field, message]) => <li key={field}>{field}: {message}</li>)}</ul></div>}<input aria-invalid={Boolean(paymentErrors.amount)} type="number" min="1" max={paymentInvoice.balance} step="1" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} placeholder="Amount" required /><input aria-invalid={Boolean(paymentErrors.receiptNumber)} value={receiptNumber} onChange={e=>setReceiptNumber(e.target.value)} placeholder="Receipt number" required /><label>Manual source<select value={sourceChannel} onChange={e=>setSourceChannel(e.target.value)}><option>Cash</option><option>Cheque</option></select></label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Manual receipt / cheque reference" /><div className="topbar-actions"><button type="button" className="secondary-button" onClick={()=>setPaymentInvoice(null)}>Cancel</button><button type="submit">Post Payment</button></div></form></div>}
  </section>
}
