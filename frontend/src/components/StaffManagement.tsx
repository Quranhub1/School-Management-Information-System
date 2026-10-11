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
      if (nextTab) setTab(nextTab)
    }
    window.addEventListener('smis:navigate-subsection', handler)
    return () => window.removeEventListener('smis:navigate-subsection', handler)
  }, [])

  useEffect(() => { void loadStaff() }, [])
  useEffect(() => { if (tab === 'leave') void loadLeave() }, [tab])
  useEffect(() => { if (tab === 'payroll') void loadPayroll() }, [tab])

  async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); try { await createStaff(form); setForm({ staffNumber: '', firstName: '', lastName: '', nationalId: '', phoneNumber: '', email: '', employmentType: 'Permanent', staffType: 'Teaching' }); await loadStaff() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create staff.') } }
  async function deactivate(id: string) { try { await deactivateStaff(id); await loadStaff() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to deactivate staff.') } }
  async function submitLeave(e: React.FormEvent) { e.preventDefault(); setError(''); try { await requestLeave(leaveForm.staffMemberId.trim(), { ...leaveForm, staffMemberId: leaveForm.staffMemberId.trim() }); setLeaveForm({ staffMemberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' }); await loadLeave() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to request leave.') } }
  async function approveLeaveRequest(id: string, approved: boolean) { try { await approveLeave(id, '', approved); await loadLeave() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to approve leave.') } }
  async function handleGeneratePayroll() { try { await generatePayroll(payrollMonth, payrollYear); await loadPayroll() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to generate payroll.') } }
  async function handleMarkPaid(id: string) { try { await markPayrollPaid(id); await loadPayroll() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to mark payroll as paid.') } }

  return (
    <section className="panel" aria-label="Staff management" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <span className="eyebrow">HR</span>
        </div>
        <div>
          <h2>Staff Management</h2>
        </div>
        <div style={{ flex: '1' }}>
          <span className="status">{staff.filter(s => s.isActive).length} active</span>
        </div>
      </div>

      <div className="library-workspace-tabs" role="tablist" aria-label="Staff sections" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        <button role="tab" aria-selected={tab === 'staff'} className={tab === 'staff' ? 'active' : ''} onClick={() => setTab('staff')}>Staff</button>
        <button role="tab" aria-selected={tab === 'payroll'} className={tab === 'payroll' ? 'active' : ''} onClick={() => setTab('payroll')}>Payroll</button>
        <button role="tab" aria-selected={tab === 'leave'} className={tab === 'leave' ? 'active' : ''} onClick={() => setTab('leave')}>Leave</button>
        <button role="tab" aria-selected={tab === 'recruitment'} className={tab === 'recruitment' ? 'active' : ''} onClick={() => setTab('recruitment')}>Recruitment</button>
      </div>

      <div className="sheet-content" style={{ flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
        {error && <div className="error" role="alert" style={{ margin: '16px' }}>{error}</div>}

        {tab === 'staff' && (
          <>
            {canManage && (
              <form className="grid-form" onSubmit={submit} style={{ margin: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <input placeholder="Staff number" value={form.staffNumber} onChange={e => setForm({ ...form, staffNumber: e.target.value })} required />
                  <input placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <input placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                  <input placeholder="Employment type" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <input placeholder="Phone" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
                  <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <button type="submit">Add staff member</button>
              </form>
            )}
            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Staff No.</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Employment</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                      {canManage && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr style={{ height: '60px' }}>
                        <td colSpan={5} className="empty" style={{ padding: '16px', textAlign: 'center' }}>Loading staff…</td>
                      </tr>
                    ) : (
                      staff.length === 0 ? (
                        <tr style={{ height: '60px' }}>
                          <td colSpan={5} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No staff found.</td>
                        </tr>
                      ) : (
                        staff.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <td style={{ padding: '12px 16px' }}>{s.staffNumber}</td>
                            <td style={{ padding: '12px 16px' }}>{s.firstName} {s.lastName}</td>
                            <td style={{ padding: '12px 16px' }}>{s.employmentType}</td>
                            <td style={{ padding: '12px 16px' }}>{s.email || s.phoneNumber || '—'}</td>
                            {canManage && <td style={{ padding: '12px 16px' }}><button className="secondary-button" onClick={() => void deactivate(s.id)}>{s.isActive ? 'Deactivate' : 'Activate'}</button></td>}
                          </tr>
                        ))
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'payroll' && (
          <>
            <div className="summary-container" style={{ margin: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="summary-card" style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', minWidth: '140px' }}>
                <span>Month</span>
                <strong>{new Date(payrollYear, payrollMonth - 1).toLocaleString('default', { month: 'long' })} {payrollYear}</strong>
            </div>
              <div className="summary-card" style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', minWidth: '140px' }}>
                <span>Total Payroll</span>
                <strong>UGX {payroll.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}</strong>
            </div>
              <div className="summary-card" style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', minWidth: '140px' }}>
                <span>Paid</span>
                <strong style={{ color: '#059669' }}>{payroll.filter(p => p.status === 'Paid').length}</strong>
            </div>
              <div className="summary-card" style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', minWidth: '140px' }}>
                <span>Pending</span>
                <strong style={{ color: '#d97706' }}>{payroll.filter(p => p.status === 'Pending').length}</strong>
            </div>
            </div>
            <div className="controls-container" style={{ margin: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={payrollMonth} onChange={e => setPayrollMonth(Number(e.target.value))} style={{ padding: '8px 12px' }}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>)}</select>
              <input type="number" value={payrollYear} onChange={e => setPayrollYear(Number(e.target.value))} style={{ width: '80px', padding: '8px 12px' }} />
              <button className="btn" onClick={() => void handleGeneratePayroll()} style={{ padding: '8px 12px' }}>Generate Payroll</button>
            </div>
            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Staff</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Month</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Year</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Basic</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Allowances</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Deductions</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Net Pay</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.length === 0 ? (
                      <tr style={{ height: '60px' }}>
                        <td colSpan={9} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No payroll records found.</td>
                      </tr
                    ) : (
                      payroll.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px' }}>{p.staffMemberId}</td>
                          <td style={{ padding: '12px 16px' }}>{p.month}</td>
                          <td style={{ padding: '12px 16px' }}>{p.year}</td>
                          <td style={{ padding: '12px 16px' }}>{p.basicSalary.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px' }}>{p.allowances.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px' }}>{p.deductions.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px' }}><strong>UGX {p.netPay.toLocaleString()}</strong></td>
                          <td style={{ padding: '12px 16px' }}><span className="badge" style={{ background: p.status === 'Paid' ? '#d1fae5' : '#fef3c7', color: p.status === 'Paid' ? '#065f46' : '#92400e' }}>{p.status}</span></td>
                          <td style={{ padding: '12px 16px' }}>{p.status === 'Pending' && <button className="secondary-button" onClick={() => void handleMarkPaid(p.id)}>Mark Paid</button>}</td>
                        </tr>
                      ))}
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'leave' && (
          <>
            {canManage && (
              <form className="grid-form" onSubmit={submitLeave} style={{ margin: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <input placeholder="Staff ID" value={leaveForm.staffMemberId} onChange={e => setLeaveForm({ ...leaveForm, staffMemberId: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <select value={leaveForm.leaveType} onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}><option>Annual</option><option>Sick</option><option>Maternity</option><option>Paternity</option><option>Study</option></select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <input placeholder="Start date" type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
                </div
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <input placeholder="End date" type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <input placeholder="Reason" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} required />
                </div>
                <button type="submit">Request Leave</button>
                <button type="button" className="secondary-button" onClick={() => void loadLeave()}>Load Leave</button>
              </form>
            )}
            <div className="table-container" style={{ flex: '1', minHeight: '0', margin: '16px' }}>
              <div className="table-wrap" style={{ flex: '1', minHeight: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Staff</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Start</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>End</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Reason</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.length === 0 ? (
                      <tr style={{ height: '60px' }}>
                        <td colSpan={7} className="empty" style={{ padding: '16px', textAlign: 'center' }}>No leave requests found.</td
                    ) : (
                      leaveRequests.map(lr => (
                        <tr key={lr.id} style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <td style={{ padding: '12px 16px' }}>{lr.staffMemberId}</td>
                          <td style={{ padding: '12px 16px' }}>{lr.leaveType}</td>
                          <td style={{ padding: '12px 16px' }}>{lr.startDate}</td>
                          <td style={{ padding: '12px 16px' }}>{lr.endDate}</td>
                          <td style={{ padding: '12px 16px' }}>{lr.reason}</td>
                          <td style={{ padding: '12px 16px' }}>{lr.status === 'Approved' && <span className="badge" style={{ background: lr.status === 'Approved' ? '#d1fae5' : lr.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: lr.status === 'Approved' ? '#065f46' : lr.status === 'Rejected' ? '#991b1b' : '#92400e' }}>{lr.status}</span></td>
                          <td style={{ padding: '12px 16px' }}>{lr.status === 'Pending' && canManage && <><button className="secondary-button" onClick={() => void approveLeaveRequest(lr.id, true)}>Approve</button><button className="secondary-button" onClick={() => void approveLeaveRequest(lr.id, false)}>Reject</button></>}</td>
                        </tr
                      ))}
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'recruitment' && (
          <div className="card" style={{ margin: '16px', padding: '16px' }}>
            <h3>Recruitment & Onboarding</h3>
            <p className="empty" style={{ textAlign: 'center', color: '#64748b' }}>
              Staff recruitment workflow will be available here. Post vacancies, receive applications, shortlist, interview, and onboard new staff.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}