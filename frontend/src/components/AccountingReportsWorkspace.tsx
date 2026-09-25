import { useEffect, useState } from 'react'
import { getAccessToken } from '../api/auth'
import { formatCurrency } from '../lib/currency'

type Account = { id: string; code: string; name: string; accountType: string }
type LedgerRow = { accountCode: string; accountName: string; accountType: string; date: string; entryNumber: string; description: string; debit: number; credit: number; balance: number }
type TrialRow = { accountCode: string; accountName: string; accountType: string; debit: number; credit: number; balance: number }
type StatementRow = { accountCode: string; accountName: string; accountType: string; amount?: number; balance?: number }
type IncomeReport = { revenue: StatementRow[]; expenses: StatementRow[]; totalRevenue: number; totalExpenses: number; netIncome: number }
type BalanceReport = { assets: StatementRow[]; liabilities: StatementRow[]; equity: StatementRow[]; totalAssets: number; totalLiabilities: number; totalEquity: number; currentPeriodNetIncome: number; totalLiabilitiesAndEquity: number }

type Tab = 'accounts' | 'ledger' | 'trial-balance' | 'income-statement' | 'balance-sheet'
const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const money = (n: number) => formatCurrency(Number(n) || 0)

async function request<T>(path: string): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(apiBase + path, { headers: { Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) } })
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`)
  return response.json() as Promise<T>
}

export function AccountingReportsWorkspace() {
  const [tab, setTab] = useState<Tab>('accounts')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [trial, setTrial] = useState<TrialRow[]>([])
  const [income, setIncome] = useState<IncomeReport | null>(null)
  const [balance, setBalance] = useState<BalanceReport | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [asOf, setAsOf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      if (tab === 'accounts') setAccounts(await request<Account[]>('/api/finance/administration/accounts'))
      if (tab === 'ledger') setLedger(await request<LedgerRow[]>(`/api/finance/reports/general-ledger?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`))
      if (tab === 'trial-balance') setTrial(await request<TrialRow[]>(`/api/finance/reports/trial-balance?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`))
      if (tab === 'income-statement') setIncome(await request<IncomeReport>(`/api/finance/reports/income-statement?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`))
      if (tab === 'balance-sheet') setBalance(await request<BalanceReport>(`/api/finance/reports/balance-sheet?${new URLSearchParams({ ...(asOf ? { asOf } : {}) })}`))
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load accounting data.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [tab])

  return <section className="accounting-reports-workspace">
    <div className="library-workspace-tabs" role="tablist" aria-label="Accounting reports">
      {([['accounts','Chart of Accounts'],['ledger','General Ledger'],['trial-balance','Trial Balance'],['income-statement','Income Statement'],['balance-sheet','Balance Sheet']] as [Tab,string][]).map(([key,label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    {tab !== 'accounts' && tab !== 'balance-sheet' && <div className="filter-toolbar"><label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label><button type="button" onClick={() => void load()} disabled={loading}>{loading ? 'Running…' : 'Run report'}</button></div>}
    {tab === 'balance-sheet' && <div className="filter-toolbar"><label>As of<input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} /></label><button type="button" onClick={() => void load()} disabled={loading}>{loading ? 'Running…' : 'Run report'}</button></div>}
    {loading ? <p className="empty">Loading accounting data…</p> : tab === 'accounts' ? <div className="table-wrap"><table><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Status</th></tr></thead><tbody>{accounts.map(a => <tr key={a.id}><td><strong>{a.code}</strong></td><td>{a.name}</td><td>{a.accountType}</td><td><span className="finance-status success">Active</span></td></tr>)}{accounts.length === 0 && <tr><td colSpan={4} className="empty">No finance accounts configured.</td></tr>}</tbody></table></div>
    : tab === 'ledger' ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Entry</th><th>Account</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>{ledger.map((x,i) => <tr key={x.entryNumber + '-' + i}><td>{new Date(x.date).toLocaleDateString('en-UG')}</td><td><strong>{x.entryNumber}</strong></td><td>{x.accountCode}<small>{x.accountName}</small></td><td>{x.description}</td><td>{money(x.debit)}</td><td>{money(x.credit)}</td><td><strong>{money(x.balance)}</strong></td></tr>)}{ledger.length === 0 && <tr><td colSpan={7} className="empty">No posted ledger entries for this period.</td></tr>}</tbody></table></div>
    : tab === 'trial-balance' ? <div className="table-wrap"><table><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>{trial.map(x => <tr key={x.accountCode + x.accountName}><td><strong>{x.accountCode}</strong></td><td>{x.accountName}</td><td>{x.accountType}</td><td>{money(x.debit)}</td><td>{money(x.credit)}</td><td><strong>{money(x.balance)}</strong></td></tr>)}{trial.length === 0 && <tr><td colSpan={6} className="empty">No trial-balance rows for this period.</td></tr>}</tbody></table></div>
    : tab === 'income-statement' && income ? <div className="accounting-report-grid"><div className="summary-grid"><div className="summary-card"><span>Total revenue</span><strong className="finance-value-success">{money(income.totalRevenue)}</strong></div><div className="summary-card"><span>Total expenses</span><strong className="finance-value-danger">{money(income.totalExpenses)}</strong></div><div className="summary-card"><span>Net income</span><strong>{money(income.netIncome)}</strong></div></div><div className="table-wrap"><table><thead><tr><th>Revenue account</th><th>Type</th><th>Amount</th></tr></thead><tbody>{income.revenue.map(x => <tr key={x.accountCode}><td><strong>{x.accountCode}</strong> · {x.accountName}</td><td>{x.accountType}</td><td>{money(x.amount ?? 0)}</td></tr>)}</tbody></table></div><div className="table-wrap"><table><thead><tr><th>Expense account</th><th>Type</th><th>Amount</th></tr></thead><tbody>{income.expenses.map(x => <tr key={x.accountCode}><td><strong>{x.accountCode}</strong> · {x.accountName}</td><td>{x.accountType}</td><td>{money(x.amount ?? 0)}</td></tr>)}</tbody></table></div></div>
    : tab === 'balance-sheet' && balance ? <div className="accounting-report-grid"><div className="summary-grid"><div className="summary-card"><span>Total assets</span><strong>{money(balance.totalAssets)}</strong></div><div className="summary-card"><span>Liabilities</span><strong>{money(balance.totalLiabilities)}</strong></div><div className="summary-card"><span>Equity</span><strong>{money(balance.totalEquity)}</strong></div><div className="summary-card"><span>Net income</span><strong>{money(balance.currentPeriodNetIncome)}</strong></div></div>{([['Assets',balance.assets],['Liabilities',balance.liabilities],['Equity',balance.equity]] as [string,StatementRow[]][]).map(([title,rows]) => <div className="table-wrap" key={title}><table><thead><tr><th>{title}</th><th>Type</th><th>Balance</th></tr></thead><tbody>{rows.map(x => <tr key={x.accountCode}><td><strong>{x.accountCode}</strong> · {x.accountName}</td><td>{x.accountType}</td><td>{money(x.balance ?? 0)}</td></tr>)}</tbody></table></div>)}<div className="finance-control-list"><div><span>Total assets</span><strong>{money(balance.totalAssets)}</strong></div><div><span>Liabilities + equity + current net income</span><strong>{money(balance.totalLiabilitiesAndEquity)}</strong></div></div></div>
    : <p className="empty">No report data.</p>}
  </section>
}
