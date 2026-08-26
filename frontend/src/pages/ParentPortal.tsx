import { useEffect, useState } from 'react';
import { listStaff, type StaffMember } from '../api/staff';
import { listNotices, type Notice } from '../api/notices';
import { listPayroll, type PayrollRecord } from '../api/payroll';

export function ParentPortal() {
  const [children, setChildren] = useState<StaffMember[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [payments, setPayments] = useState<PayrollRecord[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [staffData, noticesData, payrollData] = await Promise.all([listStaff(false), listNotices(), listPayroll()]);
      setChildren(staffData.filter(s => s.employmentType === 'Student').slice(0, 5));
      setNotices(noticesData.slice(0, 5));
      setPayments(payrollData.slice(0, 5));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load portal data.') }
  }
  useEffect(() => { void load() }, []);

  return <section className="panel" aria-label="Parent Portal">
    <div className="panel-heading"><div><span className="eyebrow">PARENT</span><h2>Parent Portal</h2></div></div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="summary-grid">
      <div className="summary-card"><span>Children</span><strong>{children.length}</strong><small>Enrolled students</small></div>
      <div className="summary-card"><span>Fees Balance</span><strong>0.00</strong><small>Up to date</small></div>
      <div className="summary-card"><span>Notices</span><strong>{notices.length}</strong><small>New this week</small></div>
    </div>
    <h3 style={{ margin: '22px 0 10px' }}>Recent Notices</h3>
    <div className="table-wrap"><table><thead><tr><th>Title</th><th>Priority</th><th>Audience</th></tr></thead><tbody>{notices.map(n => <tr key={n.id}><td>{n.title}</td><td>{n.priority}</td><td>{n.audience}</td></tr>)}</tbody></table></div>
  </section>
}
