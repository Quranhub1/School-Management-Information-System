import { useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'
import { AgGridTable } from './AgGridTable'
import type { ColDef } from 'ag-grid-community'

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
type Payment = { id: string; receiptNumber: string; amount: number; paymentMethod: string; paymentSource: string; sourceChannel?: string; providerTransactionId?: string; reference?: string; paidAt: string; studentName: string; invoiceNumber?: string }
type Payroll = { id: string; staffName: string; staffNumber: string; month: number; year: number; basicSalary: number; allowances: number; deductions: number; netPay: number; status: string; paymentMethod?: string }

type Tab = 'dashboard' | 'outstanding' | 'payments' | 'payroll'

const outstandingColumns: ColDef<Outstanding>[] = [
  { field: 'studentNumber', headerName: 'Student Number' },
  { field: 'studentName', headerName: 'Student Name' },
  { field: 'programmeName', headerName: 'Programme' },
  { field: 'balance', headerName: 'Balance (UGX)', valueFormatter: p => money(Number(p.value) || 0) },
  { field: 'status', headerName: 'Status' },
]
const paymentColumns: ColDef<Payment>[] = [
  { field: 'paidAt', headerName: 'Date', valueFormatter: p => p.value ? new Date(String(p.value)).toLocaleDateString('en-UG') : '—' },
  { field: 'receiptNumber', headerName: 'Receipt' },
  { field: 'studentName', headerName: 'Student' },
  { field: 'paymentSource', headerName: 'Payment Source' },
  { field: 'sourceChannel', headerName: 'Channel' },
  { field: 'amount', headerName: 'Amount (UGX)', valueFormatter: p => money(Number(p.value) || 0) },
]
const payrollColumns: ColDef<Payroll>[] = [
  { field: 'staffNumber', headerName: 'Staff Number' },
  { field: 'staffName', headerName: 'Staff' },
  { headerName: 'Period', valueGetter: p => p.data ? `${p.data.month}/${p.data.year}` : '—' },
  { field: 'basicSalary', headerName: 'Basic (UGX)', valueFormatter: p => money(Number(p.value) || 0) },
  { field: 'allowances', headerName: 'Allowances (UGX)', valueFormatter: p => money(Number(p.value) || 0) },
  { field: 'deductions', headerName: 'Deductions (UGX)', valueFormatter: p => money(Number(p.value) || 0) },
  { field: 'netPay', headerName: 'Net Pay (UGX)', valueFormatter: p => money(Number(p.value) || 0) },
  { field: 'status', headerName: 'Status' },
]
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
    </div> : tab === 'outstanding' ? <AgGridTable rows={outstanding} columns={outstandingColumns} getRowId={p => p.data.studentId} exportFileName="accounts-outstanding-balances" /> : tab === 'payments' ? <AgGridTable rows={payments} columns={paymentColumns} getRowId={p => p.data.id} exportFileName="accounts-payments" /> : <AgGridTable rows={payroll} columns={payrollColumns} getRowId={p => p.data.id} exportFileName="accounts-payroll-summary" />}
  </section>
}
