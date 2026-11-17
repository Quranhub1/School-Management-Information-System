import { useCallback, useEffect, useState } from 'react'
import { listStaffDailyAttendance, type StaffDailyAttendanceRow } from '../api/staffAttendance'
import { listStaffDepartments, type StaffDepartment } from '../api/staff'
import LoadingSpinner from './LoadingSpinner'

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
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState<StaffDepartment[]>([])
  const [rows, setRows] = useState<StaffDailyAttendanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const checkIns = rows.filter(row => row.checkIn).length
  const checkOuts = rows.filter(row => row.checkOut).length
  const incomplete = rows.filter(row => row.checkIn && !row.checkOut).length

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">HR / ATTENDANCE</span>
          <h3 className="text-lg font-semibold">Daily Staff Attendance</h3>\n          <p className="text-xs text-slate-500">Fingerprint check-in and check-out events appear here automatically after the workstation agent confirms each scan.</p>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="summary-card"><span>Check-ins</span><strong>{checkIns}</strong></div>
        <div className="summary-card"><span>Check-outs</span><strong>{checkOuts}</strong></div>
        <div className="summary-card"><span>Missing check-out</span><strong>{incomplete}</strong></div>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}
      <div className="table-responsive">
        <table className="data-table">
          <thead><tr>
            <th>Staff No.</th><th>Staff member</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7}><LoadingSpinner /></td></tr>
              : rows.length === 0 ? <tr><td colSpan={7}>No staff attendance records found for the selected filters.</td></tr>
              : rows.map(row => <tr key={row.staffMemberId + row.date}>
                <td>{row.staffNumber}</td>
                <td>{row.name}</td>
                <td>{row.date}</td>
                <td>{localDate(row.checkIn)}</td>
                <td>{localDate(row.checkOut)}</td>
                <td>{row.hoursWorked == null ? '—' : row.hoursWorked.toFixed(2)}</td>
                <td><span className={row.status === 'Complete' ? 'status status-success' : row.status === 'Checked in' ? 'status status-warning' : 'status'}>{row.status}</span></td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Times are displayed in Uganda local time. An incomplete day remains marked “Checked in” until a checkout is recorded.</p>
    </section>
  )
}
