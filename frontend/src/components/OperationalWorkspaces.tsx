import { useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return await response.json() as T
}

function ErrorBox({ message }: { message: string }) {
  return message ? <div className="error" role="alert">{message}</div> : null
}

export function CalendarWorkspace() {
  const [events, setEvents] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Academic')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { setEvents(await request<any[]>('/api/calendar')) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load calendar.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function create() {
    if (!title.trim() || !start || !end) { setError('Title, start date and end date are required.'); return }
    setSaving(true); setError('')
    try {
      await request('/api/calendar', { method: 'POST', body: JSON.stringify({ title: title.trim(), description: description.trim() || null, eventType: type, startDate: start, endDate: end, location: location.trim() || null }) })
      setTitle(''); setDescription(''); setLocation(''); setStart(''); setEnd(''); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create event.') } finally { setSaving(false) }
  }

  async function deactivate(id: string) {
    if (!window.confirm('Deactivate this calendar event?')) return
    try { await request(`/api/calendar/${id}`, { method: 'DELETE' }); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to deactivate event.') }
  }

  return <section className="panel">
    <div className="panel-heading"><div><p className="eyebrow">Academic Calendar</p><h2>Institution Calendar</h2></div><button className="secondary-button" onClick={() => void load()}>Refresh</button></div>
    <ErrorBox message={error} />
    <div className="form-grid">
      <label>Title<input value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label>Event type<select value={type} onChange={e => setType(e.target.value)}><option>Academic</option><option>Examination</option><option>Holiday</option><option>Registration</option><option>Meeting</option><option>Other</option></select></label>
      <label>Start date<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>End date<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
      <label>Location<input value={location} onChange={e => setLocation(e.target.value)} /></label>
      <label>Description<input value={description} onChange={e => setDescription(e.target.value)} /></label>
    </div>
    <button onClick={() => void create()} disabled={saving}>{saving ? 'Saving…' : 'Add calendar event'}</button>
    {loading ? <p className="empty">Loading events…</p> : events.length === 0 ? <p className="empty">No active calendar events.</p> : <div className="table-wrap"><table><thead><tr><th>Event</th><th>Type</th><th>Dates</th><th>Location</th><th /></tr></thead><tbody>{events.map(x => <tr key={x.id}><td><strong>{x.title}</strong><br /><small>{x.description || ''}</small></td><td>{x.eventType}</td><td>{x.startDate} → {x.endDate}</td><td>{x.location || '—'}</td><td><button className="secondary-button" onClick={() => void deactivate(x.id)}>Deactivate</button></td></tr>)}</tbody></table></div>}
  </section>
}

export function GateLogWorkspace() {
  const [logs, setLogs] = useState<any[]>([])
  const [personName, setPersonName] = useState('')
  const [personType, setPersonType] = useState('Visitor')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { setLogs(await request<any[]>('/api/gate')) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load gate logs.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function create() {
    if (!personName.trim() || !purpose.trim()) { setError('Person name and purpose are required.'); return }
    setError('')
    try { await request('/api/gate', { method: 'POST', body: JSON.stringify({ personName: personName.trim(), personType, purpose: purpose.trim(), issuedBy: null, notes: notes.trim() || null }) }); setPersonName(''); setPurpose(''); setNotes(''); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create gate entry.') }
  }
  async function exit(id: string) {
    try { await request(`/api/gate/${id}/exit`, { method: 'PATCH' }); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to log exit.') }
  }

  return <section className="panel">
    <div className="panel-heading"><div><p className="eyebrow">Access Control</p><h2>Gate Log</h2></div><button className="secondary-button" onClick={() => void load()}>Refresh</button></div>
    <ErrorBox message={error} />
    <div className="form-grid"><label>Person name<input value={personName} onChange={e => setPersonName(e.target.value)} /></label><label>Person type<select value={personType} onChange={e => setPersonType(e.target.value)}><option>Visitor</option><option>Student</option><option>Staff</option><option>Contractor</option><option>Other</option></select></label><label>Purpose<input value={purpose} onChange={e => setPurpose(e.target.value)} /></label><label>Notes<input value={notes} onChange={e => setNotes(e.target.value)} /></label></div>
    <button onClick={() => void create()}>Record entry</button>
    {loading ? <p className="empty">Loading gate activity…</p> : logs.length === 0 ? <p className="empty">No gate entries found.</p> : <div className="table-wrap"><table><thead><tr><th>Person</th><th>Type</th><th>Purpose</th><th>Entry</th><th>Exit</th><th /></tr></thead><tbody>{logs.map(x => <tr key={x.id}><td>{x.personName}</td><td>{x.personType}</td><td>{x.purpose}</td><td>{new Date(x.entryTime).toLocaleString()}</td><td>{x.exitTime ? new Date(x.exitTime).toLocaleString() : 'Inside'}</td><td>{!x.exitTime && <button className="secondary-button" onClick={() => void exit(x.id)}>Log exit</button>}</td></tr>)}</tbody></table></div>}
  </section>
}

export function AuditLogWorkspace() {
  const [logs, setLogs] = useState<any[]>([])
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { const qs = new URLSearchParams(); if (action.trim()) qs.set('action', action.trim()); if (entityType.trim()) qs.set('entityType', entityType.trim()); setLogs(await request<any[]>(`/api/audit${qs.toString() ? `?${qs}` : ''}`)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load audit log.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  return <section className="panel">
    <div className="panel-heading"><div><p className="eyebrow">System Governance</p><h2>Audit Log</h2></div><button className="secondary-button" onClick={() => void load()}>Search</button></div>
    <ErrorBox message={error} />
    <div className="form-grid"><label>Action<input value={action} onChange={e => setAction(e.target.value)} placeholder="e.g. Create, Update" /></label><label>Entity type<input value={entityType} onChange={e => setEntityType(e.target.value)} placeholder="e.g. Student" /></label></div>
    {loading ? <p className="empty">Loading audit records…</p> : logs.length === 0 ? <p className="empty">No audit records match the current filters.</p> : <div className="table-wrap"><table><thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Record</th><th>Details</th></tr></thead><tbody>{logs.map(x => <tr key={x.id}><td>{x.timestamp ? new Date(x.timestamp).toLocaleString() : '—'}</td><td>{x.userId || 'System'}</td><td>{x.action}</td><td>{x.entityType}</td><td>{x.entityId || '—'}</td><td>{x.details || x.description || '—'}</td></tr>)}</tbody></table></div>}
  </section>
}
