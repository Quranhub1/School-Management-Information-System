import { useEffect, useState } from 'react'
import { createStaff, deactivateStaff, listStaff, listLeave, requestLeave, approveLeave, type StaffMember, type LeaveRequest } from '../api/staff'
import { listPayroll, generatePayroll, markPayrollPaid, type PayrollRecord } from '../api/payroll'

type Tab = 'staff' | 'payroll' | 'leave' | 'recruitment'

export function StaffManagement({ canManage }: { canManage?: boolean }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'staff' | 'payroll' | 'leave' | 'recruitment'>('staff')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear())

  async function loadStaff() { setLoading(true); try { setStaff(await listStaff()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load staff.') } finally { setLoading(false) } }
  async function loadLeave() { if (!leaveForm.staffMemberId.trim()) return; try { setLeaveRequests(await listLeave(leaveForm.staffMemberId.trim())) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load leave requests.') } }
  async function loadPayroll() { try { setPayroll(await listPayroll()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load payroll.') } }

  const [form, setForm] = useState({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent', staffType: 'Teaching' })
  const [leaveForm, setLeaveForm] = useState({ staffMemberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' })

  useEffect(() => { void loadStaff() }, [])
  useEffect(() => { if (tab === 'leave') void loadLeave() }, [tab])
  useEffect(() => { if (tab === 'payroll') void loadPayroll() }, [tab])

  async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); try { await createStaff(form); setForm({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent' }); await loadStaff() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create staff.') } }
  async function deactivate(id: string) { try { await deactivateStaff(id); await loadStaff() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to deactivate staff.') } }
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
        <button role="tab" aria-selected={tab === 'payroll'} className={tab === 'payroll' ? 'active' : ''} onClick={() => setTab('payroll')}>Payroll</button>
        <button role="tab" aria-selected={tab === 'leave'} className={tab === 'leave' ? 'active' : ''} onClick={() => setTab('leave')}>Leave</button>
        <button role="tab" aria-selected={tab === 'recruitment'} className={tab === 'recruitment' ? 'active' : ''} onClick={() => setTab('recruitment')}>Recruitment</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {tab === 'staff' && (
        <>
          {canManage && (
            <form className="grid-form" onSubmit={submit}>
              <input placeholder="Staff number" value={form.staffNumber} onChange={e => setForm({ ...form, staffNumber: e.target.value })} required />
              <input placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              <input placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
              <input placeholder="Employment type" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} required />
              <input placeholder="Phone" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <button type="submit">Add staff member</button>
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff No.</th><th>Name</th><th>Employment</th><th>Contact</th>{canManage && <th>Action</th>}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="empty">Loading staff…</td></tr> : staff.map(s => (
                  <tr key={s.id}><td>{s.staffNumber}</td><td>{s.firstName} {s.lastName}</td><td>{s.employmentType}</td><td>{s.email || s.phoneNumber || '—'}</td>{canManage && <td><button className="secondary-button" onClick={() => void deactivate(s.id)}>{s.isActive ? 'Deactivate' : 'Activate'}</button></td>}</tr>
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <select value={payrollMonth} onChange={e => setPayrollMonth(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>)}</select>
            <input type="number" value={payrollYear} onChange={e => setPayrollYear(Number(e.target.value))} style={{ width: 100 }} />
            <button className="btn" onClick={() => void handleGeneratePayroll()}>Generate Payroll</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff</th><th>Month</th><th>Year</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {payroll.length === 0 ? <tr><td colSpan={9} className="empty">No payroll records found.</td></tr> : payroll.map(p => (
                  <tr key={p.id}><td>{p.staffMemberId}</td><td>{p.month}</td><td>{p.year}</td><td>UGX {p.basicSalary.toLocaleString()}</td><td>UGX {p.allowances.toLocaleString()}</td><td>UGX {p.deductions.toLocaleString()}</td><td><strong>UGX {p.netPay.toLocaleString()}</strong></td><td><span className="badge" style={{ background: p.status === 'Paid' ? '#d1fae5' : '#fef3c7', color: p.status === 'Paid' ? '#065f46' : '#92400e' }}>{p.status}</span></td><td>{p.status === 'Pending' && <button className="secondary-button" onClick={() => void handleMarkPaid(p.id)}>Mark Paid</button>}</td></tr>
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
