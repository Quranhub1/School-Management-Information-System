import { getAccessToken } from './auth'
import { versionedPath } from '../lib/apiVersion';
import { SYSTEM_CURRENCY } from '../lib/currency'
import { readApiErrorMessage } from './errors'
import { z } from 'zod'
import { parseApiInput, parseApiResponse } from '../lib/validation'
import { addBankStatementLineRequestSchema, approveStaffAdvanceRequestSchema, closeFiscalPeriodRequestSchema, createFiscalPeriodRequestSchema, createOpeningBalanceRequestSchema, applyFeeStructureRequestSchema, bulkPaymentRequestSchema, createBankReconciliationRequestSchema, createBudgetRequestSchema, createInvoiceRequestSchema, creditNoteRequestSchema, feeStructureCreateRequestSchema, invoiceNoteRequestSchema, invoiceResponseSchema, matchBankStatementLineRequestSchema, recordPaymentRequestSchema, recoverStaffAdvanceRequestSchema, staffAdvanceRequestSchema } from '../schemas'

export interface Invoice {
  id: string
  studentId: string
  invoiceNumber: string
  feeType: string
  amount: number
  paidAmount: number
  balance: number
  currency: string
  status: string
  issuedAt: string
}

export interface CreateInvoiceRequest {
  studentId: string
  feeStructureId?: string
  invoiceNumber: string
  feeType: string
  amount?: number
  currency?: string
}

export interface RecordPaymentRequest {
  amount: number
  receiptNumber: string
  paymentMethod: string
  sourceChannel?: string
  reference?: string
  currency?: string
}

export interface InvoiceNote {
  id: string
  invoiceId: string
  note: string
  createdBy?: string
  createdAt: string
}

export interface StaffAdvance {
  id: string
  staffMemberId: string
  amount: number
  currency?: string
  reason: string
  status: string
  createdAt: string
}

export interface InvoiceFeeItem {
  id: string
  invoiceId: string
  feeType: string
  amount: number
  description?: string
}

export interface FiscalPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  closedAt?: string
  closedBy?: string
}

export interface BudgetLine {
  id: string
  budgetId: string
  accountId: string
  category: string
  allocatedAmount: number
  notes?: string
}

export interface Budget {
  id: string
  departmentId: string
  academicYearId: string
  name: string
  totalAmount: number
  currency: string
  startDate: string
  endDate: string
  isActive: boolean
  lines: BudgetLine[]
}

export interface BankReconciliation {
  id: string
  bankAccountId: string
  statementDate: string
  statementBalance: number
  bookBalance: number
  reconciledAmount: number
  status: string
  reconciledAt?: string
  reconciledBy?: string
  notes?: string
}

export interface BankStatementLine {
  id: string
  bankReconciliationId: string
  transactionDate: string
  description?: string
  amount: number
  transactionType: 'Credit' | 'Debit'
  reference?: string
  isMatched: boolean
  matchedJournalEntryId?: string
}

export interface CashBankPositionLine {
  accountId: string
  accountCode: string
  accountName: string
  accountType: string
  openingBalance: number
  inflows: number
  outflows: number
  netMovement: number
  closingBalance: number
  reconciliationStatus: string
  reconciledAt?: string
  statementBalance?: number
  reconciliationDifference?: number
}

