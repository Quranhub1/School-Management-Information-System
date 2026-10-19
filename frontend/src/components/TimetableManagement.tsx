import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, LayoutGrid, List, Plus, Sparkles, Trash2 } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { createTimetableEntry, deactivateTimetableEntry, generateTimetable, getTimetableOptions, listTimetable, type GenerateTimetableResult, type TimetableEntry, type TimetableOptions } from '../api/timetable'
import './TimetableManagement.css'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const emptyOptions: TimetableOptions = { teachingGroups: [], courses: [], teachers: [], semesters: [] }
const timeLabel = (value: string) => value.slice(0, 5)
const timeRange = (entry: TimetableEntry) => timeLabel(entry.startTime) + '–' + timeLabel(entry.endTime)

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
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [view, setView] = useState<'week' | 'list'>('week')

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

  useEffect(() => {
    setLoading(true)
    void load().finally(() => setLoading(false))
  }, [load])

  const groupLabels = useMemo(() => new Map(options.teachingGroups.map(item => [item.id, item.label])), [options.teachingGroups])
  const courseLabels = useMemo(() => new Map(options.courses.map(item => [item.id, item.label])), [options.courses])
  const teacherLabels = useMemo(() => new Map(options.teachers.map(item => [item.id, item.label])), [options.teachers])
  const activeSemesters = options.semesters.filter(item => item.isActive)
  const activeEntries = useMemo(() => entries.filter(item => item.isActive), [entries])
  const distinctGroups = useMemo(() => new Set(activeEntries.map(item => item.teachingGroupId)).size, [activeEntries])
  const distinctTeachers = useMemo(() => new Set(activeEntries.map(item => item.teacherId)).size, [activeEntries])
  const practicalCount = useMemo(() => activeEntries.filter(item => item.sessionType?.toLowerCase() === 'practical').length, [activeEntries])
  const orderedEntries = useMemo(() => [...activeEntries].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)), [activeEntries])
  const timeSlots = useMemo(() => [...new Set(activeEntries.map(entry => entry.startTime))].sort((a, b) => a.localeCompare(b)), [activeEntries])

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setGeneratedResult(null)
    if (!semesterId) { setError('Select an active academic period before generating a timetable.'); return }
    setLoading(true)
    try {
      const result = await generateTimetable(semesterId, teachingGroupId || undefined)
      setGeneratedResult(result)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate timetable.')
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (!teachingGroupId || !courseId || !teacherId) { setError('Select a teaching group, course and teacher from the saved records.'); return }
    if (endTime <= startTime) { setError('End time must be later than start time.'); return }
    setLoading(true)
    try {
      await createTimetableEntry({
        teachingGroupId,
        courseId,
        teacherId,
        dayOfWeek: Number(dayOfWeek),
        startTime: startTime + ':00',
        endTime: endTime + ':00',
        room: room.trim() || undefined,
        sessionType: sessionType.trim() || undefined,
      })
      setShowScheduleForm(false)
      setError('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create timetable entry.')
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this timetable session?')) return
    setError('')
    try {
      await deactivateTimetableEntry(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to deactivate entry.')
    }
  }

  return <section className="timetable-screen">
    <header className="timetable-hero">
      <div>
        <p className="timetable-eyebrow">Academic planning</p>
        <h2>{readOnly ? 'Timetable' : 'Timetable management'}</h2>
        <p>Review the weekly teaching schedule, rooms and staff assignments in one place.</p>
      </div>
      <div className="timetable-actions">
        {!readOnly && <button className="timetable-action" type="button" onClick={() => setShowGenerator(value => !value)} aria-expanded={showGenerator}><Sparkles /> {showGenerator ? 'Hide generator' : 'Generate timetable'}</button>}
        {!readOnly && <button className="timetable-action primary" type="button" onClick={() => setShowScheduleForm(value => !value)} aria-expanded={showScheduleForm}><Plus /> {showScheduleForm ? 'Close form' : 'Schedule session'}</button>}
      </div>
    </header>

    {error && <div className="timetable-notice" role="alert">{error}</div>}

    <div className="timetable-metrics" aria-label="Timetable summary">
      <div className="timetable-metric"><span>Scheduled sessions</span><strong>{activeEntries.length}</strong></div>
      <div className="timetable-metric"><span>Teaching groups</span><strong>{distinctGroups}</strong></div>
      <div className="timetable-metric"><span>Assigned teachers</span><strong>{distinctTeachers}</strong></div>
      <div className="timetable-metric"><span>Practical sessions</span><strong>{practicalCount}</strong></div>
    </div>

    {!readOnly && showGenerator && <form className="timetable-form-panel" onSubmit={handleGenerate}>
      <h3>Generate a timetable</h3>
      <div className="timetable-form-grid">
        <label>Academic period<select value={semesterId} onChange={event => setSemesterId(event.target.value)} required><option value="">Select period</option>{activeSemesters.map(item => <option key={item.id} value={item.id}>{item.label}{item.isCurrent ? ' (Current)' : ''}</option>)}</select></label>
        <label>Teaching group<select value={teachingGroupId} onChange={event => setTeachingGroupId(event.target.value)}><option value="">All eligible groups</option>{options.teachingGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
      <div className="timetable-form-footer">
        <button className="timetable-action primary" type="submit" disabled={loading || activeSemesters.length === 0}>{loading ? 'Generating…' : 'Generate schedule'}</button>
        {activeSemesters.length === 0 && <span className="timetable-day-empty">Create an active academic period before generating.</span>}
      </div>
    </form>}

    {!readOnly && showScheduleForm && <form className="timetable-form-panel" onSubmit={submit}>
      <h3>Schedule a teaching session</h3>
      <div className="timetable-form-grid">
        <label>Teaching group<select value={teachingGroupId} onChange={event => setTeachingGroupId(event.target.value)} required><option value="">Select group</option>{options.teachingGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Course<select value={courseId} onChange={event => setCourseId(event.target.value)} required><option value="">Select course</option>{options.courses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Teacher / staff<select value={teacherId} onChange={event => setTeacherId(event.target.value)} required><option value="">Select teacher</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Day<select value={dayOfWeek} onChange={event => setDayOfWeek(event.target.value)}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
        <label>Start time<input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} required /></label>
        <label>End time<input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} required /></label>
        <label>Room / venue<input value={room} onChange={event => setRoom(event.target.value)} maxLength={100} /></label>
        <label>Session type<select value={sessionType} onChange={event => setSessionType(event.target.value)}><option>Lecture</option><option>Practical</option><option>Tutorial</option><option>Seminar</option><option>Examination</option><option>Other</option></select></label>
      </div>
      <div className="timetable-form-footer">
        <button className="timetable-action primary" type="submit" disabled={loading || !options.teachingGroups.length || !options.courses.length || !options.teachers.length}>{loading ? 'Saving…' : 'Save session'}</button>
        <button className="timetable-action" type="button" onClick={() => setShowScheduleForm(false)}>Cancel</button>
        {(!options.teachingGroups.length || !options.courses.length || !options.teachers.length) && <span className="timetable-day-empty">Add teaching groups, courses and staff before scheduling.</span>}
      </div>
    </form>}

    {generatedResult && <section className="timetable-result" aria-live="polite">
      <h3>Generation result</h3>
      <p><strong>Optimization score:</strong> {generatedResult.optimizationScore.toFixed(1)}%</p>
      <p><strong>Conflict status:</strong> {generatedResult.isConflictFree ? 'No conflicts reported' : 'Conflicts detected'}</p>
      {generatedResult.conflicts.length > 0 && <div><strong>Conflicts</strong><ul>{generatedResult.conflicts.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
      {generatedResult.warnings.length > 0 && <div><strong>Warnings</strong><ul>{generatedResult.warnings.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
      {generatedResult.unscheduled.length > 0 && <div><strong>Unscheduled</strong><ul>{generatedResult.unscheduled.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
    </section>}

    <div className="timetable-toolbar">
      <h3>Weekly schedule <span>({activeEntries.length})</span></h3>
      <div className="timetable-view-switch" role="group" aria-label="Schedule display">
        <button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}><LayoutGrid /> Week</button>
        <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><List /> List</button>
      </div>
    </div>

    {loading && activeEntries.length === 0 ? <div className="timetable-empty"><LoadingSpinner label="Loading timetable…" /></div> : activeEntries.length === 0 ? <div className="timetable-empty"><CalendarDays size={26} /><strong>No sessions scheduled yet</strong><span>Schedule or generate sessions to populate the formal weekly timetable.</span></div> : view === 'week' ? <div className="timetable-print-area">
      <div className="timetable-document-heading">
        <div className="timetable-document-mark">KSHS</div>
        <p>REPUBLIC OF UGANDA</p>
        <h3>KAMPALA SCHOOL OF HEALTH SCIENCES</h3>
        <p>TEACHING TIMETABLE</p>
        <small>Academic year and semester are managed in the academic structure.</small>
      </div>
      <div className="timetable-grid-scroll">
        <table className="timetable-formal-grid">
          <thead><tr><th className="timetable-day-column">DAY</th>{timeSlots.map((slot, index) => <th key={slot}><span className="timetable-period-label">PERIOD {index + 1}</span><strong>{timeLabel(slot)}</strong><span>START TIME</span></th>)}</tr></thead>
          <tbody>{weekOrder.filter(day => day !== 0).map(dayIndex => <tr key={dayIndex}>
            <th className="timetable-day-column">{days[dayIndex].toUpperCase()}</th>
            {timeSlots.map(slot => {
              const cellEntries = orderedEntries.filter(entry => entry.dayOfWeek === dayIndex && entry.startTime === slot)
              return <td key={slot} className={cellEntries.length ? 'has-session' : 'empty-session'}>
                {cellEntries.map(entry => <article className="timetable-grid-session" key={entry.id}>
                  <strong>{courseLabels.get(entry.courseId) ?? 'Course not found'}</strong>
                  <span>{groupLabels.get(entry.teachingGroupId) ?? 'Teaching group'}</span>
                  <span>{teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}</span>
                  <span className="timetable-grid-time">{timeRange(entry)}</span>
                  {entry.room && <span>Venue: {entry.room}</span>}
                  {!readOnly && <button className="timetable-event-remove" type="button" onClick={() => void remove(entry.id)}><Trash2 size={12} /> Remove</button>}
                </article>)}
                {cellEntries.length === 0 && <span className="timetable-grid-dash">—</span>}
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
      <div className="timetable-document-footer"><span>Prepared for academic use</span><span>Academic Registrar: ____________________</span></div>
      <div className="timetable-document-print-actions"><button type="button" className="timetable-action" onClick={() => window.print()}>Print timetable</button></div>
    </div> : <div className="timetable-table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Room</th><th>Type</th><th>Teaching group</th><th>Course</th><th>Teacher</th>{!readOnly && <th>Actions</th>}</tr></thead><tbody>
      {orderedEntries.map(entry => <tr key={entry.id}><td>{days[entry.dayOfWeek] ?? '—'}</td><td>{timeRange(entry)}</td><td>{entry.room || '—'}</td><td>{entry.sessionType || '—'}</td><td>{groupLabels.get(entry.teachingGroupId) ?? 'Group not found'}</td><td>{courseLabels.get(entry.courseId) ?? 'Course not found'}</td><td>{teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}</td>{!readOnly && <td><button className="timetable-action" type="button" onClick={() => void remove(entry.id)}><Trash2 /> Remove</button></td>}</tr>)}
    </tbody></table></div>}
  </section>
}
