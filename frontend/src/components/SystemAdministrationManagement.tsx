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
      <span className="status"><ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} /></span>
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
          <p>Choose the default currency for new financial records.</p>
          {currencyError && <p className="error" role="alert">{currencyError}</p>}
          {currencySuccess && <p className="success" role="status">{currencySuccess}</p>}
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
          <small>New transactions use this default unless a specific currency is selected.</small>
        </section>
        
      </section>
    ) : (
      <>
        <div className="hero-panel">
          <div>
            <p className="eyebrow">Welcome back, administrator</p>
            <h2>System control center</h2>
            <p>Manage system configuration, security, audit logs, backups and institution settings from one place.</p>
          </div>
        </div>
        <div className="health-grid">
          <article className="health-card"><ShieldCheck size={20} /><div><span>Security</span><strong>Role-protected</strong></div></article>
          <article className="health-card"><Activity size={20} /><div><span>Audit trail</span><strong>Available</strong></div></article>
          <article className="health-card"><Archive size={20} /><div><span>Backups</span><strong>Ready</strong></div></article>
        </div>
        </div>
        <div className="settings-grid">
          {tools.map(tool => {
            const Icon = tool.icon
            return <article className="panel" key={tool.key} style={{ padding: 18 }}>
              <div className="tool-header">
                <div className="tool-icon"><Icon size={20} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{tool.title}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: '#6b7280' }}>{tool.description}</p>
                </div>
              </div>
              <button className="secondary-button" onClick={() => onNavigate('system-administration', tool.key)}>Open section <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
            </article>
          })}
          <article className="panel" style={{ padding: 18 }}>
            <div className="tool-header">
              <div className="tool-icon"><UsersRound size={20} /></div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem' }}>User administration</h2>
                <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: '#6b7280' }}>Manage staff accounts, roles and permissions.</p>
              </div>
            </div>
            <button className="secondary-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
          </article>
        </div>
      </>
    )}
  </section>
}
