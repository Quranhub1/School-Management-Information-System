import { useEffect, useState } from 'react';
import { listAlumni, createAlumni, type Alumni } from '../api/alumni';

export function AlumniManagement() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: '', graduationDate: '', programme: '', currentOccupation: '', employer: '', contactInfo: '' });

  async function load() { setLoading(true); try { setAlumni(await listAlumni()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load alumni.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, []);

   async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); try { await createAlumni({ ...form, studentId: form.studentId, graduationDate: form.graduationDate, programme: form.programme }); setForm({ studentId: '', graduationDate: '', programme: '', currentOccupation: '', employer: '', contactInfo: '' }); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to add alumni.') } }

  return <section className="panel" aria-label="Alumni">
    <div className="panel-heading"><div><span className="eyebrow">Alumni</span><h2>Alumni Management</h2></div></div>
    <form className="grid-form" onSubmit={submit}><input placeholder="Student ID" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required /><input placeholder="Graduation date" type="date" value={form.graduationDate} onChange={e => setForm({ ...form, graduationDate: e.target.value })} required /><input placeholder="Programme" value={form.programme} onChange={e => setForm({ ...form, programme: e.target.value })} required /><input placeholder="Occupation" value={form.currentOccupation} onChange={e => setForm({ ...form, currentOccupation: e.target.value })} /><input placeholder="Employer" value={form.employer} onChange={e => setForm({ ...form, employer: e.target.value })} /><button type="submit">Register Alumni</button></form>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading alumni…</p> : <div className="table-wrap"><table><thead><tr><th>Student ID</th><th>Graduation</th><th>Programme</th><th>Occupation</th><th>Employer</th></tr></thead><tbody>{alumni.map(a => <tr key={a.id}><td>{a.studentId}</td><td>{a.graduationDate}</td><td>{a.programme}</td><td>{a.currentOccupation || '—'}</td><td>{a.employer || '—'}</td></tr>)}</tbody></table></div>}
  </section>
}
