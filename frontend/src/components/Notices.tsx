import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { createNotice, listNotices, type Notice } from '../api/notices';
import { AgGridTable } from './AgGridTable';
import type { ColDef } from 'ag-grid-community';

const noticeColumns: ColDef<Notice>[] = [
  { field: 'title', headerName: 'Title', minWidth: 220 },
  { field: 'priority', headerName: 'Priority' },
  { field: 'audience', headerName: 'Audience' },
];

export function Notices({ canManage }: { canManage?: boolean }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '', priority: 'General', audience: 'All', expiresAt: '' });

  async function load() { setLoading(true); try { setNotices(await listNotices()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load notices.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsedExpiry = form.expiresAt.trim() ? new Date(form.expiresAt) : null;
    if (parsedExpiry && Number.isNaN(parsedExpiry.getTime())) {
      setError('Enter a valid notice expiry date and time.');
      return;
    }

    try {
      await createNotice({
        title: form.title.trim(),
        body: form.body.trim(),
        priority: form.priority,
        audience: form.audience.trim() || 'All',
        expiresAt: parsedExpiry ? parsedExpiry.toISOString() : null,
        createdBy: '',
      });
      setForm({ title: '', body: '', priority: 'General', audience: 'All', expiresAt: '' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to post notice.');
    }
  }

  return (
    <section className="panel" aria-label="Notices">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">COMMUNICATION</span>
          <h2>Notice Board</h2>
        </div>
      </div>
      {canManage && <form className="grid-form" onSubmit={submit}><input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /><textarea placeholder="Body" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required /><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>General</option><option>Important</option><option>Urgent</option></select><input placeholder="Audience" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} /><label>Expiry (optional)<input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></label><button type="submit">Post Notice</button></form>}
      {error && <div className="error" role="alert">{error}</div>}
      {loading ? <LoadingSpinner label="Loading notices…" /> : <AgGridTable rows={notices} columns={noticeColumns} getRowId={p => p.data.id} exportFileName="smis-notices" height={440} />}
    </section>
  );
}
