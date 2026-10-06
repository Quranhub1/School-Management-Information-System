import { useEffect, useState, useFormEvent } from 'react'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, Supplier } from '../api/inventory'

export function SuppliersTable({ canManage = true }: { canManage?: boolean }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Supplier>>({})

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await getSuppliers()
      setSuppliers(items)
    } catch (err) {
      setError('Failed to load suppliers')
      console.error('Suppliers load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category) {
      setError('Name and category are required')
      return
    }

    try {
      await createSupplier(formData as Omit<Supplier, 'id'>)
      setFormData({})
      await loadSuppliers()
    } catch (err) {
      setError('Failed to create supplier')
      console.error('Supplier creation error:', err)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    try {
      await updateSupplier(editingId, formData as Partial<Supplier>)
      setEditingId(null)
      setFormData({})
      await loadSuppliers()
    } catch (err) {
      setError('Failed to update supplier')
      console.error('Supplier update error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return

    try {
      await deleteSupplier(id)
      await loadSuppliers()
    } catch (err) {
      setError('Failed to delete supplier')
      console.error('Supplier deletion error:', err)
    }
  }

  const handleStartEdit = (supplier: Supplier) => {
    setEditingId(supplier.id)
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      category: supplier.category,
      isActive: supplier.isActive
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({})
  }

  if (loading) {
    return <div className="table-wrap">
      <div className="table-loading">Loading suppliers...</div>
    </div>
  }

  if (error) {
    return <div className="table-wrap">
      <div className="table-error">{error}</div>
    </div>
  }

  return (
    <section className="panel" aria-label="Suppliers Management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INVENTORY</span>
          <h3>Suppliers</h3>
          <p>Manage inventory suppliers and vendors</p>
        </div>
        {canManage && !editingId && (
          <button className="primary-button" onClick={() => setEditingId('new')}>
            Add New Supplier
          </button>
        )}
      </div>
      
      {editingId === 'new' && (
        <form className="management-form" onSubmit={handleCreate}>
          <div className="form-grid">
            <div>
              <label>Supplier Name*</label>
              <input 
                required 
                value={formData.name || ''} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div>
              <label>Contact Person</label>
              <input 
                value={formData.contactPerson || ''} 
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} 
              />
            </div>
            <div>
              <label>Phone</label>
              <input 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div>
              <label>Email</label>
              <input 
                type="email" 
                value={formData.email || ''} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
            <div>
              <label>Address</label>
              <input 
                value={formData.address || ''} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
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
              <label>Is Active</label>
              <input 
                type="checkbox" 
                checked={formData.isActive ?? true} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
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
              </button>
            </div>
          </form>
        )}

        {editingId && editingId !== 'new' && (
          <form className="management-form" onSubmit={handleUpdate}>
            <div className="form-grid">
              <div>
                <label>Supplier Name*</label>
                <input 
                  required 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div>
              <label>Contact Person</label>
              <input 
                value={formData.contactPerson || ''} 
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} 
              />
            </div>
            <div>
              <label>Phone</label>
              <input 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div>
              <label>Email</label>
              <input 
                type="email" 
                value={formData.email || ''} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
            <div>
              <label>Address</label>
              <input 
                value={formData.address || ''} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
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
              <label>Is Active</label>
              <input 
                type="checkbox" 
                checked={formData.isActive ?? true} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-button">Save Changes</button>
              <button type="button" className="secondary-button" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {!editingId && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td><strong>{supplier.name}</strong></td>
                    <td>{supplier.contactPerson || '-'}</td>
                    <td>{supplier.phone || '-'}</td>
                    <td>{supplier.email || '-'}</td>
                    <td>{supplier.category}</td>
                    <td>
                      <span className={`supplier-status ${supplier.isActive ? 'active' : 'inactive'}`}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="table-actions">
                        <button 
                          className="action-button" 
                          onClick={() => handleStartEdit(supplier)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button destructive" 
                          onClick={() => handleDelete(supplier.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 7 : 6} className="empty">
                      No suppliers found. {canManage && 'Add one to get started.'}
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