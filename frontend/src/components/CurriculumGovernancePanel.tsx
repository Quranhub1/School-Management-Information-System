import { useEffect, useState, type FormEvent } from 'react'
import {
  approveCurriculum,
  cloneCurriculum,
  compareCurricula,
  getCurriculumApprovalHistory,
  rejectCurriculum,
  retireCurriculum,
  submitCurriculumForReview,
  type Curriculum,
  type CurriculumApprovalHistory,
  type CurriculumComparison,
} from '../api/curriculumManagement'

export function CurriculumGovernancePanel({ curricula, onChanged }: { curricula: Curriculum[]; onChanged?: () => void }) {
  const [curriculumId, setCurriculumId] = useState('')
  const [history, setHistory] = useState<CurriculumApprovalHistory[]>([])
  const [otherId, setOtherId] = useState('')
  const [comparison, setComparison] = useState<CurriculumComparison | null>(null)
  const [notes, setNotes] = useState('')
  const [cloneForm, setCloneForm] = useState({ version: '', title: '', effectiveFrom: '', effectiveTo: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const selected = curricula.find(item => item.id === curriculumId)
  const comparable = curricula.filter(item => item.id !== curriculumId)

  async function refreshHistory(id = curriculumId) {
    if (!id) { setHistory([]); return }
    setHistory(await getCurriculumApprovalHistory(id))
  }

  useEffect(() => {
    if (!curriculumId && curricula.length) setCurriculumId(curricula[0].id)
  }, [curricula, curriculumId])

  useEffect(() => {
    let cancelled = false
    if (!curriculumId) { setHistory([]); return }
    void getCurriculumApprovalHistory(curriculumId).then(rows => {
      if (!cancelled) setHistory(rows)
    }).catch(reason => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load approval history.')
    })
    return () => { cancelled = true }
  }, [curriculumId])

  async function runAction(action: () => Promise<void>, success: string) {
    setBusy(true); setError(''); setMessage('')
    try {
      await action()
      await refreshHistory()
      setMessage(success)
      onChanged?.()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The curriculum action failed.')
    } finally { setBusy(false) }
  }

  async function handleClone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setBusy(true); setError(''); setMessage('')
    try {
      const created = await cloneCurriculum(selected.id, {
        version: cloneForm.version,
        title: cloneForm.title,
        effectiveFrom: cloneForm.effectiveFrom,
        effectiveTo: cloneForm.effectiveTo || null,
      })
      setCurriculumId(created.id)
      setCloneForm({ version: '', title: '', effectiveFrom: '', effectiveTo: '' })
      setMessage(`Created draft curriculum version ${created.version} with the source course-unit placements copied.`)
      onChanged?.()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to clone this curriculum.')
    } finally { setBusy(false) }
  }

  async function handleCompare() {
    if (!selected || !otherId) return
    setBusy(true); setError(''); setComparison(null)
    try { setComparison(await compareCurricula(selected.id, otherId)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to compare these versions.') }
    finally { setBusy(false) }
  }

  return (
    <section className="catalogue-board curriculum-governance" aria-label="Curriculum governance and version history">
      <div className="panel-heading"><h3>Curriculum governance &amp; version control</h3></div>
      <div className="form-row">
        <label>Curriculum version
          <select value={curriculumId} onChange={event => { setCurriculumId(event.target.value); setComparison(null); setError(''); setMessage('') }}>
            <option value="">Select curriculum</option>
            {curricula.map(item => <option key={item.id} value={item.id}>{item.title} · v{item.version} · {item.status}</option>)}
          </select>
        </label>
        {selected && <p><strong>Status:</strong> {selected.status} <span>·</span> <strong>Effective:</strong> {selected.effectiveFrom}{selected.effectiveTo ? ` to ${selected.effectiveTo}` : ' onward'}</p>}
      </div>
      {selected && (
        <>
          <div className="form-row curriculum-governance-actions">
            {selected.status === 'Draft' && <button type="button" disabled={busy} onClick={() => void runAction(() => submitCurriculumForReview(selected.id, notes), 'Curriculum submitted for review.')}>Submit for review</button>}
            {selected.status === 'UnderReview' && <>
              <button type="button" disabled={busy} onClick={() => void runAction(() => approveCurriculum(selected.id, notes), 'Curriculum approved.')}>Approve</button>
              <button type="button" className="danger-button" disabled={busy || !notes.trim()} onClick={() => void runAction(() => rejectCurriculum(selected.id, notes), 'Curriculum returned to draft.')}>Return to draft</button>
            </>}
            {selected.status === 'Approved' && <button type="button" className="danger-button" disabled={busy || !notes.trim()} onClick={() => void runAction(() => retireCurriculum(selected.id, notes), 'Curriculum retired.')}>Retire curriculum</button>}
          </div>
          <label>Review note / action reason
            <textarea rows={2} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Add review notes or explain a rejection / retirement" />
          </label>
          <form className="student-form" onSubmit={handleClone}>
            <h4>Create a new version from this curriculum</h4>
            <div className="form-row">
              <input required placeholder="New version (e.g. 2.0)" value={cloneForm.version} onChange={event => setCloneForm({ ...cloneForm, version: event.target.value })} />
              <input required placeholder="New curriculum title" value={cloneForm.title} onChange={event => setCloneForm({ ...cloneForm, title: event.target.value })} />
            </div>
            <div className="form-row">
              <label>Effective from<input required type="date" value={cloneForm.effectiveFrom} onChange={event => setCloneForm({ ...cloneForm, effectiveFrom: event.target.value })} /></label>
              <label>Effective to (optional)<input type="date" value={cloneForm.effectiveTo} onChange={event => setCloneForm({ ...cloneForm, effectiveTo: event.target.value })} /></label>
              <button type="submit" disabled={busy}>Clone as draft version</button>
            </div>
          </form>
          <div className="curriculum-version-comparison">
            <h4>Compare curriculum versions</h4>
            <div className="form-row">
              <select value={otherId} onChange={event => { setOtherId(event.target.value); setComparison(null) }}>
                <option value="">Select another version of this programme</option>
                {comparable.map(item => <option key={item.id} value={item.id}>{item.title} · v{item.version}</option>)}
              </select>
              <button type="button" disabled={busy || !otherId} onClick={() => void handleCompare()}>Compare versions</button>
            </div>
            {comparison && <>
              <p><strong>{comparison.programmeCode}</strong> — {comparison.programmeName}</p>
              <div className="table-wrap"><table>
                <thead><tr><th>Difference</th><th>Course unit</th><th>Credits</th><th>Placement</th><th>Core / elective</th></tr></thead>
                <tbody>
                  {comparison.firstOnly.map(item => <tr key={`a-${item.id}`}><td>Only in first version</td><td>{item.code} — {item.name}</td><td>{item.creditUnits}</td><td>Year {item.yearOfStudy}, semester {item.semesterNumber}</td><td>{item.isCore ? 'Core' : 'Elective'}</td></tr>)}
                  {comparison.secondOnly.map(item => <tr key={`b-${item.id}`}><td>Only in second version</td><td>{item.code} — {item.name}</td><td>{item.creditUnits}</td><td>Year {item.yearOfStudy}, semester {item.semesterNumber}</td><td>{item.isCore ? 'Core' : 'Elective'}</td></tr>)}
                  {comparison.changedPlacement.map(item => <tr key={`c-${item.id}`}><td>Placement changed</td><td>{item.code} — {item.name}</td><td>{item.creditUnits}</td><td>Year {item.yearOfStudy}, semester {item.semesterNumber}</td><td>{item.isCore ? 'Core' : 'Elective'}</td></tr>)}
                  {!comparison.firstOnly.length && !comparison.secondOnly.length && !comparison.changedPlacement.length && <tr><td colSpan={5}>No course-unit or placement differences found.</td></tr>}
                </tbody>
              </table></div>
            </>}
          </div>
          <div className="curriculum-approval-history">
            <h4>Approval history</h4>
            <div className="table-wrap"><table>
              <thead><tr><th>Date</th><th>From</th><th>To</th><th>Action by</th><th>Notes</th></tr></thead>
              <tbody>
                {history.map(item => <tr key={item.id}><td>{new Date(item.changedAtUtc).toLocaleString()}</td><td>{item.fromStatus || 'Created'}</td><td>{item.toStatus}</td><td>{item.actor}</td><td>{item.notes || '—'}</td></tr>)}
                {!history.length && <tr><td colSpan={5}>No approval actions recorded yet.</td></tr>}
              </tbody>
            </table></div>
          </div>
        </>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
    </section>
  )
}
