import { useState } from 'react'
import './preview.css'

type Screen = {
  id: string
  label: string
  title: string
  description: string
}

const screens: Screen[] = [
  { id: 'dashboard', label: 'Dashboard', title: 'Institutional Services', description: 'A role-aware overview of the school management workspace.' },
  { id: 'administration', label: 'Administration', title: 'Administration Management', description: 'Institution configuration, academic structure and operational controls.' },
  { id: 'admissions', label: 'Admissions', title: 'Admissions Management', description: 'Applications, intake processing and admission records.' },
  { id: 'students', label: 'Students', title: 'Student Management', description: 'Student registration, profiles, enrolment and records.' },
  { id: 'academics', label: 'Academics', title: 'Academic Management', description: 'Academic records, programmes and curriculum management.' },
  { id: 'exams', label: 'Examinations', title: 'Examination & Results', description: 'Assessment, marks, grades, approvals and results.' },
  { id: 'finance', label: 'Finance', title: 'Finance Management', description: 'Fees, payments, balances and financial documents.' },
  { id: 'timetable', label: 'Timetable', title: 'Timetable Management', description: 'Academic scheduling, rooms, sessions and calendar views.' },
  { id: 'staff', label: 'Staff', title: 'Staff Management', description: 'Staff records, roles, assignments and access.' },
  { id: 'library', label: 'Library', title: 'Library Management', description: 'Librarians, catalogue, circulation and external library services.' },
  { id: 'communication', label: 'Communication', title: 'Announcements', description: 'Institutional notices and targeted communication.' },
  { id: 'reports', label: 'Reports', title: 'Reporting & Documents', description: 'Report cards, receipts, certificates and institutional reports.' },
]

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="preview-stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}

function Dashboard() {
  return <>
    <div className="preview-stats"><Stat label="Active students" value="1,248" note="Across current intakes" /><Stat label="Programmes" value="36" note="Academic and practical" /><Stat label="Outstanding fees" value="UGX 48.6M" note="Requires follow-up" /><Stat label="Attendance" value="92.4%" note="Current period" /></div>
    <div className="preview-grid two">
      <section className="preview-card"><h3>Quick actions</h3><div className="quick-actions"><button>Register student</button><button>Record payment</button><button>Enter results</button><button>Publish announcement</button></div></section>
      <section className="preview-card"><h3>Recent activity</h3><div className="activity"><p><b>Admission</b> — New applicant record received <span>Today</span></p><p><b>Results</b> — Semester results awaiting approval <span>Yesterday</span></p><p><b>Finance</b> — 18 payments posted <span>Yesterday</span></p></div></section>
    </div>
  </>
}

function ManagementScreen({ screen }: { screen: Screen }) {
  const [tab, setTab] = useState('Overview')
  const tabs = screen.id === 'academics' ? ['Academic Records', 'Programmes'] : screen.id === 'library' ? ['Library', 'Librarians', 'Koha', 'DSpace'] : screen.id === 'reports' ? ['Report Cards', 'Receipts', 'Certificates', 'Statements'] : ['Overview', 'Records', 'Actions']
  return <>
    <div className="preview-tabs">{tabs.map((item) => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
    <section className="preview-card">
      <div className="card-heading"><div><h3>{tab}</h3><p>{screen.description}</p></div><button className="primary">Add new</button></div>
      {screen.id === 'library' && (tab === 'Koha' || tab === 'DSpace') ? <IntegrationPanel service={tab} /> : <DataTable screen={screen} />}
    </section>
  </>
}

function IntegrationPanel({ service }: { service: string }) {
  return <div className="integration"><div className="integration-icon">{service === 'Koha' ? 'K' : 'D'}</div><div><h4>{service} integration</h4><p>Configure the existing local service connection without replacing the external system.</p></div><div className="connection-form"><label>Service URL<input placeholder={service === 'Koha' ? 'http://localhost:8080' : 'http://localhost:8081'} /></label><label>API / endpoint<input placeholder="Enter endpoint" /></label><button className="primary">Test connection</button></div></div>
}

function DataTable({ screen }: { screen: Screen }) {
  const names = screen.id === 'students' ? ['AK-2026-0012', 'AK-2026-0013', 'AK-2026-0014', 'AK-2026-0015'] : screen.id === 'staff' ? ['Academic Registrar', 'Senior Lecturer', 'Librarian', 'Accounts Officer'] : screen.id === 'finance' ? ['INV-2026-0012', 'INV-2026-0013', 'INV-2026-0014', 'INV-2026-0015'] : screen.id === 'exams' ? ['BIO 101', 'PHA 102', 'MED 103', 'ICT 104'] : ['BME-01', 'BME-02', 'PHA-01', 'HIM-01']
  return <div className="table-wrap"><div className="table-toolbar"><input placeholder="Search records..." /><select><option>All status</option><option>Active</option><option>Pending</option></select></div><table><thead><tr><th>Reference</th><th>Name / Description</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>{names.map((name, i) => <tr key={name}><td>{name}</td><td>{i % 2 ? 'Current institutional record' : 'Registered system record'}</td><td><span className={`badge ${i === 2 ? 'pending' : ''}`}>{i === 2 ? 'Pending' : 'Active'}</span></td><td>26 Aug 2026</td><td><button className="link-button">View</button></td></tr>)}</tbody></table></div>
}

export function PreviewApp() {
  const [screenId, setScreenId] = useState('dashboard')
  const current = screens.find((screen) => screen.id === screenId) ?? screens[0]
  return <main className="preview-shell">
    <aside className="preview-sidebar">
      <div className="brand"><div className="brand-mark">S</div><div><b>SMIS</b><small>Visual Preview</small></div></div>
      <div className="preview-nav">{screens.map((screen) => <button className={screen.id === screenId ? 'selected' : ''} onClick={() => setScreenId(screen.id)} key={screen.id}><span>{screen.label.slice(0, 1)}</span>{screen.label}</button>)}</div>
      <div className="preview-note"><b>Preview mode</b><p>Sample data only. No backend or database connection is required.</p></div>
    </aside>
    <section className="preview-main">
      <header className="preview-header"><div><span className="eyebrow">SMIS · FRONTEND PREVIEW</span><h1>{current.title}</h1><p>{current.description}</p></div><div className="profile">Admin Preview <span>AP</span></div></header>
      {screenId === 'dashboard' ? <Dashboard /> : <ManagementScreen screen={current} />}
    </section>
  </main>
}
