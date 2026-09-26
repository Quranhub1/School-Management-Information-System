import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  FileSignature,
  Megaphone,
  Send,
  ShieldCheck,
  UserCheck,
  UsersRound,
  Vote,
  XCircle,
} from 'lucide-react'

type ElectionView = 'ballot' | 'vetting' | 'results'

type Candidate = {
  id: string
  name: string
  programme: string
  year: string
  manifesto: string
}

type Nominee = {
  id: string
  name: string
  role: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'More information'
  nominatedBy: string
  notes: string
}

const candidates: Candidate[] = [
  {
    id: 'candidate-1',
    name: 'Alex Nambasa',
    programme: 'Diploma in Clinical Medicine',
    year: 'Year 2',
    manifesto: 'Student welfare, transparent representation and stronger academic support for every class.',
  },
  {
    id: 'candidate-2',
    name: 'Brian Okello',
    programme: 'Diploma in Biomedical Engineering',
    year: 'Year 2',
    manifesto: 'Better communication, practical student services and accountable guild leadership.',
  },
  {
    id: 'candidate-3',
    name: 'Daniela Achieng',
    programme: 'Certificate in Health Records',
    year: 'Year 1',
    manifesto: 'Inclusive student leadership, welfare coordination and stronger student voice.',
  },
]

const initialNominees: Nominee[] = [
  { id: 'n1', name: 'Mary Apio', role: 'Vice President', status: 'Pending', nominatedBy: 'Guild President', notes: 'Awaiting commission review.' },
  { id: 'n2', name: 'David Omondi', role: 'General Secretary', status: 'Approved', nominatedBy: 'Guild President', notes: 'Eligibility documents verified.' },
  { id: 'n3', name: 'Sarah Kato', role: 'Treasurer', status: 'Pending', nominatedBy: 'Guild President', notes: 'Financial responsibility references submitted.' },
  { id: 'n4', name: 'Thomas Were', role: 'Speaker', status: 'Rejected', nominatedBy: 'Guild President', notes: 'Eligibility requirement not satisfied.' },
  { id: 'n5', name: 'Grace Nabukenya', role: 'Minister of Finance', status: 'Pending', nominatedBy: 'Guild President', notes: 'Additional supporting documentation requested.' },
]

const resultRows = [
  { ...candidates[0], votes: 214, percentage: 43.9 },
  { ...candidates[1], votes: 173, percentage: 35.5 },
  { ...candidates[2], votes: 100, percentage: 20.6 },
]

