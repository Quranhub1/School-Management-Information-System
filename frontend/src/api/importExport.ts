import { getAccessToken } from './auth'
import { parseApiInput, parseApiResponse } from '../lib/validation'
import { bulkImportRequestSchema, bulkImportResultSchema } from '../schemas'
import { exportRowsToExcel, parseSpreadsheetFile } from '../lib/spreadsheets'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized.')
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export interface BulkImportResult {
  entityType: string
  successCount: number
  errorCount: number
  errors: string[]
  warnings: string[]
}

export interface ImportExportRequest {
  entityType: string
  csvData: string
}

export async function importData(input: ImportExportRequest) {
  const validated = parseApiInput(bulkImportRequestSchema, input, 'bulk import')
  const result = await request<unknown>('/api/import-export/import', { method: 'POST', body: JSON.stringify(validated) })
  return parseApiResponse(bulkImportResultSchema, result, 'bulk import result') as BulkImportResult
}

async function fetchExportBlob(entityType: string, filters?: Record<string, string>): Promise<Blob> {
  const qs = filters ? '?' + new URLSearchParams(filters).toString() : ''
  const token = getAccessToken()
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\\/$/, '') ?? ''
  const response = await fetch(`${base}/api/import-export/export/${encodeURIComponent(entityType)}${qs}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized.')
  if (!response.ok) throw new Error(`Export failed with status ${response.status}`)
  return response.blob()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

export async function exportData(entityType: string, filters?: Record<string, string>) {
  const blob = await fetchExportBlob(entityType, filters)
  downloadBlob(blob, `${entityType}s.csv`)
}

export async function exportDataAsExcel(entityType: string, filters?: Record<string, string>) {
  const blob = await fetchExportBlob(entityType, filters)
  const parsed = await parseSpreadsheetFile(new File([blob], `${entityType}.csv`, { type: 'text/csv' }))
  exportRowsToExcel(parsed.rows, `${entityType}s`, entityType)
}
