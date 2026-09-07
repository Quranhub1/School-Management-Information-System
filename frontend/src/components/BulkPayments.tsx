import { useEffect, useState, type FormEvent } from 'react'
import { createBulkPayment, getOutstandingBalances, type OutstandingBalance } from '../api/finance'

type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank' | 'Card'

interface StudentRow extends OutstandingBalance {
  selected: boolean
  amountToPay: string
  receiptNumber: string
}

const MOCK_STUDENTS: OutstandingBalance[] = [
  { studentId: 'STU-2024-001', studentNumber: 'STU-2024-001', studentName: 'Amina Nalubega', programmeName: 'Bachelor of Science in Computer Science', amount: 850000, paidAmount: 0, balance: 850000, currency: 'UGX', status: 'Outstanding' },
  { studentId: 'STU-2024-002', studentNumber: 'STU-2024-002', studentName: 'Brian Okello', programmeName: 'Bachelor of Business Administration', amount: 620000, paidAmount: 0, balance: 620000, currency: 'UGX', status: 'Outstanding' },
  { studentId: 'STU-2024-003', studentNumber: 'STU-2024-003', studentName: 'Catherine Nakamya', programmeName: 'Bachelor of Education', amount: 410000, paidAmount: 0, balance: 410000, currency: 'UGX', status: 'Partial' },
  { studentId: 'STU-2024-004', studentNumber: 'STU-2024-004', studentName: 'David Ssentongo', programmeName: 'Bachelor of Science in Computer Science', amount: 950000, paidAmount: 0, balance: 950000, currency: 'UGX', status: 'Outstanding' },
  { studentId: 'STU-2024-005', studentNumber: 'STU-2024-005', studentName: 'Esther Namuli', programmeName: 'Bachelor of Nursing', amount: 730000, paidAmount: 0, balance: 730000, currency: 'UGX', status: 'Outstanding' },
]

export function BulkPayments() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [receiptCounter, setReceiptCounter] = useState(1)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getOutstandingBalances()
        const rows: StudentRow[] = data.map(item => ({
          ...item,
          selected: false,
          amountToPay: '',
          receiptNumber: `BLK-${String(receiptCounter).padStart(3, '0')}`,
        }))
        setStudents(rows)
        setReceiptCounter(prev => prev + rows.length)
      } catch (e) {
        const fallback: StudentRow[] = MOCK_STUDENTS.map(item => ({
          ...item,
          selected: false,
          amountToPay: '',
          receiptNumber: `BLK-${String(receiptCounter).padStart(3, '0')}`,
        }))
        setStudents(fallback)
        setReceiptCounter(prev => prev + fallback.length)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  function toggleSelect(studentId: string) {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, selected: !s.selected } : s))
  }

  function handleAmountChange(studentId: string, value: string) {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, amountToPay: value } : s))
  }

  function handleReceiptChange(studentId: string, value: string) {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, receiptNumber: value } : s))
  }

  function payAllOutstanding() {
    setStudents(prev => prev.map(s => ({ ...s, selected: true, amountToPay: String(s.balance), receiptNumber: s.receiptNumber || `BLK-${String(receiptCounter).padStart(3, '0')}` })))
  }

  const selectedStudents = students.filter(s => s.selected)
  const totalToCollect = selectedStudents.reduce((sum, s) => sum + (Number(s.amountToPay) || 0), 0)

  async function submitBulkPayment(event: FormEvent) {
    event.preventDefault()
    if (selectedStudents.length === 0) {
      setError('Select at least one student to record payment.')
      return
    }
    const invalid = selectedStudents.find(s => !s.amountToPay || Number(s.amountToPay) <= 0)
    if (invalid) {
      setError('Enter a valid amount for all selected students.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payments = selectedStudents.map(s => ({
        studentId: s.studentId,
        invoiceId: '',
        amount: Number(s.amountToPay),
        receiptNumber: s.receiptNumber.trim(),
        paymentMethod,
        reference: reference.trim() || undefined,
      }))
      const result = await createBulkPayment({ payments })
      setSuccess(`Bulk payment recorded successfully for ${selectedStudents.length} student(s).`)
      setStudents(prev => prev.map(s => {
        if (!s.selected) return s
        return { ...s, selected: false, amountToPay: '', receiptNumber: `BLK-${String(receiptCounter).padStart(3, '0')}` }
      }))
      setReference('')
      setReceiptCounter(prev => prev + selectedStudents.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to record bulk payment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel" aria-label="Bulk payments">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FINANCE</span>
          <h2>Bulk Payment Entry</h2>
        </div>
        <div className="topbar-actions">
          <button type="button" className="secondary-button" onClick={payAllOutstanding} disabled={loading || students.length === 0}>Pay All Outstanding</button>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="summary-card" style={{ margin: '16px 0', padding: '14px', background: '#f0fdf4', borderColor: '#bbf7d0' }} role="status">{success}</div>}

      <form onSubmit={submitBulkPayment}>
        <div className="form-row" style={{ marginBottom: 18 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#44403c' }}>Payment Method</span>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
              <option>Cash</option>
              <option>Mobile Money</option>
              <option>Bank</option>
              <option>Card</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#44403c' }}>Date</span>
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 2 }}>
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#44403c' }}>Reference / Description</span>
            <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g., Semester 1 fee bulk collection" />
          </label>
        </div>

        {loading ? (
          <p className="empty">Loading students with outstanding balances…</p>
        ) : students.length === 0 ? (
          <p className="empty">No students with outstanding balances found.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><input type="checkbox" checked={selectedStudents.length === students.length && students.length > 0} onChange={e => setStudents(prev => prev.map(s => ({ ...s, selected: e.target.checked })))} /></th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Programme</th>
                    <th>Balance (UGX)</th>
                    <th>Amount to Pay</th>
                    <th>Receipt Number</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.studentId}>
                      <td><input type="checkbox" checked={student.selected} onChange={() => toggleSelect(student.studentId)} /></td>
                      <td><strong>{student.studentNumber}</strong></td>
                      <td>{student.studentName}</td>
                      <td>{student.programmeName}</td>
                      <td style={{ color: student.balance > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>UGX {student.balance.toLocaleString()}</td>
                      <td><input type="number" min="0" max={student.balance} step="1" value={student.amountToPay} onChange={e => handleAmountChange(student.studentId, e.target.value)} placeholder="0" disabled={!student.selected} /></td>
                      <td><input value={student.receiptNumber} onChange={e => handleReceiptChange(student.studentId, e.target.value)} disabled={!student.selected} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="summary-grid" style={{ marginTop: 22 }}>
              <div className="summary-card">
                <span>Total Students Selected</span>
                <strong>{selectedStudents.length}</strong>
              </div>
              <div className="summary-card">
                <span>Total Amount to Collect</span>
                <strong style={{ color: totalToCollect > 0 ? '#1c1917' : '#78716c' }}>UGX {totalToCollect.toLocaleString()}</strong>
              </div>
            </div>

            <div className="topbar-actions" style={{ marginTop: 18 }}>
              <button type="submit" disabled={submitting || selectedStudents.length === 0}>
                {submitting ? 'Recording…' : 'Record Bulk Payment'}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  )
}
