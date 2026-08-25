import { useState } from 'react';

export function InventoryManagement({ canManage }: { canManage: boolean }) {
  const [tab, setTab] = useState<'assets' | 'stock' | 'suppliers' | 'issuances' | 'reports'>('assets');
  return (
    <section className="panel" aria-label="Inventory management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INVENTORY</span>
          <h3>Inventory Management</h3>
        </div>
      </div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Inventory sections">
        <button role="tab" aria-selected={tab === 'assets'} className={tab === 'assets' ? 'active' : ''} onClick={() => setTab('assets')}>Assets</button>
        <button role="tab" aria-selected={tab === 'stock'} className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>Stock</button>
        <button role="tab" aria-selected={tab === 'suppliers'} className={tab === 'suppliers' ? 'active' : ''} onClick={() => setTab('suppliers')}>Suppliers</button>
        <button role="tab" aria-selected={tab === 'issuances'} className={tab === 'issuances' ? 'active' : ''} onClick={() => setTab('issuances')}>Issuances</button>
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Reports</button>
      </div>
      <p className="empty">Inventory module is available.</p>
    </section>
  );
}
