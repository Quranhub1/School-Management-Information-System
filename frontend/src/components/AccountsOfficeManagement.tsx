import React, { useEffect, useState, type FormEvent } from 'react'
import type { Invoice } from '../api/finance'
import { getInvoices, recordPayment, getPayments, issueCreditNote, getCreditNotes, addInvoiceNote, getInvoiceNotes, requestStaffAdvance, approveStaffAdvance, recoverStaffAdvance, getStaffAdvances, getInvoiceFeeItems } from '../api/finance'
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

type InvoiceFeeItem = {
  id: string
  feeType: string
  name: string
  amount: number
  paidAmount: number
  balance: number
  currency: string
  status: string
}

type PaymentHistoryRow = {
  id: string
  receiptNumber: string
  paidAt: string
  amount: number
  paymentMethod: string
  reference?: string
}

type CreditNoteRow = {
  id: string
  creditNoteNumber: string
  amount: number
  reason: string
  issuedBy?: string
  issuedAt: string
  status: string
}

type InvoiceNoteRow = {
  id: string
  note: string
  createdBy?: string
  createdAt: string
}

type StaffAdvanceRow = {
  id: string
  staffMemberId: string
  amount: number
  currency: string
  reason: string
  status: string
  requestedAt: string
  approvedBy?: string
}

const MOCK_ACADEMIC_YEARS: AcademicYear[] = [
  { id: '2025/2026', name: '2025/2026', startDate: '2025-09-01', endDate: '2026-08-31', isCurrent: true, isActive: true },
  { id: '2024/2025', name: '2024/2025', startDate: '2024-09-01', endDate: '2025-08-31', isCurrent: false, isActive: true },
]

const MOCK_PROGRAMMES = [
  { id: 'p1', name: 'Computer Science' },
  { id: 'p2', name: 'Business Administration' },
  { id: 'p3', name: 'Nursing' },
]

const MOCK_INVOICES: Invoice[] = [
  { id: 'inv1', studentId: 'S001', invoiceNumber: 'INV-2025-001', feeType: 'Tuition', amount: 2500000, paidAmount: 1000000, balance: 1500000, currency: 'UGX', status: 'Partially Paid', issuedAt: '2025-09-15' },
  { id: 'inv2', studentId: 'S001', invoiceNumber: 'INV-2025-002', feeType: 'Functional', amount: 500000, paidAmount: 0, balance: 500000, currency: 'UGX', status: 'Unpaid', issuedAt: '2025-09-20' },
  { id: 'inv3', studentId: 'S001', invoiceNumber: 'INV-2025-003', feeType: 'Guild', amount: 200000, paidAmount: 200000, balance: 0, currency: 'UGX', status: 'Paid', issuedAt: '2025-09-20' },
]