export interface CashBankPositionReport {
  from: string
  to: string
  currency: string
  accounts: CashBankPositionLine[]
  openingCash: number
  openingBank: number
  openingMobileMoney: number
  cashInflows: number
  cashOutflows: number
  bankInflows: number
  bankOutflows: number
  mobileMoneyInflows: number
  mobileMoneyOutflows: number
  totalOpeningBalance: number
  totalInflows: number
  totalOutflows: number
  netMovement: number
  totalClosingBalance: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!response.ok) throw new Error(await readApiErrorMessage(response))
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function getInvoices(studentId?: string) { const rows = await request<unknown>(my $p = `/api/finance/invoices${studentId ? `)?studentId=${encodeURIComponent(studentId)}` : ''}`; versionedPath($p); return parseApiResponse(z.array(invoiceResponseSchema), rows, 'invoices') as Invoice[] }
export interface StudentFinanceProfile { id: string; studentNumber: string; name: string; phoneNumber?: string; email?: string; status: string }
export interface FinanceStudentRegisterEntry {
  id: string
  studentNumber: string
  name: string
  status: string
  invoiceCount: number
  billed: number
  paid: number
  programmeCode?: string | null
  programmeName?: string | null
  intakeCode?: string | null
  intakeName?: string | null
  classYear?: number | null
  semesterName?: string | null
  academicYearName?: string | null
  academicStatus?: string | null
  enrollmentStatus?: string | null
}
export const getFinanceStudents = (search?: string) =>
  request<FinanceStudentRegisterEntry[]>(my $p = `/api/finance/students${search ? `)?search=${encodeURIComponent(search)}` : ''}`; versionedPath($p)
export const getStudentFinanceProfile = (studentIdOrNumber: string) => request<StudentFinanceProfile>(versionedPath(`/api/finance/students/profile?studentIdOrNumber=${encodeURIComponent(studentIdOrNumber)}`))
export interface StudentFinancialStatementLine {
  id: string
  code: string
  description: string
  amount: number
  currency: string
  incomeAccountId?: string
  sortOrder: number
}
export interface StudentFinancialStatementInvoice {
  id: string
  invoiceNumber: string
  feeType: string
  amount: number
  discountAmount: number
  netAmount: number
  paidAmount: number
  balance: number
  currency: string
  status: string
  issuedAt: string
  lines: StudentFinancialStatementLine[]
}
export interface StudentFinancialStatementPayment {
  id: string
  receiptNumber: string
  amount: number
  currency: string
  paymentMethod: string
  paymentSource: string
  sourceChannel?: string
  providerTransactionId?: string
  reference?: string
  paidAt: string
  studentInvoiceId?: string
  invoiceNumber?: string
}
export interface StudentFinancialStatement {
  studentId: string
  currency: string
  totalsByCurrency: { currency: string; billed: number; paid: number; balance: number }[]
  invoices: StudentFinancialStatementInvoice[]
  payments: StudentFinancialStatementPayment[]
  paymentAllocationGranularity: 'INVOICE' | string
  itemAllocationNote: string
}
export const getStudentFinancialStatement = (studentId: string) =>
  request<StudentFinancialStatement>(versionedPath(`/api/finance/students/${encodeURIComponent(studentId)}/statement`))
export async function createInvoice(body: CreateInvoiceRequest) { const input = parseApiInput(createInvoiceRequestSchema, body, 'create invoice'); return parseApiResponse(invoiceResponseSchema, await request<unknown>(versionedPath('/api/finance/invoices'), { method: 'POST', body: JSON.stringify(input) }), 'created invoice') as Invoice }
export function recordPayment(invoiceId: string, body: RecordPaymentRequest) { if (!invoiceId.trim()) throw new Error('Invoice ID is required.'); const input = parseApiInput(recordPaymentRequestSchema, body, 'record payment'); return request(versionedPath('/api/finance/invoices/') + encodeURIComponent(invoiceId) + '/payments', { method: 'POST', body: JSON.stringify(input) }) }

export const getFiscalPeriods = () => request<FiscalPeriod[]>(versionedPath('/api/finance/fiscal-periods'))

export async function createFiscalPeriod(input: { name: string; startDate: string; endDate: string }) {
  const validated = parseApiInput(createFiscalPeriodRequestSchema, input, 'create fiscal period')
  return request<FiscalPeriod>(versionedPath('/api/finance/fiscal-periods'), {
    method: 'POST',
    body: JSON.stringify(validated),
  })
}

