import { showConfirmDialog } from '../utils/confirmDialog'
import { useEffect, useState } from 'react'
import LoadingSpinner from './LoadingSpinner';
import { createStaff, updateStaff, deleteStaff, activateStaff, deactivateStaff, listStaff, listStaffCourseUnits, listStaffDepartments, listLeave, requestLeave, approveLeave, STAFF_CHANGED_EVENT, type StaffMember, type LeaveRequest, type StaffCourseUnit, type StaffDepartment } from '../api/staff'
import { listPayroll, generatePayroll, markPayrollPaid, type PayrollRecord } from '../api/payroll'
import { notify } from './GlobalNotifications'

type Tab = 'staff' | 'payroll' | 'leave' | 'recruitment'

export function StaffManagement({ canManage = false, canReadPayroll = false, activeSubsection = null }: { canManage?: boolean; canReadPayroll?: boolean; activeSubsection?: string | null }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [courseUnits, setCourseUnits] = useState<StaffCourseUnit[]>([])
  const [departments, setDepartments] = useState<StaffDepartment[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'staff' | 'payroll' | 'leave' | 'recruitment'>('staff')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear())
  const selectedPayroll = payroll.filter(p => p.month === payrollMonth && p.year === payrollYear)

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

  const emptyStaffForm = () => ({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent', staffType: 'Teaching', departmentId: '', jobTitle: '', highestQualification: '', speciality: '', professionalRegistration: '', courseUnitIds: [] as string[] })
  const [form, setForm] = useState(emptyStaffForm)
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
    if (canManage) {
      void listStaffCourseUnits().then(setCourseUnits).catch(e => setError(e instanceof Error ? e.message : 'Unable to load course units.'))
      void listStaffDepartments().then(setDepartments).catch(e => setError(e instanceof Error ? e.message : 'Unable to load departments.'))
    }
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
  }, [canManage])
  useEffect(() => { if (canManage && tab === 'leave') void loadLeave() }, [tab, canManage])
  useEffect(() => { if (canReadPayroll && tab === 'payroll') void loadPayroll() }, [tab, canReadPayroll])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editingStaffId) {
        const profile = { ...form, departmentId: form.departmentId || null, courseUnitIds: form.staffType === 'Teaching' ? form.courseUnitIds : [] }
        const updated = await updateStaff(editingStaffId, { id: editingStaffId, ...profile })
        setStaff(current => current.map(item => item.id === updated.id ? updated : item))
        setSuccess(`${updated.firstName} ${updated.lastName} was updated successfully.`)
        notify(`${updated.firstName} ${updated.lastName} updated successfully.`, 'success', 'Staff updated')
        setEditingStaffId(null)
      } else {
        const profile = { ...form, departmentId: form.departmentId || null, courseUnitIds: form.staffType === 'Teaching' ? form.courseUnitIds : [] }
      const created = await createStaff(profile)
        // Add the server-confirmed record immediately, then reconcile with the API list.
        setStaff(current => [created, ...current.filter(item => item.id !== created.id)])
        setSuccess(`${created.firstName} ${created.lastName} was saved and added to the staff table.`)
        notify(`${created.firstName} ${created.lastName} saved successfully.`, 'success', 'Staff saved')
        void listStaff(false).then(latest => {
          setStaff(latest.some(item => item.id === created.id) ? latest : [created, ...latest])
        }).catch(() => {
          // Keep the confirmed create response visible even if the follow-up list refresh fails.
        })
      }
      setForm(emptyStaffForm())
    } catch (e) {
      const message = e instanceof Error ? e.message : editingStaffId ? 'Unable to update staff.' : 'Unable to create staff.'
      setError(message)
      notify(message, 'error', editingStaffId ? 'Staff update failed' : 'Staff save failed')
      // A duplicate may be an inactive record, so refresh the complete staff list too.
      try { setStaff(await listStaff(false)) } catch { /* Preserve the original create error. */ }
    }
  }
  function beginEdit(person: StaffMember) {
    setEditingStaffId(person.id)
    setForm({ ...emptyStaffForm(), staffNumber: person.staffNumber, firstName: person.firstName, lastName: person.lastName, nationalId: person.nationalId ?? '', phoneNumber: person.phoneNumber ?? '', email: person.email ?? '', employmentType: person.employmentType, staffType: person.staffType ?? 'Teaching', departmentId: person.departmentId ?? '', jobTitle: person.jobTitle ?? '', highestQualification: person.highestQualification ?? '', speciality: person.speciality ?? '', professionalRegistration: person.professionalRegistration ?? '', courseUnitIds: person.courseUnitIds ?? [] })
    setError('')
    setSuccess('')
    setTab('staff')
  }
  function cancelEdit() {
    setEditingStaffId(null)
    setForm(emptyStaffForm())
  }
  async function deactivate(id: string) {
    if (!(await showConfirmDialog('Deactivate this staff member? They will remain in the records but will be marked inactive.', { title: 'Deactivate staff member', confirmLabel: 'Yes, deactivate' }))) return
    try {
      await deactivateStaff(id)
      setStaff(current => current.map(person => person.id === id ? { ...person, isActive: false } : person))
      window.dispatchEvent(new Event(STAFF_CHANGED_EVENT))
      setSuccess('Staff member deactivated.')
      notify('Staff member deactivated.', 'success', 'Staff deactivated')
    } catch (e) { const message = e instanceof Error ? e.message : 'Unable to deactivate staff.'; setError(message); notify(message, 'error', 'Deactivation failed') }
  }
  async function activate(id: string) {
    try {
      await activateStaff(id)
      setStaff(current => current.map(person => person.id === id ? { ...person, isActive: true } : person))
      window.dispatchEvent(new Event(STAFF_CHANGED_EVENT))
      setSuccess('Staff member activated.')
      notify('Staff member activated.', 'success', 'Staff activated')
    } catch (e) { const message = e instanceof Error ? e.message : 'Unable to activate staff.'; setError(message); notify(message, 'error', 'Activation failed') }
  }
  async function removeStaff(person: StaffMember) {
    if (!(await showConfirmDialog(`Permanently delete ${person.firstName} ${person.lastName} (staff no. ${person.staffNumber})? This cannot be undone.`, { title: 'Delete staff member', confirmLabel: "Yes, I'm sure", destructive: true }))) return
    try {
      await deleteStaff(person.id)
      setStaff(current => current.filter(item => item.id !== person.id))
      if (editingStaffId === person.id) cancelEdit()
      window.dispatchEvent(new Event(STAFF_CHANGED_EVENT))
      setSuccess(`${person.firstName} ${person.lastName} was deleted.`)
      notify(`${person.firstName} ${person.lastName} deleted successfully.`, 'success', 'Staff deleted')
    } catch (e) { const message = e instanceof Error ? e.message : 'Unable to delete staff. They may be linked to other records.'; setError(message); notify(message, 'error', 'Staff deletion failed') }
  }
  async function submitLeave(e: React.FormEvent) { e.preventDefault(); setError(''); try { await requestLeave(leaveForm.staffMemberId.trim(), { ...leaveForm, staffMemberId: leaveForm.staffMemberId.trim() }); setLeaveForm({ staffMemberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' }); await loadLeave(); notify('Leave request submitted successfully.', 'success', 'Leave request saved') } catch (e) { const message = e instanceof Error ? e.message : 'Unable to request leave.'; setError(message); notify(message, 'error', 'Leave request failed') } }
  async function approveLeaveRequest(id: string, approved: boolean) { try { await approveLeave(id, '', approved); await loadLeave(); notify(approved ? 'Leave request approved.' : 'Leave request declined.', 'success', 'Leave updated') } catch (e) { const message = e instanceof Error ? e.message : 'Unable to approve leave.'; setError(message); notify(message, 'error', 'Leave update failed') } }
  async function handleGeneratePayroll() { setError(''); setSuccess(''); try { await generatePayroll(payrollMonth, payrollYear); await loadPayroll(); setSuccess(`Payroll generation completed for ${new Date(payrollYear, payrollMonth - 1).toLocaleString('default', { month: 'long' })} ${payrollYear}. Existing entries for this period were retained.`)
      notify('Payroll generation completed successfully.', 'success', 'Payroll generated') } catch (e) { const message = e instanceof Error ? e.message : 'Unable to generate payroll.'; setError(message); notify(message, 'error', 'Payroll generation failed') } }
  async function handleMarkPaid(id: string) { try { await markPayrollPaid(id); await loadPayroll(); notify('Payroll payment status updated.', 'success', 'Payroll updated') } catch (e) { const message = e instanceof Error ? e.message : 'Unable to mark payroll as paid.'; setError(message); notify(message, 'error', 'Payroll update failed') } }

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
              <input placeholder="National ID" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
              <label className="field-label">Staff category
                <select aria-label="Staff category" value={form.staffType} onChange={e => setForm({ ...form, staffType: e.target.value, courseUnitIds: e.target.value === 'Teaching' ? form.courseUnitIds : [] })} required>
                  <option value="Teaching">Teaching</option><option value="NonTeaching">Non-teaching</option>
                </select>
              </label>
              <label className="field-label">Employment type
                <select aria-label="Employment type" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} required>
                  <option value="Permanent">Permanent</option><option value="Temporary">Temporary</option><option value="Part-time">Part-time</option>
                </select>
              </label>
              <label className="field-label">Department
                <select aria-label="Department" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                  <option value="">Select department</option>{departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                </select>
              </label>
              <input placeholder="Job title / designation" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
              <input placeholder="Highest qualification" value={form.highestQualification} onChange={e => setForm({ ...form, highestQualification: e.target.value })} />
              <input placeholder="Speciality / area of expertise" value={form.speciality} onChange={e => setForm({ ...form, speciality: e.target.value })} />
              <input placeholder="Professional registration / licence no." value={form.professionalRegistration} onChange={e => setForm({ ...form, professionalRegistration: e.target.value })} />
              <input placeholder="Phone" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              {form.staffType === 'Teaching' && <label className="field-label staff-course-unit-field">Course units taught
                <select aria-label="Course units taught" multiple size={5} value={form.courseUnitIds} onChange={e => setForm({ ...form, courseUnitIds: Array.from(e.target.selectedOptions, option => option.value) })}>
                  {courseUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.code} — {unit.name} ({unit.creditUnits} CU)</option>)}
                </select>
              </label>}
              <button type="submit" className={editingStaffId ? undefined : 'staff-add-button'} style={!editingStaffId ? { backgroundColor: '#15803d', color: '#ffffff', border: '1px solid #166534', borderRadius: 2, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' } : undefined}>{editingStaffId ? 'Save changes' : 'Add staff member'}</button>
              {editingStaffId && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel edit</button>}
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff No.</th><th>Name</th><th>Category / Designation</th><th>Department / Speciality</th><th>Course units</th><th>Contact</th><th>Status</th>{canManage && <th>Actions</th>}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={canManage ? 8 : 7}><LoadingSpinner label="Loading staff…" /></td></tr> : staff.length === 0 ? <tr><td colSpan={canManage ? 8 : 7} className="empty">No staff records found. If a staff number is reported as a duplicate, check the list-loading warning or your access permissions.</td></tr> : staff.map(s => (
                  <tr key={s.id}><td>{s.staffNumber}</td><td>{s.firstName} {s.lastName}</td><td>{s.staffType === 'Teaching' ? 'Teaching' : 'Non-teaching'}{s.jobTitle && <div className="text-muted">{s.jobTitle}</div>}<small>{s.highestQualification || '—'}</small></td><td>{departments.find(d => d.id === s.departmentId)?.name || '—'}{s.speciality && <div>{s.speciality}</div>}</td><td>{(s.courseUnitIds ?? []).map(id => courseUnits.find(unit => unit.id === id)?.code).filter(Boolean).join(', ') || '—'}</td><td>{s.email || s.phoneNumber || '—'}</td><td><span className="badge" style={{ background: s.isActive ? '#d1fae5' : '#e5e7eb', color: s.isActive ? '#065f46' : '#374151' }}>{s.isActive ? 'Active' : 'Inactive'}</span></td>{canManage && <td><div className="flex flex-wrap gap-2"><button type="button" className="secondary-button" onClick={() => beginEdit(s)}>Edit</button>{s.isActive ? <button type="button" className="secondary-button" onClick={() => void deactivate(s.id)}>Deactivate</button> : <button type="button" className="secondary-button" onClick={() => void activate(s.id)}>Activate</button>}<button type="button" className="secondary-button" onClick={() => void removeStaff(s)}>Delete</button></div></td>}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'payroll' && (
        <div className="payroll-workspace">
          <div className="summary-grid" style={{ marginBottom: 22 }}>
            <div className="summary-card"><span>Payroll period</span><strong>{new Date(payrollYear, payrollMonth - 1).toLocaleString('default', { month: 'long' })} {payrollYear}</strong></div>
            <div className="summary-card"><span>Total net payroll</span><strong>UGX {selectedPayroll.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}</strong></div>
            <div className="summary-card"><span>Paid records</span><strong style={{ color: '#047857' }}>{selectedPayroll.filter(p => p.status === 'Paid').length}</strong></div>
            <div className="summary-card"><span>Pending records</span><strong style={{ color: '#b45309' }}>{selectedPayroll.filter(p => p.status === 'Pending').length}</strong></div>
          </div>
          {canManage && <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#334155', fontSize: 13, fontWeight: 600 }}>Month
              <select aria-label="Payroll month" value={payrollMonth} onChange={e => setPayrollMonth(Number(e.target.value))} style={{ width: 142, minWidth: 142, height: 38, padding: '7px 10px', fontSize: 14, lineHeight: 1.2 }}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>)}</select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#334155', fontSize: 13, fontWeight: 600 }}>Year
              <input aria-label="Payroll year" type="number" value={payrollYear} onChange={e => setPayrollYear(Number(e.target.value))} style={{ width: 88, minWidth: 88, height: 38, boxSizing: 'border-box', padding: '7px 10px', fontSize: 14 }} />
            </label>
            <button className="btn" onClick={() => void handleGeneratePayroll()}>Generate Payroll</button>
            <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>{selectedPayroll.length} record{selectedPayroll.length === 1 ? '' : 's'} in period</span>
          </div>}
          <div style={{ overflowX: 'auto', border: '1px solid #dbe3ed', borderRadius: 7, background: '#fff', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}>
            <table style={{ width: '100%', minWidth: canManage ? 1120 : 1020, borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#334155' }}>
                  <th scope="col" style={{ width: 112, padding: '13px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Payroll ID</th>
                  <th scope="col" style={{ padding: '13px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Staff member</th>
                  <th scope="col" style={{ padding: '13px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Period</th>
                  <th scope="col" style={{ padding: '13px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Basic salary</th>
                  <th scope="col" style={{ padding: '13px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Allowances</th>
                  <th scope="col" style={{ padding: '13px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Deductions</th>
                  <th scope="col" style={{ padding: '13px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Net pay</th>
                  <th scope="col" style={{ padding: '13px 14px', textAlign: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Status</th>
                  {canManage && <th scope="col" style={{ padding: '13px 14px', textAlign: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {selectedPayroll.length === 0 ? <tr><td colSpan={canManage ? 9 : 8} className="empty" style={{ padding: 28, textAlign: 'center' }}>No payroll records found for {new Date(payrollYear, payrollMonth - 1).toLocaleString('default', { month: 'long' })} {payrollYear}.</td></tr> : selectedPayroll.map((p, index) => {
                  const person = staff.find(s => s.id === p.staffMemberId)
                  const cellStyle: React.CSSProperties = { padding: '14px', borderBottom: '1px solid #e8edf3', verticalAlign: 'middle', color: '#334155', whiteSpace: 'nowrap' }
                  return (
                    <tr key={p.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={cellStyle}><span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 8px', borderRadius: 4, background: '#e2e8f0', color: '#0f172a', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em' }}>PAY-{String(index + 1).padStart(4, '0')}</span></td>
                      <td style={{ ...cellStyle, whiteSpace: 'normal', minWidth: 180 }}><strong style={{ display: 'block', color: '#0f172a', fontSize: 13 }}>{person ? `${person.firstName} ${person.lastName}` : 'Staff record unavailable'}</strong>{person && <span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: 11 }}>Staff No. {person.staffNumber}</span>}</td>
                      <td style={cellStyle}><span style={{ color: '#0f172a', fontWeight: 600 }}>{new Date(2000, p.month - 1).toLocaleString('default', { month: 'short' })}</span><span style={{ color: '#64748b' }}> {p.year}</span></td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>UGX {p.basicSalary.toLocaleString()}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>UGX {p.allowances.toLocaleString()}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>UGX {p.deductions.toLocaleString()}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><strong style={{ color: '#0f172a', fontSize: 13 }}>UGX {p.netPay.toLocaleString()}</strong></td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}><span className="badge" style={{ display: 'inline-block', minWidth: 72, padding: '5px 9px', borderRadius: 4, background: p.status === 'Paid' ? '#d1fae5' : '#fef3c7', color: p.status === 'Paid' ? '#065f46' : '#92400e', fontSize: 11, fontWeight: 800, textAlign: 'center' }}>{p.status}</span></td>
                      {canManage && <td style={{ ...cellStyle, textAlign: 'center' }}>{p.status === 'Pending' && <button className="secondary-button" onClick={() => void handleMarkPaid(p.id)} style={{ whiteSpace: 'nowrap', borderRadius: 4, padding: '7px 11px', fontWeight: 700 }}>Mark Paid</button>}{p.status === 'Paid' && <span style={{ color: '#047857', fontSize: 12, fontWeight: 700 }}>Completed</span>}</td>}
                    </tr>
                  )
                })}
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
