import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { searchAuditLogs, type AuditLog } from '../api/auditLog';
import { AgGridTable } from './AgGridTable';
import type { ColDef } from 'ag-grid-community';
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake';
import { useInstitutionSettings } from './InstitutionSettingsContext';

const auditColumns: ColDef<AuditLog>[] = [
  { field: 'userId', headerName: 'User', valueFormatter: p => p.value || '—' },
  { field: 'action', headerName: 'Action' },
  { field: 'entityType', headerName: 'Entity', valueGetter: p => p.data ? p.data.entityId ? p.data.entityType + ' (' + p.data.entityId + ')' : p.data.entityType : '—' },
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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { institution, loaded: institutionLoaded } = useInstitutionSettings();

  async function load() {
    setLoading(true);
    setError('');
    try {
      setLogs(await searchAuditLogs(userId || undefined, action || undefined, undefined, from || undefined, to || undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function auditPdfOptions() {
    const rows = [
      [
        { text: 'Timestamp', style: 'tableHeader' },
        { text: 'User', style: 'tableHeader' },
        { text: 'Action', style: 'tableHeader' },
        { text: 'Entity', style: 'tableHeader' },
        { text: 'Record ID', style: 'tableHeader' },
        { text: 'Changes', style: 'tableHeader' },
        { text: 'IP address', style: 'tableHeader' },
        { text: 'User agent', style: 'tableHeader' },
      ],
      ...logs.map(log => [
        log.timestamp ? new Date(log.timestamp).toLocaleString('en-UG') : '—',
        log.userId || 'System',
        log.action || '—',
        log.entityType || '—',
        log.entityId || '—',
        log.changes || '—',
        log.ipAddress || '—',
        log.userAgent || '—',
      ]),
    ];
    return {
      title: 'System Audit Log',
      filename: 'smis-system-audit-log',
      orientation: 'landscape' as const,
      institutionName: institutionLoaded && institution.isActive ? institution.institutionName : undefined,
      motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
      contactLines: institutionLoaded && institution.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
      accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
      content: [
        { text: 'Audit records: ' + logs.length, bold: true, margin: [0, 0, 0, 8] },
        { text: 'Filters: ' + (userId || 'All users') + ' · ' + (action || 'All actions') + ' · ' + (from || 'Beginning') + ' to ' + (to || 'Present'), style: 'muted', margin: [0, 0, 0, 10] },
        { table: { headerRows: 1, widths: [78, 62, 68, 62, 80, '*', 62, 100], body: rows }, layout: 'lightHorizontalLines' },
        { text: 'Confidential — restricted system administration record.', style: 'muted', margin: [0, 12, 0, 0] },
      ],
    };
  }

  function downloadAuditPdf() {
    if (logs.length) downloadInstitutionalPdf(auditPdfOptions());
  }

  function printAuditPdf() {
    if (logs.length) printInstitutionalPdf(auditPdfOptions());
  }

  return <section className="panel" aria-label="Audit Log">
    <div className="panel-heading">
      <div><span className="eyebrow">Integrity</span><h2>Audit Log</h2></div>
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={printAuditPdf} disabled={loading || logs.length === 0}>Print PDF</button>
        <button type="button" onClick={downloadAuditPdf} disabled={loading || logs.length === 0}>Download PDF</button>
      </div>
    </div>
    <div className="library-search" style={{ margin: '14px 0' }}>
      <input placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} />
      <input placeholder="Action" value={action} onChange={e => setAction(e.target.value)} />
      <label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
      <button onClick={() => void load()}>Search</button>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <LoadingSpinner label="Loading audit logs…" /> : <AgGridTable rows={logs} columns={auditColumns} getRowId={p => p.data.id} exportFileName="smis-audit-log" height={560} />}
  </section>;
}
