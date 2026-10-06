import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  getDashboard,
  getOutstandingBalances,
  getInvoices,
  getPayments,
  recordPayment,
  type FinanceDashboard,
  type Invoice,
  type OutstandingBalance,
} from '../api/finance'
import { 
  Panel,
  PanelHeader,
  PanelContent,
  Tabs,
  Tab,
  TabList,
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  Badge,
  Form,
  FormField,
  FormLabel,
  FormControl,
  Alert,
  EmptyState,
  EmptyStateTitle,
  EmptyStateDescription
} from '@/components/ui'

type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank' | 'Card'

interface QuickPayState {
  studentId: string
  invoices: Invoice[]
  studentName: string
}

interface PaymentModalState {
  invoiceId: string
  amount: string
  receiptNumber: string
  paymentMethod: PaymentMethod
}

type PaymentRecord = {
  id: string
  receiptNumber: string
  amount: number
  paymentMethod: string
  paidAt: string
}

export function FinanceDashboard() {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null)
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalance[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [quickPaySearch, setQuickPaySearch] = useState('')
  const [quickPayResult, setQuickPayResult] = useState<QuickPayState | null>(null)
  const [quickPayLoading, setQuickPayLoading] = useState(false)

  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null)
  const [paying, setPaying] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [dash, outstanding, recentPayments] = await Promise.all([
        getDashboard(),
        getOutstandingBalances(),
        getPayments(),
      ])
      setDashboard(dash)
      setOutstandingBalances(outstanding)
      setPayments(recentPayments)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load finance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  async function handleQuickPaySearch(e: FormEvent) {
    e.preventDefault()
    setQuickPayLoading(true)
    setError('')
    try {
      const studentId = quickPaySearch.trim()
      if (!studentId) return
      const invoices = await getInvoices(studentId)
      const student = outstandingBalances.find(o => o.studentId === studentId)
      setQuickPayResult({
        studentId,
        invoices,
        studentName: student?.studentName || studentId,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to search student.')
    } finally {
      setQuickPayLoading(false)
    }
  }

  function openPaymentModal() {
    if (!quickPayResult || quickPayResult.invoices.length === 0) return
    const firstOutstanding = quickPayResult.invoices.find(inv => inv.balance > 0)
    setPaymentModal({
      invoiceId: firstOutstanding ? firstOutstanding.id : quickPayResult.invoices[0].id,
      amount: '',
      receiptNumber: '',
      paymentMethod: 'Cash',
    })
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault()
    if (!paymentModal) return
    setPaying(true)
    try {
      await recordPayment(paymentModal.invoiceId, {
        amount: Number(paymentModal.amount),
        receiptNumber: paymentModal.receiptNumber.trim(),
        paymentMethod: paymentModal.paymentMethod,
        currency: 'UGX',
      })
      setPaymentModal(null)
      setQuickPayResult(null)
      setQuickPaySearch('')
      void loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to record payment.')
    } finally {
      setPaying(false)
    }
  }

  function exportOutstandingCSV() {
    const headers = ['Student Number', 'Name', 'Programme', 'Balance (UGX)', 'Status']
    const rows = outstandingBalances.map(o => [
      o.studentNumber,
      o.studentName,
      o.programmeName,
      o.balance.toLocaleString(),
      o.status,
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'outstanding_balances.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const paymentMethodTotals = payments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount
    return acc
  }, {})

  const recentPayments = payments.slice(0, 10)

  return (
    <Panel>
      <PanelHeader>
        <div>
          <span className="eyebrow">FINANCE</span>
          <h2>Finance Dashboard</h2>
        </div>
        <Button variant="secondary" onClick={() => void loadAll()}>
          Refresh
        </Button>
      </PanelHeader>

      {error && <div className="alert alert-destructive mt-4" role="alert">{error}</div>}

      {loading ? (
        <PanelContent className="mt-4">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading dashboard…</p>
          </div>
        </PanelContent>
      ) : dashboard && (
        <>
          <PanelContent className="mt-4">
            <div className="grid gap-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Billed</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold">UGX {dashboard.totalBilled.toLocaleString()}</div>
                    <p className="text-muted-foreground">Total Charges</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Paid</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-success">
                    <div className="text-2xl font-bold">UGX {dashboard.totalPaid.toLocaleString()}</div>
                    <p className="text-muted-foreground">Total Received</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Outstanding Balance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center {dashboard.totalOutstanding > 0 ? 'text-destructive' : 'text-success'}">
                    <div className="text-2xl font-bold">UGX {dashboard.totalOutstanding.toLocaleString()}</div>
                    <p className="text-muted-foreground">Balance Due</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Collection</CardTitle>
                  </CardHeader
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold">UGX {dashboard.todayCollection.toLocaleString()}</div>
                    <p className="text-muted-foreground">Daily Revenue</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Count</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold>{dashboard.invoiceCount}</div>
                    <p className="text-muted-foreground">Documents Issued</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Count</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold>{dashboard.paymentCount}</div>
                    <p className="text-muted-foreground">Transactions Processed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Outstanding Invoices Count</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold>{dashboard.outstandingCount}</div>
                    <p className="text-muted-foreground">Unpaid Documents</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </PanelContent>

          <PanelContent className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Pay</h3>
              <Form className="space-y-4" onSubmit={handleQuickPaySearch}>
                <FormField>
                  <FormLabel htmlFor="quick-pay-search">Student ID or code</FormLabel>
                  <FormControl>
                    <Input 
                      id="quick-pay-search"
                      placeholder="Enter student ID or code"
                      value={quickPaySearch}
                      onChange={e => setQuickPaySearch(e.target.value)}
                    />
                  </FormControl>
                </FormField>
                <FormField>
                  <Button 
                    type="submit" 
                    variant="default"
                    disabled={quickPayLoading}>
                    {quickPayLoading ? 'Searching…' : 'Search'}
                  </Button>
                </FormField>
              </Form>

              {quickPayResult && (
                <div className="mt-6">
                  <div className="grid gap-4 mb-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Student</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="text-xl font-bold">{quickPayResult.studentName}</div>
                        <p className="text-muted-foreground">Selected Student</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Balance</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center {quickPayResult.invoices.reduce((sum, inv) => sum + inv.balance, 0) > 0 ? 'text-destructive' : 'text-success'}">
                        <div className="text-2xl font-bold">
                          UGX {quickPayResult.invoices.reduce((sum, inv) => sum + inv.balance, 0).toLocaleString()}
                        </div>
                        <p className="text-muted-foreground">Amount Due</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Action</CardTitle>
                      </CardHeader>
                      <CardContent className="flex justify-center">
                        <Button 
                          variant="default"
                          onClick={openPaymentModal}
                          disabled={quickPayResult.invoices.length === 0}>
                            Pay Now
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </PanelContent>

          <PanelContent className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Outstanding Balances</h3>
              <div className="flex items-center justify-between mb-3">
                <Button variant="secondary" onClick={exportOutstandingCSV}>
                  Export to CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-4 text-center text-muted-foreground">
                          No outstanding balances.
                        </TableCell>
                      </TableRow>
                    ) : (
                      outstandingBalances.map((item, index) => (
                        <TableRow key={`${item.studentId}-${index}`}>
                          <TableCell>{item.studentNumber}</TableCell>
                          <TableCell>{item.studentName}</TableCell>
                          <TableCell>{item.programmeName}</TableCell>
                          <TableCell className="text-destructive font-semibold">
                            {item.currency} {item.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>{item.status}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </PanelContent>

          <PanelContent className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Payments</h3>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                          No payments recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPayments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.receiptNumber}</TableCell>
                          <TableCell className="text-success font-semibold">
                            UGX {payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>{new Date(payment.paidAt).toLocaleDateString('en-UG')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </PanelContent>

          <PanelContent className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Payment by Method</h3>
              <div className="grid gap-4">
                {(Object.keys(paymentMethodTotals) as PaymentMethod[]).map(method => (
                  <Card key={method} className="text-center">
                    <CardHeader>
                      <CardTitle>{method}</CardTitle>
                    </CardHeader>
                    <CardContent className="{method === 'Cash' ? 'text-primary' : method === 'Bank' ? 'text-secondary' : method === 'Mobile Money' ? 'text-warning' : 'text-destructive'}">
                      <div className="text-2xl font-bold">UGX {(paymentMethodTotals[method] || 0).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </PanelContent>
        </>

        {paymentModal && quickPayResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Form className="w-full max-w-md space-y-4 p-4 bg-white rounded-xl shadow-lg" onSubmit={submitPayment}>
              <div className="flex justify-between items-start">
                <p className="eyebrow self-start">Payment</p>
                <Button variant="outline" size="sm" onClick={() => setPaymentModal(null)}>
                  ×
                </Button>
              </div>
              <h3 className="text-xl font-bold text-foreground">Record Payment - {quickPayResult.studentName}</h3>
              
              {quickPayResult.invoices.length > 1 && (
                <FormField>
                  <FormLabel htmlFor="invoice-select">Invoice</FormLabel>
                  <FormControl>
                    <Select 
                      id="invoice-select"
                      value={paymentModal.invoiceId}
                      onChange={e => setPaymentModal(prev => prev ? { ...prev, invoiceId: e.target.value } : null)}
                    >
                      {quickPayResult.invoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} (Balance: {inv.currency} {inv.balance.toLocaleString()})
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </FormField>
              )}

              <FormField>
                <FormLabel htmlFor="payment-amount">Payment amount</FormLabel>
                <FormControl>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount"
                    value={paymentModal.amount}
                    onChange={e => setPaymentModal(prev => prev ? { ...prev, amount: e.target.value } : null)}
                    required
                  />
                </FormControl>
              </FormField>

              <FormField>
                <FormLabel htmlFor="receipt-number">Receipt number</FormLabel>
                <FormControl>
                  <Input
                    id="receipt-number"
                    placeholder="Receipt number"
                    value={paymentModal.receiptNumber}
                    onChange={e => setPaymentModal(prev => prev ? { ...prev, receiptNumber: e.target.value } : null)}
                    required
                  />
                </FormControl>
              </FormField>

              <FormField>
                <FormLabel htmlFor="payment-method">Payment method</FormLabel>
                <FormControl>
                  <Select
                    id="payment-method"
                    value={paymentModal.paymentMethod}
                    onChange={e => setPaymentModal(prev => prev ? { ...prev, paymentMethod: e.target.value as PaymentMethod } : null)}
                  >
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>Mobile Money</option>
                    <option>Card</option>
                  </Select>
                </FormControl>
              </FormField>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setPaymentModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="default" disabled={paying}>
                  {paying ? 'Processing…' : 'Record Payment'}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </>
    )
  )
}