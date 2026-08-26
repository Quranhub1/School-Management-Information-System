import { useState, useEffect } from 'react';
import { createMobileMoneyTransaction, confirmMobileMoneyTransaction, getMobileMoneyTransactions, type MobileMoneyTransaction } from '../api/finance';

interface StudentSearchResult {
  studentId: string;
  studentName: string;
}

interface Invoice {
  id: string;
  description: string;
  amount: number;
}

export default function MobileMoneyPayments() {
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState<'MTN' | 'Airtel'>('MTN');
  const [amount, setAmount] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [transactions, setTransactions] = useState<MobileMoneyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<MobileMoneyTransaction | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [externalRef, setExternalRef] = useState('');
  const [showSchoolPayMsg, setShowSchoolPayMsg] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);

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
    if (!code.trim()) {
      setStudentName('');
      return;
    }
    try {
      const res = await fetch(`/api/finance/students/search?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data: StudentSearchResult = await res.json();
        setStudentName(data.studentName);
      } else {
        setStudentName('');
      }
    } catch {
      setStudentName('');
    }
  };

  const loadInvoices = async (studentId: string) => {
    try {
      const res = await fetch(`/api/finance/students/${studentId}/invoices`);
      if (res.ok) {
        const data: Invoice[] = await res.json();
        setInvoices(data);
      }
    } catch {
      setInvoices([]);
    }
  };

  const handleRequestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode || !phoneNumber || !amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      const tx = await createMobileMoneyTransaction({
        studentId: studentCode,
        studentInvoiceId: selectedInvoice || undefined,
        provider,
        phoneNumber,
        amount: parseFloat(amount),
      });
      setSubmitted(tx);
      setShowConfirm(false);
      setExternalRef('');
      await loadTransactions();
    } catch (err) {
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string, ref: string) => {
    try {
      await confirmMobileMoneyTransaction(id, ref);
      await loadTransactions();
      setSubmitted(null);
      setShowConfirm(false);
      setExternalRef('');
    } catch (err) {
      alert('Failed to confirm transaction.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await fetch(`/api/finance/mobile-money/${id}`, { method: 'DELETE' });
      await loadTransactions();
      if (submitted && submitted.id === id) {
        setSubmitted(null);
        setShowConfirm(false);
        setExternalRef('');
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
          <h3 style={{ marginTop: 0, color: '#166534' }}>Transaction Initiated</h3>
          <p><strong>Reference:</strong> {submitted.transactionRef}</p>
          <p><strong>Student:</strong> {submitted.studentId}</p>
          <p><strong>Amount:</strong> {formatAmount(submitted.amount)}</p>
          <p><strong>Provider:</strong> {submitted.provider} Mobile Money</p>
          <p><strong>Phone:</strong> {submitted.phoneNumber}</p>
          <p style={{ fontWeight: 600, color: '#166534' }}>Waiting for confirmation...</p>

          {!showConfirm ? (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="secondary-button" onClick={() => setShowConfirm(true)}>
                Confirm Received
              </button>
              <button className="secondary-button" onClick={() => handleCancel(submitted.id)}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Enter External Transaction Reference"
                  value={externalRef}
                  onChange={(e) => setExternalRef(e.target.value)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
                />
                <button
                  className="secondary-button"
                  onClick={() => handleConfirm(submitted.id, externalRef)}
                  disabled={!externalRef.trim()}
                >
                  Submit Confirmation
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-heading">
          <h3>New Mobile Money Payment</h3>
        </div>
        <form onSubmit={handleRequestPayment}>
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Student ID / Code</label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => handleStudentSearch(e.target.value)}
                placeholder="Enter student code"
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
              />
            </div>
            <div style={{ flex: 2, marginLeft: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Student Name</label>
              <input
                type="text"
                value={studentName}
                readOnly
                placeholder="Student name will appear here"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', background: '#f9fafb' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="2567XXXXXXXX"
                required
                pattern="^256[0-9]{9}$"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
              />
            </div>
            <div style={{ flex: 1, marginLeft: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'MTN' | 'Airtel')}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
              >
                <option value="MTN">MTN Mobile Money</option>
                <option value="Airtel">Airtel Money</option>
              </select>
            </div>
            <div style={{ flex: 1, marginLeft: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Amount (UGX)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Select Invoice (Optional)</label>
              <select
                value={selectedInvoice}
                onChange={(e) => setSelectedInvoice(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
              >
                <option value="">No invoice selected</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.description} - {formatAmount(inv.amount)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="secondary-button" disabled={loading || !studentCode || !amount}>
              {loading ? 'Processing...' : 'Request Payment'}
            </button>
          </div>
        </form>
      </div>

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
                      <button className="secondary-button" onClick={() => { setSubmitted(tx); setShowConfirm(true); }}>
                        Confirm
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

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-heading">
          <h3>SchoolPay Integration (Placeholder)</h3>
        </div>
        <div style={{ padding: '20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>
          <p style={{ marginTop: 0, fontWeight: 600, color: '#92400e' }}>This section is a placeholder for SchoolPay API integration.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              className="secondary-button"
              onClick={() => setShowSchoolPayMsg('SchoolPay integration is not configured. Contact your system administrator to set up SchoolPay API credentials.')}
            >
              Configure SchoolPay
            </button>
            <button
              className="secondary-button"
              onClick={() => setShowSchoolPayMsg('SchoolPay sync is not available. This feature will be enabled when SchoolPay is configured.')}
            >
              Sync with SchoolPay
            </button>
          </div>
          {showSchoolPayMsg && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e' }}>
              {showSchoolPayMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
