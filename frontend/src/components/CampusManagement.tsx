import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { getAccessToken } from '../api/auth'

const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
type Campus = { id: string; code: string; name: string; address: string | null; district: string | null; isActive: boolean }
type CampusUser = { userId: string; username: string; firstName: string; lastName: string; isActive: boolean; isPrimary: boolean; assignedAt: string }
type UserSummary = { id: string; username: string; firstName: string; lastName: string; isActive: boolean }
type Form = { code: string; name: string; address: string; district: string }
const blank: Form = { code: '', name: '', address: '', district: '' }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(base + path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (response.status === 401) throw Error('Session expired. Sign in again.')
  if (response.status === 403) throw Error('Your role is not authorized to manage campus access.')
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw Error(body?.message ?? `Request failed (${response.status})`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export function CampusManagement() {
  const [items, setItems] = useState<Campus[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [assignments, setAssignments] = useState<CampusUser[]>([])
  const [selectedCampusId, setSelectedCampusId] = useState('')
  const [assignmentUserId, setAssignmentUserId] = useState('')
  const [primary, setPrimary] = useState(false)
  const [form, setForm] = useState<Form>(blank)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [campuses, activeUsers] = await Promise.all([
        request<Campus[]>('/api/campuses'),
        request<UserSummary[]>('/api/administration/users'),
      ])
      setItems(campuses)
      setUsers(activeUsers.filter(user => user.isActive))
      setSelectedCampusId(current => current && campuses.some(c => c.id === current) ? current : campuses[0]?.id ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load campus data.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAssignments = useCallback(async () => {
    if (!selectedCampusId) {
      setAssignments([])
      return
    }
    setLoadingAssignments(true)
    try {
      setAssignments(await request<CampusUser[]>(`/api/campuses/${selectedCampusId}/users`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load campus user assignments.')
    } finally {
      setLoadingAssignments(false)
    }
  }, [selectedCampusId])

  useEffect(() => { void load() }, [load])
  useEffect(() => { void loadAssignments() }, [loadAssignments])

  const reset = () => { setEditId(null); setForm(blank) }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      await request(`/api/campuses${editId ? '/' + editId : ''}`, {
        method: editId ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...form, address: form.address || null, district: form.district || null }),
      })
      setNotice(editId ? 'Campus updated.' : 'Campus added.')
      reset()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save campus.')
    } finally { setSaving(false) }
  }

  async function toggle(campus: Campus) {
    try {
      await request(`/api/campuses/${campus.id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !campus.isActive }),
      })
      setItems(rows => rows.map(row => row.id === campus.id ? { ...row, isActive: !row.isActive } : row))
      setNotice(campus.isActive ? 'Campus deactivated; records retained.' : 'Campus activated.')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update campus status.')
    }
  }

  async function assignUser(event: FormEvent) {
    event.preventDefault()
    if (!selectedCampusId || !assignmentUserId) return
    setSaving(true); setError(''); setNotice('')
    try {
      await request(`/api/campuses/${selectedCampusId}/users`, {
        method: 'PUT',
        body: JSON.stringify({ userId: assignmentUserId, isPrimary: primary }),
      })
      setNotice('Campus access assignment saved.')
      setAssignmentUserId('')
      setPrimary(false)
      await loadAssignments()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign user to campus.')
    } finally { setSaving(false) }
  }

  async function revokeUser(user: CampusUser) {
    if (!selectedCampusId || !window.confirm(`Revoke ${user.username}'s access to this campus?`)) return
    try {
      await request(`/api/campuses/${selectedCampusId}/users/${user.userId}`, { method: 'DELETE' })
      setNotice('Campus access revoked.')
      await loadAssignments()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not revoke campus access.')
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Campus management</h1><p className="mt-1 text-sm text-slate-600">Manage campuses and assign staff accounts to the sites they serve.</p></div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><RefreshCw size={15} /> Refresh</button>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4"><p className="text-sm text-slate-500">Total campuses</p><strong className="text-2xl">{items.length}</strong></div>
        <div className="rounded-lg border bg-white p-4"><p className="text-sm text-slate-500">Active campuses</p><strong className="text-2xl">{items.filter(c => c.isActive).length}</strong></div>
        <div className="rounded-lg border bg-white p-4"><p className="text-sm text-slate-500">Assigned user access</p><strong className="text-2xl">{assignments.length}</strong></div>
      </div>
      {(error || notice) && <p role={error ? 'alert' : 'status'} className={`rounded-md border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</p>}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="overflow-x-auto rounded-lg border bg-white">
          <h2 className="border-b p-4 font-semibold">Registered campuses</h2>
          {loading ? <p className="flex items-center gap-2 p-5 text-sm"><LoaderCircle size={16} className="animate-spin" /> Loading…</p> : !items.length ? <div className="p-8 text-center"><Building2 className="mx-auto text-slate-400" /><p className="mt-2 font-medium">No campuses registered</p><p className="text-sm text-slate-500">Add the main campus first, then the other sites.</p></div> :
            <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Campus</th><th className="p-3">Location</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y">
              {items.map(campus => <tr key={campus.id} className={selectedCampusId === campus.id ? 'bg-slate-50' : ''}>
                <td className="p-3"><button type="button" onClick={() => setSelectedCampusId(campus.id)} className="text-left"><strong>{campus.name}</strong><div className="text-xs text-slate-500">{campus.code}</div></button></td>
                <td className="p-3">{[campus.address, campus.district].filter(Boolean).join(', ') || '—'}</td>
                <td className="p-3">{campus.isActive ? 'Active' : 'Inactive'}</td>
                <td className="p-3"><button title="Edit campus" aria-label={`Edit ${campus.name}`} onClick={() => { setEditId(campus.id); setForm({ code: campus.code, name: campus.name, address: campus.address ?? '', district: campus.district ?? '' }) }} className="mr-2 rounded p-2 hover:bg-slate-100"><Pencil size={15} /></button><button onClick={() => void toggle(campus)} className="text-xs underline">{campus.isActive ? 'Deactivate' : 'Activate'}</button></td>
              </tr>)}
            </tbody></table>}
        </div>
        <form onSubmit={submit} className="h-fit rounded-lg border bg-white p-4">
          <div className="mb-4 flex justify-between"><h2 className="font-semibold">{editId ? 'Edit campus' : 'Add campus'}</h2>{editId && <button type="button" onClick={reset}><X size={16} /></button>}</div>
          <div className="space-y-3">{(['name', 'code', 'address', 'district'] as const).map(key => <label key={key} className="block text-sm font-medium capitalize">{key}{key === 'name' || key === 'code' ? ' *' : ''}<input required={key === 'name' || key === 'code'} maxLength={key === 'name' ? 200 : key === 'code' ? 50 : 500} value={form[key]} onChange={e => setForm(value => ({ ...value, [key]: key === 'code' ? e.target.value.toUpperCase() : e.target.value }))} placeholder={key === 'name' ? 'Main Campus' : key === 'code' ? 'MAIN' : ''} className="mt-1 block w-full rounded-md border px-3 py-2 font-normal" /></label>)}</div>
          <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={reset} className="rounded-md border px-3 py-2 text-sm">Clear</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}{saving ? 'Saving…' : editId ? 'Save changes' : 'Add campus'}</button></div>
        </form>
      </div>

      <section className="overflow-hidden rounded-lg border bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-semibold">Campus user access</h2><p className="text-sm text-slate-500">Choose a campus to manage which user accounts can access its student records.</p></div>
          <select aria-label="Campus to manage access for" value={selectedCampusId} onChange={e => setSelectedCampusId(e.target.value)} className="rounded-md border px-3 py-2 text-sm"><option value="">Select campus</option>{items.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</select>
        </header>
        <form onSubmit={assignUser} className="grid gap-3 border-b p-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <label className="block text-sm font-medium">User account<select required value={assignmentUserId} onChange={e => setAssignmentUserId(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2 font-normal"><option value="">Select active user</option>{users.map(user => <option key={user.id} value={user.id}>{user.username} — {user.firstName} {user.lastName}</option>)}</select></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={primary} onChange={e => setPrimary(e.target.checked)} /> Primary campus</label>
          <button type="submit" disabled={!selectedCampusId || !assignmentUserId || saving} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">Assign access</button>
        </form>
        {loadingAssignments ? <p className="p-4 text-sm text-slate-500">Loading assignments…</p> : !selectedCampusId ? <p className="p-4 text-sm text-slate-500">Select a campus to manage access.</p> : assignments.length === 0 ? <p className="p-4 text-sm text-slate-500">No user accounts are assigned to this campus.</p> :
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">User</th><th className="p-3">Primary</th><th className="p-3">Assigned</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y">{assignments.map(user => <tr key={user.userId}><td className="p-3"><strong>{user.firstName} {user.lastName}</strong><div className="text-xs text-slate-500">{user.username}</div></td><td className="p-3">{user.isPrimary ? 'Yes' : 'No'}</td><td className="p-3">{new Date(user.assignedAt).toLocaleDateString()}</td><td className="p-3"><button type="button" onClick={() => void revokeUser(user)} className="inline-flex items-center gap-1 text-red-700"><Trash2 size={14} /> Revoke</button></td></tr>)}</tbody></table></div>}
      </section>
    </section>
  )
}
