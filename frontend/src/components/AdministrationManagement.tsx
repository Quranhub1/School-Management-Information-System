import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, BriefcaseBusiness, Building2, CalendarDays, ClipboardCheck, GraduationCap, HeartPulse, Landmark, Library, LockKeyhole, Megaphone, ShieldCheck, UserRound, UsersRound, WalletCards } from 'lucide-react'
import { createUser, getUsers, setUserActive, type CreateUserRequest, type UserSummary } from '../api/administration'
import { type InstitutionSettings } from '../api/institutionSettings'
import { InstitutionSettingsPage } from './InstitutionSettingsPage'

const roles = ['SystemAdministrator', 'Registrar', 'AcademicRegistrar', 'FinanceOfficer', 'Lecturer', 'ExaminationsOfficer', 'Student', 'StoreOfficer', 'HostelWarden', 'Principal', 'Secretary', 'ResidentDirector', 'HeadOfDepartment', 'AssistantPrincipal']
const emptyForm: CreateUserRequest = { username: '', password: '', firstName: '', lastName: '', email: '', roles: ['Registrar'] }

type AdminTab = 'users' | 'offices' | 'settings'

type Office = { key: string; title: string; group: string; description: string; responsibilities: string[]; workspace?: string; workspaceLabel?: string; icon: typeof Building2 }

