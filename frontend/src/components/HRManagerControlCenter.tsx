import { useEffect, useMemo, useState } from 'react'
import { listStaff, listLeave, type LeaveRequest, type StaffMember } from '../api/staff'
import { listPayroll, type PayrollRecord } from '../api/payroll'
import { formatCurrency } from '../lib/currency'

type HrTab = 'staff' | 'payroll' | 'leave' | 'recruitment'
type Props = { onNavigate: (tab: HrTab) => void }
const money = (v: number) => formatCurrency(Number(v) || 0)

export function HRManagerControlCenter({ onNavigate }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errors, setErrors] = useState(0)

  async function load() {
    setRefreshing(true)
    const activeResult = await listStaff(true).catch(() => null)
    const allResult = await listStaff(false).catch(() => null)
    const payrollResult = await listPayroll().catch(() => [])
    const all = allResult ?? activeResult ?? []
    let failureCount = Number(activeResult === null) + Number(allResult === null)
    const leaveResults = await Promise.all(all.map(s => listLeave(s.id).catch(() => {
      failureCount++
      return [] as LeaveRequest[]
    })))
    setStaff(activeResult ?? all.filter(s => s.isActive))
    setPayroll(payrollResult)
    setLeave(leaveResults.flat())
    setErrors(failureCount)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { void load() }, [])

  const now = new Date()
  const currentPayroll = payroll.filter(p => p.month === now.getMonth() + 1 && p.year === now.getFullYear())
  const pendingLeave = leave.filter(x => x.status === 'Pending')
  const approvedLeave = leave.filter(x => x.status === 'Approved')
  const today = now.toISOString().slice(0, 10)
  const onLeaveNow = approvedLeave.filter(x => x.startDate <= today && today <= x.endDate)
  const payrollCost = currentPayroll.reduce((s, p) => s + p.netPay, 0)
  const unpaidPayroll = currentPayroll.filter(p => p.status !== 'Paid')
  const teaching = staff.filter(s => s.staffType === 'Teaching').length
  const nonTeaching = staff.filter(s => s.staffType !== 'Teaching').length
  const employmentMix = useMemo(() => {
    const map = new Map<string, number>()
    staff.forEach(s => map.set(s.employmentType, (map.get(s.employmentType) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [staff])

  if (loading) return <section className="hr-control-center finance-surface"><p className="empty">Loading HR manager control center…</p></section>

  return (
    <section className="hr-control-center" aria-label="Human resources manager control center">
      <div className="hr-control-heading">
        <div><span className="eyebrow">HUMAN RESOURCES · MANAGER CONTROL CENTER</span><h3>Workforce & people operations</h3><p>Manage the institution's workforce position, payroll exposure, leave approvals and staffing actions from one screen.</p></div>
        <button type="button" className="secondary-button" onClick={() => void load()} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh HR position'}</button>
      </div>

      {errors > 0 && <div className="finance-control-warning">Some HR records could not be loaded. The available staff and payroll controls remain usable.</div>}

      <div className="hr-control-kpis">
        <button type="button" className="hr-control-kpi" onClick={() => onNavigate('staff')}><span>Active workforce</span><strong>{staff.length}</strong><small>{teaching} teaching · {nonTeaching} non-teaching</small></button>
        <button type="button" className="hr-control-kpi" onClick={() => onNavigate('payroll')}><span>Current payroll</span><strong>{money(payrollCost)}</strong><small>{unpaidPayroll.length} records awaiting payment</small></button>
        <button type="button" className="hr-control-kpi" onClick={() => onNavigate('leave')}><span>Leave awaiting action</span><strong>{pendingLeave.length}</strong><small>{onLeaveNow.length} staff currently on leave</small></button>
        <button type="button" className="hr-control-kpi" onClick={() => onNavigate('staff')}><span>Workforce mix</span><strong>{employmentMix.length}</strong><small>employment types represented</small></button>
      </div>

      <div className="hr-control-grid">
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">PEOPLE OPERATIONS</span><h3>Manager action queue</h3></div><strong className={pendingLeave.length || unpaidPayroll.length ? 'finance-value-danger' : 'finance-value-success'}>{pendingLeave.length + unpaidPayroll.length} actions</strong></div>
          <div className="finance-alert-list">
            <button type="button" onClick={() => onNavigate('leave')}><span><strong>Leave approvals</strong><small>Requests waiting for HR action</small></span><strong>{pendingLeave.length}</strong></button>
            <button type="button" onClick={() => onNavigate('payroll')}><span><strong>Payroll payments</strong><small>Current-period records not marked paid</small></span><strong>{unpaidPayroll.length}</strong></button>
            <button type="button" onClick={() => onNavigate('recruitment')}><span><strong>Recruitment & onboarding</strong><small>Open the staffing pipeline workspace</small></span><strong>Open</strong></button>
            <button type="button" onClick={() => onNavigate('staff')}><span><strong>Staff records</strong><small>Review active workforce information</small></span><strong>{staff.length}</strong></button>
          </div>
        </section>

        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">WORKFORCE COMPOSITION</span><h3>Staffing profile</h3></div></div>
          <div className="hr-composition"><div><span>Teaching</span><strong>{teaching}</strong></div><div><span>Non-teaching</span><strong>{nonTeaching}</strong></div>{employmentMix.slice(0, 4).map(([type, count]) => <div key={type}><span>{type}</span><strong>{count}</strong></div>)}</div>
        </section>
      </div>

      <div className="hr-control-grid">
        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">LEAVE MANAGEMENT</span><h3>Leave position</h3></div><button type="button" className="secondary-button" onClick={() => onNavigate('leave')}>Open leave</button></div>
          <div className="finance-control-stat-list">
            <div><span>Pending approval</span><strong className={pendingLeave.length ? 'finance-value-danger' : 'finance-value-success'}>{pendingLeave.length}</strong></div>
            <div><span>Approved requests</span><strong>{approvedLeave.length}</strong></div>
            <div><span>Currently on approved leave</span><strong>{onLeaveNow.length}</strong></div>
            <div><span>Total leave records</span><strong>{leave.length}</strong></div>
          </div>
          <div className="hr-mini-list">{pendingLeave.slice(0, 5).map(item => <button type="button" key={item.id} onClick={() => onNavigate('leave')}><span>{item.leaveType}</span><strong>{item.startDate} → {item.endDate}</strong></button>)}{!pendingLeave.length && <p className="empty">No leave approvals are waiting.</p>}</div>
        </section>

        <section className="finance-surface">
          <div className="finance-surface-heading"><div><span className="eyebrow">PAYROLL CONTROL</span><h3>Current payroll exposure</h3></div><button type="button" className="secondary-button" onClick={() => onNavigate('payroll')}>Open payroll</button></div>
          <div className="finance-control-stat-list">
            <div><span>Current-period net payroll</span><strong>{money(payrollCost)}</strong></div>
            <div><span>Payroll records</span><strong>{currentPayroll.length}</strong></div>
            <div><span>Paid</span><strong className="finance-value-success">{currentPayroll.filter(p => p.status === 'Paid').length}</strong></div>
            <div><span>Pending</span><strong className={unpaidPayroll.length ? 'finance-value-danger' : 'finance-value-success'}>{unpaidPayroll.length}</strong></div>
          </div>
        </section>
      </div>

      <section className="finance-surface">
        <div className="finance-surface-heading"><div><span className="eyebrow">HR WORKFLOW</span><h3>Core manager workspaces</h3><p>The dashboard is the control layer; detailed actions remain in the existing HR workspaces.</p></div></div>
        <div className="hr-workspace-grid">
          <button type="button" className="hr-workspace-card" onClick={() => onNavigate('staff')}><strong>Staff records</strong><span>Employee identity, employment type, contacts and active status.</span><small>Open workspace →</small></button>
          <button type="button" className="hr-workspace-card" onClick={() => onNavigate('payroll')}><strong>Payroll</strong><span>Generate, review and settle monthly payroll.</span><small>Open workspace →</small></button>
          <button type="button" className="hr-workspace-card" onClick={() => onNavigate('leave')}><strong>Leave</strong><span>Review requests and approve or reject leave.</span><small>Open workspace →</small></button>
          <button type="button" className="hr-workspace-card" onClick={() => onNavigate('recruitment')}><strong>Recruitment & onboarding</strong><span>Vacancies, applicants, interviews and onboarding.</span><small>Open workspace →</small></button>
        </div>
      </section>
    </section>
  )
}
