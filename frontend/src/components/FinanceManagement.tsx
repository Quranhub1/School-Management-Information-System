import { useState } from 'react'
import { CashBankPositionReport } from './CashBankPositionReport'
import { AccountsOverviewWorkspace } from './AccountsOverviewWorkspace'
import { StudentFinanceDashboard } from './StudentFinanceDashboard'
import { FeeTypesManager } from './FeeTypesManager'

type FinanceTab = 'fees' | 'fee-setup' | 'accounts' | 'reports'

export function FinanceManagement() {
  const [tab, setTab] = useState<FinanceTab>('fees')

  return (
    <section className="panel" aria-label="Finance management">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">FINANCE</p>
          <h2>Finance & Accounts</h2>
          <p className="finance-muted">Student balances, configurable fee types, collections and accounting reports.</p>
        </div>
      </div>

      <div className="library-workspace-tabs" role="tablist" aria-label="Finance sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'fees'} className={tab === 'fees' ? 'active' : ''} onClick={() => setTab('fees')}>Student Fees</button>
        <button role="tab" aria-selected={tab === 'fee-setup'} className={tab === 'fee-setup' ? 'active' : ''} onClick={() => setTab('fee-setup')}>Fee Types & Charges</button>
        <button role="tab" aria-selected={tab === 'accounts'} className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}>Accounts & Salaries</button>
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Cash & Bank Reports</button>
      </div>

      {tab === 'fees' && <StudentFinanceDashboard />}
      {tab === 'fee-setup' && <FeeTypesManager />}
      {tab === 'accounts' && <AccountsOverviewWorkspace />}
      {tab === 'reports' && <CashBankPositionReport />}
    </section>
  )
}