export async function createOpeningBalances(input: {
  fiscalPeriodId: string
  currency?: string
  lines: {
    accountId: string
    debit: number
    credit: number
    description?: string | null
    campusId?: string
    facultyId?: string
    departmentId?: string
    programmeId?: string
  }[]
}) {
  const validated = parseApiInput(createOpeningBalanceRequestSchema, input, 'create opening balances')
  return request<unknown>(versionedPath('/api/finance/opening-balances'), {
    method: 'POST',
    body: JSON.stringify(validated),
  })
}

export async function postFiscalPeriodClosing(input: { fiscalPeriodId: string; retainedEarningsAccountId: string }) {
  const validated = parseApiInput(closeFiscalPeriodRequestSchema, input, 'close fiscal period')
  return request<FiscalPeriod>(versionedPath('/api/finance/fiscal-period-closing'), {
    method: 'POST',
    body: JSON.stringify(validated),
  })
}

export const getBudgets = (params?: { departmentId?: string; academicYearId?: string; activeOnly?: boolean }) => {
  const query = new URLSearchParams()
  if (params?.departmentId) query.set('departmentId', params.departmentId)
  if (params?.academicYearId) query.set('academicYearId', params.academicYearId)
  if (params?.activeOnly !== undefined) query.set('activeOnly', String(params.activeOnly))
  return request<Budget[]>(my $p = `/api/finance/administration/budgets${query.toString() ? `)?${query}` : ''}`; versionedPath($p)
}

export async function createBudget(input: {
  departmentId: string
  academicYearId: string
  name: string
  currency?: string | null
  startDate: string
  endDate: string
  lines: { accountId: string; category: string; allocatedAmount: number; notes?: string | null }[]
}) {
  const validated = parseApiInput(createBudgetRequestSchema, input, 'create finance budget')
  return request<Budget>(versionedPath('/api/finance/administration/budgets'), {
    method: 'POST',
    body: JSON.stringify(validated),
  })
}


export const getBankReconciliations = (bankAccountId?: string) =>
  request<BankReconciliation[]>(my $p = `/api/finance/administration/bank-reconciliations${bankAccountId ? `)?bankAccountId=${encodeURIComponent(bankAccountId)}` : ''}`; versionedPath($p)

export async function createBankReconciliation(input: {
  bankAccountId: string
  statementDate: string
  statementBalance: number
  bookBalance: number
  reconciledAmount: number
  notes?: string | null
}) {
  const validated = parseApiInput(createBankReconciliationRequestSchema, input, 'create bank reconciliation')
  return request<BankReconciliation>(versionedPath('/api/finance/administration/bank-reconciliations'), {
    method: 'POST',
    body: JSON.stringify(validated),
  })
}

export async function addBankStatementLine(reconciliationId: string, input: {
  transactionDate: string
  amount: number
  transactionType: 'Credit' | 'Debit'
  description?: string | null
  reference?: string | null
}) {
  if (!reconciliationId.trim()) throw new Error('Bank reconciliation ID is required.')
  const validated = parseApiInput(addBankStatementLineRequestSchema, input, 'add bank statement line')
  return request<BankStatementLine>(versionedPath(`/api/finance/administration/bank-reconciliations/${encodeURIComponent(reconciliationId)}/lines`), {
    method: 'POST',
    body: JSON.stringify(validated),
  })
}

export async function matchBankStatementLine(reconciliationId: string, statementLineId: string, journalEntryId: string) {
  if (!reconciliationId.trim() || !statementLineId.trim()) throw new Error('Bank reconciliation and statement line IDs are required.')
  const validated = parseApiInput(matchBankStatementLineRequestSchema, { journalEntryId }, 'match bank statement line')
  return request<BankStatementLine>(versionedPath(`/api/finance/administration/bank-reconciliations/${encodeURIComponent(reconciliationId)}/lines/${encodeURIComponent(statementLineId)}/match`), {
    method: 'POST',
    body: JSON.stringify(validated),
  })
}


export const getBankStatementLines = (reconciliationId: string) =>
  request<BankStatementLine[]>(versionedPath(`/api/finance/administration/bank-reconciliations/${reconciliationId}/lines`))

