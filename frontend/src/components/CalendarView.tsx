import { useEffect, useState } from 'react';
import { createEvent, deactivateEvent, listEvents, type CalendarEvent } from '../api/calendar';

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', eventType: 'Academic', startDate: '', endDate: '', location: '' });

  async function load() { setLoading(true); try { setEvents(await listEvents()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load calendar.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, []);

  async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); try { await createEvent({ ...form, isActive: true } as any); setForm({ title: '', description: '', eventType: 'Academic', startDate: '', endDate: '', location: '' }); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create event.') } }

  async function remove(id: string) { try { await deactivateEvent(id); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to remove event.') } }

  return <section className="panel" aria-label="Calendar">
    <div className="panel-heading"><div><span className="eyebrow">Schedule</span><h2>Calendar Events</h2></div></div>
    <form className="grid-form" onSubmit={submit}><input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /><input placeholder="Event type" value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })} required /><input placeholder="Start date" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /><input placeholder="End date" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required /><input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /><button type="submit">Add Event</button></form>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading events…</p> : <div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Start</th><th>End</th><th>Location</th><th /></tr></thead><tbody>{events.map(ev => <tr key={ev.id}><td>{ev.title}</td><td>{ev.eventType}</td><td>{ev.startDate}</td><td>{ev.endDate}</td><td>{ev.location || '—'}</td><td><button className="secondary-button" onClick={() => void remove(ev.id)}>Remove</button></td></tr>)}</tbody></table></div>}
  </section>
}
