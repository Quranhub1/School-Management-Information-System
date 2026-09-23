import { useEffect, useMemo, useState } from 'react';
import { listAlumni, createAlumni, updateAlumni, type Alumni } from '../api/alumni';

type LicenseStatus = 'Not Registered' | 'Pending' | 'Registered' | 'Expired';
type RequestType = 'Official Transcript' | 'Certificate' | 'Letter of Good Standing';
type RequestStatus = 'Submitted' | 'Under Review' | 'Ready for Collection' | 'Released';
type ClearanceState = 'Pending' | 'Cleared' | 'Blocked';

type AlumniExtension = {
  council: string;
  registrationNumber: string;
  licenseStatus: LicenseStatus;
  licenseExpiry: string;
  examBody: 'UNMEB' | 'UAHEB' | 'Other';
  examYear: string;
  boardPassRate: string;
  examResult: 'Pass' | 'Fail' | 'Pending' | '';
  postgraduateProgramme: string;
  postgraduateInstitution: string;
  careerProgress: string;
  requests: { id: string; type: RequestType; purpose: string; status: RequestStatus; submittedAt: string }[];
  clearance: { library: ClearanceState; bursar: ClearanceState; warden: ClearanceState; notes: string };
};

const emptyExtension: AlumniExtension = {
  council: 'UHPAB',
  registrationNumber: '',
  licenseStatus: 'Not Registered',
  licenseExpiry: '',
  examBody: 'UNMEB',
  examYear: '',
  boardPassRate: '',
  examResult: '',
  postgraduateProgramme: '',
  postgraduateInstitution: '',
  careerProgress: '',
  requests: [],
  clearance: { library: 'Pending', bursar: 'Pending', warden: 'Pending', notes: '' }
};

const storageKey = (id: string) => `smis.alumni.extension.${id}`;

