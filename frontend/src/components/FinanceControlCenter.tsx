import { useEffect, useMemo, useState } from 'react'
import {
  getBankReconciliations,
  getBudgetVsActual,
  getBudgets,
  getDashboard,
  getFinanceReceivablesAgeing,
  getFinanceReceivablesReconciliation,
  getOutstandingBalances,
  type BankReconciliation,
  type BudgetVsActualRow,
  type FinanceDashboard,
  type ReceivablesAgeingReport,
  type ReceivablesReconciliationReport,
} from '../api/finance'
import { formatCurrency } from '../lib/currency'

const money = (value: number) => formatCurrency(Number(value) || 0)

type Props = { onNavigate: (tab: 'student-accounts' | 'collections' | 'reports' | 'accounting') => void }

export function FinanceControlCenter({ onNavigate }: Props) {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null)
  const [ageing, setAgeing] = useState<ReceivablesAgeingReport | null>(null)
  const [reconciliation, setReconciliation] = useState<ReceivablesReconciliationReport | null>(null)
  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>([])
  const [budgetRows, setBudgetRows] = useState<BudgetVsActualRow[]>([])
  const [outstandingCount, setOutstandingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorCount, setErrorCount] = useState(0)

  async function load() {
    setRefreshing(true)
    const results = await Promise.allSettled([
      getDashboard(),
      getFinanceReceivablesAgeing(undefined, 'UGX'),
      getFinanceReceivablesReconciliation(undefined, 'UGX'),
      getBankReconciliations(),
      getOutstandingBalances(),
      getBudgets({ activeOnly: true }),
    ])
    let failures = 0
    const [d, a, r, b, o, budgets] = results
    if (d.status === 'fulfilled') setDashboard(d.value); else failures++
    if (a.status === 'fulfilled') setAgeing(a.value); else failures++
    if (r.status === 'fulfilled') setReconciliation(r.value); else failures++
    if (b.status === 'fulfilled') setBankReconciliations(b.value); else failures++
    if (o.status === 'fulfilled') setOutstandingCount(o.value.length); else failures++
    if (budgets.status === 'fulfilled') {
      const first = budgets.value[0]
      if (first) {
        const v = await getBudgetVsActual(first.id).catch(() => [])
        setBudgetRows(v)
      } else setBudgetRows([])
    } else failures++
    setErrorCount(failures)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { void load() }, [])

  const overdue = useMemo(() => {
    if (!ageing) return 0
    return ageing.buckets.filter(x => x.bucket !== 'Current').reduce((sum, x) => sum + x.outstandingAmount, 0)
  }, [ageing])

  const budgetUtilization = useMemo(() => {
    if (!budgetRows.length) return null
    const budget = budgetRows.reduce((s, x) => s + x.budget, 0)
    const actual = budgetRows.reduce((s, x) => s + x.actual, 0)
    return budget > 0 ? Math.min(999, actual / budget * 100) : 0
  }, [budgetRows])

  const openBankItems = bankReconciliations.filter(x => !['Reconciled', 'Closed'].includes(x.status)).length
  const alertCount = (overdue > 0 ? 1 : 0) + (openBankItems > 0 ? 1 : 0) + (reconciliation && !reconciliation.isReconciled ? 1 : 0) + (budgetUtilization !== null && budgetUtilization > 100 ? 1 : 0)

  if (loading) return <section className="finance-control-center finance-surface"><p className="empty">Loading financial control center…</p></section>

  return (
    <section className="finance-control-center" aria-label="Finance control center">
      <div className="finance-control-heading">
        <div>
          <span className="eyebrow">FINANCIAL CONTROL CENTER</span>
          <h3>Institution financial health</h3>
          <p>One operational view of receivables, collections, cash controls, reconciliation and budget pressure.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void load()} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh control center'}</button>
      </div>

      {errorCount > 0 && <div className="finance-control-warning" role="status">Some finance control data could not be loaded. Existing finance workspaces remain available.</div>}

      <div className="finance-control-kpis">
        <button type="button" className="finance-control-kpi" onClick={() => onNavigate('student-accounts')}>
          <span>Receivables</span><strong>{money(dashboard?.totalOutstanding ?? 0)}</strong><small>{outstandingCount.toLocaleString()} accounts requiring attention</small>
        </button>
        <button type="button" className="finance-control-kpi" onClick={() => onNavigate('collections')}>
          <span>Collection rate</span><strong>{dashboard && dashboard.totalBilled > 0 ? (dashboard.totalPaid / dashboard.totalBilled * 100).toFixed(1) : '0.0'}%</strong><small>{money(dashboard?.todayCollection ?? 0)} collected today</small>
        </button>
        <button type="button" className="finance-control-kpi" onClick={() => onNavigate('reports')}>
          <span>Overdue arrears</span><strong>{money(overdue)}</strong><small>Beyond current billing</small>
        </button>
        <button type="button" className="finance-control-kpi" onClick={() => onNavigate('accounting')}>
          <span>Control status</span><strong>{reconciliation?.isReconciled ? 'Balanced' : 'Review'}</strong><small>{reconciliation ? money(Math.abs(reconciliation.difference)) + ' difference' : 'No reconciliation data'}</small>
        </button>
      </div>

      <div className="finance-control-grid">
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">RECEIVABLES AGEING</span><h3>Where the debt sits</h3></div></div>
          <div className="finance-ageing-list">
            {(ageing?.buckets ?? []).map(bucket => {
              const share = ageing && ageing.totalOutstanding > 0 ? bucket.outstandingAmount / ageing.totalOutstanding * 100 : 0
              return <div className="finance-ageing-row" key={bucket.bucket}>
                <div><strong>{bucket.bucket}</strong><small>{bucket.invoiceCount.toLocaleString()} invoices</small></div>
                <div className="finance-ageing-track"><span style={{ width: Math.min(100, share) + '%' }} /></div>
                <strong>{money(bucket.outstandingAmount)}</strong>
              </div>
            })}
            {!ageing && <p className="empty">Ageing report unavailable.</p>}
          </div>
        </section>

        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">CONTROL CHECKS</span><h3>Action required</h3></div><strong className={alertCount ? 'finance-value-danger' : 'finance-value-success'}>{alertCount} alert{alertCount === 1 ? '' : 's'}</strong></div>
          <div className="finance-alert-list">
            <button type="button" onClick={() => onNavigate('student-accounts')}><span>Overdue receivables</span><strong>{money(overdue)}</strong></button>
            <button type="button" onClick={() => onNavigate('reports')}><span>Open bank reconciliations</span><strong>{openBankItems}</strong></button>
            <button type="button" onClick={() => onNavigate('accounting')}><span>Receivables reconciliation</span><strong>{reconciliation?.isReconciled ? 'Balanced' : 'Review'}</strong></button>
            <button type="button" onClick={() => onNavigate('accounting')}><span>Budget utilization</span><strong>{budgetUtilization === null ? '—' : budgetUtilization.toFixed(1) + '%'}</strong></button>
          </div>
        </section>
      </div>

      <div className="finance-control-grid">
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">CASH & BANK</span><h3>Reconciliation position</h3></div></div>
          <div className="finance-control-stat-list">
            <div><span>Bank reconciliations</span><strong>{bankReconciliations.length}</strong></div>
            <div><span>Open / pending</span><strong className={openBankItems ? 'finance-value-danger' : 'finance-value-success'}>{openBankItems}</strong></div>
            <div><span>Receivables control</span><strong className={reconciliation?.isReconciled ? 'finance-value-success' : 'finance-value-danger'}>{reconciliation?.isReconciled ? 'Balanced' : 'Needs review'}</strong></div>
            <div><span>Control account</span><strong>{reconciliation?.controlAccountCode ?? '—'}</strong></div>
          </div>
        </section>

        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">BUDGET VS ACTUAL</span><h3>Spending pressure</h3></div></div>
          <div className="finance-budget-summary">
            <strong>{budgetUtilization === null ? '—' : budgetUtilization.toFixed(1) + '%'}</strong>
            <span>of the first active budget's configured lines used in the selected reporting scope</span>
          </div>
          <div className="finance-budget-bars">
            {budgetRows.slice(0, 6).map(row => <div key={row.accountId} className="finance-budget-row"><span title={row.accountName}>{row.accountCode} · {row.accountName}</span><div className="finance-ageing-track"><span style={{ width: Math.min(100, Math.max(0, row.utilizationPercentage)) + '%' }} /></div><strong>{row.utilizationPercentage.toFixed(0)}%</strong></div>)}
            {!budgetRows.length && <p className="empty">No active budget lines are available.</p>}
          </div>
        </section>
      </div>
    </section>
  )
}
