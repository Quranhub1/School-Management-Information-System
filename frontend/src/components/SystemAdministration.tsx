import { useEffect, useState } from 'react'
import { getUsers, setUserActive, type UserSummary } from '../api/administration'
import { useInstitutionSettings } from './InstitutionSettingsContext'

export function SystemAdministration() {
  const { institution } = useInstitutionSettings()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', roles: [] })
  const [actionBusy, setActionBusy] = useState(false)
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null)
  const [passwordResetValue, setPasswordResetValue] = useState('')
  const [viewingUser, setViewingUser] = useState<UserSummary | null>(null)

  function openWorkspace(workspace?: string) {
    if (!workspace) return
    window.dispatchEvent(new CustomEvent('smis:navigate-module', { detail: workspace }))
  }

  async function load() {
    setLoading(true)
    setError('')
    try { setUsers(await getUsers()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load users.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function toggle(user: UserSummary) {
    setError('')
    setActionBusy(true)
    try {
      const updated = await setUserActive(user.id, !user.isActive)
      setUsers(current => current.map(item => item.id === updated.id ? updated : item))
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update account status.') }
    finally { setActionBusy(false) }
  }

  function beginEdit(user: UserSummary) {
    setEditingUserId(user.id)
    setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email ?? '', roles: [...user.roles] })
    setError('')
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault()
    if (!editingUserId) return
    setActionBusy(true)
    setError('')
    try {
      const updated = await updateUser(editingUserId, editForm)
      setUsers(current => current.map(item => item.id === updated.id ? updated : item))
      setEditingUserId(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save user changes.') }
    finally { setActionBusy(false) }
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault()
    if (!passwordResetUserId) return
    if (passwordResetValue.length < 8) {
      setError('Password must contain at least 8 characters.')
      setSuccessMessage('')
      return
    }
    const targetUser = users.find(user => user.id === passwordResetUserId)
    setActionBusy(true)
    setError('')
    setSuccessMessage('')
    try {
      await resetUserPassword(passwordResetUserId, passwordResetValue)
      setSuccessMessage(`Password changed successfully for ${targetUser?.username ?? 'the selected user'}.`)
      setPasswordResetUserId(null)
      setPasswordResetValue('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to change password.') }
    finally { setActionBusy(false) }
  }

  async function removeAccess(user: UserSummary) {
    if (!user.isActive || !window.confirm(`Remove sign-in access for ${user.username}? Their records will be retained.`)) return
    await toggle(user)
  }

  return (
    <section className="panel" aria-label="System administration" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <p className="eyebrow">SYSTEM ADMINISTRATION</p>
        </div>
        <div>
          <h2>System Administration</h2>
        </div>
        <div style={{ flex: '1' }}>
          <span className="status">{users.filter(u => u.isActive).length} active users</span>
        </div>
      </div>

      <div className="sheet-content" style={{ flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
        {error && <div className="error" role="alert" style={{ margin: '16px' }}>{error}</div>}
        {successMessage && <div className="success" role="status" style={{ margin: '16px' }}>{successMessage}</div>}

        <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
          <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Username</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Roles</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Last Login</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr style={{ height: '60px' }}>
                    <td colSpan={7} className="empty" style={{ padding: '16px', textAlign: 'center' }}>Loading users…</td>
                  </tr>
                ) : (
                  users.length === 0 ? (
                    <tr style={{ height: '60px' }}>
                      <td colSpan={7} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No accounts found.</td>
                    </tr
                  ) : (
                    users.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>{user.username}</td>
                        <td style={{ padding: '12px 16px' }}>{user.firstName} {user.lastName}</td>
                        <td style={{ padding: '12px 16px' }}>{user.email ?? '—'}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {user.roles.map(role => (
                              <span key={role} style={{
                                padding: '3px 10px',
                                borderRadius: '999px',
                                background: role === 'SystemAdministrator' ? '#1e40af' : '#78716c',
                                color: 'white',
                                fontSize: '.68rem',
                                fontWeight: 800,
                              }}>
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
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
                        <td style={{ padding: '12px 16px' }}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minWidth: '250px' }}>
                            <button type="button" className="secondary-button" onClick={() => setViewingUser(user)} disabled={actionBusy}>View</button>
                            <button type="button" className="secondary-button" onClick={() => beginEdit(user)} disabled={actionBusy}>Edit / Modify</button>
                            <button type="button" className="secondary-button" onClick={() => { setPasswordResetUserId(user.id); setPasswordResetValue(''); setError(''); setSuccessMessage('') }} disabled={actionBusy}>Reset password</button>
                            <button type="button" className="secondary-button" onClick={() => void toggle(user)} disabled={actionBusy}>{user.isActive ? 'Deactivate' : 'Activate'}</button>
                            {user.isActive && <button type="button" className="secondary-button" onClick={() => void removeAccess(user)} disabled={actionBusy}>Remove access</button>}
                          </div>
                        </td>
                      </tr
                    ))}
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {editingUserId && (
          <div className="panel" style={{ margin: '16px' }}>
            <div className="panel-heading" style={{ marginBottom: '12px', padding: '0 16px' }}>
              <div>
                <p className="eyebrow">ACCOUNT SETTINGS</p>
                <h3>Edit user account</h3>
              </div>
            </div>
            <div className="form-container" style={{ margin: '16px' }}>
              <form className="student-form" onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label>First name<input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} required /></label>
                  <label>Last name<input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} required /></label>
                  <label>Email<input type="email" value={editForm.email ?? ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></label>
                </div>
                <fieldset style={{ border: '1px solid var(--border, #dbe2ea)', borderRadius: 10, padding: '12px', margin: '12px 0' }}>
                  <legend>Assigned roles (choose at least one)</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                    {[['SystemAdministrator', 'AcademicRegistrar', 'AssistantRegistrar', 'AdmissionsOfficer', 'Accountant', 'AssistantAccountant', 'Lecturer', 'ExaminationsOfficer', 'Student', 'SchoolWarden', 'Principal', 'Director', 'Secretary', 'ResidentDirector', 'HeadOfDepartment', 'Receptionist', 'AssistantPrincipal', 'Admin Secretary', 'Records Officer', 'Librarian', 'HR Manager']).map(role => <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={editForm.roles.includes(role)} onChange={e => setEditForm({ ...editForm, roles: editForm.roles.includes(role) ? [...editForm.roles, role] : editForm.roles.filter(item => item !== route) })} />
                      {route}
                    </label>)}
                  </div>
                </fieldset>
                <button type="submit" disabled={actionBusy || editForm.roles.length === 0}>{actionBusy ? 'Saving…' : 'Save changes'}</button>
                <button type="button" className="secondary-button" onClick={() => setEditingUserId(null)}>Cancel</button>
              </form>
            </div>
          </div>
        )}

        {passwordResetUserId && (
          <div className="panel" style={{ margin: '16px' }}>
            <div className="panel-heading" style={{ marginBottom: '12px', padding: '0 16px' }}>
              <div>
                <p className="eyebrow">CREDENTIALS</p>
                <h3>Reset password for {users.find(user => user.id === passwordResetUserId)?.username ?? 'user'}</h3>
              </div>
            </div>
            <div className="form-container" style={{ margin: '16px' }}>
              <form className="student-form" onSubmit={resetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label>New temporary password<input type="password" autoComplete="new-password" minLength={8} value={passwordResetValue} onChange={e => setPasswordResetValue(e.target.value)} required /></label>
                <button type="submit" disabled={actionBusy || passwordResetValue.length < 8}>{actionBusy ? 'Resetting…' : 'Reset password'}</button>
                <button type="button" className="secondary-button" onClick={() => { setPasswordResetUserId(null); setPasswordResetValue(''); setSuccessMessage('') }}>Cancel</button>
              </form>
            </div>
          </div>
        )}

        {viewingUser && (
          <div className="panel" style={{ margin: '16px' }}>
            <div className="panel-heading" style={{ marginBottom: '12px', padding: '0 16px' }}>
              <div>
                <p className="eyebrow">USER ACCOUNT</p>
                <h3>{viewingUser.firstName} {viewingUser.lastName}</h3>
              </div>
            </div>
            <div className="detail-container" style={{ margin: '16px' }}>
              <div className="detail-item" style={{ marginBottom: '8px' }}>
                <span>Username:</span> <strong>{viewingUser.username}</strong>
              </div>
              <div className="detail-item" style={{ marginBottom: '8px' }}>
                <span>Email:</span> <strong>{viewingUser.email || '—'}</strong>
              </div>
              <div className="detail-item" style={{ marginBottom: '8px' }}>
                <span>Roles:</span> <strong>{viewingUser.roles.join(', ') || 'No roles assigned'}</strong>
              </div>
              <div className="detail-item" style={{ marginBottom: '8px' }}>
                <span>Status:</span> <strong>{viewingUser.isActive ? 'Active' : 'Inactive'}</strong>
              </div>
              <div className="detail-item" style={{ marginBottom: '8px' }}>
                <span>Created:</span> <strong>{new Date(viewingUser.createdAt).toLocaleString()}</strong>
              </div>
              <div className="detail-item" style={{ marginBottom: '8px' }}>
                <span>Last login:</span> <strong>{viewingUser.lastLoginAt ? new Date(viewingUser.lastLoginAt).toLocaleString() : 'Never'}</strong>
              </div>
              <div className="detail-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => { beginEdit(viewingUser); setViewingUser(null) }}>Edit / Modify</button>
                <button type="button" className="secondary-button" onClick={() => setViewingUser(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}