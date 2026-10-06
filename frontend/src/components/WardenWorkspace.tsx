import { useState } from 'react';
import { WardenDashboard } from './WardenDashboard';
import { WardenHostelManagement } from './WardenHostelManagement';
import { WardenKitchenCatering } from './WardenKitchenCatering';
import { WardenWelfare } from './WardenWelfare';
import { StockItemsTable } from './StockItemsTable';
import { StockTransactionForm } from './StockTransactionForm';
import { SuppliersTable } from './SuppliersTable';
import { LowStockItemsTable } from './LowStockItemsTable';
import { StockTransactionHistoryTable } from './StockTransactionHistoryTable';

export function WardenWorkspace({ canManage = true }: { canManage?: boolean }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeInventoryTab, setActiveInventoryTab] = useState('stockItems');
  const [activeHostelTab, setActiveHostelTab] = useState('hostelManagement');

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'storesInventory', label: 'Stores & Inventory', icon: '📦' },
    { id: 'hostelAccommodation', label: 'Hostel / Accommodation', icon: '🏠' },
    { id: 'kitchenCatering', label: 'Kitchen & Catering', icon: '🍳' },
    { id: 'welfare', label: 'Welfare', icon: '❤️' }
  ];

  const inventoryTabs = [
    { id: 'stockItems', label: 'Stock Items', icon: '📦' },
    { id: 'receiveStock', label: 'Receive Stock', icon: '📥' },
    { id: 'issueStock', label: 'Issue Stock', icon: '📤' },
    { id: 'stockTransfers', label: 'Stock Transfers', icon: '🔄' },
    { id: 'stockAdjustments', label: 'Stock Adjustments', icon: '⚖️' },
    { id: 'suppliers', label: 'Suppliers', icon: '🚚' },
    { id: 'purchaseRequests', label: 'Purchase Requests', icon: '📋' },
    { id: 'lowStock', label: 'Low Stock', icon: '⚠️' },
    { id: 'stockHistory', label: 'Stock History', icon: '📜' },
    { id: 'inventoryReports', label: 'Inventory Reports', icon: '📊' }
  ];

  const hostelTabs = [
    { id: 'hostelManagement', label: 'Hostel Management', icon: '🏢' },
    { id: 'checkInCheckOut', label: 'Check-in / Check-out', icon: '🚪' },
    { id: 'maintenanceRequests', label: 'Maintenance Requests', icon: '🔧' },
    { id: 'hostelInspections', label: 'Hostel Inspections', icon: '🔍' },
    { id: 'indisciplineCases', label: 'Indiscipline Cases', icon: '⚖️' },
    { id: 'hostelReports', label: 'Hostel Reports', icon: '📋' }
  ];

  const renderInventoryContent = () => {
    switch (activeInventoryTab) {
      case 'stockItems':
        return <StockItemsTable canManage={canManage} />;
      case 'receiveStock':
        return (
          <div className="inventory-form-section">
            <h3>Receive Stock</h3>
            <p>Record receipt of new stock items from suppliers</p>
            <StockTransactionForm 
              transactionType="Received" 
              onTransactionRecorded={() => alert('Stock received successfully!')}
              canManage={canManage}
            />
          </div>
        );
      case 'issueStock':
        return (
          <div className="inventory-form-section">
            <h3>Issue Stock</h3>
            <p>Issue stock items to departments, individuals, or for resident use</p>
            <StockTransactionForm 
              transactionType="Issued" 
              onTransactionRecorded={() => alert('Stock issued successfully!')}
              canManage={canManage}
            />
          </div>
        );
      case 'stockTransfers':
        return (
          <div className="inventory-form-section">
            <h3>Stock Transfers</h3>
            <p>Transfer stock items between different locations or departments</p>
            <StockTransactionForm 
              transactionType="Transferred" 
              onTransactionRecorded={() => alert('Stock transferred successfully!')}
              canManage={canManage}
            />
          </div>
        );
      case 'stockAdjustments':
        return (
          <div className="inventory-form-section">
            <h3>Stock Adjustments</h3>
            <p>Adjust stock quantities due to damage, loss, or correction</p>
            <StockTransactionForm 
              transactionType="Adjusted" 
              onTransactionRecorded={() => alert('Stock adjusted successfully!')}
              canManage={canManage}
            />
          </div>
        );
      case 'suppliers':
        return <SuppliersTable canManage={canManage} />;
      case 'purchaseRequests':
        return (
          <div className="inventory-form-section">
            <h3>Purchase Requests</h3>
            <p>Create and manage purchase requests for stock replenishment</p>
            <p>Purchase request functionality would be implemented here.</p>
          </div>
        );
      case 'lowStock':
        return <LowStockItemsTable />;
      case 'stockHistory':
        return <StockTransactionHistoryTable />;
      case 'inventoryReports':
        return (
          <div className="inventory-form-section">
            <h3>Inventory Reports</h3>
            <p>Generate various inventory reports and analytics</p>
            <p>Inventory reporting functionality would be implemented here.</p>
          </div>
        );
      default:
        return <StockItemsTable canManage={canManage} />;
    }
  };

  const renderHostelContent = () => {
    switch (activeHostelTab) {
      case 'hostelManagement':
        return <WardenHostelManagement canManage={canManage} />;
      case 'checkInCheckOut':
        return (
          <div className="inventory-form-section">
            <h3>Check-in / Check-out</h3>
            <p>Manage resident check-ins and check-outs</p>
            <p>Check-in/check-out functionality would be implemented here.</p>
          </div>
        );
      case 'maintenanceRequests':
        return (
          <div className="inventory-form-section">
            <h3>Maintenance Requests</h3>
            <p>Manage maintenance requests for hostel facilities</p>
            <p>Maintenance request functionality would be implemented here.</p>
          </div>
        );
      case 'hostelInspections':
        return (
          <div className="inventory-form-section">
            <h3>Hostel Inspections</h3>
            <p>Conduct and manage hostel inspections</p>
            <p>Hostel inspection functionality would be implemented here.</p>
          </div>
        );
      case 'indisciplineCases':
        return (
          <div className="inventory-form-section">
            <h3>Indiscipline Cases</h3>
            <p>Manage indiscipline cases and disciplinary actions</p>
            <p>Indiscipline case functionality would be implemented here.</p>
          </div>
        );
      case 'hostelReports':
        return (
          <div className="inventory-form-section">
            <h3>Hostel Reports</h3>
            <p>Generate reports on hostel operations and activities</p>
            <p>Hostel reporting functionality would be implemented here.</p>
          </div>
        );
      default:
        return <WardenHostelManagement canManage={canManage} />;
    }
  };

  return (
    <div className="warden-workspace">
      <div className="warden-workspace-header">
        <h1>Warden Workspace</h1>
        <p>Operational management interface for hostel and welfare operations</p>
      </div>
      
      <div className="warden-workspace-navigation">
        <div className="warden-workspace-main-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => {
                setActiveSection(section.id);
                // Reset sub-tabs when changing main sections
                if (section.id === 'storesInventory') setActiveInventoryTab('stockItems');
                if (section.id === 'hostelAccommodation') setActiveHostelTab('hostelManagement');
              }}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
        
        {activeSection === 'storesInventory' && (
          <div className="warden-workspace-sub-nav">
            {inventoryTabs.map(tab => (
              <button
                key={tab.id}
                className={activeInventoryTab === tab.id ? 'active' : ''}
                onClick={() => setActiveInventoryTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'hostelAccommodation' && (
          <div className="warden-workspace-sub-nav">
            {hostelTabs.map(tab => (
              <button
                key={tab.id}
                className={activeHostelTab === tab.id ? 'active' : ''}
                onClick={() => setActiveHostelTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="warden-workspace-content">
        {activeSection === 'dashboard' && (
          <WardenDashboard canManage={canManage} />
        )}
        
        {activeSection === 'storesInventory' && renderInventoryContent()}
        
        {activeSection === 'hostelAccommodation' && renderHostelContent()}
        
        {activeSection === 'kitchenCatering' && (
          <WardenKitchenCatering canManage={canManage} />
        )}
        
        {activeSection === 'welfare' && (
          <WardenWelfare canManage={canManage} />
        )}
      </div>
    </div>
  )
}