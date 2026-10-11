import { useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'

export function SystemLogs() {
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: string; message: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

  async function loadLogs() {
    setLoading(true)
    setError('')
    try {
      const token = getAccessToken()
      const response = await fetch(`${API_BASE_URL}/api/system/logs`, {
        headers: { 
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load logs: ${response.status}`)
      }
      
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load system logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filterLevel === 'all' || log.level.toLowerCase() === filterLevel
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.level.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  function getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error': return '#dc2626'
      case 'warn': return '#d97706'
      case 'info': return '#2563eb'
      case 'debug': return '#64748b'
      default: return '#6b7280'
    }
  }

  return (
    <section className="panel" aria-label="System logs" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <p className="eyebrow">SYSTEM ADMINISTRATION</p>
        </div>
        <div>
          <h2>System Logs</h2>
        </div>
        <div style={{ flex: '1' }}>
          <span className="status">{logs.length} log entries</span>
        </div>
      </div>

      <div className="sheet-content" style={{ flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
        {error && <div className="error" role="alert" style={{ margin: '16px' }}>{error}</div>}

        <div className="controls-container" style={{ margin: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label>Level filter:
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as 'all' | 'error' | 'warn' | 'info' | 'debug')}>
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </label>
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label>Search:
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search logs..." />
            </label>
          </div>
          <button type="button" onClick={() => void loadLogs()} style={{ padding: '8px 12px' }}>
            Refresh
          </button>
        </div>

        <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
          <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Level</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Message</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr style={{ height: '60px' }}>
                    <td colSpan={3} className="empty" style={{ padding: '16px', textAlign: 'center' }}>Loading logs…</td>
                  </tr>
                ) : (
                  filteredLogs.length === 0 ? (
                    <tr style={{ height: '60px' }}>
                      <td colSpan={3} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No logs found matching filters.</td>
                    </tr
                  ) : (
                    filteredLogs.map((log, index) => (
                      <tr key={log.timestamp + index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge" style={{ background: getLevelColor(log.level), color: 'white', fontSize: '0.75rem' }}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.message}</td>
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