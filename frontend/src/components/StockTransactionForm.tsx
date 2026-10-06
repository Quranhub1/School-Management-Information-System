import { useState, useFormEvent } from 'react'
import { recordStockTransaction, getStockItems } from '../api/inventory'
import { StockItem } from '../api/inventory'

type TransactionType = 'Received' | 'Issued' | 'Transferred' | 'Adjusted'

export function StockTransactionForm({ 
  transactionType: initialType,
  onTransactionRecorded,
  canManage = true 
}: { 
  transactionType: TransactionType;
  onTransactionRecorded?: () => void;
  canManage?: boolean;
}) {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    stockItemId: '',
    quantity: '',
    issuedTo: '',
    issuedBy: '',
    receivedFrom: '',
    referenceNumber: '',
    batchNumber: '',
    expiryDate: '',
    notes: ''
  })

  useEffect(() => {
    loadStockItems()
  }, [])

  const loadStockItems = async () => {
    setLoading(true)
    try {
      const items = await getStockItems()
      setStockItems(items)
    } catch (err) {
      console.error('Failed to load stock items for transaction form:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.stockItemId) {
      setError('Please select a stock item')
      return
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    try {
      await recordStockTransaction({
        stockItemId: formData.stockItemId,
        transactionDate: new Date().toISOString().split('T')[0],
        transactionType: initialType,
        quantity: parseFloat(formData.quantity),
        issuedTo: formData.issuedTo || undefined,
        issuedBy: formData.issuedBy || undefined,
        receivedFrom: formData.receivedFrom || undefined,
        referenceNumber: formData.referenceNumber || undefined,
        batchNumber: formData.batchNumber || undefined,
        expiryDate: formData.expiryDate || undefined,
        notes: formData.notes || undefined,
        recordedBy: 'current_user' // In a real app, this would come from auth
      })
      
      setError(null)
      setFormData({
        stockItemId: '',
        quantity: '',
        issuedTo: '',
        issuedBy: '',
        receivedFrom: '',
        referenceNumber: '',
        batchNumber: '',
        expiryDate: '',
        notes: ''
      })
      
      if (onTransactionRecorded) {
        onTransactionRecorded()
      }
    } catch (err) {
      setError('Failed to record transaction')
      console.error('Transaction recording error:', err)
    }
  }

  if (loading) {
    return <div className="transaction-form-loading">Loading stock items...</div>
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>{initialType} Stock Transaction</h3>
        <p>Record a {initialType.toLowerCase()} of inventory stock</p>
      </div>
      
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-grid">
        <div>
          <label>Stock Item*</label>
          <select 
            required 
            value={formData.stockItemId} 
            onChange={(e) => setFormData({ ...formData, stockItemId: e.target.value })} 
          >
            <option value="">Select a stock item...</option>
            {stockItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.unit}) - {item.quantity} available
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Quantity*</label>
          <input 
            type="number" 
            required 
            min="0.001" 
            step="0.001" 
            value={formData.quantity} 
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
          />
        </div>
        
        {initialType === 'Issued' || initialType === 'Transferred' && (
          <div>
            <label>Issued To</label>
            <input 
              value={formData.issuedTo} 
              onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })} 
            />
          </div>
        )}
        
        {initialType === 'Received' && (
          <>
            <div>
              <label>Received From</label>
              <input 
                value={formData.receivedFrom} 
                onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })} 
              />
            </div>
            <div>
              <label>Reference Number (PO/Invoice)</label>
              <input 
                value={formData.referenceNumber} 
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })} 
              />
            </div>
            <div>
              <label>Batch/Lot Number</label>
              <input 
                value={formData.batchNumber} 
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} 
              />
            </div>
            <div>
              <label>Expiry Date</label>
              <input 
                type="date" 
                value={formData.expiryDate} 
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} 
              />
            </div>
          </>
        )}
        
        {initialType === 'Adjusted' && (
          <div>
            <label>New Quantity (sets stock to this value)</label>
            <input 
              type="number" 
              min="0" 
              value={formData.quantity} 
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
            />
          </div>
        )}
        
        <div>
          <label>Notes</label>
          <textarea 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="primary-button"
        >
          Record {initialType} Transaction
        </button>
        <button 
          type="button" 
          className="secondary-button"
          onClick={() => setFormData({
            stockItemId: '',
            quantity: '',
            issuedTo: '',
            issuedBy: '',
            receivedFrom: '',
            referenceNumber: '',
            batchNumber: '',
            expiryDate: '',
            notes: ''
          })}
        >
          Clear Form
        </button>
      </div>
    </form>
  )
}