import { useEffect, useState } from 'react';
import { searchAuditLogs, type AuditLog } from '../api/auditLog';

export function AuditLogManagement() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');

  async function load() { setLoading(true); try { setLogs(await searchAuditLogs(userId || undefined, action || undefined)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load audit logs.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, []);

  return <section className="panel" aria-label="Audit Log">
    <div className="panel-heading"><div><span className="eyebrow">Integrity</span><h2>Audit Log</h2></div></div>
    <div className="library-search" style={{ margin: '14px 0' }}><input placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} /><input placeholder="Action" value={action} onChange={e => setAction(e.target.value)} /><button onClick={() => void load()}>Search</button></div>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading audit logs…</p> : <div className="table-wrap"><table><thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Changes</th><th>IP</th><th>Timestamp</th></tr></thead><tbody>{logs.map(l => <tr key={l.id}><td>{l.userId || '—'}</td><td>{l.action}</td><td>{l.entityType}{l.entityId ? ` (${l.entityId})` : ''}</td><td>{l.changes || '—'}</td><td>{l.ipAddress || '—'}</td><td>{new Date(l.timestamp).toLocaleString()}</td></tr>)}</tbody></table></div>}
  </section>
}