const OFFICES: Office[] = [
  { key: 'principal', title: 'Principal', group: 'Executive Leadership', description: 'Institution-wide executive oversight, approvals, performance and strategic direction.', responsibilities: ['Institution dashboard and performance metrics', 'Approve institutional decisions, reports and major workflows', 'Review academic, student, finance and operational summaries'], workspace: 'reports', workspaceLabel: 'Open Institution Analytics', icon: Landmark },
  { key: 'deputy-principal', title: 'Deputy Principal', group: 'Executive Leadership', description: 'Supports the Principal with day-to-day academic and operational coordination.', responsibilities: ['Monitor departmental performance', 'Coordinate delegated institutional actions', 'Review timetable, attendance and operational issues'], workspace: 'reports', workspaceLabel: 'Open Dashboard', icon: BriefcaseBusiness },
  { key: 'registrar', title: 'Registrar', group: 'Academic & Registry', description: 'Owns student records, admissions, registration, clearance and core registry processes.', responsibilities: ['Admissions and enrolment', 'Student records and registration', 'Clearance and official registry actions'], workspace: 'students', workspaceLabel: 'Open Student Management', icon: UsersRound },
  { key: 'academic-registrar', title: 'Academic Registrar', group: 'Academic & Registry', description: 'Leads academic administration, examinations coordination and academic records.', responsibilities: ['Academic registration and progression', 'Examination coordination and results processing', 'Transcript and academic record workflows'], workspace: 'academics', workspaceLabel: 'Open Academic Management', icon: GraduationCap },
  { key: 'dean-students', title: 'Dean of Students', group: 'Student Affairs', description: 'Coordinates student welfare, accommodation, discipline, activities and student support.', responsibilities: ['Student welfare and support', 'Accommodation and clearance oversight', 'Student activities and representation'], workspace: 'laboratories', workspaceLabel: 'Open Laboratories & Welfare', icon: HeartPulse },
  { key: 'bursar', title: 'Bursar / Accounts Office', group: 'Finance & Resources', description: 'Manages student billing, receipts, expenditure and financial controls.', responsibilities: ['Fees and billing', 'Receipts and student ledgers', 'Financial reporting and payment controls'], workspace: 'finance', workspaceLabel: 'Open Finance', icon: WalletCards },
  { key: 'examinations', title: 'Examinations Officer', group: 'Academic & Registry', description: 'Administers examination schedules, marks, results and examination records.', responsibilities: ['Examination scheduling', 'Results consolidation and approval workflows', 'Progress reports and transcript preparation'], workspace: 'academics', workspaceLabel: 'Open Academic Management', icon: ClipboardCheck },
  { key: 'head-department', title: 'Heads of Department', group: 'Academic Leadership', description: 'Manage departmental teaching, staff workload, courses and academic delivery.', responsibilities: ['Department course and programme oversight', 'Teaching allocation and workload', 'Review departmental academic performance'], workspace: 'academics', workspaceLabel: 'Open Academic Management', icon: BookOpen },
  { key: 'health-clinical', title: 'Health / Clinical Services Lead', group: 'Clinical & Student Welfare', description: 'Coordinates institutional health services and clinical welfare processes.', responsibilities: ['Student sickbay and health-service coordination', 'Clinical welfare escalation', 'Health-related attendance and clearance coordination'], workspace: 'health', workspaceLabel: 'Open Health & Clinical', icon: HeartPulse },
  { key: 'librarian', title: 'Librarian', group: 'Academic Support', description: 'Manages the library, circulation, cataloguing and digital repository services.', responsibilities: ['Cataloguing and circulation', 'Book issue and return tracking', 'Koha and DSpace service coordination'], workspace: 'library', workspaceLabel: 'Open Library Management', icon: Library },
  { key: 'hr', title: 'Human Resources', group: 'Administration', description: 'Maintains staff records, workforce administration, leave and personnel processes.', responsibilities: ['Staff records and employment administration', 'Leave and personnel actions', 'Workforce reporting and coordination'], workspace: 'staff', workspaceLabel: 'Open Staff Management', icon: UserRound },
  { key: 'ict', title: 'ICT / System Administrator', group: 'Technology & Security', description: 'Controls system access, security, configuration, audit and technical operations.', responsibilities: ['User accounts and role assignment', 'Security and audit monitoring', 'Institution configuration and system support'], workspace: 'system-administration', workspaceLabel: 'Open System Administration', icon: LockKeyhole },
  { key: 'guild', title: 'Guild Cabinet & Council', group: 'Student Governance', description: 'The student representative structure connecting students with the Dean of Students and institutional administration.', responsibilities: ['Guild President and Vice President representation', 'Speaker, Deputy Speaker and GRC proceedings', 'General Secretary records and correspondence', 'Academic, finance, health, welfare, sports, information and religious affairs portfolios'], workspace: 'communication', workspaceLabel: 'Open Student Communications', icon: Megaphone },
  { key: 'store', title: 'Stores / Procurement', group: 'Resources', description: 'Controls institutional stock, commodities, equipment and stores movements.', responsibilities: ['Inventory registers', 'Stock receipts, issues and balances', 'Equipment and commodity monitoring'], workspace: 'inventory', workspaceLabel: 'Open Inventory', icon: Building2 },
  { key: 'warden', title: 'School Warden / Property & Facilities', group: 'Student Affairs & Resources', description: 'Institution-wide custody, inspection and accountability for school property, facilities and operational assets.', responsibilities: ['Maintain the institution-wide property and facilities register', 'Monitor buildings, classrooms, laboratories, workshops, offices and residences', 'Record property allocation, handovers, transfers, damage and loss reports', 'Coordinate inspections, maintenance requests and facility incidents', 'Work with Stores / Procurement and department heads on asset accountability'], workspace: 'inventory', workspaceLabel: 'Open Property & Inventory Workspace', icon: ShieldCheck },
  { key: 'hostel', title: 'Hostel / Residence Office', group: 'Student Affairs', description: 'Manages residences, rooms, beds and student accommodation allocations.', responsibilities: ['Hostel and room registers', 'Bed allocation and occupancy', 'Residence reports and movements'], workspace: 'laboratories', workspaceLabel: 'Open Laboratories & Welfare', icon: ShieldCheck },
  { key: 'secretariat', title: 'Institutional Secretariat', group: 'Administration', description: 'Supports official correspondence, meetings, notices and institutional records.', responsibilities: ['Official correspondence', 'Meeting and document coordination', 'Institutional notices and communications'], workspace: 'communication', workspaceLabel: 'Open Communications', icon: CalendarDays },
]


const ROLE_COLORS: Record<string, string> = {
  SystemAdministrator: '#1e40af',
  Registrar: '#059669',
  AcademicRegistrar: '#7c3aed',
  FinanceOfficer: '#f97316',
  Lecturer: '#2563eb',
  ExaminationsOfficer: '#dc2626',
  Student: '#78716c',
  StoreOfficer: '#92400e',
  HostelWarden: '#0891b2',
  Principal: '#b91c1c',
  Secretary: '#0f766e',
  ResidentDirector: '#c2410c',
  HeadOfDepartment: '#6d28d9',
  AssistantPrincipal: '#0369a1',
}

