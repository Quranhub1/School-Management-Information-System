import { z } from 'zod'
import { getAccessToken } from './auth'
import { readApiErrorMessage } from './errors'
import { parseApiInput, parseApiResponse } from '../lib/validation'
import { streamCreateRequestSchema, streamResponseSchema } from '../schemas'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  })
  if (!response.ok) throw new Error(await readApiErrorMessage(response))
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

export async function getStreamsByClass(classId: string) {
  if (!classId.trim()) throw new Error('Class ID is required.')
  const rows = await request<unknown>(`/api/streams/by-class/${encodeURIComponent(classId)}`)
  return parseApiResponse(z.array(streamResponseSchema), rows, 'streams by class') as Stream[]
}
export async function createStream(input: CreateStreamRequest) {
  const data = parseApiInput(streamCreateRequestSchema, input, 'create stream')
  const created = await request<unknown>('/api/streams', { method: 'POST', body: JSON.stringify(data) })
  return parseApiResponse(streamResponseSchema, created, 'created stream') as Stream
}

export interface UpdateStreamRequest { code: string; name?: string; isActive: boolean }
export async function updateStream(id: string, input: UpdateStreamRequest) {
  if (!id.trim() || !input.code.trim()) throw new Error('Stream ID and code are required.')
  await request<void>(`/api/streams/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
}
