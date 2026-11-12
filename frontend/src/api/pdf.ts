import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export async function downloadPdf(path: string, filename: string): Promise<void> {
  const token = getAccessToken()
  const url = `${API_BASE_URL}${path}`
  try {
    const response = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    if (!response.ok) throw new Error('Failed to download PDF.')
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to download PDF.')
  }
}
