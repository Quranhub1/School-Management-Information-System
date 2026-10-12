import { useCallback, useEffect, useMemo, useState } from 'react'
import LoadingSpinner from './LoadingSpinner';
import { createTimetableEntry, deactivateTimetableEntry, generateTimetable, getTimetableOptions, listTimetable, type GenerateTimetableResult, type TimetableEntry, type TimetableOptions } from '../api/timetable'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const emptyOptions: TimetableOptions = { teachingGroups: [], courses: [], teachers: [], semesters: [] }

export function TimetableManagement({ readOnly = false }: { readOnly?: boolean } = {}) {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [options, setOptions] = useState<TimetableOptions>(emptyOptions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [teachingGroupId, setTeachingGroupId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [room, setRoom] = useState('')
  const [sessionType, setSessionType] = useState('Lecture')
  const [generatedResult, setGeneratedResult] = useState<GenerateTimetableResult | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [loadedEntries, loadedOptions] = await Promise.all([listTimetable(), getTimetableOptions()])
      setEntries(loadedEntries)
      setOptions(loadedOptions)
      setSemesterId(current => current || loadedOptions.semesters.find(item => item.isCurrent && item.isActive)?.id || loadedOptions.semesters.find(item => item.isActive)?.id || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load timetable data.')
    }
  }, [])
  useEffect(() => { setLoading(true); void load().finally(() => setLoading(false)) }, [load])

  const groupLabels = useMemo(() => new Map(options.teachingGroups.map(item => [item.id, item.label])), [options.teachingGroups])
  const courseLabels = useMemo(() => new Map(options.courses.map(item => [item.id, item.label])), [options.courses])
  const teacherLabels = useMemo(() => new Map(options.teachers.map(item => [item.id, item.label])), [options.teachers])
  const activeSemesters = options.semesters.filter(item => item.isActive)

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault(); setError(''); setGeneratedResult(null)
    if (!semesterId) { setError('Select an academic period before generating a timetable.'); return }
    setLoading(true)
    try {
      const result = await generateTimetable(semesterId, teachingGroupId || undefined)
      setGeneratedResult(result)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to generate timetable.') }
    finally { setLoading(false) }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    if (!teachingGroupId || !courseId || !teacherId) { setError('Select a teaching group, course and teacher from the saved records.'); return }
    if (endTime <= startTime) { setError('End time must be later than start time.'); return }
    setLoading(true)
    try {
      await createTimetableEntry({ teachingGroupId, courseId, teacherId, dayOfWeek: Number(dayOfWeek), startTime: `${startTime}:00`, endTime: `${endTime}:00`, room: room.trim() || undefined, sessionType: sessionType.trim() || undefined })
      setError('')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create timetable entry.') }
    finally { setLoading(false) }
  }

  async function remove(id: string) {
    setError('')
    try { await deactivateTimetableEntry(id); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to deactivate entry.') }
  }

  return <section className="panel">
    <div className="section-heading"><div><p className="eyebrow">Scheduling</p><h2>{readOnly ? 'Timetable · Read-only' : 'Timetable Management'}</h2><p>Select real teaching groups, courses and staff instead of entering database IDs manually.</p></div>{!readOnly && <button className="secondary-button" type="button" onClick={() => setShowGenerator(!showGenerator)}>{showGenerator ? 'Hide Generator' : 'Generate Timetable'}</button>}</div>
    {error && <div className="error" role="alert">{error}</div>}
    {!readOnly && showGenerator && <form className="management-form" onSubmit={handleGenerate} style={{ marginBottom: 18 }}>
      <label>Academic period<select value={semesterId} onChange={event => setSemesterId(event.target.value)} required><option value="">Select period</option>{activeSemesters.map(item => <option key={item.id} value={item.id}>{item.label}{item.isCurrent ? ' (Current)' : ''}</option>)}</select></label>
      <label>Teaching group (optional)<select value={teachingGroupId} onChange={event => setTeachingGroupId(event.target.value)}><option value="">All eligible groups</option>{options.teachingGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <button type="submit" disabled={loading || activeSemesters.length === 0}>{loading ? 'Generating…' : 'Generate'}</button>
      {activeSemesters.length === 0 && <p className="empty">Create an active academic period before generating a timetable.</p>}
    </form>}
    {generatedResult && <div style={{ marginBottom: 18, padding: 12, background: generatedResult.isConflictFree ? '#e6ffed' : '#fff0f0', borderRadius: 6 }}>
      <p><strong>Optimization score:</strong> {generatedResult.optimizationScore.toFixed(1)}%</p><p><strong>Conflict free:</strong> {generatedResult.isConflictFree ? 'Yes' : 'No'}</p>
      {generatedResult.warnings.length > 0 && <div><strong>Warnings:</strong><ul>{generatedResult.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
      {generatedResult.unscheduled.length > 0 && <div><strong>Unscheduled:</strong><ul>{generatedResult.unscheduled.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
    </div>}
    {!readOnly && <form className="management-form" onSubmit={submit}>
      <label>Teaching group<select value={teachingGroupId} onChange={event => setTeachingGroupId(event.target.value)} required><option value="">Select teaching group</option>{options.teachingGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Course<select value={courseId} onChange={event => setCourseId(event.target.value)} required><option value="">Select course</option>{options.courses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Teacher / staff member<select value={teacherId} onChange={event => setTeacherId(event.target.value)} required><option value="">Select teacher</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Day<select value={dayOfWeek} onChange={event => setDayOfWeek(event.target.value)}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
      <label>Start<input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} required /></label>
      <label>End<input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} required /></label>
      <label>Room / venue<input value={room} onChange={event => setRoom(event.target.value)} maxLength={100} /></label>
      <label>Session type<select value={sessionType} onChange={event => setSessionType(event.target.value)}><option>Lecture</option><option>Practical</option><option>Tutorial</option><option>Seminar</option><option>Examination</option><option>Other</option></select></label>
      <button type="submit" disabled={loading || !options.teachingGroups.length || !options.courses.length || !options.teachers.length}>{loading ? 'Saving…' : 'Schedule session'}</button>
      {(!options.teachingGroups.length || !options.courses.length || !options.teachers.length) && <p className="empty">Scheduling options are incomplete. Ensure active teaching groups, courses and staff records exist.</p>}
    </form>}
    <div className="table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Room</th><th>Type</th><th>Group</th><th>Course</th><th>Teacher</th>{!readOnly && <th>Actions</th>}</tr></thead><tbody>
      {entries.map(entry => <tr key={entry.id}><td>{days[entry.dayOfWeek] ?? '—'}</td><td>{entry.startTime.slice(0, 5)}–{entry.endTime.slice(0, 5)}</td><td>{entry.room ?? '—'}</td><td>{entry.sessionType ?? '—'}</td><td>{groupLabels.get(entry.teachingGroupId) ?? entry.teachingGroupId}</td><td>{courseLabels.get(entry.courseId) ?? entry.courseId}</td><td>{teacherLabels.get(entry.teacherId) ?? entry.teacherId}</td>{!readOnly && <td><button className="secondary-button" type="button" onClick={() => void remove(entry.id)}>Remove</button></td>}</tr>)}
      {entries.length === 0 && <tr><td colSpan={readOnly ? 7 : 8} className="empty">{loading ? <LoadingSpinner label="Loading timetable…" /> : 'No timetable sessions scheduled.'}</td></tr>}
    </tbody></table></div>
  </section>
}