export function AlumniManagement() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programme, setProgramme] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [form, setForm] = useState({ studentId: '', graduationDate: '', programme: '', currentOccupation: '', employer: '', contactInfo: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ currentOccupation: '', employer: '', contactInfo: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'licensure' | 'services' | 'clearance'>('profile');
  const [extension, setExtension] = useState<AlumniExtension>(emptyExtension);

  async function load() {
    setLoading(true); setError('');
    try { setAlumni(await listAlumni(search, programme, fromDate, toDate)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load alumni.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function selectAlumnus(id: string) {
    setSelectedId(id);
    setActiveTab('profile');
    try {
      const saved = localStorage.getItem(storageKey(id));
      setExtension(saved ? { ...emptyExtension, ...JSON.parse(saved), clearance: { ...emptyExtension.clearance, ...(JSON.parse(saved).clearance || {}) } } : emptyExtension);
    } catch { setExtension(emptyExtension); }
  }

  function saveExtension(next: AlumniExtension) {
    setExtension(next);
    if (selectedId) localStorage.setItem(storageKey(selectedId), JSON.stringify(next));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      await createAlumni({ ...form, studentId: form.studentId, graduationDate: form.graduationDate, programme: form.programme });
      setForm({ studentId: '', graduationDate: '', programme: '', currentOccupation: '', employer: '', contactInfo: '' }); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to add alumni.'); }
  }

  function startEdit(a: Alumni) {
    setEditingId(a.id);
    setEditForm({ currentOccupation: a.currentOccupation || '', employer: a.employer || '', contactInfo: a.contactInfo || '' });
  }

  async function saveEdit() {
    if (!editingId) return;
    setError('');
    try { await updateAlumni(editingId, editForm); setEditingId(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update alumni.'); }
  }

  function submitRequest() {
    if (!selectedId) return;
    const type = (document.getElementById('alumni-request-type') as HTMLSelectElement)?.value as RequestType;
    const purpose = (document.getElementById('alumni-request-purpose') as HTMLInputElement)?.value.trim();
    if (!purpose) return;
    const request = { id: crypto.randomUUID(), type, purpose, status: 'Submitted' as RequestStatus, submittedAt: new Date().toISOString() };
    saveExtension({ ...extension, requests: [request, ...extension.requests] });
  }

  const selected = alumni.find(a => a.id === selectedId);
  const cleared = useMemo(() => Object.values(extension.clearance).filter(v => v === 'Cleared').length, [extension.clearance]);

  return <section className="panel alumni-workspace" aria-label="Alumni">
    <div className="panel-heading">
      <div><span className="eyebrow">Alumni</span><h2>Alumni & Graduate Relations</h2><p className="panel-subtitle">Maintain lifelong ties, professional licensure, postgraduate progress, document requests, and final certificate clearance.</p></div>
    </div>

    <form className="grid-form" onSubmit={submit}>
      <input placeholder="Student ID" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required />
      <input placeholder="Graduation date" type="date" value={form.graduationDate} onChange={e => setForm({ ...form, graduationDate: e.target.value })} required />
      <input placeholder="Programme" value={form.programme} onChange={e => setForm({ ...form, programme: e.target.value })} required />
      <input placeholder="Occupation" value={form.currentOccupation} onChange={e => setForm({ ...form, currentOccupation: e.target.value })} />
      <input placeholder="Employer" value={form.employer} onChange={e => setForm({ ...form, employer: e.target.value })} />
      <button type="submit">Register Alumni</button>
    </form>

    {error && <div className="error" role="alert">{error}</div>}

    <div className="alumni-feature-grid">
      <div className="alumni-directory-card">
        <div className="library-toolbar">
          <div><h3>Alumni Directory</h3><p>Search graduates and open their professional profile.</p></div>
          <button className="secondary-button" onClick={() => void load()}>Refresh</button>
        </div>
        <div className="alumni-filters">
          <input placeholder="Search name or student number" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load()} />
          <input placeholder="Programme" value={programme} onChange={e => setProgramme(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load()} />
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Graduation from" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Graduation to" />
        </div>
        {loading ? <p className="empty">Loading alumni…</p> : <div className="table-wrap"><table><thead><tr><th>Student</th><th>Graduation</th><th>Programme</th><th>Occupation</th><th>Actions</th></tr></thead><tbody>
          {alumni.map(a => <tr key={a.id}><td><strong>{(a as Alumni & { studentName?: string }).studentName || a.studentId}</strong><span className="table-subtitle">{(a as Alumni & { studentNumber?: string }).studentNumber || a.studentId}</span></td><td>{a.graduationDate}</td><td>{a.programme}</td><td>{a.currentOccupation || '—'}</td><td><button className="secondary-button" onClick={() => selectAlumnus(a.id)}>Open Profile</button>{editingId === a.id ? <><button className="secondary-button" onClick={() => void saveEdit()}>Save</button><button className="secondary-button" onClick={() => setEditingId(null)}>Cancel</button></> : <button className="secondary-button" onClick={() => startEdit(a)}>Edit</button>}</td></tr>)}
        </tbody></table></div>}
      </div>

      <aside className="alumni-summary-card">
        <h3>Alumni Services</h3>
        <div className="alumni-stat"><strong>{alumni.length}</strong><span>Graduates in directory</span></div>
        <div className="alumni-stat"><strong>{extension.requests.length}</strong><span>Requests for selected alumnus</span></div>
        <div className="alumni-stat"><strong>{cleared}/3</strong><span>Clearance offices cleared</span></div>
        <p>Professional records can track UHPAB and NCHE registration, national board results, postgraduate study, and career progression.</p>
      </aside>
    </div>

    {selected && <section className="alumni-profile-card">
      <div className="alumni-profile-header"><div><span className="eyebrow">Graduate profile</span><h3>{(selected as Alumni & { studentName?: string }).studentName || selected.studentId}</h3><p>{selected.programme} · Graduated {selected.graduationDate}</p></div><button className="secondary-button" onClick={() => setSelectedId(null)}>Close</button></div>
      <div className="alumni-tabs">
        {(['profile','licensure','services','clearance'] as const).map(tab => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab === 'profile' ? 'Career & Postgraduate' : tab === 'licensure' ? 'Licensure & Boards' : tab === 'services' ? 'Services & Requests' : 'Certificate Clearance'}</button>)}
      </div>

      {activeTab === 'profile' && <div className="alumni-detail-grid">
        <label>Current occupation<input value={selected.currentOccupation || ''} onChange={e => { const v = e.target.value; void updateAlumni(selected.id, { currentOccupation: v }).then(load).catch(() => setError('Unable to save occupation.')); }} /></label>
        <label>Employer<input value={selected.employer || ''} onChange={e => { const v = e.target.value; void updateAlumni(selected.id, { employer: v }).then(load).catch(() => setError('Unable to save employer.')); }} /></label>
        <label>Postgraduate programme<input value={extension.postgraduateProgramme} onChange={e => saveExtension({ ...extension, postgraduateProgramme: e.target.value })} placeholder="MSc, PGDip, PhD…" /></label>
        <label>Institution<input value={extension.postgraduateInstitution} onChange={e => saveExtension({ ...extension, postgraduateInstitution: e.target.value })} /></label>
        <label className="wide">Career progress<textarea value={extension.careerProgress} onChange={e => saveExtension({ ...extension, careerProgress: e.target.value })} placeholder="Professional role, promotion, further training, specialization…" /></label>
      </div>}

      {activeTab === 'licensure' && <div className="alumni-detail-grid">
        <div className="alumni-info-banner"><strong>Professional Council Registration & License Tracker</strong><span>Track regulatory registration and national board outcomes without mixing them into academic results.</span></div>
        <label>Regulatory / licensing body<select value={extension.council} onChange={e => saveExtension({ ...extension, council: e.target.value })}><option>UHPAB</option><option>NCHE</option></select></label>
        <label>Registration number<input value={extension.registrationNumber} onChange={e => saveExtension({ ...extension, registrationNumber: e.target.value })} /></label>
        <label>Registration status<select value={extension.licenseStatus} onChange={e => saveExtension({ ...extension, licenseStatus: e.target.value as LicenseStatus })}><option>Not Registered</option><option>Pending</option><option>Registered</option><option>Expired</option></select></label>
        <label>License expiry<input type="date" value={extension.licenseExpiry} onChange={e => saveExtension({ ...extension, licenseExpiry: e.target.value })} /></label>
        <div className="alumni-section-divider"><h4>National Licensure Examination / Board Result</h4></div>
        <label>Exam body<select value={extension.examBody} onChange={e => saveExtension({ ...extension, examBody: e.target.value as AlumniExtension['examBody'] })}><option>UNMEB</option><option>UAHEB</option><option>Other</option></select></label>
        <label>Exam year<input value={extension.examYear} onChange={e => saveExtension({ ...extension, examYear: e.target.value })} placeholder="2026" /></label>
        <label>Final board pass rate<input value={extension.boardPassRate} onChange={e => saveExtension({ ...extension, boardPassRate: e.target.value })} placeholder="e.g. 78%" /></label>
        <label>Individual final board result<select value={extension.examResult} onChange={e => saveExtension({ ...extension, examResult: e.target.value as AlumniExtension['examResult'] })}><option value="">Select result</option><option>Pass</option><option>Fail</option><option>Pending</option></select></label>
      </div>}

      {activeTab === 'services' && <div className="alumni-services-grid">
        <div className="alumni-request-builder"><h4>Online Document Request</h4><p>Submit a request for employment or further-study documentation.</p><select id="alumni-request-type"><option>Official Transcript</option><option>Certificate</option><option>Letter of Good Standing</option></select><input id="alumni-request-purpose" placeholder="Purpose / destination institution or employer" /><button className="primary-button" onClick={submitRequest}>Submit Request</button></div>
        <div><h4>Request History</h4>{extension.requests.length === 0 ? <p className="empty">No requests submitted.</p> : <div className="alumni-request-list">{extension.requests.map(r => <div className="alumni-request-item" key={r.id}><div><strong>{r.type}</strong><span>{r.purpose}</span><small>{new Date(r.submittedAt).toLocaleString()}</small></div><span className="finance-status-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{r.status}</span></div>)}</div>}</div>
      </div>}

      {activeTab === 'clearance' && <div>
        <div className="alumni-clearance-header"><div><h4>Alumni Clearing Center</h4><p>Certificate release requires clearance from Library, Bursar, and Warden.</p></div><span className={cleared === 3 ? 'clearance-complete' : 'clearance-pending'}>{cleared === 3 ? '✓ Ready for Certificate Release' : `${cleared}/3 Offices Cleared`}</span></div>
        <div className="clearance-grid">
          {(['library','bursar','warden'] as const).map(office => <div className="clearance-card" key={office}><span>{office === 'library' ? 'Library' : office === 'bursar' ? 'Bursar / Finance' : 'Warden / Hostel'}</span><strong className={extension.clearance[office] === 'Cleared' ? 'clearance-ok' : 'clearance-wait'}>{extension.clearance[office]}</strong><select value={extension.clearance[office]} onChange={e => saveExtension({ ...extension, clearance: { ...extension.clearance, [office]: e.target.value as ClearanceState } })}><option>Pending</option><option>Cleared</option><option>Blocked</option></select></div>)}
        </div>
        <label className="wide">Clearance notes<textarea value={extension.clearance.notes} onChange={e => saveExtension({ ...extension, clearance: { ...extension.clearance, notes: e.target.value } })} placeholder="Outstanding books, fee balances, hostel obligations, approvals…" /></label>
      </div>}
    </section>}
  </section>;
}
