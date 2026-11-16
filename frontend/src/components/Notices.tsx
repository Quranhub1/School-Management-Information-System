import { useEffect, useMemo, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { createNotice, listNotices, type Notice } from '../api/notices';
import { AgGridTable } from './AgGridTable';
import type { ColDef } from 'ag-grid-community';

const noticeRoles = [
  ['SystemAdministrator', 'System Administrator'],
  ['AcademicRegistrar', 'Academic Registrar'],
  ['AssistantRegistrar', 'Assistant Registrar'],
  ['AdmissionsOfficer', 'Admissions Officer'],
  ['Accountant', 'Accountant'],
  ['AssistantAccountant', 'Assistant Accountant'],
  ['Lecturer', 'Lecturer'],
  ['ExaminationsOfficer', 'Examinations Officer'],
  ['SchoolWarden', 'School Warden'],
  ['Principal', 'Principal'],
  ['Director', 'Director'],
  ['Secretary', 'Secretary'],
  ['ResidentDirector', 'Resident Director'],
  ['HeadOfDepartment', 'Head of Department'],
  ['AssistantPrincipal', 'Assistant Principal'],
  ['Receptionist', 'Receptionist'],
  ['Admin Secretary', 'Admin Secretary'],
  ['Records Officer', 'Records Officer'],
  ['Librarian', 'Librarian'],
  ['HR Manager', 'HR Manager'],
] as const;

const noticeColumns: ColDef<Notice>[] = [
  { field: 'title', headerName: 'Notice', minWidth: 220, flex: 2, filter: true },
  { field: 'priority', headerName: 'Priority', minWidth: 110, filter: true },
  { field: 'audience', headerName: 'Audience', minWidth: 170, filter: true },
  { field: 'createdBy', headerName: 'Published by', minWidth: 150 },
  { field: 'createdAt', headerName: 'Created', minWidth: 155, valueFormatter: p => p.value ? new Date(p.value).toLocaleString() : '—' },
  { field: 'expiresAt', headerName: 'Expires', minWidth: 155, valueFormatter: p => p.value ? new Date(p.value).toLocaleString() : 'Never' },
];

export function Notices({ canManage }: { canManage?: boolean }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [audienceType, setAudienceType] = useState('All');
  const [audienceValue, setAudienceValue] = useState('');
  const [form, setForm] = useState({ title: '', body: '', priority: 'General', expiresAt: '' });

  async function load() {
    setLoading(true);
    try { setNotices(await listNotices()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load notices.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const audience = useMemo(() => audienceType === 'All' ? 'All' : audienceType + ':' + audienceValue.trim(), [audienceType, audienceValue]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (audienceType !== 'All' && !audienceValue.trim()) {
      setError(audienceType === 'Role' ? 'Choose a recipient role.' : 'Enter the exact department name.');
      return;
    }
    const parsedExpiry = form.expiresAt.trim() ? new Date(form.expiresAt) : null;
    if (parsedExpiry && Number.isNaN(parsedExpiry.getTime())) {
      setError('Enter a valid notice expiry date and time.');
      return;
    }
    setSaving(true);
    try {
      await createNotice({
        title: form.title.trim(),
        body: form.body.trim(),
        priority: form.priority,
        audience,
        expiresAt: parsedExpiry ? parsedExpiry.toISOString() : null,
      });
      setForm({ title: '', body: '', priority: 'General', expiresAt: '' });
      setAudienceType('All');
      setAudienceValue('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to post notice.');
    } finally { setSaving(false); }
  }

  return (
    <section className="panel" aria-label="Notices">
      <div className="panel-heading">
        <div><span className="eyebrow">INTERNAL COMMUNICATION</span><h2>Notice Board</h2></div>
      </div>
      {canManage && <form className="grid-form" onSubmit={submit}>
        <input placeholder="Notice title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Write the notice..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required />
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          <option>General</option><option>Important</option><option>Urgent</option>
        </select>
        <select value={audienceType} onChange={e => { setAudienceType(e.target.value); setAudienceValue(''); }} aria-label="Notice audience">
          <option value="All">All authorised SMIS users</option>
          <option value="Role">Specific role</option>
          <option value="Department">Specific department</option>
        </select>
        {audienceType === 'Role' && <select value={audienceValue} onChange={e => setAudienceValue(e.target.value)} required aria-label="Recipient role">
          <option value="">Select recipient role</option>
          {noticeRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>}
        {audienceType === 'Department' && <input placeholder="Exact department name" value={audienceValue} onChange={e => setAudienceValue(e.target.value)} required />}
        <label>Expiry (optional)<input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></label>
        <button type="submit" disabled={saving}>{saving ? 'Publishing…' : 'Publish Notice'}</button>
      </form>}
      {error && <div className="error" role="alert">{error}</div>}
      {loading ? <LoadingSpinner label="Loading notices…" /> : notices.length === 0
        ? <div className="empty-state">No active notices are available for your account.</div>
        : <AgGridTable rows={notices} columns={noticeColumns} getRowId={p => p.data.id} exportFileName="smis-notices" height={440} />}
    </section>
  );
}
