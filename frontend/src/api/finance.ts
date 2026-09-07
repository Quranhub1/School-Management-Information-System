import { getAccessToken } from './auth'

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
  reference?: string
  currency?: string
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage finance.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getInvoices = (studentId?: string) => request<Invoice[]>(`/api/finance/invoices${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`)
export const createInvoice = (body: CreateInvoiceRequest) => request<Invoice>('/api/finance/invoices', { method: 'POST', body: JSON.stringify(body) })
export const recordPayment = (invoiceId: string, body: RecordPaymentRequest) => request('/api/finance/invoices/' + invoiceId + '/payments', { method: 'POST', body: JSON.stringify(body) })

export const getBudgets = (params?: { departmentId?: string; academicYearId?: string; activeOnly?: boolean }) => {
  const query = new URLSearchParams()
  if (params?.departmentId) query.set('departmentId', params.departmentId)
  if (params?.academicYearId) query.set('academicYearId', params.academicYearId)
  if (params?.activeOnly !== undefined) query.set('activeOnly', String(params.activeOnly))
  return request<Budget[]>(`/api/finance/administration/budgets${query.toString() ? `?${query}` : ''}`)
}

export const getBankReconciliations = (bankAccountId?: string) =>
  request<BankReconciliation[]>(`/api/finance/administration/bank-reconciliations${bankAccountId ? `?bankAccountId=${encodeURIComponent(bankAccountId)}` : ''}`)

export const getBankStatementLines = (reconciliationId: string) =>
  request<BankStatementLine[]>(`/api/finance/administration/bank-reconciliations/${reconciliationId}/lines`)

export const closeBankReconciliation = (reconciliationId: string) =>
  request<BankReconciliation>(`/api/finance/administration/bank-reconciliations/${reconciliationId}/close`, { method: 'POST' })

export const getReceivablesAgeing = (asOf?: string, currency = 'UGX') =>
  request(`/api/finance/reports/receivables-ageing?currency=${encodeURIComponent(currency)}${asOf ? `&asOf=${encodeURIComponent(asOf)}` : ''}`)

export const getReceivablesReconciliation = (asOf?: string, currency = 'UGX') =>
  request(`/api/finance/reports/receivables-reconciliation?currency=${encodeURIComponent(currency)}${asOf ? `&asOf=${encodeURIComponent(asOf)}` : ''}`)

export async function addInvoiceNote(invoiceId: string, note: string, createdBy?: string) { return request<void>('/api/finance/invoices/' + invoiceId + '/notes', { method: 'POST', body: JSON.stringify({ note, createdBy }) }) }
export async function getInvoiceNotes(invoiceId: string) { return request<any[]>(`/api/finance/invoices/${invoiceId}/notes`) }
export async function requestStaffAdvance(staffMemberId: string, amount: number, reason: string) { return request<any>(`/api/finance/staff/${staffMemberId}/advances`, { method: 'POST', body: JSON.stringify({ amount, reason }) }) }
export async function approveStaffAdvance(advanceId: string, approvedBy: string, approved: boolean) { return request<void>(`/api/finance/staff/advances/${advanceId}/approve`, { method: 'PATCH', body: JSON.stringify({ approvedBy, approved }) }) }
export async function recoverStaffAdvance(advanceId: string, amount: number) { return request<void>(`/api/finance/staff/advances/${advanceId}/recover`, { method: 'POST', body: JSON.stringify({ amount }) }) }
export async function getStaffAdvances(staffMemberId?: string) { return request<any[]>(`/api/finance/staff/advances${staffMemberId ? `?staffMemberId=${encodeURIComponent(staffMemberId)}` : ''}`) }
export async function getInvoiceFeeItems(invoiceId: string) { return request<any[]>(`/api/finance/invoices/${invoiceId}/fee-items`) }

export interface OutstandingBalance { studentId: string; studentNumber: string; studentName: string; programmeName: string; amount: number; paidAmount: number; balance: number; currency: string; status: string }
export async function getOutstandingBalances() { return request<OutstandingBalance[]>('/api/finance/reports/outstanding-balances') }

