import { useEffect, useState } from 'react';
import { listPayroll, markPayrollPaid, type PayrollRecord } from '../api/payroll';

export function PayrollManagement() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try { setRecords(await listPayroll()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load payroll.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, []);

  async function markPaid(id: string) { try { await markPayrollPaid(id); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update payroll.') } }

  return <section className="panel" aria-label="Payroll">
    <div className="panel-heading"><div><span className="eyebrow">HR</span><h2>Payroll Management</h2></div></div>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading payroll…</p> : <div className="table-wrap"><table><thead><tr><th>Staff</th><th>Period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Action</th></tr></thead><tbody>{records.map(r => <tr key={r.id}><td>{r.staffMemberId}</td><td>{r.month}/{r.year}</td><td>{r.basicSalary.toFixed(2)}</td><td>{r.allowances.toFixed(2)}</td><td>{r.deductions.toFixed(2)}</td><td>{r.netPay.toFixed(2)}</td><td>{r.status}</td><td>{r.status === 'Pending' && <button className="secondary-button" onClick={() => void markPaid(r.id)}>Mark Paid</button>}</td></tr>)}</tbody></table></div>}
  </section>
}
