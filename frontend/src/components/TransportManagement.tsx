import { useState } from 'react';

export function TransportManagement({ canManage }: { canManage?: boolean }) {
  const [tab, setTab] = useState<'vehicles' | 'routes' | 'assignments' | 'fees' | 'reports'>('vehicles');
  return (
    <section className="panel" aria-label="Transport management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">TRANSPORT</span>
          <h3>Transport Management</h3>
        </div>
      </div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Transport sections">
        <button role="tab" aria-selected={tab === 'vehicles'} className={tab === 'vehicles' ? 'active' : ''} onClick={() => setTab('vehicles')}>Vehicles</button>
        <button role="tab" aria-selected={tab === 'routes'} className={tab === 'routes' ? 'active' : ''} onClick={() => setTab('routes')}>Routes</button>
        <button role="tab" aria-selected={tab === 'assignments'} className={tab === 'assignments' ? 'active' : ''} onClick={() => setTab('assignments')}>Assignments</button>
        <button role="tab" aria-selected={tab === 'fees'} className={tab === 'fees' ? 'active' : ''} onClick={() => setTab('fees')}>Fees</button>
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Reports</button>
      </div>
      <p className="empty">Transport module is available.</p>
    </section>
  );
}
