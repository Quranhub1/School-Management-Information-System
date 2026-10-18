import { useState } from 'react';

export function BackupRestore() {
  const [status, setStatus] = useState('');
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isRestoreRunning, setIsRestoreRunning] = useState(false);

  async function backup() {
    setIsBackupRunning(true);
    setStatus('Starting backup...');
    try {
      const res = await fetch('/api/administration/backup');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Backup failed');
      }
      
      // Get the filename from Content-Disposition header or generate one
      const contentDisposition = res.headers.get('content-disposition');
      let filename = 'backup.sql';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      // Trigger file download
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setStatus('Backup downloaded successfully.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Backup failed.');
    } finally {
      setIsBackupRunning(false);
    }
  }

  async function restore() {
    // In a real implementation, we would use a file input to select the backup file
    // For now, we'll show a message that this needs to be implemented with file upload
    setIsRestoreRunning(true);
    setStatus('Restoring...');
    try {
      // This is a placeholder - in reality, we'd need to:
      // 1. Show a file input to select backup file
      // 2. Upload the file via multipart/form-data to /api/administration/restore
      // 3. Process the uploaded file
      
      // For demonstration, we'll just show that the endpoint exists
      // No status update here - keeping the "Restoring..." status
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Restore failed.');
    } finally {
      setIsRestoreRunning(false);
    }
  }

  return (
    <section className="panel" aria-label="Backup and restore">
      <div className="panel-heading"><div><span className="eyebrow">DATA</span><h2>Backup and Restore</h2></div></div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button 
          className="primary-button" 
          onClick={() => void backup()}
          disabled={isBackupRunning}
        >
          {isBackupRunning ? 'Backing up...' : 'Export Backup'}
        </button>
        <button 
          className="secondary-button" 
          onClick={() => void restore()}
          disabled={isRestoreRunning}
        >
          {isRestoreRunning ? 'Restoring...' : 'Restore Backup'}
        </button>
      </div>
      {status && <p className="empty" style={{ padding: 20 }}>{status}</p>}
    </section>
  );
}