import { useEffect, useState } from 'react';
import { listAlumni, createAlumni, updateAlumni, type Alumni } from '../api/alumni';

export function AlumniManagement() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programme, setProgramme] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [form, setForm] = useState({ studentId: '', graduationDate: '', programme: '', currentOccupation: '', employer: '', contactInfo: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ currentOccupation: '', employer: '', contactInfo: '' });

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listAlumni(search, programme, fromDate, toDate)
      setAlumni(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load alumni.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await createAlumni({ ...form, studentId: form.studentId, graduationDate: form.graduationDate, programme: form.programme })
      setForm({ studentId: '', graduationDate: '', programme: '', currentOccupation: '', employer: '', contactInfo: '' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add alumni.')
    }
  }

  function startEdit(alumni: Alumni) {
    setEditingId(alumni.id)
    setEditForm({ currentOccupation: alumni.currentOccupation || '', employer: alumni.employer || '', contactInfo: alumni.contactInfo || '' })
  }

  async function saveEdit() {
    if (!editingId) return
    setError('')
    try {
      await updateAlumni(editingId, editForm)
      setEditingId(null)
      setEditForm({ currentOccupation: '', employer: '', contactInfo: '' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update alumni.')
    }
  }

  return <section className="panel" aria-label="Alumni">
    <div className="panel-heading"><div><span className="eyebrow">Alumni</span><h2>Alumni Management</h2></div></div>
    <form className="grid-form" onSubmit={submit}><input placeholder="Student ID" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required /><input placeholder="Graduation date" type="date" value={form.graduationDate} onChange={e => setForm({ ...form, graduationDate: e.target.value })} required /><input placeholder="Programme" value={form.programme} onChange={e => setForm({ ...form, programme: e.target.value })} required /><input placeholder="Occupation" value={form.currentOccupation} onChange={e => setForm({ ...form, currentOccupation: e.target.value })} /><input placeholder="Employer" value={form.employer} onChange={e => setForm({ ...form, employer: e.target.value })} /><button type="submit">Register Alumni</button></form>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="library-toolbar" style={{ margin: '18px 0' }}>
      <div>
        <h3>Alumni Directory</h3>
        <p>Search and filter alumni records.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input placeholder="Search name or student number" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load()} />
        <input placeholder="Programme" value={programme} onChange={e => setProgramme(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load()} />
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Graduation from" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Graduation to" />
        <button className="secondary-button" onClick={() => void load()}>Search</button>
        <button className="secondary-button" onClick={() => { setSearch(''); setProgramme(''); setFromDate(''); setToDate(''); void load() }}>Clear</button>
      </div>
    </div>
    {loading ? <p className="empty">Loading alumni…</p> : <div className="table-wrap"><table><thead><tr><th>Student ID</th><th>Graduation</th><th>Programme</th><th>Occupation</th><th>Employer</th><th>Actions</th></tr></thead><tbody>{alumni.map(a => <tr key={a.id}><td>{a.studentId}</td><td>{a.graduationDate}</td><td>{a.programme}</td><td>{a.currentOccupation || '—'}</td><td>{a.employer || '—'}</td><td>{editingId === a.id ? <><button className="secondary-button" onClick={() => void saveEdit()}>Save</button><button className="secondary-button" onClick={() => setEditingId(null)}>Cancel</button></> : <button className="secondary-button" onClick={() => startEdit(a)}>Edit</button>}</td></tr>)}</tbody></table></div>}
  </section>
}
