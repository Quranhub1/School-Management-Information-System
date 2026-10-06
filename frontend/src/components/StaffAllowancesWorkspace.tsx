import { useEffect, useState } from 'react'
import { getSession } from '../api/auth'
import { listStaff, type StaffMember } from '../api/staff'
import { authorizeStaffAllowance, listStaffAllowances, recordStaffAllowance, type StaffAllowance } from '../api/staffAllowances'

const ALLOWANCE_TYPES = ['Transport', 'Housing', 'Medical', 'Responsibility', 'Acting', 'Communication', 'Airtime', 'Meal', 'Travel', 'Duty', 'Overtime', 'Other']

export function StaffAllowancesWorkspace() {
  const roles = getSession()?.roles ?? []
  const isAccountant = roles.includes('Accountant') || roles.includes('SystemAdministrator') || roles.includes('FinanceOfficer')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [allowances, setAllowances] = useState<StaffAllowance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [staffMemberId, setStaffMemberId] = useState('')
  const [allowanceType, setAllowanceType] = useState(ALLOWANCE_TYPES[0])
  const [amount, setAmount] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10))
  const [frequency, setFrequency] = useState('Monthly')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [staffData, allowanceData] = await Promise.all([listStaff(), listStaffAllowances()])
      setStaff(staffData)
      setAllowances(allowanceData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load staff allowances.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function authorize(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      await authorizeStaffAllowance({
        staffMemberId,
        allowanceType,
        amount: Number(amount),
        effectiveFrom,
        frequency,
        currency: 'UGX',
        reason,
        reference
      })
      setAmount(''); setReason(''); setReference('')
      setMessage('Allowance authorized and sent to the recording queue.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to authorize allowance.')
    } finally {
      setSaving(false)
    }
  }

  async function record(id: string) {
    setSaving(true); setError(''); setMessage('')
    try {
      await recordStaffAllowance(id)
      setMessage('Allowance recorded successfully. It is now available to payroll.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to record allowance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="finance-surface" aria-label="Staff allowances">
      <div className="finance-surface-heading">
        <div>
          <span className="eyebrow">STAFF FINANCE</span>
          <h3>Staff Allowances</h3>
          <p>{isAccountant ? 'Authorize staff allowances. The Assistant Accountant records authorized allowances before payroll processing.' : 'Record allowances supplied and authorized by the Accountant. You cannot authorize new allowances.'}</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void load()} disabled={loading}>Refresh</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {message && <div className="success" role="status">{message}</div>}

      {isAccountant && (
        <form onSubmit={authorize} className="panel" style={{ padding: 18, marginBottom: 18 }}>
          <h4>Authorize Allowance</h4>
          <div className="form-row">
            <label>Staff
              <select value={staffMemberId} onChange={e => setStaffMemberId(e.target.value)} required>
                <option value="">Select staff</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.staffNumber})</option>)}
              </select>
            </label>
            <label>Allowance Type
              <select value={allowanceType} onChange={e => setAllowanceType(e.target.value)}>{ALLOWANCE_TYPES.map(x => <option key={x}>{x}</option>)}</select>
            </label>
            <label>Amount (UGX)
              <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            </label>
            <label>Effective From
              <input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} required />
            </label>
            <label>Frequency
              <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option>Monthly</option><option>One-time</option><option>Weekly</option><option>Daily</option>
              </select>
            </label>
            <label>Reference
              <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Approval/reference" />
            </label>
          </div>
          <label>Reason / authorization note
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason or approved instruction" />
          </label>
          <div className="topbar-actions" style={{ marginTop: 12 }}>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Authorize Allowance'}</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        {loading ? <p className="empty">Loading allowances…</p> : (
          <table>
            <thead><tr><th>Staff</th><th>Allowance</th><th>Amount</th><th>Effective</th><th>Frequency</th><th>Status</th><th>Authorized By</th><th>Recorded By</th><th>Action</th></tr></thead>
            <tbody>
              {allowances.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.staffName}</strong><br /><small>{a.staffNumber}</small></td>
                  <td>{a.allowanceType}</td>
                  <td>UGX {a.amount.toLocaleString('en-UG')}</td>
                  <td>{a.effectiveFrom}</td>
                  <td>{a.frequency}</td>
                  <td>{a.status}</td>
                  <td>{a.authorizedBy ?? '—'}</td>
                  <td>{a.recordedBy ?? '—'}</td>
                  <td>{a.status === 'Authorized' && <button type="button" className="secondary-button" onClick={() => void record(a.id)} disabled={saving}>Record</button>}</td>
                </tr>
              ))}
              {allowances.length === 0 && <tr><td colSpan={9} className="empty">No staff allowances found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
