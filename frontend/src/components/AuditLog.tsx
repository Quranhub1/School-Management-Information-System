import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
<<<<<<< HEAD
<<<<<<< HEAD
import { searchAuditLogs, searchFinanceAuditEvents, searchWorkflowHistory, type AuditLog } from '../api/auditLog';
import { AgGridTable } from './AgGridTable';
import type { ColDef } from 'ag-grid-community';
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake';
import { useInstitutionSettings } from './InstitutionSettingsContext';
=======
import { searchAuditLogs, type AuditLog } from '../api/auditLog';
import { AgGridTable } from './AgGridTable';
import type { ColDef } from 'ag-grid-community';
>>>>>>> origin/feat/ag-grid-table-migration
=======
import { searchAuditLogs, searchFinanceAuditEvents, searchWorkflowHistory, type AuditLog } from '../api/auditLog';
import { AgGridTable } from './AgGridTable';
import type { ColDef } from 'ag-grid-community';
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake';
import { useInstitutionSettings } from './InstitutionSettingsContext';
>>>>>>> origin/feat/pdfmake-document-engine

const auditColumns: ColDef<AuditLog>[] = [
  { field: 'userId', headerName: 'User', valueFormatter: p => p.value || '—' },
  { field: 'action', headerName: 'Action' },
<<<<<<< HEAD
<<<<<<< HEAD
  { field: 'entityType', headerName: 'Entity', valueGetter: p => p.data ? p.data.entityId ? p.data.entityType + ' (' + p.data.entityId + ')' : p.data.entityType : '—' },
=======
  { field: 'entityType', headerName: 'Entity', valueGetter: p => p.data ? p.data.entityId ? `${p.data.entityType} (${p.data.entityId})` : p.data.entityType : '—' },
>>>>>>> origin/feat/ag-grid-table-migration
=======
  { field: 'entityType', headerName: 'Entity', valueGetter: p => p.data ? p.data.entityId ? p.data.entityType + ' (' + p.data.entityId + ')' : p.data.entityType : '—' },
>>>>>>> origin/feat/pdfmake-document-engine
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
  const [financeAuditLoading, setFinanceAuditLoading] = useState(false);
  const [workflowAuditLoading, setWorkflowAuditLoading] = useState(false);
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

  async function exportFinanceAuditPdf() {
    setFinanceAuditLoading(true);
    setError('');
    try {
      const events = await searchFinanceAuditEvents(undefined, from || undefined, to || undefined);
      if (!events.length) {
        setError('No financial audit events match the selected period.');
        return;
      }
      const rows = [
        [{ text: 'Timestamp', style: 'tableHeader' }, { text: 'Action', style: 'tableHeader' }, { text: 'Entity', style: 'tableHeader' }, { text: 'Record ID', style: 'tableHeader' }, { text: 'Performed by', style: 'tableHeader' }, { text: 'Reason', style: 'tableHeader' }, { text: 'Journal reference', style: 'tableHeader' }, { text: 'Metadata', style: 'tableHeader' }],
        ...events.map(event => [
          new Date(event.occurredAt).toLocaleString('en-UG'),
          event.action,
          event.entityType,
          event.entityId,
          event.performedBy,
          event.reason || '—',
          event.sourceJournalEntryId || '—',
          event.metadata || '—',
        ]),
      ];
      downloadInstitutionalPdf({
        title: 'Financial Audit Events',
        filename: 'smis-financial-audit-events',
        orientation: 'landscape',
        institutionName: institutionLoaded && institution.isActive ? institution.institutionName : undefined,
        motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
        contactLines: institutionLoaded && institution.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
        accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
        content: [
          { text: 'Financial audit events: ' + events.length, bold: true, margin: [0, 0, 0, 8] },
          { text: 'Period: ' + (from || 'Beginning') + ' to ' + (to || 'Present'), style: 'muted', margin: [0, 0, 0, 10] },
          { table: { headerRows: 1, widths: [78, 75, 68, 80, 70, '*', 80, '*'], body: rows }, layout: 'lightHorizontalLines' },
          { text: 'Confidential — restricted finance audit record. This export does not modify the immutable source events.', style: 'muted', margin: [0, 12, 0, 0] },
        ],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to export financial audit events. Check Finance Operations access.');
    } finally {
      setFinanceAuditLoading(false);
    }
  }

  async function exportWorkflowHistoryPdf() {
    setWorkflowAuditLoading(true);
    setError('');
    try {
      const events = await searchWorkflowHistory(from || undefined, to || undefined);
      if (!events.length) {
        setError('No workflow history records match the selected period.');
        return;
      }
      const rows = [
        [{ text: 'Timestamp', style: 'tableHeader' }, { text: 'Workflow', style: 'tableHeader' }, { text: 'Entity', style: 'tableHeader' }, { text: 'Record ID', style: 'tableHeader' }, { text: 'From state', style: 'tableHeader' }, { text: 'To state', style: 'tableHeader' }, { text: 'Performed by', style: 'tableHeader' }, { text: 'Comments', style: 'tableHeader' }],
        ...events.map(event => [
          new Date(event.performedAt).toLocaleString('en-UG'),
          event.workflowType,
          event.entityType,
          event.entityId,
          event.fromState,
          event.toState,
          event.performedByUserId || 'System',
          event.comments || '—',
        ]),
      ];
      downloadInstitutionalPdf({
        title: 'Workflow State History',
        filename: 'smis-workflow-history-audit',
        orientation: 'landscape',
        institutionName: institutionLoaded && institution.isActive ? institution.institutionName : undefined,
        motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
        contactLines: institutionLoaded && institution.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
        accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
        content: [
          { text: 'Workflow history records: ' + events.length, bold: true, margin: [0, 0, 0, 8] },
          { text: 'Period: ' + (from || 'Beginning') + ' to ' + (to || 'Present'), style: 'muted', margin: [0, 0, 0, 10] },
          { table: { headerRows: 1, widths: [78, 70, 65, 82, 60, 60, 78, '*'], body: rows }, layout: 'lightHorizontalLines' },
          { text: 'Confidential — restricted workflow audit record.', style: 'muted', margin: [0, 12, 0, 0] },
        ],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to export workflow history.');
    } finally {
      setWorkflowAuditLoading(false);
    }
  }

  return <section className="panel" aria-label="Audit Log">
    <div className="panel-heading">
      <div><span className="eyebrow">Integrity</span><h2>Audit Log</h2></div>
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={printAuditPdf} disabled={loading || logs.length === 0}>Print PDF</button>
<<<<<<< HEAD
        <button type="button" onClick={downloadAuditPdf} disabled={loading || logs.length === 0}>Download PDF</button>
        <button type="button" className="secondary-button" onClick={() => void exportFinanceAuditPdf()} disabled={financeAuditLoading}>{financeAuditLoading ? "Preparing…" : "Download Finance Audit PDF"}</button>
=======
        <button type="button" onClick={downloadAuditPdf} disabled={loading || logs.length === 0}>Download PDF</button>\n        <button type="button" className="secondary-button" onClick={() => void exportFinanceAuditPdf()} disabled={financeAuditLoading}>{financeAuditLoading ? "Preparing…" : "Download Finance Audit PDF"}</button>
>>>>>>> origin/feat/pdfmake-document-engine
        <button type="button" className="secondary-button" onClick={() => void exportWorkflowHistoryPdf()} disabled={workflowAuditLoading}>{workflowAuditLoading ? "Preparing…" : "Download Workflow Audit PDF"}</button>
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
<<<<<<< HEAD
<<<<<<< HEAD
  </section>;
=======
  </section>
>>>>>>> origin/feat/ag-grid-table-migration
=======
  </section>;
>>>>>>> origin/feat/pdfmake-document-engine
}
