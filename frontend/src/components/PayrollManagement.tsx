import { useEffect, useState } from 'react';
import { listPayroll, markPayrollPaid, updatePayrollAllowances, type PayrollRecord } from '../api/payroll';

export function PayrollManagement() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAllowances, setEditAllowances] = useState('');
  const [editDeductions, setEditDeductions] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try { setRecords(await listPayroll()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load payroll.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, []);

  async function markPaid(id: string) { try { await markPayrollPaid(id); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update payroll.') } }
  function startEdit(r: PayrollRecord) { setEditingId(r.id); setEditAllowances(String(r.allowances)); setEditDeductions(String(r.deductions)) }
  async function saveEdit(id: string) { try { await updatePayrollAllowances(id, Number(editAllowances), Number(editDeductions)); setEditingId(null); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update allowances.') } }

  return <section className="panel" aria-label="Payroll">
    <div className="panel-heading"><div><span className="eyebrow">HR</span><h2>Payroll Management</h2></div></div>
    {error && <div className="error" role="alert">{error}</div>}
    {loading ? <p className="empty">Loading payroll…</p> : <div className="table-wrap"><table><thead><tr><th>Staff</th><th>Period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Action</th></tr></thead><tbody>{records.map(r => <tr key={r.id}><td>{r.staffMemberId}</td><td>{r.month}/{r.year}</td><td>{r.basicSalary.toFixed(2)}</td>{editingId === r.id ? <><td><input type="number" value={editAllowances} onChange={e => setEditAllowances(e.target.value)} /></td><td><input type="number" value={editDeductions} onChange={e => setEditDeductions(e.target.value)} /></td><td>{(Number(editAllowances) - Number(editDeductions)).toFixed(2)}</td></> : <><td>{r.allowances.toFixed(2)}</td><td>{r.deductions.toFixed(2)}</td><td>{r.netPay.toFixed(2)}</td></>}<td>{r.status}</td><td>{r.status === 'Pending' && <button className="secondary-button" onClick={() => void markPaid(r.id)}>Mark Paid</button>}{editingId === r.id ? <><button onClick={() => void saveEdit(r.id)}>Save</button><button className="secondary-button" onClick={() => setEditingId(null)}>Cancel</button></> : <button className="secondary-button" onClick={() => startEdit(r)}>Edit</button>}</td></tr>)}</tbody></table></div>}
  </section>
}
