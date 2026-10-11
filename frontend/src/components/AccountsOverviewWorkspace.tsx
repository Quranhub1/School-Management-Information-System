import { useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(path: string): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${apiBase}${path}`, { headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.')
  if (response.status === 403) throw new Error('Your role is not authorized to read finance accounts.')
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return await response.json() as T
}

type Dashboard = { totalBilled: number; totalPaid: number; totalOutstanding: number; todayCollection: number; invoiceCount: number; paymentCount: number; outstandingCount: number }
type Outstanding = { studentId: string; studentNumber: string; studentName: string; programmeName: string; balance: number; currency: string; status: string }
type Payment = { id: string; receiptNumber: string; amount: number; paymentMethod: string; reference?: string; paidAt: string; studentName: string; invoiceNumber?: string }
type Payroll = { id: string; staffName: string; staffNumber: string; month: number; year: number; basicSalary: number; allowances: number; deductions: number; netPay: number; status: string; paymentMethod?: string }

type Tab = 'dashboard' | 'outstanding' | 'payments' | 'payroll'
const money = (n: number) => `UGX ${n.toLocaleString('en-UG')}`

export function AccountsOverviewWorkspace() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [outstanding, setOutstanding] = useState<Outstanding[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [payroll, setPayroll] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      if (tab === 'dashboard') setDashboard(await request<Dashboard>('/api/accounts-overview/dashboard'))
      if (tab === 'outstanding') setOutstanding(await request<Outstanding[]>('/api/accounts-overview/outstanding'))
      if (tab === 'payments') setPayments(await request<Payment[]>('/api/accounts-overview/payments'))
      if (tab === 'payroll') setPayroll(await request<Payroll[]>('/api/accounts-overview/payroll'))
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load accounts overview.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [tab])

  return <section aria-label="Accounts overview">
    <div className="library-workspace-tabs" role="tablist" aria-label="Accounts overview sections">
      {(['dashboard', 'outstanding', 'payments', 'payroll'] as Tab[]).map(x => <button key={x} role="tab" aria-selected={tab === x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>{x === 'dashboard' ? 'Dashboard' : x[0].toUpperCase() + x.slice(1)}</button>)}
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading accounts…</p> : tab === 'dashboard' && dashboard ? <div className="summary-grid">
      <div className="summary-card"><span>Total billed</span><strong>{money(dashboard.totalBilled)}</strong></div>
      <div className="summary-card"><span>Total collected</span><strong>{money(dashboard.totalPaid)}</strong></div>
      <div className="summary-card"><span>Outstanding</span><strong>{money(dashboard.totalOutstanding)}</strong></div>
      <div className="summary-card"><span>Today collection</span><strong>{money(dashboard.todayCollection)}</strong></div>
      <div className="summary-card"><span>Invoices</span><strong>{dashboard.invoiceCount.toLocaleString()}</strong></div>
      <div className="summary-card"><span>Payments</span><strong>{dashboard.paymentCount.toLocaleString()}</strong></div>
      <div className="summary-card"><span>Open invoices</span><strong>{dashboard.outstandingCount.toLocaleString()}</strong></div>
    </div> : tab === 'outstanding' ? <div className="table-wrap"><table><thead><tr><th>Student</th><th>Programme</th><th>Balance</th><th>Status</th></tr></thead><tbody>{outstanding.map(x => <tr key={`${x.studentId}-${x.balance}`}><td><strong>{x.studentName}</strong><br /><small>{x.studentNumber}</small></td><td>{x.programmeName}</td><td>{money(x.balance)}</td><td>{x.status}</td></tr>)}</tbody></table>{outstanding.length === 0 && <p className="empty">No outstanding balances.</p>}</div> : tab === 'payments' ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Receipt</th><th>Student</th><th>Method</th><th>Amount</th></tr></thead><tbody>{payments.map(x => <tr key={x.id}><td>{new Date(x.paidAt).toLocaleDateString('en-UG')}</td><td>{x.receiptNumber}</td><td>{x.studentName}</td><td>{x.paymentMethod}</td><td>{money(x.amount)}</td></tr>)}</tbody></table>{payments.length === 0 && <p className="empty">No payments found.</p>}</div> : <div className="table-wrap"><table><thead><tr><th>Staff</th><th>Period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net pay</th><th>Status</th></tr></thead><tbody>{payroll.map(x => <tr key={x.id}><td><strong>{x.staffName}</strong><br /><small>{x.staffNumber}</small></td><td>{x.month}/{x.year}</td><td>{money(x.basicSalary)}</td><td>{money(x.allowances)}</td><td>{money(x.deductions)}</td><td>{money(x.netPay)}</td><td>{x.status}</td></tr>)}</tbody></table>{payroll.length === 0 && <p className="empty">No payroll records found.</p>}</div>}
  </section>
}
