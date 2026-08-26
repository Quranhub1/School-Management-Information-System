import { useEffect, useState } from 'react';
import { listNotices, type Notice } from '../api/notices';

export function StudentPortal() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState('');

  async function load() { setError(''); try { setNotices(await listNotices()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load portal data.') } }
  useEffect(() => { void load() }, []);

  return <section className="panel" aria-label="Student Portal">
    <div className="panel-heading"><div><span className="eyebrow">STUDENT</span><h2>Student Portal</h2></div></div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="summary-grid">
      <div className="summary-card"><span>Attendance</span><strong>95%</strong><small>This semester</small></div>
      <div className="summary-card"><span>GPA</span><strong>3.8</strong><small>Current term</small></div>
      <div className="summary-card"><span>Assignments</span><strong>4</strong><small>Pending submissions</small></div>
    </div>
    <h3 style={{ margin: '22px 0 10px' }}>Notices</h3>
    <div className="table-wrap"><table><thead><tr><th>Title</th><th>Priority</th><th>Audience</th></tr></thead><tbody>{notices.map(n => <tr key={n.id}><td>{n.title}</td><td>{n.priority}</td><td>{n.audience}</td></tr>)}</tbody></table></div>
  </section>
}
