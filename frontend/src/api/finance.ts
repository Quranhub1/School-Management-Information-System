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
