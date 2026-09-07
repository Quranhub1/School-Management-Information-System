import { useState } from 'react'

type InventoryTab = 'assets' | 'stock' | 'laboratories' | 'suppliers' | 'issuances' | 'reports'

const LABORATORIES = [
  { id: 'skills-lab', name: 'Skills Laboratory', description: 'Hands-on practical training lab for skills demonstrations and assessments', items: 'Mannequins, models, tools, equipment' },
  { id: 'pharmacy-lab', name: 'Pharmacy Laboratory', description: 'Pharmaceutical dispensing and compounding practice lab', items: 'Pill counters, mixers, dispensing units, reference materials' },
  { id: 'computer-lab', name: 'Computer Laboratory', description: 'ICT and digital learning workstation lab', items: 'Desktops, printers, projectors, networking gear' },
  { id: 'science-lab', name: 'Science Laboratory', description: 'General science practicals and experiments', items: 'Microscopes, slides, reagents, Bunsen burners' },
  { id: 'workshop', name: 'Technical Workshop', description: 'Engineering and trades practical workshop', items: 'Lathes, grinders, welding stations, hand tools' },
]

export function InventoryManagement({ canManage }: { canManage?: boolean }) {
  const [tab, setTab] = useState<InventoryTab>('assets')
  const [selectedLab, setSelectedLab] = useState<string | null>(null)

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
        <button role="tab" aria-selected={tab === 'laboratories'} className={tab === 'laboratories' ? 'active' : ''} onClick={() => setTab('laboratories')}>Laboratories</button>
        <button role="tab" aria-selected={tab === 'suppliers'} className={tab === 'suppliers' ? 'active' : ''} onClick={() => setTab('suppliers')}>Suppliers</button>
        <button role="tab" aria-selected={tab === 'issuances'} className={tab === 'issuances' ? 'active' : ''} onClick={() => setTab('issuances')}>Issuances</button>
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Reports</button>
      </div>

      {tab === 'assets' && (
        <div className="placeholder-panel">
          <h4>Asset Register</h4>
          <p className="empty">Track institutional assets (furniture, equipment, vehicles, ICT devices). CRUD and depreciation tracking coming soon.</p>
        </div>
      )}

      {tab === 'stock' && (
        <div className="placeholder-panel">
          <h4>Stock Management</h4>
          <p className="empty">Track consumables, reagents, stationery, and general supplies. Stock levels, reorder points, and expiry tracking coming soon.</p>
        </div>
      )}

      {tab === 'laboratories' && (
        <div className="laboratories-section">
          <h4>Laboratories</h4>
          <p className="empty">Select a laboratory to view and fill placeholder inventory details.</p>
          <div className="laboratory-grid">
            {LABORATORIES.map(lab => (
              <div
                key={lab.id}
                className={`laboratory-card ${selectedLab === lab.id ? 'selected' : ''}`}
                onClick={() => setSelectedLab(selectedLab === lab.id ? null : lab.id)}
              >
                <h5>{lab.name}</h5>
                <p>{lab.description}</p>
                <p><strong>Typical items:</strong> {lab.items}</p>
                {selectedLab === lab.id && (
                  <div className="lab-placeholder-form">
                    <div className="form-row">
                      <label>Equipment Count<input type="number" placeholder="0" /></label>
                      <label>Last Stock Date<input type="date" /></label>
                    </div>
                    <div className="form-row">
                      <label>Condition<select><option>Good</option><option>Fair</option><option>Needs Repair</option></select></label>
                      <label>Assigned To<input placeholder="Staff or department name" /></label>
                    </div>
                    <div className="form-row">
                      <label>Notes<textarea placeholder="Additional notes..." rows={3} /></label>
                    </div>
                    {canManage && <button className="secondary-button">Save Placeholder</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="placeholder-panel">
          <h4>Suppliers</h4>
          <p className="empty">Vendor and supplier directory with contact details and performance tracking coming soon.</p>
        </div>
      )}

      {tab === 'issuances' && (
        <div className="placeholder-panel">
          <h4>Issuances</h4>
          <p className="empty">Item issuance log to staff, departments, and students with return tracking coming soon.</p>
        </div>
      )}

      {tab === 'reports' && (
        <div className="placeholder-panel">
          <h4>Inventory Reports</h4>
          <p className="empty">Stock valuation, asset register, issuance summary, and lab utilization reports coming soon.</p>
        </div>
      )}
    </section>
  )
}
