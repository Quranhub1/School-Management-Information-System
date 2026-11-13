import { useEffect, useState } from 'react'
import { searchPayments, getPaymentReceipt, type PaymentSearchResult, type FeeReceipt } from '../api/receipts'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useInstitutionSettings } from './InstitutionSettingsContext'

interface ReceiptsProps { canManage?: boolean }

export function Receipts({ canManage }: ReceiptsProps) {
  const [searchReceiptNumber, setSearchReceiptNumber] = useState('')
  const [searchPaymentMethod, setSearchPaymentMethod] = useState('')
  const [searchFrom, setSearchFrom] = useState('')
  const [searchTo, setSearchTo] = useState('')
  const [payments, setPayments] = useState<PaymentSearchResult[]>([])
  const [receipt, setReceipt] = useState<FeeReceipt | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { institution, loaded: institutionLoaded } = useInstitutionSettings()

  async function search() {
    setLoading(true)
    setError('')
    setReceipt(null)
    try {
      const data = await searchPayments(searchReceiptNumber || undefined, searchPaymentMethod || undefined, searchFrom || undefined, searchTo || undefined)
      setPayments(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to search payments.')
    } finally {
      setLoading(false)
    }
  }

  async function viewReceipt(paymentId: string) {
    setLoading(true)
    setError('')
    try {
      const data = await getPaymentReceipt(paymentId)
      setReceipt(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load receipt.')
    } finally {
      setLoading(false)
    }
  }

  function receiptPdfOptions() {
    if (!receipt) return null
    return {
      title: 'Official Fee Receipt',
      filename: 'receipt-' + receipt.receiptNumber + '.pdf',
      institutionName: institutionLoaded && institution.isActive ? institution.institutionName : undefined,
      motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
      contactLines: institutionLoaded && institution.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
      accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
      content: [
        { text: 'Receipt No: ' + receipt.receiptNumber, bold: true, fontSize: 12, margin: [0, 4, 0, 14] },
        { table: { widths: ['*', '*'], body: [
          [{ text: 'Invoice', bold: true }, receipt.invoiceNumber],
          [{ text: 'Amount paid', bold: true }, { text: receipt.currency + ' ' + receipt.amount.toLocaleString('en-UG'), bold: true }],
          [{ text: 'Payment method', bold: true }, receipt.paymentMethod],
          ...(receipt.reference ? [[{ text: 'Reference', bold: true }, receipt.reference]] : []),
          [{ text: 'Date paid', bold: true }, new Date(receipt.paidAt).toLocaleString('en-UG')],
        ] }, layout: 'lightHorizontalLines' },
        { text: 'Thank you for your payment.', alignment: 'center', margin: [0, 24, 0, 0], italics: true },
      ],
    }
  }

  function printReceipt() {
    const options = receiptPdfOptions()
    if (options) printInstitutionalPdf(options)
  }

  function downloadReceipt() {
    const options = receiptPdfOptions()
    if (options) downloadInstitutionalPdf(options)
  }

  return (
    <section className="panel" aria-label="Fee receipts">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">REPORTS</span>
          <h3>Fee Receipts</h3>
        </div>
        <button className="secondary-button" onClick={printReceipt} disabled={!receipt}>Print Receipt</button>
        <button className="secondary-button" onClick={downloadReceipt} disabled={!receipt}>Download PDF</button>
      </div>

      <form className="student-form" onSubmit={e => { e.preventDefault(); void search() }} style={{ marginBottom: 22 }}>
        <div className="form-row">
          <label>Receipt Number<input value={searchReceiptNumber} onChange={e => setSearchReceiptNumber(e.target.value)} placeholder="Search receipt number" /></label>
          <label>
            Payment Method
            <select value={searchPaymentMethod} onChange={e => setSearchPaymentMethod(e.target.value)}>
              <option value="">All</option>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Card">Card</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>From<input type="date" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} /></label>
          <label>To<input type="date" value={searchTo} onChange={e => setSearchTo(e.target.value)} /></label>
          <button type="submit" disabled={loading}>{loading ? <><span className="spinner spinner--small" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index} />)}</span> Searching…</> : 'Search'}</button>
        </div>
      </form>

      {error && <div className="error" role="alert">{error}</div>}

      {!receipt && payments.length > 0 && (
        <div className="table-wrap" style={{ marginBottom: 22 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Student</th>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.receiptNumber}</strong></td>
                  <td>{p.studentName}</td>
                  <td>{p.invoiceNumber}</td>
                  <td style={{ color: '#059669', fontWeight: 700 }}>{formatCurrency(p.amount, p.currency ?? SYSTEM_CURRENCY)}</td>
                  <td>{p.paymentMethod}</td>
                  <td>{new Date(p.paidAt).toLocaleDateString('en-UG')}</td>
                  <td><button className="secondary-button" onClick={() => viewReceipt(p.id)}>View Receipt</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      {!receipt && !loading && payments.length === 0 && (
        <p className="empty">Search for payments to view and reprint receipts.</p>
      )}
    </section>
  )
}
