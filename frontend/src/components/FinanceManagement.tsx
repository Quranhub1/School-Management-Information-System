import { useEffect, useMemo, useState } from 'react'
import { getDashboard, getOutstandingBalances, getPayments, type FinanceDashboard, type OutstandingBalance } from '../api/finance'
import { formatCurrency } from '../lib/currency'
import { AccountsOverviewWorkspace } from './AccountsOverviewWorkspace'
import { AccountingReportsWorkspace } from './AccountingReportsWorkspace'
import { CashBankPositionReport } from './CashBankPositionReport'
import { FeeTypesManager } from './FeeTypesManager'
import { StudentFinanceDashboard } from './StudentFinanceDashboard'

type FinanceTab = 'overview' | 'student-accounts' | 'collections' | 'fees' | 'accounting' | 'reports'

type Payment = {
  id?: string
  receiptNumber?: string
  amount: number
  paymentMethod?: string
  reference?: string
  paidAt: string
  studentName?: string
  invoiceNumber?: string
}

const statusFor = (balance: number, billed = 0, paid = 0) => {
  if (balance <= 0 && billed > 0) return { label: 'Paid', tone: 'success' }
  const progress = billed > 0 ? paid / billed : 0
  if (progress >= .75) return { label: 'Near complete', tone: 'info' }
  if (progress >= .4) return { label: 'Partial', tone: 'warning' }
  return { label: 'Outstanding', tone: 'danger' }
}

const money = (value: number) => formatCurrency(Number(value) || 0)

