import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessToken } from '../api/auth'
import { StaffAttendanceManagement } from './StaffAttendanceManagement'

const API_BASE_URL = (typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : '')
type GroupOption = { teachingGroupId: string; groupCode: string; groupName?: string | null; programmeId: string; programmeName: string; semesterId: string; semesterName: string; timetableEntryId: string; dayOfWeek: number; startTime: string; endTime: string; courseId: string }
type SemesterOption = { id: string; name: string; academicYearId: string; startDate: string; endDate: string; isCurrent: boolean }
type IntakeOption = { id: string; name: string; code: string }
type StudentRow = { number: number; id: string; registrationNumber: string; name: string; status: string | null; remarks?: string | null; attendanceRecordId?: string | null }
type ReportRow = { month: string; classId: string; className: string; totalAttendance: number; totalPresent: number; totalAbsent: number; totalLate: number; totalExcused: number }
type HistoryRow = { id: string; attendanceSessionId: string; studentId: string; status: string; remarks?: string | null }
type Session = { id: string; timetableEntryId: string; sessionDate: string; status: string }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, cache: 'no-store', headers: {
    Accept: 'application/json', 'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {})
  } })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const statusOptions = ['Present', 'Absent', 'Late', 'Excused']
const chartColors = ['#2563eb', '#0f9d78', '#d97706', '#9333ea', '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5', '#64748b']
const monthLabel = (value: string) => new Date(`${value}-01T00:00:00`).toLocaleDateString('en-UG', { month: 'long', year: 'numeric' })
const todayKampala = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

