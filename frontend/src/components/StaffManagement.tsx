import { formatPersonName } from '../utils/personName'
import { showConfirmDialog } from '../utils/confirmDialog'
import { useCallback, useEffect, useMemo, useState } from 'react'
import LoadingSpinner from './LoadingSpinner';
import { createStaff, updateStaff, updateStaffCourseUnits, deleteStaff, activateStaff, deactivateStaff, listStaff, listStaffCourseUnits, listStaffDepartments, listLeave, requestLeave, approveLeave, STAFF_CHANGED_EVENT, type StaffMember, type LeaveRequest, type StaffCourseUnit, type StaffDepartment } from '../api/staff'
import { listPayroll, generatePayroll, markPayrollPaid, type PayrollRecord } from '../api/payroll'
import { notify } from './GlobalNotifications'
import { validateForm } from '../lib/validation'
import { staffCreateRequestSchema } from '../schemas'
import { SYSTEM_CURRENCY } from '../lib/currency'
import { StaffAttendanceManagement } from './StaffAttendanceManagement'
import { LEAVE_TYPE_OPTIONS, STAFF_TYPE_OPTIONS } from '../constants/referenceEnums'

type Tab = 'staff' | 'payroll' | 'leave' | 'recruitment' | 'attendance'

export function StaffManagement({ canManage = false, canReadPayroll = false, canManagePayroll = false, canProcessPayroll = false, activeSubsection = null }: { canManage?: boolean; canReadPayroll?: boolean; canManagePayroll?: boolean; canProcessPayroll?: boolean; activeSubsection?: string | null }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [courseUnits, setCourseUnits] = useState<StaffCourseUnit[]>([])
  const [departments, setDepartments] = useState<StaffDepartment[]>([])
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState('')
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [editingCourseUnitsStaffId, setEditingCourseUnitsStaffId] = useState<string | null>(null)
  const [courseUnitDraftIds, setCourseUnitDraftIds] = useState<string[]>([])
  const [savingCourseUnits, setSavingCourseUnits] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('staff')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear())
  const selectedPayroll = useMemo(() => payroll.filter(p => p.month === payrollMonth && p.year === payrollYear), [payroll, payrollMonth, payrollYear])

  useEffect(() => {
    const nextTab: Tab | undefined = activeSubsection === 'staff' ? 'staff'
      : activeSubsection === 'payroll' ? 'payroll'
      : activeSubsection === 'leave' ? 'leave'
      : activeSubsection === 'recruitment' ? 'recruitment'
      : activeSubsection === 'attendance' ? 'attendance'
      : undefined
    if (nextTab === 'payroll' && !canReadPayroll) return
    if ((nextTab === 'leave' || nextTab === 'recruitment' || nextTab === 'attendance') && !canManage) return
    if (nextTab) setTab(nextTab)
  }, [activeSubsection, canManage, canReadPayroll])

  async function loadStaff() { setLoading(true); try { setStaff(await listStaff(false)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load staff.') } finally { setLoading(false) } }
  async function loadLeave() { if (!leaveForm.staffMemberId.trim()) { setLeaveRequests([]); return } try { setLeaveRequests(await listLeave(leaveForm.staffMemberId.trim())) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load leave requests.') } }
  async function loadPayroll() { try { setPayroll(await listPayroll()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load payroll.') } }

  const emptyStaffForm = () => ({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent', staffType: 'Teaching', departmentId: '', jobTitle: '', highestQualification: '', speciality: '', professionalRegistration: '', dateJoined: '', courseUnitIds: [] as string[] })
  const duplicateErrorPattern = /staff number is already registered|staff member with this staff number already exists/i
  const [leaveForm, setLeaveForm] = useState({ staffMemberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' })
  const [leaveDuration, setLeaveDuration] = useState<'single' | 'multiple'>('single')
  const [form, setForm] = useState(emptyStaffForm())

  useEffect(() => {
    const handler = (event: Event) => {
      if (!(event instanceof CustomEvent)) return
      const detail = event.detail as { module?: string; subsection?: string } | undefined
      if (detail?.module !== 'staff' || !detail.subsection) return
      const nextTab: Tab | undefined = detail.subsection === 'staff' ? 'staff'
        : detail.subsection === 'payroll' ? 'payroll'
        : detail.subsection === 'leave' ? 'leave'
        : detail.subsection === 'recruitment' ? 'recruitment'
        : detail.subsection === 'attendance' ? 'attendance'
        : undefined
      if (nextTab === 'payroll' && !canReadPayroll) return; if ((nextTab === 'leave' || nextTab === 'recruitment' || nextTab === 'attendance') && !canManage) return; if (nextTab) setTab(nextTab)
    }
    window.addEventListener('smis:navigate-subsection', handler)
    return () => window.removeEventListener('smis:navigate-subsection', handler)
  }, [canManage, canReadPayroll])

  useEffect(() => {
    void loadStaff()
    void listStaffCourseUnits().then(setCourseUnits).catch(e => setError(e instanceof Error ? e.message : 'Unable to load course units.'))
    void listStaffDepartments().then(setDepartments).catch(e => setError(e instanceof Error ? e.message : 'Unable to load departments.'))
    const onStaffChanged = (event: Event) => {
      if (!(event instanceof CustomEvent)) return
      const detail = event.detail as { staff?: StaffMember } | undefined
      if (detail?.staff) {
        const staff = detail.staff
      setStaff(current => [staff, ...current.filter(item => item.id !== staff.id)])
        return
      }
      void loadStaff()
    }
    window.addEventListener(STAFF_CHANGED_EVENT, onStaffChanged)
    return () => window.removeEventListener(STAFF_CHANGED_EVENT, onStaffChanged)
  }, [canManage])
  useEffect(() => { if (canManage && tab === 'leave') void loadLeave() }, [tab, canManage, leaveForm.staffMemberId])
  useEffect(() => { if (canReadPayroll && tab === 'payroll') void loadPayroll() }, [tab, canReadPayroll])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const profile = { ...form, departmentId: form.departmentId || null, courseUnitIds: form.staffType === 'Teaching' ? form.courseUnitIds : [] }
      const validation = validateForm(staffCreateRequestSchema, profile)
      if (!validation.success) {
        setValidationErrors(validation.errors)
        setError('Staff record was not saved. Correct the validation errors shown below.')
        return
      }
      setValidationErrors({})
      if (editingStaffId) {
        const updated = await updateStaff(editingStaffId, { id: editingStaffId, ...profile })
        setStaff(current => current.map(item => item.id === updated.id ? updated : item))
        setSuccess(`${formatPersonName(updated.lastName, updated.firstName)} was updated successfully.`)
        notify(`${formatPersonName(updated.lastName, updated.firstName)} updated successfully.`, 'success', 'Staff updated')
        setEditingStaffId(null)
      } else {
        const created = await createStaff(profile)
        // Add the server-confirmed record immediately, then reconcile with the API list.
        setStaff(current => [created, ...current.filter(item => item.id !== created.id)])
        setSuccess(`${formatPersonName(created.lastName, created.firstName)} was saved and added to the staff table.`)
        notify(`${formatPersonName(created.lastName, created.firstName)} saved successfully.`, 'success', 'Staff saved')
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
      try { setStaff(await listStaff(false)) } catch (e) { console.error('Staff list refresh failed', e) /* Preserve the original create error. */ }
    }
  }
  function beginEdit(person: StaffMember) {
    setEditingStaffId(person.id)
    setForm({ ...emptyStaffForm(), staffNumber: person.staffNumber, firstName: person.firstName, lastName: person.lastName, nationalId: person.nationalId ?? '', phoneNumber: person.phoneNumber ?? '', email: person.email ?? '', employmentType: person.employmentType, staffType: person.staffType ?? 'Teaching', departmentId: person.departmentId ?? '', jobTitle: person.jobTitle ?? '', highestQualification: person.highestQualification ?? '', speciality: person.speciality ?? '', professionalRegistration: person.professionalRegistration ?? '', dateJoined: person.dateJoined ?? '', courseUnitIds: person.courseUnitIds ?? [] })
    setError('')
    setSuccess('')
    setTab('staff')
  }
  function cancelEdit() {
    setEditingStaffId(null)
    setForm(emptyStaffForm())
  }

  function beginEditCourseUnits(person: StaffMember) {
    setEditingCourseUnitsStaffId(person.id)
    setCourseUnitDraftIds(person.courseUnitIds ?? [])
    setError('')
    setSuccess('')
  }
  function cancelEditCourseUnits() {
    setEditingCourseUnitsStaffId(null)
    setCourseUnitDraftIds([])
  }
  async function saveCourseUnits(person: StaffMember) {
    setSavingCourseUnits(true)
    setError('')
    setSuccess('')
    try {
      const updated = await updateStaffCourseUnits(person.id, courseUnitDraftIds)
      setStaff(current => current.map(item => item.id === updated.id ? updated : item))
      cancelEditCourseUnits()
      setSuccess(`Course unit assignments for ${formatPersonName(updated.lastName, updated.firstName)} were saved.`)
      notify(`Course unit assignments for ${formatPersonName(updated.lastName, updated.firstName)} saved.`, 'success', 'Course units updated')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to save course unit assignments.'
      setError(message)
      notify(message, 'error', 'Course unit update failed')
    } finally {
      setSavingCourseUnits(false)
    }
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
    if (!(await showConfirmDialog(`Permanently delete ${formatPersonName(person.lastName, person.firstName)} (staff no. ${person.staffNumber})? This cannot be undone.`, { title: 'Delete staff member', confirmLabel: "Yes, I'm sure", destructive: true }))) return
    try {
      await deleteStaff(person.id)
      setStaff(current => current.filter(item => item.id !== person.id))
      if (editingStaffId === person.id) cancelEdit()
      window.dispatchEvent(new Event(STAFF_CHANGED_EVENT))
      setSuccess(`${formatPersonName(person.lastName, person.firstName)} was deleted.`)
      notify(`${formatPersonName(person.lastName, person.firstName)} deleted successfully.`, 'success', 'Staff deleted')
    } catch (e) { const message = e instanceof Error ? e.message : 'Unable to delete staff. They may be linked to other records.'; setError(message); notify(message, 'error', 'Staff deletion failed') }
  }
  async function submitLeave(e: React.FormEvent) { e.preventDefault(); setError(''); setSuccess(''); const staffId = leaveForm.staffMemberId.trim(); const endDate = leaveDuration === 'single' ? leaveForm.startDate : leaveForm.endDate; if (!staffId || !leaveForm.startDate || !endDate) { setError('Select a staff member and complete the leave date(s).'); return } if (endDate < leaveForm.startDate) { setError('The end date cannot be earlier than the start date.'); return } try { await requestLeave(staffId, { ...leaveForm, staffMemberId: staffId, endDate }); setLeaveForm(current => ({ ...current, startDate: '', endDate: '', reason: '' })); await loadLeave(); setSuccess('Leave request submitted successfully.'); notify('Leave request submitted successfully.', 'success', 'Leave request saved') } catch (e) { const message = e instanceof Error ? e.message : 'Unable to request leave.'; setError(message); notify(message, 'error', 'Leave request failed') } }
  async function approveLeaveRequest(id: string, approved: boolean) { try { await approveLeave(id, null, approved); await loadLeave(); notify(approved ? 'Leave request approved.' : 'Leave request declined.', 'success', 'Leave updated') } catch (e) { const message = e instanceof Error ? e.message : 'Unable to approve leave.'; setError(message); notify(message, 'error', 'Leave update failed') } }
  async function handleGeneratePayroll() { setError(''); setSuccess(''); try { await generatePayroll(payrollMonth, payrollYear); await loadPayroll(); setSuccess(`Payroll generation completed for ${new Date(payrollYear, payrollMonth - 1).toLocaleString('default', { month: 'long' })} ${payrollYear}. Existing entries for this period were retained.`)
      notify('Payroll generation completed successfully.', 'success', 'Payroll generated') } catch (e) { const message = e instanceof Error ? e.message : 'Unable to generate payroll.'; setError(message); notify(message, 'error', 'Payroll generation failed') } }
  async function handleMarkPaid(id: string) { try { await markPayrollPaid(id); await loadPayroll();       notify('Payroll payment status updated.', 'success', 'Payroll updated') } catch (e) { const message = e instanceof Error ? e.message : 'Unable to mark payroll as paid.'; setError(message); notify(message, 'error', 'Payroll update failed') } }

  const isDuplicateStaffNumber = /staff number is already registered|staff member with this staff number already exists/i.test(error)

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
        {canManage && <button role="tab" aria-selected={tab === 'attendance'} className={tab === 'attendance' ? 'active' : ''} onClick={() => setTab('attendance')}>Attendance</button>}
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
                {isDuplicateStaffNumber ? 'Staff member already registered' : 'Action requires attention'}
              </h3>
              <p className="max-w-3xl leading-6 text-slate-700">
                {isDuplicateStaffNumber
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

      {Object.keys(validationErrors).length > 0 && <div className="error" role="alert"><strong>Staff fields requiring attention</strong><ul>{Object.entries(validationErrors).map(([field, message]) => <li key={field}><strong>{field}:</strong> {message}</li>)}</ul></div>}

      {tab === 'staff' && (
        <>
          {canManage && (
            <form onSubmit={submit} className="staff-recruitment-form" style={{ display: 'grid', gap: 16 }}>
              <section className="staff-form-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,.04)' }}>
                <h3 style={{ margin: '0 0 16px', color: '#111827', fontSize: 16, fontWeight: 750 }}>Personal Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: '14px 18px' }}>
                  <label className="field-label">Staff number<input aria-label="Staff number" placeholder="Enter staff number" value={form.staffNumber} onChange={e => setForm({ ...form, staffNumber: e.target.value })} required /></label>
                  <label className="field-label">First name<input aria-label="First name" placeholder="Enter first name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></label>
                  <label className="field-label">Last name<input aria-label="Last name" placeholder="Enter last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></label>
                  <label className="field-label">National ID<input aria-label="National ID" placeholder="National identification number" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} /></label>
                  <label className="field-label">Phone<input aria-label="Phone" type="tel" placeholder="Enter phone number" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></label>
                  <label className="field-label">Email<input aria-label="Email" type="email" placeholder="Enter email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
                </div>
              </section>

              <section className="staff-form-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,.04)' }}>
                <h3 style={{ margin: '0 0 16px', color: '#111827', fontSize: 16, fontWeight: 750 }}>Joining Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: '14px 18px' }}>
                  <label className="field-label">Joining date<input aria-label="Joining date" type="date" value={form.dateJoined} onChange={e => setForm({ ...form, dateJoined: e.target.value })} /></label>
                  <label className="field-label">Staff category<select aria-label="Staff category" value={form.staffType} onChange={e => setForm({ ...form, staffType: e.target.value, courseUnitIds: e.target.value === 'Teaching' ? form.courseUnitIds : [] })} required>{STAFF_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="field-label">Employment type<select aria-label="Employment type" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} required><option value="Permanent">Permanent</option><option value="Temporary">Temporary</option><option value="Part-time">Part-time</option></select></label>
                  <label className="field-label">Department<select aria-label="Department" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}><option value="">Select department</option>{departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}</select></label>
                  <label className="field-label">Designation / job title<input aria-label="Designation / job title" placeholder="Enter designation" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} /></label>
                  <label className="field-label">Highest qualification<input aria-label="Highest qualification" placeholder="Enter qualification" value={form.highestQualification} onChange={e => setForm({ ...form, highestQualification: e.target.value })} /></label>
                  <label className="field-label">Speciality<input aria-label="Speciality" placeholder="Area of expertise" value={form.speciality} onChange={e => setForm({ ...form, speciality: e.target.value })} /></label>
                  <label className="field-label">Professional registration<input aria-label="Professional registration" placeholder="Registration / licence number" value={form.professionalRegistration} onChange={e => setForm({ ...form, professionalRegistration: e.target.value })} /></label>
                </div>
              </section>

              {form.staffType === 'Teaching' && (
                <section className="staff-form-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, color: '#111827', fontSize: 16, fontWeight: 750 }}>Course Units Assigned</h3>
                    <span className="badge">{form.courseUnitIds.length} selected</span>
                  </div>
                  {courseUnits.length === 0 ? <p className="empty">No active course units are available in the academic catalogue.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,250px),1fr))', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                    {courseUnits.map(unit => {
                      const checked = form.courseUnitIds.includes(unit.id)
                      return <label key={unit.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 10px', border: `1px solid ${checked ? '#93c5fd' : '#e2e8f0'}`, borderRadius: 6, background: checked ? '#eff6ff' : '#f8fafc', cursor: 'pointer', fontSize: 13 }}>
                        <input type="checkbox" checked={checked} onChange={e => setForm(current => ({ ...current, courseUnitIds: e.target.checked ? [...current.courseUnitIds.filter(id => id !== unit.id), unit.id] : current.courseUnitIds.filter(id => id !== unit.id) }))} />
                        <span><strong>{unit.code}</strong> — {unit.name} <span style={{ color: '#64748b' }}>({unit.creditUnits} CU)</span></span>
                      </label>
                    })}
                  </div>}
                </section>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '4px 0 10px' }}>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  <button type="submit" disabled={loading} style={{ background: '#15803d', color: '#fff', border: '1px solid #166534', borderRadius: 6, padding: '10px 18px', fontWeight: 700 }}>{editingStaffId ? 'Update Staff' : 'Add New Staff'}</button>
                  {editingStaffId && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel edit</button>}
                </div>
                <span style={{ color: '#64748b', fontSize: 12 }}>Staff details are validated and saved to the institutional database.</span>
              </div>
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff No.</th><th>Name</th><th>Category / Designation</th><th>Department / Speciality</th><th>Course units</th><th>Contact</th><th>Status</th>{canManage && <th>Actions</th>}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={canManage ? 8 : 7}><LoadingSpinner label="Loading staff…" /></td></tr> : staff.length === 0 ? <tr><td colSpan={canManage ? 8 : 7} className="empty">No staff records found. If a staff number is reported as a duplicate, check the list-loading warning or your access permissions.</td></tr> : staff.map(s => (
                  <tr key={s.id}><td>{s.staffNumber}</td><td>{formatPersonName(s.lastName, s.firstName)}</td><td>{s.staffType === 'Teaching' ? 'Teaching' : 'Non-teaching'}{s.jobTitle && <div className="text-muted">{s.jobTitle}</div>}<small>{s.highestQualification || '—'}</small></td><td>{departments.find(d => d.id === s.departmentId)?.name || '—'}{s.speciality && <div>{s.speciality}</div>}</td><td style={{ minWidth: editingCourseUnitsStaffId === s.id ? 280 : 140 }}>
                    {editingCourseUnitsStaffId === s.id ? (
                      <div style={{ display: 'grid', gap: 7, minWidth: 250 }}>
                        {courseUnits.length === 0 ? <span className="text-muted">No active course units available.</span> : <div style={{ display: 'grid', gap: 5, maxHeight: 180, overflowY: 'auto', padding: 2 }}>
                          {courseUnits.map(unit => <label key={unit.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 6px', border: '1px solid #e2e8f0', borderRadius: 3, cursor: 'pointer', whiteSpace: 'normal' }}>
                            <input type="checkbox" checked={courseUnitDraftIds.includes(unit.id)} onChange={event => setCourseUnitDraftIds(current => event.target.checked ? [...current.filter(id => id !== unit.id), unit.id] : current.filter(id => id !== unit.id))} />
                            <span><strong>{unit.code}</strong> — {unit.name}</span>
                          </label>)}
                        </div>}
                        <span style={{ fontSize: 11, color: '#475569' }}>{courseUnitDraftIds.length} selected</span>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <button type="button" disabled={savingCourseUnits || courseUnits.length === 0} onClick={() => void saveCourseUnits(s)} style={{ padding: '4px 8px', minHeight: 26, borderRadius: 3, fontSize: 11 }}>{savingCourseUnits ? 'Saving…' : 'Save units'}</button>
                          <button type="button" className="secondary-button" disabled={savingCourseUnits} onClick={cancelEditCourseUnits} style={{ padding: '4px 8px', minHeight: 26, borderRadius: 3, fontSize: 11 }}>Cancel</button>
                        </div>
                      </div>
                    ) : <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{(s.courseUnitIds ?? []).map(id => courseUnits.find(unit => unit.id === id)?.code).filter(Boolean).join(', ') || '—'}</span>
                      {canManage && s.staffType === 'Teaching' && <button type="button" className="secondary-button" onClick={() => beginEditCourseUnits(s)} style={{ padding: '3px 6px', minHeight: 24, borderRadius: 3, fontSize: 10, lineHeight: 1.2 }}>Edit units</button>}
                    </div>}
                  </td><td>{s.email || s.phoneNumber || '—'}</td><td><span className="badge" style={{ background: s.isActive ? '#d1fae5' : '#e5e7eb', color: s.isActive ? '#065f46' : '#374151' }}>{s.isActive ? 'Active' : 'Inactive'}</span></td>{canManage && <td><div className="flex flex-wrap items-center" style={{ gap: 4, minWidth: 0 }}><button type="button" className="secondary-button" style={{ padding: '4px 8px', minHeight: 27, borderRadius: 3, fontSize: 11, lineHeight: 1.2, whiteSpace: 'nowrap' }} onClick={() => beginEdit(s)}>Edit</button>{s.isActive ? <button type="button" className="secondary-button" style={{ padding: '4px 8px', minHeight: 27, borderRadius: 3, fontSize: 11, lineHeight: 1.2, whiteSpace: 'nowrap' }} onClick={() => void deactivate(s.id)}>Deactivate</button> : <button type="button" className="secondary-button" style={{ padding: '4px 8px', minHeight: 27, borderRadius: 3, fontSize: 11, lineHeight: 1.2, whiteSpace: 'nowrap' }} onClick={() => void activate(s.id)}>Activate</button>}<button type="button" className="secondary-button" style={{ padding: '4px 8px', minHeight: 27, borderRadius: 3, fontSize: 11, lineHeight: 1.2, whiteSpace: 'nowrap' }} onClick={() => void removeStaff(s)}>Delete</button></div></td>}</tr>
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
            <div className="summary-card"><span>Total net payroll</span><strong>{SYSTEM_CURRENCY} {selectedPayroll.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}</strong></div>
            <div className="summary-card"><span>Paid records</span><strong style={{ color: '#047857' }}>{selectedPayroll.filter(p => p.status === 'Paid').length}</strong></div>
            <div className="summary-card"><span>Pending records</span><strong style={{ color: '#b45309' }}>{selectedPayroll.filter(p => p.status === 'Pending').length}</strong></div>
          </div>
          {canReadPayroll && <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#334155', fontSize: 13, fontWeight: 600 }}>Month
              <select aria-label="Payroll month" value={payrollMonth} onChange={e => setPayrollMonth(Number(e.target.value))} style={{ width: 142, minWidth: 142, height: 38, padding: '7px 10px', fontSize: 14, lineHeight: 1.2 }}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>)}</select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#334155', fontSize: 13, fontWeight: 600 }}>Year
              <input aria-label="Payroll year" type="number" value={payrollYear} onChange={e => setPayrollYear(Number(e.target.value))} style={{ width: 88, minWidth: 88, height: 38, boxSizing: 'border-box', padding: '7px 10px', fontSize: 14 }} />
            </label>
            {canManagePayroll && <button className="btn" onClick={() => void handleGeneratePayroll()}>Generate Payroll</button>}
            <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>{selectedPayroll.length} record{selectedPayroll.length === 1 ? '' : 's'} in period</span>
          </div>}
          <div style={{ overflowX: 'auto', border: '1px solid #dbe3ed', borderRadius: 7, background: '#fff', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}>
            <table style={{ width: '100%', minWidth: canProcessPayroll ? 1120 : 1020, borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
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
                  {canProcessPayroll && <th scope="col" style={{ padding: '13px 14px', textAlign: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {selectedPayroll.length === 0 ? <tr><td colSpan={canProcessPayroll ? 9 : 8} className="empty" style={{ padding: 28, textAlign: 'center' }}>No payroll records found for {new Date(payrollYear, payrollMonth - 1).toLocaleString('default', { month: 'long' })} {payrollYear}.</td></tr> : selectedPayroll.map((p, index) => {
                  const person = staff.find(s => s.id === p.staffMemberId)
                  const cellStyle: React.CSSProperties = { padding: '14px', borderBottom: '1px solid #e8edf3', verticalAlign: 'middle', color: '#334155', whiteSpace: 'nowrap' }
  return (
                    <tr key={p.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={cellStyle}><span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 8px', borderRadius: 4, background: '#e2e8f0', color: '#0f172a', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em' }}>PAY-{p.id}</span></td>
                      <td style={{ ...cellStyle, whiteSpace: 'normal', minWidth: 180 }}><strong style={{ display: 'block', color: '#0f172a', fontSize: 13 }}>{person ? `${formatPersonName(person.lastName, person.firstName)}` : 'Staff record unavailable'}</strong>{person && <span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: 11 }}>Staff No. {person.staffNumber}</span>}</td>
                      <td style={cellStyle}><span style={{ color: '#0f172a', fontWeight: 600 }}>{new Date(2000, p.month - 1).toLocaleString('default', { month: 'short' })}</span><span style={{ color: '#64748b' }}> {p.year}</span></td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{SYSTEM_CURRENCY} {p.basicSalary.toLocaleString()}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{SYSTEM_CURRENCY} {p.allowances.toLocaleString()}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{SYSTEM_CURRENCY} {p.deductions.toLocaleString()}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><strong style={{ color: '#0f172a', fontSize: 13 }}>{SYSTEM_CURRENCY} {p.netPay.toLocaleString()}</strong></td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}><span className="badge" style={{ display: 'inline-block', minWidth: 72, padding: '5px 9px', borderRadius: 4, background: p.status === 'Paid' ? '#d1fae5' : '#fef3c7', color: p.status === 'Paid' ? '#065f46' : '#92400e', fontSize: 11, fontWeight: 800, textAlign: 'center' }}>{p.status}</span></td>
                      {canProcessPayroll && <td style={{ ...cellStyle, textAlign: 'center' }}>{p.status === 'Pending' && <button className="secondary-button" onClick={() => void handleMarkPaid(p.id)} style={{ whiteSpace: 'nowrap', borderRadius: 4, padding: '7px 11px', fontWeight: 700 }}>Mark Paid</button>}{p.status === 'Paid' && <span style={{ color: '#047857', fontSize: 12, fontWeight: 700 }}>Completed</span>}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <div className="leave-workspace">
          <section className="academic-authority-workspace">
            <div className="panel-heading"><div><span className="eyebrow">HUMAN RESOURCES</span><h3>Leave request</h3></div><span className="status">{leaveRequests.length} recent request(s)</span></div>
            {canManage ? (
              <form className="grid-form" onSubmit={submitLeave}>
                <label className="field-label">Name of staff
                  <select value={leaveForm.staffMemberId} onChange={e => { setLeaveForm(current => ({ ...current, staffMemberId: e.target.value })); setLeaveRequests([]) }} required>
                    <option value="">Select staff member</option>
                    {staff.filter(person => person.isActive).map(person => <option key={person.id} value={person.id}>{formatPersonName(person.lastName, person.firstName)} · {person.staffNumber}</option>)}
                  </select>
                </label>
                <label className="field-label">Leave type
                  <select value={leaveForm.leaveType} onChange={e => setLeaveForm(current => ({ ...current, leaveType: e.target.value }))}>{LEAVE_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                </label>
                <fieldset className="field-label" style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '8px 12px', gridColumn: '1 / -1' }}>
                  <legend>Leave duration</legend>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 24 }}><input type="radio" name="leave-duration" checked={leaveDuration === 'single'} onChange={() => { setLeaveDuration('single'); setLeaveForm(current => ({ ...current, endDate: current.startDate })) }} /> Single day</label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><input type="radio" name="leave-duration" checked={leaveDuration === 'multiple'} onChange={() => setLeaveDuration('multiple')} /> Multiple days</label>
                </fieldset>
                <label className="field-label">Leave date
                  <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm(current => ({ ...current, startDate: e.target.value, endDate: leaveDuration === 'single' ? e.target.value : current.endDate }))} required />
                </label>
                {leaveDuration === 'multiple' && <label className="field-label">Last day of leave
                  <input type="date" min={leaveForm.startDate || undefined} value={leaveForm.endDate} onChange={e => setLeaveForm(current => ({ ...current, endDate: e.target.value }))} required />
                </label>}
                <label className="field-label" style={{ gridColumn: '1 / -1' }}>Reason for leave
                  <textarea rows={3} value={leaveForm.reason} onChange={e => setLeaveForm(current => ({ ...current, reason: e.target.value }))} placeholder="Enter the reason for requesting leave" required />
                </label>
                <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" disabled={!leaveForm.staffMemberId || !leaveForm.startDate || (leaveDuration === 'multiple' && !leaveForm.endDate)}>Submit leave request</button>
                  <button type="button" className="secondary-button" onClick={() => void loadLeave()} disabled={!leaveForm.staffMemberId}>Refresh requests</button>
                </div>
              </form>
            ) : <p className="empty">You do not have permission to submit or process leave requests.</p>}
          </section>
          <section className="academic-authority-workspace">
            <div className="panel-heading"><div><span className="eyebrow">REQUEST REGISTER</span><h3>Recent leave requests</h3></div></div>
            {!leaveForm.staffMemberId ? <p className="empty">Select a staff member above to view their leave requests.</p> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Staff member</th><th>Leave date</th><th>Type</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{leaveRequests.length === 0 ? <tr><td colSpan={6} className="empty">No leave requests found for this staff member.</td></tr> : leaveRequests.map(lr => {
                  const person = staff.find(item => item.id === lr.staffMemberId)
                  return <tr key={lr.id}>
                    <td>{person ? formatPersonName(person.lastName, person.firstName) : lr.staffMemberId}</td>
                    <td>{lr.startDate === lr.endDate ? lr.startDate : `${lr.startDate} – ${lr.endDate}`}</td>
                    <td>{lr.leaveType}</td><td>{lr.reason}</td>
                    <td><span className="badge" style={{ background: lr.status === 'Approved' ? '#d1fae5' : lr.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: lr.status === 'Approved' ? '#065f46' : lr.status === 'Rejected' ? '#991b1b' : '#92400e' }}>{lr.status}</span></td>
                    <td>{lr.status === 'Pending' && canManage && <div className="form-row"><button type="button" className="secondary-button" onClick={() => void approveLeaveRequest(lr.id, true)}>Approve</button><button type="button" className="secondary-button" onClick={() => void approveLeaveRequest(lr.id, false)}>Decline</button></div>}</td>
                  </tr>
                })}</tbody>
              </table></div>
            )}
          </section>
        </div>
      )}

      {tab === 'attendance' && <StaffAttendanceManagement />}

      {tab === 'recruitment' && (
        <div className="card">
          <h3>Recruitment & Onboarding</h3>
            </div>
      )}
    </section>
  )
}
