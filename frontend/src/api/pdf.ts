import { getAccessToken } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function downloadPdf(path: string, filename: string) {
  const token = getAccessToken()
  const url = `${API_BASE_URL}${path}`
  fetch(url, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to download PDF.')
      return response.blob()
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
    })
    .catch(error => {
      console.error(error)
      alert(error.message)
    })
}
