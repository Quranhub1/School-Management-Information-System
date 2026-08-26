import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createFeeStructure, getFeeStructures, type FeeStructure } from '../api/finance'
import { getAccessToken } from '../api/auth'

export function FeeStructuresManagement() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [programmeId, setProgrammeId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [totalAmount, setTotalAmount] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getFeeStructures(academicYearId || undefined)
      setFeeStructures(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load fee structures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [academicYearId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await createFeeStructure({
        programmeId: programmeId.trim(),
        academicYearId: academicYearId.trim(),
        name: name.trim(),
        totalAmount: Number(totalAmount),
        currency: 'UGX',
      })
      setName('')
      setProgrammeId('')
      setAcademicYearId('')
      setTotalAmount('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create fee structure.')
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setError('')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''}/api/finance/fee-structures/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!response.ok) throw new Error('Failed to update fee structure status.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update fee structure status.')
    }
  }

  return (
    <section className="panel" aria-label="Fee structures management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FINANCE</span>
          <h2>Fee Structures</h2>
        </div>
        <button className="secondary-button" onClick={() => void load()}>Refresh</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <form className="student-form" onSubmit={submit}>
        <h3>Create Fee Structure</h3>
        <div className="form-row">
          <label>Name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard Tuition" required /></label>
          <label>Programme ID<input value={programmeId} onChange={e => setProgrammeId(e.target.value)} placeholder="Programme ID" required /></label>
          <label>Academic Year ID<input value={academicYearId} onChange={e => setAcademicYearId(e.target.value)} placeholder="Academic Year ID" required /></label>
          <label>Total Amount (UGX)<input type="number" min="0" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" required /></label>
        </div>
        <div className="topbar-actions">
          <button type="submit">Create Fee Structure</button>
        </div>
      </form>

      <div className="table-wrap">
        {loading ? (
          <p className="empty">Loading fee structures…</p>
        ) : feeStructures.length === 0 ? (
          <p className="empty">No fee structures found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Academic Year</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeStructures.map(fs => (
                <tr key={fs.id}>
                  <td><strong>{fs.name}</strong></td>
                  <td>{fs.academicYearId}</td>
                  <td>UGX {fs.totalAmount.toLocaleString()}</td>
                  <td>{fs.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className="secondary-button" onClick={() => void toggleActive(fs.id, fs.isActive)}>
                      {fs.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
