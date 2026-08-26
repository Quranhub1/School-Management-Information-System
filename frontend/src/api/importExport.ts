import { getAccessToken } from './auth'

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

export function importData(input: ImportExportRequest) {
  return request<BulkImportResult>('/api/import-export/import', { method: 'POST', body: JSON.stringify(input) })
}

export function exportData(entityType: string, filters?: Record<string, string>) {
  const qs = filters ? '?' + new URLSearchParams(filters).toString() : ''
  const token = getAccessToken()
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
  return fetch(`${base}/api/import-export/export/${encodeURIComponent(entityType)}${qs}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  }).then(async (response) => {
    if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
    if (response.status === 403) throw new Error('Your role is not authorized.')
    if (!response.ok) throw new Error(`Export failed with status ${response.status}`)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityType}s.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  })
}
