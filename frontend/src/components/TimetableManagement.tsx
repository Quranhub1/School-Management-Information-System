import { useEffect, useState } from 'react'
import { createTimetableEntry, deactivateTimetableEntry, listTimetable, type TimetableEntry } from '../api/timetable'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function TimetableManagement() {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [teachingGroupId, setTeachingGroupId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')
  const [room, setRoom] = useState('')
  const [sessionType, setSessionType] = useState('Lecture')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    try { setEntries(await listTimetable()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load timetable.') }
  }
  useEffect(() => { void load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    if (!teachingGroupId.trim()) { setError('Teaching group ID is required.'); return }
    setLoading(true)
    try {
      await createTimetableEntry({ teachingGroupId: teachingGroupId.trim(), dayOfWeek: Number(dayOfWeek), startTime: `${startTime}:00`, endTime: `${endTime}:00`, room: room.trim() || undefined, sessionType: sessionType.trim() || undefined })
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create timetable entry.') } finally { setLoading(false) }
  }

  async function remove(id: string) { try { await deactivateTimetableEntry(id); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to deactivate entry.') } }

  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">Scheduling</p><h2>Timetable Management</h2></div></div>
    <form className="management-form" onSubmit={submit}><label>Teaching group ID<input value={teachingGroupId} onChange={e => setTeachingGroupId(e.target.value)} /></label><label>Day<select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>{days.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label><label>Start<input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></label><label>End<input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></label><label>Room<input value={room} onChange={e => setRoom(e.target.value)} /></label><label>Session type<input value={sessionType} onChange={e => setSessionType(e.target.value)} /></label><button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Schedule session'}</button></form>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Room</th><th>Type</th><th>Group</th><th /></tr></thead><tbody>{entries.map(entry => <tr key={entry.id}><td>{days[entry.dayOfWeek]}</td><td>{entry.startTime.slice(0,5)}–{entry.endTime.slice(0,5)}</td><td>{entry.room ?? '—'}</td><td>{entry.sessionType ?? '—'}</td><td>{entry.teachingGroupId}</td><td><button className="secondary-button" onClick={() => void remove(entry.id)}>Remove</button></td></tr>)}{entries.length === 0 && <tr><td colSpan={6} className="empty">No timetable sessions scheduled.</td></tr>}</tbody></table></div>
  </section>
}
