import { useEffect, useState } from 'react'
import { createUser, getUsers, setUserActive, type CreateUserRequest, type UserSummary } from '../api/administration'

const roles = ['SystemAdministrator', 'Registrar', 'AcademicRegistrar', 'FinanceOfficer', 'Lecturer', 'ExaminationsOfficer', 'Student', 'StoreOfficer', 'HostelWarden', 'TransportOfficer', 'Principal', 'Secretary', 'ResidentDirector', 'HeadOfDepartment', 'AssistantPrincipal']
const emptyForm: CreateUserRequest = { username: '', password: '', firstName: '', lastName: '', email: '', roles: ['Registrar'] }

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
  TransportOfficer: '#4f46e5',
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
        <h2>User Management</h2>
      </div>
      <span>{users.length} accounts</span>
    </div>
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
    {error && <div className="error" role="alert">{error}</div>}
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
  </section>
}
