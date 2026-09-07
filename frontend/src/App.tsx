import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getSession, login, logout } from './api/auth'
import {
  canManageAcademics,
  canManageAdministration,
  canManageAdmissions,
  canManageExaminations,
  canManageFinance,
  canManageStudents,
  canManageTimetable,
  canManageStaff,
  canReadStaff,
  canReadLibrary,
  canManageLibrary,
  canManageCommunication,
  canManageReporting,
  canManageInventory,
  canManagePrinters,
  canManageDocuments,
  canViewAnalytics,
} from './auth/roleGuards'
import { AcademicManagement } from './components/AcademicManagement'
import { CurriculumManagement } from './components/CurriculumManagement'
import { AdministrationManagement } from './components/AdministrationManagement'
import { AdmissionsManagement } from './components/AdmissionsManagement'
import { ExaminationResults } from './components/ExaminationResults'
import { StudentManagement } from './components/StudentManagement'
import { FinanceManagement } from './components/FinanceManagement'
import { TimetableManagement } from './components/TimetableManagement'
import { StaffManagement } from './components/StaffManagement'
import { LibraryManagementWorkspace } from './components/LibraryManagementWorkspace'
import { Announcements } from './components/Announcements'
import { ReportCards } from './components/ReportCards'
import { Receipts } from './components/Receipts'
import { CertificateManagement } from './components/CertificateManagement'
import { InventoryManagement } from './components/InventoryManagement'
import { PrinterManagement } from './components/PrinterManagement'
import { InstitutionSettingsPage } from './components/InstitutionSettingsPage'
import { GlobalSearch } from './components/GlobalSearch'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { StudentPortal } from './pages/StudentPortal'
import { Student360Page } from './pages/Student360Page'
import { DocumentManagement } from './components/DocumentManagement'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { getActiveInstitutionSettings, type InstitutionSettings } from './api/institutionSettings'
import './components/PrintStyles.css'

type ModuleKey =
  | 'administration'
  | 'admissions'
  | 'students'
  | 'academics'
  | 'curriculum'
  | 'examinations'
  | 'finance'
  | 'timetable'
  | 'staff'
  | 'library'
  | 'communication'
  | 'inventory'
  | 'printers'
  | 'reports'
  | 'analytics'
  | 'alumni'
  | 'calendar'
  | 'gate'
  | 'audit'
  | 'payroll'
  | 'hostel'
  | 'transport'
  | 'attendance'
  | 'student-portal'
  | 'parent-portal'
  | 'teaching'
  | 'institution-settings'
  | 'documents'
  | 'student360'
  | 'analytics'

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username.trim(), password)
      onLogin()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Secure access</p>
        <h1>Sign in to the Institution Management System</h1>
        <form onSubmit={submit} className="auth-form">
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="error" role="alert">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}

