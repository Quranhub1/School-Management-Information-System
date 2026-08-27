import { useEffect, useState, type FormEvent } from 'react'
import { listApplicants, submitApplicant, updateAdmissionStatus, getAdmissionRequirements, createAdmissionRequirement, deleteAdmissionRequirement, type Applicant, type AdmissionRequirement } from '../api/admissions'

type MainTab = 'applications' | 'requirements' | 'fees' | 'interviews' | 'decisions' | 'quotas' | 'letters' | 'bulk' | 'stats'

const statuses = ['Submitted', 'UnderReview', 'Accepted', 'Rejected', 'Withdrawn']
const paymentMethods = ['Cash', 'Bank', 'Mobile Money', 'Card', 'Other']
const interviewOutcomes = ['Pass', 'Fail', 'Pending', 'Absent']

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

  const [appFees, setAppFees] = useState<Array<{ id: string; applicantId: string; applicantName: string; amount: number; receiptNumber: string; paymentMethod: string; paidAt: string; notes: string }>>([])
  const [appFeeForm, setAppFeeForm] = useState({ applicantId: '', amount: '', receiptNumber: '', paymentMethod: 'Cash', paidAt: '', notes: '' })

  const [interviews, setInterviews] = useState<Array<{ id: string; applicantId: string; applicantName: string; programmeId: string; interviewDate: string; interviewTime: string; panelMembers: string; outcome: string; notes: string }>>([])
  const [interviewForm, setInterviewForm] = useState({ applicantId: '', programmeId: '', interviewDate: '', interviewTime: '', panelMembers: '', outcome: 'Pending', notes: '' })

  const [decisions, setDecisions] = useState<Array<{ id: string; applicantId: string; applicantName: string; decision: string; reason: string; decidedBy: string; decidedAt: string; conditions: string }>>([])
  const [decisionForm, setDecisionForm] = useState({ applicantId: '', decision: 'Accepted', reason: '', decidedBy: '', conditions: '' })

  const [quotas, setQuotas] = useState<Array<{ id: string; programmeId: string; programmeName: string; capacity: number; admitted: number; pending: number; rejected: number }>>([])
  const [quotaForm, setQuotaForm] = useState({ programmeId: '', programmeName: '', capacity: '' })

  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('Accepted')

  const [letters, setLetters] = useState<Array<{ id: string; applicantId: string; applicantName: string; programme: string; conditions: string; letterDate: string }>>([])
  const [letterForm, setLetterForm] = useState({ applicantId: '', programme: '', conditions: '' })

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
  useEffect(() => { if (mainTab === 'fees') loadAppFees() }, [mainTab])
  useEffect(() => { if (mainTab === 'interviews') loadInterviews() }, [mainTab])
  useEffect(() => { if (mainTab === 'decisions') loadDecisions() }, [mainTab])
  useEffect(() => { if (mainTab === 'quotas') loadQuotas() }, [mainTab])
  useEffect(() => { if (mainTab === 'letters') loadLetters() }, [mainTab])
  useEffect(() => { if (mainTab === 'bulk') loadBulk() }, [mainTab])
  useEffect(() => { if (mainTab === 'stats') loadStats() }, [mainTab])

  async function submit(e: FormEvent) { e.preventDefault(); setError(''); try { await submitApplicant(form); setForm({ firstName:'',lastName:'',otherNames:'',dateOfBirth:'',gender:'',nationalId:'',phoneNumber:'',email:'' }); await refreshApplications() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit application.') } }
  async function changeStatus(id: string, status: string) { try { await updateAdmissionStatus(id, status); await refreshApplications() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update status.') } }

  async function submitRequirement(e: FormEvent) { e.preventDefault(); setError(''); try { await createAdmissionRequirement(reqForm); setReqForm({ programmeId: '', requirementType: 'Academic', description: '', isMandatory: true, displayOrder: 1 }); await refreshRequirements() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create requirement.') } }
  async function removeRequirement(id: string) { try { await deleteAdmissionRequirement(id); await refreshRequirements() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete requirement.') } }

  function loadAppFees() { setAppFees([]) }
  function loadInterviews() { setInterviews([]) }
  function loadDecisions() { setDecisions([]) }
  function loadQuotas() { setQuotas([]) }
  function loadLetters() { setLetters([]) }
  function loadBulk() {}
  function loadStats() {}

  async function submitAppFee(e: FormEvent) { e.preventDefault(); setError(''); const fee = { id: Date.now().toString(), applicantId: appFeeForm.applicantId, applicantName: '', amount: Number(appFeeForm.amount), receiptNumber: appFeeForm.receiptNumber, paymentMethod: appFeeForm.paymentMethod, paidAt: appFeeForm.paidAt || new Date().toISOString().split('T')[0], notes: appFeeForm.notes }; setAppFees([...appFees, fee]); setAppFeeForm({ applicantId: '', amount: '', receiptNumber: '', paymentMethod: 'Cash', paidAt: '', notes: '' }) }
  async function submitInterview(e: FormEvent) { e.preventDefault(); setError(''); const interview = { id: Date.now().toString(), applicantId: interviewForm.applicantId, applicantName: '', programmeId: interviewForm.programmeId, interviewDate: interviewForm.interviewDate, interviewTime: interviewForm.interviewTime, panelMembers: interviewForm.panelMembers, outcome: interviewForm.outcome, notes: interviewForm.notes }; setInterviews([...interviews, interview]); setInterviewForm({ applicantId: '', programmeId: '', interviewDate: '', interviewTime: '', panelMembers: '', outcome: 'Pending', notes: '' }) }
  async function submitDecision(e: FormEvent) { e.preventDefault(); setError(''); const decision = { id: Date.now().toString(), applicantId: decisionForm.applicantId, applicantName: '', decision: decisionForm.decision, reason: decisionForm.reason, decidedBy: decisionForm.decidedBy, decidedAt: new Date().toISOString().split('T')[0], conditions: decisionForm.conditions }; setDecisions([...decisions, decision]); setDecisionForm({ applicantId: '', decision: 'Accepted', reason: '', decidedBy: '', conditions: '' }) }
  async function submitQuota(e: FormEvent) { e.preventDefault(); setError(''); const quota = { id: Date.now().toString(), programmeId: quotaForm.programmeId, programmeName: quotaForm.programmeName, capacity: Number(quotaForm.capacity), admitted: 0, pending: 0, rejected: 0 }; setQuotas([...quotas, quota]); setQuotaForm({ programmeId: '', programmeName: '', capacity: '' }) }
  async function submitLetter(e: FormEvent) { e.preventDefault(); setError(''); const letter = { id: Date.now().toString(), applicantId: letterForm.applicantId, applicantName: '', programme: letterForm.programme, conditions: letterForm.conditions, letterDate: new Date().toISOString().split('T')[0] }; setLetters([...letters, letter]); setLetterForm({ applicantId: '', programme: '', conditions: '' }) }
  async function bulkApplyStatus() { setError(''); for (const id of selectedApplicants) { await changeStatus(id, bulkAction) } setSelectedApplicants(new Set()) }

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
        <button role="tab" aria-selected={mainTab === 'fees'} className={mainTab === 'fees' ? 'active' : ''} onClick={() => setMainTab('fees')}>Application Fees</button>
        <button role="tab" aria-selected={mainTab === 'interviews'} className={mainTab === 'interviews' ? 'active' : ''} onClick={() => setMainTab('interviews')}>Interviews</button>
        <button role="tab" aria-selected={mainTab === 'decisions'} className={mainTab === 'decisions' ? 'active' : ''} onClick={() => setMainTab('decisions')}>Decisions</button>
        <button role="tab" aria-selected={mainTab === 'quotas'} className={mainTab === 'quotas' ? 'active' : ''} onClick={() => setMainTab('quotas')}>Quotas</button>
        <button role="tab" aria-selected={mainTab === 'letters'} className={mainTab === 'letters' ? 'active' : ''} onClick={() => setMainTab('letters')}>Admission Letters</button>
        <button role="tab" aria-selected={mainTab === 'bulk'} className={mainTab === 'bulk' ? 'active' : ''} onClick={() => setMainTab('bulk')}>Bulk Actions</button>
        <button role="tab" aria-selected={mainTab === 'stats'} className={mainTab === 'stats' ? 'active' : ''} onClick={() => setMainTab('stats')}>Statistics</button>
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

      {mainTab === 'fees' && (
        <>
          <form className="form-grid" onSubmit={submitAppFee} style={{ marginBottom: 22 }}>
            <h3>Record Application Fee Payment</h3>
            <select value={appFeeForm.applicantId} onChange={e => setAppFeeForm({ ...appFeeForm, applicantId: e.target.value })} required>
              <option value="">Select Applicant</option>
              {applicants.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.applicationNumber})</option>)}
            </select>
            <input type="number" placeholder="Amount (UGX)" value={appFeeForm.amount} onChange={e => setAppFeeForm({ ...appFeeForm, amount: e.target.value })} required />
            <input placeholder="Receipt Number" value={appFeeForm.receiptNumber} onChange={e => setAppFeeForm({ ...appFeeForm, receiptNumber: e.target.value })} required />
            <select value={appFeeForm.paymentMethod} onChange={e => setAppFeeForm({ ...appFeeForm, paymentMethod: e.target.value })}>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="date" value={appFeeForm.paidAt} onChange={e => setAppFeeForm({ ...appFeeForm, paidAt: e.target.value })} />
            <input placeholder="Notes" value={appFeeForm.notes} onChange={e => setAppFeeForm({ ...appFeeForm, notes: e.target.value })} />
            <button type="submit">Record Fee Payment</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Amount</th>
                  <th>Receipt No.</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {appFees.length === 0 ? (
                  <tr><td colSpan={5} className="empty">No application fee payments recorded</td></tr>
                ) : (
                  appFees.map(fee => (
                    <tr key={fee.id}>
                      <td><strong>{fee.applicantName || fee.applicantId}</strong></td>
                      <td>UGX {fee.amount.toLocaleString()}</td>
                      <td>{fee.receiptNumber}</td>
                      <td>{fee.paymentMethod}</td>
                      <td>{fee.paidAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mainTab === 'interviews' && (
        <>
          <form className="form-grid" onSubmit={submitInterview} style={{ marginBottom: 22 }}>
            <h3>Schedule Interview</h3>
            <select value={interviewForm.applicantId} onChange={e => setInterviewForm({ ...interviewForm, applicantId: e.target.value })} required>
              <option value="">Select Applicant</option>
              {applicants.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.applicationNumber})</option>)}
            </select>
            <input placeholder="Programme ID" value={interviewForm.programmeId} onChange={e => setInterviewForm({ ...interviewForm, programmeId: e.target.value })} required />
            <input type="date" value={interviewForm.interviewDate} onChange={e => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })} required />
            <input type="time" value={interviewForm.interviewTime} onChange={e => setInterviewForm({ ...interviewForm, interviewTime: e.target.value })} required />
            <input placeholder="Panel Members (comma-separated)" value={interviewForm.panelMembers} onChange={e => setInterviewForm({ ...interviewForm, panelMembers: e.target.value })} required />
            <select value={interviewForm.outcome} onChange={e => setInterviewForm({ ...interviewForm, outcome: e.target.value })}>
              {interviewOutcomes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input placeholder="Notes" value={interviewForm.notes} onChange={e => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
            <button type="submit">Schedule Interview</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Programme</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Panel</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {interviews.length === 0 ? (
                  <tr><td colSpan={6} className="empty">No interviews scheduled</td></tr>
                ) : (
                  interviews.map(iv => (
                    <tr key={iv.id}>
                      <td><strong>{iv.applicantName || iv.applicantId}</strong></td>
                      <td>{iv.programmeId}</td>
                      <td>{iv.interviewDate}</td>
                      <td>{iv.interviewTime}</td>
                      <td>{iv.panelMembers}</td>
                      <td>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: iv.outcome === 'Pass' ? '#059669' : iv.outcome === 'Fail' ? '#dc2626' : '#d97706', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                          {iv.outcome}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mainTab === 'decisions' && (
        <>
          <form className="form-grid" onSubmit={submitDecision} style={{ marginBottom: 22 }}>
            <h3>Record Admission Decision</h3>
            <select value={decisionForm.applicantId} onChange={e => setDecisionForm({ ...decisionForm, applicantId: e.target.value })} required>
              <option value="">Select Applicant</option>
              {applicants.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.applicationNumber})</option>)}
            </select>
            <select value={decisionForm.decision} onChange={e => setDecisionForm({ ...decisionForm, decision: e.target.value })}>
              {['Accepted', 'Rejected', 'Waitlisted'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input placeholder="Reason" value={decisionForm.reason} onChange={e => setDecisionForm({ ...decisionForm, reason: e.target.value })} required />
            <input placeholder="Decided By" value={decisionForm.decidedBy} onChange={e => setDecisionForm({ ...decisionForm, decidedBy: e.target.value })} required />
            <input placeholder="Conditions (optional)" value={decisionForm.conditions} onChange={e => setDecisionForm({ ...decisionForm, conditions: e.target.value })} />
            <button type="submit">Record Decision</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Decision</th>
                  <th>Reason</th>
                  <th>Decided By</th>
                  <th>Date</th>
                  <th>Conditions</th>
                </tr>
              </thead>
              <tbody>
                {decisions.length === 0 ? (
                  <tr><td colSpan={6} className="empty">No decisions recorded</td></tr>
                ) : (
                  decisions.map(d => (
                    <tr key={d.id}>
                      <td><strong>{d.applicantName || d.applicantId}</strong></td>
                      <td>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: d.decision === 'Accepted' ? '#059669' : d.decision === 'Rejected' ? '#dc2626' : '#d97706', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                          {d.decision}
                        </span>
                      </td>
                      <td>{d.reason}</td>
                      <td>{d.decidedBy}</td>
                      <td>{d.decidedAt}</td>
                      <td>{d.conditions || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mainTab === 'quotas' && (
        <>
          <form className="form-grid" onSubmit={submitQuota} style={{ marginBottom: 22 }}>
            <h3>Set Programme Quota</h3>
            <input placeholder="Programme ID" value={quotaForm.programmeId} onChange={e => setQuotaForm({ ...quotaForm, programmeId: e.target.value })} required />
            <input placeholder="Programme Name" value={quotaForm.programmeName} onChange={e => setQuotaForm({ ...quotaForm, programmeName: e.target.value })} required />
            <input type="number" placeholder="Capacity" value={quotaForm.capacity} onChange={e => setQuotaForm({ ...quotaForm, capacity: e.target.value })} required />
            <button type="submit">Set Quota</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>Capacity</th>
                  <th>Admitted</th>
                  <th>Pending</th>
                  <th>Rejected</th>
                  <th>Fill Rate</th>
                </tr>
              </thead>
              <tbody>
                {quotas.length === 0 ? (
                  <tr><td colSpan={6} className="empty">No quotas set</td></tr>
                ) : (
                  quotas.map(q => (
                    <tr key={q.id}>
                      <td><strong>{q.programmeName}</strong> ({q.programmeId})</td>
                      <td>{q.capacity}</td>
                      <td>{q.admitted}</td>
                      <td>{q.pending}</td>
                      <td>{q.rejected}</td>
                      <td>{q.capacity > 0 ? Math.round((q.admitted / q.capacity) * 100) : 0}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mainTab === 'letters' && (
        <>
          <form className="form-grid" onSubmit={submitLetter} style={{ marginBottom: 22 }}>
            <h3>Generate Admission Letter</h3>
            <select value={letterForm.applicantId} onChange={e => setLetterForm({ ...letterForm, applicantId: e.target.value })} required>
              <option value="">Select Accepted Applicant</option>
              {applicants.filter(a => a.status === 'Accepted').map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.applicationNumber})</option>)}
            </select>
            <input placeholder="Programme" value={letterForm.programme} onChange={e => setLetterForm({ ...letterForm, programme: e.target.value })} required />
            <input placeholder="Conditions (optional)" value={letterForm.conditions} onChange={e => setLetterForm({ ...letterForm, conditions: e.target.value })} />
            <button type="submit">Generate Letter</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Programme</th>
                  <th>Conditions</th>
                  <th>Letter Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {letters.length === 0 ? (
                  <tr><td colSpan={5} className="empty">No admission letters generated</td></tr>
                ) : (
                  letters.map(l => (
                    <tr key={l.id}>
                      <td><strong>{l.applicantName || l.applicantId}</strong></td>
                      <td>{l.programme}</td>
                      <td>{l.conditions || 'None'}</td>
                      <td>{l.letterDate}</td>
                      <td>
                        <button className="secondary-button" onClick={() => window.print()}>Print Letter</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mainTab === 'bulk' && (
        <>
          <div className="form-grid" style={{ marginBottom: 22 }}>
            <h3>Bulk Actions</h3>
            <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" onClick={() => void bulkApplyStatus()} disabled={selectedApplicants.size === 0}>
              Apply to {selectedApplicants.size} selected
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Application</th>
                  <th>Applicant</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {applicants.length === 0 ? (
                  <tr><td colSpan={5} className="empty">No applications found</td></tr>
                ) : (
                  applicants.map(a => (
                    <tr key={a.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedApplicants.has(a.id)}
                          onChange={e => {
                            const next = new Set(selectedApplicants)
                            if (e.target.checked) {
                              next.add(a.id)
                            } else {
                              next.delete(a.id)
                            }
                            setSelectedApplicants(next)
                          }}
                        />
                      </td>
                      <td><strong>{a.applicationNumber}</strong></td>
                      <td>{a.firstName} {a.lastName}</td>
                      <td>{a.status}</td>
                      <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mainTab === 'stats' && (
        <>
          <div className="summary-grid" style={{ marginBottom: 22 }}>
            <div className="summary-card">
              <span>Total Applications</span>
              <strong>{applicants.length}</strong>
            </div>
            <div className="summary-card">
              <span>Submitted</span>
              <strong>{applicants.filter(a => a.status === 'Submitted').length}</strong>
            </div>
            <div className="summary-card">
              <span>Under Review</span>
              <strong>{applicants.filter(a => a.status === 'UnderReview').length}</strong>
            </div>
            <div className="summary-card">
              <span>Accepted</span>
              <strong style={{ color: '#059669' }}>{applicants.filter(a => a.status === 'Accepted').length}</strong>
            </div>
            <div className="summary-card">
              <span>Rejected</span>
              <strong style={{ color: '#dc2626' }}>{applicants.filter(a => a.status === 'Rejected').length}</strong>
            </div>
            <div className="summary-card">
              <span>Withdrawn</span>
              <strong>{applicants.filter(a => a.status === 'Withdrawn').length}</strong>
            </div>
          </div>

          <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
            <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
              <div>
                <span className="eyebrow">ANALYTICS</span>
                <h3>Applications by Status</h3>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {statuses.map(s => {
                    const count = applicants.filter(a => a.status === s).length
                    const pct = applicants.length > 0 ? Math.round((count / applicants.length) * 100) : 0
                    return (
                      <tr key={s}>
                        <td>{s}</td>
                        <td><strong>{count}</strong></td>
                        <td>{pct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
