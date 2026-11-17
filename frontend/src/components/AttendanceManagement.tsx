import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  closeAttendanceSession,
  bulkMarkAttendance,
  getEligibleStudents,
  getQrImage,
  getQrToken,
  getSessionSummary,
  getStudentAttendanceHistory,
  markAttendance,
  openAttendanceSession,
  type AttendanceRecord,
  type AttendanceSession,
  type EligibleStudent,
  type QrTokenInfo,
  type SessionSummary,
} from '../api/attendance'
import { getAccessToken } from '../api/auth'
import { attendanceMarkRequestSchema } from '../schemas'
import { validateForm } from '../lib/validation'

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Present: { bg: '#d1fae5', text: '#065f46', border: '#bbf7d0' },
  Absent: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  Late: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  Excused: { bg: '#e0e7ff', text: '#1e3a8a', border: '#bfdbfe' },
}

const STATUS_LABELS: Record<string, string> = {
  Present: 'Present',
  Absent: 'Absent',
  Late: 'Late',
  Excused: 'Excused',
}

export function AttendanceManagement({
  readOnly = false,
}: { readOnly?: boolean } = {}) {
  const [tab, setTab] = useState<'daily' | 'history' | 'qr'>(
    readOnly ? 'history' : 'daily',
  )
  const [sessionDate, setSessionDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [sessionId, setSessionId] = useState('')
  const [sessionContext, setSessionContext] = useState<{
    timetableEntryId: string
    courseCode: string
    courseName: string
    programmeName: string
    room: string
    dayOfWeek: string
    startTime: string
    endTime: string
  } | null>(null)
  const [timetableEntryId, setTimetableEntryId] = useState('')
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([])
  const [markedStudents, setMarkedStudents] = useState<Set<string>>(new Set())
  const [studentStatuses, setStudentStatuses] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>>({})
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'Present' | 'Absent' | 'Late' | 'Excused'>('Present')
  const [remarks, setRemarks] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [qrExpires, setQrExpires] = useState<string | null>(null)
  const [qrCountdown, setQrCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionClosed, setSessionClosed] = useState(false)
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearNotice() {
    setMessage('')
    setError('')
  }

  useEffect(() => {
    const handler = (event: Event) => {
      if (!(event instanceof CustomEvent)) return
      const detail = event.detail as
        | {
            timetableEntryId?: string
            sessionDate?: string
            courseCode?: string
            courseName?: string
            programmeName?: string
            room?: string
            dayOfWeek?: string
            startTime?: string
            endTime?: string
          }
        | undefined
      if (!detail) return
      setSessionContext({
        timetableEntryId: detail.timetableEntryId ?? '',
        courseCode: detail.courseCode ?? '',
        courseName: detail.courseName ?? '',
        programmeName: detail.programmeName ?? '',
        room: detail.room ?? '',
        dayOfWeek: detail.dayOfWeek ?? '',
        startTime: detail.startTime ?? '',
        endTime: detail.endTime ?? '',
      })
      setTimetableEntryId(detail.timetableEntryId ?? '')
      setSessionDate(detail.sessionDate ?? new Date().toISOString().slice(0, 10))
      setSessionId('')
      setSessionClosed(false)
      if (!readOnly) setTab('daily')
      setMessage('Class selected from Teaching. Open the attendance session to begin.')
    }
    window.addEventListener('smis:attendance-context', handler)
    return () => window.removeEventListener('smis:attendance-context', handler)
  }, [readOnly])

  useEffect(() => {
    if (qrTimerRef.current) {
      clearInterval(qrTimerRef.current)
      qrTimerRef.current = null
    }
    if (tab === 'qr' && qrExpires) {
      const update = () => {
        const now = Date.now()
        const expires = new Date(qrExpires).getTime()
        const remaining = Math.max(0, Math.ceil((expires - now) / 1000))
        setQrCountdown(remaining)
        if (remaining <= 0) {
          void refreshQr()
        }
      }
      update()
      qrTimerRef.current = setInterval(update, 1000)
    }
    return () => {
      if (qrTimerRef.current) {
        clearInterval(qrTimerRef.current)
        qrTimerRef.current = null
      }
    }
  }, [tab, qrExpires])

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const setDatePreset = (preset: 'today' | 'yesterday' | '7days' | 'month') => {
    switch (preset) {
      case 'today': setFrom(today); setTo(today); break
      case 'yesterday': setFrom(yesterday); setTo(yesterday); break
      case '7days': setFrom(sevenDaysAgo); setTo(today); break
      case 'month': setFrom(firstOfMonth); setTo(today); break
    }
  }

  const summaryStats = useMemo(() => {
    if (!summary) return null
    return {
      total: summary.totalEnrolled,
      marked: summary.markedPresent + summary.markedAbsent + summary.markedLate + summary.markedExcused,
      present: summary.markedPresent,
      absent: summary.markedAbsent,
      late: summary.markedLate,
      excused: summary.markedExcused,
      unmarked: summary.unmarked,
      percentage: summary.attendancePercentage,
    }
  }, [summary])

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return eligibleStudents
    return eligibleStudents.filter(s =>
      s.studentNumber.toLowerCase().includes(term) ||
      s.firstName.toLowerCase().includes(term) ||
      s.lastName.toLowerCase().includes(term) ||
      (s.otherNames && s.otherNames.toLowerCase().includes(term)) ||
      s.displayName.toLowerCase().includes(term),
    )
  }, [eligibleStudents, search])

  const pendingMarks = useMemo(() => {
    return filteredStudents.filter(s => !markedStudents.has(s.studentId))
  }, [filteredStudents, markedStudents])

  async function openSession() {
    clearNotice()
    if (!timetableEntryId.trim()) {
      setError('Select a class from the Teaching timetable first.')
      return
    }
    setLoading(true)
    try {
      const session = await openAttendanceSession({
        timetableEntryId: timetableEntryId.trim(),
        sessionDate,
        recordedByUserId: null,
        remarks: remarks.trim() || null,
      })
      setSessionId(session.id)
      setSessionClosed(false)
      setMessage(`Attendance session opened for ${session.sessionDate}.`)
      await loadEligibleStudents()
      await loadSummary()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open attendance session.')
    } finally {
      setLoading(false)
    }
  }

  async function closeSession() {
    clearNotice()
    if (!sessionId.trim()) {
      setError('Open an attendance session first.')
      return
    }
    setLoading(true)
    try {
      await closeAttendanceSession(sessionId.trim())
      setSessionClosed(true)
      setMessage('Attendance session closed. Further attendance records are blocked.')
      await loadSummary()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to close attendance session.')
    } finally {
      setLoading(false)
    }
  }

  async function loadEligibleStudents() {
    if (!sessionId.trim()) return
    try {
      const students = await getEligibleStudents(sessionId.trim())
      setEligibleStudents(students)
      setMarkedStudents(new Set(students.filter(s => s.alreadyMarked).map(s => s.studentId)))
      const statuses: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'> = {}
      students.forEach(s => {
        statuses[s.studentId] = 'Present'
      })
      setStudentStatuses(statuses)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load student list.')
    }
  }

  async function loadSummary() {
    if (!sessionId.trim()) return
    try {
      const sum = await getSessionSummary(sessionId.trim())
      setSummary(sum)
    } catch (e) {
      // Summary may fail if no data yet; that's OK
    }
  }

  async function toggleStudentStatus(studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') {
    setStudentStatuses(prev => ({ ...prev, [studentId]: status }))
    if (status !== 'Present' || !markedStudents.has(studentId)) {
      setMarkedStudents(prev => {
        const next = new Set(prev)
        if (status === 'Present') next.add(studentId)
        else next.delete(studentId)
        return next
      })
    } else {
      setMarkedStudents(prev => {
        const next = new Set(prev)
        next.add(studentId)
        return next
      })
    }
  }

  async function saveStudentStatus(studentId: string) {
    clearNotice()
    if (!sessionId.trim()) {
      setError('Open an attendance session first.')
      return
    }
    const status = studentStatuses[studentId]
    const remark = studentRemarks[studentId] || undefined
    setLoading(true)
    try {
      await markAttendance(sessionId.trim(), studentId, status, remark)
      setMarkedStudents(prev => new Set([...prev, studentId]))
      setMessage(`Marked as ${STATUS_LABELS[status]}.`)
      await loadSummary()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to mark attendance.')
    } finally {
      setLoading(false)
    }
  }

  async function bulkSave() {
    clearNotice()
    if (!sessionId.trim()) {
      setError('Open an attendance session first.')
      return
    }
    const pending = pendingMarks
    if (pending.length === 0) {
      setError('All students are already marked.')
      return
    }
    setLoading(true)
    try {
      await bulkMarkAttendance(sessionId.trim(), pending.map(s => ({
        studentId: s.studentId,
        status: studentStatuses[s.studentId] || 'Present',
        remarks: studentRemarks[s.studentId] || undefined,
      })))
      pending.forEach(s => setMarkedStudents(prev => new Set([...prev, s.studentId])))
      setMessage(`Marked ${pending.length} students.`)
      await loadSummary()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to bulk mark attendance.')
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    clearNotice()
    setLoading(true)
    try {
      setHistory(await getStudentAttendanceHistory(selectedStudentId.trim(), from || undefined, to || undefined))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load attendance history.')
    } finally {
      setLoading(false)
    }
  }

  async function refreshQr() {
    clearNotice()
    if (!sessionId.trim()) {
      setError('Open or enter an attendance session first.')
      return
    }
    setLoading(true)
    try {
      const result = await getQrToken(sessionId.trim())
      setQrToken(result.token)
      setQrExpires(result.expiresAtUtc)
      const svg = await getQrImage(sessionId.trim())
      setQrSvg(svg)
      setMessage('QR token refreshed. Display this screen for students to scan.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate QR code.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'qr' && sessionId) void refreshQr()
  }, [tab, sessionId])

  const statusBadge = (status: string) => {
    const style = STATUS_COLORS[status] || STATUS_COLORS.Present
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
        style={{
          backgroundColor: style.bg,
          color: style.text,
          borderColor: style.border,
        }}
      >
        {STATUS_LABELS[status] || status}
      </span>
    )
  }

  return (
    <section className="space-y-4" aria-label="Attendance management">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ATTENDANCE</span>
            <h3>
              {readOnly ? 'Attendance lists · Read-only' : 'Attendance management'}
            </h3>
            <p>
              {readOnly
                ? 'Review student attendance history.'
                : 'Open class sessions, record attendance, review history and use QR check-in.'}
            </p>
          </div>
          <span className="status">
            {sessionContext ? (
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold border" style={{
                backgroundColor: '#f0fdf4',
                color: '#065f46',
                borderColor: '#bbf7d0',
              }}>
                <span className="w-2 h-2 rounded-full bg-green-500" /> Session Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold border" style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderColor: '#fcd34d',
              }}>
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> No Session
              </span>
            )}
          </span>
        </div>
      </div>

      {message && <div className="success" role="status">{message}</div>}
      {error && <div className="error" role="alert">{error}</div>}

      {!readOnly && (
        <div className="library-workspace-tabs" role="tablist" aria-label="Attendance sections">
          <button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>
            Daily
          </button>
          <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            Student history
          </button>
          {!readOnly && (
            <button role="tab" aria-selected={tab === 'qr'} className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}>
              QR attendance
            </button>
          )}
        </div>
      )}

      {/* Session setup form - always visible when no session is open */}
      {!readOnly && !sessionId && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">OPEN SESSION</span>
              <h4 className="font-semibold">Open Attendance Session</h4>
              <p className="text-sm text-slate-600">
                Select a class from the timetable to begin recording attendance.
              </p>
            </div>
          </div>
          <div className="management-form grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Timetable Entry ID</span>
              <input
                value={timetableEntryId}
                onChange={e => setTimetableEntryId(e.target.value)}
                placeholder="Timetable entry GUID"
                required
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Session Date</span>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Remarks</span>
              <input
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optional"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={openSession}
              disabled={loading || sessionClosed || !timetableEntryId.trim()}
              className="library-primary w-full py-2 rounded"
            >
              {loading ? 'Opening…' : 'Open Session'}
            </button>
          </div>
        </div>
      )}

      {/* Active session context + bulk marking */}
      {!readOnly && sessionId && sessionContext && (
        <div className="panel" style={{ borderLeft: '4px solid #065f46' }}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CLASS SESSION</span>
              <h4>{sessionContext.courseName}</h4>
              <p className="text-sm text-slate-600">
                {sessionContext.programmeName} • {sessionContext.courseCode} •
                {sessionContext.room} • {sessionContext.dayOfWeek} {sessionContext.startTime}–{sessionContext.endTime}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="text-xs text-slate-500">Session ID:</span>
                <span className="font-mono text-xs text-slate-700">
                  {sessionId.slice(0, 8)}…
                </span>
              </div>
              <button
                type="button"
                onClick={() => void closeSession()}
                disabled={loading || sessionClosed}
                className="border rounded py-2 px-3 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close Session
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold">Record Attendance</h4>
                <p className="text-sm text-slate-600">
                  Search for a student or use the bulk table below.
                </p>
              </div>
              {sessionId && (
                <button
                  type="button"
                  onClick={() => void bulkSave()}
                  disabled={loading || pendingMarks.length === 0 || sessionClosed}
                  className="library-primary w-full md:w-auto px-4 py-2 rounded"
                >
                  {loading ? 'Saving…' : `Mark All ${pendingMarks.length} Remaining`}
                </button>
              )}
            </div>

            {/* Individual search mark */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Student Search</span>
                <div className="relative">
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or student number…"
                    className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/50"
                  />
                  {filteredStudents.length > 0 && search.trim() && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredStudents.slice(0, 8).map(s => (
                        <button
                          key={s.studentId}
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(s.studentId)
                            setSearch('')
                            setSelectedStatus(studentStatuses[s.studentId] || 'Present')
                            setStudentRemarks(prev => ({ ...prev, [s.studentId]: studentRemarks[s.studentId] || '' }))
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                        >
                          <div className="font-medium">{s.displayName}</div>
                          <div className="text-xs text-slate-500">{s.studentNumber}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Status</span>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as 'Present' | 'Absent' | 'Late' | 'Excused')}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Excused">Excused</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Remarks (optional)</span>
                <input
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Remarks"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!selectedStudentId.trim()) {
                    setError('Select a student first.')
                    return
                  }
                  if (!sessionId.trim()) {
                    setError('Open an attendance session first.')
                    return
                  }
                  void saveStudentStatus(selectedStudentId)
                }}
                disabled={loading || !selectedStudentId || !sessionId || sessionClosed}
                className="library-primary w-full py-2.5 rounded"
              >
                {loading ? 'Saving…' : 'Mark Student'}
              </button>
            </div>

            {/* Bulk table */}
            {eligibleStudents.length > 0 && (
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">BULK MARK</span>
                    <h4>Class Roster</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search students…"
                      className="border rounded px-2 py-1 text-sm w-64"
                    />
                    <button
                      type="button"
                      onClick={() => void bulkSave()}
                      disabled={loading || pendingMarks.length === 0 || sessionClosed}
                      className="library-primary px-3 py-1.5 rounded text-sm"
                    >
                      Mark Remaining ({pendingMarks.length})
                    </button>
                  </div>
                </div>
                <div className="table-wrap overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 font-semibold text-slate-600">Student</th>
                        <th className="text-left pb-3 font-semibold text-slate-600 w-32">Status</th>
                        <th className="text-left pb-3 font-semibold text-slate-600 w-40">Remarks</th>
                        <th className="text-right pb-3 font-semibold text-slate-600 w-16">Marked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(student => {
                        const isMarked = markedStudents.has(student.studentId)
                        const status = studentStatuses[student.studentId] || 'Present'
                        const remark = studentRemarks[student.studentId] || ''
                        return (
                          <tr key={student.studentId} className="border-b hover:bg-slate-50/50 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">
                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900">{student.displayName}</div>
                                  <div className="text-xs text-slate-500">{student.studentNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <select
                                value={status}
                                onChange={e =>
                                  toggleStudentStatus(
                                    student.studentId,
                                    e.target.value as 'Present' | 'Absent' | 'Late' | 'Excused'
                                  )
                                }
                                className="border rounded px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-green-500/50"
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Excused">Excused</option>
                              </select>
                            </td>
                            <td className="py-3">
                              <input
                                type="text"
                                value={remark}
                                onChange={e => setStudentRemarks(prev => ({ ...prev, [student.studentId]: e.target.value }))}
                                placeholder="Remarks"
                                className="border rounded px-2 py-1 text-sm w-32 focus:ring-2 focus:ring-green-500/50"
                              />
                            </td>
                            <td className="py-3 text-right">
                              {isMarked ? (
                                <span className="text-xs font-semibold text-green-600">✓ Marked</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void saveStudentStatus(student.studentId)}
                                  disabled={loading || sessionClosed}
                                  className="text-xs text-green-600 hover:text-green-800 underline"
                                >
                                  Mark
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold">Attendance History</h4>
              <p className="text-sm text-slate-600">
                View attendance records for a student across sessions.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void setDatePreset('today')}
                className="text-xs border rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => void setDatePreset('yesterday')}
                className="text-xs border rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => void setDatePreset('7days')}
                className="text-xs border rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => void setDatePreset('month')}
                className="text-xs border rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
              >
                This Month
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Student ID</span>
              <input
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                placeholder="Student ID or number…"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">From</span>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">To</span>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadHistory()}
              disabled={loading || !selectedStudentId.trim()}
              className="library-primary w-full py-2.5 rounded"
            >
              {loading ? 'Loading…' : 'Load History'}
            </button>
          </div>

          {history.length > 0 && (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-3 font-semibold text-slate-600">Session Date</th>
                      <th className="text-left pb-3 font-semibold text-slate-600">Course</th>
                      <th className="text-left pb-3 font-semibold text-slate-600">Status</th>
                      <th className="text-left pb-3 font-semibold text-slate-600">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(rec => (
                      <tr key={rec.id} className="border-b">
                        <td className="py-3">{rec.attendanceSessionId.slice(0, 8)}…</td>
                        <td className="py-3">{rec.studentId.slice(0, 8)}…</td>
                        <td className="py-3">{statusBadge(rec.status)}</td>
                        <td className="py-3 text-slate-600">{rec.remarks ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* QR Tab */}
      {!readOnly && tab === 'qr' && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">QR CHECK-IN</span>
              <h4>Display QR Code</h4>
              <p className="text-sm text-slate-600">
                Show this screen to students. They scan the QR code with the student app to check in.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-64 h-64 bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-center">
              {qrSvg ? (
                <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-4xl">📱</span>
                  <p className="mt-2 text-sm">Generate QR code</p>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Token expires in</p>
              <span className="text-2xl font-mono font-bold text-slate-900">
                {qrCountdown > 0 ? qrCountdown : '—'}s
              </span>
            </div>
            <div className="flex gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={() => void refreshQr()}
                disabled={loading || !sessionId}
                className="library-primary flex-1 py-2.5 rounded"
              >
                {loading ? 'Refreshing…' : 'Refresh QR Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (qrSvg) {
                    const svgBlob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' })
                    const url = URL.createObjectURL(svgBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `attendance-qr-${sessionId.slice(0, 8)}.svg`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                  }
                }}
                disabled={!qrSvg}
                className="border rounded py-2.5 flex-1 text-slate-700 hover:bg-slate-50"
              >
                Download SVG
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              QR code rotates every 60 seconds. The system accepts the current
              and previous token to allow for scanning at rotation boundaries.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