function AuthenticatedWorkspace({ onLogout }: { onLogout: () => void }) {
  const s = getSession()
  const r = s?.roles ?? []
  const [activeModule, setActiveModule] = useState<ModuleKey>('administration')
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null)

  const a = canManageAdministration(r)
  const ad = canManageAdmissions(r)
  const ac = canManageAcademics(r)
  const ex = canManageExaminations(r)
  const st = canManageStudents(r)
  const fi = canManageFinance(r)
  const ti = canManageTimetable(r)
  const sr = canReadStaff(r)
  const sm = canManageStaff(r)
  const lr = canReadLibrary(r)
  const lm = canManageLibrary(r)
  const cm = canManageCommunication(r)
  const rp = canManageReporting(r)
  const inv = canManageInventory(r)
  const pr = canManagePrinters(r)
  const docs = canManageDocuments(r)
  const s360 = r.includes('SystemAdministrator') || r.includes('Registrar') || r.includes('AcademicRegistrar') || r.includes('Student')
  const analytics = canViewAnalytics(r)

  useEffect(() => {
    void getActiveInstitutionSettings().then(setInstitution).catch(() => setInstitution(null))
  }, [])

  function signOut() {
    logout()
    onLogout()
  }

  const modules: { key: ModuleKey; label: string; roles: string[] }[] = [
    { key: 'administration', label: 'Administration', roles: [] },
    { key: 'admissions', label: 'Admissions', roles: [] },
    { key: 'students', label: 'Student Management', roles: [] },
    { key: 'academics', label: 'Academic Management', roles: [] },
    { key: 'curriculum', label: 'Curriculum', roles: [] },
    { key: 'examinations', label: 'Examinations', roles: [] },
    { key: 'finance', label: 'Finance', roles: [] },
    { key: 'timetable', label: 'Timetable', roles: [] },
    { key: 'staff', label: 'Staff', roles: [] },
    { key: 'library', label: 'Library', roles: [] },
    { key: 'communication', label: 'Communication', roles: [] },
    { key: 'inventory', label: 'Inventory', roles: [] },
    { key: 'printers', label: 'Printers', roles: [] },
    { key: 'reports', label: 'Reports', roles: [] },
    { key: 'analytics', label: 'Analytics', roles: [] },
    { key: 'alumni', label: 'Alumni', roles: [] },
    { key: 'calendar', label: 'Calendar', roles: [] },
    { key: 'gate', label: 'Gate Log', roles: [] },
    { key: 'audit', label: 'Audit Log', roles: [] },
    { key: 'payroll', label: 'Payroll', roles: [] },
    { key: 'hostel', label: 'Hostel', roles: [] },
    { key: 'transport', label: 'Transport', roles: [] },
    { key: 'attendance', label: 'Attendance', roles: [] },
    { key: 'student-portal', label: 'Student Portal', roles: [] },
    { key: 'parent-portal', label: 'Parent Portal', roles: [] },
    { key: 'teaching', label: 'Teaching', roles: [] },
    { key: 'institution-settings', label: 'Institution Settings', roles: [] },
    { key: 'documents', label: 'Documents', roles: [] },
    { key: 'student360', label: 'Student 360', roles: [] },
    { key: 'analytics', label: 'Analytics', roles: [] },
  ]

  const [rptTab, setRptTab] = useState<'cards' | 'receipts' | 'certificates'>('cards')

  const visibleModules = modules.filter(m => {
    if (m.key === 'administration' && a) return true
    if (m.key === 'admissions' && ad) return true
    if (m.key === 'students' && st) return true
    if (m.key === 'academics' && ac) return true
    if (m.key === 'curriculum' && ac) return true
    if (m.key === 'examinations' && ex) return true
    if (m.key === 'finance' && fi) return true
    if (m.key === 'timetable' && ti) return true
    if (m.key === 'staff' && sr) return true
    if (m.key === 'library' && lr) return true
    if (m.key === 'communication' && cm) return true
    if (m.key === 'inventory' && inv) return true
    if (m.key === 'printers' && pr) return true
    if (m.key === 'reports' && rp) return true
    if (m.key === 'analytics' && rp) return true
    if (m.key === 'alumni' && st) return true
    if (m.key === 'calendar' && ac) return true
    if (m.key === 'gate' && sr) return true
    if (m.key === 'audit' && a) return true
    if (m.key === 'payroll' && r.includes('SystemAdministrator')) return true
    if (m.key === 'hostel' && r.includes('SystemAdministrator')) return true
    if (m.key === 'transport' && r.includes('SystemAdministrator')) return true
    if (m.key === 'attendance' && sr) return true
    if (m.key === 'student-portal' && r.includes('Student')) return true
    if (m.key === 'parent-portal' && r.includes('Parent')) return true
    if (m.key === 'teaching' && r.includes('Lecturer')) return true
    if (m.key === 'institution-settings' && a) return true
    if (m.key === 'documents' && docs) return true
    if (m.key === 'student360' && s360) return true
    if (m.key === 'analytics' && analytics) return true
    return false
  })

  const institutionName = institution?.institutionName || institution?.abbreviation || 'SMIS'

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="eyebrow">Institution</p>
          <h1>{institutionName}</h1>
          {institution?.motto && <p style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: 4 }}>{institution.motto}</p>}
        </div>
        <nav className="sidebar-nav">
          {visibleModules.map(m => (
            <button key={m.key} className={`sidebar-item ${activeModule === m.key ? 'active' : ''}`} onClick={() => setActiveModule(m.key)}>
              {m.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>Developed by Joes Technologies</p>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <span className="eyebrow">{institutionName}</span>
            <h1>Institutional Services</h1>
          </div>
          <GlobalSearch />
          <button className="secondary-button" onClick={signOut}>Sign out</button>
        </header>
        <div className="content">
          {activeModule === 'administration' && a && <AdministrationManagement />}
          {activeModule === 'admissions' && ad && <AdmissionsManagement />}
          {activeModule === 'students' && st && <StudentManagement canManage />}
          {activeModule === 'academics' && ac && <AcademicManagement canManage />}
          {activeModule === 'curriculum' && ac && <CurriculumManagement canManage />}
          {activeModule === 'examinations' && ex && <ExaminationResults />}
          {activeModule === 'finance' && fi && <FinanceManagement />}
          {activeModule === 'timetable' && ti && <TimetableManagement />}
          {activeModule === 'staff' && sr && <StaffManagement canManage={sm} />}
          {activeModule === 'library' && lr && <LibraryManagementWorkspace canManage={lm} />}
          {activeModule === 'communication' && cm && <Announcements canManage={cm} />}
          {activeModule === 'inventory' && inv && <InventoryManagement canManage={inv} />}
          {activeModule === 'printers' && pr && <PrinterManagement />}
          {activeModule === 'reports' && rp && (
            <div>
              <div className="library-workspace-tabs" role="tablist" aria-label="Reports sections" style={{ marginBottom: 18 }}>
                <button role="tab" aria-selected={rptTab === 'cards'} className={rptTab === 'cards' ? 'active' : ''} onClick={() => setRptTab('cards')}>Report Cards</button>
                <button role="tab" aria-selected={rptTab === 'receipts'} className={rptTab === 'receipts' ? 'active' : ''} onClick={() => setRptTab('receipts')}>Receipts</button>
                <button role="tab" aria-selected={rptTab === 'certificates'} className={rptTab === 'certificates' ? 'active' : ''} onClick={() => setRptTab('certificates')}>Certificates</button>
              </div>
              {rptTab === 'cards' && <ReportCards canManage />}
              {rptTab === 'receipts' && <Receipts canManage />}
              {rptTab === 'certificates' && <CertificateManagement canManage />}
            </div>
          )}
          {activeModule === 'analytics' && rp && <AnalyticsDashboard />}
          {activeModule === 'alumni' && st && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Alumni</p><h2>Alumni Management</h2></div></div><p className="empty">Alumni module is available.</p></div>}
          {activeModule === 'calendar' && ac && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Calendar</p><h2>Academic Calendar</h2></div></div><p className="empty">Calendar module is available.</p></div>}
          {activeModule === 'gate' && sr && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Access Control</p><h2>Gate Log</h2></div></div><p className="empty">Gate log module is available.</p></div>}
          {activeModule === 'audit' && a && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">System</p><h2>Audit Log</h2></div></div><p className="empty">Audit log module is available.</p></div>}
          {activeModule === 'payroll' && r.includes('SystemAdministrator') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">HR</p><h2>Payroll Management</h2></div></div><p className="empty">Payroll module is available.</p></div>}
          {activeModule === 'hostel' && r.includes('SystemAdministrator') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Hostel</p><h2>Hostel Management</h2></div></div><p className="empty">Hostel module is available.</p></div>}
          {activeModule === 'transport' && r.includes('SystemAdministrator') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Transport</p><h2>Transport Management</h2></div></div><p className="empty">Transport module is available.</p></div>}
          {activeModule === 'attendance' && sr && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Attendance</p><h2>Attendance Management</h2></div></div><p className="empty">Attendance module is available.</p></div>}
          {activeModule === 'student-portal' && r.includes('Student') && <StudentPortal />}
          {activeModule === 'parent-portal' && r.includes('Parent') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Parent</p><h2>Parent Portal</h2></div></div><p className="empty">Parent portal is available.</p></div>}
          {activeModule === 'teaching' && r.includes('Lecturer') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Teaching</p><h2>Teaching Workspace</h2></div></div><p className="empty">Teaching module is available.</p></div>}
          {activeModule === 'institution-settings' && a && <InstitutionSettingsPage />}
          {activeModule === 'documents' && docs && <DocumentManagement canManage />}
          {activeModule === 'student360' && s360 && <Student360Page />}
          {activeModule === 'analytics' && analytics && <AnalyticsDashboard />}
        </div>
      </div>
    </main>
  )
}

function App() {
  const [x, setX] = useState(() => Boolean(getSession()))
  return x ? <AuthenticatedWorkspace onLogout={() => setX(false)} /> : <LoginScreen onLogin={() => setX(true)} />
}

export default App
