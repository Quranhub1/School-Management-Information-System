import React, { useEffect, useState } from 'react';

export default function AcademicYearsPage() {
  const [years, setYears] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/academic-structure/years');
    if (response.ok) setYears(await response.json());
  }

  useEffect(() => { void load(); }, []);

  async function createYear(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/academic-structure/years', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate, isCurrent: false })
    });
    setMessage(response.ok ? 'Academic year created.' : await response.text());
    if (response.ok) { setName(''); setStartDate(''); setEndDate(''); await load(); }
  }

  return <section>
    <h1>Academic Years</h1>
    <form onSubmit={createYear}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="2026/2027" required />
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
      <button type="submit">Add Academic Year</button>
    </form>
    {message && <p>{message}</p>}
    <table><thead><tr><th>Name</th><th>Start</th><th>End</th><th>Current</th><th>Status</th></tr></thead>
      <tbody>{years.map(year => <tr key={year.id}><td>{year.name}</td><td>{year.startDate}</td><td>{year.endDate}</td><td>{year.isCurrent ? 'Yes' : 'No'}</td><td>{year.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody>
    </table>
  </section>;
}
