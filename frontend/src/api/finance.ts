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
