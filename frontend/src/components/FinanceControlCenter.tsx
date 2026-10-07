import { useEffect, useMemo, useState } from 'react'
import {
  getAccountsOverviewPayments,
  getBankReconciliations,
  getBudgetVsActual,
  getBudgets,
  getDashboard,
  getFeeStructures,
  getFinanceReceivablesAgeing,
  getFinanceReceivablesReconciliation,
  getOutstandingBalances,
  type AccountsOverviewPayment,
  type BankReconciliation,
  type BudgetVsActualRow,
  type FeeStructure,
  type FinanceDashboard,
  type ReceivablesAgeingReport,
  type ReceivablesReconciliationReport,
} from '../api/finance'
import { formatCurrency } from '../lib/currency'

const money = (value: number) => formatCurrency(Number(value) || 0)

type Props = { onNavigate: (tab: 'student-accounts' | 'collections' | 'fees' | 'reports' | 'accounting') => void }

const channelCards = [
  { name: 'Mobile Money', detail: 'MTN / Airtel and other mobile-money APIs', icon: 'MM' },
  { name: 'USSD Payments', detail: 'Direct school-fee payment sessions', icon: 'US' },
  { name: 'Bank Integrations', detail: 'Automated bank transaction ingestion', icon: 'BK' },
  { name: 'Online Gateway', detail: 'Card and hosted payment gateway', icon: 'GW' },
]

