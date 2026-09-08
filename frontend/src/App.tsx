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
import { AlumniManagement } from './components/AlumniManagement'
import { PayrollManagement } from './components/PayrollManagement'
import { StudentPortal } from './pages/StudentPortal'
import { Student360Page } from './pages/Student360Page'
import { DocumentManagement } from './components/DocumentManagement'
import { AttendanceManagement } from './components/AttendanceManagement'
import { getPublicInstitutionSettings, type InstitutionSettings } from './api/institutionSettings'
import './components/PrintStyles.css'

type ModuleKey =
  | 'administration' | 'admissions' | 'students' | 'academics' | 'curriculum' | 'examinations'
  | 'finance' | 'timetable' | 'staff' | 'library' | 'communication' | 'inventory' | 'printers'
  | 'reports' | 'analytics' | 'alumni' | 'calendar' | 'gate' | 'audit' | 'payroll' | 'hostel'
  | 'transport' | 'attendance' | 'student-portal' | 'parent-portal' | 'teaching'
  | 'institution-settings' | 'documents' | 'student360'

const DEFAULT_INSTITUTION: InstitutionSettings = {
  id: '', institutionName: 'Your Institution Name', abbreviation: '', motto: '', address: '', phone: '',
  email: '', website: '', postalAddress: '', country: '', institutionType: '', logoPath: null,
  primaryColor: null, accentColor: null, isActive: false, updatedAt: '',
}

function LoginScreen({ onLogin, institution }: { onLogin: () => void; institution: InstitutionSettings }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const brandName = institution.institutionName?.trim() || 'Your Institution Name'
  const brandAbbr = institution.abbreviation?.trim()
  const eyebrow = brandAbbr ? `${brandAbbr} · Secure access` : 'Secure access'

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try { await login(username.trim(), password); onLogin() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.') }
    finally { setLoading(false) }
  }

  return <main className="auth-shell"><section className="auth-card">
    {institution.logoPath && <div style={{ textAlign: 'center', marginBottom: 16 }}><img src={institution.logoPath} alt={brandName} style={{ maxHeight: 80, maxWidth: 160, objectFit: 'contain' }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} /></div>}
    <p className="eyebrow">{eyebrow}</p><h1>Sign in to {brandName}</h1><p className="auth-copy">School Management Information System</p>
    <form onSubmit={submit} className="auth-form"><label>Username</label><input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
      <label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
      {error && <div className="error" role="alert">{error}</div>}<button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </section></main>
}

