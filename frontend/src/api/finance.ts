import { getAccessToken } from './auth'

export interface Invoice {
  id: string
  studentId: string
  invoiceNumber: string
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
  amount: number
  currency?: string
}

export interface RecordPaymentRequest {
  amount: number
  receiptNumber: string
  paymentMethod: string
  reference?: string
  currency?: string
}

export interface FinanceDashboard {
  totalBilled: number
  totalPaid: number
  totalOutstanding: number
  todayCollection: number
  invoiceCount: number
  paymentCount: number
  outstandingCount: number
}

export interface OutstandingBalance {
  studentId: string
  studentNumber: string
  studentName: string
  programmeName: string
  balance: number
  currency: string
  status: string
}

export interface FeeStructure {
  id: string
  programmeId: string
  academicYearId: string
  name: string
  totalAmount: number
  currency: string
  isActive: boolean
  createdAt: string
}

export interface MobileMoneyTransaction {
  id: string
  studentId: string
  studentInvoiceId?: string
  transactionRef: string
  provider: string
  phoneNumber: string
  amount: number
  currency: string
  status: string
  externalRef?: string
  errorMessage?: string
  requestedAt: string
  completedAt?: string
}

export interface DailyCollection {
  id: string
  collectionDate: string
  cashierName: string
  cashierUserId?: string
  cashExpected: number
  cashActual: number
  mobileMoneyTotal: number
  bankTotal: number
  cardTotal: number
  transactionCount: number
  currency: string
  status: string
  notes?: string
  createdAt: string
  closedAt?: string
}

export interface Sponsorship {
  id: string
  studentId: string
  sponsorId?: string
  sponsorName: string
  sponsorContact?: string
  sponsorEmail?: string
  sponsorPhone?: string
  amount: number
  currency: string
  type: string
  status: string
  startDate?: string
  endDate?: string
  notes?: string
  createdAt: string
}

export interface InstalmentPlan {
  id: string
  studentInvoiceId: string
  studentId: string
  totalAmount: number
  currency: string
  numberOfInstalments: number
  status: string
  createdAt: string
}

export interface InstalmentPayment {
  id: string
  instalmentPlanId: string
  studentInvoiceId: string
  studentId: string
  instalmentNumber: number
  amount: number
  currency: string
  dueDate: string
  paidAt?: string
  status: string
  receiptNumber?: string
  paymentMethod?: string
  reference?: string
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

export const getDashboard = () => request<FinanceDashboard>('/api/finance/dashboard')
export const getOutstandingBalances = (programmeId?: string) => request<OutstandingBalance[]>('/api/finance/outstanding' + (programmeId ? `?programmeId=${encodeURIComponent(programmeId)}` : ''))
export const getFeeStructures = (academicYearId?: string) => request<FeeStructure[]>('/api/finance/fee-structures' + (academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : ''))
export const createFeeStructure = (body: { programmeId: string; academicYearId: string; name: string; totalAmount: number; currency?: string }) => request<FeeStructure>('/api/finance/fee-structures', { method: 'POST', body: JSON.stringify(body) })
export const createMobileMoneyTransaction = (body: { studentId: string; studentInvoiceId?: string; provider: string; phoneNumber: string; amount: number }) => request<MobileMoneyTransaction>('/api/finance/mobile-money', { method: 'POST', body: JSON.stringify(body) })
export const confirmMobileMoneyTransaction = (transactionId: string, externalRef: string) => request(`/api/finance/mobile-money/${transactionId}/confirm`, { method: 'POST', body: JSON.stringify({ externalRef }) })
export const getMobileMoneyTransactions = (status?: string) => request<MobileMoneyTransaction[]>('/api/finance/mobile-money' + (status ? `?status=${encodeURIComponent(status)}` : ''))
export const createBulkPayment = (body: { payments: Array<{ studentId: string; invoiceId: string; amount: number; receiptNumber: string; paymentMethod: string; reference?: string }> }) => request('/api/finance/bulk-payments', { method: 'POST', body: JSON.stringify(body) })
export const getDailyCollections = (from?: string, to?: string) => request<DailyCollection[]>('/api/finance/daily-collections' + (from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ''))
export const createDailyCollection = (body: { cashierName: string; cashierUserId?: string; collectionDate: string }) => request<DailyCollection>('/api/finance/daily-collections', { method: 'POST', body: JSON.stringify(body) })
export const addPaymentToDailyCollection = (collectionId: string, body: { studentInvoiceId: string; studentId: string; amount: number; paymentMethod: string; receiptNumber?: string; reference?: string }) => request(`/api/finance/daily-collections/${collectionId}/payments`, { method: 'POST', body: JSON.stringify(body) })
export const closeDailyCollection = (collectionId: string) => request(`/api/finance/daily-collections/${collectionId}/close`, { method: 'POST' })
export const getSponsorships = (studentId?: string) => request<Sponsorship[]>('/api/finance/sponsorships' + (studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''))
export const createSponsorship = (body: { studentId: string; sponsorName: string; amount: number; type: string; startDate?: string; endDate?: string; notes?: string }) => request<Sponsorship>('/api/finance/sponsorships', { method: 'POST', body: JSON.stringify(body) })
export const getInstalmentPlans = (studentId: string) => request<InstalmentPlan[]>('/api/finance/instalment-plans?studentId=' + encodeURIComponent(studentId))
export const createInstalmentPlan = (body: { studentInvoiceId: string; studentId: string; numberOfInstalments: number }) => request<InstalmentPlan>('/api/finance/instalment-plans', { method: 'POST', body: JSON.stringify(body) })
export const getPayments = (receiptNumber?: string, paymentMethod?: string, from?: string, to?: string) => request<{ id: string; receiptNumber: string; amount: number; paymentMethod: string; paidAt: string }[]>('/api/finance/payments' + (receiptNumber ? `?receiptNumber=${encodeURIComponent(receiptNumber)}` : '') + (paymentMethod ? `${receiptNumber ? '&' : '?'}paymentMethod=${encodeURIComponent(paymentMethod)}` : '') + (from ? `${receiptNumber || paymentMethod ? '&' : '?'}from=${encodeURIComponent(from)}` : '') + (to ? `${receiptNumber || paymentMethod || from ? '&' : '?'}to=${encodeURIComponent(to)}` : ''))
