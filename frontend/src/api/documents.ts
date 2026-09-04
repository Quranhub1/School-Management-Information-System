import { getAccessToken } from './auth'

export interface StudentDocument {
  id: string
  studentId: string
  documentType: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  storedPath: string
  description?: string | null
  uploadedByUserId: string
  uploadedAt: string
  version: number
  replacedByDocumentId?: string | null
  isArchived: boolean
  archivedAt?: string | null
  archivedByUserId?: string | null
}

export interface UploadDocumentRequest {
  studentId: string
  documentType: string
  file: File
  description?: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function uploadDocument(request: UploadDocumentRequest): Promise<StudentDocument> {
  const form = new FormData()
  form.append('studentId', request.studentId)
  form.append('documentType', request.documentType)
  form.append('file', request.file)
  if (request.description) form.append('description', request.description)

  const response = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: form,
  })

  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage documents.')
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Upload failed with status ${response.status}`)
  }
  return response.json() as Promise<StudentDocument>
}

export async function getStudentDocuments(studentId: string): Promise<StudentDocument[]> {
  const response = await fetch(`${API_BASE}/api/documents/student/${studentId}`, {
    headers: { Accept: 'application/json', ...getAuthHeaders() },
  })

  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to view documents.')
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json() as Promise<StudentDocument[]>
}

export function getDocumentDownloadUrl(id: string): string {
  return `${API_BASE}/api/documents/${id}/download`
}

export async function archiveDocument(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/documents/${id}/archive`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...getAuthHeaders() },
  })

  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage documents.')
  if (response.status === 404) throw new Error('Document not found.')
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Archive failed with status ${response.status}`)
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  })

  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to manage documents.')
  if (response.status === 404) throw new Error('Document not found.')
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Delete failed with status ${response.status}`)
  }
}