export function AdministrationManagement() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<AdminTab>('users')
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null)
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null)

  function openWorkspace(workspace?: string) {
    if (!workspace) return
    window.dispatchEvent(new CustomEvent('smis:navigate-module', { detail: workspace }))
    setSelectedOffice(null)
  }

  function handleInstitutionSaved(settings: InstitutionSettings) {
    setInstitution(settings)
  }

  async function load() {
    setLoading(true)
    setError('')
    try { setUsers(await getUsers()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load users.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const created = await createUser(form)
      setUsers(current => [created, ...current])
      setForm(emptyForm)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create user.') }
    finally { setSaving(false) }
  }

  async function toggle(user: UserSummary) {
    try {
      const updated = await setUserActive(user.id, !user.isActive)
      setUsers(current => current.map(item => item.id === updated.id ? updated : item))
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update account status.') }
  }

  return <section className="panel" aria-label="Administration and user management">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">Administration</p>
        <h2>Administration</h2>
      </div>
    </div>

    <div className="library-workspace-tabs" role="tablist" aria-label="Administration sections">
      <button role="tab" aria-selected={tab === 'users'} className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>User Management</button>
      <button role="tab" aria-selected={tab === 'offices'} className={tab === 'offices' ? 'active' : ''} onClick={() => { setTab('offices'); setSelectedOffice(null) }}>Leadership & Offices</button>
      <button role="tab" aria-selected={tab === 'settings'} className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Institution Settings</button>
    </div>

    {error && <div className="error" role="alert">{error}</div>}

    {tab === 'users' && (
      <>
        <form className="student-form" onSubmit={submit}>
          <h3>Create institutional account</h3>
          <div className="form-grid">
            <label>Username<input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required /></label>
            <label>Temporary password<input type="password" minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></label>
            <label>First name<input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></label>
            <label>Last name<input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></label>
            <label>Email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></label>
            <label>Role
              <select value={form.roles[0]} onChange={e => setForm({...form, roles: [e.target.value]})}>
                {roles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="empty">Loading users…</td></tr> :
               users.length === 0 ? <tr><td colSpan={6} className="empty">No accounts found.</td></tr> :
               users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {user.roles.map(role => (
                        <span key={role} style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: ROLE_COLORS[role] || '#78716c',
                          color: 'white',
                          fontSize: '.68rem',
                          fontWeight: 800,
                        }}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: user.isActive ? '#d1fae5' : '#fee2e2',
                      color: user.isActive ? '#059669' : '#dc2626',
                      fontSize: '.72rem',
                      fontWeight: 800,
                    }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td><button type="button" className="secondary-button" onClick={() => void toggle(user)}>{user.isActive ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}

    {tab === 'offices' && (
      selectedOffice ? (() => { const OfficeIcon = selectedOffice.icon; return (
        <div className="office-detail">
          <button type="button" className="secondary-button office-back" onClick={() => setSelectedOffice(null)}><ArrowLeft size={16} /> Back to offices</button>
          <div className="office-detail-header">
            <div className="office-detail-icon"><OfficeIcon size={28} /></div>
            <div><span className="eyebrow">{selectedOffice.group}</span><h3>{selectedOffice.title}</h3><p>{selectedOffice.description}</p></div>
          </div>
          <div className="office-detail-grid">
            <section className="panel office-detail-panel"><div className="panel-heading"><div><h3>Responsibilities</h3><p>Core responsibilities assigned to this office.</p></div></div><ul className="office-responsibilities">{selectedOffice.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></section>
            <section className="panel office-detail-panel"><div className="panel-heading"><div><h3>System workspace</h3><p>Most operational offices are connected directly to the screen they use.</p></div></div>{selectedOffice.workspace ? <button type="button" onClick={() => openWorkspace(selectedOffice.workspace)}>{selectedOffice.workspaceLabel}</button> : <p className="empty">No direct workspace has been assigned yet.</p>}</section>
          </div>
        </div>
      ) })() : (
        <div className="office-directory">
          <div className="office-directory-intro"><div><span className="eyebrow">INSTITUTIONAL LEADERSHIP</span><h3>Leadership & Offices</h3><p>Day-to-day school operations, governance and specialist offices. Operational support workers such as cooks, askaris and watchmen remain staff records rather than application-login roles.</p></div><span className="office-count">{OFFICES.length} offices</span></div>
          <div className="office-groups">{Array.from(new Set(OFFICES.map(o => o.group))).map(group => <section key={group} className="office-group"><div className="office-group-heading"><h4>{group}</h4><span>{OFFICES.filter(o => o.group === group).length}</span></div><div className="office-card-grid">{OFFICES.filter(o => o.group === group).map(office => { const Icon = office.icon; return <button type="button" className="office-card" key={office.key} onClick={() => setSelectedOffice(office)}><span className="office-card-icon"><Icon size={21} /></span><span className="office-card-copy"><strong>{office.title}</strong><small>{office.description}</small></span><span className="office-card-link">{office.workspace ? 'Workspace →' : 'View office →'}</span></button> })}</div></section>)}</div>
        </div>
      )
    )}
    {tab === 'settings' && <InstitutionSettingsPage onSaved={handleInstitutionSaved} />}
  </section>
}