export function GuildElectoralCommission() {
  const [view, setView] = useState<ElectionView>('ballot')
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [ballotSubmitted, setBallotSubmitted] = useState(false)
  const [ballotError, setBallotError] = useState('')
  const [nominees, setNominees] = useState(initialNominees)
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null)
  const [declarationSigned, setDeclarationSigned] = useState(false)
  const [published, setPublished] = useState(false)
  const [notice, setNotice] = useState('')

  const stats = useMemo(() => ({
    pending: nominees.filter(item => item.status === 'Pending').length,
    approved: nominees.filter(item => item.status === 'Approved').length,
    rejected: nominees.filter(item => item.status === 'Rejected').length,
  }), [nominees])

  function submitBallot() {
    if (!selectedCandidate) {
      setBallotError('Select one presidential candidate before submitting your ballot.')
      return
    }
    setBallotError('')
    setBallotSubmitted(true)
  }

  function updateNomineeStatus(id: string, status: Nominee['status'], notes: string) {
    setNominees(items => items.map(item => item.id === id ? { ...item, status, notes } : item))
    setSelectedNominee(current => current ? { ...current, status, notes } : current)
    setNotice(status === 'Approved' ? 'Nominee approved by the Electoral Commission.' : status === 'Rejected' ? 'Nominee rejected and the decision has been recorded.' : 'Additional information requested from the nominee.')
  }

  function publishResults() {
    if (!declarationSigned) {
      setNotice('Sign the declaration before publishing the election results.')
      return
    }
    setPublished(true)
    setNotice('Election results have been marked for institutional publication.')
  }

  return (
    <section className="guild-electoral-workspace" aria-label="Guild Electoral Commission">
      <header className="guild-electoral-header">
        <div>
          <p className="eyebrow">Student Governance</p>
          <h3>Electoral Commission</h3>
          <p>Manage the Guild President election and the Electoral Commission's vetting of presidential appointees.</p>
        </div>
        <div className="guild-electoral-chair">
          <ShieldCheck size={18} />
          <span><strong>Chairman</strong><small>Electoral Commission lead</small></span>
        </div>
      </header>

      <div className="guild-electoral-rule">
        <div><strong>Governance rule</strong><span>Students elect the Guild President only. The elected President appoints the other guild body members, subject to Electoral Commission vetting.</span></div>
        <div className="guild-electoral-commissioners"><UserCheck size={16} /><span>Chairman + 4 Commissioners</span></div>
      </div>

      <div className="guild-electoral-tabs" role="tablist" aria-label="Electoral Commission screens">
        <button type="button" className={view === 'ballot' ? 'active' : ''} onClick={() => { setView('ballot'); setNotice('') }} role="tab" aria-selected={view === 'ballot'}>
          <Vote size={16} /> Student Ballot
        </button>
        <button type="button" className={view === 'vetting' ? 'active' : ''} onClick={() => { setView('vetting'); setNotice('') }} role="tab" aria-selected={view === 'vetting'}>
          <UserCheck size={16} /> Appointee Vetting
        </button>
        <button type="button" className={view === 'results' ? 'active' : ''} onClick={() => { setView('results'); setNotice('') }} role="tab" aria-selected={view === 'results'}>
          <FileSignature size={16} /> Results Declaration
        </button>
      </div>

      {notice && <div className="guild-electoral-notice" role="status"><CheckCircle2 size={16} /><span>{notice}</span></div>}

      {view === 'ballot' && (
        <section className="guild-election-screen">
          <div className="guild-election-title-row">
            <div>
              <p className="eyebrow">Guild Presidential Election</p>
              <h4>Cast your vote</h4>
              <p>Only the Guild President is elected by the student fraternity. Select one registered candidate.</p>
            </div>
            <div className="guild-countdown"><Clock3 size={16} /><span><strong>08:42:16</strong><small>Voting window remaining</small></span></div>
          </div>

          {ballotSubmitted ? (
            <div className="guild-ballot-confirmation">
              <div className="guild-ballot-success-icon"><CheckCircle2 size={30} /></div>
              <h4>Vote submitted</h4>
              <p>Your presidential ballot has been recorded. Your vote is secret and cannot be viewed by other students.</p>
              <span className="guild-ballot-reference">Receipt reference: EL-2026-00481</span>
            </div>
          ) : (
            <>
              {ballotError && <div className="guild-electoral-error" role="alert"><AlertCircle size={16} /><span>{ballotError}</span></div>}
              <div className="guild-candidate-grid">
                {candidates.map(candidate => (
                  <label key={candidate.id} className={`guild-candidate-card ${selectedCandidate === candidate.id ? 'selected' : ''}`}>
                    <input type="radio" name="guild-presidential-candidate" value={candidate.id} checked={selectedCandidate === candidate.id} onChange={() => { setSelectedCandidate(candidate.id); setBallotError('') }} />
                    <div className="guild-candidate-avatar">{candidate.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</div>
                    <div className="guild-candidate-copy">
                      <strong>{candidate.name}</strong>
                      <span>{candidate.programme} · {candidate.year}</span>
                      <p>{candidate.manifesto}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="guild-ballot-footer">
                <span><ShieldCheck size={16} /> One student · one presidential vote</span>
                <button type="button" className="primary-button" onClick={submitBallot}><Vote size={16} /> Submit ballot</button>
              </div>
            </>
          )}
        </section>
      )}

      {view === 'vetting' && (
        <section className="guild-election-screen">
          <div className="guild-election-title-row">
            <div>
              <p className="eyebrow">Electoral Commission</p>
              <h4>Appointee vetting queue</h4>
              <p>Review the names submitted by the elected Guild President for appointment to guild offices.</p>
            </div>
          </div>

          <div className="guild-vetting-stats">
            <div><span>Pending review</span><strong>{stats.pending}</strong></div>
            <div><span>Approved</span><strong>{stats.approved}</strong></div>
            <div><span>Rejected</span><strong>{stats.rejected}</strong></div>
          </div>

          <div className="guild-vetting-layout">
            <div className="guild-vetting-table-wrap">
              <table className="guild-vetting-table">
                <thead><tr><th>Nominee</th><th>Proposed role</th><th>Status</th><th>Nominated by</th><th>Action</th></tr></thead>
                <tbody>
                  {nominees.map(nominee => (
                    <tr key={nominee.id}>
                      <td><strong>{nominee.name}</strong><small>{nominee.notes}</small></td>
                      <td>{nominee.role}</td>
                      <td><span className={`guild-vetting-status ${nominee.status.toLowerCase().replaceAll(' ', '-')}`}>{nominee.status}</span></td>
                      <td>{nominee.nominatedBy}</td>
                      <td><button type="button" className="secondary-button" onClick={() => setSelectedNominee(nominee)}>Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedNominee && (
              <aside className="guild-vetting-review">
                <div className="guild-section-heading compact">
                  <div><p className="eyebrow">Commission review</p><h4>{selectedNominee.name}</h4></div>
                  <button type="button" className="secondary-button" onClick={() => setSelectedNominee(null)}>Close</button>
                </div>
                <dl>
                  <div><dt>Proposed role</dt><dd>{selectedNominee.role}</dd></div>
                  <div><dt>Nominating authority</dt><dd>{selectedNominee.nominatedBy}</dd></div>
                  <div><dt>Current status</dt><dd>{selectedNominee.status}</dd></div>
                </dl>
                <div className="guild-vetting-notes"><strong>Commission notes</strong><p>{selectedNominee.notes}</p></div>
                <div className="guild-vetting-actions">
                  <button type="button" className="primary-button" onClick={() => updateNomineeStatus(selectedNominee.id, 'Approved', 'Eligibility documents verified and approved by the Commission.') }><CheckCircle2 size={16} /> Approve</button>
                  <button type="button" className="secondary-button" onClick={() => updateNomineeStatus(selectedNominee.id, 'More information', 'Additional supporting information requested by the Commission.') }><AlertCircle size={16} /> Request information</button>
                  <button type="button" className="danger-button" onClick={() => updateNomineeStatus(selectedNominee.id, 'Rejected', 'Nominee did not satisfy the recorded appointment eligibility requirements.') }><XCircle size={16} /> Reject</button>
                </div>
              </aside>
            )}
          </div>
        </section>
      )}

      {view === 'results' && (
        <section className="guild-election-screen">
          <div className="guild-election-title-row">
            <div>
              <p className="eyebrow">Polls Closed</p>
              <h4>Results & declaration</h4>
              <p>Results remain controlled by the Electoral Commission until the Chairman formally declares them.</p>
            </div>
            <span className={`guild-publication-status ${published ? 'published' : ''}`}>{published ? 'Published' : 'Commission controlled'}</span>
          </div>

          <div className="guild-winner-card">
            <div className="guild-winner-icon"><Vote size={22} /></div>
            <div>
              <span>Declared winner</span>
              <h4>{resultRows[0].name}</h4>
              <p>{resultRows[0].programme} · {resultRows[0].votes.toLocaleString()} votes · {resultRows[0].percentage}%</p>
            </div>
            <CheckCircle2 size={25} />
          </div>

          <div className="guild-result-list">
            {resultRows.slice(1).map((candidate, index) => (
              <div className="guild-result-row" key={candidate.id}>
                <div className="guild-result-rank">{index + 2}</div>
                <div className="guild-result-copy"><strong>{candidate.name}</strong><span>{candidate.programme} · {candidate.votes.toLocaleString()} votes</span></div>
                <div className="guild-result-bar"><div style={{ width: `${candidate.percentage}%` }} /></div>
                <strong>{candidate.percentage}%</strong>
              </div>
            ))}
          </div>

          <div className="guild-turnout-grid">
            <div><span>Registered voters</span><strong>560</strong></div>
            <div><span>Ballots cast</span><strong>487</strong></div>
            <div><span>Turnout</span><strong>86.9%</strong></div>
            <div><span>Invalid ballots</span><strong>0</strong></div>
          </div>

          <div className="guild-declaration-card">
            <div>
              <p className="eyebrow">Chairman's declaration</p>
              <h4>Formal results declaration</h4>
              <p>The Chairman confirms the poll count and authorises institutional publication.</p>
            </div>
            <label className="guild-signature-check">
              <input type="checkbox" checked={declarationSigned} onChange={e => setDeclarationSigned(e.target.checked)} />
              <span><FileSignature size={17} /><strong>Digitally sign declaration</strong><small>Chairman authorisation required before publication</small></span>
            </label>
            <div className="guild-declaration-actions">
              <button type="button" className="secondary-button"><Download size={16} /> Download PDF</button>
              <button type="button" className="primary-button" onClick={publishResults}><Send size={16} /> Publish results</button>
            </div>
          </div>

          <div className="guild-appeals-note">
            <Clock3 size={16} />
            <span><strong>Appeals window:</strong> 48 hours from the time of formal declaration.</span>
          </div>
        </section>
      )}
    </section>
  )
}
