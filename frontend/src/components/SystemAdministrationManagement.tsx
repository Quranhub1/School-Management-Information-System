import { useEffect, useState } from 'react'
import { Activity, Archive, ArrowRight, Database, FileSearch, LockKeyhole, Settings2, ShieldCheck, UsersRound } from 'lucide-react'
import { getSystemCurrencySettings, saveSystemCurrencySettings, type SystemCurrencySettings } from '../api/systemSettings'
import { AuditLogManagement } from './AuditLog'
import { BackupRestore } from './BackupRestore'

type SystemAdministrationManagementProps = {
  activeSubsection?: string | null
  onNavigate: (module: 'administration' | 'system-administration', subsection?: string) => void
}

const tools = [
  { key: 'logs', title: 'Audit logs', description: 'Review recorded account and data-change activity.', icon: FileSearch },
  { key: 'backups', title: 'Backups & recovery', description: 'Check backup and recovery readiness for the system database.', icon: Archive },
  { key: 'settings', title: 'System settings', description: 'Review system-level configuration and security controls.', icon: Settings2 },
]

export function SystemAdministrationManagement({ activeSubsection, onNavigate }: SystemAdministrationManagementProps) {
  const selected = activeSubsection ?? 'overview'
  const [currency, setCurrency] = useState<SystemCurrencySettings>({ code: 'UGX', locale: 'en-UG', fractionDigits: 0 })
  const [currencyLoading, setCurrencyLoading] = useState(false)
  const [currencySaving, setCurrencySaving] = useState(false)
  const [currencyError, setCurrencyError] = useState('')
  const [currencySuccess, setCurrencySuccess] = useState('')

  useEffect(() => {
    if (!currencySuccess) return
    const timeout = window.setTimeout(() => setCurrencySuccess(''), 4500)
    return () => window.clearTimeout(timeout)
  }, [currencySuccess])

  useEffect(() => {
    if (selected !== 'settings') return
    let cancelled = false
    setCurrencyLoading(true)
    getSystemCurrencySettings().then(value => { if (!cancelled) setCurrency(value) })
      .catch(error => { if (!cancelled) setCurrencyError(error instanceof Error ? error.message : 'Unable to load system currency.') })
      .finally(() => { if (!cancelled) setCurrencyLoading(false) })
    return () => { cancelled = true }
  }, [selected])

  async function saveCurrency() {
    setCurrencySaving(true); setCurrencyError(''); setCurrencySuccess('')
    try {
      const saved = await saveSystemCurrencySettings(currency.code)
      setCurrency(saved)
      setCurrencySuccess('System currency saved. It will become the default for new amounts and displays that use the system default.')
      window.dispatchEvent(new CustomEvent('smis:system-currency-updated', { detail: saved }))
    } catch (error) { setCurrencyError(error instanceof Error ? error.message : 'Unable to save system currency.') }
    finally { setCurrencySaving(false) }
  }

  return <section className="system-admin-workspace" aria-label="System Administration">
    <header className="page-header workspace-header">
      <div>
        <p className="eyebrow">SYSTEM CONTROL CENTER</p>
        <h1>System Administration</h1>
        
      </div>
      <span className="status"><ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} /> Administrator area</span>
    </header>

    <nav className="library-workspace-tabs" aria-label="System administration sections" style={{ marginBottom: 18 }}>
      <button className={selected === 'overview' ? 'active' : ''} aria-current={selected === 'overview' ? 'page' : undefined} onClick={() => onNavigate('system-administration')}>Overview</button>
      <button className={selected === 'logs' ? 'active' : ''} aria-current={selected === 'logs' ? 'page' : undefined} onClick={() => onNavigate('system-administration', 'logs')}>Audit logs</button>
      <button className={selected === 'backups' ? 'active' : ''} aria-current={selected === 'backups' ? 'page' : undefined} onClick={() => onNavigate('system-administration', 'backups')}>Backups</button>
      <button className={selected === 'settings' ? 'active' : ''} aria-current={selected === 'settings' ? 'page' : undefined} onClick={() => onNavigate('system-administration', 'settings')}>System settings</button>
    </nav>

    {selected === 'logs' ? <AuditLogManagement /> : selected === 'backups' ? (
      <BackupRestore />
    ) : selected === 'settings' ? (
      <section className="panel" aria-labelledby="system-settings-title">
        <div className="panel-heading"><div><p className="eyebrow">CONFIGURATION</p><h2 id="system-settings-title">System settings</h2></div><Settings2 size={22} /></div>
        <div className="summary-grid system-settings-actions-grid" style={{ padding: 18, margin: 0 }}>
          <article className="summary-card"><LockKeyhole size={22} /><h3>Access control</h3><button className="secondary-button system-settings-open-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button></article>
          <article className="summary-card"><Database size={22} /><h3>Institution configuration</h3><button className="secondary-button system-settings-open-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button></article>
        </div>
        <section className="panel" aria-labelledby="system-currency-title" style={{ marginTop: 18, padding: 18 }}>
          <div className="panel-heading"><div><p className="eyebrow">FINANCIAL CONFIGURATION</p><h3 id="system-currency-title">System currency</h3></div></div>
          <p>Choose the default currency used when a new financial record does not specify its own currency. Existing invoices, payments and ledger entries keep their recorded currency.</p>
          {currencyError && <p className="error" role="alert">{currencyError}</p>}
          {currencySuccess && <div className="system-currency-toast" role="status" aria-live="polite"><ShieldCheck size={19} aria-hidden="true" /><span>{currencySuccess}</span><button type="button" aria-label="Dismiss notification" onClick={() => setCurrencySuccess('')}>×</button></div>}
          <div className="form-row" style={{ alignItems: 'end' }}>
            <label style={{ flex: 1 }}>Default currency
              <select value={currency.code} disabled={currencyLoading || currencySaving} onChange={event => setCurrency(current => ({ ...current, code: event.target.value }))}>
                <option value="UGX">UGX — Uganda Shilling (default)</option>
                <option value="USD">USD — US Dollar</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — Pound Sterling</option>
                <option value="TZS">TZS — Tanzanian Shilling</option>
                <option value="RWF">RWF — Rwandan Franc</option>
                <option value="ZAR">ZAR — South African Rand</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </label>
            <button className="primary-button" disabled={currencyLoading || currencySaving} onClick={() => void saveCurrency()}>{currencySaving ? 'Saving…' : 'Save currency'}</button>
          </div>
          <small>New transactions use this default unless a specific transaction currency is selected. This setting does not perform exchange-rate conversion.</small>
          <p className="warning" role="note" style={{ marginTop: 12 }}>Financial reports now keep journal balances separate by currency. No exchange-rate conversion is performed; choose the matching currency when reviewing a report. Bank statement reconciliation remains UGX-only.</p>
        </section>
        
      </section>
    ) : (
      <>
        <div className="summary-grid">
          <article className="summary-card"><Activity size={22} /><span>Workspace</span><strong>System controls</strong></article>
          <article className="summary-card"><ShieldCheck size={22} /><span>Security</span><strong>Role-protected</strong></article>
          <article className="summary-card"><FileSearch size={22} /><span>Audit trail</span><strong>Available</strong></article>
        </div>
        <div className="settings-grid">
          {tools.map(tool => {
            const Icon = tool.icon
            return <article className="panel" key={tool.key} style={{ padding: 18 }}>
              <Icon size={24} />
              <h2 style={{ margin: '12px 0 6px', fontSize: '1.05rem' }}>{tool.title}</h2>
              
              <button className="secondary-button" onClick={() => onNavigate('system-administration', tool.key)}>Open section <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
            </article>
          })}
          <article className="panel" style={{ padding: 18 }}>
            <UsersRound size={24} />
            <h2 style={{ margin: '12px 0 6px', fontSize: '1.05rem' }}>User administration</h2>
            
            <button className="secondary-button system-settings-open-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
          </article>
        </div>
      </>
    )}
  </section>
}
