import { useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
type AttendanceRecord = { id: string; attendanceSessionId: string; studentId: string; status: string; remarks?: string | null }
type AttendanceSession = { id: string; timetableEntryId: string; sessionDate: string; recordedByUserId?: string | null; remarks?: string | null }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) } })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Request failed (${response.status})`)
  }
  return response.status === 204 ? undefined as T : await response.json() as T
}

export function AttendanceManagement() {
  const [tab, setTab] = useState<'daily' | 'history' | 'qr'>('daily')
  const [timetableEntryId, setTimetableEntryId] = useState('')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [sessionId, setSessionId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [status, setStatus] = useState('Present')
  const [remarks, setRemarks] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [qrToken, setQrToken] = useState('')
  const [qrExpires, setQrExpires] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function clearNotice() { setMessage(''); setError('') }

  async function openSession(event: React.FormEvent) {
    event.preventDefault(); clearNotice()
    if (!timetableEntryId.trim()) { setError('Timetable entry ID is required.'); return }
    setLoading(true)
    try {
      const session = await request<AttendanceSession>('/api/attendance/sessions', { method: 'POST', body: JSON.stringify({ timetableEntryId: timetableEntryId.trim(), sessionDate, recordedByUserId: null, remarks: remarks.trim() || null }) })
      setSessionId(session.id); setMessage(`Attendance session opened for ${session.sessionDate}.`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to open attendance session.') } finally { setLoading(false) }
  }

  async function mark(event: React.FormEvent) {
    event.preventDefault(); clearNotice()
    if (!sessionId.trim() || !studentId.trim()) { setError('Session ID and student ID are required.'); return }
    setLoading(true)
    try {
      await request<AttendanceRecord>(`/api/attendance/sessions/${sessionId.trim()}/records`, { method: 'POST', body: JSON.stringify({ studentId: studentId.trim(), status, remarks: remarks.trim() || null }) })
      setMessage(`Attendance recorded as ${status}.`); setStudentId('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to record attendance.') } finally { setLoading(false) }
  }

  async function loadHistory() {
    clearNotice()
    if (!studentId.trim()) { setError('Enter a student ID to load attendance history.'); return }
    setLoading(true)
    try {
      const params = new URLSearchParams(); if (from) params.set('from', from); if (to) params.set('to', to)
      setHistory(await request<AttendanceRecord[]>(`/api/attendance/students/${studentId.trim()}${params.size ? `?${params}` : ''}`))
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load attendance history.') } finally { setLoading(false) }
  }

  async function refreshQr() {
    clearNotice()
    if (!sessionId.trim()) { setError('Open or enter an attendance session first.'); return }
    setLoading(true)
    try {
      const result = await request<{ token: string; expiresAtUtc: string }>(`/api/attendance/sessions/${sessionId.trim()}/qr`)
      setQrToken(result.token); setQrExpires(result.expiresAtUtc); setMessage('Rotating QR token generated. It rotates every 60 seconds.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to generate QR token.') } finally { setLoading(false) }
  }

  useEffect(() => { if (tab === 'qr' && sessionId) void refreshQr() }, [tab])

  return <section className="panel" aria-label="Attendance management">
    <div className="panel-heading"><div><span className="eyebrow">ATTENDANCE</span><h3>Attendance management</h3><p>Open class sessions, record attendance, review student history and generate rotating QR tokens.</p></div></div>
    <div className="library-workspace-tabs" role="tablist" aria-label="Attendance sections">
      <button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>Daily</button>
      <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Student history</button>
      <button role="tab" aria-selected={tab === 'qr'} className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}>QR attendance</button>
    </div>
    {message && <div className="success" role="status">{message}</div>}
    {error && <div className="error" role="alert">{error}</div>}

    {tab === 'daily' && <>
      <form className="management-form" onSubmit={openSession}>
        <label>Timetable entry ID<input value={timetableEntryId} onChange={e => setTimetableEntryId(e.target.value)} placeholder="Timetable entry GUID" required /></label>
        <label>Session date<input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required /></label>
        <label>Remarks<input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional" /></label>
        <button type="submit" disabled={loading}>{loading ? 'Opening…' : 'Open session'}</button>
      </form>
      <form className="management-form" onSubmit={mark}>
        <label>Attendance session ID<input value={sessionId} onChange={e => setSessionId(e.target.value)} placeholder="Session GUID" required /></label>
        <label>Student ID<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student GUID" required /></label>
        <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option>Present</option><option>Absent</option><option>Late</option><option>Excused</option></select></label>
        <label>Remarks<input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional" /></label>
        <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Record attendance'}</button>
      </form>
    </>}

    {tab === 'history' && <>
      <div className="management-form">
        <label>Student ID<input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student GUID" /></label>
        <label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <button type="button" disabled={loading} onClick={() => void loadHistory()}>{loading ? 'Loading…' : 'Load history'}</button>
      </div>
      <div className="table-wrap"><table><thead><tr><th>Record</th><th>Session</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{history.map(record => <tr key={record.id}><td>{record.id}</td><td>{record.attendanceSessionId}</td><td>{record.status}</td><td>{record.remarks ?? '—'}</td></tr>)}{history.length === 0 && <tr><td colSpan={4} className="empty">No attendance records loaded.</td></tr>}</tbody></table></div>
    </>}

    {tab === 'qr' && <div className="panel" style={{ marginTop: 16 }}>
      <form className="management-form" onSubmit={e => { e.preventDefault(); void refreshQr() }}><label>Attendance session ID<input value={sessionId} onChange={e => setSessionId(e.target.value)} placeholder="Session GUID" required /></label><button type="submit" disabled={loading}>{loading ? 'Generating…' : 'Generate current token'}</button></form>
      {qrToken && <div><p><strong>Token:</strong></p><code style={{ wordBreak: 'break-all' }}>{qrToken}</code><p><strong>Expires:</strong> {qrExpires ? new Date(qrExpires).toLocaleTimeString() : '—'}</p><p className="empty">The API accepts the current token and the immediately previous 60-second slot to tolerate scanning at the rotation boundary.</p></div>}
    </div>}
  </section>
}
