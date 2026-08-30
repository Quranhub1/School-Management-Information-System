import { useState } from 'react'
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
import './components/PrintStyles.css'

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
        <p className="eyebrow">SMIS · Secure access</p>
        <h1>Sign in to the School Management Information System</h1>
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">SMIS</span>
          <h1>Institutional Services</h1>
        </div>
        <button className="secondary-button" onClick={signOut}>Sign out</button>
      </header>
      <RoleNavigation roles={r} />
      {a && <AdministrationManagement />}
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
      {inv && <InventoryManagement canManage={inv} />}
      {pr && <PrinterManagement />}
      {rp && <ReportCards canManage />}
      {rp && <Receipts canManage />}
      {rp && <CertificateManagement canManage />}
    </main>
  )
}

function App() {
  const [x, setX] = useState(() => Boolean(getSession()))
  return x ? <AuthenticatedWorkspace onLogout={() => setX(false)} /> : <LoginScreen onLogin={() => setX(true)} />
}

export default App
