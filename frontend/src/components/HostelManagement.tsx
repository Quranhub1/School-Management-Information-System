import { useEffect, useMemo, useState } from 'react'
import { getAccessToken } from '../api/auth'
import { notify } from './GlobalNotifications'
import { showConfirmDialog } from '../utils/confirmDialog'
import { AcademicCalendarManagement } from './AcademicCalendarManagement'
import { CurriculumManagement } from './CurriculumManagement'
import './HostelManagement.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const localDateString = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }

type Bed = { id: string; roomId: string; bedNumber: string; isActive: boolean; allocations?: Allocation[] }
type Room = { id: string; hostelId: string; roomNumber: string; capacity: number; isActive: boolean; beds: Bed[] }
type Hostel = { id: string; name: string; description?: string | null; isActive: boolean; rooms: Room[] }
type Allocation = { id: string; bedId: string; studentId: string; semesterId?: string | null; semesterName?: string | null; startDate: string; endDate?: string | null; status: string; notes?: string | null }
type RegistryStudent = { id: string; studentNumber: string; fullName: string; programmeId?: string | null; programmeName?: string | null; isAllocatedForCurrentSemester: boolean }
type CurrentSemester = { id: string; name: string; academicYearName: string; startDate: string; endDate: string }
type ProgrammeOption = { id: string; name: string }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {})
    }
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Request failed (${response.status})`)
  }
  return response.status === 204 ? undefined as T : await response.json() as T
}

export function HostelManagement({ canManage = true, canManageAcademic = false }: { canManage?: boolean; canManageAcademic?: boolean }) {
  const [tab, setTab] = useState<'houses' | 'rooms' | 'beds' | 'allocations' | 'reports' | 'setup'>('houses')
  const [setupView, setSetupView] = useState<'calendar' | 'programmes'>('calendar')
  const [hostels, setHostels] = useState<Hostel[]>([])
  const [hostelId, setHostelId] = useState('')
  const [editingHostelId, setEditingHostelId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState('')
  const [bedId, setBedId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [registryStudents, setRegistryStudents] = useState<RegistryStudent[]>([])
  const [programmeOptions, setProgrammeOptions] = useState<ProgrammeOption[]>([])
  const [currentSemester, setCurrentSemester] = useState<CurrentSemester | null>(null)
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [capacity, setCapacity] = useState(4)
  const [bedNumber, setBedNumber] = useState('')
  const [startDate, setStartDate] = useState(localDateString)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const rooms = useMemo(() => hostels.flatMap(h => h.rooms.map(r => ({ ...r, hostelName: h.name }))), [hostels])
  const beds = useMemo(() => rooms.flatMap(r => r.beds.map(b => ({ ...b, roomNumber: r.roomNumber, hostelName: r.hostelName }))), [rooms])
  const allocations = useMemo(() => beds.flatMap(b => (b.allocations ?? []).map(a => ({ ...a, bedNumber: b.bedNumber, roomNumber: b.roomNumber, hostelName: b.hostelName, student: registryStudents.find(student => student.id === a.studentId) }))), [beds, registryStudents])
  const eligibleStudents = registryStudents.filter(student => !student.isAllocatedForCurrentSemester && (!programmeFilter || student.programmeId === programmeFilter))
  const occupied = allocations.filter(a => a.status === 'Active').length

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const [hostelRows, context] = await Promise.all([
        request<Hostel[]>('/api/hostel'),
        request<{ currentSemester: CurrentSemester | null; registryStudents: RegistryStudent[]; programmes: ProgrammeOption[] }>('/api/hostel/allocation-context')
      ])
      setHostels(hostelRows)
      setCurrentSemester(context.currentSemester)
      setRegistryStudents(context.registryStudents)
      setProgrammeOptions(context.programmes ?? [])
      if (programmeFilter && !(context.programmes ?? []).some(programme => programme.id === programmeFilter)) {
        setProgrammeFilter('')
        setStudentId('')
      }
      if (context.currentSemester) {
        const today = localDateString()
        if (startDate < context.currentSemester.startDate || startDate > context.currentSemester.endDate)
          setStartDate(today < context.currentSemester.startDate ? context.currentSemester.startDate : today > context.currentSemester.endDate ? context.currentSemester.endDate : today)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load hostel data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function resetHostelForm() {
    setEditingHostelId(null)
    setName('')
    setDescription('')
  }

  function editHostel(hostel: Hostel) {
    setEditingHostelId(hostel.id)
    setName(hostel.name)
    setDescription(hostel.description ?? '')
    setError('')
    setTab('houses')
  }

  async function saveHostel(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (editingHostelId) {
        await request(`/api/hostel/hostels/${editingHostelId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null })
        })
        notify('Hostel details updated successfully.', 'success', 'Hostel updated')
      } else {
        await request('/api/hostel/hostels', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null })
        })
        notify('Hostel created successfully.', 'success', 'Hostel created')
      }
      resetHostelForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save hostel.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteHostel(hostel: Hostel) {
    const confirmed = await showConfirmDialog(
      `Delete "${hostel.name}"? The hostel will be deactivated and retained in the system for historical records. This action is blocked while any student has an active allocation in the hostel.`,
      { title: 'Delete hostel', confirmLabel: 'Delete hostel', destructive: true }
    )
    if (!confirmed) return
    setError('')
    setLoading(true)
    try {
      await request(`/api/hostel/hostels/${hostel.id}`, { method: 'DELETE' })
      if (editingHostelId === hostel.id) resetHostelForm()
      notify(`"${hostel.name}" was deleted successfully.`, 'success', 'Hostel deleted')
      await load()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to delete hostel.'
      setError(message)
      notify(message, 'error', 'Unable to delete hostel')
    } finally {
      setLoading(false)
    }
  }

  async function createRoom(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await request('/api/hostel/rooms', { method: 'POST', body: JSON.stringify({ hostelId, roomNumber: roomNumber.trim(), capacity }) })
      setRoomNumber('')
      notify('Room created successfully.', 'success', 'Room created')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create room.')
    } finally {
      setLoading(false)
    }
  }

  async function createBed(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await request('/api/hostel/beds', { method: 'POST', body: JSON.stringify({ roomId, bedNumber: bedNumber.trim() }) })
      setBedNumber('')
      notify('Bed created successfully.', 'success', 'Bed created')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create bed.')
    } finally {
      setLoading(false)
    }
  }

  async function allocate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await request('/api/hostel/allocations', { method: 'POST', body: JSON.stringify({ bedId, studentId: studentId.trim(), startDate }) })
      setStudentId('')
      notify('Student allocated successfully.', 'success', 'Student allocated')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to allocate student.')
    } finally {
      setLoading(false)
    }
  }

  async function vacate(id: string) {
    setError('')
    setLoading(true)
    try {
      await request(`/api/hostel/allocations/${id}/vacate`, { method: 'POST', body: JSON.stringify({ endDate: localDateString() }) })
      notify('Allocation closed successfully.', 'success', 'Allocation closed')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to vacate allocation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel hostel-management-panel" aria-label="Hostel management">
      <div className="panel-heading">
        <div><span className="eyebrow">HOSTEL</span><h3>Hostel Management</h3></div>
        <button type="button" onClick={() => void load()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Hostel sections">
        {([...(['houses', 'rooms', 'beds', 'allocations', 'reports'] as const), ...(canManageAcademic ? ['setup' as const] : [])]).map(item => (
          <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
            {item === 'setup' ? 'Academic Setup' : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {error && <div className="error" role="alert">{error}</div>}

      {tab === 'houses' && (
        <>
          {canManage && (
            <form className="management-form" onSubmit={saveHostel}>
              <div className="hostel-form-heading">{editingHostelId ? 'EDIT HOSTEL' : 'CREATE HOSTEL'}</div>
              <label>Hostel name<input value={name} onChange={e => setName(e.target.value)} required /></label>
              <label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={1000} placeholder="Enter hostel description or location details" /></label>
              <div className="hostel-form-actions">
                <button type="submit" disabled={loading}>{editingHostelId ? 'Save changes' : 'Create hostel'}</button>
                {editingHostelId && <button type="button" className="hostel-cancel-button" onClick={resetHostelForm} disabled={loading}>Cancel</button>}
              </div>
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Hostel</th><th>Rooms</th><th>Beds</th><th>Occupancy</th>{canManage && <th>Actions</th>}</tr></thead>
              <tbody>
                {hostels.map(h => {
                  const hb = h.rooms.flatMap(r => r.beds)
                  const ho = hb.filter(b => (b.allocations ?? []).some(a => a.status === 'Active')).length
                  return (
                    <tr key={h.id}>
                      <td><strong>{h.name}</strong>{h.description && <small className="hostel-description-cell">{h.description}</small>}</td>
                      <td>{h.rooms.length}</td><td>{hb.length}</td><td>{ho}/{hb.length}</td>
                      {canManage && <td><div className="hostel-row-actions">
                        <button type="button" className="hostel-edit-button" onClick={() => editHostel(h)} disabled={loading}>Edit</button>
                        <button type="button" className="hostel-delete-button" onClick={() => void deleteHostel(h)} disabled={loading}>Delete</button>
                      </div></td>}
                    </tr>
                  )
                })}
                {hostels.length === 0 && <tr><td colSpan={canManage ? 5 : 4} className="empty">No hostels configured.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'rooms' && (
        <>
          {canManage && <form className="management-form" onSubmit={createRoom}>
            <label>Hostel<select value={hostelId} onChange={e => setHostelId(e.target.value)} required><option value="">Select hostel</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
            <label>Room number<input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required /></label>
            <label>Capacity<input type="number" min={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))} required /></label>
            <button type="submit" disabled={loading}>Create room</button>
          </form>}
          <div className="table-wrap"><table><thead><tr><th>Hostel</th><th>Room</th><th>Capacity</th><th>Beds</th></tr></thead><tbody>
            {rooms.map(r => <tr key={r.id}><td>{r.hostelName}</td><td>{r.roomNumber}</td><td>{r.capacity}</td><td>{r.beds.length}/{r.capacity}</td></tr>)}
            {rooms.length === 0 && <tr><td colSpan={4} className="empty">No rooms configured.</td></tr>}
          </tbody></table></div>
        </>
      )}

      {tab === 'beds' && (
        <>
          {canManage && <form className="management-form" onSubmit={createBed}>
            <label>Room<select value={roomId} onChange={e => setRoomId(e.target.value)} required><option value="">Select room</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.hostelName} / {r.roomNumber} ({r.beds.length}/{r.capacity})</option>)}</select></label>
            <label>Bed number<input value={bedNumber} onChange={e => setBedNumber(e.target.value)} required /></label>
            <button type="submit" disabled={loading}>Create bed</button>
          </form>}
          <div className="table-wrap"><table><thead><tr><th>Hostel</th><th>Room</th><th>Bed</th><th>Status</th></tr></thead><tbody>
            {beds.map(b => <tr key={b.id}><td>{b.hostelName}</td><td>{b.roomNumber}</td><td>{b.bedNumber}</td><td>{(b.allocations ?? []).some(a => a.status === 'Active') ? 'Occupied' : 'Available'}</td></tr>)}
            {beds.length === 0 && <tr><td colSpan={4} className="empty">No beds configured.</td></tr>}
          </tbody></table></div>
        </>
      )}

      {tab === 'allocations' && (
        <>
          {canManage && <form className="management-form" onSubmit={allocate}>
            {currentSemester ? <div className="hostel-semester-context"><strong>{currentSemester.academicYearName} · {currentSemester.name}</strong><span>{currentSemester.startDate} to {currentSemester.endDate}</span></div> : <div className="error" role="alert">No active semester covers today. Configure the academic year and semester dates in Academic Setup before allocating beds.</div>}
            <label>Available bed<select value={bedId} onChange={e => setBedId(e.target.value)} required><option value="">Select bed</option>{beds.filter(b => !(b.allocations ?? []).some(a => a.status === 'Active' && (!currentSemester || !a.semesterId || a.semesterId === currentSemester.id))).map(b => <option key={b.id} value={b.id}>{b.hostelName} / {b.roomNumber} / {b.bedNumber}</option>)}</select></label>
            <label>Filter students by programme<select value={programmeFilter} onChange={e => { setProgrammeFilter(e.target.value); setStudentId('') }}><option value="">All programmes</option>{programmeOptions.map(programme => <option key={programme.id} value={programme.id}>{programme.name}</option>)}</select></label>
            <label>Student from registry<select value={studentId} onChange={e => setStudentId(e.target.value)} required><option value="">Select eligible student</option>{eligibleStudents.map(student => <option key={student.id} value={student.id}>{student.studentNumber} — {student.fullName}{student.programmeName ? ` · ${student.programmeName}` : ''}</option>)}</select></label>
            <label>Start date<input type="date" min={currentSemester?.startDate} max={currentSemester?.endDate} value={startDate} onChange={e => setStartDate(e.target.value)} required /></label>
            <button type="submit" disabled={loading || !currentSemester || !studentId || !bedId}>Allocate</button>
            {currentSemester && eligibleStudents.length === 0 && <p className="empty">No unallocated active students are available for this semester and programme filter.</p>}
          </form>}
          <div className="table-wrap"><table><thead><tr><th>Student</th><th>Programme</th><th>Academic period</th><th>Hostel</th><th>Room</th><th>Bed</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead><tbody>
            {allocations.map(a => <tr key={a.id}><td>{a.student ? `${a.student.studentNumber} — ${a.student.fullName}` : a.studentId}</td><td>{a.student?.programmeName ?? '—'}</td><td>{a.semesterName ?? 'Legacy allocation'}</td><td>{a.hostelName}</td><td>{a.roomNumber}</td><td>{a.bedNumber}</td><td>{a.startDate}</td><td>{a.endDate ?? '—'}</td><td>{a.status}</td><td>{a.status === 'Active' && canManage && <button type="button" onClick={() => void vacate(a.id)} disabled={loading}>Vacate</button>}</td></tr>)}
            {allocations.length === 0 && <tr><td colSpan={10} className="empty">No allocations recorded.</td></tr>}
          </tbody></table></div>
        </>
      )}

      {tab === 'setup' && canManageAcademic && <section className="hostel-academic-setup">
        <div className="library-workspace-tabs" role="tablist" aria-label="Academic setup editors">
          <button type="button" className={setupView === 'calendar' ? 'active' : ''} aria-selected={setupView === 'calendar'} onClick={() => setSetupView('calendar')}>Academic Calendar Editor</button>
          <button type="button" className={setupView === 'programmes' ? 'active' : ''} aria-selected={setupView === 'programmes'} onClick={() => setSetupView('programmes')}>School Programme Editor</button>
        </div>
        {setupView === 'calendar' ? <AcademicCalendarManagement /> : <CurriculumManagement canManage={canManageAcademic} />}
      </section>}

      {tab === 'reports' && <div className="table-wrap"><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
        <tr><td>Total hostels</td><td>{hostels.length}</td></tr><tr><td>Total rooms</td><td>{rooms.length}</td></tr><tr><td>Total beds</td><td>{beds.length}</td></tr><tr><td>Occupied beds</td><td>{occupied}</td></tr><tr><td>Available beds</td><td>{Math.max(0, beds.length - occupied)}</td></tr><tr><td>Occupancy rate</td><td>{beds.length ? `${Math.round((occupied / beds.length) * 100)}%` : '0%'}</td></tr>
      </tbody></table></div>}
    </section>
  )
}
