import { useRef, useState } from 'react'
import { getAccessToken } from '../api/auth'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function readError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null) as { message?: string; detail?: string; title?: string } | null
  return payload?.message ?? payload?.detail ?? payload?.title ?? `Request failed with status ${response.status}`
}

export function BackupRestore() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function backup() {
    setBusy(true)
    setStatus('Creating a database backup…')
    setError(false)
    try {
      const token = getAccessToken()
      const response = await fetch(`${API_BASE}/api/administration/backup`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(await readError(response))
      const blob = await response.blob()
      if (!blob.size) throw new Error('The server returned an empty backup file.')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/i)?.[1] ?? `smis-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus(`Backup downloaded successfully (${(blob.size / 1024 / 1024).toFixed(2)} MB).`)
    } catch (e) {
      setError(true)
      setStatus(e instanceof Error ? e.message : 'Backup failed.')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    if (!backupFile) {
      setError(true)
      setStatus('Choose a .dump backup file first.')
      return
    }
    const approved = window.confirm('WARNING: Restoring will replace database objects/data from the selected backup and may remove newer records. Ensure you have a recent backup. Continue?')
    if (!approved) return
    const typed = window.prompt('To confirm the database restore, type exactly: RESTORE DATABASE')
    if (typed !== 'RESTORE DATABASE') {
      setError(true)
      setStatus('Restore cancelled: confirmation text did not match.')
      return
    }

    setBusy(true)
    setStatus('Restoring the database. Do not close this window…')
    setError(false)
    try {
      const form = new FormData()
      form.append('backupFile', backupFile)
      form.append('confirmation', typed)
      const token = getAccessToken()
      const response = await fetch(`${API_BASE}/api/administration/restore`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!response.ok) throw new Error(await readError(response))
      const payload = await response.json().catch(() => null) as { message?: string } | null
      setStatus(payload?.message ?? 'Database restore completed successfully. Reload the application.')
      setBackupFile(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch (e) {
      setError(true)
      setStatus(e instanceof Error ? e.message : 'Restore failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel" aria-label="Backup and restore">
      <div className="panel-heading"><div><span className="eyebrow">DATA PROTECTION</span><h2>Backup and Restore</h2></div></div>
      <div style={{ padding: 20, display: 'grid', gap: 18 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>Create a database backup</h3>
          <p>Exports the current PostgreSQL database to a downloadable custom-format .dump file.</p>
          <button className="primary-button" onClick={() => void backup()} disabled={busy}>{busy ? 'Please wait…' : 'Create & Download Backup'}</button>
        </div>
        <div style={{ borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Restore from a backup</h3>
          <p>Choose a .dump file previously created by SMIS. Restore changes live database contents and should only be used when necessary.</p>
          <label htmlFor="smis-backup-file" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Backup file (.dump)</label>
          <input ref={fileInput} id="smis-backup-file" type="file" accept=".dump,application/octet-stream" onChange={event => setBackupFile(event.target.files?.[0] ?? null)} disabled={busy} />
          {backupFile && <p>{backupFile.name} — {(backupFile.size / 1024 / 1024).toFixed(2)} MB</p>}
          <button className="secondary-button" onClick={() => void restore()} disabled={busy || !backupFile} style={{ marginTop: 12 }}>{busy ? 'Please wait…' : 'Restore Selected Backup'}</button>
        </div>
        {status && <p role={error ? 'alert' : 'status'} aria-live="polite" style={{ padding: 14, margin: 0, borderRadius: 8, background: error ? '#fef2f2' : '#f0fdf4', color: error ? '#991b1b' : '#166534' }}>{status}</p>}
        <p style={{ color: 'var(--text-muted, #64748b)', fontSize: 13, margin: 0 }}>Keep a copy of important backups off this computer. Restore is restricted to administrators and requires explicit confirmation.</p>
      </div>
    </section>
  )
}
