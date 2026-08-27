import { useEffect, useState, type FormEvent } from 'react'
import {
  getPendingGatePasses,
  getStudentGatePasses,
  requestGatePass,
  approveGatePass,
  rejectGatePass,
  markGatePassUsed,
  markGatePassReturned,
  type GatePass,
  type GatePassDetail,
} from '../api/gatePasses'

type Tab = 'pending' | 'request' | 'history'

export function GatePassManagement() {
  const [tab, setTab] = useState<Tab>('pending')
  const [pendingPasses, setPendingPasses] = useState<GatePass[]>([])
  const [studentHistory, setStudentHistory] = useState<GatePassDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [studentId, setStudentId] = useState('')
  const [form, setForm] = useState({
    studentId: '',
    passType: 'Regular',
    reason: '',
    destination: '',
    authorizedBy: '',
    parentGuardianContact: '',
    expectedReturnDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  async function loadPending() {
    setLoading(true)
    setError('')
    try {
      const data = await getPendingGatePasses()
      setPendingPasses(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load pending gate passes.')
    } finally {
      setLoading(false)
    }
  }

  async function loadStudentHistory() {
    if (!studentId.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await getStudentGatePasses(studentId.trim())
      setStudentHistory(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load gate pass history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'pending') void loadPending()
  }, [tab])

  async function handleRequest(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.studentId.trim()) return
    setLoading(true)
    try {
      await requestGatePass({
        studentId: form.studentId.trim(),
        passType: form.passType,
        reason: form.reason.trim() || undefined,
        destination: form.destination.trim() || undefined,
        authorizedBy: form.authorizedBy.trim() || undefined,
        parentGuardianContact: form.parentGuardianContact.trim() || undefined,
        expectedReturnDate: form.expectedReturnDate,
        notes: form.notes.trim() || undefined,
      })
      setSuccess('Gate pass requested successfully.')
      setForm({
        studentId: '',
        passType: 'Regular',
        reason: '',
        destination: '',
        authorizedBy: '',
        parentGuardianContact: '',
        expectedReturnDate: new Date().toISOString().split('T')[0],
        notes: '',
      })
      void loadPending()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to request gate pass.')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setLoading(true)
    setError('')
    try {
      await approveGatePass(id)
      setSuccess('Gate pass approved.')
      void loadPending()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to approve gate pass.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject(id: string) {
    setLoading(true)
    setError('')
    try {
      await rejectGatePass(id)
      setSuccess('Gate pass rejected.')
      void loadPending()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reject gate pass.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUse(id: string) {
    setLoading(true)
    setError('')
    try {
      await markGatePassUsed(id)
      setSuccess('Gate pass marked as used.')
      void loadPending()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to mark gate pass as used.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReturn(id: string) {
    setLoading(true)
    setError('')
    try {
      await markGatePassReturned(id)
      setSuccess('Gate pass marked as returned.')
      void loadPending()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to mark gate pass as returned.')
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string): string {
    if (status === 'Approved') return '#059669'
    if (status === 'Pending') return '#d97706'
    if (status === 'Used') return '#2563eb'
    if (status === 'Returned') return '#7c3aed'
    return '#dc2626'
  }

  return (
    <section className="panel" aria-label="Gate pass management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CAMPUS SERVICES</span>
          <h2>Gate Pass Management</h2>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Gate pass sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'pending'} className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>Pending Approvals</button>
        <button role="tab" aria-selected={tab === 'request'} className={tab === 'request' ? 'active' : ''} onClick={() => setTab('request')}>Request Pass</button>
        <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Student History</button>
      </div>

      {loading && tab === 'pending' ? (
        <p className="empty">Loading...</p>
      ) : tab === 'pending' ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Destination</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingPasses.length === 0 ? (
                <tr><td colSpan={7} className="empty">No pending gate passes</td></tr>
              ) : (
                pendingPasses.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.studentNumber}</strong> {p.studentName}</td>
                    <td>{p.passType}</td>
                    <td>{p.reason || '-'}</td>
                    <td>{p.destination || '-'}</td>
                    <td>{new Date(p.expectedReturnDate).toLocaleDateString('en-UG')}</td>
                    <td>
                      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(p.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="secondary-button" onClick={() => handleApprove(p.id)}>Approve</button>
                        <button className="secondary-button" onClick={() => handleReject(p.id)}>Reject</button>
                        {p.status === 'Approved' && <button className="secondary-button" onClick={() => handleUse(p.id)}>Mark Used</button>}
                        {p.status === 'Used' && <button className="secondary-button" onClick={() => handleReturn(p.id)}>Return</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : tab === 'request' ? (
        <form onSubmit={handleRequest} className="student-form">
          <div className="form-row">
            <label>
              Student ID
              <input value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} placeholder="Enter student ID" required />
            </label>
            <label>
              Pass Type
              <select value={form.passType} onChange={e => setForm({ ...form, passType: e.target.value })}>
                <option value="Regular">Regular</option>
                <option value="Medical">Medical</option>
                <option value="Emergency">Emergency</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Reason
              <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leaving" />
            </label>
            <label>
              Destination
              <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Where is the student going?" />
            </label>
          </div>
          <div className="form-row">
            <label>
              Authorized By
              <input value={form.authorizedBy} onChange={e => setForm({ ...form, authorizedBy: e.target.value })} placeholder="Name of authorizing staff" />
            </label>
            <label>
              Parent/Guardian Contact
              <input value={form.parentGuardianContact} onChange={e => setForm({ ...form, parentGuardianContact: e.target.value })} placeholder="Phone number" />
            </label>
          </div>
          <div className="form-row">
            <label>
              Expected Return Date
              <input type="date" value={form.expectedReturnDate} onChange={e => setForm({ ...form, expectedReturnDate: e.target.value })} required />
            </label>
            <label>
              Notes
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes" />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Request Gate Pass'}</button>
          </div>
        </form>
      ) : (
        <>
          <form onSubmit={e => { e.preventDefault(); void loadStudentHistory() }} className="student-form" style={{ marginBottom: 22 }}>
            <div className="form-row">
              <label>
                Student ID
                <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student ID" required />
              </label>
              <button type="submit" disabled={loading}>Load History</button>
            </div>
          </form>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Returned</th>
                </tr>
              </thead>
              <tbody>
                {studentHistory.length === 0 ? (
                  <tr><td colSpan={6} className="empty">No gate pass history found</td></tr>
                ) : (
                  studentHistory.map(p => (
                    <tr key={p.id}>
                      <td>{p.passType}</td>
                      <td>{p.reason || '-'}</td>
                      <td>{p.destination || '-'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(p.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                          {p.status}
                        </span>
                      </td>
                      <td>{new Date(p.issuedAtUtc).toLocaleDateString('en-UG')}</td>
                      <td>{p.returnedAtUtc ? new Date(p.returnedAtUtc).toLocaleDateString('en-UG') : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
