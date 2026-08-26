import { useEffect, useState, type FormEvent } from 'react'
import type { Invoice } from '../api/finance'
import { getInvoices, recordPayment, getOutstandingBalances, getFeeStructures, getPayments } from '../api/finance'
import { listStaff, type StaffMember } from '../api/staff'
import { listPayroll, markPayrollPaid, generatePayroll, type PayrollRecord } from '../api/payroll'

type MainTab = 'student-fees' | 'staff-salaries'

type AcademicYear = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; isActive: boolean }

type FeeBreakdownRow = {
  id: string
  feeType: string
  amount: number
  paid: number
  balance: number
  status: string
}

export function AccountsOfficeManagement() {
  const [mainTab, setMainTab] = useState<MainTab>('student-fees')

  const [years, setYears] = useState<AcademicYear[]>([])
  const [programmes, setProgrammes] = useState<{ id: string; name: string }[]>([])
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')

  const [editingFees, setEditingFees] = useState<FeeBreakdownRow[]>([])
  const [editDraft, setEditDraft] = useState<Record<string, number>>({})
  const [editMessage, setEditMessage] = useState('')

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [staffMap, setStaffMap] = useState<Record<string, StaffMember>>({})
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [payrollLoading, setPayrollLoading] = useState(true)
  const [payrollError, setPayrollError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)
  const [paymentMethodMap, setPaymentMethodMap] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    async function loadYears() {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch('/api/academic-structure/years', {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        if (!response.ok) throw new Error(`Unable to load academic years (${response.status}).`)
        const data = (await response.json()) as AcademicYear[]
        if (!cancelled) setYears(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load academic years.')
      }
    }
    void loadYears()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadProgrammes() {
      try {
        const { getProgrammes } = await import('../api/programmes')
        const data = await getProgrammes()
        if (!cancelled) setProgrammes(data.map(p => ({ id: p.id, name: p.name })))
      } catch {
        // ignore
      }
    }
    void loadProgrammes()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedStudentId) {
      setInvoices([])
      setLoading(false)
      return
    }
    let cancelled = false
    async function loadInvoices() {
      setLoading(true)
      setError('')
      try {
        const data = await getInvoices(selectedStudentId ?? undefined)
        if (!cancelled) {
          setInvoices(data)
          const breakdown = data.map(inv => ({
            id: inv.id,
            feeType: inv.invoiceNumber,
            amount: inv.amount,
            paid: inv.paidAmount,
            balance: inv.balance,
            status: inv.status,
          }))
          setEditingFees(breakdown)
          setEditDraft({})
          setEditMessage('')
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load invoices.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadInvoices()
    return () => { cancelled = true }
  }, [selectedStudentId])

  useEffect(() => {
    let cancelled = false
    async function loadStaff() {
      try {
        const data = await listStaff()
        if (!cancelled) {
          const map: Record<string, StaffMember> = {}
          for (const s of data) map[s.id] = s
          setStaffMap(map)
        }
      } catch {
        // ignore
      }
    }
    void loadStaff()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadPayroll() {
      setPayrollLoading(true)
      setPayrollError('')
      try {
        const data = await listPayroll()
        if (!cancelled) setPayrollRecords(data)
      } catch (e) {
        if (!cancelled) setPayrollError(e instanceof Error ? e.message : 'Unable to load payroll.')
      } finally {
        if (!cancelled) setPayrollLoading(false)
      }
    }
    void loadPayroll()
    return () => { cancelled = true }
  }, [])

  function handleStudentSearch(e: FormEvent) {
    e.preventDefault()
    const query = studentSearch.trim()
    if (!query) return
    setSelectedStudentId(query)
    setSelectedInvoice(null)
    setPaymentAmount('')
    setReceiptNumber('')
  }

  function clearStudentSearch() {
    setStudentSearch('')
    setSelectedStudentId(null)
    setInvoices([])
    setEditingFees([])
    setEditDraft({})
    setEditMessage('')
    setSelectedInvoice(null)
    setPaymentAmount('')
    setReceiptNumber('')
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault()
    if (!selectedInvoice) return
    try {
      await recordPayment(selectedInvoice.id, {
        amount: Number(paymentAmount),
        receiptNumber: receiptNumber.trim(),
        paymentMethod,
        currency: selectedInvoice.currency,
      })
      setSelectedInvoice(null)
      setPaymentAmount('')
      setReceiptNumber('')
      setPaymentMethod('Cash')
      if (selectedStudentId) {
        const data = await getInvoices(selectedStudentId)
        setInvoices(data)
        const breakdown = data.map(inv => ({
          id: inv.id,
          feeType: inv.invoiceNumber,
          amount: inv.amount,
          paid: inv.paidAmount,
          balance: inv.balance,
          status: inv.status,
        }))
        setEditingFees(breakdown)
        setEditDraft({})
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to record payment.')
    }
  }

  async function handleGeneratePayroll(e: FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setPayrollError('')
    try {
      await generatePayroll(selectedMonth, selectedYear)
      const data = await listPayroll()
      setPayrollRecords(data)
    } catch (e) {
      setPayrollError(e instanceof Error ? e.message : 'Unable to generate payroll.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleMarkPaid(id: string) {
    setMarkingPaidId(id)
    setPayrollError('')
    try {
      const method = paymentMethodMap[id] || 'Cash'
      await markPayrollPaid(id, method)
      const data = await listPayroll()
      setPayrollRecords(data)
    } catch (e) {
      setPayrollError(e instanceof Error ? e.message : 'Unable to update payroll.')
    } finally {
      setMarkingPaidId(null)
    }
  }

  function handleEditAmount(id: string, value: string) {
    setEditDraft(prev => ({ ...prev, [id]: Number(value) }))
  }

  function handleSaveFeeEdits() {
    setEditingFees(prev => prev.map(row => {
      const newAmount = editDraft[row.id] ?? row.amount
      const newPaid = Math.min(row.paid, newAmount)
      const newBalance = Math.max(0, newAmount - newPaid)
      return { ...row, amount: newAmount, paid: newPaid, balance: newBalance }
    }))
    setEditDraft({})
    setEditMessage('Fee balances updated.')
    setTimeout(() => setEditMessage(''), 3000)
  }

  const filteredPayroll = payrollRecords.filter(r => r.month === selectedMonth && r.year === selectedYear)

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0)

  function getStatusColor(balance: number, paid: number): string {
    if (balance === 0) return '#059669'
    if (paid > 0 && balance > 0) return '#d97706'
    return '#dc2626'
  }

  function getStatusLabel(balance: number, paid: number): string {
    if (balance === 0) return 'Fully Paid'
    if (paid > 0 && balance > 0) return 'Partial Payment'
    return 'Large Balance'
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2]

  return (
    <section className="panel" aria-label="Accounts office management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ACCOUNTS OFFICE</span>
          <h2>Accounts Office Management</h2>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Accounts sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={mainTab === 'student-fees'} className={mainTab === 'student-fees' ? 'active' : ''} onClick={() => setMainTab('student-fees')}>Student Fees</button>
        <button role="tab" aria-selected={mainTab === 'staff-salaries'} className={mainTab === 'staff-salaries' ? 'active' : ''} onClick={() => setMainTab('staff-salaries')}>Staff Salaries</button>
      </div>

      {mainTab === 'student-fees' && (
        <>
          <form className="student-form" onSubmit={handleStudentSearch} style={{ marginBottom: 22 }}>
            <h3>Filters</h3>
            <div className="form-row">
              <select aria-label="Academic Year" value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)}>
                <option value="">All Academic Years</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <select aria-label="Programme" value={selectedProgrammeId} onChange={e => setSelectedProgrammeId(e.target.value)}>
                <option value="">All Programmes</option>
                {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input aria-label="Student ID or code" placeholder="Enter student ID or code" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              <button type="submit">Search</button>
              {selectedStudentId && <button type="button" className="secondary-button" onClick={clearStudentSearch}>Clear</button>}
            </div>
          </form>

          {selectedStudentId && (
            <>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Total Fees</span>
                  <strong>UGX {totalAmount.toLocaleString()}</strong>
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

              <div className="table-wrap" style={{ marginBottom: 22 }}>
                {loading ? (
                  <p className="empty">Loading fee breakdown…</p>
                ) : invoices.length === 0 ? (
                  <p className="empty">No invoices found for this student.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Fee Type</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => {
                        const statusColor = getStatusColor(inv.balance, inv.paidAmount)
                        return (
                          <tr key={inv.id}>
                            <td><strong>{inv.invoiceNumber}</strong></td>
                            <td>UGX {inv.amount.toLocaleString()}</td>
                            <td style={{ color: '#059669' }}>UGX {inv.paidAmount.toLocaleString()}</td>
                            <td style={{ color: inv.balance > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>UGX {inv.balance.toLocaleString()}</td>
                            <td>
                              <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: statusColor, color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                                {getStatusLabel(inv.balance, inv.paidAmount)}
                              </span>
                            </td>
                            <td>
                              {inv.balance > 0 && (
                                <button className="secondary-button" onClick={() => { setSelectedInvoice(inv); setPaymentAmount(''); setReceiptNumber(''); }}>Record Payment</button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>UGX {totalAmount.toLocaleString()}</strong></td>
                        <td style={{ color: '#059669' }}><strong>UGX {totalPaid.toLocaleString()}</strong></td>
                        <td style={{ color: totalBalance > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}><strong>UGX {totalBalance.toLocaleString()}</strong></td>
                        <td><strong>{totalBalance === 0 ? 'Fully Paid' : 'Outstanding'}</strong></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {invoices.length > 0 && (
                <>
                  <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                    <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                      <div>
                        <span className="eyebrow">PAYMENT</span>
                        <h3>Record Payment</h3>
                      </div>
                    </div>
                    <form onSubmit={submitPayment}>
                      <div className="form-row">
                        <label>Payment Amount (UGX)<input type="number" min="0.01" step="0.01" placeholder="0.00" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required /></label>
                        <label>Receipt Number<input value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} placeholder="Receipt number" required /></label>
                        <label>Payment Method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Cash</option><option>Bank</option><option>Mobile Money</option><option>Card</option></select></label>
                      </div>
                      <div className="topbar-actions">
                        <button type="submit">Update Payment</button>
                      </div>
                    </form>
                  </div>

                  <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                    <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                      <div>
                        <span className="eyebrow">FEES</span>
                        <h3>Edit Fee Balance</h3>
                      </div>
                    </div>
                    <div className="table-wrap" style={{ marginBottom: 15 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Fee Type</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editingFees.map(row => (
                            <tr key={row.id}>
                              <td><strong>{row.feeType}</strong></td>
                              <td><input type="number" min="0" step="0.01" value={editDraft[row.id] ?? row.amount} onChange={e => handleEditAmount(row.id, e.target.value)} /></td>
                              <td style={{ color: '#059669' }}>UGX {row.paid.toLocaleString()}</td>
                              <td style={{ color: Math.max(0, (editDraft[row.id] ?? row.amount) - row.paid) > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>UGX {Math.max(0, (editDraft[row.id] ?? row.amount) - row.paid).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {editMessage && <div className="error" role="status" style={{ marginBottom: 10 }}>{editMessage}</div>}
                    <div className="topbar-actions">
                      <button type="button" onClick={handleSaveFeeEdits}>Save</button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {!selectedStudentId && (
            <div className="empty">
              <p>Search for a student by ID or code to view their fee breakdown and payment options.</p>
            </div>
          )}

          {selectedInvoice && (
            <div className="modal-backdrop">
              <form className="auth-card" onSubmit={submitPayment}>
                <p className="eyebrow">Payment</p>
                <h3>{selectedInvoice.invoiceNumber}</h3>
                <p>Outstanding: UGX {selectedInvoice.balance.toLocaleString()}</p>
                <label>Payment Amount (UGX)<input type="number" min="0.01" max={selectedInvoice.balance} step="0.01" placeholder="Amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required /></label>
                <label>Receipt Number<input value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} required /></label>
                <label>Payment Method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Cash</option><option>Bank</option><option>Mobile Money</option><option>Card</option></select></label>
                <div className="topbar-actions">
                  <button type="button" className="secondary-button" onClick={() => setSelectedInvoice(null)}>Cancel</button>
                  <button type="submit">Update Payment</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {mainTab === 'staff-salaries' && (
        <>
          <form className="student-form" onSubmit={handleGeneratePayroll} style={{ marginBottom: 22 }}>
            <h3>Payroll Period</h3>
            <div className="form-row">
              <select aria-label="Month" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {monthNames.map((name, idx) => <option key={name} value={idx + 1}>{name}</option>)}
              </select>
              <select aria-label="Year" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button type="submit" disabled={generating}>{generating ? 'Generating…' : 'Generate Payroll'}</button>
            </div>
          </form>

          {payrollError && <div className="error" role="alert">{payrollError}</div>}

          <div className="table-wrap">
            {payrollLoading ? (
              <p className="empty">Loading payroll…</p>
            ) : filteredPayroll.length === 0 ? (
              <p className="empty">No payroll records found for the selected period.</p>
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayroll.map(record => {
                    const staff = staffMap[record.staffMemberId]
                    const statusColor = record.status === 'Paid' ? '#059669' : '#d97706'
                    const method = paymentMethodMap[record.id] || 'Cash'
                    return (
                      <tr key={record.id}>
                        <td><strong>{staff ? `${staff.firstName} ${staff.lastName}` : '—'}</strong></td>
                        <td>{staff?.staffNumber || '—'}</td>
                        <td>UGX {record.basicSalary.toLocaleString()}</td>
                        <td>UGX {record.allowances.toLocaleString()}</td>
                        <td>UGX {record.deductions.toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>UGX {record.netPay.toLocaleString()}</td>
                        <td>
                          <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: statusColor, color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                            {record.status}
                          </span>
                        </td>
                        <td>
                          {record.status === 'Pending' ? (
                            <select aria-label="Payment method" value={method} onChange={e => setPaymentMethodMap(prev => ({ ...prev, [record.id]: e.target.value }))}>
                              <option>Cash</option>
                              <option>Bank</option>
                              <option>Mobile Money</option>
                              <option>Card</option>
                            </select>
                          ) : (
                            record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('en-UG') : '—'
                          )}
                        </td>
                        <td>
                          {record.status === 'Pending' && (
                            <button className="secondary-button" onClick={() => void handleMarkPaid(record.id)} disabled={markingPaidId === record.id}>
                              {markingPaidId === record.id ? 'Saving…' : 'Mark Paid'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  )
}
