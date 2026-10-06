import { useEffect, useState, useFormEvent } from 'react'
import { getStockItems, createStockItem, updateStockItem, deleteStockItem, StockItem } from '../api/inventory'

export function StockItemsTable({ canManage = true }: { canManage?: boolean }) {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<StockItem>>({})

  useEffect(() => {
    loadStockItems()
  }, [])

  const loadStockItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await getStockItems()
      setStockItems(items)
    } catch (err) {
      setError('Failed to load stock items')
      console.error('Stock items load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category || !formData.unit) {
      setError('Name, category, and unit are required')
      return
    }

    try {
      await createStockItem(formData as Omit<StockItem, 'id'>)
      setFormData({})
      await loadStockItems()
    } catch (err) {
      setError('Failed to create stock item')
      console.error('Stock item creation error:', err)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    try {
      await updateStockItem(editingId, formData as Partial<StockItem>)
      setEditingId(null)
      setFormData({})
      await loadStockItems()
    } catch (err) {
      setError('Failed to update stock item')
      console.error('Stock item update error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stock item?')) return

    try {
      await deleteStockItem(id)
      await loadStockItems()
    } catch (err) {
      setError('Failed to delete stock item')
      console.error('Stock item deletion error:', err)
    }
  }

  const handleStartEdit = (item: StockItem) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      location: item.location,
      supplierId: item.supplierId,
      expiryDate: item.expiryDate,
      description: item.description,
      isActive: item.isActive
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({})
  }

  if (loading) {
    return <div className="table-wrap">
      <div className="table-loading">Loading stock items...</div>
    </div>
  }

  if (error) {
    return <div className="table-wrap">
      <div className="table-error">{error}</div>
    </div>
  }

  return (
    <section className="panel" aria-label="Stock Items Management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INVENTORY</span>
          <h3>Stock Items</h3>
          <p>Manage inventory stock items</p>
        </div>
        {canManage && !editingId && (
          <button className="primary-button" onClick={() => setEditingId('new')}>
            Add New Stock Item
          </button>
        )}
      </div>
      
      {editingId === 'new' && (
        <form className="management-form" onSubmit={handleCreate}>
          <div className="form-grid">
            <div>
              <label>Item Name*</label>
              <input 
                required 
                value={formData.name || ''} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div>
              <label>Category*</label>
              <input 
                required 
                value={formData.category || ''} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
              />
            </div>
            <div>
              <label>Unit*</label>
              <input 
                required 
                value={formData.unit || ''} 
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
              />
            </div>
            <div>
              <label>Quantity</label>
              <input 
                type="number" 
                min="0" 
                value={formData.quantity ?? 0} 
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })} 
              />
            </div>
            <div>
              <label>Reorder Level</label>
              <input 
                type="number" 
                min="0" 
                value={formData.reorderLevel ?? 0} 
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })} 
              />
            </div>
            <div>
              <label>Location</label>
              <input 
                value={formData.location || ''} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
              />
            </div>
            <div>
              <label>Description</label>
              <textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>
            <div className="form-actions">
              {canManage && (
                <button type="submit" className="primary-button">
                  {editingId ? 'Save' : 'Add'}
                </button>
              )}
              <button type="button" className="secondary-button" onClick={handleCancelEdit}>
                Cancel
              </div>
            </div>
          </form>
        )}

        {editingId && editingId !== 'new' && (
          <form className="management-form" onSubmit={handleUpdate}>
            <div className="form-grid">
              <div>
                <label>Item Name*</label>
                <input 
                  required 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div>
                <label>Category*</label>
                <input 
                  required 
                  value={formData.category || ''} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                />
              </div>
              <div>
                <label>Unit*</label>
                <input 
                  required 
                  value={formData.unit || ''} 
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
                />
              </div>
              <div>
                <label>Quantity</label>
                <input 
                  type="number" 
                  min="0" 
                  value={formData.quantity ?? 0} 
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div>
                <label>Reorder Level</label>
                <input 
                  type="number" 
                  min="0" 
                  value={formData.reorderLevel ?? 0} 
                  onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div>
                <label>Location</label>
                <input 
                  value={formData.location || ''} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                />
              </div>
              <div>
                <label>Description</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-button">Save Changes</button>
                <button type="button" className="secondary-button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {!editingId && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {stockItems.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category}</td>
                    <td>{item.unit}</td>
                    <td>{item.quantity}</td>
                    <td>{item.reorderLevel}</td>
                    <td>
                      <span className={`stock-status ${item.quantity <= item.reorderLevel ? 'low' : 'normal'}`}>
                        {item.quantity <= item.reorderLevel ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="table-actions">
                        <button 
                          className="action-button" 
                          onClick={() => handleStartEdit(item)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button destructive" 
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {stockItems.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 7 : 6} className="empty">
                      No stock items found. {canManage && 'Add one to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )
  )
}