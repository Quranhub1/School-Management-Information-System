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
} from './auth/roleGuards'
import { RoleNavigation } from './components/RoleNavigation'
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
import { getPublicInstitutionSettings, getActiveInstitutionSettings, type InstitutionSettings } from './api/institutionSettings'
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

const DEFAULT_INSTITUTION: InstitutionSettings = {
  id: '',
  institutionName: 'Your Institution Name',
  abbreviation: '',
  motto: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  postalAddress: '',
  country: '',
  institutionType: '',
  logoPath: null,
  primaryColor: null,
  accentColor: null,
  isActive: false,
  updatedAt: '',
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
        {institution.logoPath && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src={institution.logoPath} alt={brandName} style={{ maxHeight: 80, maxWidth: 160, objectFit: 'contain' }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
          </div>
        )}
        <p className="eyebrow">{eyebrow}</p>
        <h1>Sign in to {brandName}</h1>
        <p className="auth-copy">School Management Information System</p>
        <form onSubmit={submit} className="auth-form">
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <div className="error" role="alert">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}

function AuthenticatedWorkspace({ onLogout, institution }: { onLogout: () => void; institution: InstitutionSettings }) {
  const [settings, setSettings] = useState<InstitutionSettings>(institution)
  const s = getSession()
  const r = s?.roles ?? []
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

  function signOut() {
    logout()
    onLogout()
  }

  useEffect(() => {
    void getActiveInstitutionSettings()
      .then(setSettings)
      .catch(() => setSettings(settings))
  }, [])

  const eyebrow = settings.abbreviation?.trim() || institution.abbreviation?.trim() || 'Management System'
  const title = settings.institutionName?.trim() || institution.institutionName?.trim() || 'Institutional Services'

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
        <button className="secondary-button" onClick={signOut}>Sign out</button>
      </header>
      <RoleNavigation roles={r} />
      {a && <AdministrationManagement />}
      {a && <InstitutionSettingsPage onSaved={setSettings} />}
      {ad && <AdmissionsManagement />}
      {st && <StudentManagement canManage />}
      {ac && <AcademicManagement canManage />}
      {ac && <CurriculumManagement canManage />}
      {ex && <ExaminationResults />}
      {fi && <FinanceManagement />}
      {ti && <TimetableManagement />}
      {sr && <StaffManagement canManage={sm} />}
      {lr && <LibraryManagementWorkspace canManage={lm} />}
      {cm && <Announcements canManage={cm} />}
      {rp && <ReportCards canManage />}
      {rp && <Receipts canManage />}
      {rp && <CertificateManagement canManage />}
      {inv && <InventoryManagement />}
      {pr && <PrinterManagement />}
    </main>
  )
}

function App() {
  const [authed, setAuthed] = useState(() => Boolean(getSession()))
  const [institution, setInstitution] = useState<InstitutionSettings>(DEFAULT_INSTITUTION)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getPublicInstitutionSettings()
      .then(setInstitution)
      .catch(() => setInstitution(DEFAULT_INSTITUTION))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Management Information System</p>
        <h1>Loading…</h1>
      </section>
    </main>
  )

  return authed
    ? <AuthenticatedWorkspace onLogout={() => setAuthed(false)} institution={institution} />
    : <LoginScreen onLogin={() => setAuthed(true)} institution={institution} />
}

export default App