export function FinanceManagement() {
  const [tab, setTab] = useState<FinanceTab>('overview')
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null)
  const [outstanding, setOutstanding] = useState<OutstandingBalance[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadOverview() {
    setLoading(true)
    setError('')
    try {
      const [summary, balances, recentPayments] = await Promise.all([
        getDashboard(),
        getOutstandingBalances(),
        getPayments(),
      ])
      setDashboard(summary)
      setOutstanding(balances)
      setPayments(recentPayments as Payment[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the finance dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOverview()
  }, [])

  const filteredOutstanding = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return outstanding
    return outstanding.filter(item =>
      [item.studentName, item.studentNumber, item.programmeName, item.status]
        .some(part => String(part ?? '').toLowerCase().includes(value)),
    )
  }, [outstanding, query])

  const collectionByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const payment of payments) {
      const key = new Date(payment.paidAt).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })
      map.set(key, (map.get(key) ?? 0) + Number(payment.amount || 0))
    }
    return [...map.entries()].slice(-7)
  }, [payments])

  const maxCollection = Math.max(...collectionByDate.map(([, amount]) => amount), 1)
  const collectionRate = dashboard && dashboard.totalBilled > 0
    ? Math.min(100, Math.max(0, dashboard.totalPaid / dashboard.totalBilled * 100))
    : 0

  return (
    <section className="finance-workspace" aria-label="Finance and accounting workspace">
      <div className="workspace-header finance-workspace-header">
        <div>
          <p className="eyebrow">FINANCE & ACCOUNTS · UGX</p>
          <h2>Finance & Accounting</h2>
          <p>Student billing, collections, receivables and accounting controls in one finance workspace.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={() => void loadOverview()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      <div className="finance-tab-strip" role="tablist" aria-label="Finance sections">
        {([
          ['overview', 'Overview'],
          ['student-accounts', 'Student Accounts'],
          ['collections', 'Collections'],
          ['fees', 'Fee Structures'],
          ['accounting', 'Accounting'],
          ['reports', 'Reports'],
        ] as [FinanceTab, string][]).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {tab === 'overview' && (
        <>
          <div className="finance-kpi-grid">
            <article className="finance-kpi finance-kpi-blue"><span>Total billed</span><strong>{dashboard ? money(dashboard.totalBilled) : '—'}</strong><small>Current student billing</small></article>
            <article className="finance-kpi finance-kpi-green"><span>Total collected</span><strong>{dashboard ? money(dashboard.totalPaid) : '—'}</strong><small>Posted student payments</small></article>
            <article className="finance-kpi finance-kpi-red"><span>Outstanding</span><strong>{dashboard ? money(dashboard.totalOutstanding) : '—'}</strong><small>Receivables requiring follow-up</small></article>
            <article className="finance-kpi finance-kpi-orange"><span>Today's collection</span><strong>{dashboard ? money(dashboard.todayCollection) : '—'}</strong><small>Payments posted today</small></article>
          </div>

          <div className="finance-overview-grid">
            <section className="finance-surface finance-collection-panel">
              <div className="finance-surface-heading"><div><span className="eyebrow">COLLECTION PERFORMANCE</span><h3>Fee collection</h3></div><strong>{collectionRate.toFixed(0)}%</strong></div>
              <div className="finance-progress-track"><div style={{ width: collectionRate + '%' }} /></div>
              <div className="finance-mini-stats"><span>Paid <strong>{dashboard ? money(dashboard.totalPaid) : '—'}</strong></span><span>Balance <strong>{dashboard ? money(dashboard.totalOutstanding) : '—'}</strong></span><span>Invoices <strong>{dashboard?.invoiceCount.toLocaleString() ?? '—'}</strong></span></div>
              <div className="finance-bar-chart" aria-label="Recent daily collection activity">
                {collectionByDate.length === 0 ? <div className="empty">No recent collection activity.</div> : collectionByDate.map(([day, amount]) => <div className="finance-bar-item" key={day}><div className="finance-bar-value">{money(amount)}</div><div className="finance-bar-track"><span style={{ height: Math.max(8, amount / maxCollection * 100) + '%' }} /></div><small>{day}</small></div>)}
              </div>
            </section>

            <section className="finance-surface">
              <div className="finance-surface-heading"><div><span className="eyebrow">FINANCE CONTROL</span><h3>Account health</h3></div></div>
              <div className="finance-control-list">
                <div><span>Open receivables</span><strong className="finance-value-danger">{dashboard?.outstandingCount.toLocaleString() ?? '—'}</strong></div>
                <div><span>Payment records</span><strong>{dashboard?.paymentCount.toLocaleString() ?? '—'}</strong></div>
                <div><span>Collection rate</span><strong className="finance-value-success">{collectionRate.toFixed(1)}%</strong></div>
                <div><span>Currency</span><strong>UGX</strong></div>
              </div>
              <div className="finance-legend"><span><i className="finance-dot success" />Paid / collected</span><span><i className="finance-dot warning" />Partial</span><span><i className="finance-dot danger" />Outstanding</span></div>
            </section>
          </div>

          <section className="finance-surface" style={{ marginTop: 18 }}>
            <div className="finance-surface-heading"><div><span className="eyebrow">SCHOOL FEES WORKSPACE</span><h3>SchoolPay-style collection view</h3><p>Searchable student accounts, payment status, collection indicators and transaction tables, adapted to SMIS finance data.</p></div><button type="button" className="secondary-button" onClick={() => setTab('collections')}>Open collections</button></div>
            <div className="finance-table-toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search student name / code / programme" aria-label="Search finance accounts" /><span>{filteredOutstanding.length.toLocaleString()} outstanding accounts</span></div>
            <div className="table-wrap"><table className="finance-table"><thead><tr><th>Student</th><th>Programme</th><th>Balance</th><th>Status</th><th>Collection indicator</th></tr></thead><tbody>
              {filteredOutstanding.slice(0, 8).map(item => { const s = statusFor(item.balance, item.amount, item.paidAmount); const progress = item.amount > 0 ? Math.min(100, item.paidAmount / item.amount * 100) : 0; return <tr key={item.studentId}><td><strong>{item.studentName}</strong><small>{item.studentNumber}</small></td><td>{item.programmeName}</td><td><strong className={s.tone === 'danger' ? 'finance-value-danger' : 'finance-value-success'}>{money(item.balance)}</strong></td><td><span className={'finance-status ' + s.tone}>{s.label}</span></td><td><div className="finance-row-progress"><span style={{ width: progress + '%' }} /></div><small>{progress.toFixed(0)}% collected</small></td></tr> })}
              {filteredOutstanding.length === 0 && <tr><td colSpan={5} className="empty">No matching outstanding accounts.</td></tr>}
            </tbody></table></div>
          </section>
        </>
      )}

      {tab === 'student-accounts' && <StudentFinanceDashboard />}

      {tab === 'collections' && (
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">COLLECTIONS</span><h3>Payments & receipts</h3><p>Real-time-style transaction table for posted finance payments. Payment channels are deliberately not used to drive the interface.</p></div></div>
          <div className="finance-table-toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search receipt / student / reference" aria-label="Search payments" /><span>{payments.length.toLocaleString()} transactions loaded</span></div>
          <div className="table-wrap"><table className="finance-table"><thead><tr><th>Date</th><th>Receipt</th><th>Student</th><th>Invoice</th><th>Amount</th><th>Status</th></tr></thead><tbody>
            {payments.filter(p => !query.trim() || [p.receiptNumber,p.studentName,p.invoiceNumber,p.reference].some(v => String(v ?? '').toLowerCase().includes(query.trim().toLowerCase()))).map((payment, index) => <tr key={payment.id ?? index}><td>{new Date(payment.paidAt).toLocaleString('en-UG')}</td><td><strong>{payment.receiptNumber ?? '—'}</strong><small>{payment.reference ?? 'No reference'}</small></td><td>{payment.studentName ?? '—'}</td><td>{payment.invoiceNumber ?? '—'}</td><td><strong className="finance-value-success">{money(payment.amount)}</strong></td><td><span className="finance-status success">Posted</span></td></tr>)}
            {payments.length === 0 && <tr><td colSpan={6} className="empty">No payment transactions found.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {tab === 'fees' && <FeeTypesManager />}

      {tab === 'accounting' && (
        <section className="finance-accounting-layout">
          <div className="finance-surface"><div className="finance-surface-heading"><div><span className="eyebrow">ACCOUNTING</span><h3>Accounts & payroll control</h3><p>Receivables, payments, payroll and finance administration are grouped here for the bursar and accounts office.</p></div></div><AccountsOverviewWorkspace /></div>
          <div className="finance-surface" style={{ marginTop: 18 }}><div className="finance-surface-heading"><div><span className="eyebrow">DOUBLE-ENTRY ACCOUNTING</span><h3>Core accounting reports</h3><p>Chart of accounts, general ledger, trial balance, income statement and balance sheet, all presented in UGX.</p></div></div><AccountingReportsWorkspace /></div>
        </section>
      )}

      {tab === 'reports' && (
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">FINANCIAL REPORTING</span><h3>Financial reports</h3><p>Period-based finance reporting with UGX presentation and reconciliation visibility.</p></div></div>
          <CashBankPositionReport />
        </section>
      )}
    </section>
  )
}
