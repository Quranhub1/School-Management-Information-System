import { useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'

export function SystemBackups() {
  const [backups, setBackups] = useState<Array<{ 
    id: string; 
    filename: string; 
    size: number; 
    createdAt: string; 
    status: 'completed' | 'failed' | 'in_progress'
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastBackup, setLastBackup] = useState<{ id: string; filename: string; size: number; createdAt: string; status: 'completed' | 'failed' | 'in_progress' } | null>(null)

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

  async function loadBackups() {
    setLoading(true)
    setError('')
    try {
      const token = getAccessToken()
      const response = await fetch(`${API_BASE_URL}/api/system/backups`, {
        headers: { 
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load backups: ${response.status}`)
      }
      
      const data = await response.json()
      setBackups(data.backups || [])
      
      // Find most recent completed backup
      const completedBackups = data.backups?.filter(b => b.status === 'completed') || []
      if (completedBackups.length > 0) {
        const mostRecent = completedBackups.reduce((latest, current) => 
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        )
        setLastBackup(mostRecent)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load backup information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBackups()
  }, [])

  async function createBackup() {
    try {
      const token = getAccessToken()
      const response = await fetch(`${API_BASE_URL}/api/system/backups`, {
        method: 'POST',
        headers: { 
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create backup: ${response.status}`)
      }
      
      // Refresh backup list after creation
      await loadBackups()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create backup.')
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#059669'
      case 'failed': return '#dc2626'
      case 'in_progress': return '#d97706'
      default: return '#6b7280'
    }
  }

  return (
    <section className="panel" aria-label="System backups" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <p className="eyebrow">SYSTEM ADMINISTRATION</p>
        </div>
        <div>
          <h2>System Backups</h2>
        </div>
        <div style={{ flex: '1' }}>
          <span className="status">{backups.length} backups</span>
        </div>
      </div>

      <div className="sheet-content" style={{ flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
        {error && <div className="error" role="alert" style={{ margin: '16px' }}>{error}</div>}

        {lastBackup && (
          <div className="backup-status" style={{ margin: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Last Backup Status</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                  {new Date(lastBackup.createdAt).toLocaleString()}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge" style={{ background: getStatusColor(lastBackup.status), color: 'white', fontSize: '0.875rem' }}>
                  {lastBackup.status.toUpperCase()}
                </span>
                <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                  {formatFileSize(lastBackup.size)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="backup-controls" style={{ margin: '16px', display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => void createBackup()} 
                  style={{ padding: '10px 16px', fontSize: '0.875rem' }}>
            Create New Backup
          </button>
          <button type="button" onClick={() => void loadBackups()} 
                  style={{ padding: '10px 16px', fontSize: '0.875rem' }}>
            Refresh Backup List
          </button>
        </div>

        <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
          <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Backup Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Size</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Created At</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr style={{ height: '60px' }}>
                    <td colSpan={5} className="empty" style={{ padding: '16px', textAlign: 'center' }}>Loading backups…</td>
                  </tr
                ) : (
                  backups.length === 0 ? (
                    <tr style={{ height: '60px' }}>
                      <td colSpan={5} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No backups found.</td>
                    </tr
                  ) : (
                    backups.map((backup, index) => (
                      <tr key={backup.id + index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>{backup.filename}</td>
                        <td style={{ padding: '12px 16px' }}>{formatFileSize(backup.size)}</td>
                        <td style={{ padding: '12px 16px' }}>{new Date(backup.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge" style={{ background: getStatusColor(backup.status), color: 'white', fontSize: '0.75rem' }}>
                            {backup.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {backup.status === 'completed' && (
                            <button type="button" className="secondary-button" onClick={() => {/* restore logic */}}>
                              Restore
                            </button>
                          )}
                          {backup.status !== 'in_progress' && (
                            <button type="button" className="secondary-button" onClick={() => {/* delete logic */}}>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr
                    ))}
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}