export function AccountsOfficeManagement() {
  const [mainTab, setMainTab] = useState<MainTab>('student-fees')

  const [years, setYears] = useState<AcademicYear[]>([])
  const [programmes, setProgrammes] = useState<{ id: string; name: string }[]>([])
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('')
  const [selectedFeeType, setSelectedFeeType] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
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

  const [invoiceFeeItems, setInvoiceFeeItems] = useState<InvoiceFeeItem[]>([])
  const [feeItemsLoading, setFeeItemsLoading] = useState(false)

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [staffMap, setStaffMap] = useState<Record<string, StaffMember>>({})
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [payrollLoading, setPayrollLoading] = useState(true)
  const [payrollError, setPayrollError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)
  const [paymentMethodMap, setPaymentMethodMap] = useState<Record<string, string>>({})

  const [payrollDetailId, setPayrollDetailId] = useState<string | null>(null)
  const [payrollDetailError, setPayrollDetailError] = useState('')
  const [payrollDetailLoading, setPayrollDetailLoading] = useState(false)
  const [payrollDetailData, setPayrollDetailData] = useState<PayrollRecord | null>(null)
  const [payrollDetailAdvances, setPayrollDetailAdvances] = useState<StaffAdvanceRow[]>([])
  const [payrollDetailPayments, setPayrollDetailPayments] = useState<PaymentHistoryRow[]>([])

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRow[]>([])
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false)
  const [paymentHistoryFilterMethod, setPaymentHistoryFilterMethod] = useState('')
  const [paymentHistoryFrom, setPaymentHistoryFrom] = useState('')
  const [paymentHistoryTo, setPaymentHistoryTo] = useState('')

  const [creditNotes, setCreditNotes] = useState<CreditNoteRow[]>([])
  const [creditNotesLoading, setCreditNotesLoading] = useState(false)
  const [creditNoteNumber, setCreditNoteNumber] = useState('')
  const [creditNoteAmount, setCreditNoteAmount] = useState('')
  const [creditNoteReason, setCreditNoteReason] = useState('')
  const [creditNoteIssuedBy, setCreditNoteIssuedBy] = useState('')

  const [invoiceNotes, setInvoiceNotes] = useState<InvoiceNoteRow[]>([])
  const [invoiceNotesLoading, setInvoiceNotesLoading] = useState(false)
  const [invoiceNoteText, setInvoiceNoteText] = useState('')
  const [invoiceNoteCreatedBy, setInvoiceNoteCreatedBy] = useState('')

  const [advances, setAdvances] = useState<StaffAdvanceRow[]>([])
  const [advancesLoading, setAdvancesLoading] = useState(false)
  const [advanceStaffId, setAdvanceStaffId] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceReason, setAdvanceReason] = useState('')
  const [advanceActionId, setAdvanceActionId] = useState<string | null>(null)

  const [staffSearchQuery, setStaffSearchQuery] = useState('')
  const [staffSearchResults, setStaffSearchResults] = useState<StaffMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [staffPaymentHistory, setStaffPaymentHistory] = useState<PayrollRecord[]>([])
  const [staffPaymentHistoryLoading, setStaffPaymentHistoryLoading] = useState(false)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2]

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
        if (!cancelled) setYears(data.length > 0 ? data : MOCK_ACADEMIC_YEARS)
      } catch {
        if (!cancelled) setYears(MOCK_ACADEMIC_YEARS)
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
        if (!cancelled) setProgrammes(MOCK_PROGRAMMES)
      }
    }
    void loadProgrammes()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedStudentId) {
      setInvoices([])
      setLoading(false)
      setPaymentHistory([])
      setCreditNotes([])
      setInvoiceNotes([])
      setEditingFees([])
      return
    }
    let cancelled = false
    async function loadInvoices() {
      setLoading(true)
      setError('')
      try {
        const data = await getInvoices(selectedStudentId ?? undefined)
        if (!cancelled) {
          const filtered = selectedFeeType ? data.filter(inv => inv.feeType === selectedFeeType) : data
          setInvoices(filtered)
          const breakdown = filtered.map(inv => ({
            id: inv.id,
            feeType: inv.feeType,
            amount: inv.amount,
            paid: inv.paidAmount,
            balance: inv.balance,
            status: inv.status,
          }))
          setEditingFees(breakdown)
          setEditDraft({})
          setEditMessage('')
        }
      } catch {
        if (!cancelled) {
          const filtered = selectedFeeType ? MOCK_INVOICES.filter(inv => inv.feeType === selectedFeeType) : MOCK_INVOICES
          setInvoices(filtered)
          const breakdown = filtered.map(inv => ({
            id: inv.id,
            feeType: inv.feeType,
            amount: inv.amount,
            paid: inv.paidAmount,
            balance: inv.balance,
            status: inv.status,
          }))
          setEditingFees(breakdown)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadInvoices()
    return () => { cancelled = true }
  }, [selectedStudentId, selectedFeeType])

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

  useEffect(() => {
    if (!payrollDetailId) {
      setPayrollDetailData(null)
      setPayrollDetailAdvances([])
      setPayrollDetailPayments([])
      return
    }
    let cancelled = false
    setPayrollDetailLoading(true)
    setPayrollDetailError('')
    async function loadDetail() {
      try {
        const data = await listPayroll(payrollDetailId || undefined)
        if (!cancelled && data.length > 0) {
          setPayrollDetailData(data[0])
          try {
            const adv = await getStaffAdvances(data[0].staffMemberId)
            if (!cancelled) setPayrollDetailAdvances(adv)
          } catch {
            if (!cancelled) setPayrollDetailAdvances([])
          }
        }
      } catch (e) {
        if (!cancelled) setPayrollDetailError(e instanceof Error ? e.message : 'Unable to load payroll detail.')
      } finally {
        if (!cancelled) setPayrollDetailLoading(false)
      }
    }
    void loadDetail()
    return () => { cancelled = true }
  }, [payrollDetailId])

   useEffect(() => {
    if (!selectedInvoice) {
      setPaymentHistory([])
      setCreditNotes([])
      setInvoiceNotes([])
      setInvoiceFeeItems([])
      return
    }
    let cancelled = false
    const invoice = selectedInvoice
    async function loadInvoiceDetails() {
      setPaymentHistoryLoading(true)
      setCreditNotesLoading(true)
      setInvoiceNotesLoading(true)
      setFeeItemsLoading(true)
      try {
        const [payments, creditNotesData, notes, feeItems] = await Promise.all([
          getPayments(),
          getCreditNotes(invoice.id),
          getInvoiceNotes(invoice.id),
          getInvoiceFeeItems(invoice.id),
        ])
        if (!cancelled) {
          const filtered = payments.filter(p => true)
          setPaymentHistory(filtered)
          setCreditNotes(creditNotesData)
          setInvoiceNotes(notes)
          setInvoiceFeeItems(feeItems)
        }
      } catch {
        if (!cancelled) {
          setPaymentHistory([])
          setCreditNotes([])
          setInvoiceNotes([])
          setInvoiceFeeItems([])
        }
      } finally {
        if (!cancelled) {
          setPaymentHistoryLoading(false)
          setCreditNotesLoading(false)
          setInvoiceNotesLoading(false)
          setFeeItemsLoading(false)
        }
      }
    }
    void loadInvoiceDetails()
    return () => { cancelled = true }
  }, [selectedInvoice])

  useEffect(() => {
    if (!selectedStaffId) {
      setStaffPaymentHistory([])
      return
    }
    let cancelled = false
    setStaffPaymentHistoryLoading(true)
    async function loadStaffPayments() {
      try {
        const data = await listPayroll(selectedStaffId || undefined)
        const paid = data.filter(r => r.status === 'Paid')
        if (!cancelled) setStaffPaymentHistory(paid)
      } catch {
        if (!cancelled) setStaffPaymentHistory([])
      } finally {
        if (!cancelled) setStaffPaymentHistoryLoading(false)
      }
    }
    void loadStaffPayments()
    return () => { cancelled = true }
  }, [selectedStaffId])

  useEffect(() => {
    let cancelled = false
    async function loadAdvances() {
      setAdvancesLoading(true)
      try {
        const data = await getStaffAdvances()
        if (!cancelled) setAdvances(data)
      } catch {
        if (!cancelled) setAdvances([])
      } finally {
        if (!cancelled) setAdvancesLoading(false)
      }
    }
    void loadAdvances()
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
    setPaymentHistoryFilterMethod('')
    setPaymentHistoryFrom('')
    setPaymentHistoryTo('')
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
    setPaymentHistory([])
    setCreditNotes([])
    setInvoiceNotes([])
    setPaymentHistoryFilterMethod('')
    setPaymentHistoryFrom('')
    setPaymentHistoryTo('')
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

  async function handleIssueCreditNote(e: FormEvent) {
    e.preventDefault()
    if (!selectedInvoice || !creditNoteNumber.trim() || !creditNoteAmount) return
    try {
      await issueCreditNote(selectedInvoice.id, {
        amount: Number(creditNoteAmount),
        reason: creditNoteReason.trim(),
      })
      setCreditNoteNumber('')
      setCreditNoteAmount('')
      setCreditNoteReason('')
      setCreditNoteIssuedBy('')
      const notes = await getCreditNotes(selectedInvoice.id)
      setCreditNotes(notes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to issue credit note.')
    }
  }

  async function handleAddInvoiceNote(e: FormEvent) {
    e.preventDefault()
    if (!selectedInvoice || !invoiceNoteText.trim()) return
    try {
      await addInvoiceNote(selectedInvoice.id, invoiceNoteText.trim(), invoiceNoteCreatedBy.trim() || undefined)
      setInvoiceNoteText('')
      setInvoiceNoteCreatedBy('')
      const notes = await getInvoiceNotes(selectedInvoice.id)
      setInvoiceNotes(notes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add invoice note.')
    }
  }

  async function handleRequestAdvance(e: FormEvent) {
    e.preventDefault()
    if (!advanceStaffId || !advanceAmount) return
    try {
      await requestStaffAdvance(advanceStaffId, Number(advanceAmount), advanceReason.trim())
      setAdvanceStaffId('')
      setAdvanceAmount('')
      setAdvanceReason('')
      const data = await getStaffAdvances()
      setAdvances(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to request advance.')
    }
  }

  async function handleApproveAdvance(advanceId: string) {
    setAdvanceActionId(advanceId)
    try {
      await approveStaffAdvance(advanceId, 'Accounts Office', true)
      const data = await getStaffAdvances()
      setAdvances(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to approve advance.')
    } finally {
      setAdvanceActionId(null)
    }
  }

  async function handleRecoverAdvance(advanceId: string) {
    setAdvanceActionId(advanceId)
    try {
      const currentPayroll = payrollRecords.find(r => r.status === 'Paid' || r.status === 'Approved')
      if (!currentPayroll) {
        setError('No approved/paid payroll record available for recovery.')
        return
      }
      await recoverStaffAdvance(advanceId, currentPayroll.netPay)
      const data = await getStaffAdvances()
      setAdvances(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to recover advance.')
    } finally {
      setAdvanceActionId(null)
    }
  }

  function handleStaffSearch(e: FormEvent) {
    e.preventDefault()
    const q = staffSearchQuery.trim().toLowerCase()
    if (!q) return
    const all = Object.values(staffMap)
    const filtered = all.filter(s => s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.staffNumber.toLowerCase().includes(q))
    setStaffSearchResults(filtered)
  }

  function selectStaffForHistory(staff: StaffMember) {
    setSelectedStaffId(staff.id)
    setStaffPaymentHistory([])
  }

  const filteredPayroll = payrollRecords.filter(r => r.month === selectedMonth && r.year === selectedYear)

  const filteredPayments = paymentHistory.filter(p => {
    if (paymentHistoryFilterMethod && p.paymentMethod !== paymentHistoryFilterMethod) return false
    if (paymentHistoryFrom && p.paidAt < paymentHistoryFrom) return false
    if (paymentHistoryTo && p.paidAt > paymentHistoryTo + 'T23:59:59') return false
    return true
  })

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

  function getPayrollStatusColor(status: string): string {
    if (status === 'Paid') return '#059669'
    if (status === 'Approved') return '#2563eb'
    return '#d97706'
  }

  function exportFeeStatement() {
    const rows = [
      ['Fee Type', 'Invoice No.', 'Amount (UGX)', 'Paid (UGX)', 'Balance (UGX)', 'Status'],
      ...invoices.map(inv => [inv.feeType, inv.invoiceNumber, inv.amount, inv.paidAmount, inv.balance, getStatusLabel(inv.balance, inv.paidAmount)]),
      ['Total', '', totalAmount, totalPaid, totalBalance, ''],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fee-statement-${selectedStudentId || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPaymentHistory() {
    const rows = [
      ['Receipt No.', 'Date', 'Amount (UGX)', 'Payment Method', 'Reference'],
      ...filteredPayments.map(p => [p.receiptNumber, p.paidAt, p.amount, p.paymentMethod, p.reference || '']),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-history-${selectedInvoice?.id || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPayrollSummary() {
    const rows = [
      ['Staff Name', 'Staff No.', 'Basic Salary', 'Allowances', 'Deductions', 'Net Pay', 'Status', 'Payment Method'],
      ...filteredPayroll.map(r => {
        const staff = staffMap[r.staffMemberId]
        return [staff ? `${staff.firstName} ${staff.lastName}` : '—', staff?.staffNumber || '—', r.basicSalary, r.allowances, r.deductions, r.netPay, r.status, r.paymentMethod || '']
      }),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-summary-${selectedMonth}-${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
              <select aria-label="Fee Type" value={selectedFeeType} onChange={e => setSelectedFeeType(e.target.value)}>
                <option value="">All Fee Types</option>
                <option value="Tuition">Tuition</option>
                <option value="Functional">Functional</option>
                <option value="Guild">Guild</option>
                <option value="Debt">Debt</option>
                <option value="Requirements">Requirements</option>
                <option value="Placement Fee">Placement Fee</option>
                <option value="Total Fees">Total Fees</option>
              </select>
              <input aria-label="Student ID or code" placeholder="Enter student ID or code" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.85rem' }}>
                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                Show Inactive
              </label>
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

              <div className="topbar-actions" style={{ marginBottom: 10 }}>
                <button type="button" onClick={exportFeeStatement}>Export Fee Statement</button>
                <button type="button" onClick={exportPaymentHistory}>Export Payment History</button>
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
                         const itemsForInvoice = invoiceFeeItems.filter(item => item.currency === inv.currency)
                         return (
                           <React.Fragment key={inv.id}>
                             {itemsForInvoice.length > 0 ? (
                               itemsForInvoice.map((item, idx) => (
                                 <tr key={item.id}>
                                   <td><strong>{idx === 0 ? inv.feeType : ''}</strong></td>
                                   <td>UGX {item.amount.toLocaleString()}</td>
                                   <td style={{ color: '#059669' }}>UGX {item.paidAmount.toLocaleString()}</td>
                                   <td style={{ color: item.balance > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>UGX {item.balance.toLocaleString()}</td>
                                   <td>
                                     <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: statusColor, color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                                       {getStatusLabel(item.balance, item.paidAmount)}
                                     </span>
                                   </td>
                                   <td>
                                     {idx === 0 && inv.balance > 0 && (
                                       <button className="secondary-button" onClick={() => { setSelectedInvoice(inv); setPaymentAmount(''); setReceiptNumber(''); }}>Record Payment</button>
                                     )}
                                   </td>
                                 </tr>
                               ))
                             ) : (
                               <tr key={inv.id}>
                                 <td><strong>{inv.feeType}</strong></td>
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
                             )}
                           </React.Fragment>
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

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">PAYMENTS</span>
                    <h3>Payment History</h3>
                  </div>
                </div>
                <form className="student-form" onSubmit={e => e.preventDefault()} style={{ marginBottom: 15 }}>
                  <div className="form-row">
                    <input type="date" value={paymentHistoryFrom} onChange={e => setPaymentHistoryFrom(e.target.value)} placeholder="From" />
                    <input type="date" value={paymentHistoryTo} onChange={e => setPaymentHistoryTo(e.target.value)} placeholder="To" />
                    <select value={paymentHistoryFilterMethod} onChange={e => setPaymentHistoryFilterMethod(e.target.value)}>
                      <option value="">All Methods</option>
                      <option>Cash</option>
                      <option>Bank</option>
                      <option>Mobile Money</option>
                      <option>Card</option>
                    </select>
                  </div>
                </form>
                <div className="table-wrap">
                  {paymentHistoryLoading ? (
                    <p className="empty">Loading payment history…</p>
                  ) : filteredPayments.length === 0 ? (
                    <p className="empty">No payment history found.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Receipt No.</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Payment Method</th>
                          <th>Reference</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((p, idx) => (
                          <tr key={p.id}>
                            <td>{p.receiptNumber}</td>
                            <td>{new Date(p.paidAt).toLocaleDateString('en-UG')}</td>
                            <td style={{ color: '#059669' }}>UGX {p.amount.toLocaleString()}</td>
                            <td>{p.paymentMethod}</td>
                            <td>{p.reference || '—'}</td>
                            <td>
                              {idx === 0 && (
                                <button className="secondary-button" onClick={() => alert('Undo last payment')}>Undo Last Payment</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">CREDIT NOTE</span>
                    <h3>Issue Credit Note / Refund</h3>
                  </div>
                </div>
                <form onSubmit={handleIssueCreditNote}>
                  <div className="form-row">
                    <label>Credit Note Number<input value={creditNoteNumber} onChange={e => setCreditNoteNumber(e.target.value)} placeholder="CN-001" required /></label>
                    <label>Amount (UGX)<input type="number" min="0.01" step="0.01" placeholder="0.00" value={creditNoteAmount} onChange={e => setCreditNoteAmount(e.target.value)} required /></label>
                    <label>Reason<input value={creditNoteReason} onChange={e => setCreditNoteReason(e.target.value)} placeholder="Reason for credit note" /></label>
                    <label>Issued By<input value={creditNoteIssuedBy} onChange={e => setCreditNoteIssuedBy(e.target.value)} placeholder="Issued by" /></label>
                  </div>
                  <div className="topbar-actions" style={{ marginBottom: 15 }}>
                    <button type="submit">Issue Credit Note</button>
                  </div>
                </form>
                {creditNotesLoading ? (
                  <p className="empty">Loading credit notes…</p>
                ) : creditNotes.length === 0 ? (
                  <p className="empty">No credit notes issued for this invoice.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Credit Note No.</th>
                          <th>Amount</th>
                          <th>Reason</th>
                          <th>Issued By</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditNotes.map(cn => (
                          <tr key={cn.id}>
                            <td>{cn.creditNoteNumber}</td>
                            <td style={{ color: '#059669' }}>UGX {cn.amount.toLocaleString()}</td>
                            <td>{cn.reason}</td>
                            <td>{cn.issuedBy || '—'}</td>
                            <td>{new Date(cn.issuedAt).toLocaleDateString('en-UG')}</td>
                            <td>{cn.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">NOTES</span>
                    <h3>Invoice Notes</h3>
                  </div>
                </div>
                <form onSubmit={handleAddInvoiceNote}>
                  <div className="form-row">
                    <label>Note<input value={invoiceNoteText} onChange={e => setInvoiceNoteText(e.target.value)} placeholder="Add a note..." required /></label>
                    <label>Created By<input value={invoiceNoteCreatedBy} onChange={e => setInvoiceNoteCreatedBy(e.target.value)} placeholder="Created by" /></label>
                  </div>
                  <div className="topbar-actions" style={{ marginBottom: 15 }}>
                    <button type="submit">Add Note</button>
                  </div>
                </form>
                {invoiceNotesLoading ? (
                  <p className="empty">Loading notes…</p>
                ) : invoiceNotes.length === 0 ? (
                  <p className="empty">No notes for this invoice.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Note</th>
                          <th>Created By</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceNotes.map(n => (
                          <tr key={n.id}>
                            <td>{n.note}</td>
                            <td>{n.createdBy || '—'}</td>
                            <td>{new Date(n.createdAt).toLocaleDateString('en-UG')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

          {!selectedStudentId && (
            <div className="empty">
              <p>Search for a student by ID or code to view their fee breakdown and payment options.</p>
            </div>
          )}

          {selectedInvoice && (
            <div className="modal-backdrop" onClick={() => setSelectedInvoice(null)}>
              <form className="auth-card" onSubmit={submitPayment} onClick={e => e.stopPropagation()}>
                <p className="eyebrow">Payment</p>
                <h3>{selectedInvoice.feeType} — {selectedInvoice.invoiceNumber}</h3>
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
              <input aria-label="Staff search" placeholder="Search staff by name or staff no." value={staffSearchQuery} onChange={e => setStaffSearchQuery(e.target.value)} />
              <button type="button" className="secondary-button" onClick={handleStaffSearch}>Search Staff</button>
              {staffSearchResults.length > 0 && (
                <select aria-label="Staff result" onChange={e => { const s = staffSearchResults.find(s => s.id === e.target.value); if (s) selectStaffForHistory(s); }}>
                  <option value="">Select staff</option>
                  {staffSearchResults.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.staffNumber})</option>)}
                </select>
              )}
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

          {selectedStaffId && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">STAFF</span>
                  <h3>Staff Payment History</h3>
                </div>
              </div>
              <div className="table-wrap">
                {staffPaymentHistoryLoading ? (
                  <p className="empty">Loading payment history…</p>
                ) : staffPaymentHistory.length === 0 ? (
                  <p className="empty">No paid payroll records found for selected staff.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Net Pay</th>
                        <th>Payment Method</th>
                        <th>Payment Date</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffPaymentHistory.map(r => (
                        <tr key={r.id}>
                          <td>{monthNames[r.month - 1]} {r.year}</td>
                          <td style={{ color: '#059669', fontWeight: 700 }}>UGX {r.netPay.toLocaleString()}</td>
                          <td>{r.paymentMethod || '—'}</td>
                          <td>{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-UG') : '—'}</td>
                          <td>{r.reference || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          <div className="table-wrap" style={{ marginBottom: 22 }}>
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
                    const statusColor = getPayrollStatusColor(record.status)
                    const method = paymentMethodMap[record.id] || 'Cash'
                    return (
                      <tr key={record.id}>
                        <td><button type="button" className="secondary-button" style={{ background: 'transparent', padding: 0, color: '#2563eb', textDecoration: 'underline' }} onClick={() => setPayrollDetailId(record.id)}>{staff ? `${staff.firstName} ${staff.lastName}` : '—'}</button></td>
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
                          {record.status === 'Pending' || record.status === 'Approved' ? (
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
                            <button className="secondary-button" onClick={() => handleMarkPaid(record.id)} disabled={markingPaidId === record.id}>
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

          <div className="topbar-actions" style={{ marginBottom: 22 }}>
            <button type="button" onClick={exportPayrollSummary}>Export Payroll Summary</button>
          </div>

          <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
            <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
              <div>
                <span className="eyebrow">ADVANCE</span>
                <h3>Advance / Loan Recovery</h3>
              </div>
            </div>
            <form onSubmit={handleRequestAdvance}>
              <div className="form-row">
                <label>Staff<select value={advanceStaffId} onChange={e => setAdvanceStaffId(e.target.value)} required>
                  <option value="">Select staff</option>
                  {Object.values(staffMap).map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.staffNumber})</option>)}
                </select></label>
                <label>Amount (UGX)<input type="number" min="0" step="0.01" placeholder="0.00" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} required /></label>
                <label>Reason<input value={advanceReason} onChange={e => setAdvanceReason(e.target.value)} placeholder="Reason for advance" /></label>
              </div>
              <div className="topbar-actions" style={{ marginBottom: 15 }}>
                <button type="submit">Request Advance</button>
              </div>
            </form>
            {advancesLoading ? (
              <p className="empty">Loading advances…</p>
            ) : advances.length === 0 ? (
              <p className="empty">No advances found.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Requested At</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map(adv => {
                      const staff = staffMap[adv.staffMemberId]
                      return (
                        <tr key={adv.id}>
                          <td>{staff ? `${staff.firstName} ${staff.lastName}` : '—'}</td>
                          <td style={{ color: '#059669' }}>UGX {adv.amount.toLocaleString()}</td>
                          <td>{adv.reason}</td>
                          <td>{new Date(adv.requestedAt).toLocaleDateString('en-UG')}</td>
                          <td>{adv.status}</td>
                          <td>
                            {adv.status === 'Pending' && (
                              <button className="secondary-button" onClick={() => handleApproveAdvance(adv.id)} disabled={advanceActionId === adv.id}>Approve</button>
                            )}
                            {adv.status === 'Approved' && (
                              <button className="secondary-button" onClick={() => handleRecoverAdvance(adv.id)} disabled={advanceActionId === adv.id}>Recover</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {payrollDetailId && (
            <div className="modal-backdrop" onClick={() => setPayrollDetailId(null)}>
              <div className="auth-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <p className="eyebrow">Payroll Detail</p>
                {payrollDetailLoading ? (
                  <p className="empty">Loading…</p>
                ) : payrollDetailError ? (
                  <div className="error" role="alert">{payrollDetailError}</div>
                ) : payrollDetailData ? (
                  <>
                    <h3>{staffMap[payrollDetailData.staffMemberId] ? `${staffMap[payrollDetailData.staffMemberId].firstName} ${staffMap[payrollDetailData.staffMemberId].lastName}` : 'Staff Member'}</h3>
                    <p>Period: {monthNames[payrollDetailData.month - 1]} {payrollDetailData.year}</p>
                    <p>Basic Salary: UGX {payrollDetailData.basicSalary.toLocaleString()}</p>
                    <p>Allowances: UGX {payrollDetailData.allowances.toLocaleString()}</p>
                    <p>Deductions: UGX {payrollDetailData.deductions.toLocaleString()}</p>
                    <p style={{ fontWeight: 700 }}>Net Pay: UGX {payrollDetailData.netPay.toLocaleString()}</p>
                    <p>Status: {payrollDetailData.status}</p>
                    <p>Payment Method: {payrollDetailData.paymentMethod || '—'}</p>
                    <p>Reference: {payrollDetailData.reference || '—'}</p>
                    <p>Payment Date: {payrollDetailData.paymentDate ? new Date(payrollDetailData.paymentDate).toLocaleDateString('en-UG') : '—'}</p>
                    <h4 style={{ marginTop: 20 }}>Staff Advances</h4>
                    {payrollDetailAdvances.length === 0 ? (
                      <p className="empty">No advances for this staff member.</p>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Amount</th>
                              <th>Reason</th>
                              <th>Status</th>
                              <th>Requested At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payrollDetailAdvances.map(adv => (
                              <tr key={adv.id}>
                                <td style={{ color: '#059669' }}>UGX {adv.amount.toLocaleString()}</td>
                                <td>{adv.reason}</td>
                                <td>{adv.status}</td>
                                <td>{new Date(adv.requestedAt).toLocaleDateString('en-UG')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="topbar-actions" style={{ marginTop: 20 }}>
                      <button type="button" onClick={() => window.print()}>Print Payslip</button>
                      <button type="button" className="secondary-button" onClick={() => setPayrollDetailId(null)}>Close</button>
                    </div>
                  </>
                ) : (
                  <p className="empty">No detail available.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
