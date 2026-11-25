import { parseApiInput } from '../lib/validation'
import { versionedPath } from '../lib/apiVersion';
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
export function listEvents(){ return request<CalendarEvent[]>(versionedPath('/api/calendar')); }
export function createEvent(input: Omit<CalendarEvent,'id'|'isActive'>){ const validated = parseApiInput(calendarEventCreateRequestSchema, input, 'create calendar event'); return request<CalendarEvent>(versionedPath('/api/calendar'),{method:'POST',body:JSON.stringify(validated)}); }
export function deactivateEvent(id:string){ if (!id.trim()) throw new Error('Calendar event ID is required.'); return request<void>(versionedPath(`/api/calendar/${encodeURIComponent(id)}`),{method:'DELETE'}); }

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
  if (!eventId.trim()) throw new Error('Calendar event ID is required.')
  return request<CalendarReminder[]>(versionedPath(`/api/calendar/${encodeURIComponent(eventId)}/reminders`))
}

export function createReminder(eventId: string, input: { recipientType: string; recipientId?: string; message?: string; remindOnUtc: string; channel?: string }) {
  if (!eventId.trim()) throw new Error('Calendar event ID is required.')
  const validated = parseApiInput(calendarReminderCreateRequestSchema, input, 'create calendar reminder')
  return request<CalendarReminder>(versionedPath(`/api/calendar/${encodeURIComponent(eventId)}/reminders`), {
    method: 'POST',
    body: JSON.stringify(validated),
  })
}

export function markReminderSent(eventId: string, reminderId: string) {
  if (!eventId.trim() || !reminderId.trim()) throw new Error('Calendar event and reminder IDs are required.')
  return request<{ message: string }>(versionedPath(`/api/calendar/${encodeURIComponent(eventId)}/reminders/${encodeURIComponent(reminderId)}/send`), { method: 'POST' })
}
