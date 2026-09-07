import { getAccessToken } from './auth'

export interface PaymentSearchResult {
  id: string
  receiptNumber: string
  amount: number
  paymentMethod: string
  reference: string
  paidAt: string
  studentName: string
  invoiceNumber: string
}

export interface FeeReceipt {
  id: string
  studentInvoiceId: string
  invoiceNumber: string
  studentId: string
  receiptNumber: string
  amount: number
  currency: string
  paymentMethod: string
  reference: string
  paidAt: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view receipts.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const searchPayments = (receiptNumber?: string, paymentMethod?: string, from?: string, to?: string) => {
  const params = new URLSearchParams()
  if (receiptNumber) params.set('receiptNumber', receiptNumber)
  if (paymentMethod) params.set('paymentMethod', paymentMethod)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return request<PaymentSearchResult[]>(`/api/accounts-overview/payments${qs ? `?${qs}` : ''}`)
}

export const getPaymentReceipt = (paymentId: string) => request<FeeReceipt>(`/api/reports/payment/${encodeURIComponent(paymentId)}/receipt`)
