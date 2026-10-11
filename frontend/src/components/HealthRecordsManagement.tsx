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

  async function loadRecentVisit() {
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

  // Handle subsection navigation from sidebar
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ module?: string; subsection?: string }>).detail
      if (detail?.module !== 'health') return
      const nextTab: Tab | undefined = detail.subsection === 'medical-records' ? 'student'
        : detail.subsection === 'clinic' ? 'clinic'
        : undefined
      if (nextTab) setTab(nextTab)
    }
    window.addEventListener('smis:navigate-subsection', handler)
    return () => window.removeEventListener('smis:navigate-subsection', handler)
  }, [])

  useEffect(() => {
    if (tab === 'student' && studentId.trim()) void loadStudentRecords()
    else if (tab === 'clinic') void loadRecentVisit()
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
    <section className="panel" aria-label="Health records" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <span className="eyebrow">CAMPUS SERVICES</span>
        </div>
        <div>
          <h2>Health / Medical Records</h2>
        </div>
      </div>

      {error && <div className="error" role="alert" style={{ margin: '16px' }}>{error}</div>}
      {success && <div className="success" role="status" style={{ margin: '16px' }}>{success}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Health records sections" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        <button role="tab" aria-selected={tab === 'student'} className={tab === 'student' ? 'active' : ''} onClick={() => setTab('student')}>Student Records</button>
        <button role="tab" aria-selected={tab === 'clinic'} className={tab === 'clinic' ? 'active' : ''} onClick={() => setTab('clinic')}>Clinic Overview</button>
      </div>

      <div className="sheet-content" style={{ flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <p className="empty" style={{ margin: '16px', textAlign: 'center' }}>Loading...</p>
        ) : tab === 'student' ? (
          <>
            <form onSubmit={e => { e.preventDefault(); void loadStudentRecords() }} className="student-form" style={{ margin: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <label>
                  Student ID
                  <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student ID" required />
                </label>
                <button type="submit" disabled={loading}>Load Records</button>
              </div>
            </form>

            {studentId.trim() && (
              <form onSubmit={handleAddRecord} className="student-form" style={{ margin: '16px', display: 'flex', padding: '22', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <div className="panel-heading" style={{ marginBottom: '15px', padding: '0 16px' }}>
                  <div>
                    <span className="eyebrow">ADD RECORD</span>
                    <h3>New Medical Record</h3>
                  </div>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
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
                <label>
                  Condition
                  <input value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Malaria, Fever" />
                </label>
                <label>
                  Treatment
                  <input value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} placeholder="Treatment given" />
                </label>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <label>
                  Medication
                  <input value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} placeholder="Medication prescribed" />
                </label>
                <label>
                  Attended By
                  <input value={form.attendedBy} onChange={e => setForm({ ...form, attendedBy: e.target.value })} placeholder="Nurse/Doctor name" />
                </label>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <label>
                  Notes
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes" />
                </label>
              </div>
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Add Record'}</button>
              </div>
              </form>
            )}

            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Condition</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Treatment</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Medication</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Attended By</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Visit Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr style={{ height: '60px' }}>
                        <td colSpan={7} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No medical records found</td
                    ) : (
                      records.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getRecordTypeColor(r.recordType), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {r.recordType}
                            </span>
                          </td
                          <td style={{ padding: '12px 16px' }}>{r.condition || '-'}</td
                          <td style={{ padding: '12px 16px' }}>{r.treatment || '-'}</td
                          <td style={{ padding: '12px 16px' }}>{r.medication || '-'}</td
                          <td style={{ padding: '12px 16px' }}>{r.attendedBy || '-'}</td
                          <td style={{ padding: '12px 16px' }}>{new Date(r.visitDate).toLocaleDateString('en-UG')}</td
                          <td style={{ padding: '12px 16px' }}>{r.notes || '-'}</td
                        </tr
                      ))}
                    ))}
                  </tbody
                </table
              </div
            </div
          )
        ) : (
          <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
            <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Student</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Condition</th
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Treatment</th
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Visit Date</th
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Attended By</th
                  </tr
                </thead
                <tbody
                  {recentVisits.length === 0 ? (
                    <tr style={{ height: '60px' }}>
                      <td colSpan={6} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No clinic visits in the last 7 days</td
                  ) : (
                    recentVisits.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <td style={{ padding: '12px 16px' }}><strong>{v.studentNumber}</strong> {v.studentName}</td
                        <td style={{ padding: '12px 16px' }}>{v.recordType}</td
                        <td style={{ padding: '12px 16px' }}>{v.condition || '-'}</td
                        <td style={{ padding: '12px 16px' }}>{v.treatment || '-'}</td
                        <td style={{ padding: '12px 16px' }}>{new Date(v.visitDate).toLocaleDateString('en-UG')}</td
                        <td style={{ padding: '12px 16px' }}>{v.attendedBy || '-'}</td
                      </tr
                    ))}
                  </tbody
                </table
              </div
            </div
          )
        )}
      </div>
    </section>
  )
}