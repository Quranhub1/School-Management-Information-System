import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, BriefcaseBusiness, Building2, CalendarDays, ClipboardCheck, GraduationCap, HeartPulse, Landmark, Library, LockKeyhole, Megaphone, ShieldCheck, UserRound, UsersRound, WalletCards } from 'lucide-react'
import { createUser, getUsers, setUserActive, updateUser, resetUserPassword, type CreateUserRequest, type UpdateUserRequest, type UserSummary } from '../api/administration'
import { type InstitutionSettings } from '../api/institutionSettings'
import { useInstitutionSettings } from './InstitutionSettingsContext'
import { InstitutionSettingsPage } from './InstitutionSettingsPage'

const roles = ['SystemAdministrator', 'AcademicRegistrar', 'AssistantRegistrar', 'AdmissionsOfficer', 'Accountant', 'AssistantAccountant', 'Lecturer', 'ExaminationsOfficer', 'Student', 'SchoolWarden', 'Principal', 'Director', 'Secretary', 'ResidentDirector', 'HeadOfDepartment', 'Receptionist', 'AssistantPrincipal', 'Admin Secretary', 'Records Officer', 'Librarian', 'HR Manager']
const emptyForm: CreateUserRequest = { username: '', password: '', firstName: '', lastName: '', email: '', roles: ['AcademicRegistrar'] }

type AdminTab = 'users' | 'roles' | 'offices' | 'settings' | 'staff' | 'payroll' | 'leave' | 'recruitment'

type Office = { key: string; title: string; group: string; description: string; responsibilities: string[]; workspace?: string; workspaceLabel?: string; icon: typeof Building2 }

const OFFICES: Office[] = [
  { key: 'director', title: 'Director', group: 'Executive Leadership', description: 'Institution-wide executive authority, strategic direction, approvals and performance oversight.', responsibilities: ['Institution-wide performance and strategic oversight', 'Review and approve major academic, financial and operational matters', 'Review institutional risks, KPIs and executive reports', 'Delegate defined functions when the Director is absent'], workspace: 'reports', workspaceLabel: 'Open Executive Reports', icon: Landmark },
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
  AcademicRegistrar: '#7c3aed',
  AdmissionsOfficer: '#2563eb',
  Lecturer: '#2563eb',
  ExaminationsOfficer: '#dc2626',
  Student: '#78716c',
  SchoolWarden: '#0891b2',
  Principal: '#b91c1c',
  Director: '#7f1d1d',
  Secretary: '#0f766e',
  ResidentDirector: '#c2410c',
  HeadOfDepartment: '#6d28d9',
  Receptionist: '#0e7490',
  AssistantPrincipal: '#0369a1',
}

interface AdministrationManagementProps {
  onInstitutionSaved?: (settings: InstitutionSettings) => void
}

