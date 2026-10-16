import { getAccessToken } from './auth'
import { readApiErrorMessage } from './errors'

export interface SmsTemplate {
  name: string
}

export interface SmsHistoryItem {
  id: string
  title: string
  body: string
  recipientType: string
  recipientId: string
  status: string
  errorMessage: string | null
  createdAtUtc: string
  sentAtUtc: string | null
}

export interface SendSmsRequest {
  subject?: string
  message: string
  recipientType?: string
  recipientIds: string[]
  templateName?: string
}

export interface SendBulkSmsRequest {
  subject?: string
  message: string
  recipientType: string
  classFilter?: string
  templateName?: string
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

export const getSmsTemplates = () => request<SmsTemplate[]>('/api/sms/templates')
export const getSmsHistory = (recipientType?: string, status?: string) => {
  const params = new URLSearchParams()
  if (recipientType) params.set('recipientType', recipientType)
  if (status) params.set('status', status)
  const qs = params.toString()
  return request<SmsHistoryItem[]>(`/api/sms/history${qs ? `?${qs}` : ''}`)
}
export const sendSms = (data: SendSmsRequest) => request<{ success: boolean; message: string; count: number }>('/api/sms/send', {
  method: 'POST',
  body: JSON.stringify(data),
})
export const sendBulkSms = (data: SendBulkSmsRequest) => request<{ success: boolean; message: string; count: number }>('/api/sms/send-bulk', {
  method: 'POST',
  body: JSON.stringify(data),
})
