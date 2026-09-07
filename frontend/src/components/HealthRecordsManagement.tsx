import { useEffect, useState, type FormEvent } from 'react'
import {
  getStudentMedicalRecords,
  getRecentClinicVisits,
  addMedicalRecord,
  type MedicalRecord,
  type RecentClinicVisit,
} from '../api/healthRecords'

type Tab = 'student' | 'clinic'

export function HealthRecordsManagement() {
  const [tab, setTab] = useState<Tab>('student')
  const [studentId, setStudentId] = useState('')
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [recentVisits, setRecentVisits] = useState<RecentClinicVisit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    recordType: 'ClinicVisit',
    condition: '',
    treatment: '',
    medication: '',
    notes: '',
    attendedBy: '',
    visitDate: new Date().toISOString().split('T')[0],
  })

  async function loadStudentRecords() {
    if (!studentId.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await getStudentMedicalRecords(studentId.trim())
      setRecords(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load medical records.')
    } finally {
      setLoading(false)
    }
  }

  async function loadRecentVisits() {
    setLoading(true)
    setError('')
    try {
      const data = await getRecentClinicVisits(7)
      setRecentVisits(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load clinic visits.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'student' && studentId.trim()) void loadStudentRecords()
    else if (tab === 'clinic') void loadRecentVisits()
  }, [tab])

  async function handleAddRecord(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!studentId.trim()) return
    setLoading(true)
    try {
      await addMedicalRecord(studentId.trim(), { ...form, visitDate: form.visitDate })
      setSuccess('Medical record added successfully.')
      setForm({
        recordType: 'ClinicVisit',
        condition: '',
        treatment: '',
        medication: '',
        notes: '',
        attendedBy: '',
        visitDate: new Date().toISOString().split('T')[0],
      })
      void loadStudentRecords()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add medical record.')
    } finally {
      setLoading(false)
    }
  }

  function getRecordTypeColor(type: string): string {
    if (type === 'ClinicVisit') return '#2563eb'
    if (type === 'Emergency') return '#dc2626'
    if (type === 'FollowUp') return '#d97706'
    return '#059669'
  }

  return (
    <section className="panel" aria-label="Health records">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CAMPUS SERVICES</span>
          <h2>Health / Medical Records</h2>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Health records sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'student'} className={tab === 'student' ? 'active' : ''} onClick={() => setTab('student')}>Student Records</button>
        <button role="tab" aria-selected={tab === 'clinic'} className={tab === 'clinic' ? 'active' : ''} onClick={() => setTab('clinic')}>Clinic Overview</button>
      </div>

      {loading ? (
        <p className="empty">Loading...</p>
      ) : tab === 'student' ? (
        <>
          <form onSubmit={e => { e.preventDefault(); void loadStudentRecords() }} className="student-form" style={{ marginBottom: 22 }}>
            <div className="form-row">
              <label>
                Student ID
                <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student ID" required />
              </label>
              <button type="submit" disabled={loading}>Load Records</button>
            </div>
          </form>

          {studentId.trim() && (
            <form onSubmit={handleAddRecord} className="student-form" style={{ marginBottom: 22, padding: 22, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">ADD RECORD</span>
                  <h3>New Medical Record</h3>
                </div>
              </div>
              <div className="form-row">
                <label>
                  Record Type
                  <select value={form.recordType} onChange={e => setForm({ ...form, recordType: e.target.value })}>
                    <option value="ClinicVisit">Clinic Visit</option>
                    <option value="Emergency">Emergency</option>
                    <option value="FollowUp">Follow-up</option>
                    <option value="Vaccination">Vaccination</option>
                  </select>
                </label>
                <label>
                  Visit Date
                  <input type="date" value={form.visitDate} onChange={e => setForm({ ...form, visitDate: e.target.value })} required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Condition
                  <input value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Malaria, Fever" />
                </label>
                <label>
                  Treatment
                  <input value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} placeholder="Treatment given" />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Medication
                  <input value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} placeholder="Medication prescribed" />
                </label>
                <label>
                  Attended By
                  <input value={form.attendedBy} onChange={e => setForm({ ...form, attendedBy: e.target.value })} placeholder="Nurse/Doctor name" />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Notes
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes" />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Add Record'}</button>
              </div>
            </form>
          )}

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Condition</th>
                  <th>Treatment</th>
                  <th>Medication</th>
                  <th>Attended By</th>
                  <th>Visit Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={7} className="empty">No medical records found</td></tr>
                ) : (
                  records.map(r => (
                    <tr key={r.id}>
                      <td>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getRecordTypeColor(r.recordType), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                          {r.recordType}
                        </span>
                      </td>
                      <td>{r.condition || '-'}</td>
                      <td>{r.treatment || '-'}</td>
                      <td>{r.medication || '-'}</td>
                      <td>{r.attendedBy || '-'}</td>
                      <td>{new Date(r.visitDate).toLocaleDateString('en-UG')}</td>
                      <td>{r.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Condition</th>
                <th>Treatment</th>
                <th>Visit Date</th>
                <th>Attended By</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.length === 0 ? (
                <tr><td colSpan={6} className="empty">No clinic visits in the last 7 days</td></tr>
              ) : (
                recentVisits.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.studentNumber}</strong> {v.studentName}</td>
                    <td>
                      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getRecordTypeColor(v.recordType), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                        {v.recordType}
                      </span>
                    </td>
                    <td>{v.condition || '-'}</td>
                    <td>{v.treatment || '-'}</td>
                    <td>{new Date(v.visitDate).toLocaleDateString('en-UG')}</td>
                    <td>{v.attendedBy || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
