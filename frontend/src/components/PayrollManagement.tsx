import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { listPayroll, markPayrollPaid, updatePayrollAllowances, type PayrollRecord } from '../api/payroll';
import './PayrollManagement.css';

const money = (amount: number) => `UGX ${amount.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
const periodLabel = (month: number, year: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-UG', { month: 'short', year: 'numeric' });
const payrollCode = (id: string) => `PAY-${id.replace(/-/g, '').toUpperCase()}`;

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
    try { setRecords(await listPayroll()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load payroll.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function markPaid(id: string) {
    try { await markPayrollPaid(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update payroll.'); }
  }
  function startEdit(record: PayrollRecord) {
    setEditingId(record.id);
    setEditAllowances(String(record.allowances));
    setEditDeductions(String(record.deductions));
  }
  async function saveEdit(id: string) {
    const allowances = Number(editAllowances);
    const deductions = Number(editDeductions);
    if (!Number.isFinite(allowances) || !Number.isFinite(deductions) || allowances < 0 || deductions < 0) {
      setError('Allowances and deductions must be valid non-negative amounts.');
      return;
    }
    try {
      await updatePayrollAllowances(id, allowances, deductions);
      setEditingId(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update allowances.'); }
  }

  const pendingCount = records.filter(record => record.status.toLowerCase() === 'pending').length;
  const totalNetPay = records.reduce((sum, record) => sum + record.netPay, 0);
  const totalPaid = records.filter(record => record.status.toLowerCase() === 'paid')
    .reduce((sum, record) => sum + record.netPay, 0);

  return <section className="panel payroll-panel" aria-label="Payroll">
    <div className="payroll-heading">
      <div>
        <span className="eyebrow">HUMAN RESOURCES</span>
        <h2>Payroll</h2>
        <p>Review salary records, manage deductions and track payment status.</p>
      </div>
      <button className="payroll-refresh" type="button" onClick={() => void load()} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh records'}
      </button>
    </div>

    {error && <div className="error payroll-error" role="alert">{error}</div>}

    {!loading && <div className="payroll-summary" aria-label="Payroll summary">
      <div className="payroll-stat"><span>Payroll records</span><strong>{records.length.toLocaleString('en-UG')}</strong></div>
      <div className="payroll-stat"><span>Awaiting payment</span><strong>{pendingCount.toLocaleString('en-UG')}</strong></div>
      <div className="payroll-stat"><span>Total net payroll</span><strong>{money(totalNetPay)}</strong></div>
      <div className="payroll-stat"><span>Total paid</span><strong>{money(totalPaid)}</strong></div>
    </div>}

    {loading ? <div className="payroll-loading"><LoadingSpinner label="Loading payroll…" /></div> : <div className="payroll-table-wrap">
      <table className="payroll-table">
        <thead><tr>
          <th className="payroll-number-col">No.</th>
          <th>Payroll ID</th>
          <th>Staff member ID</th>
          <th>Pay period</th>
          <th className="payroll-amount">Basic salary</th>
          <th className="payroll-amount">Allowances</th>
          <th className="payroll-amount">Deductions</th>
          <th className="payroll-amount">Net pay</th>
          <th>Status</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          {records.map((record, index) => {
            const isEditing = editingId === record.id;
            const netPay = record.basicSalary + Number(editAllowances) - Number(editDeductions);
            const status = record.status || 'Pending';
            return <tr key={record.id}>
              <td className="payroll-row-number">{(index + 1).toString().padStart(2, '0')}</td>
              <td><span className="payroll-code" title={record.id}>{payrollCode(record.id)}</span></td>
              <td className="payroll-staff-id">{record.staffMemberId}</td>
              <td>{periodLabel(record.month, record.year)}</td>
              <td className="payroll-amount">{money(record.basicSalary)}</td>
              {isEditing ? <>
                <td><input className="payroll-edit-input" aria-label="Allowances" type="number" min="0" step="1" value={editAllowances} onChange={event => setEditAllowances(event.target.value)} /></td>
                <td><input className="payroll-edit-input" aria-label="Deductions" type="number" min="0" step="1" value={editDeductions} onChange={event => setEditDeductions(event.target.value)} /></td>
                <td className="payroll-amount payroll-net-pay">{money(Number.isFinite(netPay) ? netPay : record.netPay)}</td>
              </> : <>
                <td className="payroll-amount">{money(record.allowances)}</td>
                <td className="payroll-amount">{money(record.deductions)}</td>
                <td className="payroll-amount payroll-net-pay">{money(record.netPay)}</td>
              </>}
              <td><span className={`payroll-status payroll-status--${status.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{status}</span></td>
              <td><div className="payroll-actions">
                {isEditing ? <>
                  <button type="button" className="payroll-action payroll-action--save" onClick={() => void saveEdit(record.id)}>Save</button>
                  <button type="button" className="payroll-action payroll-action--cancel" onClick={() => setEditingId(null)}>Cancel</button>
                </> : <>
                  {status.toLowerCase() === 'pending' && <button type="button" className="payroll-action payroll-action--paid" onClick={() => void markPaid(record.id)}>Mark paid</button>}
                  <button type="button" className="payroll-action payroll-action--edit" onClick={() => startEdit(record)}>Edit</button>
                </>}
              </div></td>
            </tr>;
          })}
        </tbody>
      </table>
      {records.length === 0 && <div className="payroll-empty"><strong>No payroll records yet</strong><span>Generate payroll for a month to see staff salary records here.</span></div>}
    </div>}
  </section>;
}
