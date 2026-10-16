import { useEffect, useState } from 'react'
import LoadingSpinner from './LoadingSpinner';
import { createStaff, updateStaff, deleteStaff, activateStaff, deactivateStaff, listStaff, listLeave, requestLeave, approveLeave, STAFF_CHANGED_EVENT, type StaffMember, type LeaveRequest } from '../api/staff'
import { listPayroll, generatePayroll, markPayrollPaid, type PayrollRecord } from '../api/payroll'

type Tab = 'staff' | 'payroll' | 'leave' | 'recruitment'

export function StaffManagement({ canManage = false, canReadPayroll = false, activeSubsection = null }: { canManage?: boolean; canReadPayroll?: boolean; activeSubsection?: string | null }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'staff' | 'payroll' | 'leave' | 'recruitment'>('staff')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const nextTab: Tab | undefined = activeSubsection === 'staff' ? 'staff'
      : activeSubsection === 'payroll' ? 'payroll'
      : activeSubsection === 'leave' ? 'leave'
      : activeSubsection === 'recruitment' ? 'recruitment'
      : undefined
    if (nextTab === 'payroll' && !canReadPayroll) return
    if ((nextTab === 'leave' || nextTab === 'recruitment') && !canManage) return
    if (nextTab) setTab(nextTab)
  }, [activeSubsection, canManage, canReadPayroll])

  async function loadStaff() { setLoading(true); try { setStaff(await listStaff(false)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load staff.') } finally { setLoading(false) } }
  async function loadLeave() { if (!leaveForm.staffMemberId.trim()) return; try { setLeaveRequests(await listLeave(leaveForm.staffMemberId.trim())) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load leave requests.') } }
  async function loadPayroll() { try { setPayroll(await listPayroll()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load payroll.') } }

  const [form, setForm] = useState({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent', staffType: 'Teaching' })
  const [leaveForm, setLeaveForm] = useState({ staffMemberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' })

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ module?: string; subsection?: string }>).detail
      if (detail?.module !== 'staff' || !detail.subsection) return
      const nextTab: Tab | undefined = detail.subsection === 'staff' ? 'staff'
        : detail.subsection === 'payroll' ? 'payroll'
        : detail.subsection === 'leave' ? 'leave'
        : detail.subsection === 'recruitment' ? 'recruitment'
        : undefined
      if (nextTab === 'payroll' && !canReadPayroll) return; if ((nextTab === 'leave' || nextTab === 'recruitment') && !canManage) return; if (nextTab) setTab(nextTab)
    }
    window.addEventListener('smis:navigate-subsection', handler)
    return () => window.removeEventListener('smis:navigate-subsection', handler)
  }, [canManage, canReadPayroll])

  useEffect(() => {
    void loadStaff()
    const onStaffChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ staff?: StaffMember }>).detail
      if (detail?.staff) {
        setStaff(current => [detail.staff!, ...current.filter(item => item.id !== detail.staff!.id)])
        return
      }
      void loadStaff()
    }
    window.addEventListener(STAFF_CHANGED_EVENT, onStaffChanged)
    return () => window.removeEventListener(STAFF_CHANGED_EVENT, onStaffChanged)
  }, [])
  useEffect(() => { if (canManage && tab === 'leave') void loadLeave() }, [tab, canManage])
  useEffect(() => { if (canReadPayroll && tab === 'payroll') void loadPayroll() }, [tab, canReadPayroll])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editingStaffId) {
        const updated = await updateStaff(editingStaffId, { id: editingStaffId, ...form })
        setStaff(current => current.map(item => item.id === updated.id ? updated : item))
        setSuccess(`${updated.firstName} ${updated.lastName} was updated successfully.`)
        setEditingStaffId(null)
      } else {
        const created = await createStaff(form)
        // Add the server-confirmed record immediately, then reconcile with the API list.
        setStaff(current => [created, ...current.filter(item => item.id !== created.id)])
        setSuccess(`${created.firstName} ${created.lastName} was saved and added to the staff table.`)
        void listStaff(false).then(latest => {
          setStaff(latest.some(item => item.id === created.id) ? latest : [created, ...latest])
        }).catch(() => {
          // Keep the confirmed create response visible even if the follow-up list refresh fails.
        })
      }
      setForm({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent', staffType: 'Teaching' })
    } catch (e) {
      setError(e instanceof Error ? e.message : editingStaffId ? 'Unable to update staff.' : 'Unable to create staff.')
      // A duplicate may be an inactive record, so refresh the complete staff list too.
      try { setStaff(await listStaff(false)) } catch { /* Preserve the original create error. */ }
    }
  }
  function beginEdit(person: StaffMember) {
    setEditingStaffId(person.id)
    setForm({ staffNumber: person.staffNumber, firstName: person.firstName, lastName: person.lastName, nationalId: person.nationalId ?? '', phoneNumber: person.phoneNumber ?? '', email: person.email ?? '', employmentType: person.employmentType, staffType: person.staffType ?? 'Teaching' })
    setError('')
    setSuccess('')
    setTab('staff')
  }
  function cancelEdit() {
    setEditingStaffId(null)
    setForm({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent', staffType: 'Teaching' })
  }
  async function deactivate(id: string) {
    if (!window.confirm('Deactivate this staff member? They will remain in the records but will be marked inactive.')) return
    try {
      await deactivateStaff(id)
      setStaff(current => current.map(person => person.id === id ? { ...person, isActive: false } : person))
      setSuccess('Staff member deactivated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to deactivate staff.') }
  }
  async function activate(id: string) {
    try {
      await activateStaff(id)
      setStaff(current => current.map(person => person.id === id ? { ...person, isActive: true } : person))
      setSuccess('Staff member activated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to activate staff.') }
  }
  async function removeStaff(person: StaffMember) {
    if (!window.confirm(`Permanently delete ${person.firstName} ${person.lastName} (staff no. ${person.staffNumber})? This cannot be undone.`)) return
    try {
      await deleteStaff(person.id)
      setStaff(current => current.filter(item => item.id !== person.id))
      if (editingStaffId === person.id) cancelEdit()
      setSuccess(`${person.firstName} ${person.lastName} was deleted.`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete staff. They may be linked to other records.') }
  }
  async function submitLeave(e: React.FormEvent) { e.preventDefault(); setError(''); try { await requestLeave(leaveForm.staffMemberId.trim(), { ...leaveForm, staffMemberId: leaveForm.staffMemberId.trim() }); setLeaveForm({ staffMemberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' }); await loadLeave() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to request leave.') } }
  async function approveLeaveRequest(id: string, approved: boolean) { try { await approveLeave(id, '', approved); await loadLeave() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to approve leave.') } }
  async function handleGeneratePayroll() { try { await generatePayroll(payrollMonth, payrollYear); await loadPayroll() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to generate payroll.') } }
  async function handleMarkPaid(id: string) { try { await markPayrollPaid(id); await loadPayroll() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to mark payroll as paid.') } }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HR</span>
          <h2>Staff Management</h2>
        </div>
        <span className="status">{staff.filter(s => s.isActive).length} active</span>
      </div>

      <div className="library-workspace-tabs" role="tablist" aria-label="Staff sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'staff'} className={tab === 'staff' ? 'active' : ''} onClick={() => setTab('staff')}>Staff</button>
        {canReadPayroll && <button role="tab" aria-selected={tab === 'payroll'} className={tab === 'payroll' ? 'active' : ''} onClick={() => setTab('payroll')}>Payroll</button>}
        {canManage && <button role="tab" aria-selected={tab === 'leave'} className={tab === 'leave' ? 'active' : ''} onClick={() => setTab('leave')}>Leave</button>}
        {canManage && <button role="tab" aria-selected={tab === 'recruitment'} className={tab === 'recruitment' ? 'active' : ''} onClick={() => setTab('recruitment')}>Recruitment</button>}
      </div>

      {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status" aria-live="polite">{success}</div>}

      {error && (
        <div
          className="mb-5 flex items-start justify-between gap-3 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-yellow-50 p-4 text-sm text-amber-950 shadow-md shadow-amber-900/5 ring-1 ring-amber-100"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-xl font-bold text-amber-600 shadow-sm ring-4 ring-amber-100/70"
            >
              !
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Warning</p>
              <h3 className="mb-1 text-base font-semibold tracking-tight text-slate-900">
                {/staff number is already registered|staff member with this staff number already exists/i.test(error)
                  ? 'Staff member already registered'
                  : 'Action requires attention'}
              </h3>
              <p className="max-w-3xl leading-6 text-slate-700">
                {/staff number is already registered|staff member with this staff number already exists/i.test(error)
                  ? 'This staff number is already in use. Please check the existing staff record or enter a unique staff number.'
                  : error}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss warning"
            title="Dismiss warning"
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-lg font-semibold leading-none text-slate-500 transition hover:bg-amber-100 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {tab === 'staff' && (
        <>
          {canManage && (
            <form className="grid-form" onSubmit={submit}>
              <input placeholder="Staff number" value={form.staffNumber} onChange={e => setForm({ ...form, staffNumber: e.target.value })} required />
              <input placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              <input placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
              <label className="field-label">Employment type
                <select aria-label="Employment type" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} required>
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </label>
              <input placeholder="Phone" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <button type="submit">{editingStaffId ? 'Save changes' : 'Add staff member'}</button>
              {editingStaffId && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel edit</button>}
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff No.</th><th>Name</th><th>Employment</th><th>Contact</th><th>Status</th>{canManage && <th>Actions</th>}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={canManage ? 6 : 5}><LoadingSpinner label="Loading staff…" /></td></tr> : staff.length === 0 ? <tr><td colSpan={canManage ? 6 : 5} className="empty">No staff records found. If a staff number is reported as a duplicate, check the list-loading warning or your access permissions.</td></tr> : staff.map(s => (
                  <tr key={s.id}><td>{s.staffNumber}</td><td>{s.firstName} {s.lastName}</td><td>{s.employmentType}</td><td>{s.email || s.phoneNumber || '—'}</td><td><span className="badge" style={{ background: s.isActive ? '#d1fae5' : '#e5e7eb', color: s.isActive ? '#065f46' : '#374151' }}>{s.isActive ? 'Active' : 'Inactive'}</span></td>{canManage && <td><div className="flex flex-wrap gap-2"><button type="button" className="secondary-button" onClick={() => beginEdit(s)}>Edit</button>{s.isActive ? <button type="button" className="secondary-button" onClick={() => void deactivate(s.id)}>Deactivate</button> : <button type="button" className="secondary-button" onClick={() => void activate(s.id)}>Activate</button>}<button type="button" className="secondary-button" onClick={() => void removeStaff(s)}>Delete</button></div></td>}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'payroll' && (
        <div>
          <div className="summary-grid" style={{ marginBottom: 22 }}>
            <div className="summary-card"><span>Month</span><strong>{new Date(payrollYear, payrollMonth - 1).toLocaleString('default', { month: 'long' })} {payrollYear}</strong></div>
            <div className="summary-card"><span>Total Payroll</span><strong>UGX {payroll.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}</strong></div>
            <div className="summary-card"><span>Paid</span><strong style={{ color: '#059669' }}>{payroll.filter(p => p.status === 'Paid').length}</strong></div>
            <div className="summary-card"><span>Pending</span><strong style={{ color: '#d97706' }}>{payroll.filter(p => p.status === 'Pending').length}</strong></div>
          </div>
          {canManage && <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <select value={payrollMonth} onChange={e => setPayrollMonth(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>)}</select>
            <input type="number" value={payrollYear} onChange={e => setPayrollYear(Number(e.target.value))} style={{ width: 100 }} />
            <button className="btn" onClick={() => void handleGeneratePayroll()}>Generate Payroll</button>
          </div>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff</th><th>Month</th><th>Year</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th>{canManage && <th>Action</th>}</tr></thead>
              <tbody>
                {payroll.length === 0 ? <tr><td colSpan={canManage ? 9 : 8} className="empty">No payroll records found.</td></tr> : payroll.map(p => (
                  <tr key={p.id}><td>{p.staffMemberId}</td><td>{p.month}</td><td>{p.year}</td><td>UGX {p.basicSalary.toLocaleString()}</td><td>UGX {p.allowances.toLocaleString()}</td><td>UGX {p.deductions.toLocaleString()}</td><td><strong>UGX {p.netPay.toLocaleString()}</strong></td><td><span className="badge" style={{ background: p.status === 'Paid' ? '#d1fae5' : '#fef3c7', color: p.status === 'Paid' ? '#065f46' : '#92400e' }}>{p.status}</span></td>{canManage && <td>{p.status === 'Pending' && <button className="secondary-button" onClick={() => void handleMarkPaid(p.id)}>Mark Paid</button>}</td>}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <>
          {canManage && (
            <form className="grid-form" onSubmit={submitLeave}>
              <input placeholder="Staff ID" value={leaveForm.staffMemberId} onChange={e => setLeaveForm({ ...leaveForm, staffMemberId: e.target.value })} required />
              <select value={leaveForm.leaveType} onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}><option>Annual</option><option>Sick</option><option>Maternity</option><option>Paternity</option><option>Study</option></select>
              <input placeholder="Start date" type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
              <input placeholder="End date" type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
              <input placeholder="Reason" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} required />
              <button type="submit">Request Leave</button>
              <button type="button" className="secondary-button" onClick={() => void loadLeave()}>Load Leave</button>
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff</th><th>Type</th><th>Start</th><th>End</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {leaveRequests.length === 0 ? <tr><td colSpan={7} className="empty">No leave requests found.</td></tr> : leaveRequests.map(lr => (
                  <tr key={lr.id}><td>{lr.staffMemberId}</td><td>{lr.leaveType}</td><td>{lr.startDate}</td><td>{lr.endDate}</td><td>{lr.reason}</td><td><span className="badge" style={{ background: lr.status === 'Approved' ? '#d1fae5' : lr.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: lr.status === 'Approved' ? '#065f46' : lr.status === 'Rejected' ? '#991b1b' : '#92400e' }}>{lr.status}</span></td><td>{lr.status === 'Pending' && canManage && <><button className="secondary-button" onClick={() => void approveLeaveRequest(lr.id, true)}>Approve</button><button className="secondary-button" onClick={() => void approveLeaveRequest(lr.id, false)}>Reject</button></>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'recruitment' && (
        <div className="card">
          <h3>Recruitment & Onboarding</h3>
          <p className="empty">Staff recruitment workflow will be available here. Post vacancies, receive applications, shortlist, interview, and onboard new staff.</p>
        </div>
      )}
    </section>
  )
}
