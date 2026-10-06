import { useEffect, useState } from 'react'
import { getLowStockItems, StockItem } from '../api/inventory'

export function LowStockItemsTable() {
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLowStockItems()
  }, [])

  const loadLowStockItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await getLowStockItems()
      setLowStockItems(items)
    } catch (err) {
      setError('Failed to load low stock items')
      console.error('Low stock items load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="table-wrap">
      <div className="table-loading">Loading low stock items...</div>
    </div>
  }

  if (error) {
    return <div className="table-wrap">
      <div className="table-error">{error}</div>
    </div>
  }

  return (
    <section className="panel" aria-label="Low Stock Items">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INVENTORY</span>
          <h3>Low Stock Items</h3>
          <p>Items that need to be reordered (quantity at or below reorder level)</p>
        </div>
      </div>
      
      {lowStockItems.length === 0 ? (
        <div className="table-wrap">
          <div className="empty">No low stock items found. All items are above their reorder levels.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current Quantity</th>
                <th>Reorder Level</th>
                <th>Location</th>
                <th>Days Until Stockout (Est.)</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.category}</td>
                  <td>{item.unit}</td>
                  <td>{item.quantity}</td>
                  <td>{item.reorderLevel}</td>
                  <td>{item.location || '-'}</td>
                  <td>
                    {/* Simple estimation: if we use 1 unit per day, how many days until stockout */}
                    {Math.max(0, Math.floor(item.quantity))} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}