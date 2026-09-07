import { useEffect, useState } from 'react'
import { sendSms, sendBulkSms, getSmsHistory, getSmsTemplates, type SmsHistoryItem } from '../api/sms'
import { getProgrammes } from '../api/programmes'

type Tab = 'compose' | 'bulk' | 'history'

export function SmsCommunication() {
  const [tab, setTab] = useState<Tab>('compose')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [recipientType, setRecipientType] = useState('Student')
  const [recipientIds, setRecipientIds] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkRecipientType, setBulkRecipientType] = useState('Student')
  const [selectedProgramme, setSelectedProgramme] = useState('')
  const [templates, setTemplates] = useState<string[]>([])
  const [history, setHistory] = useState<SmsHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [programmes, setProgrammes] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    getProgrammes().then(data => setProgrammes(data)).catch(() => {})
    getSmsTemplates().then(data => setTemplates(data.map(t => t.name))).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const data = await getSmsHistory()
      setHistory(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load SMS history.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendIndividual(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!message.trim()) return
    const ids = recipientIds.split(',').map(id => id.trim()).filter(Boolean)
    if (!ids.length) return
    setLoading(true)
    try {
      await sendSms({
        subject: subject.trim() || undefined,
        message: message.trim(),
        recipientType,
        recipientIds: ids,
      })
      setSuccess(`SMS queued for ${ids.length} recipient(s).`)
      setSubject('')
      setMessage('')
      setRecipientIds('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send SMS.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendBulk(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!bulkMessage.trim()) return
    setLoading(true)
    try {
      await sendBulkSms({
        subject: 'School Notification',
        message: bulkMessage.trim(),
        recipientType: bulkRecipientType,
        classFilter: selectedProgramme || undefined,
      })
      setSuccess('Bulk SMS queued successfully.')
      setBulkMessage('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send bulk SMS.')
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string): string {
    if (status === 'Sent') return '#059669'
    if (status === 'Pending') return '#d97706'
    return '#dc2626'
  }

  return (
    <section className="panel" aria-label="SMS communication">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">COMMUNICATION</span>
          <h2>SMS Communication</h2>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="SMS sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'compose'} className={tab === 'compose' ? 'active' : ''} onClick={() => setTab('compose')}>Compose</button>
        <button role="tab" aria-selected={tab === 'bulk'} className={tab === 'bulk' ? 'active' : ''} onClick={() => setTab('bulk')}>Bulk SMS</button>
        <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>History</button>
      </div>

      {loading && tab !== 'history' ? (
        <p className="empty">Processing...</p>
      ) : (
        <>
          {tab === 'compose' && (
            <form onSubmit={handleSendIndividual} className="student-form" style={{ marginBottom: 22 }}>
              <div className="form-row">
                <label>
                  Subject
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Notification subject" />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Recipient Type
                  <select value={recipientType} onChange={e => setRecipientType(e.target.value)}>
                    <option value="Student">Student</option>
                    <option value="Staff">Staff</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Recipient IDs (comma-separated)
                  <input value={recipientIds} onChange={e => setRecipientIds(e.target.value)} placeholder="e.g. student-id-1, student-id-2" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Message
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Enter your SMS message..." required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Template (optional)
                  <select value="" onChange={e => setMessage(e.target.value === 'custom' ? message : templates.find(t => t === e.target.value) ? '' : message)}>
                    <option value="custom">Custom</option>
                    {templates.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send SMS'}</button>
              </div>
            </form>
          )}

          {tab === 'bulk' && (
            <form onSubmit={handleSendBulk} className="student-form" style={{ marginBottom: 22 }}>
              <div className="form-row">
                <label>
                  Recipient Type
                  <select value={bulkRecipientType} onChange={e => setBulkRecipientType(e.target.value)}>
                    <option value="Student">All Students</option>
                    <option value="Staff">All Staff</option>
                  </select>
                </label>
              </div>
              {bulkRecipientType === 'Student' && (
                <div className="form-row">
                  <label>
                    Filter by Programme (optional)
                    <select value={selectedProgramme} onChange={e => setSelectedProgramme(e.target.value)}>
                      <option value="">All Programmes</option>
                      {programmes.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <div className="form-row">
                <label>
                  Message
                  <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} rows={4} placeholder="Enter your bulk SMS message..." required />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send Bulk SMS'}</button>
              </div>
            </form>
          )}

          {tab === 'history' && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Body</th>
                    <th>Recipient</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={6} className="empty">No SMS history found</td></tr>
                  ) : (
                    history.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.title}</strong></td>
                        <td>{item.body}</td>
                        <td>{item.recipientType} ({item.recipientId})</td>
                        <td>
                          <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(item.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                            {item.status}
                          </span>
                        </td>
                        <td>{new Date(item.createdAtUtc).toLocaleString('en-UG')}</td>
                        <td>{item.sentAtUtc ? new Date(item.sentAtUtc).toLocaleString('en-UG') : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
