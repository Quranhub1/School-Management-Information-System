import { useEffect, useState } from 'react';
import { createEvent, deactivateEvent, listEvents, listReminders, createReminder, markReminderSent, type CalendarEvent, type CalendarReminder } from '../api/calendar';

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', eventType: 'Academic', startDate: '', endDate: '', location: '' });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [reminders, setReminders] = useState<CalendarReminder[]>([]);
  const [reminderForm, setReminderForm] = useState({ recipientType: 'All', recipientId: '', message: '', remindOnUtc: '', channel: 'InApp' });
  const [reminderLoading, setReminderLoading] = useState(false);

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listEvents()
      setEvents(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load calendar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function loadReminders(eventId: string) {
    setSelectedEventId(eventId)
    setReminderLoading(true)
    setError('')
    try {
      const data = await listReminders(eventId)
      setReminders(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load reminders.')
    } finally {
      setReminderLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await createEvent({ ...form, isActive: true } as any)
      setForm({ title: '', description: '', eventType: 'Academic', startDate: '', endDate: '', location: '' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create event.')
    }
  }

  async function remove(id: string) {
    try {
      await deactivateEvent(id)
      if (selectedEventId === id) {
        setSelectedEventId(null)
        setReminders([])
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove event.')
    }
  }

  async function addReminder(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEventId) return
    setError('')
    try {
      await createReminder(selectedEventId, { ...reminderForm, remindOnUtc: reminderForm.remindOnUtc })
      setReminderForm({ recipientType: 'All', recipientId: '', message: '', remindOnUtc: '', channel: 'InApp' })
      const data = await listReminders(selectedEventId)
      setReminders(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add reminder.')
    }
  }

  async function handleMarkSent(reminderId: string) {
    if (!selectedEventId) return
    setError('')
    try {
      await markReminderSent(selectedEventId, reminderId)
      const data = await listReminders(selectedEventId)
      setReminders(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to mark reminder as sent.')
    }
  }

  const selectedEvent = events.find(e => e.id === selectedEventId)

  return <section className="panel" aria-label="Calendar">
    <div className="panel-heading"><div><span className="eyebrow">Schedule</span><h2>Calendar Events</h2></div></div>
    <form className="grid-form" onSubmit={submit}><input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /><input placeholder="Event type" value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })} required /><input placeholder="Start date" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /><input placeholder="End date" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required /><input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /><button type="submit">Add Event</button></form>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading events…</p> : <div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Start</th><th>End</th><th>Location</th><th>Reminders</th><th /></tr></thead><tbody>{events.map(ev => <tr key={ev.id}><td>{ev.title}</td><td>{ev.eventType}</td><td>{ev.startDate}</td><td>{ev.endDate}</td><td>{ev.location || '—'}</td><td><button className="secondary-button" onClick={() => loadReminders(ev.id)}>View</button></td><td><button className="secondary-button" onClick={() => void remove(ev.id)}>Remove</button></td></tr>)}</tbody></table></div>}
    {selectedEvent && (
      <div className="panel" style={{ marginTop: 22, padding: 22 }}>
        <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
          <div>
            <span className="eyebrow">REMINDERS</span>
            <h3>Reminders for {selectedEvent.title}</h3>
          </div>
        </div>
        <form onSubmit={addReminder} className="grid-form" style={{ marginBottom: 18 }}>
          <select value={reminderForm.recipientType} onChange={e => setReminderForm({ ...reminderForm, recipientType: e.target.value })}>
            <option value="All">All</option>
            <option value="Student">Students</option>
            <option value="Staff">Staff</option>
          </select>
          <input placeholder="Recipient ID (optional)" value={reminderForm.recipientId} onChange={e => setReminderForm({ ...reminderForm, recipientId: e.target.value })} />
          <input placeholder="Message" value={reminderForm.message} onChange={e => setReminderForm({ ...reminderForm, message: e.target.value })} required />
          <input type="date" value={reminderForm.remindOnUtc} onChange={e => setReminderForm({ ...reminderForm, remindOnUtc: e.target.value })} required />
          <select value={reminderForm.channel} onChange={e => setReminderForm({ ...reminderForm, channel: e.target.value })}>
            <option value="InApp">In-App</option>
            <option value="SMS">SMS</option>
            <option value="Email">Email</option>
          </select>
          <button type="submit" disabled={reminderLoading}>{reminderLoading ? 'Adding…' : 'Add Reminder'}</button>
        </form>
        {reminderLoading ? <p className="empty">Loading reminders…</p> : <div className="table-wrap"><table><thead><tr><th>Channel</th><th>Recipient</th><th>Message</th><th>Remind On</th><th>Status</th><th>Actions</th></tr></thead><tbody>{reminders.length === 0 ? <tr><td colSpan={6} className="empty">No reminders set</td></tr> : reminders.map(r => <tr key={r.id}><td>{r.channel}</td><td>{r.recipientType}{r.recipientId ? ` (${r.recipientId})` : ''}</td><td>{r.message || '—'}</td><td>{r.remindOnUtc}</td><td>{r.isSent ? 'Sent' : 'Pending'}</td><td>{!r.isSent && <button className="secondary-button" onClick={() => void handleMarkSent(r.id)}>Mark Sent</button>}</td></tr>)}</tbody></table></div>}
      </div>
    )}
  </section>
}
