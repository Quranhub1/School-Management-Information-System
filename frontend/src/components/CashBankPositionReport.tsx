import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getCashBankPosition, type CashBankPositionReport } from '../api/finance'
import { formatCurrency, SYSTEM_CURRENCY } from '../lib/currency'

export function CashBankPositionReport() {
  const [report, setReport] = useState<CashBankPositionReport | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getCashBankPosition({ from: from || undefined, to: to || undefined })
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the cash and bank position report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function submit(event: FormEvent) {
    event.preventDefault()
    void load()
  }

  return (
    <section aria-label="Cash and bank position report">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CASH & BANK</p>
          <h3>Cash and Bank Position</h3>
          <p className="empty">Book position from posted journals, with the latest bank reconciliation status.</p>
        </div>
        <button className="secondary-button" onClick={() => void load()} disabled={loading}>Refresh</button>
      </div>

      <form className="student-form" onSubmit={submit} style={{ marginBottom: 18 }}>
        <div className="form-row">
          <label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
          <label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
          <button type="submit" disabled={loading}>Run Report</button>
        </div>
      </form>

      {error && <div className="error" role="alert">{error}</div>}
      {loading && !report ? <p className="empty">Loading cash and bank position…</p> : report && (
        <>
          <div className="summary-grid" style={{ marginBottom: 18 }}>
            <div className="summary-card"><span>Opening Liquid Funds</span><strong>{formatCurrency(report.totalOpeningBalance)}</strong></div>
            <div className="summary-card"><span>Total Inflows</span><strong>{formatCurrency(report.totalInflows)}</strong></div>
            <div className="summary-card"><span>Total Outflows</span><strong>{formatCurrency(report.totalOutflows)}</strong></div>
            <div className="summary-card"><span>Closing Liquid Funds</span><strong>{formatCurrency(report.totalClosingBalance)}</strong></div>
          </div>

          <div className="summary-grid" style={{ marginBottom: 18 }}>
            <div className="summary-card"><span>Cash Closing</span><strong>{formatCurrency(report.accounts.find(x => x.accountCode === '1010')?.closingBalance ?? 0)}</strong></div>
            <div className="summary-card"><span>Bank Closing</span><strong>{formatCurrency(report.accounts.find(x => x.accountCode === '1020')?.closingBalance ?? 0)}</strong></div>
            <div className="summary-card"><span>Mobile Money Closing</span><strong>{formatCurrency(report.accounts.find(x => x.accountCode === '1030')?.closingBalance ?? 0)}</strong></div>
            <div className="summary-card"><span>Net Movement</span><strong>{formatCurrency(report.netMovement)}</strong></div>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Account</th><th>Opening</th><th>Inflows</th><th>Outflows</th><th>Net Movement</th><th>Closing</th><th>Reconciliation</th><th>Difference</th></tr></thead>
              <tbody>
                {report.accounts.map(account => (
                  <tr key={account.accountId}>
                    <td><strong>{account.accountCode}</strong><br />{account.accountName}</td>
                    <td>{formatCurrency(account.openingBalance)}</td>
                    <td>{formatCurrency(account.inflows)}</td>
                    <td>{formatCurrency(account.outflows)}</td>
                    <td>{formatCurrency(account.netMovement)}</td>
                    <td><strong>{formatCurrency(account.closingBalance)}</strong></td>
                    <td>{account.reconciliationStatus}</td>
                    <td>{account.reconciliationDifference === undefined ? '—' : formatCurrency(account.reconciliationDifference)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="empty" style={{ marginTop: 12 }}>Period: {report.from} to {report.to} · Currency: {SYSTEM_CURRENCY}</p>
        </>
      )}
    </section>
  )
}
