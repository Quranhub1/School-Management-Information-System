import { useState, useEffect, useRef } from 'react';
import { cancelMobileMoneyTransaction, getMobileMoneyTransactions, getStudentFinanceProfile, getInvoices, type MobileMoneyTransaction } from '../api/finance';

interface Invoice {
  id: string;
  description: string;
  amount: number;
}

export default function MobileMoneyPayments() {
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState<'MTN' | 'Airtel'>('MTN');
  const [amount, setAmount] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [transactions, setTransactions] = useState<MobileMoneyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<MobileMoneyTransaction | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const studentSearchSequence = useRef(0);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const pending = await getMobileMoneyTransactions('Pending');
      const completed = await getMobileMoneyTransactions('Completed');
      const sorted = [...completed].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      const last20 = sorted.slice(0, 20);
      setTransactions([...pending, ...last20]);
    } catch (e) {
      setTransactions([]);
    }
  };

  const handleStudentSearch = async (code: string) => {
    setStudentCode(code);
    const sequence = ++studentSearchSequence.current;
    setStudentId('');
    setStudentName('');
    setInvoices([]);
    setSelectedInvoice('');
    if (!code.trim()) return;

    try {
      const student = await getStudentFinanceProfile(code.trim());
      if (sequence !== studentSearchSequence.current) return;
      setStudentId(student.id);
      setStudentName(student.name);
      const invoiceRows = await getInvoices(student.id);
      if (sequence !== studentSearchSequence.current) return;
      setInvoices(invoiceRows.map(invoice => ({
        id: invoice.id,
        description: invoice.invoiceNumber + ' · ' + invoice.feeType,
        amount: invoice.balance
      })));
    } catch {
      if (sequence !== studentSearchSequence.current) return;
      setStudentId('');
      setStudentName('');
      setInvoices([]);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMobileMoneyTransaction(id);
      await loadTransactions();
      if (submitted && submitted.id === id) {
        setSubmitted(null);
      }
    } catch {
      alert('Failed to cancel transaction.');
    }
  };

  const formatAmount = (val: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(val);

  const pendingTransactions = transactions.filter((t) => t.status === 'Pending');
  const completedTransactions = transactions.filter((t) => t.status === 'Completed');

  return (
    <div className="panel">
      <div className="panel-heading">
        <h2>Mobile Money Payments</h2>
      </div>

      <div className="summary-grid" style={{ marginBottom: '24px' }}>
        <div className="summary-card">
          <div className="summary-label">Pending Transactions</div>
          <div className="summary-value">{pendingTransactions.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Completed Transactions</div>
          <div className="summary-value">{completedTransactions.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Completed (UGX)</div>
          <div className="summary-value">{formatAmount(completedTransactions.reduce((sum, t) => sum + t.amount, 0))}</div>
        </div>
      </div>

      {submitted && (
        <div className="panel" style={{ marginBottom: '24px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ marginTop: 0, color: '#166534' }}>Payment Awaiting Verification</h3>
          <p><strong>Reference:</strong> {submitted.transactionRef}</p>
          <p><strong>Student:</strong> {submitted.studentId}</p>
          <p><strong>Amount:</strong> {formatAmount(submitted.amount)}</p>
          <p><strong>Provider:</strong> {submitted.provider} Mobile Money</p>
          <p><strong>Phone:</strong> {submitted.phoneNumber}</p>
          <p style={{ fontWeight: 600, color: '#92400e' }}>No MTN/Airtel payment prompt has been sent. Verify receipt in the operator portal before confirming here.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="secondary-button" onClick={() => handleCancel(submitted.id)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-heading">
          <h3>Pending Transactions</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction Ref</th>
                <th>Student ID</th>
                <th>Provider</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    No pending transactions
                  </td>
                </tr>
              ) : (
                pendingTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.transactionRef}</td>
                    <td>{tx.studentId}</td>
                    <td>{tx.provider} Mobile Money</td>
                    <td>{formatAmount(tx.amount)}</td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e' }}>
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <button className="secondary-button" onClick={() => { setSubmitted(tx); }}>
                        Verify
                      </button>
                      <button className="secondary-button" onClick={() => handleCancel(tx.id)} style={{ marginLeft: '8px' }}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-heading">
          <h3>Completed Transactions (Last 20)</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction Ref</th>
                <th>Student ID</th>
                <th>Provider</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {completedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    No completed transactions
                  </td>
                </tr>
              ) : (
                completedTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.transactionRef}</td>
                    <td>{tx.studentId}</td>
                    <td>{tx.provider} Mobile Money</td>
                    <td>{formatAmount(tx.amount)}</td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#d1fae5', color: '#065f46' }}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{new Date(tx.requestedAt).toLocaleDateString('en-UG')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="finance-muted">Manual verification only. Automatic MTN/Airtel STK prompts, callbacks and API synchronization are not connected. Direct MTN/Airtel initiation and staff-entered confirmation are disabled on the server — use SchoolPay for provider payments or record a Manual payment instead.</p>
    </div>
  );
}
