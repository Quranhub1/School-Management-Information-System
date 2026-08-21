import { useState } from 'react'
import type { FormEvent } from 'react'
import { getSession, login, logout } from './api/auth'
import { canManageAcademics, canManageExaminations, canManageStudents } from './auth/roleGuards'
import { RoleNavigation } from './components/RoleNavigation'
import { AcademicManagement } from './components/AcademicManagement'
import { ExaminationResults } from './components/ExaminationResults'
import { StudentManagement } from './components/StudentManagement'

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true); setError('')
    try { await login(username.trim(), password); onLogin() }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.') }
    finally { setLoading(false) }
  }

  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">SMIS · Secure access</p><h1>Sign in to the School Management Information System</h1><p className="auth-copy">Use your institutional account to access authorized services.</p><form onSubmit={submit} className="auth-form"><label htmlFor="username">Username</label><input id="username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />{error && <div className="error" role="alert">{error}</div>}<button type="submit" disabled={loading || !username.trim() || !password}>{loading ? 'Signing in…' : 'Sign in'}</button></form></section></main>
}

function AuthenticatedWorkspace({ onLogout }: { onLogout: () => void }) {
  const session = getSession()
  function signOut() { logout(); onLogout() }
  const roles = session?.roles ?? []
  const academicAccess = canManageAcademics(roles)
  const examinationAccess = canManageExaminations(roles)
  const studentAccess = canManageStudents(roles)

  return <main className="app-shell"><header className="topbar"><div><span className="eyebrow">SMIS</span><h1>Institutional Services</h1></div><div className="topbar-actions"><span className="status">{session?.username ?? 'Authenticated'}</span><button className="secondary-button" onClick={signOut}>Sign out</button></div></header><RoleNavigation roles={roles} />{studentAccess && <StudentManagement canManage />}{academicAccess && <AcademicManagement canManage />}{examinationAccess && <ExaminationResults />}{!studentAccess && !academicAccess && !examinationAccess && <section className="panel"><h3>Institutional Services</h3><p className="empty">Your role has no management workspace assigned yet.</p></section>}</main>
}

function App() { const [authenticated, setAuthenticated] = useState(() => Boolean(getSession())); return authenticated ? <AuthenticatedWorkspace onLogout={() => setAuthenticated(false)} /> : <LoginScreen onLogin={() => setAuthenticated(true)} /> }

export default App