export interface FeeStructure { id: string; name: string; category: string; feeType: string; amount: number; totalAmount: number; currency: string; programmeId?: string; academicYearId?: string; isActive: boolean }
export async function createFeeStructure(body: Partial<FeeStructure>) { return request<FeeStructure>('/api/finance/administration/fee-structures', { method: 'POST', body: JSON.stringify(body) }) }
export async function getFeeStructures(academicYearId?: string) { return request<FeeStructure[]>(`/api/finance/administration/fee-structures${academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : ''}`) }

export interface AccountsOverviewDashboard { totalRevenue: number; totalPayments: number; totalOutstanding: number; totalAdvances: number; totalBilled: number; totalPaid: number; todayCollection: number; invoiceCount: number; paymentCount: number; outstandingCount: number; currency: string }
export interface AccountsOverviewOutstanding { studentId: string; studentNumber: string; studentName: string; programmeName: string; balance: number; status: string; currency: string }
export interface AccountsOverviewPayment { id: string; receiptNumber: string; studentName: string; invoiceNumber: string; amount: number; paymentMethod: string; paidAt: string }
export interface AccountsOverviewPayroll { id: string; staffName: string; staffNumber: string; basicSalary: number; allowances: number; deductions: number; netPay: number; status: string; paymentMethod: string }
export async function getAccountsOverviewDashboard() { return request<AccountsOverviewDashboard>('/api/finance/administration/accounts-overview/dashboard') }
export async function getAccountsOverviewOutstanding() { return request<AccountsOverviewOutstanding[]>('/api/finance/administration/accounts-overview/outstanding') }
export async function getAccountsOverviewPayments() { return request<AccountsOverviewPayment[]>('/api/finance/administration/accounts-overview/payments') }
export async function getAccountsOverviewPayroll(month?: number, year?: number) { return request<AccountsOverviewPayroll[]>(`/api/finance/administration/accounts-overview/payroll${month ? `?month=${month}` : ''}${year ? `&year=${year}` : ''}`) }

export interface FinanceDashboard { revenue: number; payments: number; outstanding: number; totalOutstanding: number; currency: string; totalBilled: number; totalPaid: number; todayCollection: number; invoiceCount: number; paymentCount: number; outstandingCount: number }
export async function getDashboard() { return request<FinanceDashboard>('/api/finance/dashboard') }
export async function getPayments(studentId?: string) { return request<any[]>(`/api/finance/payments${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`) }

export interface MobileMoneyTransaction { id: string; studentId: string; studentInvoiceId?: string; amount: number; currency: string; provider: string; status: string; reference: string; transactionRef?: string; phoneNumber?: string; requestedAt: string; createdAt: string }
export async function createMobileMoneyTransaction(body: Partial<MobileMoneyTransaction>) { return request<MobileMoneyTransaction>('/api/finance/mobile-money', { method: 'POST', body: JSON.stringify(body) }) }
export async function confirmMobileMoneyTransaction(transactionId: string, ref?: string) { return request<MobileMoneyTransaction>(`/api/finance/mobile-money/${transactionId}/confirm`, { method: 'POST', body: JSON.stringify({ ref }) }) }
export async function getMobileMoneyTransactions(status?: string) { return request<MobileMoneyTransaction[]>(`/api/finance/mobile-money${status ? `?status=${encodeURIComponent(status)}` : ''}`) }

export async function createBulkPayment(body: { payments: { studentId: string; amount: number; paymentMethod: string; reference?: string }[] }) { return request<any>('/api/finance/payments/bulk', { method: 'POST', body: JSON.stringify(body) }) }
export async function issueCreditNote(invoiceId: string, body: { amount: number; reason: string }) { return request<any>('/api/finance/invoices/' + invoiceId + '/credit-notes', { method: 'POST', body: JSON.stringify(body) }) }
export async function getCreditNotes(invoiceId?: string) { return request<any[]>(`/api/finance/credit-notes${invoiceId ? `?invoiceId=${encodeURIComponent(invoiceId)}` : ''}`) }
