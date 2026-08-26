import React, { useEffect, useState } from 'react';

type AcademicYear = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; isActive: boolean };

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/academic-structure/years', { headers: { Accept: 'application/json', ...(localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {}) } });
      if (!response.ok) throw new Error(`Unable to load academic years (${response.status}).`);
      setYears(await response.json() as AcademicYear[]);
      setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load academic years.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function createYear(event: React.FormEvent) {
    event.preventDefault();
    if (new Date(startDate) >= new Date(endDate)) { setMessage('The start date must be before the end date.'); return; }
    setSaving(true); setMessage('');
    try {
      const response = await fetch('/api/academic-structure/years', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {}) },
        body: JSON.stringify({ name: name.trim(), startDate, endDate, isCurrent: false }),
      });
      if (!response.ok) throw new Error(await response.text() || `Unable to create academic year (${response.status}).`);
      setName(''); setStartDate(''); setEndDate(''); setMessage('Academic year created.'); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create academic year.'); }
    finally { setSaving(false); }
  }

  return <section>
    <h2>Academic Years</h2>
    <form onSubmit={createYear}>
      <label>Year name <input value={name} onChange={e => setName(e.target.value)} placeholder="2026/2027" required /></label>
      <label>Start <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></label>
      <label>End <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required /></label>
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Academic Year'}</button>
    </form>
    {message && <p role="status">{message}</p>}
    {loading ? <p>Loading academic years…</p> : <table><thead><tr><th>Name</th><th>Start</th><th>End</th><th>Current</th><th>Status</th></tr></thead><tbody>
      {years.map(year => <tr key={year.id}><td>{year.name}</td><td>{year.startDate}</td><td>{year.endDate}</td><td>{year.isCurrent ? 'Yes' : 'No'}</td><td>{year.isActive ? 'Active' : 'Inactive'}</td></tr>)}
      {years.length === 0 && <tr><td colSpan={5}>No academic years found.</td></tr>}
    </tbody></table>}
  </section>;
}
