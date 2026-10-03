import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, BriefcaseBusiness, ChevronDown, ClipboardCheck, GraduationCap, LayoutDashboard, Library, LogOut, Megaphone, MessageSquare, Package, Settings, ShieldCheck, Stethoscope, UsersRound, WalletCards } from 'lucide-react'
import type { FormEvent } from 'react'
import { getSession, login, logout } from './api/auth'
import { canManageAcademics, canManageAdministration, canManageAdmissions, canManageFinance, canManageStudents, canManageStaff, canReadStaff, canReadLibrary, canManageLibrary, canManageCommunication, canManageInventory, canReadReports, canUseAttendance, canUseAnalytics, canViewSystem } from './auth/permissions'
import { AcademicManagement } from './components/AcademicManagement'; import { AdministrationManagement } from './components/AdministrationManagement'; import { AdmissionsStudentManagement } from './components/AdmissionsStudentManagement'; import { AttendanceManagement } from './components/AttendanceManagement'; import { FinanceManagement } from './components/FinanceManagement'; import { HealthRecordsManagement } from './components/HealthRecordsManagement'; import { InventoryManagement } from './components/InventoryManagement'; import { LibraryManagementWorkspace } from './components/LibraryManagementWorkspace'; import { StaffManagement } from './components/StaffManagement'; import { Announcements } from './components/Announcements'; import { GuildManagement } from './components/GuildManagement';

type ModuleKey = 'dashboard' | 'administration' | 'students' | 'academics' | 'finance' | 'staff' | 'attendance' | 'library' | 'health' | 'laboratories' | 'inventory' | 'communication' | 'guild' | 'reports' | 'system-administration'

type InstitutionSettings = {
  id: string;
  institutionName: string;
  abbreviation: string;
  motto?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  postalAddress?: string;
  logoPath?: string;
}

const DEFAULT_INSTITUTION: InstitutionSettings = {
  id: '', institutionName: 'Your Institution Name', abbreviation: '', motto: '', address: '', phone: '', email: '', website: '', postalAddress: '', logoPath: ''
}

function LoginScreen({ onLogin, institution }: { onLogin: () => void; institution: InstitutionSettings }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username.trim(), password)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="auth-card">
        <div className="auth-logo-wrap">
          {institution.logoPath ? <img src={institution.logoPath} alt="Institution logo" className="auth-logo" /> : <div className="auth-logo" style={{display:'grid',placeItems:'center',borderRadius:'20px',background:'linear-gradient(135deg,#dbeafe,#eff6ff)',fontWeight:900,color:'#1d4ed8'}}>SM</div>}
        </div>
        <h1>Welcome back</h1>
        <p className="auth-copy">Sign in to continue to the School Management Information System.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          {error ? <div className="alert-banner">{error}</div> : null}
        </form>
      </div>
    </div>
  )
}

