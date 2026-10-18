import { Activity, Archive, ArrowRight, Database, FileSearch, LockKeyhole, Settings2, ShieldCheck, UsersRound } from 'lucide-react'
import { AuditLogManagement } from './AuditLog'
import { BackupRestore } from './BackupRestore'

type SystemAdministrationManagementProps = {
  activeSubsection?: string | null
  onNavigate: (module: 'administration' | 'system-administration', subsection?: string) => void
}

const tools = [
  { key: 'logs', title: 'Audit logs', icon: FileSearch },
  { key: 'backups', title: 'Backups & recovery', icon: Archive },
  { key: 'settings', title: 'System settings', icon: Settings2 },
]

export function SystemAdministrationManagement({ activeSubsection, onNavigate }: SystemAdministrationManagementProps) {
  const selected = activeSubsection ?? 'overview'

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
      <section className="panel" aria-labelledby="system-backups-title">
        <div className="panel-heading"><div><p className="eyebrow">DATA PROTECTION</p><h2 id="system-backups-title">Backups & recovery</h2></div><Archive size={22} /></div>
        <div style={{ padding: 20 }}>
          <BackupRestore />
        </div>
      </section>
    ) : selected === 'settings' ? (
      <section className="panel" aria-labelledby="system-settings-title">
        <div className="panel-heading"><div><p className="eyebrow">CONFIGURATION</p><h2 id="system-settings-title">System settings</h2></div><Settings2 size={22} /></div>
        <div className="summary-grid" style={{ padding: 18, margin: 0 }}>
          <article className="summary-card"><LockKeyhole size={22} /><h3>Access control</h3><button className="secondary-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button></article>
          <article className="summary-card"><Database size={22} /><h3>Institution configuration</h3><button className="secondary-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button></article>
        </div>
      </section>
    ) : (
      <>
        <div className="summary-grid">
          <article className="summary-card"><Activity size={22} /><span>Workspace</span></article>
          <article className="summary-card"><ShieldCheck size={22} /><span>Security</span></article>
          <article className="summary-card"><FileSearch size={22} /><span>Audit trail</span></article>
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
            <button className="secondary-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
          </article>
        </div>
      </>
    )}
  </section>
}