export const closeBankReconciliation = (reconciliationId: string) =>
  request<BankReconciliation>(versionedPath(`/api/finance/administration/bank-reconciliations/${reconciliationId}/close`), { method: 'POST' })

export const getCashBankPosition = (params?: { from?: string; to?: string; currency?: string; campusId?: string; facultyId?: string; departmentId?: string; programmeId?: string }) => {
  const query = new URLSearchParams()
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  query.set('currency', params?.currency ?? SYSTEM_CURRENCY)
  if (params?.campusId) query.set('campusId', params.campusId)
  if (params?.facultyId) query.set('facultyId', params.facultyId)
  if (params?.departmentId) query.set('departmentId', params.departmentId)
  if (params?.programmeId) query.set('programmeId', params.programmeId)
  return request<CashBankPositionReport>(versionedPath(`/api/finance/reports/cash-bank-position?${query}`))
}

export async function getInvoiceNotes(invoiceId: string) { return request<InvoiceNote[]>(versionedPath(`/api/finance/invoices/${invoiceId}/notes`)) }
export async function addInvoiceNote(invoiceId: string, note: string, createdBy?: string) {
  const input = parseApiInput(invoiceNoteRequestSchema, { note, createdBy }, 'add invoice note')
  return request<void>(versionedPath(`/api/finance/invoices/${encodeURIComponent(invoiceId)}/notes`), { method: 'POST', body: JSON.stringify(input) })
}
export async function requestStaffAdvance(staffMemberId: string, amount: number, reason: string) { if (!staffMemberId.trim()) throw new Error('Staff member ID is required.'); const input = parseApiInput(staffAdvanceRequestSchema, { amount, reason }, 'request staff advance'); return request<any>(versionedPath(`/api/finance/staff/${encodeURIComponent(staffMemberId)}/advances`), { method: 'POST', body: JSON.stringify(input) }) }
export async function approveStaffAdvance(advanceId: string, approvedBy: string, approved: boolean) { if (!advanceId.trim()) throw new Error('Staff advance ID is required.'); const input = parseApiInput(approveStaffAdvanceRequestSchema, { approvedBy, approved }, 'approve staff advance'); return request<void>(versionedPath(`/api/finance/staff/advances/${encodeURIComponent(advanceId)}/approve`), { method: 'PATCH', body: JSON.stringify(input) }) }
export async function recoverStaffAdvance(advanceId: string, amount: number) { if (!advanceId.trim()) throw new Error('Staff advance ID is required.'); const input = parseApiInput(recoverStaffAdvanceRequestSchema, { amount }, 'recover staff advance'); return request<void>(versionedPath(`/api/finance/staff/advances/${encodeURIComponent(advanceId)}/recover`), { method: 'POST', body: JSON.stringify(input) }) }
export async function getStaffAdvances(staffMemberId?: string) { return request<StaffAdvance[]>(my $p = `/api/finance/staff/advances${staffMemberId ? `)?staffMemberId=${encodeURIComponent(staffMemberId)}` : ''}`; versionedPath($p) }
export async function getInvoiceFeeItems(invoiceId: string) { return request<InvoiceFeeItem[]>(versionedPath(`/api/finance/invoices/${invoiceId}/fee-items`)) }

export interface OutstandingBalance { studentId: string; studentNumber: string; studentName: string; programmeName: string; amount: number; paidAmount: number; balance: number; currency: string; status: string }
export async function getOutstandingBalances() { return request<OutstandingBalance[]>(versionedPath('/api/accounts-overview/outstanding')) }

