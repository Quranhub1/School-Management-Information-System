import { useEffect, useState } from 'react'
import { formatCurrency, SYSTEM_CURRENCY } from '../lib/currency'
import LoadingSpinner from './LoadingSpinner';
import { AgGridTable } from './AgGridTable'
import type { ColDef } from 'ag-grid-community'
import {
  getDefaulterOverview,
  getDefaulters,
  getStudentDefaulterDetails,
  getFollowUpActions,
  type DefaulterOverview,
  type Defaulter,
  type DefaulterDetail,
  type FollowUpAction,
} from '../api/defaulters'

type Tab = 'overview' | 'list' | 'actions'

export function DefaulterManagement() {
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<DefaulterOverview | null>(null)
  const [defaulters, setDefaulters] = useState<Defaulter[]>([])
  const [actions, setActions] = useState<FollowUpAction[]>([])
  const [selectedStudent, setSelectedStudent] = useState<DefaulterDetail | null>(null)
  const [filterSeverity, setFilterSeverity] = useState('')
  const defaulterColumns: ColDef<Defaulter>[] = [
    { field: 'studentNumber', headerName: 'Student number', minWidth: 150 },
    { field: 'studentName', headerName: 'Student name', minWidth: 200 },
    { field: 'totalBalance', headerName: 'Outstanding balance', minWidth: 170, valueFormatter: p => `${p.data?.currency ?? ''} ${Number(p.value ?? 0).toLocaleString('en-UG')}` },
    { field: 'severity', headerName: 'Severity', minWidth: 130 },
    { field: 'invoiceCount', headerName: 'Invoices', minWidth: 110 },
    { field: 'oldestInvoice', headerName: 'Oldest invoice', minWidth: 150, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('en-UG') : '' },
    { colId: 'view', headerName: 'Actions', minWidth: 110, sortable: false, filter: false, floatingFilter: false, cellRenderer: (p: { data?: Defaulter }) => p.data ? <button className="secondary-button" onClick={() => void viewStudent(p.data!.studentId)}>View</button> : null },
  ]
  const actionColumns: ColDef<FollowUpAction>[] = [
    { field: 'studentName', headerName: 'Student', minWidth: 200 },
    { field: 'totalBalance', headerName: 'Outstanding balance', minWidth: 180, valueFormatter: p => formatCurrency(Number(p.value ?? 0), SYSTEM_CURRENCY) },
    { field: 'severity', headerName: 'Severity', minWidth: 130 },
    { field: 'suggestedActions', headerName: 'Suggested actions', minWidth: 300, valueFormatter: p => Array.isArray(p.value) ? p.value.join(' • ') : '' },
  ]
  type InvoiceRow = DefaulterDetail['invoices'][number]
  const invoiceColumns: ColDef<InvoiceRow>[] = [
    { field: 'invoiceNumber', headerName: 'Invoice', minWidth: 150 },
    { field: 'feeType', headerName: 'Fee type', minWidth: 160 },
    { field: 'amount', headerName: 'Amount', valueFormatter: p => `${p.data?.currency ?? ''} ${Number(p.value ?? 0).toLocaleString('en-UG')}` },
    { field: 'paidAmount', headerName: 'Paid', valueFormatter: p => `${p.data?.currency ?? ''} ${Number(p.value ?? 0).toLocaleString('en-UG')}` },
    { field: 'balance', headerName: 'Balance', valueFormatter: p => `${p.data?.currency ?? ''} ${Number(p.value ?? 0).toLocaleString('en-UG')}` },
    { field: 'status', headerName: 'Status' },
    { field: 'issuedAt', headerName: 'Issued', valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('en-UG') : '' },
    { field: 'daysOverdue', headerName: 'Days overdue', minWidth: 140 },
  ]

  async function loadOverview() {
    setLoading(true)
    setError('')
    try {
      const data = await getDefaulterOverview()
      setOverview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load defaulter overview.')
    } finally {
      setLoading(false)
    }
  }

  async function loadDefaulters() {
    setLoading(true)
    setError('')
    try {
      const data = await getDefaulters(filterSeverity || undefined)
      setDefaulters(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load defaulters list.')
    } finally {
      setLoading(false)
    }
  }

  async function loadActions() {
    setLoading(true)
    setError('')
    try {
      const data = await getFollowUpActions()
      setActions(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load follow-up actions.')
    } finally {
      setLoading(false)
    }
  }

  async function viewStudent(studentId: string) {
    setLoading(true)
    setError('')
    try {
      const data = await getStudentDefaulterDetails(studentId)
      setSelectedStudent(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load student details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'overview') void loadOverview()
    else if (tab === 'list') void loadDefaulters()
    else if (tab === 'actions') void loadActions()
  }, [tab, filterSeverity])

  return (
    <section className="panel" aria-label="Defaulter management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FINANCE</span>
          <h2>Fee Defaulters Management</h2>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Defaulter sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
        <button role="tab" aria-selected={tab === 'list'} className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>Defaulters List</button>
        <button role="tab" aria-selected={tab === 'actions'} className={tab === 'actions' ? 'active' : ''} onClick={() => setTab('actions')}>Follow-up Actions</button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading defaulter records…" />
      ) : tab === 'overview' && overview ? (
        <div className="summary-grid" style={{ marginBottom: 22 }}>
          <div className="summary-card">
            <span>Total Outstanding</span>
            <strong style={{ color: '#dc2626' }}>{formatCurrency(overview.totalOutstanding, SYSTEM_CURRENCY)}</strong>
          </div>
          <div className="summary-card">
            <span>Total Defaulters</span>
            <strong>{overview.totalDefaulters}</strong>
          </div>
          <div className="summary-card">
            <span>Critical (60+ days)</span>
            <strong style={{ color: '#dc2626' }}>{overview.criticalCount}</strong>
          </div>
          <div className="summary-card">
            <span>Warning (30-60 days)</span>
            <strong style={{ color: '#d97706' }}>{overview.warningCount}</strong>
          </div>
        </div>
      ) : tab === 'list' ? (
        <>
          <div className="form-row" style={{ marginBottom: 18 }}>
            <label>
              Filter by Severity
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                <option value="">All</option>
                <option value="Critical">Critical</option>
                <option value="Warning">Warning</option>
                <option value="Recent">Recent</option>
              </select>
            </label>
          </div>
          <AgGridTable rows={defaulters} columns={defaulterColumns} height={440} exportFileName="fee-defaulters" getRowId={p => p.data.studentId} />
        </>
      ) : tab === 'actions' ? (
        <AgGridTable rows={actions} columns={actionColumns} height={420} exportFileName="defaulter-follow-up-actions" getRowId={p => p.data.studentId} />
      ) : null}

      {selectedStudent && (
        <div className="panel" style={{ padding: 22, marginTop: 22 }} aria-label="Student defaulter details">
          <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
            <div>
              <span className="eyebrow">STUDENT DETAILS</span>
              <h3>{selectedStudent.studentName} ({selectedStudent.studentNumber})</h3>
            </div>
            <button className="secondary-button" onClick={() => setSelectedStudent(null)}>Close</button>
          </div>
          <div className="summary-grid" style={{ marginBottom: 22 }}>
            <div className="summary-card">
              <span>Total Balance</span>
              <strong style={{ color: '#dc2626' }}>{formatCurrency(selectedStudent.totalBalance, SYSTEM_CURRENCY)}</strong>
            </div>
          </div>
          <AgGridTable rows={selectedStudent.invoices} columns={invoiceColumns} height={380} exportFileName={`defaulter-invoices-${selectedStudent.studentNumber}`} getRowId={p => p.data.id} />
        </div>
      )}
    </section>
  )
}
