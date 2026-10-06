import { useEffect, useState click to see more
} from 'react'
import { getStockTransactions, StockTransaction } from '../api/inventory'
import { getStockItem } from '../api/inventory'

export function StockTransactionHistoryTable({ 
  stockItemId: filterStockItemId = undefined,
  fromDate: filterFromDate = undefined,
  toDate: filterToDate = undefined,
  transactionType: filterTransactionType = undefined 
}: { 
  stockItemId?: string;
  fromDate?: string;
  toDate?: string;
  transactionType?: string;
}) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stockItemsCache, setStockItemsCache] = useState<Record<string, StockItem>>({})

  useEffect(() => {
    loadTransactionHistory()
  }, [filterStockItemId, filterFromDate, filterToDate, filterTransactionType])

  const loadTransactionHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await getStockTransactions(
        filterStockItemId,
        filterFromDate,
        filterToDate,
        filterTransactionType
      )
      setTransactions(items)
      
      // Pre-load stock items for display
      const stockItemIds = [...new Set(items.map(t => t.stockItemId))]
      const stockItemsPromises = stockItemIds.map(id => 
        getStockItem(id).then(item => [id, item]).catch(() => [id, null])
      )
      const stockItemsResults = await Promise.all(stockItemsPromises)
      const stockItemsMap = Object.fromEntries(
        stockItemsResults.filter(([_, item]): item is StockItem => item !== null)
      )
      setStockItemsCache(stockItemsMap)
    } catch (err) {
      setError('Failed to load stock transaction history')
      console.error('Stock transaction history load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="table-wrap">
      <div className="table-loading">Loading transaction history...</div>
    </div>
  }

  if (error) {
    return <div className="table-wrap">
      <div className="table-error">{error}</div>
    </div>
  }

  return (
    <section className="panel" aria-label="Stock Transaction History">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INVENTORY</span>
          <h3>Stock Transaction History</h3>
          <p>View all inventory stock transactions</p>
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <div className="table-wrap">
          <div className="empty">No stock transactions found matching the current filters.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Transaction Type</th>
                <th>Quantity</th>
                <th>Issued To/From</th>
                <th>Reference</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => {
                const stockItem = stockItemsCache[transaction.stockItemId];
                return (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                    <td>
                      <strong>{stockItem?.name || 'Unknown Item'}</strong>
                      <br/>
                      <small>{stockItem?.unit}</small>
                    </td>
                    <td>
                      <span className={`transaction-type-${transaction.transactionType.toLowerCase()}`}>
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td>{transaction.quantity}</td>
                    <td>
                      {transaction.transactionType === 'Issued' || transaction.transactionType === 'Transferred'
                        ? `To: ${transaction.issuedTo || '-'}`
                        : transaction.transactionType === 'Received'
                          ? `From: ${transaction.receivedFrom || '-'}`
                          : '-'}
                    </td>
                    <td>{transaction.referenceNumber || '-'}</td>
                    <td>{transaction.recordedBy}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}