export function AttendanceWorkspace({ readOnly = false, canViewStaffAttendance = false }: { readOnly?: boolean; canViewStaffAttendance?: boolean }) {
  const [section, setSection] = useState<'students' | 'staff'>('students')
  const [studentView, setStudentView] = useState<'report' | 'register' | 'history'>('report')
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [programmes, setProgrammes] = useState<{ id: string; name: string }[]>([])
  const [intakes, setIntakes] = useState<IntakeOption[]>([])
  const [semesters, setSemesters] = useState<SemesterOption[]>([])
  const [programmeId, setProgrammeId] = useState('')
  const [intakeId, setIntakeId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [timetableEntryId, setTimetableEntryId] = useState('')
  const [sessionDate, setSessionDate] = useState(todayKampala)
  const [session, setSession] = useState<Session | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [semesterId, setSemesterId] = useState('')
  const [monthly, setMonthly] = useState<ReportRow[]>([])
  const [overall, setOverall] = useState<Omit<ReportRow, 'month'>[]>([])
  const [reportMonth, setReportMonth] = useState('')
  const [studentId, setStudentId] = useState('')
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedGroup = groups.find(x => x.teachingGroupId === groupId)
  const filteredGroups = useMemo(() => groups.filter(x => !programmeId || x.programmeId === programmeId), [groups, programmeId])
  const availableMonths = useMemo(() => [...new Set(monthly.map(x => x.month))].sort(), [monthly])
  const chartRows = useMemo(() => {
    const rows = monthly.filter(x => x.month === reportMonth)
    const total = rows.reduce((sum, x) => sum + x.totalPresent, 0)
    let cursor = 0
    const stops = rows.map((row, index) => {
      const start = cursor
      cursor += total > 0 ? row.totalPresent / total * 100 : 0
      return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`
    })
    return { rows, total, gradient: stops.length ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#e5e7eb 0% 100%)' }
  }, [monthly, reportMonth])

  const loadOptions = useCallback(async () => {
    setError('')
    try {
      const data = await request<{ groups: GroupOption[]; programmes: { id: string; name: string }[]; intakes: IntakeOption[]; semesters: SemesterOption[] }>('/api/attendance/options')
      setGroups(data.groups)
      setProgrammes(data.programmes)
      setIntakes(data.intakes)
      setSemesters(data.semesters)
      const current = data.semesters.find(x => x.isCurrent) ?? data.semesters[0]
      if (current) setSemesterId(current.id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load attendance options.') }
  }, [])

  const loadReport = useCallback(async () => {
    if (!semesterId) return
    setLoading(true); setError('')
    try {
      const data = await request<{ monthly: ReportRow[]; overall: Omit<ReportRow, 'month'>[] }>(`/api/attendance/monthly-report?semesterId=${encodeURIComponent(semesterId)}`)
      setMonthly(data.monthly); setOverall(data.overall)
      const latest = [...new Set(data.monthly.map(x => x.month))].sort().at(-1) ?? ''
      setReportMonth(latest)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load the attendance report.') }
    finally { setLoading(false) }
  }, [semesterId])

  useEffect(() => { void loadOptions() }, [loadOptions])
  useEffect(() => { void loadReport() }, [loadReport])

  async function openSession() {
    if (!timetableEntryId) { setError('Select a class and its timetable session first.'); return }
    setLoading(true); setError(''); setMessage('')
    try {
      const opened = await request<Session>('/api/attendance/sessions', { method: 'POST', body: JSON.stringify({ timetableEntryId, sessionDate, recordedByUserId: null, remarks: null }) })
      setSession(opened)
      await loadRegister(opened.id)
      setMessage('Attendance session opened.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to open attendance session.') }
    finally { setLoading(false) }
  }

  async function loadRegister(sessionId: string) {
    const params = new URLSearchParams()
    if (intakeId) params.set('intakeId', intakeId)
    const data = await request<{ session: Session; students: StudentRow[] }>(`/api/attendance/sessions/${sessionId}/register?${params.toString()}`)
    setSession(data.session); setStudents(data.students)
  }

  async function saveStudent(row: StudentRow, status: string) {
    if (!session || session.status !== 'Open') { setError('Open an attendance session before recording or correcting attendance.'); return }
    setSaving(true); setError(''); setMessage('')
    try {
      if (row.attendanceRecordId) {
        await request(`/api/attendance/records/${row.attendanceRecordId}`, { method: 'PUT', body: JSON.stringify({ status, remarks: row.remarks ?? null }) })
      } else {
        await request(`/api/attendance/sessions/${session.id}/records`, { method: 'POST', body: JSON.stringify({ studentId: row.id, status, remarks: row.remarks ?? null }) })
      }
      await loadRegister(session.id)
      setMessage(`Attendance saved for ${row.name}.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save attendance.') }
    finally { setSaving(false) }
  }

  async function markAllPresent() {
    if (!session || session.status !== 'Open') { setError('Open an attendance session first.'); return }
    setSaving(true); setError(''); setMessage('')
    try {
      for (const row of students.filter(x => !x.status)) {
        await request(`/api/attendance/sessions/${session.id}/records`, { method: 'POST', body: JSON.stringify({ studentId: row.id, status: 'Present', remarks: null }) })
      }
      await loadRegister(session.id)
      setMessage('All unmarked students have been marked present. You can now adjust individual records.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Bulk attendance marking failed. Refresh the register before retrying.') }
    finally { setSaving(false) }
  }

  async function closeSession() {
    if (!session) return
    setSaving(true); setError('')
    try { await request(`/api/attendance/sessions/${session.id}/close`, { method: 'POST' }); setSession({ ...session, status: 'Closed' }); setMessage('Attendance session closed.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to close the attendance session.') }
    finally { setSaving(false) }
  }

  async function loadHistory() {
    if (!studentId.trim()) { setError('Enter a student ID to view attendance history.'); return }
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      setHistory(await request<HistoryRow[]>(`/api/attendance/students/${studentId.trim()}?${params.toString()}`))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load student attendance history.') }
    finally { setLoading(false) }
  }

  function changeGroup(value: string) {
    const next = groups.find(x => x.teachingGroupId === value)
    setGroupId(value); setTimetableEntryId(next?.timetableEntryId ?? ''); setSession(null); setStudents([])
  }

  return (
    <section className="panel" aria-label="Attendance management">
      <div className="panel-heading"><div><span className="eyebrow">ATTENDANCE</span><h3>Attendance management</h3></div></div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Attendance categories">
        <button type="button" role="tab" aria-selected={section === 'students'} className={section === 'students' ? 'active' : ''} onClick={() => setSection('students')}>Students</button>
        {canViewStaffAttendance && <button type="button" role="tab" aria-selected={section === 'staff'} className={section === 'staff' ? 'active' : ''} onClick={() => setSection('staff')}>Staff</button>}
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success-message" role="status">{message}</div>}

      {section === 'staff' && canViewStaffAttendance && <StaffAttendanceManagement />}

      {section === 'students' && <>
        <div className="library-workspace-tabs" role="tablist" aria-label="Student attendance views">
          <button type="button" role="tab" aria-selected={studentView === 'report'} className={studentView === 'report' ? 'active' : ''} onClick={() => setStudentView('report')}>Attendance report</button>
          <button type="button" role="tab" aria-selected={studentView === 'register'} className={studentView === 'register' ? 'active' : ''} onClick={() => setStudentView('register')}>Attendance register</button>
          <button type="button" role="tab" aria-selected={studentView === 'history'} className={studentView === 'history' ? 'active' : ''} onClick={() => setStudentView('history')}>Student history</button>
        </div>

        {studentView === 'report' && <>
          <div className="grid-form">
            <label>Semester<select value={semesterId} onChange={e => setSemesterId(e.target.value)}><option value="">Select semester</option>{semesters.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label>Report month<select value={reportMonth} onChange={e => setReportMonth(e.target.value)}><option value="">All months</option>{availableMonths.map(x => <option key={x} value={x}>{monthLabel(x)}</option>)}</select></label>
            <button type="button" className="btn btn-secondary" onClick={() => void loadReport()} disabled={loading}>Refresh report</button>
          </div>
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-heading"><div><h4>Monthly attendance by class</h4><p>Each colour represents a different class. Select a month to compare the classes across the school.</p></div></div>
            {loading ? <p className="empty">Loading attendance report…</p> : chartRows.rows.length === 0 ? <p className="empty">No attendance records are available for this semester and month.</p> : <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 28 }}>
              <div aria-label="Pie chart of present attendance by class" role="img" style={{ width: 220, height: 220, borderRadius: '50%', background: chartRows.gradient, flex: '0 0 220px', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, flex: '1 1 280px' }}>
                {chartRows.rows.map((row, index) => <div key={row.classId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: chartColors[index % chartColors.length], flex: '0 0 11px' }} /><span>{row.className}</span><strong style={{ marginLeft: 'auto' }}>{row.totalPresent}</strong></div>)}
                <strong>Total present: {chartRows.total}</strong>
              </div>
            </div>}
          </div>
          <div className="table-responsive" style={{ marginTop: 16 }}>
            <table className="data-table"><thead><tr><th>MONTH</th><th>CLASS</th><th>TOTAL ATTENDANCE</th><th>TOTAL PRESENT</th><th>TOTAL ABSENT</th></tr></thead>
              <tbody>{monthly.filter(x => !reportMonth || x.month === reportMonth).map(row => <tr key={row.month + row.classId}><td>{monthLabel(row.month)}</td><td>{row.className}</td><td>{row.totalAttendance}</td><td>{row.totalPresent}</td><td>{row.totalAbsent}</td></tr>)}
                {monthly.length === 0 && <tr><td colSpan={5}>No monthly class attendance data is available.</td></tr>}
                <tr className="font-semibold"><td>OVERALL – SEMESTER</td><td>All classes</td><td>{overall.reduce((s,x) => s + x.totalAttendance,0)}</td><td>{overall.reduce((s,x) => s + x.totalPresent,0)}</td><td>{overall.reduce((s,x) => s + x.totalAbsent,0)}</td></tr>
              </tbody>
            </table>
          </div>
        </>}

        {studentView === 'register' && <>
          <div className="grid-form">
            <label>Programme<select value={programmeId} onChange={e => { setProgrammeId(e.target.value); setGroupId(''); setSession(null); setStudents([]) }}><option value="">All programmes</option>{programmes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label>Intake<select value={intakeId} onChange={e => { setIntakeId(e.target.value); setSession(null); setStudents([]) }}><option value="">All intakes</option>{intakes.map(x => <option key={x.id} value={x.id}>{x.name} ({x.code})</option>)}</select></label>
            <label>Class<select value={groupId} onChange={e => changeGroup(e.target.value)}><option value="">Select class</option>{filteredGroups.map(x => <option key={x.teachingGroupId} value={x.teachingGroupId}>{x.groupCode}{x.groupName ? ` — ${x.groupName}` : ''} · {x.programmeName}</option>)}</select></label>
            <label>Session<select value={timetableEntryId} onChange={e => setTimetableEntryId(e.target.value)}><option value="">Select session</option>{groups.filter(x => x.teachingGroupId === groupId).map(x => <option key={x.timetableEntryId} value={x.timetableEntryId}>{x.dayOfWeek} · {x.startTime}–{x.endTime}</option>)}</select></label>
            <label>Attendance date<input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} /></label>
            <button type="button" onClick={() => void openSession()} disabled={loading || readOnly || !timetableEntryId}>Open attendance session</button>
          </div>
          {session && <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginTop: 16 }}>
            <div><strong>{selectedGroup?.groupCode ?? 'Class'} · {session.sessionDate}</strong><div className="text-xs text-slate-500">Session status: {session.status}</div></div>
            <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-secondary" onClick={() => void markAllPresent()} disabled={saving || readOnly || session.status !== 'Open'}>Mark all present</button><button type="button" className="btn btn-secondary" onClick={() => void closeSession()} disabled={saving || readOnly || session.status !== 'Open'}>Close session</button></div>
          </div>}
          {session && <div className="table-responsive" style={{ marginTop: 12 }}><table className="data-table"><thead><tr><th>#</th><th>STUDENT NAME</th><th>REGISTRATION NUMBER</th><th>ATTENDANCE STATUS</th><th>ACTION</th></tr></thead><tbody>
            {students.map(row => <tr key={row.id}><td>{row.number}</td><td>{row.name}</td><td>{row.registrationNumber}</td><td><select aria-label={`Attendance status for ${row.name}`} value={row.status ?? ''} disabled={readOnly || session.status !== 'Open'} onChange={e => setStudents(current => current.map(x => x.id === row.id ? { ...x, status: e.target.value } : x))}><option value="">Not marked</option>{statusOptions.map(x => <option key={x}>{x}</option>)}</select></td><td><button type="button" className="btn btn-secondary" disabled={saving || readOnly || !row.status || session.status !== 'Open'} onClick={() => void saveStudent(row, row.status!)}>Save</button></td></tr>)}
            {students.length === 0 && <tr><td colSpan={5}>No active students were found for this class and intake.</td></tr>}
          </tbody></table></div>}
        </>}

        {studentView === 'history' && <>
          <div className="grid-form"><label>Student ID<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student record ID" /></label><label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label><button type="button" className="btn btn-secondary" onClick={() => void loadHistory()} disabled={loading}>Load history</button></div>
          <div className="table-responsive" style={{ marginTop: 12 }}><table className="data-table"><thead><tr><th>#</th><th>SESSION</th><th>STATUS</th><th>REMARKS</th></tr></thead><tbody>{history.map((x,i) => <tr key={x.id}><td>{i+1}</td><td>{x.attendanceSessionId}</td><td>{x.status}</td><td>{x.remarks ?? '—'}</td></tr>)}{history.length === 0 && <tr><td colSpan={4}>No attendance history loaded.</td></tr>}</tbody></table></div>
        </>}
      </>}
    </section>
  )
}