function AuthenticatedWorkspace({ onLogout, institution }: { onLogout: () => void; institution: InstitutionSettings }) {
  const session = getSession()
  const roles = session?.roles ?? []
  const a = canManageAdministration(roles)
  const st = canManageStudents(roles)
  const ad = canManageAdmissions(roles)
  const fi = canManageFinance(roles)
  const ac = canManageAcademics(roles)
  const sr = canManageStaff(roles)
  const sm = canManageStaff(roles)
  const att = canUseAttendance(roles)
  const lr = canReadLibrary(roles)
  const lm = canManageLibrary(roles)
  const cm = canManageCommunication(roles)
  const inv = canManageInventory(roles)
  const rp = canReadReports(roles)
  const analytics = canUseAnalytics(roles)
  const lecturer = roles.some((r) => /Lecturer|Teacher|Academic/i.test(r))
  const s360 = roles.some((r) => /Student360|Student/i.test(r))

  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard')
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null)
  const [rptTab, setRptTab] = useState<'cards' | 'receipts' | 'certificates' | 'analytics'>('cards')
  const [openSidebarGroups, setOpenSidebarGroups] = useState<Record<string, boolean>>({ Administration: true, Academic: true, Operations: true, Reports: true })
  const sessionUsername = session?.username ?? 'User'

  const navigate = (module: ModuleKey, subsection?: string) => {
    setActiveModule(module)
    setActiveSubsection(subsection ?? null)
    if (subsection) window.dispatchEvent(new CustomEvent('smis:navigate-subsection', { detail: { module, subsection } }))
  }

  type SidebarItem = { label: string; module: ModuleKey; subsection?: string; child?: boolean }
  type SidebarGroup = { label: string; items: SidebarItem[]; alwaysOpen?: boolean }

  const iconByModule: Record<ModuleKey, LucideIcon> = {
    dashboard: LayoutDashboard,
    administration: BriefcaseBusiness,
    students: UsersRound,
    academics: GraduationCap,
    finance: WalletCards,
    staff: BriefcaseBusiness,
    attendance: ClipboardCheck,
    library: Library,
    health: Stethoscope,
    laboratories: Package,
    inventory: Package,
    communication: Megaphone,
    guild: UsersRound,
    reports: BarChart3,
    'system-administration': Settings,
  }

  const moduleLabels: Record<ModuleKey, string> = {
    dashboard: 'Dashboard',
    administration: 'Administration',
    students: 'Students',
    academics: 'Academic Management',
    finance: 'Finance & Accounting',
    staff: 'Staff & HR',
    attendance: 'Attendance',
    library: 'Library',
    health: 'Health & Clinical',
    laboratories: 'Hostel & Welfare',
    inventory: 'Inventory & Property',
    communication: 'Announcements',
    guild: 'Guild',
    reports: 'Reports & Analytics',
    'system-administration': 'System Administration',
  }

  const sidebarGroups: SidebarGroup[] = [
    { label: 'Main', alwaysOpen: true, items: [{ label: 'Dashboard', module: 'dashboard' }] },
    { label: 'Administration', items: [{ label: 'Access Control', module: 'administration' }, { label: 'Users', module: 'administration', subsection: 'users', child: true }, { label: 'Roles', module: 'administration', subsection: 'roles', child: true }, { label: 'Staff & HR', module: 'staff' }, { label: 'Staff', module: 'staff', subsection: 'staff', child: true }, { label: 'Payroll', module: 'staff', subsection: 'payroll', child: true }, { label: 'Leave', module: 'staff', subsection: 'leave', child: true }, { label: 'Recruitment', module: 'staff', subsection: 'recruitment', child: true }, { label: 'System Administration', module: 'system-administration' }, { label: 'Logs', module: 'system-administration', subsection: 'logs', child: true }, { label: 'Backups', module: 'system-administration', subsection: 'backups', child: true }, { label: 'Settings', module: 'system-administration', subsection: 'settings', child: true }] },
    { label: 'Academic', items: [{ label: 'Students', module: 'students' }, { label: 'Registration', module: 'students', subsection: 'registration', child: true }, { label: 'Records', module: 'students', subsection: 'records', child: true }, { label: 'Academic Management', module: 'academics' }, { label: 'Classes', module: 'academics', subsection: 'classes', child: true }, { label: 'Courses', module: 'academics', subsection: 'courses', child: true }, { label: 'Health & Clinical', module: 'health' }, { label: 'Medical Records', module: 'health', subsection: 'medical-records', child: true }, { label: 'Clinic', module: 'health', subsection: 'clinic', child: true }, { label: 'Library', module: 'library' }] },
    { label: 'Operations', items: [{ label: 'Finance & Accounting', module: 'finance' }, { label: 'Attendance', module: 'attendance' }, { label: 'Inventory & Property', module: 'inventory' }] },
    { label: 'Student Affairs', items: [{ label: 'Guild', module: 'guild' }, { label: 'Announcements', module: 'communication' }, { label: 'Hostel & Welfare', module: 'laboratories' }] },
    { label: 'Reports', items: [{ label: 'Reports & Analytics', module: 'reports' }] },
  ]

  const canSeeSidebarItem = (item: SidebarItem) => {
    if (item.module === 'dashboard') return true
    if (item.module === 'administration') return a
    if (item.module === 'students') return st || ad || s360
    if (item.module === 'academics') return ac || lecturer
    if (item.module === 'finance') return fi
    if (item.module === 'staff') return sr
    if (item.module === 'attendance') return att
    if (item.module === 'library') return lr
    if (item.module === 'health') return att || roles.includes('Nurse') || roles.includes('ClinicalInstructor') || roles.includes('SystemAdministrator')
    if (item.module === 'laboratories') return inv
    if (item.module === 'inventory') return inv
    if (item.module === 'communication') return cm
    if (item.module === 'guild') return st || roles.includes('Guild') || roles.includes('SystemAdministrator')
    if (item.module === 'reports') return rp || analytics
    if (item.module === 'system-administration') return a
    return false
  }

  const visibleSidebarGroups = sidebarGroups.map((group) => ({
    ...group,
    items: group.items.filter(canSeeSidebarItem),
  })).filter((group) => group.items.length > 0)

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          {institution.logoPath ? <img src={institution.logoPath} alt="" className="sidebar-logo" /> : <div className="sidebar-logo" style={{display:'grid',placeItems:'center',background:'#fff',color:'#1d4ed8',fontWeight:900}}>SM</div>}
          <div>
            <span className="sidebar-kicker">SMIS</span>
            <h1>{institution.institutionName}</h1>
            {institution.motto ? <p>{institution.motto}</p> : null}
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {visibleSidebarGroups.map((group) => {
            const open = group.alwaysOpen || openSidebarGroups[group.label]
            const toggle = () => { if (!group.alwaysOpen) setOpenSidebarGroups((current) => ({ ...current, [group.label]: !open })) }
            return (
              <section key={group.label} className="sidebar-nav-group">
                <button type="button" className={`sidebar-group-heading ${group.alwaysOpen ? 'static' : ''}`} onClick={toggle} aria-expanded={group.alwaysOpen ? true : open}>
                  <span>{group.label}</span>
                  {!group.alwaysOpen ? <ChevronDown size={14} className={open ? 'open' : ''} aria-hidden="true" /> : null}
                </button>
                {open ? (
                  <div className="sidebar-group-items">
                    {group.items.map((item) => {
                      const Icon = iconByModule[item.module]
                      const isModuleActive = activeModule === item.module
                      const isItemActive = item.subsection ? isModuleActive && activeSubsection === item.subsection : isModuleActive && activeSubsection === null
                      return (
                        <button key={`${group.label}-${item.label}`} type="button" className={`sidebar-item ${item.child ? 'sidebar-child-item' : 'sidebar-parent-item'} ${isItemActive ? 'active' : ''}`} onClick={() => navigate(item.module, item.subsection)} aria-current={isItemActive ? 'page' : undefined}>
                          {item.child ? <span className="sidebar-child-marker" aria-hidden="true">└</span> : <Icon size={18} strokeWidth={isItemActive ? 2.2 : 1.8} aria-hidden="true" />}
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </section>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-account">
            <div className="sidebar-account-avatar">{(sessionUsername[0] || 'U').toUpperCase()}</div>
            <div className="sidebar-account-copy">
              <strong>{sessionUsername}</strong>
              <span>{roles.join(', ') || 'No roles assigned'}</span>
            </div>
            <button type="button" className="sidebar-logout" aria-label="Log out" onClick={onLogout}><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-context">
            <div className="topbar-context-label">
              <span>Current module</span>
              <strong>{(moduleLabels[activeModule] || 'Dashboard').toUpperCase()}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <button type="button" className="secondary-button" onClick={onLogout}>Log out</button>
          </div>
        </header>

        <div className="content">
          {activeModule === 'administration' && a && <AdministrationManagement />}
          {activeModule === 'students' && (st || ad || s360) && <AdmissionsStudentManagement canManage={st || ad} />}
          {activeModule === 'academics' && (ac || lecturer) && <AcademicManagement canManage={ac} />}
          {activeModule === 'finance' && fi && <FinanceManagement />}
          {activeModule === 'staff' && sr && <StaffManagement canManage={sm} />}
          {activeModule === 'attendance' && att && <AttendanceManagement />}
          {activeModule === 'library' && lr && <LibraryManagementWorkspace canManage={lm} />}
          {activeModule === 'health' && (att || roles.includes('Nurse') || roles.includes('ClinicalInstructor') || roles.includes('SystemAdministrator')) && <HealthRecordsManagement />}
          {activeModule === 'laboratories' && inv && <InventoryManagement canManage={inv} initialTab="laboratories" />}
          {activeModule === 'inventory' && inv && <InventoryManagement canManage={inv} />}
          {activeModule === 'communication' && cm && <Announcements canManage={cm} />}
          {activeModule === 'guild' && (st || roles.includes('Guild') || roles.includes('SystemAdministrator')) && <GuildManagement />}
          {activeModule === 'reports' && (rp || analytics) && (
            <div>
              <div className="library-workspace-tabs" style={{ marginBottom: 18 }}>
                <button className={rptTab === 'cards' ? 'active' : ''} onClick={() => setRptTab('cards')}>Cards</button>
                <button className={rptTab === 'receipts' ? 'active' : ''} onClick={() => setRptTab('receipts')}>Receipts</button>
                <button className={rptTab === 'certificates' ? 'active' : ''} onClick={() => setRptTab('certificates')}>Certificates</button>
                <button className={rptTab === 'analytics' ? 'active' : ''} onClick={() => setRptTab('analytics')}>Analytics</button>
              </div>
              <div className="panel"><div className="panel-heading"><h3>Reports & analytics</h3></div><div className="panel-body" style={{padding:20}}><p>Reports are available in your configured role access.</p></div></div>
            </div>
          )}
          {activeModule === 'system-administration' && a && <AdministrationManagement />}
          {activeModule === 'dashboard' && (
            <div className="panel">
              <div className="panel-heading"><h3>Dashboard</h3></div>
              <div style={{ padding: 20 }}>
                <h2 style={{ marginTop: 0 }}>Welcome to {institution.institutionName || 'SMIS'}</h2>
                <p>System status is healthy and your modules are ready.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getSession()))
  const [institution, setInstitution] = useState<InstitutionSettings>(DEFAULT_INSTITUTION)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (session) {
      setAuthed(true)
    }

    const savedInstitution = localStorage.getItem('smis.institution')
    if (savedInstitution) {
      try {
        setInstitution(JSON.parse(savedInstitution) as InstitutionSettings)
      } catch {
        // ignore malformed institution config
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('smis.institution', JSON.stringify(institution))
  }, [institution])

  const handleLogout = () => {
    logout()
    setAuthed(false)
  }

  const handleLogin = () => {
    setAuthed(true)
  }

  if (loading) {
    return <div className="screen-error"><div className="error-boundary-card"><div className="error-boundary-kicker">Loading</div><h2>Loading system</h2><p>Please wait while the application initializes.</p></div></div>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={authed ? 'workspace' : 'auth'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {authed ? <AuthenticatedWorkspace onLogout={handleLogout} institution={institution} /> : <LoginScreen onLogin={handleLogin} institution={institution} />}
      </motion.div>
    </AnimatePresence>
  )
}























































































































































































































































































































































n/a


















































































































































































test
