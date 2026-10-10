import { useEffect, useState, type FormEvent } from 'react'
import {
  addStudentGuardian,
  createStudent,
  deleteStudentGuardian,
  getStudentGuardians,
  getStudentQrCode,
  getStudents,
  updateStudentGuardian,
  type CreateStudentRequest,
  type GuardianInput,
  type Student,
  type StudentGuardian,
} from '../api/students'

interface Props { canManage?: boolean; readOnly?: boolean }

const emptyForm: CreateStudentRequest = { studentNumber: '', firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', phoneNumber: '', email: '' }
const emptyGuardian: GuardianInput = { fullName: '', relationship: 'Parent', phoneNumber: '', email: '', isPrimary: false }

export function StudentManagement({ canManage = false, readOnly = false }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [form, setForm] = useState(emptyForm)
  const [guardianForm, setGuardianForm] = useState<GuardianInput>({ ...emptyGuardian, isPrimary: true })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [qrStudentId, setQrStudentId] = useState<string | null>(null)
  const [guardianStudent, setGuardianStudent] = useState<Student | null>(null)
  const [guardians, setGuardians] = useState<StudentGuardian[]>([])
  const [guardianLoading, setGuardianLoading] = useState(false)
  const [guardianSaving, setGuardianSaving] = useState(false)
  const [guardianError, setGuardianError] = useState('')
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null)

  async function load() {
    setLoading(true); setError('')
    try { setStudents(await getStudents()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load students.') } finally { setLoading(false) }
  }

  async function loadGuardians(studentId: string) {
    setGuardianLoading(true); setGuardianError('')
    try { setGuardians(await getStudentGuardians(studentId)) }
    catch (e) { setGuardianError(e instanceof Error ? e.message : 'Unable to load parent/guardian records.') }
    finally { setGuardianLoading(false) }
  }

  useEffect(() => { if (canManage || readOnly) void load() }, [canManage, readOnly])

  if (!canManage && !readOnly) return <section className="panel"><h3>Student Management</h3><p className="empty">Your role does not have student-record access.</p></section>

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    let created: Student | null = null
    try {
      created = await createStudent(form)
      try {
        await addStudentGuardian(created.id, guardianForm)
        setNotice('Student and primary parent/guardian details saved successfully.')
      } catch (guardianFailure) {
        setError(`Student ${created.studentNumber} was saved, but the parent/guardian details were not saved. Open Guardians for this student and retry. ${guardianFailure instanceof Error ? guardianFailure.message : ''}`.trim())
      }
      setStudents(current => [created!, ...current.filter(item => item.id !== created!.id)])
      setForm(emptyForm); setGuardianForm({ ...emptyGuardian, isPrimary: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to register student.')
    } finally { setSaving(false) }
  }

  async function saveGuardian(event: FormEvent) {
    event.preventDefault()
    if (!guardianStudent) return
    setGuardianSaving(true); setGuardianError('')
    try {
      if (editingGuardianId) await updateStudentGuardian(guardianStudent.id, editingGuardianId, guardianForm)
      else await addStudentGuardian(guardianStudent.id, guardianForm)
      setGuardianForm(emptyGuardian); setEditingGuardianId(null)
      await loadGuardians(guardianStudent.id)
      setNotice('Parent/guardian record saved.')
    } catch (e) { setGuardianError(e instanceof Error ? e.message : 'Unable to save parent/guardian details.') }
    finally { setGuardianSaving(false) }
  }

  function editGuardian(guardian: StudentGuardian) {
    setEditingGuardianId(guardian.id)
    setGuardianForm({ fullName: guardian.fullName, relationship: guardian.relationship ?? '', phoneNumber: guardian.phoneNumber ?? '', email: guardian.email ?? '', isPrimary: guardian.isPrimary })
    setGuardianError('')
  }

  async function removeGuardian(guardian: StudentGuardian) {
    if (!guardianStudent || !window.confirm(`Remove ${guardian.fullName} from this student's records?`)) return
    setGuardianError('')
    try { await deleteStudentGuardian(guardianStudent.id, guardian.id); await loadGuardians(guardianStudent.id) }
    catch (e) { setGuardianError(e instanceof Error ? e.message : 'Unable to remove parent/guardian record.') }
  }

  function openGuardians(student: Student) {
    setGuardianStudent(student); setGuardians([]); setGuardianForm(emptyGuardian); setEditingGuardianId(null); setGuardianError('')
    void loadGuardians(student.id)
  }

  return <section className="academic-workspace" aria-label="Student management workspace">
    <div className="panel-heading"><div><p className="eyebrow">Student Management</p><h2>{readOnly ? 'Student registry · Read-only' : 'Student registry'}</h2></div><span>{students.length} students</span></div>
    {canManage && <form className="student-form" onSubmit={submit}>
      <h3>Student bio-data</h3>
      <div className="form-grid">
        <label>Student number<input value={form.studentNumber} onChange={e => setForm({...form, studentNumber: e.target.value})} required /></label>
        <label>First name<input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></label>
        <label>Last name<input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></label>
        <label>Other names<input value={form.otherNames} onChange={e => setForm({...form, otherNames: e.target.value})} /></label>
        <label>Date of birth<input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} /></label>
        <label>Gender<select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} required><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Not Sure">Not Sure</option></select></label>
        <label>Student phone<input value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} /></label>
        <label>Student email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></label>
      </div>
      <h3>Parent / guardian details</h3>
      <p className="section-copy">These details are stored in the student's permanent record. They do not create a parent login or portal.</p>
      <div className="form-grid">
        <label>Parent / guardian full name<input value={guardianForm.fullName} onChange={e => setGuardianForm({...guardianForm, fullName: e.target.value})} required /></label>
        <label>Relationship<select value={guardianForm.relationship} onChange={e => setGuardianForm({...guardianForm, relationship: e.target.value})} required><option value="Parent">Parent</option><option value="Mother">Mother</option><option value="Father">Father</option><option value="Guardian">Guardian</option><option value="Other">Other</option></select></label>
        <label>Parent / guardian phone<input value={guardianForm.phoneNumber} onChange={e => setGuardianForm({...guardianForm, phoneNumber: e.target.value})} /></label>
        <label>Parent / guardian email<input type="email" value={guardianForm.email} onChange={e => setGuardianForm({...guardianForm, email: e.target.value})} /></label>
        <label className="checkbox-label"><input type="checkbox" checked={guardianForm.isPrimary} onChange={e => setGuardianForm({...guardianForm, isPrimary: e.target.checked})} /> Primary parent / guardian</label>
      </div>
      <button type="submit" disabled={saving}>{saving ? 'Saving student and guardian…' : 'Register student with guardian details'}</button>
    </form>}
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="info-banner" role="status">{notice}</div>}
    <div className="table-wrap"><table><thead><tr><th>Student number</th><th>Name</th><th>Gender</th><th>Phone</th><th>Email</th><th>Status</th><th>Parent / guardian</th><th>QR Code</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={8} className="empty">Loading students…</td></tr> : students.length === 0 ? <tr><td colSpan={8} className="empty">No students registered.</td></tr> : students.map(s => <tr key={s.id}><td>{s.studentNumber}</td><td>{[s.firstName, s.otherNames, s.lastName].filter(Boolean).join(' ')}</td><td>{s.gender ?? '—'}</td><td>{s.phoneNumber ?? '—'}</td><td>{s.email ?? '—'}</td><td>{s.status}</td><td><button className="secondary-button" type="button" onClick={() => openGuardians(s)}>View / manage</button></td><td><button className="secondary-button" type="button" onClick={() => setQrStudentId(s.id)}>View QR</button></td></tr>)}
    </tbody></table></div>
    {qrStudentId && <div className="modal-backdrop" onClick={() => setQrStudentId(null)}><div className="auth-card" onClick={e => e.stopPropagation()}><p className="eyebrow">Student QR Code</p><h3>{qrStudentId}</h3><img src={getStudentQrCode(qrStudentId)} alt="Student QR Code" style={{ width: '100%', height: 'auto' }} /><button className="secondary-button" style={{ marginTop: 12 }} onClick={() => setQrStudentId(null)}>Close</button></div></div>}
    {guardianStudent && <div className="modal-backdrop" onClick={() => setGuardianStudent(null)}><div className="auth-card" style={{ width: 'min(760px, 96vw)', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
      <div className="panel-heading"><div><p className="eyebrow">Student record</p><h3>Parent / guardian details</h3><p>{guardianStudent.studentNumber} · {[guardianStudent.firstName, guardianStudent.otherNames, guardianStudent.lastName].filter(Boolean).join(' ')}</p></div><button type="button" className="secondary-button" onClick={() => setGuardianStudent(null)}>Close</button></div>
      {guardianError && <div className="error" role="alert">{guardianError}</div>}
      {guardianLoading ? <p className="empty">Loading parent/guardian records…</p> : guardians.length === 0 ? <p className="empty">No parent/guardian details are recorded for this student yet.</p> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Email</th><th>Primary</th>{canManage && <th>Actions</th>}</tr></thead><tbody>{guardians.map(g => <tr key={g.id}><td>{g.fullName}</td><td>{g.relationship || '—'}</td><td>{g.phoneNumber || '—'}</td><td>{g.email || '—'}</td><td>{g.isPrimary ? 'Yes' : 'No'}</td>{canManage && <td><button className="secondary-button" type="button" onClick={() => editGuardian(g)}>Edit</button><button className="secondary-button" type="button" onClick={() => void removeGuardian(g)}>Remove</button></td>}</tr>)}</tbody></table></div>}
      {canManage && <form className="student-form" onSubmit={saveGuardian}><h4>{editingGuardianId ? 'Edit parent / guardian' : 'Add another parent / guardian'}</h4><div className="form-grid">
        <label>Full name<input value={guardianForm.fullName} onChange={e => setGuardianForm({...guardianForm, fullName: e.target.value})} required /></label>
        <label>Relationship<select value={guardianForm.relationship} onChange={e => setGuardianForm({...guardianForm, relationship: e.target.value})} required><option value="">Select relationship</option><option value="Parent">Parent</option><option value="Mother">Mother</option><option value="Father">Father</option><option value="Guardian">Guardian</option><option value="Other">Other</option></select></label>
        <label>Phone<input value={guardianForm.phoneNumber} onChange={e => setGuardianForm({...guardianForm, phoneNumber: e.target.value})} /></label>
        <label>Email<input type="email" value={guardianForm.email} onChange={e => setGuardianForm({...guardianForm, email: e.target.value})} /></label>
        <label className="checkbox-label"><input type="checkbox" checked={guardianForm.isPrimary} onChange={e => setGuardianForm({...guardianForm, isPrimary: e.target.checked})} /> Primary parent / guardian</label>
      </div><div className="form-actions"><button type="submit" disabled={guardianSaving}>{guardianSaving ? 'Saving…' : editingGuardianId ? 'Save changes' : 'Add guardian'}</button>{editingGuardianId && <button type="button" className="secondary-button" onClick={() => { setEditingGuardianId(null); setGuardianForm(emptyGuardian) }}>Cancel edit</button>}</div></form>}
    </div></div>}
  </section>
}
