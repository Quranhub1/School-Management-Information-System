import { useEffect, useState } from 'react'
import { getInventoryStockAlerts, type InventoryStockAlert } from '../api/inventoryRegisters'
import { AgGridTable } from './AgGridTable'
import type { ColDef } from 'ag-grid-community'

export function InventoryStockAlerts() {
  const [alerts, setAlerts] = useState<InventoryStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const columns: ColDef<InventoryStockAlert>[] = [
    { field: 'status', headerName: 'Severity', minWidth: 150 },
    { field: 'itemName', headerName: 'Item', minWidth: 180 },
    { field: 'sectionName', headerName: 'Inventory', minWidth: 180 },
    { field: 'quantity', headerName: 'Current quantity', minWidth: 150 },
    { field: 'reorderLevel', headerName: 'Warning threshold', minWidth: 160, valueFormatter: params => Number(params.value) > 0 ? String(params.value) : 'Out-of-stock only' },
  ]

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const result = await getInventoryStockAlerts()
        if (active) { setAlerts(result); setError('') }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load stock alerts.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 60_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  return <section className="panel" aria-label="Inventory stock warnings">
    <div className="panel-heading">
      <div><span className="eyebrow">INVENTORY WATCH</span><h3>Low-stock warnings</h3><p className="empty">Items at or below the thresholds configured by the System Administrator, plus any item that has run out.</p></div>
      <span className="status-badge">{loading ? 'Checking…' : `${alerts.length} alert${alerts.length === 1 ? '' : 's'}`}</span>
    </div>
    {error && <div className="error" role="alert">Stock warnings could not be loaded: {error}</div>}
    {!loading && !error && alerts.length === 0 && <p className="empty">No low-stock items right now. Items that run out will be flagged automatically.</p>}
    {alerts.length > 0 && <AgGridTable
      rows={alerts}
      columns={columns}
      height={420}
      pageSize={25}
      exportFileName="inventory-stock-alerts"
      getRowId={params => `${params.data.sectionId}:${params.data.rowId}`}
    />}
  </section>
}
