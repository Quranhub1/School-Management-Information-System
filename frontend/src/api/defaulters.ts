import { getAccessToken } from './auth'
import { versionedPath } from '../lib/apiVersion';

export interface DefaulterOverview {
  totalOutstanding: number
  totalDefaulters: number
  criticalCount: number
  warningCount: number
}

export interface Defaulter {
  studentId: string
  studentNumber: string | null
  studentName: string | null
  totalBalance: number
  currency: string
  oldestInvoice: string
  invoiceCount: number
  severity: string
}

export interface DefaulterDetail {
  studentId: string
  studentNumber: string | null
  studentName: string | null
  totalBalance: number
  balancesByCurrency?: Array<{ currency: string; balance: number }>
  invoices: Array<{
    id: string
    invoiceNumber: string
    feeType: string
    amount: number
    paidAmount: number
    balance: number
    currency: string
    status: string
    issuedAt: string
    daysOverdue: number
  }>
}

export interface FollowUpAction {
  studentId: string
  studentName: string | null
  totalBalance: number
  currency: string
  severity: string
  suggestedActions: string[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view this data.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getDefaulterOverview = () => request<DefaulterOverview>(versionedPath('/api/defaulters/overview'))
export const getDefaulters = (severity?: string) => request<Defaulter[]>(versionedPath('/api/defaulters/list') + (severity ? `?severity=${encodeURIComponent(severity)}` : ''))
export const getStudentDefaulterDetails = (studentId: string) => request<DefaulterDetail>(versionedPath(`/api/defaulters/student/${encodeURIComponent(studentId)}`))
export const getFollowUpActions = () => request<FollowUpAction[]>(versionedPath('/api/defaulters/actions'))
