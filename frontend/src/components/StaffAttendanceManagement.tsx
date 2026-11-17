import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  checkInStaff,
  checkOutStaff,
  listStaffDailyAttendance,
  type StaffDailyAttendanceRow,
} from '../api/attendance'
import { listStaffDepartments, type StaffDepartment } from '../api/staff'
import { listStaffDepartments as listDepartmentsAlt } from '../api/staff'
import LoadingSpinner from './LoadingSpinner'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Complete: { label: 'Complete', color: '#065f46', bg: '#d1fae5', border: '#bbf7d0' },
  'Checked in': { label: 'Checked In', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Absent: { label: 'Absent', color: '#991b1b', bg: '#fee2e2', border: '#fecaca' },
}

function localDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-UG', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

function localDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-UG', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function StaffAttendanceManagement() {
  const kampala = Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const today = kampala.format(new Date())
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState<StaffDepartment[]>([])
  const [rows, setRows] = useState<StaffDailyAttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState<Set<string>>(new Set())

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
    void listDepartmentsAlt().then(setDepartments).catch(() => setDepartments([]))
  }, [])
  useEffect(() => { void load() }, [load])

  const handleCheckIn = async (staffId: string, staffNumber: string, staffName: string) => {
    setChecking(prev => new Set([...prev, staffId]))
    try {
      await checkInStaff(staffId)
      setMessage(`Check-in recorded for ${staffName}.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed.')
    } finally {
      setChecking(prev => {
        const next = new Set(prev)
        next.delete(staffId)
        return next
      })
    }
  }

  const handleCheckOut = async (staffId: string, staffNumber: string, staffName: string) => {
    setChecking(prev => new Set([...prev, staffId]))
    try {
      await checkOutStaff(staffId)
      setMessage(`Check-out recorded for ${staffName}.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-out failed.')
    } finally {
      setChecking(prev => {
        const next = new Set(prev)
        next.delete(staffId)
        return next
      })
    }
  }

  const [message, setMessage] = useState('')

  const todayKampala = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const setDatePreset = (preset: 'today' | 'yesterday' | '7days' | 'month') => {
    switch (preset) {
      case 'today': setFrom(todayKampala); setTo(todayKampala); break
      case 'yesterday': setFrom(yesterday); setTo(yesterday); break
      case '7days': setFrom(sevenDaysAgo); setTo(todayKampala); break
      case 'month': setFrom(firstOfMonth); setTo(todayKampala); break
    }
  }

  const stats = useMemo(() => {
    const total = rows.length
    const complete = rows.filter(r => r.status === 'Complete').length
    const checkedIn = rows.filter(r => r.status === 'Checked in').length
    const absent = rows.filter(r => r.status === 'Absent').length
    const totalHours = rows.reduce((sum, r) => sum + (r.hoursWorked || 0), 0)
    return { total, complete, checkedIn, absent, totalHours }
  }, [rows])

  return (
    <section className="space-y-4">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">HR / ATTENDANCE</span>
            <h3 className="text-lg font-semibold">Daily Staff Attendance</h3>
            <p className="text-sm text-slate-600">
              Track staff check-in and check-out times across campus.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="border rounded px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {message && <div className="success" role="status">{message}</div>}
      {error && <div className="error" role="alert">{error}</div>}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-slate-50">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-xs font-semibold text-green-800 uppercase tracking-wider">Complete</div>
          <div className="text-2xl font-bold text-green-700">{stats.complete}</div>
        </div>
        <div className="border rounded-lg p-4 bg-yellow-50">
          <div className="text-xs font-semibold text-yellow-800 uppercase tracking-wider">Checked In</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.checkedIn}</div>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="text-xs font-semibold text-red-800 uppercase tracking-wider">Absent</div>
          <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
        </div>
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Total Hours</div>
          <div className="text-2xl font-bold text-blue-700">{stats.totalHours.toFixed(1)}h</div>
        </div>
      </div>

      {/* Filters */}
      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">From date</span>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">To date</span>
              <input
                type="date"
                min={from}
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Search staff</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name or staff number…"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Department</span>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">All departments</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
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
      </div>

      {/* Table */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-3 font-semibold text-slate-600">Staff No.</th>
              <th className="text-left pb-3 font-semibold text-slate-600">Staff Member</th>
              <th className="text-left pb-3 font-semibold text-slate-600">Department</th>
              <th className="text-left pb-3 font-semibold text-slate-600">Date</th>
              <th className="text-left pb-3 font-semibold text-slate-600">Check-in</th>
              <th className="text-left pb-3 font-semibold text-slate-600">Check-out</th>
              <th className="text-right pb-3 font-semibold text-slate-600 w-20">Hours</th>
              <th className="text-center pb-3 font-semibold text-slate-600 w-20">Status</th>
              <th className="text-right pb-3 font-semibold text-slate-600 w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No staff attendance records found for the selected filters.
                </td>
              </tr>
            ) : (
              rows.map(row => {
                const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.Absent
                const isCheckedIn = row.status === 'Checked in'
                const isComplete = row.status === 'Complete'
                const isAbsent = row.status === 'Absent'
                const isChecking = checking.has(row.staffMemberId)

                return (
                  <tr key={`${row.staffMemberId}-${row.date}`} className="border-b hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{row.staffNumber}</div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{row.name}</div>
                    </td>
                    <td className="py-3 text-slate-600">
                      {row.departmentId ? row.departmentId : '—'}
                    </td>
                    <td className="py-3 text-slate-600">{localDate(row.date)}</td>
                    <td className="py-3">
                      {row.checkIn ? (
                        <span className="text-xs font-medium text-slate-700">
                          {localDateTime(row.checkIn)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {row.checkOut ? (
                        <span className="text-xs font-medium text-slate-700">
                          {localDateTime(row.checkOut)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {row.hoursWorked != null ? (
                        <span className="font-mono text-xs">{row.hoursWorked.toFixed(2)}h</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: config.bg,
                          color: config.color,
                          borderColor: config.border,
                        }}
                      >
                        {config.label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {isComplete ? (
                        <span className="text-xs text-green-600 font-medium">Done</span>
                      ) : isCheckedIn ? (
                        <button
                          type="button"
                          onClick={() => void handleCheckOut(row.staffMemberId, row.staffNumber, row.name)}
                          disabled={isChecking || loading}
                          className="text-xs border border-red-200 text-red-700 rounded px-2 py-1 hover:bg-red-50"
                        >
                          Check Out
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleCheckIn(row.staffMemberId, row.staffNumber, row.name)}
                          disabled={isChecking || loading}
                          className="text-xs border border-green-200 text-green-700 rounded px-2 py-1 hover:bg-green-50"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Times are displayed in Uganda local time (Kampala). An incomplete day
        remains marked “Checked In” until a checkout is recorded. Use the
        trusted fingerprint terminal or web check-in/check-out buttons above.
      </p>
    </section>
  )
}