export function AdministrationManagement({ onInstitutionSaved }: AdministrationManagementProps) {
  const { institution } = useInstitutionSettings()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [tab, setTab] = useState<AdminTab>('users')
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<UpdateUserRequest>({ firstName: '', lastName: '', email: '', roles: [] })
  const [actionBusy, setActionBusy] = useState(false)
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null)
  const [passwordResetValue, setPasswordResetValue] = useState('')
  const [viewingUser, setViewingUser] = useState<UserSummary | null>(null)

  function openWorkspace(workspace?: string) {
    if (!workspace) return
    window.dispatchEvent(new CustomEvent('smis:navigate-module', { detail: workspace }))
    setSelectedOffice(null)
  }

  function handleInstitutionSaved(settings: InstitutionSettings) {
    onInstitutionSaved?.(settings)
  }

  async function load() {
    setLoading(true)
    setError('')
    try { setUsers(await getUsers()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load users.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  // Handle subsection navigation from sidebar
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ module?: string; subsection?: string }>).detail
      if (detail?.module !== 'administration' && detail?.module !== 'system-administration') return
      const nextTab: AdminTab | undefined = detail.subsection === 'users' ? 'users'
        : detail.subsection === 'roles' ? 'roles'
        : detail.subsection === 'staff' ? 'staff'
        : detail.subsection === 'payroll' ? 'payroll'
        : detail.subsection === 'leave' ? 'leave'
        : detail.subsection === 'recruitment' ? 'recruitment'
        : detail.subsection === 'settings' ? 'settings'
        : detail.subsection === 'logs' ? 'staff' // Logs maps to staff tab for now
        : detail.subsection === 'backups' ? 'staff' // Backups maps to staff tab for now
        : undefined
      if (nextTab) setTab(nextTab)
    }
    window.addEventListener('smis:navigate-subsection', handler)
    return () => window.removeEventListener('smis:navigate-subsection', handler)
  }, [])

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
    setError('')
    setActionBusy(true)
    try {
      const updated = await setUserActive(user.id, !user.isActive)
      setUsers(current => current.map(item => item.id === updated.id ? updated : item))
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update account status.') }
    finally { setActionBusy(false) }
  }

  function beginEdit(user: UserSummary) {
    setEditingUserId(user.id)
    setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email ?? '', roles: [...user.roles] })
    setError('')
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDate()
    if (!editingUserId) return
    setActionBusy(true)
    setError('')
    try {
      const updated = await updateUser(editingUserId, editForm)
      setUsers(current => current.map(item => item.id === updated.id ? updated : item))
      setEditingUserId(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save user changes.') }
    finally { setActionBusy(false) }
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault()
    if (!passwordResetUserId) return
    if (passwordResetValue.length < 8) {
      setError('Password must contain at least 8 characters.')
      setSuccessMessage('')
      return
    }
    const targetUser = users.find(user => user.id === passwordResetUserId)
    setActionBusy(true)
    setError('')
    setSuccessMessage('')
    try {
      await resetUserPassword(passwordResetUserId, passwordResetValue)
      setSuccessMessage(`Password changed successfully for ${targetUser?.username ?? 'the selected user'}.`)
      setPasswordResetUserId(null)
      setPasswordResetValue('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to change password.') }
    finally { setActionBusy(false) }
  }

  async function removeAccess(user: UserSummary) {
    if (!user.isActive || !window.confirm(`Remove sign-in access for ${user.username}? Their records will be retained.`)) return
    await toggle(user)
  }

  return <section className="panel" aria-label="Administration and user management">
    <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div>
        <p className="eyebrow">Administration</p>
      </div>
      <div>
        <h2>Administration</h2>
      </div>
    </div>

    <div className="library-workspace-tabs" role="tablist" aria-label="Administration sections" style={{ marginBottom: '16px' }}>
      <button role="tab" aria-selected={tab === 'users'} className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>User Management</button>
      <button role="tab" aria-selected={tab === 'roles'} className={tab === 'roles' ? 'active' : ''} onClick={() => setTab('roles')}>Roles & Permissions</button>
      <button role="tab" aria-selected={tab === 'offices'} className={tab === 'offices' ? 'active' : ''} onClick={() => setTab('offices')}>Leadership & Offices</button
      <button role="tab" aria-selected={tab === 'settings'} className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Institution Settings</button>
      <button role="tab" aria-selected={tab === 'staff'} className={tab === 'staff' ? 'active' : ''} onClick={() => setTab('staff')}>Staff & HR</button>
      <button role="tab" aria-selected={tab === 'payroll'} className={tab === 'payroll' ? 'active' : ''} onClick={() => setTab('payroll')}>Payroll</button>
      <button role="tab" aria-selected={tab === 'leave'} className={tab === 'leave' ? 'active' : ''} onClick={() => setTab('leave')}>Leave</button>
      <button role="tab" aria-selected={tab === 'recruitment'} className={tab === 'recruitment' ? 'active' : ''} onClick={() => setTab('recruitment')}>Recruitment</button>
    </div>

    {error && <div className="error" role="alert">{error}</div>}
    {successMessage && <div className="success" role="status">{successMessage}</div>}

    {tab === 'users' && (
      <>
        <div className="panel" style={{ marginBottom: '18px', borderLeft: '4px solid var(--brand-primary, #1e40af)' }}>
          <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={institution.logoPath || '/api/public/institution-settings/logo'}
              alt=""
              style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10 }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <p className="eyebrow">ACCESS CONTROL · INSTITUTION</p>
              <h3 style={{ margin: 0 }}>{institution.institutionName || 'Institution'}</h3>
              {institution.motto && <p style={{ margin: '4px 0 0', color: 'var(--text-muted, #64748b)' }}>{institution.motto}</p>}
            </div>
          </div>
        </div>
        <form className="student-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>Create institutional account</h3>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label>Username<input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required /></label>
              <label>Temporary password<input type="password" minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></label>
            </div>
            <div>
              <label>First name<input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></label>
              <label>Last name<input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></label>
              <label>Email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></label>
            </div>
            <div>
              <label>Role
                <select value={form.roles[0]} onChange={e => setForm({...form, roles: [e.target.value]})}>
                  {roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
            </div>
          </div>
          <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button>
        </form>
        {editingUserId && (
          <form className="student-form" onSubmit={saveEdit} aria-label="Edit user account" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="panel-heading"><div><p className="eyebrow">ACCOUNT SETTINGS</p><h3>Edit user account</h3></div><button type="button" className="secondary-button" onClick={() => setEditingUserId(null)}>Cancel</button></div>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label>First name<input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} required /></label>
                <label>Last name<input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} required /></label>
                <label>Email<input type="email" value={editForm.email ?? ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></label>
              </div>
              <fieldset style={{ border: '1px solid var(--border, #dbe2ea)', borderRadius: 10, padding: 12, margin: '12px 0' }}>
                <legend>Assigned roles (choose at least one)</legend>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                  {[...new Set([...roles, ...editForm.roles])].map(role => <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={editForm.roles.includes(route)} onChange={e => setEditForm({ ...editForm, roles: e.target.checked ? [...editForm.roles, route] : editForm.roles.filter(item => item !== route) })} />
                    {route}
                  </label>)}
                </div>
              </div>
              <button type="submit" disabled={actionBusy || editForm.routes.length === 0}>{actionBusy ? 'Saving…' : 'Save changes'}</button>
          </form>
        )}
        {passwordResetUserId && (
          <form className="student-form" onSubmit={resetPassword} aria-label="Reset user password" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="panel-heading"><div><p className="eyebrow">CREDENTIALS</p><h3>Reset password for {users.find(user => user.id === passwordResetUserId)?.username ?? 'user'}</h3></div><button type="button" className="secondary-button" onClick={() => { setPasswordResetUserId(null); setPasswordResetValue(''); setSuccessMessage('') }}>Cancel</button></div>
            <label>New temporary password<input type="password" autoComplete="new-password" minLength={8} value={passwordResetValue} onChange={e => setPasswordResetValue(e.target.value)} required /></label>
            <button type="submit" disabled={actionBusy || passwordResetValue.length < 8}>{actionBusy ? 'Resetting…' : 'Reset password'}</button>
          </form>
        )}
        <div className="table-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="empty">Loading users…</td></tr> :
               users.length === 0 ? <tr><td colSpan={7} className="empty">No accounts found.</td></tr> :
               users.map(user => (
                 <tr key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '250px' }}>
                   <td>{user.username}</td>
                   <td>{user.firstName} {user.lastName}</td>
                   <td>{user.email ?? '—'}</td>
                   <td>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                       {user.roles.map(route => (
                         <span key={route} style={{
                           padding: '3px 10px',
                           borderRadius: '999px',
                           background: ROLE_COLORS[route] || '#78716c',
                           color: 'white',
                           fontSize: '.68rem',
                           fontWeight: 800,
                         }}>
                           {route}
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
                   <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                   <td>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minWidth: '250px' }}>
                       <button type="button" className="secondary-button" onClick={() => setViewingUser(user)} disabled={actionBusy}>View</button>
                       <button type="button" className="secondary-button" onClick={() => beginEdit(user)} disabled={actionBusy}>Edit / Modify</button>
                       <button type="button" className="secondary-button" onClick={() => { setPasswordResetUserId(user.id); setPasswordResetValue(''); setError(''); setSuccessMessage('') }} disabled={actionBusy}>Reset password</button>
                       <button type="button" className="secondary-button" onClick={() => void toggle(user)} disabled={actionBusy}>{user.isActive ? 'Deactivate' : 'Activate'}</button>
                       {user.isActive && <button type="button" className="secondary-button" onClick={() => void removeAccess(user)} disabled={actionBusy}>Remove access</button>}
                     </div>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </>
    )}
    {tab === 'roles' && (
      <div className="panel" style={{ marginTop: '0' }}>
        <div className="panel-heading" style={{ marginBottom: '12px' }}>
          <div>
            <p className="eyebrow">ROLES & PERMISSIONS</p>
            <h3>Role Management</h3>
            <p>Define and manage institutional roles and their associated permissions.</p>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Assigned Permissions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <td style={{ flex: '0 0 auto', minWidth: '120px' }}>{role}</td>
                  <td style={{ flex: '0 0 auto', minWidth: '200px' }}>{getRoleDescription(role)}</td>
                  <td style={{ flex: '0 0 auto', minWidth: '150px' }}>{getRolePermissions(role).join(', ')}</td>
                  <td style={{ flex: '0 0 auto', minWidth: '100px' }}>
                    <button type="button" className="secondary-button" style={{ padding: '6px 12px' }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={4} className="empty">No roles configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
    {tab === 'offices' && (
      selectedOffice ? (() => { const OfficeIcon = selectedOffice.icon; return (
        <div className="office-detail" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button type="button" className="secondary-button office-back" onClick={() => setSelectedOffice(null)}><ArrowLeft size={16} /> Back to offices</button>
          <div className="office-detail-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="office-detail-icon"><OfficeIcon size={28} /></div>
            <div>
              <span className="eyebrow">{selectedOffice.group}</span>
              <h3>{selectedOffice.title}</h3>
              <p>{selectedOffice.description}</p>
            </div>
          </div>
          <div className="office-detail-grid" style={{ display: 'flex', gap: '16px' }}>
            <section className="panel office-detail-panel" style={{ marginBottom: '16px' }}>
              <div className="panel-heading"><div><h3>Responsibilities</h3><p>Core responsibilities assigned to this office.</p></div></div><ul className="office-responsibilities">{selectedOffice.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></section>
            </section>
            <section className="panel office-detail-panel" style={{ marginBottom: '16px' }}>
              <div className="panel-heading"><div><h3>System workspace</h3><p>Most operational offices are connected directly to the screen they use.</p></div></div>{selectedOffice.workspace ? <button type="button" onClick={() => openWorkspace(selectedOffice.workspace)}>{selectedOffice.workspaceLabel}</button> : <p className="empty">No direct workspace has been assigned yet.</p>}</section>
          </div>
        </div>
      ) })() : (
        <div className="office-directory" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="office-directory-intro" style={{ marginBottom: '16px' }}>
            <div>
              <span className="eyebrow">INSTITUTIONAL LEADERSHIP</span>
              <h3>Leadership & Offices</h3>
              <p>Day-to-day school operations, governance and specialist offices. Operational support workers such as cooks, askaris and watchmen remain staff records rather than application-login roles.</p>
            </div>
            <span className="office-count">{OFFICES.length} offices</span>
          </div>
          <div className="office-groups" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from(new Set(OFFICES.map(o => o.group))).map(group => (
              <section key={group} className="office-group" style={{ marginBottom: '16px' }}>
                <div className="office-group-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h4>{group}</h4>
                  <span>{OFFICES.filter(o => o.group === group).length}</span>
                </div>
                <div className="office-card-grid" style={{ display: 'grid', gap: '12px' }}>
                  {OFFICES.filter(o => o.group === group).map(office => (
                    <button type="button" className="office-card" key={office.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span className="office-card-icon"><Icon size={21} /></span>
                      <span className="office-card-copy"><strong>{office.title}</strong><small>{office.description}</small></span>
                      <span className="office-card-link">{office.workspace ? 'Workspace →' : 'View office →'}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    )}
    {tab === 'settings' && <InstitutionSettingsPage onSaved={handleInstitutionSaved} />}
    {tab === 'staff' && (
      <div className="panel" style={{ marginTop: '0' }}>
        <div className="panel-heading" style={{ marginBottom: '12px' }}>
          <div>
            <p className="eyebrow">STAFF & HR</p>
            <h3>Staff Management Overview</h3>
            <p>View and manage staff records, employment details, and HR processes.</p>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Employment Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder - in a real implementation, this would fetch staff data */}
              <tr style={{ marginBottom: '8px' }}>
                <td>STAFF001</td>
                <td>John Doe</td>
                <td>Senior Lecturer</td>
                <td>Computer Science</td>
                <td>Permanent</td>
                <td><span style={{ color: '#059669' }}>Active</span></td>
              </tr>
              <tr style={{ marginBottom: '8px' }}>
                <td>STAFF002</td>
                <td>Jane Smith</td>
                <td>Administrative Officer</td
                <td>Administration</td>
                <td>Permanent</td>
                <td><span style={{ color: '#059669' }}>Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )}
    {tab === 'payroll' && (
      <div className="panel" style={{ marginTop: '0' }}>
        <div className="panel-heading" style={{ marginBottom: '12px' }}>
          <div>
            <p className="eyebrow">PAYROLL</p
            <h3>Payroll Management</h3>
            <p>Manage employee compensation, deductions, and payroll processing.</p>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Month</th>
                <th>Amount (UGX)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder - in a real implementation, this would fetch payroll data */}
              <tr style={{ marginBottom: '8px' }}>
                <td>STAFF001</td>
                <td>January 2026</td>
                <td>2,500,000</td>
                <td><span style={{ color: '#059669' }}>Paid</span></td>
                <td>
                  <button type="button" className="secondary-button">View Details</button>
                </td>
                <tr style={{ marginBottom: '8px' }}>
                <td>STAFF002</td>
                <td>February 2026</td>
                <td>1,800,000</td>
                <td><span style={{ color: '#d97706' }}>Pending</span></td>
                <td>
                  <button type="button" className="secondary-button">Process</button>
                </td>
              </tbody>
          </table>
        </div>
      </div>
    )}
    {tab === 'leave' && (
      <div className="panel" style={{ marginTop: '0' }}>
        <div className="panel-heading" style={{ marginBottom: '12px' }}>
          <div>
            <p className="eyebrow">LEAVE MANAGEMENT</p>
            <h3>Leave Requests & Approvals</h3>
            <p>Manage employee leave requests, approvals, and tracking.</p>
          </div>
        </div
        <div className="table-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder - in a real implementation, this would fetch leave data */}
              <tr style={{ marginBottom: '8px' }}>
                <td>STAFF001</td>
                <td>Annual Leave</td>
                <td>2026-01-15</td>
                <td>2026-01-22</td>
                <td>8</td>
                <td><span style={{ color: '#059669' }}>Approved</span></td>
                <td>
                  <button type="button" className="secondary-button">View Details</button>
                </td>
                <tr style={{ marginBottom: '8px' }}>
                <td>STAFF002</td
                <td>Sick Leave</td>
                <td>2026-02-01</td>
                <td>2026-02-03</td>
                <td>3</td>
                <td><span style={{ color: '#dc2626' }}>Pending</span></td>
                <td>
                  <button type="button" className="secondary-button" onClick={() => {/* approve/reject logic */}}>Approve</button>
                  <button type="button" className="secondary-button" onClick={() => {/* approve/reject logic */}}>Reject</button>
                </td>
              </tbody>
          </table>
        </div>
      </div>
    )}
    {tab === 'recruitment' && (
      <div className="panel" style={{ marginTop: '0' }}>
        <div className="panel-heading" style={{ marginBottom: '12px' }}>
          <div>
            <p className="eyebrow">RECRUITMENT</p>
            <h3>Talent Acquisition & Onboarding</h3>
            <p>Manage job postings, applications, interviews, and employee onboarding.</p>
          </div>
        </div
        <div className="table-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Department</th
                <th>Status</th>
                <th>Applications</th>
                <th>Action</th>
              </tr
            </thead>
            <tbody>
              {/* Placeholder - in a real implementation, this would fetch recruitment data */}
              <tr style={{ marginBottom: '8px' }}>
                <td>Lecturer - Mathematics</td
                <td>Mathematics</td
                <td>Open</td>
                <td>12</td>
                <td>
                  <button type="button" className="secondary-button">View Applications</button>
                </td
              <tr style={{ marginBottom: '8px' }}>
                <td>Administrative Assistant</td
                <td>Administration</td
                <td>Open</td>
                <td>8</td
                <td>
                  <button type="button" className="secondary-button">View Applications</button>
                </td
              <tr style={{ marginBottom: '8px' }}>
                <td>College Principal</td
                <td>Executive</td
                <td>Closed - Selected</td>
                <td>25</td
                <td>
                  <button type="button" className="secondary-button">View Details</button>
                </td
              </tbody>
          </table>
        </div>
      </div>
    )}
  </section>
}

// Helper functions for roles panel
function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    SystemAdministrator: 'Full system access including configuration, user management, and all modules',
    AcademicRegistrar: 'Manages academic records, registration, examinations, and student progression',
    AdmissionsOfficer: 'Handles student admissions, applications, screening, and enrollment',
    Lecturer: 'Teaches courses, manages assessments, and supports student learning',
    ExaminationsOfficer: 'Coordinates examination scheduling, invigilation, and results processing',
    Student: 'Enrolled learner with access to academic resources and services',
    SchoolWarden: 'Oversees student welfare, discipline, accommodation, and safety',
    Principal: 'Provides academic leadership and oversees educational programs',
    Director: 'Provides executive leadership and institutional management',
    Secretary: 'Hands administrative tasks, documentation, and office management',
    ResidentDirector: 'Manages residential facilities and student welfare in hostels',
    HeadOfDepartment: 'Leads academic department and oversees curriculum delivery',
    Receptionist: 'Manages front desk operations, visitor management, and communications',
    AssistantPrincipal: 'Supports principal in academic administration and school management',
    'Admin Secretary': 'Provides administrative support to management and coordinates office functions',
    RecordsOfficer: 'Maintains student records, documents, and information systems',
    Librarian: 'Manages library resources, cataloguing, and information services',
    'HR Manager': 'Oversees human resources, personnel management, and staff welfare'
  }
  return descriptions[role] || 'No description available'
}

function getRolePermissions(role: string): string[] {
  // Simplified permission mapping - in reality this would be more complex
  const permissionsMap: Record<string, string[]> = {
    SystemAdministrator: ['*'], // All permissions
    AcademicRegistrar: ['academics:read', 'academics:write', 'students:read', 'students:write', 'examinations:read', 'examinations:write'],
    AdmissionsOfficer: ['students:read', 'students:write', 'admissions:read', 'admissions:write'],
    Lecturer: ['academics:read', 'examinations:read', 'examinations:write', 'students:read'],
    ExaminationsOfficer: ['examinations:read', 'examinations:write', 'academics:read'],
    Student: ['academics:read', 'examinations:read'],
    SchoolWarden: ['students:read', 'students:write', 'laboratories:read', 'laboratories:write'],
    Principal: ['academics:read', 'academics:write', 'students:read', 'students:write', 'finance:read'],
    Director: ['*'], // All permissions (executive access)
    Secretary: ['administration:read', 'administration:write', 'students:read'],
    ResidentDirector: ['laboratories:read', 'laboratories:write', 'students:read'],
    HeadOfDepartment: ['academics:read', 'academics:write', 'timetable:read'],
    Receptionist: ['students:read', 'admissions:read', 'communication:read'],
    AssistantPrincipal: ['academics:read', 'academics:write', 'students:read', 'students:write'],
    'Admin Secretary': ['administration:read', 'administration:write', 'finance:read'],
    RecordsOfficer: ['students:read', 'students:write', 'records:read', 'records:write'],
    Librarian: ['library:read', 'library:write'],
    'HR Manager': ['staff:read', 'staff:write', 'payroll:read', 'leave:read', 'leave:write']
  }
  return permissionsMap[role] || []
}