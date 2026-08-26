import { useEffect, useState } from 'react'
import { getPaymentReceipt, type FeeReceipt } from '../api/reports'

interface ReceiptsProps { canManage: boolean }

export function Receipts({ canManage }: ReceiptsProps) {
  const [paymentId, setPaymentId] = useState('')
  const [receipt, setReceipt] = useState<FeeReceipt | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    if (!paymentId.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await getPaymentReceipt(paymentId.trim())
      setReceipt(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load receipt.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (paymentId.trim()) void load()
  }, [paymentId])

  function printReceipt() {
    window.print()
  }

  return (
    <section className="panel" aria-label="Fee receipts">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">REPORTS</span>
          <h3>Fee Receipts</h3>
        </div>
        <button className="secondary-button" onClick={printReceipt} disabled={!receipt}>Print Receipt</button>
      </div>

      <form className="student-form" onSubmit={e => { e.preventDefault(); void load() }} style={{ marginBottom: 22 }}>
        <div className="form-row">
          <label>Payment ID<input value={paymentId} onChange={e => setPaymentId(e.target.value)} placeholder="Enter payment ID" required /></label>
          <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Generate'}</button>
        </div>
      </form>

      {error && <div className="error" role="alert">{error}</div>}

      {receipt && (
        <div className="receipt" id="receipt-print">
          <div className="receipt-header">
            <h4>Official Receipt</h4>
            <p>Receipt No: {receipt.receiptNumber}</p>
          </div>
          <div className="receipt-body">
            <div className="receipt-row">
              <span>Invoice:</span>
              <strong>{receipt.invoiceNumber}</strong>
            </div>
            <div className="receipt-row">
              <span>Amount Paid:</span>
              <strong>{receipt.currency} {receipt.amount.toLocaleString()}</strong>
            </div>
            <div className="receipt-row">
              <span>Method:</span>
              <span>{receipt.paymentMethod}</span>
            </div>
            {receipt.reference && (
              <div className="receipt-row">
                <span>Reference:</span>
                <span>{receipt.reference}</span>
              </div>
            )}
            <div className="receipt-row">
              <span>Date:</span>
              <span>{new Date(receipt.paidAt).toLocaleString('en-UG')}</span>
            </div>
          </div>
        </div>
      )}

      {!receipt && !loading && (
        <p className="empty">Enter a payment ID to generate a receipt.</p>
      )}
    </section>
  )
}