export function FinanceControlCenter({ onNavigate }: Props) {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null)
  const [ageing, setAgeing] = useState<ReceivablesAgeingReport | null>(null)
  const [reconciliation, setReconciliation] = useState<ReceivablesReconciliationReport | null>(null)
  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>([])
  const [budgetRows, setBudgetRows] = useState<BudgetVsActualRow[]>([])
  const [payments, setPayments] = useState<AccountsOverviewPayment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
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
      getAccountsOverviewPayments(),
      getFeeStructures(),
      getBudgets({ activeOnly: true }),
    ])
    let failures = 0
    const [d, a, r, b, o, p, fees, budgets] = results
    if (d.status === 'fulfilled') setDashboard(d.value); else failures++
    if (a.status === 'fulfilled') setAgeing(a.value); else failures++
    if (r.status === 'fulfilled') setReconciliation(r.value); else failures++
    if (b.status === 'fulfilled') setBankReconciliations(b.value); else failures++
    if (o.status === 'fulfilled') setOutstandingCount(o.value.length); else failures++
    if (p.status === 'fulfilled') setPayments(p.value); else failures++
    if (fees.status === 'fulfilled') setFeeStructures(fees.value); else failures++
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

  const collectionRate = dashboard && dashboard.totalBilled > 0
    ? Math.min(100, Math.max(0, dashboard.totalPaid / dashboard.totalBilled * 100))
    : 0

  const budgetUtilization = useMemo(() => {
    if (!budgetRows.length) return null
    const budget = budgetRows.reduce((s, x) => s + x.budget, 0)
    const actual = budgetRows.reduce((s, x) => s + x.actual, 0)
    return budget > 0 ? actual / budget * 100 : 0
  }, [budgetRows])

  const openBankItems = bankReconciliations.filter(x => !['Reconciled', 'Closed'].includes(x.status)).length
  const unmatchedBankLines = bankReconciliations.reduce((sum, item) => sum + (item.status.toLowerCase() === 'unmatched' ? 1 : 0), 0)
  const alertCount =
    (overdue > 0 ? 1 : 0) +
    (openBankItems > 0 ? 1 : 0) +
    (reconciliation && !reconciliation.isReconciled ? 1 : 0) +
    (budgetUtilization !== null && budgetUtilization > 100 ? 1 : 0)

  if (loading) {
    return <section className="finance-control-center finance-surface"><p className="empty">Loading accountant control center…</p></section>
  }

  return (
    <section className="finance-control-center" aria-label="Accountant control center">
      <div className="finance-control-heading">
        <div>
          <span className="eyebrow">ACCOUNTANT · BURSAR CONTROL CENTER</span>
          <h3>Institution financial control</h3>
          <p>Monitor money owed, money received, reconciliation, billing, budgets and exceptions from one operational screen.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void load()} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh financial position'}
        </button>
      </div>

      {errorCount > 0 && (
        <div className="finance-control-warning" role="status">
          Some optional finance controls could not be loaded. No existing finance workflow has been disabled.
        </div>
      )}

      <div className="finance-control-kpis">
        <button type="button" className="finance-control-kpi" onClick={() => onNavigate('student-accounts')}>
          <span>Accounts receivable</span>
          <strong>{money(dashboard?.totalOutstanding ?? 0)}</strong>
          <small>{outstandingCount.toLocaleString()} outstanding student accounts</small>
        </button>
        <button type="button" className="finance-control-kpi" onClick={() => onNavigate('collections')}>
          <span>Collection rate</span>
          <strong>{collectionRate.toFixed(1)}%</strong>
          <small>{money(dashboard?.todayCollection ?? 0)} posted today</small>
        </button>
        <button type="button" className="finance-control-kpi" onClick={() => onNavigate('reports')}>
          <span>Overdue arrears</span>
          <strong>{money(overdue)}</strong>
          <small>Receivables beyond current billing</small>
        </button>
        <button type="button" className="finance-control-kpi" onClick={() => onNavigate('accounting')}>
          <span>Control balance</span>
          <strong>{reconciliation?.isReconciled ? 'Balanced' : 'Review'}</strong>
          <small>{reconciliation ? money(Math.abs(reconciliation.difference)) + ' difference' : 'No reconciliation data'}</small>
        </button>
      </div>

      <div className="finance-control-grid">
        <section className="finance-surface">
          <div className="finance-surface-heading">
            <div><span className="eyebrow">LIVE COLLECTION ACTIVITY</span><h3>Recent posted payments</h3></div>
            <button type="button" className="secondary-button" onClick={() => onNavigate('collections')}>Open collections</button>
          </div>
          <div className="finance-live-payment-list">
            {payments.slice(0, 6).map(payment => (
              <button type="button" key={payment.id} className="finance-live-payment" onClick={() => onNavigate('collections')}>
                <span className="finance-live-payment-avatar">{payment.studentName?.slice(0, 1).toUpperCase() || 'P'}</span>
                <span className="finance-live-payment-main">
                  <strong>{payment.studentName || 'Student payment'}</strong>
                  <small>{payment.receiptNumber || 'Receipt pending'} · {new Date(payment.paidAt).toLocaleString('en-UG')}</small>
                </span>
                <strong className="finance-value-success">{money(payment.amount)}</strong>
              </button>
            ))}
            {!payments.length && <p className="empty">No posted payments are available.</p>}
          </div>
        </section>

        <section className="finance-surface">
          <div className="finance-surface-heading">
            <div><span className="eyebrow">ACTION QUEUE</span><h3>What needs the accountant?</h3></div>
            <strong className={alertCount ? 'finance-value-danger' : 'finance-value-success'}>{alertCount} control alerts</strong>
          </div>
          <div className="finance-alert-list">
            <button type="button" onClick={() => onNavigate('student-accounts')}><span><strong>Arrears follow-up</strong><small>Students with overdue balances</small></span><strong>{money(overdue)}</strong></button>
            <button type="button" onClick={() => onNavigate('reports')}><span><strong>Bank reconciliation</strong><small>Open reconciliations</small></span><strong>{openBankItems}</strong></button>
            <button type="button" onClick={() => onNavigate('accounting')}><span><strong>Receivables control</strong><small>Subledger versus control account</small></span><strong>{reconciliation?.isReconciled ? 'OK' : 'Review'}</strong></button>
            <button type="button" onClick={() => onNavigate('accounting')}><span><strong>Budget pressure</strong><small>Actual against approved budget</small></span><strong>{budgetUtilization === null ? '—' : budgetUtilization.toFixed(1) + '%'}</strong></button>
          </div>
        </section>
      </div>

      <div className="finance-control-grid">
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">RECEIVABLES AGEING</span><h3>Outstanding debt by age</h3></div></div>
          <div className="finance-ageing-list">
            {(ageing?.buckets ?? []).map(bucket => {
              const share = ageing && ageing.totalOutstanding > 0 ? bucket.outstandingAmount / ageing.totalOutstanding * 100 : 0
              return (
                <div className="finance-ageing-row" key={bucket.bucket}>
                  <div><strong>{bucket.bucket}</strong><small>{bucket.invoiceCount.toLocaleString()} invoices</small></div>
                  <div className="finance-ageing-track"><span style={{ width: Math.min(100, share) + '%' }} /></div>
                  <strong>{money(bucket.outstandingAmount)}</strong>
                </div>
              )
            })}
            {!ageing && <p className="empty">Ageing report unavailable.</p>}
          </div>
        </section>

        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">CASH & BANK CONTROL</span><h3>Reconciliation position</h3></div></div>
          <div className="finance-control-stat-list">
            <div><span>Bank reconciliations</span><strong>{bankReconciliations.length}</strong></div>
            <div><span>Open / pending</span><strong className={openBankItems ? 'finance-value-danger' : 'finance-value-success'}>{openBankItems}</strong></div>
            <div><span>Unmatched reconciliation items</span><strong>{unmatchedBankLines}</strong></div>
            <div><span>Receivables control</span><strong className={reconciliation?.isReconciled ? 'finance-value-success' : 'finance-value-danger'}>{reconciliation?.isReconciled ? 'Balanced' : 'Needs review'}</strong></div>
            <div><span>Control account</span><strong>{reconciliation?.controlAccountCode ?? '—'}</strong></div>
          </div>
        </section>
      </div>

      <div className="finance-control-grid">
        <section className="finance-surface">
          <div className="finance-surface-heading">
            <div><span className="eyebrow">BILLING CONTROL</span><h3>Fee structures & student obligations</h3></div>
            <button type="button" className="secondary-button" onClick={() => onNavigate('fees')}>Manage fee structures</button>
          </div>
          <div className="finance-control-stat-list">
            <div><span>Active fee structures</span><strong>{feeStructures.filter(x => x.isActive).length}</strong></div>
            <div><span>Fee structures loaded</span><strong>{feeStructures.length}</strong></div>
            <div><span>Invoices issued</span><strong>{dashboard?.invoiceCount.toLocaleString() ?? '—'}</strong></div>
            <div><span>Outstanding accounts</span><strong className="finance-value-danger">{dashboard?.outstandingCount.toLocaleString() ?? '—'}</strong></div>
          </div>
          <p className="finance-control-note">Billing remains itemized by fee structure and can be applied to students through the existing finance workflow. External payment channels are intentionally not required for this control center.</p>
        </section>

        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">BUDGET VS ACTUAL</span><h3>Spending pressure</h3></div><button type="button" className="secondary-button" onClick={() => onNavigate('accounting')}>Open accounting</button></div>
          <div className="finance-budget-summary">
            <strong>{budgetUtilization === null ? '—' : budgetUtilization.toFixed(1) + '%'}</strong>
            <span>aggregate utilization across the first active budget's configured lines</span>
          </div>
          <div className="finance-budget-bars">
            {budgetRows.slice(0, 6).map(row => (
              <div key={row.accountId} className="finance-budget-row">
                <span title={row.accountName}>{row.accountCode} · {row.accountName}</span>
                <div className="finance-ageing-track"><span style={{ width: Math.min(100, Math.max(0, row.utilizationPercentage)) + '%' }} /></div>
                <strong>{row.utilizationPercentage.toFixed(0)}%</strong>
              </div>
            ))}
            {!budgetRows.length && <p className="empty">No active budget lines are available.</p>}
          </div>
        </section>
      </div>

      <section className="finance-surface">
        <div className="finance-surface-heading">
          <div><span className="eyebrow">EXTERNAL PAYMENT INTEGRATIONS</span><h3>Payment channels</h3><p>These integrations remain deliberately disabled until the institution's provider APIs and credentials are available.</p></div>
          <span className="finance-coming-soon-badge">COMING SOON</span>
        </div>
        <div className="finance-channel-grid">
          {channelCards.map(channel => (
            <div className="finance-channel-card" key={channel.name} aria-disabled="true">
              <span className="finance-channel-icon">{channel.icon}</span>
              <div><strong>{channel.name}</strong><small>{channel.detail}</small></div>
              <span className="finance-channel-status">Coming soon</span>
            </div>
          ))}
        </div>
      </section>

      <div className="finance-accountant-footer">
        <div><strong>Accounting principle</strong><span>Posted financial transactions remain traceable; corrections should use controlled adjustments, credit notes, refunds or reversals rather than silently changing history.</span></div>
        <div><strong>Current payment mode</strong><span>Existing manual/recorded payment workflows remain available. Mobile-money, USSD, bank API and gateway integrations are not assumed.</span></div>
      </div>
    </section>
  )
}
