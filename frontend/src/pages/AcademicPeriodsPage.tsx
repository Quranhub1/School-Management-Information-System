import React, { useEffect, useState } from 'react';

export default function AcademicPeriodsPage() {
  const [years, setYears] = useState<any[]>([]);
  const [yearId, setYearId] = useState('');
  const [periods, setPeriods] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function loadYears() {
    const r = await fetch('/api/academic-structure/years');
    if (r.ok) { const data = await r.json(); setYears(data); if (!yearId && data.length) setYearId(data[0].id); }
  }
  async function loadPeriods(id: string) {
    if (!id) return;
    const r = await fetch(`/api/academic-structure/years/${id}/periods`);
    if (r.ok) setPeriods(await r.json());
  }
  useEffect(() => { void loadYears(); }, []);
  useEffect(() => { void loadPeriods(yearId); }, [yearId]);

  async function createPeriod(event: React.FormEvent) {
    event.preventDefault();
    const r = await fetch(`/api/academic-structure/years/${yearId}/periods`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sequence, startDate, endDate, isCurrent: false })
    });
    if (r.ok) { setName(''); setStartDate(''); setEndDate(''); await loadPeriods(yearId); }
  }

  return <section>
    <h1>Academic Periods</h1>
    <select value={yearId} onChange={e => setYearId(e.target.value)}>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
    <form onSubmit={createPeriod}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Semester 1" required />
      <input type="number" min={1} value={sequence} onChange={e => setSequence(Number(e.target.value))} required />
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
      <button type="submit" disabled={!yearId}>Add Period</button>
    </form>
    <table><thead><tr><th>Sequence</th><th>Name</th><th>Start</th><th>End</th><th>Current</th></tr></thead>
      <tbody>{periods.map(p => <tr key={p.id}><td>{p.sequence}</td><td>{p.name}</td><td>{p.startDate}</td><td>{p.endDate}</td><td>{p.isCurrent ? 'Yes' : 'No'}</td></tr>)}</tbody>
    </table>
  </section>;
}
