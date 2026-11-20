import { formatPersonName } from '../utils/personName'
import './StaffCreateForm.css'
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
import { getUsers, resetUserPassword } from '../api/administration'

type Tab = 'staff' | 'payroll' | 'leave' | 'recruitment' | 'attendance'

type StaffPermissionGroup = { id: string; label: string; permissions: { id: string; label: string }[] }

const STAFF_PERMISSION_GROUPS: StaffPermissionGroup[] = [
  { id: 'dashboard', label: 'Dashboard & System Overview', permissions: [
    ['dashboard.view','View dashboard'],['dashboard.view_academic_statistics','View academic statistics'],['dashboard.view_financial_statistics','View financial statistics'],['dashboard.view_admission_statistics','View admission statistics'],['dashboard.view_staff_statistics','View staff statistics'],['dashboard.export_reports','Export dashboard reports'],
  ].map(([id,label])=>({id,label})) },
  { id: 'students', label: 'Student Registry & Student Management', permissions: [
    ['students.view','View student registry'],['students.view_details','View student profiles'],['students.create','Register students'],['students.edit','Edit student information'],['students.delete','Delete student records'],['students.archive','Archive students'],['students.restore','Restore archived students'],['students.transfer','Transfer students'],['students.promote','Promote students'],['students.change_status','Change student status'],['students.assign_programme','Assign or change programmes'],['students.assign_campus','Assign students to campuses'],['students.manage_guardians','Manage parents and guardians'],['students.manage_documents','Manage student documents'],['students.export','Export student records'],['students.view_sensitive_details','View restricted student information'],
  ].map(([id,label])=>({id,label})) },
  { id: 'admissions', label: 'Admissions', permissions: [
    ['admissions.view','View applications'],['admissions.create','Create applications'],['admissions.edit','Edit applications'],['admissions.review','Review applications'],['admissions.approve','Approve applications'],['admissions.reject','Reject applications'],['admissions.manage_requirements','Manage admission requirements'],['admissions.manage_intakes','Manage admission intakes'],['admissions.manage_applicant_documents','Manage applicant documents'],['admissions.finalise_admission','Finalise admissions'],['admissions.convert_to_student','Convert applicants into students'],['admissions.export','Export admissions reports'],
  ].map(([id,label])=>({id,label})) },
  { id: 'academics', label: 'Academic Management', permissions: [
    ['academics.view','View academic records'],['academics.manage_programmes','Manage programmes'],['academics.manage_departments','Manage departments'],['academics.manage_campuses','Manage campuses'],['academics.manage_intakes','Manage academic intakes'],['academics.manage_academic_years','Manage academic years'],['academics.manage_semesters','Manage semesters'],['academics.manage_course_units','Manage course units'],['academics.manage_curriculum','Manage curricula'],['academics.manage_academic_authorities','Manage academic authorities'],['academics.assign_students','Assign students to programmes'],['academics.manage_enrolments','Manage enrolments'],['academics.manage_class_lists','Manage class lists'],['academics.manage_assessments','Manage assessments'],['academics.enter_marks','Enter marks'],['academics.edit_marks','Edit marks'],['academics.approve_results','Approve results'],['academics.publish_results','Publish results'],['academics.print_results','Print results'],['academics.export_results','Export results'],['academics.view_transcripts','View transcripts'],['academics.generate_transcripts','Generate transcripts'],
  ].map(([id,label])=>({id,label})) },
  { id: 'timetable', label: 'Timetable Management', permissions: [
    ['timetable.view','View timetables'],['timetable.create','Create timetables'],['timetable.edit','Edit timetables'],['timetable.delete','Delete timetables'],['timetable.generate','Generate timetables'],['timetable.manage_templates','Manage timetable templates'],['timetable.manage_rooms','Manage rooms and venues'],['timetable.manage_sessions','Schedule academic sessions'],['timetable.assign_lecturers','Assign lecturers'],['timetable.assign_classes','Assign classes'],['timetable.approve','Approve timetables'],['timetable.publish','Publish timetables'],['timetable.export','Export timetables'],
  ].map(([id,label])=>({id,label})) },
  { id: 'staff', label: 'Human Resources & Staff Management', permissions: [
    ['staff.view','View staff'],['staff.create','Add staff'],['staff.edit','Edit staff'],['staff.delete','Delete staff records'],['staff.archive','Archive staff'],['staff.restore','Restore archived staff'],['staff.manage_departments','Manage staff departments'],['staff.manage_designations','Manage designations'],['staff.manage_employment_types','Manage employment types'],['staff.manage_contracts','Manage staff contracts'],['staff.manage_documents','Manage staff documents'],['staff.manage_qualifications','Manage qualifications'],['staff.manage_course_assignments','Assign course units to teaching staff'],['staff.manage_login_accounts','Manage staff login accounts'],['staff.manage_roles','Assign staff roles'],['staff.manage_permissions','Manage staff permissions'],['staff.view_salary','View salary information'],['staff.manage_salary','Manage salary information'],['staff.export','Export staff records'],
  ].map(([id,label])=>({id,label})) },
  { id: 'attendance_leave', label: 'Staff Attendance & Leave', permissions: [
    ['attendance.view','View attendance'],['attendance.record','Record attendance'],['attendance.edit','Edit attendance'],['attendance.approve','Approve attendance'],['attendance.view_reports','View attendance reports'],['attendance.export','Export attendance reports'],['leave.view','View leave requests'],['leave.apply','Apply for leave'],['leave.edit_own','Edit own pending leave requests'],['leave.approve','Approve leave'],['leave.reject','Reject leave'],['leave.manage_types','Manage leave types'],['leave.manage_balances','Manage leave balances'],['leave.view_reports','View leave reports'],
  ].map(([id,label])=>({id,label})) },
  { id: 'finance', label: 'Finance & Accounting', permissions: [
    ['finance.view','Access finance module'],['finance.view_student_balances','View student balances'],['finance.view_fee_structures','View fee structures'],['finance.manage_fee_structures','Manage fee structures'],['finance.manage_fee_types','Manage fee types'],['finance.generate_invoices','Generate invoices'],['finance.view_invoices','View invoices'],['finance.edit_invoices','Edit invoices'],['finance.delete_invoices','Delete invoices'],['finance.record_payments','Record manual payments'],['finance.verify_payments','Verify payments'],['finance.reverse_payments','Reverse payments'],['finance.delete_payments','Delete payments'],['finance.view_transactions','View transactions'],['finance.manage_schoolpay','Manage SchoolPay configuration'],['finance.reconcile_payments','Reconcile payments'],['finance.manage_refunds','Manage refunds'],['finance.approve_refunds','Approve refunds'],['finance.manage_accounts','Manage chart of accounts'],['finance.manage_journals','Manage journal entries'],['finance.approve_journals','Approve journal entries'],['finance.manage_expenses','Manage expenses'],['finance.approve_expenses','Approve expenses'],['finance.manage_budgets','Manage budgets'],['finance.view_income_reports','View income reports'],['finance.view_expense_reports','View expense reports'],['finance.view_payment_reports','View payment reports'],['finance.export_reports','Export financial reports'],['finance.manage_currency','Manage finance currency settings'],
  ].map(([id,label])=>({id,label})) },
  { id: 'inventory', label: 'Inventory & Stores', permissions: [
    ['inventory.view','View inventory'],['inventory.create_items','Register inventory items'],['inventory.edit_items','Edit inventory items'],['inventory.delete_items','Delete inventory items'],['inventory.manage_categories','Manage item categories'],['inventory.manage_departments','Manage departmental stores'],['inventory.record_stock_in','Record stock received'],['inventory.record_stock_out','Record stock issued'],['inventory.manage_transfers','Transfer stock'],['inventory.manage_adjustments','Adjust stock balances'],['inventory.manage_requisitions','Manage requisitions'],['inventory.approve_requisitions','Approve requisitions'],['inventory.manage_suppliers','Manage suppliers'],['inventory.manage_purchase_orders','Manage purchase orders'],['inventory.manage_assets','Manage institutional assets'],['inventory.manage_stock_alerts','Manage low-stock alerts'],['inventory.view_stock_reports','View stock reports'],['inventory.export','Export inventory records'],
  ].map(([id,label])=>({id,label})) },
  { id: 'medical', label: 'Medical Department', permissions: [
    ['medical.view','Access medical module'],['medical.view_student_list','View students from central registry'],['medical.create_records','Create medical records'],['medical.edit_records','Edit medical records'],['medical.view_records','View medical records'],['medical.manage_visits','Manage medical visits'],['medical.manage_treatments','Manage treatment records'],['medical.manage_prescriptions','Manage prescriptions'],['medical.manage_referrals','Manage referrals'],['medical.manage_sickbay','Manage sickbay records'],['medical.view_reports','View medical reports'],['medical.export_reports','Export permitted medical reports'],
  ].map(([id,label])=>({id,label})) },
  { id: 'library', label: 'Library Management', permissions: [
    ['library.view','View library'],['library.manage_books','Manage books'],['library.delete_books','Delete book records'],['library.manage_categories','Manage book categories'],['library.manage_members','Manage library members'],['library.issue_books','Issue books'],['library.return_books','Process book returns'],['library.manage_reservations','Manage reservations'],['library.manage_fines','Manage library fines'],['library.manage_lost_books','Manage lost books'],['library.view_reports','View library reports'],
  ].map(([id,label])=>({id,label})) },
  { id: 'archives', label: 'Archives & Records Management', permissions: [
    ['archives.view','View archives'],['archives.view_records','View archived records'],['archives.create','Create archive entries'],['archives.restore','Restore archived records'],['archives.permanently_delete','Permanently delete archived records'],['archives.search','Search archives'],['archives.export','Export archive records'],['records.manage_documents','Manage institutional documents'],['records.manage_retention','Manage document retention rules'],
  ].map(([id,label])=>({id,label})) },
  { id: 'settings_system', label: 'System Administration & Settings', permissions: [
    ['settings.view','View settings'],['settings.manage_institution','Manage institution details'],['settings.manage_logo','Manage institutional branding'],['settings.manage_currency','Manage system currency'],['settings.manage_academic_settings','Manage academic settings'],['settings.manage_notifications','Manage notification settings'],['settings.manage_email','Manage institutional email'],['settings.manage_integrations','Manage integrations'],['settings.manage_security','Manage security settings'],['settings.manage_backups','Manage backups'],['settings.restore_backups','Restore backups'],['system.view_audit_logs','View audit logs'],['system.export_audit_logs','Export audit logs'],['system.manage_users','Manage system users'],['system.manage_roles','Manage roles'],['system.manage_permissions','Manage permission catalogue'],['system.assign_roles','Assign roles'],['system.manage_access','Manage user access'],['system.deactivate_users','Deactivate user accounts'],
  ].map(([id,label])=>({id,label})) },
  { id: 'communications', label: 'Notifications & Communication', permissions: [
    ['notifications.view','View notifications'],['notifications.manage','Manage notifications'],['notifications.send','Send notifications'],['notices.view','View noticeboard'],['notices.create','Create notices'],['notices.edit','Edit notices'],['notices.delete','Delete notices'],['notices.publish','Publish notices'],['communications.manage_templates','Manage communication templates'],['communications.send_email','Send institutional emails'],
  ].map(([id,label])=>({id,label})) },
  { id: 'reports', label: 'Reports & Exports', permissions: [
    ['reports.view','View general reports'],['reports.generate','Generate reports'],['reports.export_pdf','Export PDF reports'],['reports.export_excel','Export Excel reports'],['reports.export_csv','Export CSV reports'],['reports.schedule','Schedule reports'],['reports.view_restricted','View restricted reports'],
  ].map(([id,label])=>({id,label})) },
]

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

  const emptyStaffForm = () => ({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent', staffType: 'Teaching', departmentId: '', jobTitle: '', highestQualification: '', speciality: '', professionalRegistration: '', courseUnitIds: [] as string[] })
  const duplicateErrorPattern = /staff number is already registered|staff member with this staff number already exists/i
  const [leaveForm, setLeaveForm] = useState({ staffMemberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' })
  const [leaveDuration, setLeaveDuration] = useState<'single' | 'multiple'>('single')
  const [form, setForm] = useState(emptyStaffForm())
  const [accountMode, setAccountMode] = useState<'new' | 'existing'>('new')
  const [accountUsername, setAccountUsername] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [credentialFeedback, setCredentialFeedback] = useState('')
  const [credentialBusy, setCredentialBusy] = useState(false)
  const [staffStatus, setStaffStatus] = useState<'Active' | 'Inactive'>('Active')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissionSearch, setPermissionSearch] = useState('')
  const allPermissionIds = useMemo(() => STAFF_PERMISSION_GROUPS.flatMap(group => group.permissions.map(permission => permission.id)), [])
  const filteredPermissionGroups = useMemo(() => STAFF_PERMISSION_GROUPS.map(group => ({ ...group, permissions: group.permissions.filter(permission => !permissionSearch.trim() || permission.label.toLowerCase().includes(permissionSearch.toLowerCase()) || permission.id.toLowerCase().includes(permissionSearch.toLowerCase())) })).filter(group => group.permissions.length > 0), [permissionSearch])
  const togglePermissionGroup = (groupId: string, checked: boolean) => {
    const group = STAFF_PERMISSION_GROUPS.find(item => item.id === groupId)
    if (!group) return
    const ids = group.permissions.map(permission => permission.id)
    setSelectedPermissions(current => checked ? [...new Set([...current, ...ids])] : current.filter(id => !ids.includes(id)))
  }

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
        setStaff(current => current.map(item => item.id === updated.id ? { ...updated, isActive: staffStatus === 'Active' } : item))
        if (staffStatus === 'Active' && !updated.isActive) await activateStaff(updated.id)
        if (staffStatus === 'Inactive' && updated.isActive) await deactivateStaff(updated.id)
        setSuccess(`${formatPersonName(updated.lastName, updated.firstName)} was updated successfully.`)
        notify(`${formatPersonName(updated.lastName, updated.firstName)} updated successfully.`, 'success', 'Staff updated')
        setEditingStaffId(null)
      } else {
        const created = await createStaff(profile)
        if (staffStatus === 'Inactive') await deactivateStaff(created.id)
        const savedStaff = { ...created, isActive: staffStatus === 'Active' }
        // Add the server-confirmed record immediately, then reconcile with the API list.
        setStaff(current => [savedStaff, ...current.filter(item => item.id !== created.id)])
        setSuccess(`${formatPersonName(created.lastName, created.firstName)} was saved and added to the staff table.`)
        notify(`${formatPersonName(created.lastName, created.firstName)} saved successfully.`, 'success', 'Staff saved')
        void listStaff(false).then(latest => {
          setStaff(latest.some(item => item.id === created.id) ? latest : [created, ...latest])
        }).catch(() => {
          // Keep the confirmed create response visible even if the follow-up list refresh fails.
        })
      }
      setForm(emptyStaffForm())
      setStaffStatus('Active')
      setAccountMode('new')
      setAccountUsername('')
      setAccountPassword('')
      setCredentialFeedback('')
      setSelectedPermissions([])
    } catch (e) {
      const message = e instanceof Error ? e.message : editingStaffId ? 'Unable to update staff.' : 'Unable to create staff.'
      setError(message)
      notify(message, 'error', editingStaffId ? 'Staff update failed' : 'Staff save failed')
      // A duplicate may be an inactive record, so refresh the complete staff list too.
      try { setStaff(await listStaff(false)) } catch (e) { console.error('Staff list refresh failed', e) /* Preserve the original create error. */ }
    }
  }
  function beginEdit(person: StaffMember) {
    setSelectedPermissions([])
    setEditingStaffId(person.id)
    setStaffStatus(person.isActive ? 'Active' : 'Inactive')
    setAccountMode('new')
    setAccountUsername('')
    setAccountPassword('')
    setCredentialFeedback('')
    setForm({ ...emptyStaffForm(), staffNumber: person.staffNumber, firstName: person.firstName, lastName: person.lastName, nationalId: person.nationalId ?? '', phoneNumber: person.phoneNumber ?? '', email: person.email ?? '', employmentType: person.employmentType, staffType: person.staffType ?? 'Teaching', departmentId: person.departmentId ?? '', jobTitle: person.jobTitle ?? '', highestQualification: person.highestQualification ?? '', speciality: person.speciality ?? '', professionalRegistration: person.professionalRegistration ?? '', courseUnitIds: person.courseUnitIds ?? [] })
    setError('')
    setSuccess('')
    setTab('staff')
  }
  function cancelEdit() {
    setSelectedPermissions([])
    setEditingStaffId(null)
    setStaffStatus('Active')
    setAccountMode('new')
    setAccountUsername('')
    setAccountPassword('')
    setCredentialFeedback('')
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

  async function updateExistingStaffCredentials() {
    const username = accountUsername.trim()
    if (!username && !accountPassword) { setError('Enter the existing username and at least a new password.'); return }
    if (!accountPassword.trim()) { setError('Enter a new password to update credentials.'); return }
    if (accountPassword.length < 8) { setError('Password must contain at least 8 characters.'); return }
    setCredentialBusy(true); setError(''); setCredentialFeedback('')
    try {
      const users = await getUsers()
      const matched = users.find(user => user.username.toLowerCase() === username.toLowerCase())
      if (!matched) throw new Error('No existing login account matches that username.')
      await resetUserPassword(matched.id, accountPassword)
      setCredentialFeedback(`Credentials updated for ${matched.username}.`)
      setAccountPassword('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update login credentials.') }
    finally { setCredentialBusy(false) }
  }

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
            <form className="staff-create-form" onSubmit={submit}>
              <section className="staff-create-card">
                <h3 className="staff-create-card-title">Personal Details</h3>
                <div className="staff-create-grid staff-create-grid-3">
                  <label className="staff-create-field">Staff Number
                    <input placeholder="Enter staff number" aria-invalid={Boolean(validationErrors.staffNumber)} value={form.staffNumber} onChange={e => { setForm({ ...form, staffNumber: e.target.value }); setValidationErrors(current => { const next = { ...current }; delete next.staffNumber; return next }) }} required />
                    {validationErrors.staffNumber && <small className="staff-create-error">{validationErrors.staffNumber}</small>}
                  </label>
                  <label className="staff-create-field">First Name
                    <input placeholder="Enter first name" aria-invalid={Boolean(validationErrors.firstName)} value={form.firstName} onChange={e => { setForm({ ...form, firstName: e.target.value }); setValidationErrors(current => { const next = { ...current }; delete next.firstName; return next }) }} required />
                  </label>
                  <label className="staff-create-field">Last Name
                    <input placeholder="Enter last name" aria-invalid={Boolean(validationErrors.lastName)} value={form.lastName} onChange={e => { setForm({ ...form, lastName: e.target.value }); setValidationErrors(current => { const next = { ...current }; delete next.lastName; return next }) }} required />
                  </label>
                  <label className="staff-create-field">National ID
                    <input placeholder="National identification number" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
                  </label>
                  <label className="staff-create-field">Phone
                    <input type="tel" placeholder="Enter phone number" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
                  </label>
                  <label className="staff-create-field">Email
                    <input type="email" placeholder="Enter email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </label>
                </div>
              </section>

              <section className="staff-create-card">
                <h3 className="staff-create-card-title">Joining Detail</h3>
                <div className="staff-create-grid staff-create-grid-3">
                  <label className="staff-create-field">Staff Category
                    <select value={form.staffType} onChange={e => setForm({ ...form, staffType: e.target.value, courseUnitIds: e.target.value === 'Teaching' ? form.courseUnitIds : [] })} required>
                      {STAFF_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="staff-create-field">Employment Type
                    <select value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} required>
                      <option value="Permanent">Permanent</option><option value="Temporary">Temporary</option><option value="Part-time">Part-time</option>
                    </select>
                  </label>
                  <label className="staff-create-field">Department
                    <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                      <option value="">Select department</option>{departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                    </select>
                  </label>
                  <label className="staff-create-field">Designation / Job Title
                    <input placeholder="e.g. Senior Tutor, Administrator" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
                  </label>
                  <label className="staff-create-field">Highest Qualification
                    <input placeholder="Enter qualification" value={form.highestQualification} onChange={e => setForm({ ...form, highestQualification: e.target.value })} />
                  </label>
                  <label className="staff-create-field">Specialities
                    <input placeholder="Area of expertise" value={form.speciality} onChange={e => setForm({ ...form, speciality: e.target.value })} />
                  </label>
                  <label className="staff-create-field">Professional Registration
                    <input placeholder="Registration / licence number" value={form.professionalRegistration} onChange={e => setForm({ ...form, professionalRegistration: e.target.value })} />
                  </label>
                </div>
                {form.staffType === 'Teaching' && <fieldset className="staff-create-course-units">
                  <legend>Course units taught</legend>
                  <div className="staff-create-course-summary">{form.courseUnitIds.length} selected</div>
                  {courseUnits.length === 0
                    ? <p className="staff-create-hint">No active course units are available. Populate the course catalogue or check the staff lookup API.</p>
                    : <div className="staff-create-permissions-grid">
                      {courseUnits.map(unit => {
                        const checked = form.courseUnitIds.includes(unit.id)
                        return <label key={unit.id} className="staff-create-check">
                          <input type="checkbox" checked={checked} onChange={e => setForm(current => ({ ...current, courseUnitIds: e.target.checked ? [...current.courseUnitIds.filter(id => id !== unit.id), unit.id] : current.courseUnitIds.filter(id => id !== unit.id) }))} />
                          <span><strong>{unit.code}</strong> — {unit.name} <small>({unit.creditUnits} CU)</small></span>
                        </label>
                      })}
                    </div>}
                </fieldset>}
              </section>

              <div className="staff-create-bottom-grid">
                <section className="staff-create-card">
                  <div className="staff-create-card-heading">
                    <div>
                      <h3 className="staff-create-card-title">Permissions by module</h3>
                      <p className="staff-create-hint">Select a module to select every permission in that group, or expand it to choose individual actions.</p>
                    </div>
                    <strong className="staff-permission-count">{selectedPermissions.length} / {allPermissionIds.length} selected</strong>
                  </div>
                  <div className="staff-permission-toolbar">
                    <input type="search" aria-label="Search permissions" placeholder="Search permissions…" value={permissionSearch} onChange={event => setPermissionSearch(event.target.value)} />
                    <button type="button" className="secondary-button" onClick={() => setSelectedPermissions(allPermissionIds)}>Select all</button>
                    <button type="button" className="secondary-button" onClick={() => setSelectedPermissions([])}>Clear all</button>
                  </div>
                  <div className="staff-permission-groups">
                    {filteredPermissionGroups.map(group => {
                      const groupIds = STAFF_PERMISSION_GROUPS.find(item => item.id === group.id)?.permissions.map(permission => permission.id) ?? []
                      const selectedCount = groupIds.filter(id => selectedPermissions.includes(id)).length
                      const allSelected = groupIds.length > 0 && selectedCount === groupIds.length
                      return <details className="staff-permission-group" key={group.id} open={Boolean(permissionSearch.trim())}>
                        <summary>
                          <input type="checkbox" aria-label={`Select all ${group.label} permissions`} checked={allSelected} onChange={event => togglePermissionGroup(group.id, event.target.checked)} onClick={event => event.stopPropagation()} />
                          <span className="staff-permission-group-title">{group.label}</span>
                          <span className="staff-permission-group-count">{selectedCount} selected</span>
                        </summary>
                        <div className="staff-permission-items">
                          {group.permissions.map(permission => <label className="staff-permission-item" key={permission.id}>
                            <input type="checkbox" checked={selectedPermissions.includes(permission.id)} onChange={event => setSelectedPermissions(current => event.target.checked ? [...current, permission.id] : current.filter(id => id !== permission.id))} />
                            <span>{permission.label}<small>{permission.id}</small></span>
                          </label>)}
                        </div>
                      </details>
                    })}
                  </div>
                  <p className="staff-create-hint staff-permission-notice">Permission selections are currently a form draft. The existing identity API does not yet persist or enforce this catalogue; account and role integration must be completed before these selections grant access.</p>
                </section>
                <section className="staff-create-card">
                  <h3 className="staff-create-card-title">Account & Status</h3>
                  <p className="staff-create-hint">Set the staff member's employment status below. Login credentials are managed by the secure SMIS identity service.</p>
                  <span className="staff-create-status">{editingStaffId ? 'Editing existing staff record' : 'New staff record'}</span>
                </section>
              </div>

              <div className="staff-create-bottom-grid">
                <section className="staff-create-card">
                  <div className="staff-create-card-heading">
                    <h3 className="staff-create-card-title" id="staff-login-card-title">{accountMode === 'existing' ? 'Change Credentials' : 'Login Details'}</h3>
                    <div className="staff-create-radio-row" role="radiogroup" aria-label="Account mode">
                      <label><input type="radio" name="accountMode" value="new" checked={accountMode === 'new'} onChange={() => { setAccountMode('new'); setCredentialFeedback(''); setError('') }} /> New</label>
                      <label><input type="radio" name="accountMode" value="existing" checked={accountMode === 'existing'} onChange={() => { setAccountMode('existing'); setCredentialFeedback(''); setError('') }} /> Existing</label>
                    </div>
                  </div>
                  <label className="staff-create-field">{accountMode === 'existing' ? 'Existing Username' : 'Username'}
                    <input autoComplete="username" placeholder={accountMode === 'existing' ? 'Enter existing username' : 'Enter Username'} value={accountUsername} onChange={e => setAccountUsername(e.target.value)} />
                  </label>
                  <label className="staff-create-field" style={{ marginTop: 12 }}>{accountMode === 'existing' ? 'New Password' : 'Password'}
                    <input type="password" autoComplete="new-password" minLength={8} placeholder={accountMode === 'existing' ? 'Enter New Password' : 'Enter Password'} value={accountPassword} onChange={e => setAccountPassword(e.target.value)} />
                  </label>
                  {credentialFeedback && <div className="staff-create-credential-feedback" role="status" aria-live="polite">{credentialFeedback}</div>}
                  {accountMode === 'new' && <p className="staff-create-hint" style={{ marginTop: 10 }}>New account creation will be connected to the role selected in the Permissions section once you provide the role and permission list.</p>}
                  {accountMode === 'existing' && <p className="staff-create-hint" style={{ marginTop: 10 }}>Enter an existing SMIS username and a new password. This securely resets the account password; usernames are not changed by the current identity API.</p>}
                </section>
                <section className="staff-create-card">
                  <h3 className="staff-create-card-title">Status</h3>
                  <div className="staff-create-radio-row staff-create-status-options" role="radiogroup" aria-label="Staff status">
                    <label><input type="radio" name="staffStatus" value="Active" checked={staffStatus === 'Active'} onChange={() => setStaffStatus('Active')} /> Active</label>
                    <label><input type="radio" name="staffStatus" value="Inactive" checked={staffStatus === 'Inactive'} onChange={() => setStaffStatus('Inactive')} /> Inactive</label>
                  </div>
                </section>
              </div>

              <div className="staff-create-actions">
                <button type="submit" className="staff-create-primary" disabled={accountMode === 'existing'}>{editingStaffId ? 'Save changes' : 'Add New Staff'}</button>
                <div className="staff-create-actions-right">
                  {accountMode === 'existing' && <button type="button" className="staff-create-primary" onClick={() => void updateExistingStaffCredentials()} disabled={credentialBusy}>{credentialBusy ? 'Updating…' : 'Update Staff login details'}</button>}
                  {editingStaffId && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel edit</button>}
                  <button type="button" className="secondary-button" onClick={() => { if (editingStaffId) cancelEdit(); else { setForm(emptyStaffForm()); setStaffStatus('Active'); setAccountMode('new'); setAccountUsername(''); setAccountPassword(''); setCredentialFeedback(''); setValidationErrors({}); setError(''); setSuccess('') } }}>Cancel</button>
                </div>
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