function AuthenticatedWorkspace({ onLogout, institution }: { onLogout: () => void; institution: InstitutionSettings }) {
  const [settings, setSettings] = useState<InstitutionSettings>(institution)
  const s = getSession(); const r = s?.roles ?? []
  const a = canManageAdministration(r), ad = canManageAdmissions(r), ac = canManageAcademics(r), ex = canManageExaminations(r)
  const st = canManageStudents(r), fi = canManageFinance(r), ti = canManageTimetable(r), sr = canReadStaff(r), sm = canManageStaff(r)
  const lr = canReadLibrary(r), lm = canManageLibrary(r), cm = canManageCommunication(r), rp = canManageReporting(r)
  const inv = canManageInventory(r), pr = canManagePrinters(r), docs = canManageDocuments(r)
  const s360 = r.includes('SystemAdministrator') || r.includes('Registrar') || r.includes('AcademicRegistrar') || r.includes('Student')
  const analytics = canViewAnalytics(r)
  const [activeModule, setActiveModule] = useState<ModuleKey>('administration')
  const eyebrow = institution.abbreviation?.trim() || institution.institutionName?.trim() || 'SMIS'
  const title = 'Institutional Services'

  function signOut() { logout(); onLogout() }

  const modules: { key: ModuleKey; label: string }[] = [
    { key: 'administration', label: 'Administration' }, { key: 'admissions', label: 'Admissions' },
    { key: 'students', label: 'Student Management' }, { key: 'academics', label: 'Academic Management' },
    { key: 'curriculum', label: 'Curriculum' }, { key: 'examinations', label: 'Examinations' },
    { key: 'finance', label: 'Finance' }, { key: 'timetable', label: 'Timetable' }, { key: 'staff', label: 'Staff' },
    { key: 'library', label: 'Library' }, { key: 'communication', label: 'Communication' }, { key: 'inventory', label: 'Inventory' },
    { key: 'printers', label: 'Printers' }, { key: 'reports', label: 'Reports' }, { key: 'analytics', label: 'Analytics' },
    { key: 'alumni', label: 'Alumni' }, { key: 'calendar', label: 'Calendar' }, { key: 'gate', label: 'Gate Log' },
    { key: 'audit', label: 'Audit Log' }, { key: 'payroll', label: 'Payroll' }, { key: 'hostel', label: 'Hostel' },
    { key: 'transport', label: 'Transport' }, { key: 'attendance', label: 'Attendance' }, { key: 'student-portal', label: 'Student Portal' },
    { key: 'parent-portal', label: 'Parent Portal' }, { key: 'teaching', label: 'Teaching' },
    { key: 'institution-settings', label: 'Institution Settings' }, { key: 'documents', label: 'Documents' }, { key: 'student360', label: 'Student 360' },
  ]
  const [rptTab, setRptTab] = useState<'cards' | 'receipts' | 'certificates'>('cards')

  const visibleModules = modules.filter(m => {
    if (m.key === 'administration') return a; if (m.key === 'admissions') return ad; if (m.key === 'students') return st
    if (m.key === 'academics' || m.key === 'curriculum' || m.key === 'calendar') return ac; if (m.key === 'examinations') return ex
    if (m.key === 'finance') return fi; if (m.key === 'timetable') return ti; if (m.key === 'staff' || m.key === 'attendance') return sr
    if (m.key === 'library') return lr; if (m.key === 'communication') return cm; if (m.key === 'inventory') return inv; if (m.key === 'printers') return pr
    if (m.key === 'reports') return rp; if (m.key === 'analytics') return analytics; if (m.key === 'alumni') return st; if (m.key === 'gate') return sr
    if (m.key === 'audit' || m.key === 'institution-settings') return a; if (m.key === 'payroll' || m.key === 'hostel' || m.key === 'transport') return r.includes('SystemAdministrator')
    if (m.key === 'student-portal') return r.includes('Student'); if (m.key === 'parent-portal') return r.includes('Parent'); if (m.key === 'teaching') return r.includes('Lecturer')
    if (m.key === 'documents') return docs; if (m.key === 'student360') return s360; return false
  })
  const institutionName = institution?.institutionName || institution?.abbreviation || 'SMIS'

  return <main className="app-shell"><aside className="sidebar"><div style={{ padding: 12 }}><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>
    <nav className="sidebar-nav">{visibleModules.map(m => <button key={m.key} className={`sidebar-item ${activeModule === m.key ? 'active' : ''}`} onClick={() => setActiveModule(m.key)}>{m.label}</button>)}</nav>
    <div className="sidebar-footer"><p>Developed by Joes Technologies</p></div></aside>
    <div className="main-content"><header className="topbar"><div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}><span className="eyebrow">{institutionName}</span><h1>Institutional Services</h1></div><GlobalSearch /><button className="secondary-button" onClick={signOut}>Sign out</button></header>
      <div className="content">
        {activeModule === 'administration' && a && <AdministrationManagement />}{activeModule === 'admissions' && ad && <AdmissionsManagement />}
        {activeModule === 'students' && st && <StudentManagement canManage />}{activeModule === 'academics' && ac && <AcademicManagement canManage />}
        {activeModule === 'curriculum' && ac && <CurriculumManagement canManage />}{activeModule === 'examinations' && ex && <ExaminationResults />}
        {activeModule === 'finance' && fi && <FinanceManagement />}{activeModule === 'timetable' && ti && <TimetableManagement />}
        {activeModule === 'staff' && sr && <StaffManagement canManage={sm} />}{activeModule === 'library' && lr && <LibraryManagementWorkspace canManage={lm} />}
        {activeModule === 'communication' && cm && <Announcements canManage={cm} />}{activeModule === 'inventory' && inv && <InventoryManagement canManage={inv} />}
        {activeModule === 'printers' && pr && <PrinterManagement />}
        {activeModule === 'reports' && rp && <div><div className="library-workspace-tabs" role="tablist" aria-label="Reports sections" style={{ marginBottom: 18 }}>
          <button role="tab" aria-selected={rptTab === 'cards'} className={rptTab === 'cards' ? 'active' : ''} onClick={() => setRptTab('cards')}>Report Cards</button>
          <button role="tab" aria-selected={rptTab === 'receipts'} className={rptTab === 'receipts' ? 'active' : ''} onClick={() => setRptTab('receipts')}>Receipts</button>
          <button role="tab" aria-selected={rptTab === 'certificates'} className={rptTab === 'certificates' ? 'active' : ''} onClick={() => setRptTab('certificates')}>Certificates</button></div>
          {rptTab === 'cards' && <ReportCards canManage />}{rptTab === 'receipts' && <Receipts canManage />}{rptTab === 'certificates' && <CertificateManagement canManage />}</div>}
        {activeModule === 'analytics' && analytics && <AnalyticsDashboard />}
        {activeModule === 'alumni' && st && <AlumniManagement />}
        {activeModule === 'calendar' && ac && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Calendar</p><h2>Academic Calendar</h2></div></div><p className="empty">Academic calendar administration is available through the academic management workflow.</p></div>}
        {activeModule === 'gate' && sr && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Access Control</p><h2>Gate Log</h2></div></div><p className="empty">Gate log module is available.</p></div>}
        {activeModule === 'audit' && a && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">System</p><h2>Audit Log</h2></div></div><p className="empty">Audit log module is available.</p></div>}
        {activeModule === 'payroll' && r.includes('SystemAdministrator') && <PayrollManagement />}
        {activeModule === 'hostel' && r.includes('SystemAdministrator') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Hostel</p><h2>Hostel Management</h2></div></div><p className="empty">Hostel module is available.</p></div>}
        {activeModule === 'transport' && r.includes('SystemAdministrator') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Transport</p><h2>Transport Management</h2></div></div><p className="empty">Transport module is available.</p></div>}
        {activeModule === 'attendance' && sr && <AttendanceManagement />}{activeModule === 'student-portal' && r.includes('Student') && <StudentPortal />}
        {activeModule === 'parent-portal' && r.includes('Parent') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Parent</p><h2>Parent Portal</h2></div></div><p className="empty">Parent portal is available.</p></div>}
        {activeModule === 'teaching' && r.includes('Lecturer') && <div className="panel"><div className="panel-heading"><div><p className="eyebrow">Teaching</p><h2>Teaching Workspace</h2></div></div><p className="empty">Teaching module is available.</p></div>}
        {activeModule === 'institution-settings' && a && <InstitutionSettingsPage onSaved={setSettings} />}{activeModule === 'documents' && docs && <DocumentManagement canManage />}{activeModule === 'student360' && s360 && <Student360Page />}
      </div>
    </div></main>
}

function App() {
  const [authed, setAuthed] = useState(() => Boolean(getSession()))
  const [institution, setInstitution] = useState<InstitutionSettings>(DEFAULT_INSTITUTION)
  const [loading, setLoading] = useState(true)
  useEffect(() => { void getPublicInstitutionSettings().then(setInstitution).catch(() => setInstitution(DEFAULT_INSTITUTION)).finally(() => setLoading(false)) }, [])
  if (loading) return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">Management Information System</p><h1>Loading…</h1></section></main>
  return authed ? <AuthenticatedWorkspace onLogout={() => setAuthed(false)} institution={institution} /> : <LoginScreen onLogin={() => setAuthed(true)} institution={institution} />
}
export default App
