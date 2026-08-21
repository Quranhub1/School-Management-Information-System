import { useEffect, useState } from 'react'
import { createUser, getUsers, setUserActive, type CreateUserRequest, type UserSummary } from '../api/administration'

const roles = ['SystemAdministrator', 'Registrar', 'AcademicRegistrar', 'FinanceOfficer', 'Lecturer', 'ExaminationsOfficer', 'Student']
const emptyForm: CreateUserRequest = { username: '', password: '', firstName: '', lastName: '', email: '', roles: ['Registrar'] }

export function AdministrationManagement() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() { setLoading(true); setError(''); try { setUsers(await getUsers()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load users.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try { const created = await createUser(form); setUsers(current => [created, ...current]); setForm(emptyForm) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to create user.') }
    finally { setSaving(false) }
  }

  async function toggle(user: UserSummary) {
    try { const updated = await setUserActive(user.id, !user.isActive); setUsers(current => current.map(item => item.id === updated.id ? updated : item)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update account status.') }
  }

  return <section className="panel" aria-label="Administration and user management">
    <div className="panel-heading"><div><p className="eyebrow">Administration</p><h2>User management</h2></div><span>{users.length} accounts</span></div>
    <form className="student-form" onSubmit={submit}>
      <h3>Create institutional account</h3>
      <div className="form-grid">
        <label>Username<input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required /></label>
        <label>Temporary password<input type="password" minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></label>
        <label>First name<input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></label>
        <label>Last name<input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></label>
        <label>Email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></label>
        <label>Role<select value={form.roles[0]} onChange={e => setForm({...form, roles: [e.target.value]})}>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
      </div>
      <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button>
    </form>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="table-wrap"><table><thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Roles</th><th>Status</th><th>Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="empty">Loading users…</td></tr> : users.length === 0 ? <tr><td colSpan={6} className="empty">No accounts found.</td></tr> : users.map(user => <tr key={user.id}><td>{user.username}</td><td>{user.firstName} {user.lastName}</td><td>{user.email ?? '—'}</td><td>{user.roles.join(', ')}</td><td>{user.isActive ? 'Active' : 'Inactive'}</td><td><button className="secondary-button" onClick={() => void toggle(user)}>{user.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>
  </section>
}
