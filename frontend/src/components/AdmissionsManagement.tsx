import { useEffect, useState, type FormEvent } from 'react'
import { getAdmissions, createAdmission, updateAdmission, deleteAdmission, decideAdmission, type Admission } from '../api/admissions'

const statuses = ['Pending', 'Accepted', 'Rejected']

export function AdmissionsManagement() {
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ applicantId: '', programmeId: '', academicYearId: '', intakeId: '' })

  async function refresh() {
    setLoading(true)
    try {
      setAdmissions(await getAdmissions())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load admissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await createAdmission({
        applicantId: form.applicantId,
        programmeId: form.programmeId,
        academicYearId: form.academicYearId,
        intakeId: form.intakeId
      })
      setForm({ applicantId: '', programmeId: '', academicYearId: '', intakeId: '' })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create admission.')
    }
  }

  async function changeStatus(id: string, status: string) {
    setError('')
    try {
      await decideAdmission(id, status, 'Updated via management')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update status.')
    }
  }

  async function remove(id: string) {
    setError('')
    try {
      await deleteAdmission(id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete admission.')
    }
  }

  return <section className="panel" aria-label="Admissions">
    <div className="panel-heading">
      <div><span className="eyebrow">Admissions</span><h2>Admission Management</h2></div>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    <form className="form-grid" onSubmit={submit} style={{ marginBottom: 22 }}>
      <h3>New Admission</h3>
      <input placeholder="Applicant ID" value={form.applicantId} onChange={e => setForm({ ...form, applicantId: e.target.value })} required />
      <input placeholder="Programme ID" value={form.programmeId} onChange={e => setForm({ ...form, programmeId: e.target.value })} required />
      <input placeholder="Academic Year ID" value={form.academicYearId} onChange={e => setForm({ ...form, academicYearId: e.target.value })} required />
      <input placeholder="Intake ID" value={form.intakeId} onChange={e => setForm({ ...form, intakeId: e.target.value })} required />
      <button type="submit">Create Admission</button>
    </form>
    <div className="table-wrap">
      {loading ? <p className="empty">Loading admissions…</p> : admissions.length === 0 ? <p className="empty">No admissions found.</p> : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Programme</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map(a => (
              <tr key={a.id}>
                <td>{a.id.slice(0, 8)}...</td>
                <td>{a.applicantId.slice(0, 8)}...</td>
                <td>{a.programmeId.slice(0, 8)}...</td>
                <td>{a.status}</td>
                <td>
                  <select value={a.status} onChange={e => changeStatus(a.id, e.target.value)}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  <button className="secondary-button" onClick={() => remove(a.id)} style={{ marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </section>
}
