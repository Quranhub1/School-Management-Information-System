import { useEffect, useState } from 'react'
import { createStudent, getStudentQrCode, getStudents, type CreateStudentRequest, type Student } from '../api/students'

interface Props { canManage: boolean }

const emptyForm: CreateStudentRequest = { studentNumber: '', firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', phoneNumber: '', email: '' }

export function StudentManagement({ canManage }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [qrStudentId, setQrStudentId] = useState<string | null>(null)

  async function load() {
    setLoading(true); setError('')
    try { setStudents(await getStudents()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load students.') } finally { setLoading(false) }
  }

  useEffect(() => { if (canManage) void load() }, [canManage])

  if (!canManage) return <section className="panel"><h3>Student Management</h3><p className="empty">Your role does not have student-management access.</p></section>

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try { const student = await createStudent(form); setStudents((current) => [student, ...current]); setForm(emptyForm) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to register student.') }
    finally { setSaving(false) }
  }

  return <section className="academic-workspace" aria-label="Student management workspace">
    <div className="panel-heading"><div><p className="eyebrow">Student Management</p><h2>Student registry</h2></div><span>{students.length} students</span></div>
    <form className="student-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Student number<input value={form.studentNumber} onChange={e => setForm({...form, studentNumber: e.target.value})} required /></label>
        <label>First name<input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></label>
        <label>Last name<input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></label>
        <label>Other names<input value={form.otherNames} onChange={e => setForm({...form, otherNames: e.target.value})} /></label>
        <label>Date of birth<input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} /></label>
        <label>Gender<input value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} /></label>
        <label>Phone<input value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} /></label>
        <label>Email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></label>
      </div>
      <button type="submit" disabled={saving}>{saving ? 'Registering…' : 'Register student'}</button>
    </form>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="table-wrap"><table><thead><tr><th>Student number</th><th>Name</th><th>Gender</th><th>Phone</th><th>Email</th><th>Status</th><th>QR Code</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={7} className="empty">Loading students…</td></tr> : students.length === 0 ? <tr><td colSpan={7} className="empty">No students registered.</td></tr> : students.map(s => <tr key={s.id}><td>{s.studentNumber}</td><td>{[s.firstName, s.otherNames, s.lastName].filter(Boolean).join(' ')}</td><td>{s.gender ?? '—'}</td><td>{s.phoneNumber ?? '—'}</td><td>{s.email ?? '—'}</td><td>{s.status}</td><td><button className="secondary-button" onClick={() => setQrStudentId(s.id)}>View QR</button></td></tr>)}
    </tbody></table></div>
    {qrStudentId && (
      <div className="modal-backdrop" onClick={() => setQrStudentId(null)}>
        <div className="auth-card" onClick={e => e.stopPropagation()}>
          <p className="eyebrow">Student QR Code</p>
          <h3>{qrStudentId}</h3>
          <img src={getStudentQrCode(qrStudentId)} alt="Student QR Code" style={{ width: '100%', height: 'auto' }} />
          <button className="secondary-button" style={{ marginTop: 12 }} onClick={() => setQrStudentId(null)}>Close</button>
        </div>
      </div>
    )}
  </section>
}
