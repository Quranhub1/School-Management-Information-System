import { useEffect, useState, type FormEvent } from 'react'
import { listApplicants, submitApplicant, updateAdmissionStatus, getAdmissionRequirements, createAdmissionRequirement, deleteAdmissionRequirement, type Applicant, type AdmissionRequirement } from '../api/admissions'

type MainTab = 'applications' | 'requirements'

const statuses = ['Submitted', 'UnderReview', 'Accepted', 'Rejected', 'Withdrawn']

export function AdmissionsManagement() {
  const [mainTab, setMainTab] = useState<MainTab>('applications')
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [requirements, setRequirements] = useState<AdmissionRequirement[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [form, setForm] = useState({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', nationalId: '', phoneNumber: '', email: '' })
  const [reqForm, setReqForm] = useState({ programmeId: '', requirementType: 'Academic', description: '', isMandatory: true, displayOrder: 1 })

  async function refreshApplications() {
    setLoading(true)
    setError('')
    try {
      const data = await listApplicants(statusFilter || undefined)
      setApplicants(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load applications.')
    } finally {
      setLoading(false)
    }
  }

  async function refreshRequirements() {
    setError('')
    try {
      const data = await getAdmissionRequirements(programmeFilter || undefined)
      setRequirements(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load requirements.')
    }
  }

  useEffect(() => { if (mainTab === 'applications') void refreshApplications() }, [mainTab, statusFilter])
  useEffect(() => { if (mainTab === 'requirements') void refreshRequirements() }, [mainTab, programmeFilter])

  async function submit(e: FormEvent) { e.preventDefault(); setError(''); try { await submitApplicant(form); setForm({ firstName:'',lastName:'',otherNames:'',dateOfBirth:'',gender:'',nationalId:'',phoneNumber:'',email:'' }); await refreshApplications() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit application.') } }
  async function changeStatus(id: string, status: string) { try { await updateAdmissionStatus(id, status); await refreshApplications() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update status.') } }

  async function submitRequirement(e: FormEvent) { e.preventDefault(); setError(''); try { await createAdmissionRequirement(reqForm); setReqForm({ programmeId: '', requirementType: 'Academic', description: '', isMandatory: true, displayOrder: 1 }); await refreshRequirements() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create requirement.') } }
  async function removeRequirement(id: string) { try { await deleteAdmissionRequirement(id); await refreshRequirements() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete requirement.') } }

  const filteredApplicants = programmeFilter ? applicants.filter(a => true) : applicants

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ADMISSIONS</span>
          <h2>Admissions Management</h2>
        </div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Admissions sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={mainTab === 'applications'} className={mainTab === 'applications' ? 'active' : ''} onClick={() => setMainTab('applications')}>Applications</button>
        <button role="tab" aria-selected={mainTab === 'requirements'} className={mainTab === 'requirements' ? 'active' : ''} onClick={() => setMainTab('requirements')}>Requirements</button>
      </div>

      {mainTab === 'applications' && (
        <>
          <form className="form-grid" onSubmit={submit} style={{ marginBottom: 22 }}>
            <h3>New Application</h3>
            <input placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            <input placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            <input placeholder="Other names" value={form.otherNames} onChange={e => setForm({ ...form, otherNames: e.target.value })} />
            <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            <input placeholder="Gender" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} />
            <input placeholder="National ID" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
            <input placeholder="Phone" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <button type="submit">Submit application</button>
          </form>

          <div className="form-row" style={{ marginBottom: 15 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Filter by programme ID" value={programmeFilter} onChange={e => setProgrammeFilter(e.target.value)} />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Applicant</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}>Loading…</td></tr>
                ) : applicants.length === 0 ? (
                  <tr><td colSpan={6} className="empty">No applications found</td></tr>
                ) : (
                  applicants.map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.applicationNumber}</strong></td>
                      <td>{a.firstName} {a.lastName}</td>
                      <td>{a.email ?? a.phoneNumber ?? '—'}</td>
                      <td>
                        <select value={a.status} onChange={e => void changeStatus(a.id, e.target.value)}>
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                      <td>
                        <button className="secondary-button" onClick={() => void changeStatus(a.id, a.status === 'Accepted' ? 'Rejected' : 'Accepted')}>
                          {a.status === 'Accepted' ? 'Reject' : 'Accept'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mainTab === 'requirements' && (
        <>
          <form className="form-grid" onSubmit={submitRequirement} style={{ marginBottom: 22 }}>
            <h3>Add Admission Requirement</h3>
            <input placeholder="Programme ID" value={reqForm.programmeId} onChange={e => setReqForm({ ...reqForm, programmeId: e.target.value })} required />
            <select value={reqForm.requirementType} onChange={e => setReqForm({ ...reqForm, requirementType: e.target.value })}>
              <option>Academic</option>
              <option>Medical</option>
              <option>Financial</option>
              <option>Documentation</option>
              <option>Interview</option>
              <option>Other</option>
            </select>
            <input placeholder="Description" value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} required />
            <input type="number" placeholder="Display Order" value={reqForm.displayOrder} onChange={e => setReqForm({ ...reqForm, displayOrder: Number(e.target.value) })} required />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={reqForm.isMandatory} onChange={e => setReqForm({ ...reqForm, isMandatory: e.target.checked })} />
              Mandatory
            </label>
            <button type="submit">Add Requirement</button>
          </form>

          <div className="form-row" style={{ marginBottom: 15 }}>
            <input placeholder="Filter by programme ID" value={programmeFilter} onChange={e => setProgrammeFilter(e.target.value)} />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Mandatory</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.length === 0 ? (
                  <tr><td colSpan={5} className="empty">No requirements found</td></tr>
                ) : (
                  requirements.map(req => (
                    <tr key={req.id}>
                      <td><strong>{req.programmeId}</strong></td>
                      <td>{req.requirementType}</td>
                      <td>{req.description}</td>
                      <td>{req.isMandatory ? 'Yes' : 'No'}</td>
                      <td>
                        <button className="secondary-button" onClick={() => void removeRequirement(req.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