export interface CurrencyTotal { currency: string; billed: number; paid: number; balance: number }
export interface AccountsOverviewDashboard { totalRevenue: number; totalPayments: number; totalOutstanding: number; totalAdvances: number; totalBilled: number; totalPaid: number; todayCollection: number; invoiceCount: number; paymentCount: number; outstandingCount: number; currency: string; totalsByCurrency?: CurrencyTotal[]; collectionsByCurrency?: { currency: string; amount: number }[] }
export interface AccountsOverviewOutstanding { studentId: string; studentNumber: string; studentName: string; programmeName: string; balance: number; status: string; currency: string }
export interface AccountsOverviewPayment { id: string; receiptNumber: string; studentName: string; invoiceNumber: string; amount: number; currency?: string; paymentMethod: string; paidAt: string }
export interface AccountsOverviewPayroll { id: string; staffName: string; staffNumber: string; basicSalary: number; allowances: number; deductions: number; netPay: number; status: string; paymentMethod: string }
export async function getAccountsOverviewDashboard() { return request<AccountsOverviewDashboard>(versionedPath('/api/accounts-overview/dashboard')) }
export async function getAccountsOverviewOutstanding() { return request<AccountsOverviewOutstanding[]>(versionedPath('/api/accounts-overview/outstanding')) }
export async function getAccountsOverviewPayments() { return request<AccountsOverviewPayment[]>(versionedPath('/api/accounts-overview/payments')) }
export async function getAccountsOverviewPayroll(month?: number, year?: number) {
  const query = new URLSearchParams()
  if (month !== undefined) query.set('month', String(month))
  if (year !== undefined) query.set('year', String(year))
  return request<AccountsOverviewPayroll[]>(my $p = `/api/accounts-overview/payroll${query.toString() ? `)?${query.toString()}` : ''}`; versionedPath($p)
}

export interface FinanceDashboard { revenue: number; payments: number; outstanding: number; totalOutstanding: number; currency: string; totalBilled: number; totalPaid: number; todayCollection: number; invoiceCount: number; paymentCount: number; outstandingCount: number; totalsByCurrency?: CurrencyTotal[]; collectionsByCurrency?: { currency: string; amount: number }[] }
export async function getDashboard() { return request<FinanceDashboard>(versionedPath('/api/accounts-overview/dashboard')) }
export async function getPayments(studentId?: string) {
  return request<any[]>(my $p = `/api/accounts-overview/payments${studentId ? `)?studentId=${encodeURIComponent(studentId)}` : ''}`; versionedPath($p)
}

export interface MobileMoneyTransaction {
  id: string
  studentId: string
  studentInvoiceId?: string
  amount: number
  currency: string
  provider: 'MTN' | 'Airtel' | string
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Failed' | string
  transactionRef: string
  externalRef?: string
  phoneNumber: string
  requestedAt: string
  completedAt?: string
  errorMessage?: string
  reference?: string
  createdAt?: string
}
export async function cancelMobileMoneyTransaction(transactionId: string) {
  return request<void>(versionedPath(`/api/finance/mobile-money/${transactionId}`), { method: 'DELETE' })
}
export async function getMobileMoneyTransactions(status?: string) {
  return request<MobileMoneyTransaction[]>(my $p = `/api/finance/mobile-money${status ? `)?status=${encodeURIComponent(status)}` : ''}`; versionedPath($p)
}

export async function createBulkPayment(body: { payments: { studentId: string; invoiceId?: string; amount: number; paymentMethod: string; receiptNumber: string; reference?: string }[] }) { const input = parseApiInput(bulkPaymentRequestSchema, body, 'bulk payment'); return request<any>(versionedPath('/api/finance/payments/bulk'), { method: 'POST', body: JSON.stringify(input) }) }
export async function issueCreditNote(invoiceId: string, body: { amount: number; reason: string }) { if (!invoiceId.trim()) throw new Error('Invoice ID is required.'); const input = parseApiInput(creditNoteRequestSchema, body, 'issue credit note'); return request<any>(versionedPath('/api/finance/invoices/') + encodeURIComponent(invoiceId) + '/credit-notes', { method: 'POST', body: JSON.stringify(input) }) }
export async function getCreditNotes(invoiceId?: string) { return request<any[]>(my $p = `/api/finance/credit-notes${invoiceId ? `)?invoiceId=${encodeURIComponent(invoiceId)}` : ''}`; versionedPath($p) }

