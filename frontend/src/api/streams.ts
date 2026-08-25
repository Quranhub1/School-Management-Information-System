import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export interface Stream {
  id: string
  academicClassId: string
  code: string
  name?: string | null
  capacity?: number | null
  isActive: boolean
}

export interface CreateStreamRequest {
  academicClassId: string
  code: string
  name?: string
  capacity?: number
}

export const getStreamsByClass = (classId: string) => {
  if (!classId.trim()) throw new Error('Class ID is required.')
  return request<Stream[]>(`/api/streams/by-class/${encodeURIComponent(classId)}`)
}

export const createStream = (input: CreateStreamRequest) => {
  if (!input.code.trim()) throw new Error('Stream code is required.')
  if (!input.academicClassId.trim()) throw new Error('Class ID is required.')
  return request<Stream>('/api/streams', { method: 'POST', body: JSON.stringify(input) })
}
