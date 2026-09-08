import { useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'

type Child = {
  studentId: string
  studentNumber: string
  fullName: string
  status: string
  relationship?: string | null
  latestGpa?: number | null
  cgpa?: number | null
  outstandingBalance: number
  outstandingInvoices: number
}

async function request<T>(path: string): Promise<T> {
  const token = getAccessToken()
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const response = await fetch(`${base}${path}`, { headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { const body = await response.json() as { message?: string }; if (body.message) message = body.message } catch { /* keep status message */ }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

const money = (value: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(value)

export function ParentPortalWorkspace() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { setChildren(await request<Child[]>('/api/parent-portal/me')) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load parent portal.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  return <section className="panel" aria-label="Parent Portal">
    <div className="panel-heading"><div><p className="eyebrow">PARENT</p><h2>Parent Portal</h2></div><button className="secondary-button" onClick={() => void load()} disabled={loading}>Refresh</button></div>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading linked students…</p> : children.length === 0 ? <p className="empty">No linked students found.</p> : <>
      <div className="summary-grid">{children.map(child => <article className="summary-card" key={child.studentId}><span>Student</span><strong>{child.fullName}</strong><small>{child.studentNumber} · {child.status}</small></article>)}</div>
      <div className="table-wrap"><table><thead><tr><th>Student</th><th>Relationship</th><th>Latest GPA</th><th>CGPA</th><th>Outstanding</th><th>Open Invoices</th></tr></thead><tbody>
        {children.map(child => <tr key={child.studentId}><td>{child.fullName}<br /><small>{child.studentNumber}</small></td><td>{child.relationship ?? '—'}</td><td>{child.latestGpa == null ? '—' : child.latestGpa.toFixed(2)}</td><td>{child.cgpa == null ? '—' : child.cgpa.toFixed(2)}</td><td>{money(child.outstandingBalance)}</td><td>{child.outstandingInvoices}</td></tr>)}
      </tbody></table></div>
    </>}
  </section>
}
