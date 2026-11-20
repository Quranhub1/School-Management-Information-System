import { useCallback, useEffect, useMemo, useState } from 'react'
import './OfflineSyncCenter.css'
import { Download, RefreshCw, ShieldAlert, Wifi, WifiOff } from 'lucide-react'
import { getSession } from '../api/auth'
import { getOnlineStatus } from '../lib/offline/api'
import { offlineScopeFor, type SyncConflict, type SyncOperation } from '../lib/offline/db'
import { getSyncConflicts, getSyncQueue, resolveSyncConflict } from '../lib/offline/sync'

function formatTime(value: number) {
  return new Date(value).toLocaleString()
}

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'smis'
}

export function OfflineSyncCenter() {
  const session = getSession()
  const scope = useMemo(
    () => session?.username ? offlineScopeFor(session.username, session.roles ?? []) : null,
    [session?.username, session?.roles],
  )
  const [operations, setOperations] = useState<SyncOperation[]>([])
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  const [online, setOnline] = useState(getOnlineStatus())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!scope) return
    setLoading(true)
    setError(null)
    try {
      const [queue, conflictRows] = await Promise.all([getSyncQueue(scope), getSyncConflicts(scope)])
      setOperations(queue)
      setConflicts(conflictRows)
      setOnline(getOnlineStatus())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read the local sync database.')
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    void refresh()
    const updateNetwork = () => {
      setOnline(getOnlineStatus())
      void refresh()
    }
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)
    return () => {
      window.removeEventListener('online', updateNetwork)
      window.removeEventListener('offline', updateNetwork)
    }
  }, [refresh])

  const unresolvedConflicts = conflicts.filter(item => item.resolutionStatus === 'unresolved')
  const counts = useMemo(() => operations.reduce<Record<string, number>>((result, item) => {
    result[item.status] = (result[item.status] ?? 0) + 1
    return result
  }, {}), [operations])

  async function reviewConflict(conflict: SyncConflict, status: 'resolved' | 'discarded') {
    setResolving(conflict.id)
    try {
      await resolveSyncConflict(conflict.id, status)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update conflict review status.')
    } finally {
      setResolving(null)
    }
  }

  function exportAudit() {
    const audit = {
      exportedAt: new Date().toISOString(),
      scope,
      online,
      replayPolicy: 'blocked-by-default; no automatic replay',
      operations: operations.map(({ id, domain, operation, resourceKey, status, attempts, createdAt, updatedAt, lastError, serverRecordVersion }) => ({
        id, domain, operation, resourceKey, status, attempts,
        createdAt: new Date(createdAt).toISOString(),
        updatedAt: new Date(updatedAt).toISOString(),
        lastError, serverRecordVersion,
      })),
      conflicts: conflicts.map(({ id, operationId, detectedAt, reason, resolutionStatus, resolvedAt }) => ({
        id, operationId, detectedAt: new Date(detectedAt).toISOString(),
        reason, resolutionStatus,
        resolvedAt: resolvedAt ? new Date(resolvedAt).toISOString() : null,
      })),
    }
    const blob = new Blob([JSON.stringify(audit, null, 2) ?? '{}'], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `smis-offline-audit-${safeFilename(session?.username ?? 'staff')}-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!scope) {
    return <section className="panel offline-sync-panel"><h2>Offline sync</h2><p className="empty">Sign in to review this device's offline operations.</p></section>
  }

  return <section className="offline-sync-workspace" aria-label="Offline synchronization and conflict review">
    <div className="offline-sync-toolbar">
      <div>
        <p className="eyebrow">DEVICE OPERATIONS</p>
        <h2>Offline sync queue</h2>
        <p>Review locally recorded operations and resolve conflicts. Operations remain blocked until a module-specific safe replay workflow is approved.</p>
      </div>
      <div className="offline-sync-actions">
        <span className={online ? 'offline-sync-connectivity online' : 'offline-sync-connectivity offline'}>
          {online ? <Wifi size={15} /> : <WifiOff size={15} />}
          {online ? 'Online' : 'Offline'}
        </span>
        <button className="secondary-button" type="button" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={15} /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <button className="primary-button" type="button" onClick={exportAudit} disabled={!operations.length && !conflicts.length}>
          <Download size={15} /> Export audit
        </button>
      </div>
    </div>

    {error && <div className="offline-sync-error" role="alert">{error}</div>}

    <div className="offline-sync-metrics">
      <article className="summary-card"><span>Total operations</span><strong>{operations.length}</strong></article>
      <article className="summary-card"><span>Blocked</span><strong>{counts.blocked ?? 0}</strong></article>
      <article className="summary-card"><span>Failed</span><strong>{counts.failed ?? 0}</strong></article>
      <article className="summary-card"><span>Unresolved conflicts</span><strong>{unresolvedConflicts.length}</strong></article>
    </div>

    <div className="offline-sync-safety-note">
      <ShieldAlert size={18} />
      <div><strong>Automatic replay is disabled</strong><p>Student, attendance and library operations are retained for review only. Discarded operations remain in the audit journal but are excluded from the active queue. Financial operations are rejected from the offline journal. Do not treat a local operation as saved on the server.</p></div>
    </div>

    <section className="panel offline-sync-section">
      <div className="panel-heading"><div><p className="eyebrow">LOCAL JOURNAL</p><h3>Queued operations</h3></div><span>{operations.length} records</span></div>
      {!operations.length ? <p className="empty">No offline operations have been recorded for this account on this device.</p> : (
        <div className="offline-sync-table-wrap"><table className="data-table">
          <thead><tr><th>Created</th><th>Domain</th><th>Operation</th><th>Record</th><th>Status</th><th>Attempts</th></tr></thead>
          <tbody>{operations.map(item => <tr key={item.id}>
            <td>{formatTime(item.createdAt)}</td><td>{item.domain}</td><td>{item.operation}</td><td>{item.resourceKey}</td>
            <td><span className={`offline-sync-status status-${item.status}`}>{item.status}</span>{item.lastError && <small className="offline-sync-row-error">{item.lastError}</small>}</td>
            <td>{item.attempts}</td>
          </tr>)}</tbody>
        </table></div>
      )}
    </section>

    <section className="panel offline-sync-section">
      <div className="panel-heading"><div><p className="eyebrow">CONFLICT REVIEW</p><h3>Detected conflicts</h3></div><span>{unresolvedConflicts.length} unresolved</span></div>
      {!conflicts.length ? <p className="empty">No sync conflicts have been recorded for this account on this device.</p> : conflicts.map(conflict => (
        <article className="offline-sync-conflict" key={conflict.id}>
          <div className="offline-sync-conflict-main">
            <div><strong>{conflict.reason}</strong><p>Operation {conflict.operationId} · Detected {formatTime(conflict.detectedAt)}</p></div>
            <span className={`offline-sync-status status-${conflict.resolutionStatus}`}>{conflict.resolutionStatus}</span>
          </div>
          {(conflict.localVersion !== undefined || conflict.serverVersion !== undefined) && <details>
            <summary>Review local and server snapshots</summary>
            <div className="offline-sync-snapshots">
              {conflict.localVersion !== undefined && <div><strong>Local version</strong><pre>{JSON.stringify(conflict.localVersion, null, 2)}</pre></div>}
              {conflict.serverVersion !== undefined && <div><strong>Server version</strong><pre>{JSON.stringify(conflict.serverVersion, null, 2)}</pre></div>}
            </div>
          </details>}
          {conflict.resolutionStatus === 'unresolved' && <div className="offline-sync-conflict-actions">
            <button type="button" className="secondary-button" disabled={resolving === conflict.id} onClick={() => void reviewConflict(conflict, 'resolved')}>Mark reviewed</button>
            <button type="button" className="danger-button" disabled={resolving === conflict.id} onClick={() => void reviewConflict(conflict, 'discarded')}>Discard queued operation</button>
          </div>}
        </article>
      ))}
    </section>
  </section>
}
