import { Activity, Archive, ArrowRight, Database, FileSearch, LockKeyhole, Settings2, ShieldCheck, UsersRound } from 'lucide-react'
import { AuditLogManagement } from './AuditLog'\nimport { BackupRestore } from './BackupRestore'

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

  return <section className="system-admin-workspace" aria-label="System Administration">
    <header className="page-header workspace-header">
      <div>
        <p className="eyebrow">SYSTEM CONTROL CENTER</p>
        <h1>System Administration</h1>
        <p>Technical operations, access security, audit visibility and system readiness.</p>
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
        <div className="summary-grid" style={{ padding: 18, margin: 0 }}>
          <article className="summary-card"><LockKeyhole size={22} /><h3>Access control</h3><p>Manage user accounts, assigned roles and sign-in access.</p><button className="secondary-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button></article>
          <article className="summary-card"><Database size={22} /><h3>Institution configuration</h3><p>Institution identity and branding are maintained in Administration.</p><button className="secondary-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button></article>
        </div>
        <p style={{ padding: '0 18px 18px', color: 'var(--text-muted, #64748b)' }}>Environment variables and database connection settings should be managed through the deployment environment, not edited from the browser.</p>
      </section>
    ) : (
      <>
        <div className="summary-grid">
          <article className="summary-card"><Activity size={22} /><span>Workspace</span><strong>System controls</strong><small>Separate from institutional administration</small></article>
          <article className="summary-card"><ShieldCheck size={22} /><span>Security</span><strong>Role-protected</strong><small>Visible to System Administrators</small></article>
          <article className="summary-card"><FileSearch size={22} /><span>Audit trail</span><strong>Available</strong><small>Uses the existing audit API</small></article>
        </div>
        <div className="settings-grid">
          {tools.map(tool => {
            const Icon = tool.icon
            return <article className="panel" key={tool.key} style={{ padding: 18 }}>
              <Icon size={24} />
              <h2 style={{ margin: '12px 0 6px', fontSize: '1.05rem' }}>{tool.title}</h2>
              <p style={{ color: 'var(--text-muted, #64748b)', minHeight: 42 }}>{tool.description}</p>
              <button className="secondary-button" onClick={() => onNavigate('system-administration', tool.key)}>Open section <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
            </article>
          })}
          <article className="panel" style={{ padding: 18 }}>
            <UsersRound size={24} />
            <h2 style={{ margin: '12px 0 6px', fontSize: '1.05rem' }}>User administration</h2>
            <p style={{ color: 'var(--text-muted, #64748b)', minHeight: 42 }}>User creation, role assignment and account access remain in the Administration workspace.</p>
            <button className="secondary-button" onClick={() => onNavigate('administration')}>Open Administration <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
          </article>
        </div>
      </>
    )}
  </section>
}
