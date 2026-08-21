import { useState } from 'react'
import type { FormEvent } from 'react'
import { getStudentAcademicSummaries, getStudentTranscript } from './api/academicRecords'
import { getSession, login, logout } from './api/auth'
import { canManageAcademics } from './auth/roleGuards'
import { RoleNavigation } from './components/RoleNavigation'
import { AcademicManagement } from './components/AcademicManagement'
import type { AcademicResultSummary, TranscriptEntry } from './types/academic'

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      await login(username.trim(), password)
      onLogin()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">SMIS · Secure access</p>
        <h1>Sign in to the School Management Information System</h1>
        <p className="auth-copy">Use your institutional account to access academic records and other authorized services.</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="username">Username</label>
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          {error && <div className="error" role="alert">{error}</div>}
          <button type="submit" disabled={loading || !username.trim() || !password}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}

function AcademicRecords({ onLogout }: { onLogout: () => void }) {
  const session = getSession()
  const [studentId, setStudentId] = useState('')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [summaries, setSummaries] = useState<AcademicResultSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadAcademicRecords(event: FormEvent) {
    event.preventDefault()
    if (!studentId.trim()) return
    setLoading(true)
    setError('')
    try {
      const [entries, resultSummaries] = await Promise.all([
        getStudentTranscript(studentId.trim()),
        getStudentAcademicSummaries(studentId.trim()),
      ])
      setTranscript(entries)
      setSummaries(resultSummaries)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load academic records.'
      setError(message)
      setTranscript([])
      setSummaries([])
      if (message.includes('session has expired')) {
        logout()
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  function signOut() {
    logout()
    onLogout()
  }

  const academicAccess = canManageAcademics(session?.roles ?? [])

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><span className="eyebrow">SMIS</span><h1>Academic Records</h1></div>
        <div className="topbar-actions">
          <span className="status">{session?.username ?? 'Authenticated'}</span>
          <button className="secondary-button" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <RoleNavigation roles={session?.roles ?? []} />
      {academicAccess && <AcademicManagement canManage={academicAccess} />}
      {!academicAccess && <section className="panel"><h3>Student Academic Services</h3><p>Enter your authorized student ID to retrieve academic records.</p><form className="student-form" onSubmit={loadAcademicRecords}><label htmlFor="student-id">Student ID</label><div className="form-row"><input id="student-id" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter student UUID" /><button type="submit" disabled={loading || !studentId.trim()}>{loading ? 'Loading…' : 'Load records'}</button></div></form></section>}
      {!academicAccess && error && <div className="error" role="alert">{error}</div>}
      {!academicAccess && <section className="summary-grid" aria-label="Academic summaries">{summaries.map((summary) => <article className="summary-card" key={summary.id}><span>Semester</span><strong>{summary.semesterId}</strong><div className="metrics"><span>GPA <b>{summary.gpa.toFixed(2)}</b></span><span>CGPA <b>{summary.cgpa?.toFixed(2) ?? '—'}</b></span></div><small>{summary.standing}</small></article>)}</section>}
      {!academicAccess && <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Transcript</p><h3>Course results</h3></div><span>{transcript.length} entries</span></div><div className="table-wrap"><table><thead><tr><th>Course</th><th>Course title</th><th>Units</th><th>Score</th><th>Grade</th><th>Point</th></tr></thead><tbody>{transcript.length === 0 ? <tr><td colSpan={6} className="empty">No academic records loaded.</td></tr> : transcript.map((entry) => <tr key={entry.id}><td>{entry.courseCode}</td><td>{entry.courseTitle}</td><td>{entry.creditUnits}</td><td>{entry.score}</td><td><span className="grade">{entry.grade ?? '—'}</span></td><td>{entry.gradePoint.toFixed(2)}</td></tr>)}</tbody></table></div></section>}
    </main>
  )
}

function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getSession()))
  return authenticated ? <AcademicRecords onLogout={() => setAuthenticated(false)} /> : <LoginScreen onLogin={() => setAuthenticated(true)} />
}

export default App
