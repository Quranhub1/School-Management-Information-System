import { useEffect, useState } from 'react'
import { createTimetableEntry, deactivateTimetableEntry, generateTimetable, listTimetable, type GenerateTimetableResult, type TimetableEntry } from '../api/timetable'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function TimetableManagement() {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [generatedResult, setGeneratedResult] = useState<GenerateTimetableResult | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  async function load() {
    try { setEntries(await listTimetable()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load timetable.') }
  }
  async function loadStaff() {
    try { setStaff(await listStaff(false)) } catch (e) { /* ignore */ }
  }
  useEffect(() => { void load(); void loadStaff() }, [])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault(); setError(''); setGeneratedResult(null)
    if (!semesterId.trim()) { setError('Semester ID is required.'); return }
    setLoading(true)
    try {
      const result = await generateTimetable(semesterId.trim())
      setGeneratedResult(result)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to generate timetable.') } finally { setLoading(false) }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    const tg = (event.target as HTMLFormElement).elements.namedItem('teachingGroupId') as HTMLInputElement
    const c = (event.target as HTMLFormElement).elements.namedItem('courseId') as HTMLInputElement
    const t = (event.target as HTMLFormElement).elements.namedItem('teacherId') as HTMLInputElement
    const d = (event.target as HTMLFormElement).elements.namedItem('dayOfWeek') as HTMLSelectElement
    const s = (event.target as HTMLFormElement).elements.namedItem('startTime') as HTMLInputElement
    const e2 = (event.target as HTMLFormElement).elements.namedItem('endTime') as HTMLInputElement
    const r = (event.target as HTMLFormElement).elements.namedItem('room') as HTMLInputElement
    const st = (event.target as HTMLFormElement).elements.namedItem('sessionType') as HTMLInputElement

    if (!tg.value.trim() || !c.value.trim() || !t.value.trim()) { setError('Teaching group, course and teacher are required.'); return }
    setLoading(true)
    try {
      await createTimetableEntry({ teachingGroupId: tg.value.trim(), courseId: c.value.trim(), teacherId: t.value.trim(), dayOfWeek: Number(d.value), startTime: `${s.value}:00`, endTime: `${e2.value}:00`, room: r.value.trim() || undefined, sessionType: st.value.trim() || undefined })
      await load()
      ;(event.target as HTMLFormElement).reset()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create timetable entry.') } finally { setLoading(false) }
  }

  async function remove(id: string) { try { await deactivateTimetableEntry(id); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to deactivate entry.') } }

  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">Scheduling</p><h2>Timetable Management</h2></div><button className="secondary-button" onClick={() => setShowGenerator(!showGenerator)}>{showGenerator ? 'Hide Generator' : 'Generate Timetable'}</button></div>
    {showGenerator && (
      <form className="management-form" onSubmit={handleGenerate} style={{ marginBottom: 18 }}>
        <label>Semester ID<input value={semesterId} onChange={e => setSemesterId(e.target.value)} placeholder="Semester GUID" required /></label>
        <button type="submit" disabled={loading}>{loading ? 'Generating…' : 'Generate'}</button>
      </form>
    )}
    {generatedResult && (
      <div style={{ marginBottom: 18, padding: 12, background: generatedResult.isConflictFree ? '#e6ffed' : '#fff0f0', borderRadius: 6 }}>
        <p><strong>Optimization Score:</strong> {generatedResult.optimizationScore.toFixed(1)}%</p>
        <p><strong>Conflict Free:</strong> {generatedResult.isConflictFree ? 'Yes' : 'No'}</p>
        {generatedResult.warnings.length > 0 && <div><strong>Warnings:</strong><ul>{generatedResult.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}
        {generatedResult.unscheduled.length > 0 && <div><strong>Unscheduled:</strong><ul>{generatedResult.unscheduled.map((u, i) => <li key={i}>{u}</li>)}</ul></div>}
      </div>
    )}
    <form className="management-form" onSubmit={submit}><label>Teaching group ID<input name="teachingGroupId" required /></label><label>Course ID<input name="courseId" required /></label><label>Teacher ID<input name="teacherId" required /></label><label>Day<select name="dayOfWeek">{days.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label><label>Start<input type="time" name="startTime" required /></label><label>End<input type="time" name="endTime" required /></label><label>Room<input name="room" /></label><label>Session type<input name="sessionType" /></label><button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Schedule session'}</button></form>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Room</th><th>Type</th><th>Group</th><th>Course</th><th>Teacher</th><th /></tr></thead><tbody>{entries.map(entry => <tr key={entry.id}><td>{days[entry.dayOfWeek]}</td><td>{entry.startTime.slice(0,5)}–{entry.endTime.slice(0,5)}</td><td>{entry.room ?? '—'}</td><td>{entry.sessionType ?? '—'}</td><td>{entry.teachingGroupId}</td><td>{entry.courseId}</td><td>{entry.teacherId}</td><td><button className="secondary-button" onClick={() => void remove(entry.id)}>Remove</button></td></tr>)}{entries.length === 0 && <tr><td colSpan={8} className="empty">No timetable sessions scheduled.</td></tr>}</tbody></table></div>
  </section>
}
