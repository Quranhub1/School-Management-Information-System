import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessToken } from '../api/auth'
import { StaffAttendanceManagement } from './StaffAttendanceManagement'

const API_BASE_URL = (typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : '')
type GroupOption = { teachingGroupId: string; groupCode: string; groupName?: string | null; programmeId: string; programmeName: string; semesterId: string; semesterName: string; timetableEntryId: string; dayOfWeek: number; startTime: string; endTime: string; courseId: string }
type SemesterOption = { id: string; name: string; academicYearId: string; startDate: string; endDate: string; isCurrent: boolean }
type IntakeOption = { id: string; name: string; code: string }
type StudentRow = { number: number; id: string; registrationNumber: string; name: string; status: string | null; remarks?: string | null; attendanceRecordId?: string | null }
type ReportRow = { month: string; classId: string; className: string; totalAttendance: number; totalPresent: number; totalAbsent: number; totalLate: number; totalExcused: number }
type HistoryRow = { id: string; attendanceSessionId: string; studentId: string; studentName?: string; studentNumber?: string; status: string; remarks?: string | null; sessionDate: string; className: string; sessionStatus: string; courseName?: string; timetableSlot?: string; room?: string | null }
type StudentMatch = { id: string; registrationNumber: string; name: string }
type Session = { id: string; timetableEntryId: string; sessionDate: string; status: string; recordedByUserId?: string | null }
type SessionContext = { className: string; programmeName: string; semesterName: string; academicYearName: string; courseName: string; courseCode: string; room?: string | null; dayOfWeek: string; startTime: string; endTime: string; openedByName?: string | null; totalEnrolled: number }
type RegisterSummary = { present: number; absent: number; late: number; excused: number; marked: number; unmarked: number }

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
const shiftDate = (value: string, days: number) => { const [year, month, day] = value.split('-').map(Number); return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10) }
const currentWeekStart = () => { const today = todayKampala(); const weekday = (new Date(`${today}T00:00:00`).getDay() + 6) % 7; return shiftDate(today, -weekday) }

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
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null)
  const [registerSummary, setRegisterSummary] = useState<RegisterSummary | null>(null)
  const [eligibleSearch, setEligibleSearch] = useState('')
  const [students, setStudents] = useState<StudentRow[]>([])
  const [semesterId, setSemesterId] = useState('')
  const [monthly, setMonthly] = useState<ReportRow[]>([])
  const [overall, setOverall] = useState<Omit<ReportRow, 'month'>[]>([])
  const [reportMonth, setReportMonth] = useState('')
  const [studentId, setStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentMatches, setStudentMatches] = useState<StudentMatch[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [from, setFrom] = useState(currentWeekStart)
  const [to, setTo] = useState(todayKampala)
  const [historyStatus, setHistoryStatus] = useState('All')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedGroup = groups.find(x => x.teachingGroupId === groupId)
  const filteredGroups = useMemo(() => Array.from(new Map<string, GroupOption>(groups.filter(x => !programmeId || x.programmeId === programmeId).map(x => [x.teachingGroupId, x] as [string, GroupOption])).values()), [groups, programmeId])
  const availableMonths = useMemo(() => [...new Set(monthly.map(x => x.month))].sort(), [monthly])
  const filteredHistory = useMemo(() => history.filter(row => historyStatus === 'All' || row.status === historyStatus), [history, historyStatus])
  const chartRows = useMemo(() => {
    const selectedRows = monthly.filter(x => !reportMonth || x.month === reportMonth)
    const rows = reportMonth ? selectedRows : Array.from(selectedRows.reduce((map, row) => {
      const current = map.get(row.classId)
      map.set(row.classId, current ? { ...current, totalAttendance: current.totalAttendance + row.totalAttendance, totalPresent: current.totalPresent + row.totalPresent, totalAbsent: current.totalAbsent + row.totalAbsent, totalLate: current.totalLate + row.totalLate, totalExcused: current.totalExcused + row.totalExcused } : { ...row, month: 'All' })
      return map
    }, new Map<string, ReportRow>()).values())
    const total = rows.reduce((sum, x) => sum + x.totalPresent, 0)
    let cursor = 0
    const stops = rows.map((row, index) => {
      const start = cursor
      cursor += total > 0 ? row.totalPresent / total * 100 : 0
      return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`
    })
    return { rows, total, gradient: total > 0 && stops.length ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#e5e7eb 0% 100%)' }
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

  // Keep the student attendance data pipeline isolated from the staff register.
  // Student groups, intakes and reports are fetched only while the Students section is active.
  useEffect(() => { if (section === 'students') void loadOptions() }, [loadOptions, section])
  useEffect(() => { if (section === 'students') void loadReport() }, [loadReport, section])

  async function openSession() {
    if (!timetableEntryId) { setError('Select a class and its timetable session first.'); return }
    setLoading(true); setError(''); setMessage('')
    try {
      const lookup = new URLSearchParams({ timetableEntryId, sessionDate })
      const lookupResult = await request<{ session: Session | null }>(`/api/attendance/sessions/lookup?${lookup.toString()}`)
      const existing = lookupResult.session
      const opened = existing ?? await request<Session>('/api/attendance/sessions', { method: 'POST', body: JSON.stringify({ timetableEntryId, sessionDate, recordedByUserId: null, remarks: null }) })
      setSession(opened)
      await loadRegister(opened.id)
      setMessage('Attendance session opened.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to open attendance session.') }
    finally { setLoading(false) }
  }

  async function loadRegister(sessionId: string, search = eligibleSearch) {
    const params = new URLSearchParams()
    if (intakeId) params.set('intakeId', intakeId)
    if (search.trim().length >= 2) params.set('search', search.trim())
    const data = await request<{ session: Session; context: SessionContext; summary: RegisterSummary; students: StudentRow[] }>(`/api/attendance/sessions/${sessionId}/eligible-students?${params.toString()}`)
    setSession(data.session)
    setSessionContext(data.context)
    setRegisterSummary(data.summary)
    setStudents(data.students)
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
      const params = new URLSearchParams()
      if (intakeId) params.set('intakeId', intakeId)
      await request<{ markedCount: number; alreadyMarkedCount: number; totalEligible: number }>(`/api/attendance/sessions/${session.id}/records/bulk-present?${params.toString()}`, { method: 'POST' })
      setEligibleSearch('')
      await loadRegister(session.id, '')
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

  async function searchStudents() {
    if (studentSearch.trim().length < 2) { setError('Enter at least two characters of a student name or registration number.'); return }
    setLoading(true); setError('')
    try {
      setStudentMatches(await request<StudentMatch[]>(`/api/attendance/students/search?q=${encodeURIComponent(studentSearch.trim())}`))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to search students.') }
    finally { setLoading(false) }
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
    setGroupId(value); setTimetableEntryId(next?.timetableEntryId ?? ''); setSession(null); setSessionContext(null); setRegisterSummary(null); setStudents([])
  }

  function setHistoryRange(preset: 'today' | 'yesterday' | 'week' | 'month') {
    const today = todayKampala()
    if (preset === 'today') { setFrom(today); setTo(today) }
    else if (preset === 'yesterday') { const yesterday = shiftDate(today, -1); setFrom(yesterday); setTo(yesterday) }
    else if (preset === 'week') { setFrom(shiftDate(today, -6)); setTo(today) }
    else { setFrom(`${today.slice(0, 7)}-01`); setTo(today) }
  }

  function exportHistoryCsv() {
    const headers = ['Date', 'Student', 'Student number', 'Course', 'Class', 'Timetable slot', 'Room', 'Status', 'Remarks']
    const rows = filteredHistory.map(row => [row.sessionDate, row.studentName ?? '', row.studentNumber ?? '', row.courseName ?? '', row.className, row.timetableSlot ?? '', row.room ?? '', row.status, row.remarks ?? ''])
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\\r\\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `attendance-history-${studentId.slice(0, 8)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="panel" aria-label="Attendance management">
      <style>{`@media (max-width: 640px) { .attendance-mobile-table thead { display: none; } .attendance-mobile-table, .attendance-mobile-table tbody, .attendance-mobile-table tr, .attendance-mobile-table td { display: block; width: 100%; } .attendance-mobile-table tr { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; padding: 6px 10px; } .attendance-mobile-table td { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 6px 0; text-align: right; } .attendance-mobile-table td::before { content: attr(data-label); font-weight: 600; color: #475569; text-align: left; } .attendance-mobile-table td button, .attendance-mobile-table td select { min-height: 44px; } }`}</style>
      <div className="panel-heading"><div><span className="eyebrow">ATTENDANCE</span><h3>Attendance management</h3></div></div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Attendance categories">
        <button type="button" role="tab" aria-selected={section === 'students'} className={section === 'students' ? 'active' : ''} onClick={() => setSection('students')}>Students</button>
        {canViewStaffAttendance && <button type="button" role="tab" aria-selected={section === 'staff'} className={section === 'staff' ? 'active' : ''} onClick={() => setSection('staff')}>Staff</button>}
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success" role="status">{message}</div>}

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
          {!session && timetableEntryId && <div className="flex items-center gap-2" style={{ marginTop: 12 }}><span className="status" style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 999 }}>Not started</span></div>}
          {session && <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginTop: 16 }}>
            <div className="space-y-1">
              <strong>{sessionContext?.courseName ?? selectedGroup?.groupCode ?? 'Class'} · {session.sessionDate}</strong>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="status" style={{ display: 'inline-flex', minHeight: 28, alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: session.status === 'Open' ? '#dcfce7' : '#fee2e2', color: session.status === 'Open' ? '#166534' : '#991b1b' }}>{session.status === 'Open' ? 'Open' : 'Closed'}</span>
                <span>{sessionContext?.className}</span><span>{sessionContext?.programmeName}</span>
                <span>{sessionContext?.academicYearName} · {sessionContext?.semesterName}</span>
                <span>{sessionContext?.dayOfWeek} {sessionContext?.startTime}–{sessionContext?.endTime}</span>
                {sessionContext?.room && <span>Room {sessionContext.room}</span>}
                {sessionContext?.openedByName && <span>Opened by {sessionContext.openedByName}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-secondary" onClick={() => void markAllPresent()} disabled={saving || readOnly || session.status !== 'Open'}>Mark all present</button><button type="button" className="btn btn-secondary" onClick={() => void closeSession()} disabled={saving || readOnly || session.status !== 'Open'}>Close session</button></div>
          </div>}
          {session && registerSummary && <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2" style={{ marginTop: 12 }}>
            <div className="summary-card"><span>Enrolled</span><strong>{sessionContext?.totalEnrolled ?? students.length}</strong></div>
            <div className="summary-card"><span>Marked</span><strong>{registerSummary.marked} of {sessionContext?.totalEnrolled ?? students.length}</strong></div>
            <div className="summary-card"><span>Present</span><strong>{registerSummary.present}</strong></div>
            <div className="summary-card"><span>Late</span><strong>{registerSummary.late}</strong></div>
            <div className="summary-card"><span>Absent</span><strong>{registerSummary.absent}</strong></div>
            <div className="summary-card"><span>Excused</span><strong>{registerSummary.excused}</strong></div>
            <div className="summary-card"><span>Unmarked</span><strong>{registerSummary.unmarked}</strong></div>
          </div>}
          {session && <div className="flex flex-wrap items-end gap-2" style={{ marginTop: 12 }}>
            <label className="flex-1 min-w-[220px]">Find enrolled student<input value={eligibleSearch} onChange={e => setEligibleSearch(e.target.value)} placeholder="Student or admission number, or name" /></label>
            <button type="button" className="btn btn-secondary" disabled={loading || eligibleSearch.trim().length === 1} onClick={() => void loadRegister(session.id, eligibleSearch)}>Search register</button>
            <button type="button" className="btn btn-secondary" disabled={loading || !eligibleSearch} onClick={() => { setEligibleSearch(''); void loadRegister(session.id, '') }}>Clear search</button>
            <span className="text-xs text-slate-500">{students.length} shown · {sessionContext?.totalEnrolled ?? students.length} enrolled</span>
          </div>}
          {session && <div className="table-responsive" style={{ marginTop: 12 }}><table className="data-table attendance-mobile-table"><thead><tr><th>#</th><th>STUDENT NAME</th><th>REGISTRATION NUMBER</th><th>ATTENDANCE STATUS</th><th>RECORD</th><th>ACTION</th></tr></thead><tbody>
            {students.map(row => <tr key={row.id}><td data-label="#"> {row.number}</td><td data-label="Student">{row.name}</td><td data-label="Student number">{row.registrationNumber}</td><td data-label="Set status"><select style={{ minHeight: 44 }} aria-label={`Attendance status for ${row.name}`} value={row.status ?? ''} disabled={readOnly || session.status !== 'Open'} onKeyDown={e => { const option = statusOptions[Number(e.key) - 1]; if (option) { e.preventDefault(); setStudents(current => current.map(x => x.id === row.id ? { ...x, status: option } : x)) } }} onChange={e => setStudents(current => current.map(x => x.id === row.id ? { ...x, status: e.target.value } : x))}><option value="">Not marked</option>{statusOptions.map(x => <option key={x}>{x}</option>)}</select></td><td data-label="Current status"><span className="status" style={{ display: 'inline-flex', minHeight: 28, alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: row.status === 'Present' ? '#dcfce7' : row.status === 'Late' ? '#fef3c7' : row.status === 'Absent' ? '#fee2e2' : row.status === 'Excused' ? '#dbeafe' : '#f1f5f9', color: row.status === 'Present' ? '#166534' : row.status === 'Late' ? '#92400e' : row.status === 'Absent' ? '#991b1b' : row.status === 'Excused' ? '#1e40af' : '#475569' }}>{row.status ?? 'Unmarked'}</span></td><td data-label="Action"><button type="button" className="btn btn-secondary" style={{ minHeight: 44 }} disabled={saving || readOnly || !row.status || session.status !== 'Open'} onClick={() => void saveStudent(row, row.status!)}>Save</button></td></tr>)}
            {students.length === 0 && <tr><td colSpan={6}>No eligible students matched this search.</td></tr>}
          </tbody></table></div>}
        </>}

        {studentView === 'history' && <>
          <div className="grid-form"><label>Find student<input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Name or registration number" /></label><button type="button" className="btn btn-secondary" onClick={() => void searchStudents()} disabled={loading}>Search students</button><label>Student<select value={studentId} onChange={e => setStudentId(e.target.value)}><option value="">Select student</option>{studentMatches.map(x => <option key={x.id} value={x.id}>{x.name} · {x.registrationNumber}</option>)}</select></label><label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label><button type="button" className="btn btn-secondary" onClick={() => void loadHistory()} disabled={loading || !studentId}>Load history</button></div>
          <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 10 }}>
            <span className="text-xs text-slate-500">Date range:</span>
            <button type="button" className="btn btn-secondary" onClick={() => setHistoryRange('today')}>Today</button>
            <button type="button" className="btn btn-secondary" onClick={() => setHistoryRange('yesterday')}>Yesterday</button>
            <button type="button" className="btn btn-secondary" onClick={() => setHistoryRange('week')}>Last 7 days</button>
            <button type="button" className="btn btn-secondary" onClick={() => setHistoryRange('month')}>This month</button>
            <label className="ml-auto">Status<select aria-label="Filter attendance history by status" value={historyStatus} onChange={e => setHistoryStatus(e.target.value)}><option>All</option>{statusOptions.map(option => <option key={option}>{option}</option>)}</select></label>
            <button type="button" className="btn btn-secondary" onClick={exportHistoryCsv} disabled={filteredHistory.length === 0}>Export CSV</button>
            <button type="button" className="btn btn-secondary" onClick={() => window.print()} disabled={filteredHistory.length === 0}>Print / Save PDF</button>
          </div>
          {history.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginTop: 12 }}><div className="summary-card"><span>Recorded sessions</span><strong>{history.length}</strong></div><div className="summary-card"><span>Present / late</span><strong>{history.filter(x => x.status === 'Present' || x.status === 'Late').length}</strong></div><div className="summary-card"><span>Recorded attendance rate</span><strong>{Math.round(history.filter(x => x.status !== 'Excused').length ? history.filter(x => x.status === 'Present' || x.status === 'Late').length / history.filter(x => x.status !== 'Excused').length * 100 : 0)}%</strong></div></div>}
          <div className="table-responsive" style={{ marginTop: 12 }}><table className="data-table"><thead><tr><th>#</th><th>DATE</th><th>STUDENT</th><th>STUDENT NO.</th><th>COURSE</th><th>CLASS</th><th>TIMETABLE</th><th>ROOM</th><th>STATUS</th><th>REMARKS</th><th>ACTION</th></tr></thead><tbody>{filteredHistory.map((x,i) => <tr key={x.id}><td>{i+1}</td><td>{x.sessionDate}</td><td>{x.studentName ?? '—'}</td><td>{x.studentNumber ?? '—'}</td><td>{x.courseName ?? '—'}</td><td>{x.className}</td><td>{x.timetableSlot ?? '—'}</td><td>{x.room ?? '—'}</td><td><span className="status" style={{ display: 'inline-flex', minHeight: 28, alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: x.status === 'Present' ? '#dcfce7' : x.status === 'Late' ? '#fef3c7' : x.status === 'Absent' ? '#fee2e2' : '#dbeafe', color: x.status === 'Present' ? '#166534' : x.status === 'Late' ? '#92400e' : x.status === 'Absent' ? '#991b1b' : '#1e40af' }}>{x.status}</span></td><td>{x.remarks ?? '—'}</td><td><button type="button" className="btn btn-secondary" disabled={readOnly || x.sessionStatus !== 'Open'} onClick={async () => { try { await request(`/api/attendance/records/${x.id}`, { method: 'PUT', body: JSON.stringify({ status: x.status, remarks: x.remarks ?? null }) }); setMessage('Attendance correction saved.') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to correct attendance.') } }}>Save correction</button></td></tr>)}{filteredHistory.length === 0 && <tr><td colSpan={11}>No attendance history matches these filters.</td></tr>}</tbody></table></div>
        </>}
      </>}
    </section>
  )
}
