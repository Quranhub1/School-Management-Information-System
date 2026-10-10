import { useEffect, useState } from 'react'
import { getInventoryStockAlerts, type InventoryStockAlert } from '../api/inventoryRegisters'

export function InventoryStockAlerts() {
  const [alerts, setAlerts] = useState<InventoryStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    {alerts.length > 0 && <div className="table-wrap"><table>
      <thead><tr><th>Severity</th><th>Item</th><th>Inventory</th><th>Current quantity</th><th>Warning threshold</th></tr></thead>
      <tbody>{alerts.map(alert => <tr key={`${alert.sectionId}:${alert.rowId}`}>
        <td><span className="badge" style={{ background: alert.status === 'Out of stock' ? '#fee2e2' : '#fef3c7', color: alert.status === 'Out of stock' ? '#991b1b' : '#92400e' }}>{alert.status}</span></td>
        <td>{alert.itemName}</td><td>{alert.sectionName}</td><td>{alert.quantity}</td><td>{alert.reorderLevel > 0 ? alert.reorderLevel : 'Out-of-stock only'}</td>
      </tr>)}</tbody>
    </table></div>}
  </section>
}
