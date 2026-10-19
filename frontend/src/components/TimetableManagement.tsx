import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, LayoutGrid, List, Plus, Sparkles, Trash2, Pencil, Save } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { createTimetableEntry, updateTimetableEntry, deactivateTimetableEntry, generateTimetable, getTimetableOptions, listTimetable, type CreateTimetableEntry, type GenerateTimetableResult, type TimetableEntry, type TimetableOptions } from '../api/timetable'
import './TimetableManagement.css'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const emptyOptions: TimetableOptions = { teachingGroups: [], courses: [], teachers: [], semesters: [] }
const defaultTemplateSlots = [{ startTime: '08:00', endTime: '09:00' }, { startTime: '09:00', endTime: '10:00' }, { startTime: '10:30', endTime: '11:30' }, { startTime: '11:30', endTime: '12:30' }, { startTime: '13:30', endTime: '14:30' }, { startTime: '14:30', endTime: '15:30' }, { startTime: '15:30', endTime: '16:30' }]
type TemplateCell = { id?: string; courseId: string; teacherId: string; room: string; sessionType: string }
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
  const [timetableCount, setTimetableCount] = useState('1')
  const [generatedTimetables, setGeneratedTimetables] = useState<Array<{ groupId: string; groupLabel: string; result: GenerateTimetableResult }>>([])
  const [printTargetGroupId, setPrintTargetGroupId] = useState('')
  const [view, setView] = useState<'week' | 'list'>('week')
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [templateGroupId, setTemplateGroupId] = useState('')
  const [templateSlots, setTemplateSlots] = useState(defaultTemplateSlots)
  const [templateCells, setTemplateCells] = useState<Record<string, TemplateCell>>({})
  const [templateSaving, setTemplateSaving] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [loadedEntries, loadedOptions] = await Promise.all([listTimetable(), getTimetableOptions()])
      setEntries(loadedEntries)
      setOptions(loadedOptions)
      setSemesterId(current => current || loadedOptions.semesters.find(item => item.isCurrent)?.id || loadedOptions.semesters.find(item => item.isActive)?.id || loadedOptions.semesters[0]?.id || '')
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
  const availableSemesters = options.semesters
  const activeEntries = useMemo(() => entries.filter(item => item.isActive), [entries])
  const distinctGroups = useMemo(() => new Set(activeEntries.map(item => item.teachingGroupId)).size, [activeEntries])
  const distinctTeachers = useMemo(() => new Set(activeEntries.map(item => item.teacherId)).size, [activeEntries])
  const practicalCount = useMemo(() => activeEntries.filter(item => item.sessionType?.toLowerCase() === 'practical').length, [activeEntries])
  const orderedEntries = useMemo(() => [...activeEntries].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)), [activeEntries])
  const timeSlots = useMemo(() => [...new Set(activeEntries.map(entry => entry.startTime))].sort((a, b) => a.localeCompare(b)), [activeEntries])

  useEffect(() => {
    if (!printTargetGroupId) return
    const finishPrint = () => setPrintTargetGroupId('')
    window.addEventListener('afterprint', finishPrint)
    window.print()
    return () => window.removeEventListener('afterprint', finishPrint)
  }, [printTargetGroupId])

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setGeneratedResult(null)
    setGeneratedTimetables([])
    if (!semesterId) { setError('Select an active academic period before generating a timetable.'); return }
    const selectedGroups = teachingGroupId
      ? options.teachingGroups.filter(group => group.id === teachingGroupId)
      : options.teachingGroups.slice(0, Math.max(1, Math.min(options.teachingGroups.length, Number(timetableCount) || 1)))
    if (selectedGroups.length === 0) { setError('Create teaching groups before generating timetables.'); return }
    setLoading(true)
    try {
      const results: Array<{ groupId: string; groupLabel: string; result: GenerateTimetableResult }> = []
      for (const group of selectedGroups) {
        const result = await generateTimetable(semesterId, group.id)
        results.push({ groupId: group.id, groupLabel: group.label, result })
      }
      setGeneratedTimetables(results)
      if (results.length === 1) setGeneratedResult(results[0].result)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate timetables.')
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

  function loadTemplate() {
    if (!templateGroupId) { setError('Choose a class or teaching group before opening the editable template.'); return }
    const groupEntries = activeEntries.filter(entry => entry.teachingGroupId === templateGroupId)
    const slots = [...defaultTemplateSlots]
    for (const entry of groupEntries) {
      const start = timeLabel(entry.startTime)
      if (!slots.some(slot => slot.startTime === start)) slots.push({ startTime: start, endTime: timeLabel(entry.endTime) })
    }
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
    const cells: Record<string, TemplateCell> = {}
    for (const entry of groupEntries) {
      const slotIndex = slots.findIndex(slot => slot.startTime === timeLabel(entry.startTime))
      const key = entry.dayOfWeek + '-' + slotIndex
      cells[key] = { id: entry.id, courseId: entry.courseId, teacherId: entry.teacherId, room: entry.room ?? '', sessionType: entry.sessionType ?? 'Lecture' }
    }
    setTemplateSlots(slots)
    setTemplateCells(cells)
    setShowTemplateEditor(true)
    setError('')
  }

  function changeTemplateCell(key: string, field: keyof TemplateCell, value: string) {
    setTemplateCells(current => ({ ...current, [key]: { ...(current[key] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture' }), [field]: value } }))
  }

  async function saveTemplate() {
    if (!templateGroupId) { setError('Choose a teaching group before saving the template.'); return }
    const groupEntries = activeEntries.filter(entry => entry.teachingGroupId === templateGroupId)
    const cells = Object.entries(templateCells)
    const populated = cells.filter(([, cell]) => cell.courseId || cell.teacherId)
    if (templateSlots.some(slot => !slot.startTime || !slot.endTime || slot.endTime <= slot.startTime)) { setError('Every period must have an end time later than its start time.'); return }
    if (populated.some(([, cell]) => !cell.courseId || !cell.teacherId)) { setError('Every filled timetable cell needs both a course and a teacher.'); return }
    setTemplateSaving(true)
    setError('')
    try {
        for (const entry of groupEntries) {
        const matchingCell = Object.entries(templateCells).find(([, cell]) => cell.id === entry.id)
        const cell = matchingCell?.[1]
        const slotIndex = matchingCell ? Number(matchingCell[0].split('-')[1]) : -1
        const slot = templateSlots[slotIndex]
        if (!cell || (!cell.courseId && !cell.teacherId) || !slot) {
          await deactivateTimetableEntry(entry.id)
        } else {
          await updateTimetableEntry(entry.id, {
            teachingGroupId: templateGroupId, courseId: cell.courseId, teacherId: cell.teacherId,
            dayOfWeek: Number(matchingCell![0].split('-')[0]), startTime: slot.startTime + ':00', endTime: slot.endTime + ':00',
            room: cell.room.trim() || undefined, sessionType: cell.sessionType || 'Lecture',
          })
        }
      }
      for (const [key, cell] of populated) {
        if (cell.id && groupEntries.some(entry => entry.id === cell.id)) continue
        const [day, slotIndexText] = key.split('-')
        const slot = templateSlots[Number(slotIndexText)]
        if (!slot) continue
        await createTimetableEntry({
          teachingGroupId: templateGroupId, courseId: cell.courseId, teacherId: cell.teacherId,
          dayOfWeek: Number(day), startTime: slot.startTime + ':00', endTime: slot.endTime + ':00',
          room: cell.room.trim() || undefined, sessionType: cell.sessionType || 'Lecture',
        })
      }
      await load()
      setShowTemplateEditor(false)
      setTemplateCells({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the timetable template.')
    } finally {
      setTemplateSaving(false)
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
        {!readOnly && <button className="timetable-action" type="button" onClick={() => setShowTemplateEditor(value => !value)} aria-expanded={showTemplateEditor}><Pencil /> {showTemplateEditor ? 'Close template editor' : 'Edit timetable template'}</button>}
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
        <label>Academic period<select value={semesterId} onChange={event => setSemesterId(event.target.value)} required><option value="">Select period</option>{availableSemesters.map(item => <option key={item.id} value={item.id}>{item.label}{item.isCurrent ? ' (Current)' : ''}{!item.isActive ? ' (Inactive)' : ''}</option>)}</select></label>
        <label>Teaching group<select value={teachingGroupId} onChange={event => setTeachingGroupId(event.target.value)}><option value="">Generate for multiple classes</option>{options.teachingGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        {!teachingGroupId && <label>Number of timetables<input type="number" min="1" max={Math.max(1, options.teachingGroups.length)} value={timetableCount} onChange={event => setTimetableCount(event.target.value)} required /></label>}
      </div>
      {!teachingGroupId && <p className="timetable-generator-help">Generates one separate timetable for each of the first N teaching groups. Available groups: {options.teachingGroups.length}.</p>}
      <div className="timetable-form-footer">
        <button className="timetable-action primary" type="submit" disabled={loading || availableSemesters.length === 0}>{loading ? 'Generating…' : 'Generate schedule'}</button>
        {availableSemesters.length === 0 && <span className="timetable-day-empty">No academic periods were returned. Create a period under Academic Periods, then reload this screen.</span>}
      </div>
    </form>}

    {!readOnly && showTemplateEditor && <section className="timetable-template-editor" aria-label="Editable timetable template">
      <div className="timetable-template-document-heading">
        <p>REPUBLIC OF UGANDA</p>
        <h3>KAMPALA SCHOOL OF HEALTH SCIENCES</h3>
        <h4>CLASS TEACHING TIMETABLE</h4>
        <span>{availableSemesters.find(item => item.id === semesterId)?.label ?? 'Academic period not selected'}{templateGroupId ? ' · ' + (groupLabels.get(templateGroupId) ?? 'Selected class') : ''}</span>
      </div>
      <div className="timetable-template-editor-heading">
        <div><p className="timetable-eyebrow">Fillable timetable template</p><h3>Edit the timetable grid</h3><p>Select a class, then fill each period with a course, teacher and venue. Existing sessions for that class are loaded into the grid.</p></div>
        <div className="timetable-template-controls">
          <label>Class / teaching group<select value={templateGroupId} onChange={event => { setTemplateGroupId(event.target.value); setTemplateCells({}); setTemplateSlots(defaultTemplateSlots) }}><option value="">Select class</option>{options.teachingGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <button className="timetable-action" type="button" onClick={loadTemplate} disabled={!templateGroupId}><Pencil size={15}/> Load class</button>
        </div>
      </div>
      {templateGroupId && <div className="timetable-grid-scroll">
        <table className="timetable-editable-grid">
          <thead><tr><th>DAY</th>{templateSlots.map((slot, index) => <th key={index}><span>PERIOD {index + 1}</span><label>From<input aria-label={`Period ${index + 1} start time`} type="time" value={slot.startTime} onChange={event => setTemplateSlots(current => current.map((item, slotIndex) => slotIndex === index ? { ...item, startTime: event.target.value } : item))}/></label><label>To<input aria-label={`Period ${index + 1} end time`} type="time" value={slot.endTime} onChange={event => setTemplateSlots(current => current.map((item, slotIndex) => slotIndex === index ? { ...item, endTime: event.target.value } : item))}/></label></th>)}</tr></thead>
          <tbody>{weekOrder.filter(day => day !== 0).map(day => <tr key={day}><th>{days[day].toUpperCase()}</th>{templateSlots.map((slot, slotIndex) => {
            const key = day + '-' + slotIndex
            const cell = templateCells[key] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture' }
            return <td key={slotIndex}>
              <select aria-label={`${days[day]} ${slot.startTime} course`} value={cell.courseId} onChange={event => changeTemplateCell(key, 'courseId', event.target.value)}><option value="">— Course —</option>{options.courses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
              <select aria-label={`${days[day]} ${slot.startTime} teacher`} value={cell.teacherId} onChange={event => changeTemplateCell(key, 'teacherId', event.target.value)}><option value="">— Teacher —</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
              <input aria-label={`${days[day]} ${slot.startTime} venue`} value={cell.room} onChange={event => changeTemplateCell(key, 'room', event.target.value)} placeholder="Venue"/>
              <select aria-label={`${days[day]} ${slot.startTime} session type`} value={cell.sessionType} onChange={event => changeTemplateCell(key, 'sessionType', event.target.value)}><option>Lecture</option><option>Practical</option><option>Tutorial</option><option>Seminar</option><option>Examination</option><option>Other</option></select>
              {cell.id && <span className="timetable-template-existing">Saved session</span>}
            </td>
          })}</tr>)}</tbody>
        </table>
      </div>}
      <div className="timetable-form-footer"><button className="timetable-action primary" type="button" onClick={() => void saveTemplate()} disabled={!templateGroupId || templateSaving || !options.courses.length || !options.teachers.length}><Save size={15}/>{templateSaving ? 'Saving template…' : 'Save timetable template'}</button><button className="timetable-action" type="button" onClick={() => window.print()}>Print template</button></div>
    </section>}

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

    {generatedTimetables.length > 0 && <section className="timetable-generated-list" aria-live="polite">
      <div className="timetable-generated-heading"><h3>Generated class timetables</h3><span>{generatedTimetables.length} timetable{generatedTimetables.length === 1 ? '' : 's'}</span></div>
      {generatedTimetables.map(({ groupId, groupLabel, result }) => <article className="timetable-class-document" data-print-target={printTargetGroupId === groupId ? 'true' : 'false'} key={groupId}>
        <div className="timetable-class-document-heading"><div><h4>{groupLabel}</h4><span>Teaching timetable · {availableSemesters.find(item => item.id === semesterId)?.label ?? 'Selected academic period'}</span></div>
          <div className="timetable-class-actions">
            <button className="timetable-action" type="button" onClick={() => {
              const rows = activeEntries.filter(entry => entry.teachingGroupId === groupId).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
              const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
              const body = rows.map(entry => '<tr><td>' + escape(days[entry.dayOfWeek] ?? '') + '</td><td>' + escape(timeRange(entry)) + '</td><td>' + escape(courseLabels.get(entry.courseId) ?? 'Course not found') + '</td><td>' + escape(teacherLabels.get(entry.teacherId) ?? 'Teacher not found') + '</td><td>' + escape(entry.room ?? '') + '</td><td>' + escape(entry.sessionType ?? '') + '</td></tr>').join('')
              const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + escape(groupLabel) + ' timetable</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1,h2,p{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:8px;text-align:center}th{background:#eee}@media print{@page{size:landscape;margin:10mm}}</style></head><body><p>REPUBLIC OF UGANDA</p><h1>KAMPALA SCHOOL OF HEALTH SCIENCES</h1><h2>' + escape(groupLabel) + ' — TEACHING TIMETABLE</h2><p>' + escape(availableSemesters.find(item => item.id === semesterId)?.label ?? '') + '</p><table><thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Teacher</th><th>Venue</th><th>Type</th></tr></thead><tbody>' + body + '</tbody></table><p style="margin-top:48px;text-align:right">Academic Registrar: ____________________</p></body></html>'
              const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
              const anchor = document.createElement('a'); anchor.href = url; anchor.download = groupLabel.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') + '-timetable.html'; anchor.click(); URL.revokeObjectURL(url)
            }}>Download</button>
            <button className="timetable-action" type="button" onClick={() => setPrintTargetGroupId(groupId)}>Print</button>
          </div>
        </div>
        <p className="timetable-class-status">Score: {result.optimizationScore.toFixed(1)}% · {result.isConflictFree ? 'No conflicts reported' : 'Conflicts detected'}</p>
        {result.conflicts.length > 0 && <p className="timetable-class-warning">Conflicts: {result.conflicts.join('; ')}</p>}
        {result.warnings.length > 0 && <p className="timetable-class-warning">Warnings: {result.warnings.join('; ')}</p>}
        <div className="timetable-table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Teacher</th><th>Venue</th><th>Type</th></tr></thead><tbody>
          {activeEntries.filter(entry => entry.teachingGroupId === groupId).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map(entry => <tr key={entry.id}><td>{days[entry.dayOfWeek] ?? '—'}</td><td>{timeRange(entry)}</td><td>{courseLabels.get(entry.courseId) ?? 'Course not found'}</td><td>{teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}</td><td>{entry.room || '—'}</td><td>{entry.sessionType || '—'}</td></tr>)}
        </tbody></table></div>
      </article>)}
    </section>}

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
