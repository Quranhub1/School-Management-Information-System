import { useEffect, useState } from 'react';
import { createGateLog, logGateExit, searchGateLogs, type GateLog } from '../api/gateLog';

export function GateLogManagement() {
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ personName: '', personType: 'Student', purpose: '', notes: '' });

  async function load() { setLoading(true); try { setLogs(await searchGateLogs()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load gate logs.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, []);

  async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); try { await createGateLog({ ...form, issuedBy: undefined }); setForm({ personName: '', personType: 'Student', purpose: '', notes: '' }); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to log entry.') } }

  async function exit(id: string) { try { await logGateExit(id); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to log exit.') } }

  return <section className="panel" aria-label="Gate Log">
    <div className="panel-heading"><div><span className="eyebrow">Access</span><h2>Gate Log</h2></div></div>
    <form className="grid-form" onSubmit={submit}><input placeholder="Name" value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} required /><select value={form.personType} onChange={e => setForm({ ...form, personType: e.target.value })}><option>Student</option><option>Staff</option><option>Visitor</option></select><input placeholder="Purpose" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} required /><input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /><button type="submit">Log Entry</button></form>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading gate logs…</p> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Entry</th><th>Exit</th><th /></tr></thead><tbody>{logs.map(l => <tr key={l.id}><td>{l.personName}</td><td>{l.personType}</td><td>{l.purpose}</td><td>{new Date(l.entryTime).toLocaleString()}</td><td>{l.exitTime ? new Date(l.exitTime).toLocaleString() : '—'}</td><td>{!l.exitTime && <button className="secondary-button" onClick={() => void exit(l.id)}>Log Exit</button>}</td></tr>)}</tbody></table></div>}
  </section>
}
