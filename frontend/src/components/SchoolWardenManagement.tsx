import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessToken } from '../api/auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
type Category = 'CheckIn' | 'CheckOut' | 'Inspection' | 'Maintenance' | 'Indiscipline'
import { FancyButton } from "@/components/ui/fancy-button";
type RecordStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed'
type WardenRecord = {
  id: string
  category: Category
  subject: string
  studentName?: string | null
  studentReference?: string | null
  details: string
  status: RecordStatus
  actionTaken?: string | null
  recordedAtUtc: string
  closedAtUtc?: string | null
  recordedBy: string
}
const categories: { id: Category; label: string; description: string }[] = [
  { id: 'CheckIn', label: 'Check-in', description: 'Record a resident returning to school or hostel.' },
  { id: 'CheckOut', label: 'Check-out', description: 'Record an authorized departure or exit.' },
  { id: 'Inspection', label: 'Inspections', description: 'Record routine inspections and findings.' },
  { id: 'Maintenance', label: 'Maintenance', description: 'Log repairs, hazards and maintenance follow-up.' },
  { id: 'Indiscipline', label: 'Indiscipline cases', description: 'Document incidents and follow-up actions.' },
]
const statuses: RecordStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed']
const statusLabel = (status: RecordStatus) => status === 'InProgress' ? 'In progress' : status
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed (${response.status})`)
  }
  return response.status === 204 ? undefined as T : await response.json() as T
}

export function SchoolWardenManagement() {
  const [records, setRecords] = useState<WardenRecord[]>([])
  const [category, setCategory] = useState<Category>('CheckIn')
  const [filter, setFilter] = useState<'All' | Category>('All')
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentReference, setStudentReference] = useState('')
  const [status, setStatus] = useState<RecordStatus>('Open')
  const [actionTaken, setActionTaken] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setRecords(await request<WardenRecord[]>('/api/warden/records')) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Warden records.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const visible = useMemo(() => filter === 'All' ? records : records.filter(record => record.category === filter), [records, filter])
  const openCount = records.filter(record => record.status === 'Open' || record.status === 'InProgress').length
  const maintenanceCount = records.filter(record => record.category === 'Maintenance' && record.status !== 'Resolved' && record.status !== 'Closed').length
  const incidentCount = records.filter(record => record.category === 'Indiscipline' && record.status !== 'Resolved' && record.status !== 'Closed').length

  async function createRecord(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      await request<WardenRecord>('/api/warden/records', { method: 'POST', body: JSON.stringify({ category, subject: subject.trim(), details: details.trim(), studentName: studentName.trim() || null, studentReference: studentReference.trim() || null }) })
      setSubject(''); setDetails(''); setStudentName(''); setStudentReference('')
      setMessage('Record saved to the school database.')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save the record.') }
    finally { setSaving(false) }
  }

  async function updateRecord(id: string) {
    setSaving(true); setError(''); setMessage('')
    try {
      await request<WardenRecord>(`/api/warden/records/${id}`, { method: 'PATCH', body: JSON.stringify({ status, actionTaken: actionTaken.trim() || null }) })
      setEditingId(null); setActionTaken('')
      setMessage('Record follow-up updated.')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update the record.') }
    finally { setSaving(false) }
  }

  return <section className="panel" aria-label="School Warden workspace">
    <div className="panel-heading">
      <div><span className="eyebrow">STUDENT WELFARE & RESIDENTIAL SAFETY</span><h2>School Warden</h2><p>Record resident movements, inspections, maintenance issues and indiscipline cases. All entries are saved to the school database.</p></div>
      <button type="button" className="secondary-button" onClick={() => void load()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh records'}</button>
    </div>
    <div className="summary-grid">
      <div className="summary-card"><span>Total records</span><strong>{records.length}</strong></div>
      <div className="summary-card"><span>Open follow-ups</span><strong>{openCount}</strong></div>
      <div className="summary-card"><span>Maintenance pending</span><strong>{maintenanceCount}</strong></div>
      <div className="summary-card"><span>Indiscipline cases pending</span><strong>{incidentCount}</strong></div>
    </div>

    {message && <div className="success" role="status">{message}</div>}
    {error && <div className="error" role="alert">{error}</div>}

    <div className="library-workspace-tabs" role="tablist" aria-label="Warden record categories">
      {categories.map(item => <button type="button" key={item.id} role="tab" aria-selected={category === item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}>{item.label}</button>)}
    </div>
    <p className="empty">{categories.find(item => item.id === category)?.description}</p>
    <form className="management-form" onSubmit={createRecord}>
      <label>Record subject<input value={subject} onChange={event => setSubject(event.target.value)} maxLength={200} required /></label>
      <label>Student / resident name (optional)<input value={studentName} onChange={event => setStudentName(event.target.value)} maxLength={200} /></label>
      <label>Student / resident reference (optional)<input value={studentReference} onChange={event => setStudentReference(event.target.value)} maxLength={100} /></label>
      <label>Details and observations<textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={4000} rows={3} required /></label>
      <FancyButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save '${categories.find(item => item.id === category)?.label.toLowerCase()} record'}</FancyButton>
    </form>

    <div className="section-heading" style={{ marginTop: 24 }}>
      <div><h3>Warden register & reports</h3><p>Filter saved records and track follow-up status.</p></div>
      <label>Category filter<select value={filter} onChange={event => setFilter(event.target.value as 'All' | Category)}><option value="All">All categories</option>{categories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    </div>
    {loading ? <p className="empty">Loading saved Warden records…</p> : <div className="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Subject / resident</th><th>Details</th><th>Status</th><th>Follow-up</th><th>Action</th></tr></thead><tbody>
      {visible.map(record => <tr key={record.id}>
        <td>{new Date(record.recordedAtUtc).toLocaleString()}</td>
        <td>{categories.find(item => item.id === record.category)?.label ?? record.category}</td>
        <td><strong>{record.subject}</strong><br />{record.studentName || '—'}{record.studentReference ? <><br /><small>{record.studentReference}</small></> : null}</td>
        <td>{record.details}</td>
        <td>{statusLabel(record.status)}</td>
        <td>{record.actionTaken || '—'}</td>
        <td>{editingId === record.id ? <div className="grid-form"><label>Status<select value={status} onChange={event => setStatus(event.target.value as RecordStatus)}>{statuses.map(item => <option key={item} value={item}>{statusLabel(item)}</option>)}</select></label><label>Action taken / notes<textarea rows={2} value={actionTaken} onChange={event => setActionTaken(event.target.value)} maxLength={2000} /></label><FancyButton type="button" disabled={saving} onClick={() => void updateRecord(record.id)}>Save update</FancyButton><button type="button" className="secondary-button" onClick={() => setEditingId(null)}>Cancel</button></div> : <button type="button" className="secondary-button" onClick={() => { setEditingId(record.id); setStatus(record.status); setActionTaken(record.actionTaken ?? '') }}>Update</button>}</td>
      </tr>)}
      {visible.length === 0 && <tr><td colSpan={7} className="empty">No saved records for this filter yet.</td></tr>}
    </tbody></table></div>}
  </section>
}
