import React, { useEffect, useState } from 'react';

type AcademicYear = { id: string; name: string };
type AcademicPeriod = { id: string; name: string; sequence: number; startDate: string; endDate: string; isCurrent: boolean };

export default function AcademicPeriodsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState('');
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadYears() {
    const response = await fetch('/api/academic-structure/years', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Unable to load academic years (${response.status}).`);
    const data = await response.json() as AcademicYear[];
    setYears(data); if (!yearId && data.length) setYearId(data[0].id);
  }
  async function loadPeriods(id: string) {
    if (!id) { setPeriods([]); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/academic-structure/years/${id}/periods`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Unable to load academic periods (${response.status}).`);
      setPeriods(await response.json() as AcademicPeriod[]);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load academic periods.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadYears().catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load academic years.')); }, []);
  useEffect(() => { void loadPeriods(yearId); }, [yearId]);

  async function createPeriod(event: React.FormEvent) {
    event.preventDefault();
    if (!yearId) return;
    if (new Date(startDate) >= new Date(endDate)) { setMessage('The period start date must be before its end date.'); return; }
    try {
      const response = await fetch(`/api/academic-structure/years/${yearId}/periods`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: name.trim(), sequence, startDate, endDate, isCurrent: false }),
      });
      if (!response.ok) throw new Error(await response.text() || `Unable to create period (${response.status}).`);
      setName(''); setStartDate(''); setEndDate(''); setMessage('Academic period created.'); await loadPeriods(yearId);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create academic period.'); }
  }

  return <section>
    <h2>Academic Periods</h2>
    <label>Academic year <select value={yearId} onChange={e => setYearId(e.target.value)}><option value="">Select year</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select></label>
    <form onSubmit={createPeriod}>
      <label>Name <input value={name} onChange={e => setName(e.target.value)} placeholder="Semester 1" required /></label>
      <label>Sequence <input type="number" min={1} value={sequence} onChange={e => setSequence(Number(e.target.value))} required /></label>
      <label>Start <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></label>
      <label>End <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required /></label>
      <button type="submit" disabled={!yearId}>Add Period</button>
    </form>
    {message && <p role="status">{message}</p>}
    {loading ? <p>Loading periods…</p> : <table><thead><tr><th>Sequence</th><th>Name</th><th>Start</th><th>End</th><th>Current</th></tr></thead><tbody>
      {periods.map(p => <tr key={p.id}><td>{p.sequence}</td><td>{p.name}</td><td>{p.startDate}</td><td>{p.endDate}</td><td>{p.isCurrent ? 'Yes' : 'No'}</td></tr>)}
      {periods.length === 0 && <tr><td colSpan={5}>No periods found for this academic year.</td></tr>}
    </tbody></table>}
  </section>;
}
