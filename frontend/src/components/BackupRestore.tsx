import { useState } from 'react';

export function BackupRestore() {
  const [status, setStatus] = useState('');

  async function backup() { try { const res = await fetch('/api/administration/backup'); if (!res.ok) throw new Error('Backup failed'); setStatus('Backup downloaded.') } catch (e) { setStatus(e instanceof Error ? e.message : 'Backup failed.') } }

  async function restore() { try { const res = await fetch('/api/administration/restore', { method: 'POST' }); if (!res.ok) throw new Error('Restore failed'); setStatus('Restore initiated.') } catch (e) { setStatus(e instanceof Error ? e.message : 'Restore failed.') } }

  return (
    <section className="panel" aria-label="Backup and restore">
      <div className="panel-heading"><div><span className="eyebrow">DATA</span><h2>Backup and Restore</h2></div></div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="primary-button" onClick={() => void backup()}>Export Backup</button>
        <button className="secondary-button" onClick={() => void restore()}>Restore Backup</button>
      </div>
      {status && <p className="empty" style={{ padding: 20 }}>{status}</p>}
    </section>
  );
}
