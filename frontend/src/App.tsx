import { useEffect, useState } from 'react'
import { getSession, login, logout } from './api/auth'

type ModuleKey = 'dashboard' | 'students' | 'academics' | 'finance' | 'library' | 'reports' | 'settings'

const modules: Array<{ key: ModuleKey; label: string; description: string }> = [
  { key: 'dashboard', label: 'Dashboard', description: 'Overview of the school operation.' },
  { key: 'students', label: 'Students', description: 'Admissions, biodata and enrolment.' },
  { key: 'academics', label: 'Academics', description: 'Programmes, results and records.' },
  { key: 'finance', label: 'Finance', description: 'Invoicing, settlements and reports.' },
  { key: 'library', label: 'Library', description: 'Books, circulation and loans.' },
  { key: 'reports', label: 'Reports', description: 'Monitoring, charts and compliance.' },
  { key: 'settings', label: 'Settings', description: 'Institution and access configuration.' },
]

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo">SM</div>
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

function AuthenticatedWorkspace({ onLogout }: { onLogout: () => void }) {
  const [selected, setSelected] = useState<ModuleKey>('dashboard')
  const session = getSession()

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="eyebrow">SMIS</span>
          <h1>School Management</h1>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {modules.map((module) => (
            <button
              key={module.key}
              type="button"
              className={`sidebar-item ${selected === module.key ? 'active' : ''}`}
              onClick={() => setSelected(module.key)}
            >
              {module.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-account">
            <div className="sidebar-account-avatar">{(session?.username ?? 'U').slice(0, 1).toUpperCase()}</div>
            <div className="sidebar-account-copy">
              <strong>{session?.username ?? 'User'}</strong>
              <span>Signed in</span>
            </div>
            <button type="button" className="secondary-button" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <h1>{modules.find((module) => module.key === selected)?.label ?? 'Dashboard'}</h1>
          <div className="topbar-actions">
            <span className="status">System healthy</span>
            <button type="button" className="secondary-button" onClick={onLogout}>Log out</button>
          </div>
        </header>

        <div className="content">
          <section className="hero">
            <p className="eyebrow">Operations overview</p>
            <h2>Welcome to the School Management Information System.</h2>
            <p>
              The system is now returning proper API errors and is using a safer frontend shell.
              You can continue by wiring the remaining modules to the API as your deployment is ready.
            </p>
          </section>

          <div className="summary-grid">
            <article className="summary-card">
              <span>Active students</span>
              <strong>1,284</strong>
              <small>Across all programmes</small>
            </article>
            <article className="summary-card">
              <span>Attendance</span>
              <strong>96.4%</strong>
              <small>Daily average</small>
            </article>
            <article className="summary-card">
              <span>Collections</span>
              <strong>UGX 48.2M</strong>
              <small>This month</small>
            </article>
            <article className="summary-card">
              <span>Pending actions</span>
              <strong>14</strong>
              <small>Finance & operations</small>
            </article>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Current module</span>
                <h3>{modules.find((module) => module.key === selected)?.label ?? 'Dashboard'}</h3>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <p>{modules.find((module) => module.key === selected)?.description}</p>
              <div className="alert-banner info">This shell is now stable and ready for your full module integration work.</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getSession()))

  useEffect(() => {
    setAuthed(Boolean(getSession()))
  }, [])

  return authed ? (
    <AuthenticatedWorkspace onLogout={() => {
      logout()
      setAuthed(false)
    }} />
  ) : (
    <LoginScreen onLogin={() => setAuthed(true)} />
  )
}
