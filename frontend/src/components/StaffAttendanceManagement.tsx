import { useCallback, useEffect, useState } from 'react'
import { getStaffAttendanceHistory, listStaffDailyAttendance, recordManualStaffAttendance, type StaffAttendanceHistory, type StaffDailyAttendanceRow } from '../api/staffAttendance'
import { listStaffDepartments, type StaffDepartment } from '../api/staff'
import LoadingSpinner from './LoadingSpinner'

const shiftDate = (value: string, days: number) => { const [year, month, day] = value.split('-').map(Number); return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10) }

function isLateCheckIn(value: string | null, deadline: string) {
  if (!value) return false
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(value))
  return time > deadline
}

function localDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-UG', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(value))
}

export function StaffAttendanceManagement() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const [from, setFrom] = useState(shiftDate(today, -6))
  const [to, setTo] = useState(today)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [checkInDeadline, setCheckInDeadline] = useState('08:30')
  const [departments, setDepartments] = useState<StaffDepartment[]>([])
  const [rows, setRows] = useState<StaffDailyAttendanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingStaffId, setSavingStaffId] = useState('')
  const [error, setError] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<StaffDailyAttendanceRow | null>(null)
  const [staffHistory, setStaffHistory] = useState<StaffAttendanceHistory | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFrom, setHistoryFrom] = useState(shiftDate(today, -365))
  const [historyTo, setHistoryTo] = useState(today)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await listStaffDailyAttendance({ from, to, search, departmentId }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load staff attendance.')
    } finally {
      setLoading(false)
    }
  }, [from, to, search, departmentId])

  useEffect(() => {
    void listStaffDepartments().then(setDepartments).catch(() => setDepartments([]))
  }, [])
  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!selectedStaff) return
    let cancelled = false
    setHistoryLoading(true)
    getStaffAttendanceHistory(selectedStaff.staffMemberId, { from: historyFrom, to: historyTo })
      .then(history => { if (!cancelled) setStaffHistory(history) })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load this staff member’s attendance history.') })
      .finally(() => { if (!cancelled) setHistoryLoading(false) })
    return () => { cancelled = true }
  }, [selectedStaff?.staffMemberId, historyFrom, historyTo])

  function openStaffHistory(row: StaffDailyAttendanceRow) {
    setSelectedStaff(row)
    setStaffHistory(null)
    setError('')
  }

  async function recordStaffEvent(row: StaffDailyAttendanceRow, eventType: 'IN' | 'OUT') {
    setSavingStaffId(row.staffMemberId)
    setError('')
    try {
      await recordManualStaffAttendance(row.staffMemberId, eventType)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to record staff attendance.')
    } finally {
      setSavingStaffId('')
    }
  }

  const checkIns = rows.filter(row => row.checkIn).length
  const checkOuts = rows.filter(row => row.checkOut).length
  const incomplete = rows.filter(row => row.checkIn && !row.checkOut).length
  const absences = rows.filter(row => row.status === 'Absent').length
  const lateCheckIns = rows.filter(row => isLateCheckIn(row.checkIn, checkInDeadline)).length
  const localClock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
  const deadlinePassed = localClock >= checkInDeadline
  const lastSevenDates = Array.from({ length: 7 }, (_, index) => shiftDate(today, index - 6))

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Daily Staff Attendance</h3>
          <p className="text-sm text-slate-500">One row per staff member per date. Staff number identifies each person independently.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void load()} disabled={loading}>Refresh register</button>
      </div>

      <div className="grid-form">
        <label>From date<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>To date<input type="date" min={from} value={to} onChange={e => setTo(e.target.value)} /></label>
        <label>Staff name / number<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff" /></label>
        <label>Department
          <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
            <option value="">All departments</option>
            {departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </label>
        <label>Late check-in threshold<input type="time" value={checkInDeadline} onChange={e => setCheckInDeadline(e.target.value)} /></label>
        <button type="button" className="btn btn-secondary" onClick={() => { const [year, month, day] = today.split('-').map(Number); const start = new Date(Date.UTC(year, month - 1, day - 6)).toISOString().slice(0, 10); setFrom(start); setTo(today) }}>Last 7 days</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="summary-card"><span>Check-ins · selected period</span><strong>{checkIns}</strong></div>
        <div className="summary-card"><span>Check-outs · selected period</span><strong>{checkOuts}</strong></div>
        <div className="summary-card"><span>Late check-ins</span><strong>{lateCheckIns}</strong></div>
        <div className="summary-card"><span>Missing check-out</span><strong>{incomplete}</strong></div>
        <div className="summary-card"><span>Absent days</span><strong>{absences}</strong></div>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}
      {selectedStaff && (
        <section className="panel" aria-label="Individual staff attendance history">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{staffHistory?.staffName ?? selectedStaff.name}</h3>
              <p className="text-sm text-slate-500">Staff No. {selectedStaff.staffNumber} · Individual attendance record</p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => { setSelectedStaff(null); setStaffHistory(null) }}>Back to attendance register</button>
          </div>
          <div className="grid-form" style={{ marginTop: 12 }}>
            <label>History from<input type="date" max={historyTo} value={historyFrom} onChange={event => setHistoryFrom(event.target.value)} /></label>
            <label>History to<input type="date" min={historyFrom} max={today} value={historyTo} onChange={event => setHistoryTo(event.target.value)} /></label>
          </div>
          {historyLoading ? <LoadingSpinner /> : staffHistory && (
            <div className="table-responsive" style={{ marginTop: 14 }}>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Hours worked</th><th>Status</th><th>Events recorded</th></tr></thead>
                <tbody>
                  {staffHistory.attendanceDays.map(day => <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{localDate(day.checkIn)}</td>
                    <td>{localDate(day.checkOut)}</td>
                    <td>{day.hoursWorked == null ? '—' : day.hoursWorked.toFixed(2)}</td>
                    <td><span className={day.status === 'Complete' ? 'status status-success' : day.status === 'Checked in' ? 'status status-warning' : 'status'}>{day.status}</span></td>
                    <td>{day.eventCount}</td>
                  </tr>)}
                </tbody>
              </table>
              {staffHistory.events.length > 0 && <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>View raw attendance events ({staffHistory.events.length})</summary>
                <table className="data-table" style={{ marginTop: 8 }}>
                  <thead><tr><th>Time</th><th>Event</th><th>Source</th><th>Device</th><th>Capture reference</th></tr></thead>
                  <tbody>{staffHistory.events.map(event => <tr key={event.id}>
                    <td>{localDate(event.recordedAtUtc)}</td>
                    <td>{event.eventType === 'IN' ? 'Check-in' : 'Check-out'}</td>
                    <td>{event.source || '—'}</td>
                    <td>{event.deviceId || '—'}</td>
                    <td>{event.captureId || '—'}</td>
                  </tr>)}</tbody>
                </table>
              </details>}
            </div>
          )}
        </section>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead><tr>
            <th>Staff No.</th><th>Staff member</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>7-day trend</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9}><LoadingSpinner /></td></tr>
              : rows.length === 0 ? <tr><td colSpan={9}>No staff attendance records found for the selected filters.</td></tr>
              : rows.map(row => <tr key={row.staffMemberId + row.date} onClick={() => void openStaffHistory(row)} onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void openStaffHistory(row) } }} tabIndex={0} role="button" aria-label={`Open full attendance history for ${row.name}`} style={{ cursor: 'pointer' }}>
                <td>{row.staffNumber}</td>
                <td>{row.name}</td>
                <td>{row.date}</td>
                <td>{localDate(row.checkIn)}</td>
                <td>{localDate(row.checkOut)}</td>
                <td>{row.hoursWorked == null ? '—' : row.hoursWorked.toFixed(2)}</td>
                <td><div aria-label={`Last seven days attendance for ${row.name}`} style={{ display: 'flex', gap: 3 }}>{lastSevenDates.map(date => { const day = rows.find(item => item.staffMemberId === row.staffMemberId && item.date === date); return <span key={date} title={`${date}: ${day?.status ?? (date < from || date > to ? 'Outside selected date range' : 'No attendance row')}`} style={{ width: 10, height: 18, borderRadius: 3, background: day?.checkOut ? '#16a34a' : day?.checkIn ? '#f59e0b' : day ? '#fee2e2' : '#e2e8f0' }} /> })}</div></td>
                <td><span className={row.status === 'Complete' ? 'status status-success' : row.status === 'Checked in' || isLateCheckIn(row.checkIn, checkInDeadline) || (row.date === today && deadlinePassed) ? 'status status-warning' : 'status'}>{row.date === today && row.status === 'Absent' && deadlinePassed ? 'Not checked in by ' + checkInDeadline : isLateCheckIn(row.checkIn, checkInDeadline) ? 'Late' : row.status}</span></td>
                <td>{row.date === today && row.status === 'Absent'
                  ? <button type="button" className="btn btn-secondary" disabled={savingStaffId === row.staffMemberId} onClick={event => { event.stopPropagation(); void recordStaffEvent(row, 'IN') }}>{savingStaffId === row.staffMemberId ? 'Saving…' : 'Check in'}</button>
                  : row.date === today && row.status === 'Checked in'
                    ? <button type="button" className="btn btn-secondary" disabled={savingStaffId === row.staffMemberId} onClick={event => { event.stopPropagation(); void recordStaffEvent(row, 'OUT') }}>{savingStaffId === row.staffMemberId ? 'Saving…' : 'Check out'}</button>
                    : '—'}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  )
}