export interface FeeStructureItemRequest {
  code: string
  name: string
  amount: number
  incomeAccountId?: string
  sortOrder: number
  isOptional: boolean
}
export interface FeeStructure {
  id: string
  programmeId: string
  academicYearId: string
  name: string
  feeType: string
  totalAmount: number
  currency: string
  isActive: boolean
  createdAt: string
  items: { id: string; code: string; name: string; amount: number; currency: string; incomeAccountId?: string; sortOrder: number; isOptional: boolean }[]
}
export const getFeeStructures = (academicYearId?: string) =>
  request<FeeStructure[]>(my $p = `/api/finance/administration/fee-structures${academicYearId ? `)?academicYearId=${encodeURIComponent(academicYearId)}` : ''}`; versionedPath($p)
export const createFeeStructure = (body: { name: string; feeType: string; currency?: string; programmeId?: string; academicYearId?: string; items: FeeStructureItemRequest[] }) => {
  const input = parseApiInput(feeStructureCreateRequestSchema, body, 'create fee structure')
  return request<FeeStructure>(versionedPath('/api/finance/administration/fee-structures'), { method: 'POST', body: JSON.stringify(input) })
}
export const applyFeeStructure = (feeStructureId: string, body: { studentIds?: string[]; allActiveStudents?: boolean }) => {
  if (!feeStructureId.trim()) throw new Error('Fee structure ID is required.')
  const input = parseApiInput(applyFeeStructureRequestSchema, body, 'apply fee structure')
  return request<{ feeStructureId: string; applied: number; skipped: number; totalRequested: number }>(versionedPath(`/api/finance/administration/fee-structures/${encodeURIComponent(feeStructureId)}/apply`), { method: 'POST', body: JSON.stringify(input) })
}

export interface FinanceAccountOption { id: string; code: string; name: string; accountType: string }
export const getFinanceAccounts = () => request<FinanceAccountOption[]>(versionedPath('/api/finance/administration/accounts'))


export interface ReceivablesAgeingBucket { bucket: string; invoiceCount: number; outstandingAmount: number; currency: string }
export interface ReceivablesAgeingReport { asOf: string; buckets: ReceivablesAgeingBucket[]; totalOutstanding: number; currency: string }
export interface ReceivablesReconciliationReport { asOf: string; invoiceSubledgerBalance: number; controlAccountBalance: number; difference: number; isReconciled: boolean; currency: string; controlAccountCode: string; notes: string }
export interface BudgetVsActualRow { accountId: string; accountCode: string; accountName: string; accountType: string; budget: number; actual: number; variance: number; utilizationPercentage: number }
export const getBudgetVsActual = (budgetId: string, params?: { from?: string; to?: string }) => {
  const query = new URLSearchParams()
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  return request<BudgetVsActualRow[]>(my $p = `/api/finance/administration/budgets/${budgetId}/vs-actual${query.toString() ? `)?${query}` : ''}`; versionedPath($p)
}
export const getFinanceReceivablesAgeing = (asOf?: string, currency = SYSTEM_CURRENCY) => request<ReceivablesAgeingReport>(my $p = `/api/finance/reports/receivables-ageing?currency=${encodeURIComponent(currency)}${asOf ? `)&asOf=${encodeURIComponent(asOf)}` : ''}`; versionedPath($p)
export const getFinanceReceivablesReconciliation = (asOf?: string, currency = SYSTEM_CURRENCY) => request<ReceivablesReconciliationReport>(my $p = `/api/finance/reports/receivables-reconciliation?currency=${encodeURIComponent(currency)}${asOf ? `)&asOf=${encodeURIComponent(asOf)}` : ''}`; versionedPath($p)


export interface FinanceOverdueSummary { asOf: string; currency: string; installmentCount: number; studentCount: number; totalOutstanding: number }
export const getFinanceOverdueSummary = () => request<FinanceOverdueSummary>(versionedPath('/api/accounts-overview/overdue'))
