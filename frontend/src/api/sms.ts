import { getAccessToken } from './auth'
import { readApiErrorMessage } from './errors'
import { parseApiInput, parseApiResponse } from '../lib/validation'
import { sendBulkSmsRequestSchema, sendSmsRequestSchema, smsSendResponseSchema } from '../schemas'

export interface SmsTemplate { name: string }
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
export async function sendSms(data: SendSmsRequest) {
  const input = parseApiInput(sendSmsRequestSchema, data, 'send SMS')
  const result = await request<unknown>('/api/sms/send', { method: 'POST', body: JSON.stringify(input) })
  return parseApiResponse(smsSendResponseSchema, result, 'SMS send result')
}
export async function sendBulkSms(data: SendBulkSmsRequest) {
  const input = parseApiInput(sendBulkSmsRequestSchema, data, 'send bulk SMS')
  const result = await request<unknown>('/api/sms/send-bulk', { method: 'POST', body: JSON.stringify(input) })
  return parseApiResponse(smsSendResponseSchema, result, 'bulk SMS send result')
}
