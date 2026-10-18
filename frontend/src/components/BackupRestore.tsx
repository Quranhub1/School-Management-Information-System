import { useCallback, useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
type BackupInfo = { fileName: string; sizeBytes: number; lastWriteTimeUtc: string }
type BackupDirectoryInfo = { directory: string; automaticBackupsEnabled: boolean; intervalHours: number }

async function readError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null) as { message?: string; detail?: string; title?: string } | null
  return payload?.message ?? payload?.detail ?? payload?.title ?? `Request failed with status ${response.status}`
}
function authHeaders(): HeadersInit {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
function sizeLabel(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

export function BackupRestore() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [directory, setDirectory] = useState<BackupDirectoryInfo | null>(null)
  const [selected, setSelected] = useState('')

  const refresh = useCallback(async () => {
    const [listResult, directoryResult] = await Promise.allSettled([
      fetch(`${API_BASE}/api/administration/backups`, { headers: authHeaders(), cache: 'no-store' }),
      fetch(`${API_BASE}/api/administration/backup-directory`, { headers: authHeaders(), cache: 'no-store' }),
    ])
    const errors: string[] = []
    if (directoryResult.status === 'fulfilled') {
      const response = directoryResult.value
      if (response.ok) setDirectory(await response.json() as BackupDirectoryInfo)
      else errors.push(`GET /api/administration/backup-directory: ${await readError(response)}`)
    } else errors.push(`GET /api/administration/backup-directory: ${directoryResult.reason instanceof Error ? directoryResult.reason.message : 'network error'}`)

    if (listResult.status === 'fulfilled') {
      const response = listResult.value
      if (response.ok) {
        const items = await response.json() as BackupInfo[]
        setBackups(items)
        setSelected(current => current && items.some(item => item.fileName === current) ? current : (items[0]?.fileName ?? ''))
      } else errors.push(`GET /api/administration/backups: ${await readError(response)}`)
    } else errors.push(`GET /api/administration/backups: ${listResult.reason instanceof Error ? listResult.reason.message : 'network error'}`)

    if (errors.length) throw new Error(errors.join(' | '))
    setError(false)
    setStatus('')
  }, [])

  useEffect(() => {
    void refresh().catch(e => { setError(true); setStatus(e instanceof Error ? e.message : 'Could not load local backups.') })
  }, [refresh])

  async function backup() {
    setBusy(true); setStatus('Saving a PostgreSQL backup to the local backup folder…'); setError(false)
    try {
      const response = await fetch(`${API_BASE}/api/administration/backup`, { method: 'POST', headers: authHeaders(), cache: 'no-store' })
      if (!response.ok) throw new Error(await readError(response))
      const result = await response.json() as BackupInfo
      await refresh()
      setStatus(`Local backup saved: ${result.fileName} (${sizeLabel(result.sizeBytes)}).`)
    } catch (e) { setError(true); setStatus(e instanceof Error ? e.message : 'Local backup failed.') }
    finally { setBusy(false) }
  }

  async function restore() {
    if (!selected) { setError(true); setStatus('There is no local backup selected.'); return }
    if (!window.confirm(`WARNING: Restoring ${selected} can replace current database contents and remove newer records. Make sure you have a recent backup. Continue?`)) return
    const typed = window.prompt('To confirm the database restore, type exactly: RESTORE DATABASE')
    if (typed !== 'RESTORE DATABASE') { setError(true); setStatus('Restore cancelled: confirmation text did not match.'); return }
    setBusy(true); setStatus(`Restoring ${selected} from the local backup folder…`); setError(false)
    try {
      const response = await fetch(`${API_BASE}/api/administration/restore`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selected, confirmation: typed }),
      })
      if (!response.ok) throw new Error(await readError(response))
      const result = await response.json() as { message?: string }
      setStatus(result.message ?? 'Database restore completed successfully.')
    } catch (e) { setError(true); setStatus(e instanceof Error ? e.message : 'Restore failed.') }
    finally { setBusy(false) }
  }

  return <section className="panel" aria-label="Local database backup and restore">
    <div className="panel-heading"><div><span className="eyebrow">LOCAL DATA PROTECTION</span><h2>Backup and Restore</h2></div></div>
    <div style={{ padding: 20, display: 'grid', gap: 18 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Local backup folder</h3>
        <code style={{ display: 'block', padding: 12, overflowWrap: 'anywhere' }}>{directory?.directory ?? 'Loading backup folder…'}</code>
        {directory && <p>{directory.automaticBackupsEnabled ? `Automatic backup is enabled every ${directory.intervalHours} hours while the backend is running.` : 'Automatic backup is disabled in configuration.'}</p>}
        <button className="primary-button" onClick={() => void backup()} disabled={busy}>{busy ? 'Please wait…' : 'Back Up Now to This Folder'}</button>
        <button className="secondary-button" onClick={() => void refresh().catch(e => { setError(true); setStatus(e instanceof Error ? e.message : 'Refresh failed.') })} disabled={busy} style={{ marginLeft: 8 }}>Refresh List</button>
      </div>
      <div style={{ borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Saved local backups</h3>
        {backups.length === 0 ? <p>No backup files found yet. Create one now or wait for the automatic backup.</p> : <div style={{ display: 'grid', gap: 8 }}>
          {backups.map(item => <label key={item.fileName} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid var(--border, #e2e8f0)', borderRadius: 8, padding: 12 }}>
            <input type="radio" name="smis-local-backup" value={item.fileName} checked={selected === item.fileName} onChange={() => setSelected(item.fileName)} disabled={busy} />
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}><strong>{item.fileName}</strong><br /><small>{sizeLabel(item.sizeBytes)} · {new Date(item.lastWriteTimeUtc).toLocaleString()}</small></span>
          </label>)}
        </div>}
        <button className="secondary-button" onClick={() => void restore()} disabled={busy || !selected} style={{ marginTop: 12 }}>{busy ? 'Please wait…' : 'Restore Selected Local Backup'}</button>
      </div>
      {status && <p role={error ? 'alert' : 'status'} aria-live="polite" style={{ padding: 14, margin: 0, borderRadius: 8, background: error ? '#fef2f2' : '#f0fdf4', color: error ? '#991b1b' : '#166534' }}>{status}</p>}
    </div>
  </section>
}
