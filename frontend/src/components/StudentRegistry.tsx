import { useEffect, useMemo, useState } from 'react'
import { getStudent, getStudentGuardians, getStudents, type Student, type StudentGuardian } from '../api/students'
import { formatPersonName } from '../utils/personName'
import LoadingSpinner from './LoadingSpinner'

function valueOrDash(value?: string | null) {
  return value?.trim() || '—'
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return <div className="student-registry-detail-field"><span>{label}</span><strong>{valueOrDash(value)}</strong></div>
}

export function StudentRegistry() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [guardians, setGuardians] = useState<StudentGuardian[]>([])
  const [guardianError, setGuardianError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  async function loadStudents() {
    setLoading(true)
    setError('')
    try {
      const registry = await getStudents()
      // The Registry is an active-school register; archived learners remain in Archives.
      setStudents(registry.filter(student => !student.isArchived))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the student registry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadStudents() }, [])

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return students
    return students.filter(student => [
      student.studentNumber,
      student.firstName,
      student.otherNames,
      student.lastName,
      student.phoneNumber,
      student.email,
      student.status,
    ].some(value => value?.toLocaleLowerCase().includes(query)))
  }, [students, search])

  async function openStudent(student: Student) {
    setSelectedStudent(student)
    setGuardians([])
    setGuardianError('')
    setDetailError('')
    setDetailLoading(true)
    try {
      const fullRecord = await getStudent(student.id)
      setSelectedStudent(fullRecord)
      try { setGuardians(await getStudentGuardians(student.id)) }
      catch (cause) { setGuardianError(cause instanceof Error ? cause.message : 'Unable to load parent or guardian contacts.') }
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : 'Unable to load this student record.')
    } finally {
      setDetailLoading(false)
    }
  }

  const fullName = selectedStudent
    ? formatPersonName(selectedStudent.lastName, selectedStudent.firstName, selectedStudent.otherNames)
    : ''

  return (
    <section className="student-registry-workspace" aria-label="Student registry">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Student Management</p>
          <h2>Student Registry</h2>
          <p>Current students enrolled at the institution. Archived students are available under Archives.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void loadStudents()} disabled={loading}>Refresh registry</button>
      </header>

      <div className="student-registry-summary">
        <div><span>Current students</span><strong>{students.length.toLocaleString('en-UG')}</strong></div>
        <div><span>Matching records</span><strong>{visibleStudents.length.toLocaleString('en-UG')}</strong></div>
      </div>

      <div className="student-registry-toolbar">
        <label>
          <span className="sr-only">Search student registry</span>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by student number, name, phone or email…" />
        </label>
        <span>{visibleStudents.length.toLocaleString('en-UG')} student(s)</span>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {loading ? <LoadingSpinner label="Loading student registry…" /> : visibleStudents.length === 0 ? (
        <p className="empty">{students.length === 0 ? 'There are no current students in the registry.' : 'No students match your search.'}</p>
      ) : (
        <div className="table-wrap student-registry-table-wrap">
          <table className="student-registry-table">
            <thead><tr><th>Student number</th><th>Student name</th><th>Gender</th><th>Phone</th><th>Email</th><th>Status</th><th>View</th></tr></thead>
            <tbody>
              {visibleStudents.map(student => (
                <tr key={student.id} className="student-registry-row" tabIndex={0}
                  onClick={() => void openStudent(student)}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void openStudent(student) } }}>
                  <td>{student.studentNumber}</td>
                  <td><strong>{formatPersonName(student.lastName, student.firstName, student.otherNames)}</strong></td>
                  <td>{valueOrDash(student.gender)}</td>
                  <td>{valueOrDash(student.phoneNumber)}</td>
                  <td>{valueOrDash(student.email)}</td>
                  <td><span className="student-registry-status">{student.status || 'Active'}</span></td>
                  <td><button type="button" className="secondary-button" onClick={event => { event.stopPropagation(); void openStudent(student) }}>View details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <div className="modal-backdrop student-registry-modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <section className="auth-card student-registry-detail-modal" role="dialog" aria-modal="true" aria-labelledby="student-registry-detail-title" onClick={event => event.stopPropagation()}>
            <header className="student-registry-detail-header">
              <div><p className="eyebrow">Student profile</p><h2 id="student-registry-detail-title">{fullName || 'Student details'}</h2><span>{selectedStudent.studentNumber}</span></div>
              <button type="button" className="secondary-button" onClick={() => setSelectedStudent(null)}>Close</button>
            </header>
            {detailError && <div className="error" role="alert">{detailError}</div>}
            {detailLoading ? <LoadingSpinner label="Loading student details…" /> : (
              <>
                <section className="student-registry-detail-section">
                  <h3>Personal information</h3>
                  <div className="student-registry-detail-grid">
                    <DetailField label="Student number" value={selectedStudent.studentNumber} />
                    <DetailField label="First name" value={selectedStudent.firstName} />
                    <DetailField label="Other names" value={selectedStudent.otherNames} />
                    <DetailField label="Last name" value={selectedStudent.lastName} />
                    <DetailField label="Date of birth" value={selectedStudent.dateOfBirth} />
                    <DetailField label="Gender" value={selectedStudent.gender} />
                    <DetailField label="National ID" value={selectedStudent.nationalId} />
                  </div>
                </section>
                <section className="student-registry-detail-section">
                  <h3>Contact and school information</h3>
                  <div className="student-registry-detail-grid">
                    <DetailField label="Phone" value={selectedStudent.phoneNumber} />
                    <DetailField label="Email" value={selectedStudent.email} />
                    <DetailField label="Student status" value={selectedStudent.status} />
                    <DetailField label="Admission reference" value={selectedStudent.admissionId} />
                    <DetailField label="Campus" value={selectedStudent.campusId} />
                    <DetailField label="Date registered" value={selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : null} />
                  </div>
                </section>
                <section className="student-registry-detail-section">
                  <h3>Parent / guardian contacts</h3>
                  {guardianError && <div className="error" role="alert">{guardianError}</div>}
                  {!guardianError && guardians.length === 0 ? <p className="empty">No parent or guardian contacts are recorded.</p> : guardians.length > 0 ? (
                    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Email</th><th>Primary</th></tr></thead>
                      <tbody>{guardians.map(guardian => <tr key={guardian.id}><td>{guardian.fullName}</td><td>{valueOrDash(guardian.relationship)}</td><td>{valueOrDash(guardian.phoneNumber)}</td><td>{valueOrDash(guardian.email)}</td><td>{guardian.isPrimary ? 'Yes' : 'No'}</td></tr>)}</tbody>
                    </table></div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      )}

      <style>{`
        .student-registry-workspace { display: grid; gap: 16px; }
        .student-registry-workspace .workspace-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
        .student-registry-workspace .workspace-header p:not(.eyebrow) { margin:6px 0 0; color:var(--text-muted,#64748b); }
        .student-registry-summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:10px; }
        .student-registry-summary > div { border:1px solid var(--border-color,#dbe2ea); padding:12px 14px; display:grid; gap:5px; background:var(--surface,#fff); }
        .student-registry-summary span,.student-registry-detail-field span { color:var(--text-muted,#64748b); font-size:12px; }
        .student-registry-summary strong { font-size:22px; }
        .student-registry-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .student-registry-toolbar label { flex:1; max-width:560px; }
        .student-registry-toolbar input { width:100%; min-height:40px; }
        .student-registry-table-wrap { overflow:auto; }
        .student-registry-table { width:100%; min-width:850px; border-collapse:collapse; }
        .student-registry-row { cursor:pointer; }
        .student-registry-row:hover { background:var(--surface-hover,#f1f5f9); }
        .student-registry-row:focus-visible { outline:2px solid var(--primary-color,#2563eb); outline-offset:-2px; }
        .student-registry-status { display:inline-block; padding:3px 8px; border:1px solid var(--border-color,#cbd5e1); font-size:12px; }
        .student-registry-modal-backdrop { z-index:120; }
        .student-registry-detail-modal { width:min(980px,96vw); max-height:92vh; overflow:auto; padding:22px; }
        .student-registry-detail-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; border-bottom:1px solid var(--border-color,#dbe2ea); padding-bottom:14px; }
        .student-registry-detail-header h2 { margin:3px 0; }
        .student-registry-detail-section { margin-top:18px; }
        .student-registry-detail-section h3 { margin:0 0 10px; font-size:15px; }
        .student-registry-detail-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:1px; background:var(--border-color,#dbe2ea); border:1px solid var(--border-color,#dbe2ea); }
        .student-registry-detail-field { background:var(--surface,#fff); padding:10px 12px; display:grid; gap:5px; min-width:0; overflow-wrap:anywhere; }
        .student-registry-detail-field strong { font-size:13px; font-weight:600; }
        @media(max-width:640px) { .student-registry-workspace .workspace-header,.student-registry-toolbar { flex-direction:column; align-items:stretch; } .student-registry-detail-modal { padding:14px; } }
      `}</style>
    </section>
  )
}
