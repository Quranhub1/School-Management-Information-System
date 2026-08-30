import { useEffect, useState } from 'react';
import { createNotice, listNotices, type Notice } from '../api/notices';

export function NoticeBoard({ canManage }: { canManage?: boolean }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '', priority: 'General', audience: 'All', expiresAt: '' });

  async function load() { setLoading(true); try { setNotices(await listNotices()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load notices.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, []);

  async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); try { await createNotice({ ...form, createdBy: '' } as any); setForm({ title: '', body: '', priority: 'General', audience: 'All', expiresAt: '' }); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to post notice.') } }

  return <section className="panel" aria-label="Notice Board">
    <div className="panel-heading"><div><span className="eyebrow">COMMUNICATION</span><h2>Notice Board</h2></div></div>
    {canManage && <form className="grid-form" onSubmit={submit}><input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /><textarea placeholder="Body" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required /><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>General</option><option>Important</option><option>Urgent</option></select><input placeholder="Audience" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} /><button type="submit">Post Notice</button></form>}
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading notices…</p> : <div className="table-wrap"><table><thead><tr><th>Title</th><th>Priority</th><th>Audience</th><th>Expires</th></tr></thead><tbody>{notices.map(n => <tr key={n.id}><td>{n.title}</td><td>{n.priority}</td><td>{n.audience}</td><td>{n.expiresAt || '—'}</td></tr>)}</tbody></table></div>}
  </section>
}
