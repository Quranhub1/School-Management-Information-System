import { getAccessToken } from './auth'

export interface StudentReportCard {
  studentNumber: string
  studentName: string
  results: {
    courseCode: string
    courseName: string
    score: number | null
    grade: string | null
    gradePoint: number | null
    status: string
    isFinal: boolean
  }[]
  gpa: number
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
  if (response.status === 403) throw new Error('Your role is not authorized to view reports.')
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const getStudentReportCard = (studentId: string) => request<StudentReportCard>(`/api/reports/student/${encodeURIComponent(studentId)}/report-card`)
export const getPaymentReceipt = (paymentId: string) => request<FeeReceipt>(`/api/reports/payment/${encodeURIComponent(paymentId)}/receipt`)
