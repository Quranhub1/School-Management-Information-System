import { parseApiInput } from '../lib/validation'
import { calendarEventCreateRequestSchema, calendarReminderCreateRequestSchema } from '../schemas'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function token() { return sessionStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type CalendarEvent = { id:string; title:string; description?:string; eventType:string; startDate:string; endDate:string; location?:string; isActive:boolean };
export function listEvents(){ return request<CalendarEvent[]>('/api/calendar'); }
export function createEvent(input: Omit<CalendarEvent,'id'|'isActive'>){ const validated = parseApiInput(calendarEventCreateRequestSchema, input, 'create calendar event'); return request<CalendarEvent>('/api/calendar',{method:'POST',body:JSON.stringify(validated)}); }
export function deactivateEvent(id:string){ if (!id.trim()) throw new Error('Calendar event ID is required.'); return request<void>(`/api/calendar/${encodeURIComponent(id)}`,{method:'DELETE'}); }

export interface CalendarReminder {
  id: string
  calendarEventId: string
  recipientType: string
  recipientId?: string
  message?: string
  channel: string
  isSent: boolean
  remindOnUtc: string
  sentAtUtc?: string
  createdAtUtc: string
}

export function listReminders(eventId: string) {
  return request<CalendarReminder[]>(`/api/calendar/${eventId}/reminders`)
}

export function createReminder(eventId: string, input: { recipientType: string; recipientId?: string; message?: string; remindOnUtc: string; channel?: string }) {
  return request<CalendarReminder>(`/api/calendar/${eventId}/reminders`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function markReminderSent(eventId: string, reminderId: string) {
  return request<{ message: string }>(`/api/calendar/${eventId}/reminders/${reminderId}/send`, { method: 'POST' })
}
