import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { searchAuditLogs, type AuditLog } from '../api/auditLog';
import { AgGridTable } from './AgGridTable';
import type { ColDef } from 'ag-grid-community';

const auditColumns: ColDef<AuditLog>[] = [
  { field: 'userId', headerName: 'User', valueFormatter: p => p.value || '—' },
  { field: 'action', headerName: 'Action' },
  { field: 'entityType', headerName: 'Entity', valueGetter: p => p.data ? p.data.entityId ? `${p.data.entityType} (${p.data.entityId})` : p.data.entityType : '—' },
  { field: 'changes', headerName: 'Changes', valueFormatter: p => p.value || '—', minWidth: 220 },
  { field: 'ipAddress', headerName: 'IP Address', valueFormatter: p => p.value || '—' },
  { field: 'timestamp', headerName: 'Timestamp', valueFormatter: p => p.value ? new Date(String(p.value)).toLocaleString('en-UG') : '—', minWidth: 180 },
];

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
    {loading ? <LoadingSpinner label="Loading audit logs…" /> : <AgGridTable rows={logs} columns={auditColumns} getRowId={p => p.data.id} exportFileName="smis-audit-log" height={560} />}
  </section>
}
