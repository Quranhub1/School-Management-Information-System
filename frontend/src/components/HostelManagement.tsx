import { useState } from 'react';

export function HostelManagement({ canManage }: { canManage?: boolean }) {
  const [tab, setTab] = useState<'houses' | 'rooms' | 'beds' | 'allocations' | 'reports'>('houses');
  return (
    <section className="panel" aria-label="Hostel management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HOSTEL</span>
          <h3>Hostel Management</h3>
        </div>
      </div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Hostel sections">
        <button role="tab" aria-selected={tab === 'houses'} className={tab === 'houses' ? 'active' : ''} onClick={() => setTab('houses')}>Houses</button>
        <button role="tab" aria-selected={tab === 'rooms'} className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>Rooms</button>
        <button role="tab" aria-selected={tab === 'beds'} className={tab === 'beds' ? 'active' : ''} onClick={() => setTab('beds')}>Beds</button>
        <button role="tab" aria-selected={tab === 'allocations'} className={tab === 'allocations' ? 'active' : ''} onClick={() => setTab('allocations')}>Allocations</button>
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Reports</button>
      </div>
      <p className="empty">Hostel module is available.</p>
    </section>
  );
}
