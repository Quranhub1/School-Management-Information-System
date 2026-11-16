import { useEffect, useState } from 'react'
import {
  createLogbookCompetency, createLogbookRequirement, createUhpabFeeReference,
  getLogbookRequirements, getStudentLogbooks, getUhpabFeeReferences, issueStudentLogbook,
  type Curriculum, type LogbookRequirement, type UhpabFeeReference,
} from '../api/curriculumManagement'

export function CurriculumLogbookManagement({ curricula }: { curricula: Curriculum[] }) {
  const [curriculumId, setCurriculumId] = useState('')
  const [requirements, setRequirements] = useState<LogbookRequirement[]>([])
  const [fees, setFees] = useState<UhpabFeeReference[]>([])
  const [studentId, setStudentId] = useState('')
  const [studentLogbooks, setStudentLogbooks] = useState<Array<{ logbook: { id: string; serialNumber: string; status: string; issuedOn: string }; requirement: { title: string } }>>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [requirementForm, setRequirementForm] = useState({ title: '', description: '', yearOfStudy: '1', semesterNumber: '1', requiredQuantity: '1', isMandatory: true })
  const [competencyForms, setCompetencyForms] = useState<Record<string, { code: string; name: string; requiredCount: string }>>({})
  const [issueForm, setIssueForm] = useState({ requirementId: '', serialNumber: '', issuedOn: new Date().toISOString().slice(0, 10), issuedBy: '' })
  const [feeForm, setFeeForm] = useState({ category: 'Logbook', programmeCode: '', programmeName: '', description: '', amount: '', currency: 'UGX', sourceCheckedOn: new Date().toISOString().slice(0, 10), effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: '' })

  async function loadRequirements(id: string) {
    if (!id) { setRequirements([]); return }
    try { setRequirements(await getLogbookRequirements(id)) } catch (e) { setError(e instanceof Error ? e.message : 'Could not load logbook requirements.') }
  }
  async function loadFees() {
    try { setFees(await getUhpabFeeReferences()) } catch (e) { setError(e instanceof Error ? e.message : 'Could not load UHPAB reference fees.') }
  }
  useEffect(() => { void loadFees() }, [])
  useEffect(() => { void loadRequirements(curriculumId) }, [curriculumId])
  useEffect(() => {
    if (curricula.length && !curricula.some(x => x.id === curriculumId)) setCurriculumId(curricula[0].id)
  }, [curricula, curriculumId])

  async function saveRequirement(event: React.FormEvent) {
    event.preventDefault()
    if (!curriculumId) return
    setSaving(true); setError(''); setNotice('')
    try {
      await createLogbookRequirement(curriculumId, { ...requirementForm, yearOfStudy: Number(requirementForm.yearOfStudy), semesterNumber: Number(requirementForm.semesterNumber), requiredQuantity: Number(requirementForm.requiredQuantity) })
      setRequirementForm({ title: '', description: '', yearOfStudy: '1', semesterNumber: '1', requiredQuantity: '1', isMandatory: true })
      await loadRequirements(curriculumId); setNotice('Logbook requirement saved.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save requirement.') } finally { setSaving(false) }
  }
  async function saveCompetency(requirementId: string) {
    const form = competencyForms[requirementId]
    if (!form?.code.trim() || !form.name.trim()) return
    setSaving(true); setError('')
    try {
      await createLogbookCompetency(requirementId, { ...form, requiredCount: Number(form.requiredCount), isMandatory: true })
      setCompetencyForms(current => ({ ...current, [requirementId]: { code: '', name: '', requiredCount: '1' } }))
      await loadRequirements(curriculumId); setNotice('Competency requirement saved.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save competency.') } finally { setSaving(false) }
  }
  async function issueLogbook(event: React.FormEvent) {
    event.preventDefault()
    if (!studentId.trim() || !issueForm.requirementId) return
    setSaving(true); setError('')
    try {
      await issueStudentLogbook(studentId.trim(), { logbookRequirementId: issueForm.requirementId, serialNumber: issueForm.serialNumber, issuedOn: issueForm.issuedOn, issuedBy: issueForm.issuedBy })
      setIssueForm(current => ({ ...current, serialNumber: '' }))
      await findStudentLogbooks(); setNotice('Logbook issuance recorded.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not issue logbook.') } finally { setSaving(false) }
  }
  async function findStudentLogbooks() {
    if (!studentId.trim()) return
    setError('')
    try { setStudentLogbooks(await getStudentLogbooks(studentId.trim(), curriculumId || undefined)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not find student logbooks.') }
  }
  async function saveFee(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      await createUhpabFeeReference({ ...feeForm, amount: Number(feeForm.amount), sourceUrl: 'https://uhpab.go.ug/assessment-fees', sourceTitle: 'UHPAB assessment fees', effectiveTo: feeForm.effectiveTo || null })
      setFeeForm(current => ({ ...current, description: '', amount: '' }))
      await loadFees(); setNotice('UHPAB reference fee saved. It has not been added to student invoices.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save fee reference.') } finally { setSaving(false) }
  }

  return <section className="catalogue-board curriculum-logbook-management" aria-label="Curriculum logbooks and UHPAB costs">
    <div className="panel-heading"><div><p className="eyebrow">Clinical practice & assessment costs</p><h3>Logbooks and UHPAB fee references</h3></div></div>
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <p className="success" role="status">{notice}</p>}
    <label>Curriculum
      <select value={curriculumId} onChange={e => setCurriculumId(e.target.value)}>
        <option value="">Select curriculum</option>
        {curricula.map(item => <option key={item.id} value={item.id}>{item.title} · v{item.version}</option>)}
      </select>
    </label>
    <form className="student-form" onSubmit={saveRequirement}>
      <h4>Curriculum logbook requirement</h4>
      <div className="form-row">
        <input required placeholder="Logbook title / type" value={requirementForm.title} onChange={e => setRequirementForm({ ...requirementForm, title: e.target.value })} />
        <input placeholder="Description" value={requirementForm.description} onChange={e => setRequirementForm({ ...requirementForm, description: e.target.value })} />
      </div>
      <div className="form-row">
        <label>Study year<input required type="number" min="1" value={requirementForm.yearOfStudy} onChange={e => setRequirementForm({ ...requirementForm, yearOfStudy: e.target.value })} /></label>
        <label>Semester<input required type="number" min="1" value={requirementForm.semesterNumber} onChange={e => setRequirementForm({ ...requirementForm, semesterNumber: e.target.value })} /></label>
        <label>Quantity required<input required type="number" min="1" value={requirementForm.requiredQuantity} onChange={e => setRequirementForm({ ...requirementForm, requiredQuantity: e.target.value })} /></label>
        <label><input type="checkbox" checked={requirementForm.isMandatory} onChange={e => setRequirementForm({ ...requirementForm, isMandatory: e.target.checked })} /> Mandatory</label>
      </div>
      <button type="submit" disabled={saving || !curriculumId}>Add logbook requirement</button>
    </form>
    <div className="table-wrap"><table><thead><tr><th>Logbook</th><th>Year / semester</th><th>Quantity</th><th>Competency requirements</th></tr></thead><tbody>
      {requirements.map(item => <tr key={item.id}><td><strong>{item.title}</strong><br />{item.description || '—'}</td><td>{item.yearOfStudy} / {item.semesterNumber}</td><td>{item.requiredQuantity}</td><td>
        <ul>{item.competencies.map(c => <li key={c.id}>{c.code} — {c.name} (×{c.requiredCount})</li>)}</ul>
        <div className="form-row">
          <input aria-label={`Competency code for ${item.title}`} placeholder="Code" value={competencyForms[item.id]?.code ?? ''} onChange={e => setCompetencyForms(current => ({ ...current, [item.id]: { code: e.target.value, name: current[item.id]?.name ?? '', requiredCount: current[item.id]?.requiredCount ?? '1' } }))} />
          <input aria-label={`Competency name for ${item.title}`} placeholder="Competency" value={competencyForms[item.id]?.name ?? ''} onChange={e => setCompetencyForms(current => ({ ...current, [item.id]: { code: current[item.id]?.code ?? '', name: e.target.value, requiredCount: current[item.id]?.requiredCount ?? '1' } }))} />
          <input aria-label="Required competency count" type="number" min="1" value={competencyForms[item.id]?.requiredCount ?? '1'} onChange={e => setCompetencyForms(current => ({ ...current, [item.id]: { code: current[item.id]?.code ?? '', name: current[item.id]?.name ?? '', requiredCount: e.target.value } }))} />
          <button type="button" disabled={saving} onClick={() => void saveCompetency(item.id)}>Add competency</button>
        </div>
      </td></tr>)}
      {requirements.length === 0 && <tr><td colSpan={4}>{curriculumId ? 'No logbook requirements configured.' : 'Select a curriculum to manage its logbooks.'}</td></tr>}
    </tbody></table></div>
    <form className="student-form" onSubmit={issueLogbook}>
      <h4>Issue a student logbook</h4>
      <div className="form-row">
        <input required placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} />
        <select required value={issueForm.requirementId} onChange={e => setIssueForm({ ...issueForm, requirementId: e.target.value })}><option value="">Select logbook type</option>{requirements.filter(x => x.isActive).map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
        <input required placeholder="Logbook serial number" value={issueForm.serialNumber} onChange={e => setIssueForm({ ...issueForm, serialNumber: e.target.value })} />
        <input required type="date" aria-label="Issue date" value={issueForm.issuedOn} onChange={e => setIssueForm({ ...issueForm, issuedOn: e.target.value })} />
        <input placeholder="Issued by" value={issueForm.issuedBy} onChange={e => setIssueForm({ ...issueForm, issuedBy: e.target.value })} />
        <button type="submit" disabled={saving || !studentId.trim() || !issueForm.requirementId}>Record issue</button>
        <button type="button" className="secondary-button" onClick={() => void findStudentLogbooks()}>Find student logbooks</button>
      </div>
    </form>
    {studentLogbooks.length > 0 && <div className="table-wrap"><table><thead><tr><th>Logbook</th><th>Serial</th><th>Issue date</th><th>Status</th></tr></thead><tbody>{studentLogbooks.map(row => <tr key={row.logbook.id}><td>{row.requirement.title}</td><td>{row.logbook.serialNumber}</td><td>{row.logbook.issuedOn}</td><td>{row.logbook.status}</td></tr>)}</tbody></table></div>}
    <form className="student-form" onSubmit={saveFee}>
      <h4>UHPAB official fee reference</h4>
      <p>Reference data only. These amounts are not KSHS tuition, student charges or invoices.</p>
      <div className="form-row">
        <select value={feeForm.category} onChange={e => setFeeForm({ ...feeForm, category: e.target.value })}><option>Logbook</option><option>Assessment</option><option>Retake</option><option>Research</option><option>Late submission</option><option>Administrative</option><option>Verification</option></select>
        <input placeholder="Programme code (optional)" value={feeForm.programmeCode} onChange={e => setFeeForm({ ...feeForm, programmeCode: e.target.value })} />
        <input placeholder="Programme name (optional)" value={feeForm.programmeName} onChange={e => setFeeForm({ ...feeForm, programmeName: e.target.value })} />
        <input required placeholder="Fee description" value={feeForm.description} onChange={e => setFeeForm({ ...feeForm, description: e.target.value })} />
        <input required type="number" min="0" step="0.01" placeholder="Amount" value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} />
        <select value={feeForm.currency} onChange={e => setFeeForm({ ...feeForm, currency: e.target.value })}><option>UGX</option><option>USD</option></select>
      </div>
      <div className="form-row">
        <label>Source checked<input required type="date" value={feeForm.sourceCheckedOn} onChange={e => setFeeForm({ ...feeForm, sourceCheckedOn: e.target.value })} /></label>
        <label>Effective from<input required type="date" value={feeForm.effectiveFrom} onChange={e => setFeeForm({ ...feeForm, effectiveFrom: e.target.value })} /></label>
        <label>Effective to<input type="date" value={feeForm.effectiveTo} onChange={e => setFeeForm({ ...feeForm, effectiveTo: e.target.value })} /></label>
        <button type="submit" disabled={saving}>Save fee reference</button>
      </div>
    </form>
    <div className="table-wrap"><table><thead><tr><th>Category</th><th>Programme</th><th>Description</th><th>Amount</th><th>Source checked</th><th>Effective</th></tr></thead><tbody>
      {fees.map(fee => <tr key={fee.id}><td>{fee.category}</td><td>{fee.programmeCode || 'All / unspecified'}</td><td>{fee.description}</td><td>{fee.currency} {fee.amount.toLocaleString()}</td><td>{fee.sourceCheckedOn}</td><td>{fee.effectiveFrom}{fee.effectiveTo ? ` – ${fee.effectiveTo}` : ' onward'}</td></tr>)}
      {fees.length === 0 && <tr><td colSpan={6}>No UHPAB fee references recorded.</td></tr>}
    </tbody></table></div>
    <p><a href="https://uhpab.go.ug/assessment-fees" target="_blank" rel="noreferrer">Verify current UHPAB assessment fee schedule</a></p>
  </section>
}
