import { useEffect, useMemo, useState } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { getSession } from '../api/auth'
import { getDashboard, getOutstandingBalances, getPayments, type FinanceDashboard, type OutstandingBalance } from '../api/finance'
import { formatCurrency, SYSTEM_CURRENCY, SYSTEM_LOCALE } from '../lib/currency'
import { parseApiResponse } from '../lib/validation'
import { paymentListSchema } from '../schemas/finance.schema'
import { AccountsOverviewWorkspace } from './AccountsOverviewWorkspace'
import { AccountingReportsWorkspace } from './AccountingReportsWorkspace'
import { CashBankPositionReport } from './CashBankPositionReport'
import { FinanceControlCenter } from './FinanceControlCenter'
import { FeeTypesManager } from './FeeTypesManager'
import { StudentFinanceDashboard } from './StudentFinanceDashboard'
import { StaffAllowancesWorkspace } from './StaffAllowancesWorkspace'
import { AgGridTable } from './AgGridTable'
import { BarChart } from './charts'
import './FinanceManagement.css'

type FinanceTab = 'overview' | 'student-accounts' | 'collections' | 'fees' | 'accounting' | 'allowances' | 'reports'

export type Payment = {
  id?: string
  receiptNumber?: string
  amount: number
  currency?: string
  paymentMethod?: string
  paymentSource?: string
  sourceChannel?: string
  providerTransactionId?: string
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

const money = (value: number, currency: string = "UGX") => formatCurrency(Number(value) || 0, currency)

export function FinanceManagement({ readOnly = false }: { readOnly?: boolean } = {}) {
  const isAssistantAccountant = getSession()?.roles?.includes('AssistantAccountant') ?? false
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
      setPayments(parseApiResponse(paymentListSchema, recentPayments, 'payment list'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the finance dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOverview()
    const refreshFeePayments = async () => {
      try {
        setPayments(parseApiResponse(paymentListSchema, await getPayments(), 'payment list'))
      } catch {
        // Keep the last successful ticker data visible during temporary API failures.
      }
    }
    const intervalId = window.setInterval(() => { void refreshFeePayments() }, 15000)
    return () => window.clearInterval(intervalId)
  }, [])

  const outstandingColumns = useMemo<ColDef<OutstandingBalance>[]>(() => [
    { field: 'studentName', headerName: 'Student', minWidth: 180 },
    { field: 'studentNumber', headerName: 'Student No.', minWidth: 140 },
    { field: 'programmeName', headerName: 'Programme', minWidth: 180 },
    { field: 'balance', headerName: 'Balance', minWidth: 150, valueFormatter: params => money(Number(params.value ?? 0), params.data?.currency ?? "UGX") },
    { field: 'status', headerName: 'Status', minWidth: 130 },
  ], [])

  const recentPaymentColumns = useMemo<ColDef<Payment>[]>(() => [
    { field: 'receiptNumber', headerName: 'Receipt', minWidth: 150, valueFormatter: params => params.value || '—' },
    { field: 'studentName', headerName: 'Student', minWidth: 180, valueFormatter: params => params.value || '—' },
    { field: 'amount', headerName: 'Amount', minWidth: 150, valueFormatter: params => money(Number(params.value ?? 0), params.data?.currency ?? "UGX") },
    { field: 'paymentSource', headerName: 'Payment Source', minWidth: 130, valueFormatter: params => params.value || '—' },
    { field: 'sourceChannel', headerName: 'Channel', minWidth: 150, valueFormatter: params => params.value || '—' },
    { field: 'paidAt', headerName: 'Date', minWidth: 150, valueFormatter: params => params.value ? new Date(params.value).toLocaleDateString(SYSTEM_LOCALE) : '—' },
  ], [])

  const accountColumns = useMemo<ColDef<OutstandingBalance>[]>(() => [
    { field: 'studentName', headerName: 'Student', minWidth: 190, cellRenderer: (params: ICellRendererParams<OutstandingBalance>) => <div><strong>{params.value}</strong><small>{params.data?.studentNumber}</small></div> },
    { field: 'programmeName', headerName: 'Programme', minWidth: 180 },
    { field: 'balance', headerName: 'Balance', minWidth: 150, cellRenderer: (params: ICellRendererParams<any>) => { const s = statusFor(Number(params.value ?? 0), params.data?.amount, params.data?.paidAmount); return <strong className={s.tone === 'danger' ? 'finance-value-danger' : 'finance-value-success'}>{money(Number(params.value ?? 0), params.data?.currency ?? "UGX")}</strong> } },
    { field: 'status', headerName: 'Status', minWidth: 130, cellRenderer: (params: ICellRendererParams<any>) => { const s = statusFor(Number(params.data?.balance ?? 0), params.data?.amount, params.data?.paidAmount); return <span className={'finance-status ' + s.tone}>{s.label}</span> } },
    { headerName: 'Collection', minWidth: 170, sortable: false, filter: false, cellRenderer: (params: ICellRendererParams<any>) => { const amount = Number(params.data?.amount ?? 0); const paid = Number(params.data?.paidAmount ?? 0); const progress = amount > 0 ? Math.min(100, paid / amount * 100) : 0; return <div><div className="finance-row-progress"><span style={{ width: progress + '%' }} /></div><small>{progress.toFixed(0)}% collected</small></div> } },
  ], [])

  const collectionColumns = useMemo<ColDef<Payment>[]>(() => [
    { field: 'paidAt', headerName: 'Date', minWidth: 180, valueFormatter: params => params.value ? new Date(params.value).toLocaleString(SYSTEM_LOCALE) : '—' },
    { field: 'receiptNumber', headerName: 'Receipt', minWidth: 160, cellRenderer: (params: ICellRendererParams<Payment>) => <div><strong>{params.value || '—'}</strong><small>{params.data?.reference || 'No reference'}</small></div> },
    { field: 'studentName', headerName: 'Student', minWidth: 180, valueFormatter: params => params.value || '—' },
    { field: 'invoiceNumber', headerName: 'Invoice', minWidth: 150, valueFormatter: params => params.value || '—' },
    { field: 'amount', headerName: 'Amount', minWidth: 160, cellRenderer: (params: ICellRendererParams<any>) => <strong className="finance-value-success">{money(Number(params.value ?? 0), params.data?.currency ?? "UGX")}</strong> },
    { headerName: 'Status', minWidth: 120, sortable: false, filter: false, cellRenderer: () => <span className="finance-status success">Posted</span> },
  ], [])

  const filteredOutstanding = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return outstanding
    return outstanding.filter(item =>
      [item.studentName, item.studentNumber, item.programmeName, item.status]
        .some(part => String(part ?? '').toLowerCase().includes(value)),
    )
  }, [outstanding, query])

  const collectionByDate = useMemo(() => {
    const totalsByCurrency = new Map<string, Map<string, number>>()
    const dateLabels = new Map<string, string>()
    for (const payment of payments) {
      const paidAt = new Date(payment.paidAt)
      if (!Number.isFinite(paidAt.getTime())) continue
      const dateKey = [paidAt.getFullYear(), String(paidAt.getMonth() + 1).padStart(2, '0'), String(paidAt.getDate()).padStart(2, '0')].join('-')
      const label = paidAt.toLocaleDateString(SYSTEM_LOCALE, { month: 'short', day: 'numeric' })
      const currency = (payment.currency || SYSTEM_CURRENCY).toUpperCase()
      dateLabels.set(dateKey, label)
      const currencyTotals = totalsByCurrency.get(currency) ?? new Map<string, number>()
      currencyTotals.set(dateKey, (currencyTotals.get(dateKey) ?? 0) + Number(payment.amount || 0))
      totalsByCurrency.set(currency, currencyTotals)
    }
    const dateKeys = [...dateLabels.keys()].sort().slice(-7)
    return {
      labels: dateKeys.map(key => dateLabels.get(key) ?? key),
      datasets: [...totalsByCurrency.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([currency, totals]) => ({
        label: currency + ' collections',
        data: dateKeys.map(key => totals.get(key) ?? 0),
      })),
    }
  }, [payments])

  const collectionRate = dashboard && dashboard.totalBilled > 0
    ? Math.min(100, Math.max(0, dashboard.totalPaid / dashboard.totalBilled * 100))
    : 0

  const tickerPayments = useMemo(() => [...payments]
    .filter(payment => Number(payment.amount) > 0 && payment.paidAt)
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
    .slice(0, 12), [payments])

  const feePaymentTicker = tickerPayments.length > 0 ? (
    <div className="finance-fee-ticker" aria-label="Latest posted student fee payments">
      <span className="finance-fee-ticker-label">LATEST FEE PAYMENTS</span>
      <div className="finance-fee-ticker-viewport">
        <div className="finance-fee-ticker-track">
          {[0, 1].map(copy => (
            <div className="finance-fee-ticker-group" key={copy} aria-hidden={copy === 1}>
              {tickerPayments.map((payment, index) => (
                <span className="finance-fee-ticker-item" key={(payment.id || payment.receiptNumber || payment.reference || 'fee') + '-' + index}>
                  <strong>PAID</strong>
                  <b>{money(Number(payment.amount), payment.currency ?? "UGX")}</b>
                  <span>{payment.studentName || 'Student'}</span>
                  {payment.receiptNumber && <small>Receipt {payment.receiptNumber}</small>}
                  <i aria-hidden="true">◆</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null

  if (readOnly) {
    return (
      <section className="finance-workspace" aria-label="Read-only finance overview">
        <div className="workspace-header finance-workspace-header">
          <div>
            <p className="eyebrow">FINANCE & ACCOUNTS · ' + SYSTEM_CURRENCY + ' · READ ONLY</p>
            <h2>Financial Oversight</h2>
          </div>
          <div className="page-actions">
            <span className="status-badge">View only</span>
            <button type="button" className="secondary-button" onClick={() => void loadOverview()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
          </div>
        </div>
        {feePaymentTicker}
        {error && <div className="error" role="alert">{error}</div>}
        {loading ? <p className="empty">Loading financial overview…</p> : (
          <>
            <div className="finance-kpi-grid">
              <article className="finance-kpi finance-kpi-blue"><span>Total billed</span><strong>{dashboard ? money(dashboard.totalBilled) : '—'}</strong></article>
              <article className="finance-kpi finance-kpi-green"><span>Total collected</span><strong>{dashboard ? money(dashboard.totalPaid) : '—'}</strong></article>
              <article className="finance-kpi finance-kpi-blue"><span>Outstanding</span><strong>{dashboard ? money(dashboard.totalOutstanding) : '—'}</strong></article>
              <article className="finance-kpi finance-kpi-green"><span>Today's collection</span><strong>{dashboard ? money(dashboard.todayCollection) : '—'}</strong></article>
            </div>
            {dashboard?.totalsByCurrency && dashboard.totalsByCurrency.length > 0 && (
              <div className="finance-currency-summary" aria-label="Financial totals by currency">
                <strong>Totals by currency</strong>
                {dashboard.totalsByCurrency.map(total => (
                  <span key={total.currency}>
                    <b>{total.currency}</b>
                    <span>Billed {money(total.billed, total.currency)}</span>
                    <span>Paid {money(total.paid, total.currency)}</span>
                    <span>Balance {money(total.balance, total.currency)}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="panel" style={{ marginTop: 20, padding: 20 }}>
              <h3>Outstanding Balances</h3>
              <div style={{ marginTop: 12 }}>
                <AgGridTable rows={outstanding} columns={outstandingColumns} height={360} pageSize={10} />
              </div>
            </div>
            <div className="panel" style={{ marginTop: 20, padding: 20 }}>
              <h3>Recent Payments</h3>
              <div style={{ marginTop: 12 }}>
                <AgGridTable rows={payments} columns={recentPaymentColumns} height={360} pageSize={10} />
              </div>
            </div>
          </>
        )}
      </section>
    )
  }

  return (
    <section className="finance-workspace" aria-label="Finance and accounting workspace">
        <div className="workspace-header finance-workspace-header">
        <div>
          <p className="eyebrow">FINANCE & ACCOUNTS · ' + SYSTEM_CURRENCY + '</p>
          <h2>Finance & Accounting</h2>
          <p>Billing, collections and accounting controls.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={() => void loadOverview()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      {feePaymentTicker}

      <div className="finance-tab-strip" role="tablist" aria-label="Finance sections">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'student-accounts', label: 'Student Fees & Payments' },
          { key: 'collections', label: 'Collections' },
          ...(isAssistantAccountant ? [] : [{ key: 'fees', label: 'Fee Structures' }, { key: 'accounting', label: 'Accounting' }]),
          { key: 'allowances', label: 'Staff Allowances' },
          { key: 'reports', label: 'Reports' },
        ] as { key: FinanceTab; label: string }[]).map((item) => (
          <button key={item.key} role="tab" aria-selected={tab === item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>
        ))}
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {tab === 'overview' && (
        <>
          <FinanceControlCenter onNavigate={nextTab => setTab(nextTab)} />
          <div className="finance-kpi-grid">
            <article className="finance-kpi finance-kpi-blue"><span>Total billed</span><strong>{dashboard ? money(dashboard.totalBilled) : '—'}</strong><small>Current student billing</small></article>
            <article className="finance-kpi finance-kpi-green"><span>Total collected</span><strong>{dashboard ? money(dashboard.totalPaid) : '—'}</strong><small>Posted student payments</small></article>
            <article className="finance-kpi finance-kpi-red"><span>Outstanding</span><strong>{dashboard ? money(dashboard.totalOutstanding) : '—'}</strong><small>Receivables requiring follow-up</small></article>
            <article className="finance-kpi finance-kpi-orange"><span>Today's collection</span><strong>{dashboard ? money(dashboard.todayCollection) : '—'}</strong><small>Payments posted today</small></article>
          </div>
            {dashboard?.totalsByCurrency && dashboard.totalsByCurrency.length > 0 && (
              <div className="finance-currency-summary" aria-label="Financial totals by currency">
                <strong>Totals by currency</strong>
                {dashboard.totalsByCurrency.map(total => (
                  <span key={total.currency}>
                    <b>{total.currency}</b>
                    <span>Billed {money(total.billed, total.currency)}</span>
                    <span>Paid {money(total.paid, total.currency)}</span>
                    <span>Balance {money(total.balance, total.currency)}</span>
                  </span>
                ))}
              </div>
            )}

          <div className="finance-overview-grid">
            <section className="finance-surface finance-collection-panel">
              <div className="finance-surface-heading"><div><span className="eyebrow">COLLECTION PERFORMANCE</span><h3>Fee collection</h3></div><strong>{collectionRate.toFixed(0)}%</strong></div>
              <div className="finance-progress-track"><div style={{ width: collectionRate + '%' }} /></div>
              <div className="finance-mini-stats"><span>Paid <strong>{dashboard ? money(dashboard.totalPaid) : '—'}</strong></span><span>Balance <strong>{dashboard ? money(dashboard.totalOutstanding) : '—'}</strong></span><span>Invoices <strong>{dashboard?.invoiceCount.toLocaleString() ?? '—'}</strong></span></div>
              <div className="finance-bar-chart" aria-label="Recent daily collection activity">
                {collectionByDate.labels.length === 0 ? <div className="empty">No recent collection activity.</div> : <BarChart labels={collectionByDate.labels} datasets={collectionByDate.datasets} ariaLabel="Daily fee collections shown as separate series for each transaction currency" valueFormatter={value => new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(value)} />}
              </div>
            </section>

            <section className="finance-surface">
              <div className="finance-surface-heading"><div><span className="eyebrow">FINANCE CONTROL</span><h3>Account health</h3></div></div>
              <div className="finance-control-list">
                <div><span>Open receivables</span><strong className="finance-value-danger">{dashboard?.outstandingCount.toLocaleString() ?? '—'}</strong></div>
                <div><span>Payment records</span><strong>{dashboard?.paymentCount.toLocaleString() ?? '—'}</strong></div>
                <div><span>Collection rate</span><strong className="finance-value-success">{collectionRate.toFixed(1)}%</strong></div>
                <div><span>Currency</span><strong>' + SYSTEM_CURRENCY + '</strong></div>
              </div>
              <div className="finance-legend"><span><i className="finance-dot success" />Paid / collected</span><span><i className="finance-dot warning" />Partial</span><span><i className="finance-dot danger" />Outstanding</span></div>
            </section>
          </div>

          <section className="finance-surface" style={{ marginTop: 18 }}>
            <div className="finance-surface-heading"><div><span className="eyebrow">SCHOOL FEES WORKSPACE</span><h3>Student receivables</h3><p>Search admitted student accounts, review balances and track collection progress.</p></div><button type="button" className="secondary-button" onClick={() => setTab('collections')}>Open collections</button></div>
            <div className="finance-table-toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search student name / code / programme" aria-label="Search finance accounts" /><span>{filteredOutstanding.length.toLocaleString()} outstanding accounts</span></div>
            <AgGridTable rows={filteredOutstanding.slice(0, 8)} columns={accountColumns} height={360} pageSize={8} />
          </section>
        </>
      )}

      {tab === 'student-accounts' && <StudentFinanceDashboard />}

      {tab === 'collections' && (
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">COLLECTIONS</span><h3>Payments & receipts</h3><p>Review posted payments, receipts and transaction references.</p></div></div>
          <div className="finance-table-toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search receipt / student / reference" aria-label="Search payments" /><span>{payments.length.toLocaleString()} transactions loaded</span></div>
          <AgGridTable rows={payments.filter(p => !query.trim() || [p.receiptNumber,p.studentName,p.invoiceNumber,p.reference].some(v => String(v ?? '').toLowerCase().includes(query.trim().toLowerCase())))} columns={collectionColumns} height={520} pageSize={25} />
        </section>
      )}

      {tab === 'fees' && <FeeTypesManager />}

      {tab === 'accounting' && (
        <section className="finance-accounting-layout">
          <div className="finance-surface"><div className="finance-surface-heading"><div><span className="eyebrow">ACCOUNTING</span><h3>Accounts & payroll control</h3><p>Receivables, payments, payroll and finance administration are grouped here for the bursar and accounts office.</p></div></div><AccountsOverviewWorkspace /></div>
          <div className="finance-surface" style={{ marginTop: 18 }}><div className="finance-surface-heading"><div><span className="eyebrow">DOUBLE-ENTRY ACCOUNTING</span><h3>Core accounting reports</h3><p>Chart of accounts, general ledger, trial balance, income statement and balance sheet, all presented in UGX.</p></div></div><AccountingReportsWorkspace /></div>
        </section>
      )}

      {tab === 'allowances' && <StaffAllowancesWorkspace />}

      {tab === 'reports' && (
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">FINANCIAL REPORTING</span><h3>Financial reports</h3><p>Period-based finance reporting with UGX presentation and reconciliation visibility.</p></div></div>
          <CashBankPositionReport />
        </section>
      )}
    </section>
  )
}
