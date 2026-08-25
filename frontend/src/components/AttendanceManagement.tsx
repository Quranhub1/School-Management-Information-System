import { useState } from 'react';

export function AttendanceManagement() {
  const [tab, setTab] = useState<'daily' | 'summaries' | 'reports'>('reports');
  return (
    <section className="panel" aria-label="Attendance management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ATTENDANCE</span>
          <h3>Attendance management</h3>
        </div>
      </div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Attendance sections">
        <button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>Daily</button>
        <button role="tab" aria-selected={tab === 'summaries'} className={tab === 'summaries' ? 'active' : ''} onClick={() => setTab('summaries')}>Summaries</button>
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Reports</button>
      </div>
      <p className="empty">Attendance module is available.</p>
    </section>
  );
}
