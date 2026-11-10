import { formatPersonName } from '../utils/personName'
import { useEffect, useMemo, useState } from 'react'
import { archiveStudent, getArchivedStudents, getStudent, getStudentApplicationForm, getStudentGuardians, getStudents, restoreStudent, type Student, type StudentGuardian } from '../api/students'
import { getStudent360Profile as loadStudent360, type Student360ProfileDto } from '../api/student360'
import { getStudentFinancialStatement, type StudentFinancialStatement } from '../api/finance'
import { getStudentTranscript } from '../api/academicRecords'
import type { TranscriptEntry } from '../types/academic'
import { showConfirmDialog } from '../utils/confirmDialog'
import { getStudentDocuments, type StudentDocument } from '../api/documents'

type Tab = 'biodata' | 'academic' | 'attendance' | 'fees' | 'documents'

const fullName = (student: Student) => formatPersonName(student.lastName, student.firstName, student.otherNames)

export function ArchivedStudentsManagement({ canManage = false }: { canManage?: boolean }) {
  const [archived, setArchived] = useState<Student[]>([])
  const [activeStudents, setActiveStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selected, setSelected] = useState<Student | null>(null)
  const [profile, setProfile] = useState<Student360ProfileDto | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [guardians, setGuardians] = useState<StudentGuardian[]>([])
  const [application, setApplication] = useState<{ application: Record<string, unknown>; submittedAt: string; status: string } | null>(null)
  const [documents, setDocuments] = useState<StudentDocument[]>([])
  const [financialStatement, setFinancialStatement] = useState<StudentFinancialStatement | null>(null)
  const [financeNotice, setFinanceNotice] = useState('')
  const [transcriptNotice, setTranscriptNotice] = useState('')
  const [documentsNotice, setDocumentsNotice] = useState('')
  const [tab, setTab] = useState<Tab>('biodata')
  const [archiveTarget, setArchiveTarget] = useState('')
  const [archiveReason, setArchiveReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refresh(searchTerm = search) {
    setLoading(true)
    setError('')
    try {
      const [archivedRows, activeRows] = await Promise.all([
        getArchivedStudents(searchTerm),
        getStudents(),
      ])
      setArchived(archivedRows)
      setActiveStudents(activeRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the student archive.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh('') }, [])

  async function searchArchive(e: React.FormEvent) {
    e.preventDefault()
    await refresh(search)
  }

  async function openStudent(student: Student) {
    setSelected(student)
    setTab('biodata')
    setDetailLoading(true)
    setProfile(null)
    setTranscript([])
    setGuardians([])
    setApplication(null)
    setDocuments([])
    setFinancialStatement(null)
    setFinanceNotice('')
    setTranscriptNotice('')
    setDocumentsNotice('')
    setError('')
    try {
      const [record, studentProfile, guardianRows, applicationRecord, transcriptRows, documentRows, statement] = await Promise.all([
        getStudent(student.id),
        loadStudent360(student.id).catch(() => null),
        getStudentGuardians(student.id).catch(() => []),
        getStudentApplicationForm(student.id).catch(() => null),
        getStudentTranscript(student.id).catch(e => { setTranscriptNotice(e instanceof Error ? e.message : 'Academic transcript access is unavailable.'); return [] }),
        getStudentDocuments(student.id).catch(e => { setDocumentsNotice(e instanceof Error ? e.message : 'Document access is unavailable.'); return [] }),
        getStudentFinancialStatement(student.id).catch(e => { setFinanceNotice(e instanceof Error ? e.message : 'Finance history access is unavailable.'); return null }),
      ])
      setSelected(record)
      setProfile(studentProfile)
      setGuardians(guardianRows)
      setApplication(applicationRecord)
      setTranscript(transcriptRows)
      setDocuments(documentRows)
      setFinancialStatement(statement)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load this archived student record.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function submitArchive(e: React.FormEvent) {
    e.preventDefault()
    if (!archiveTarget) return
    const student = activeStudents.find(x => x.id === archiveTarget)
    if (!student) return
    if (!(await showConfirmDialog(`Move ${fullName(student)} (${student.studentNumber}) into Archives?\nTheir active-list access will end; all linked records will be retained.`, { title: 'Move student to Archives', confirmLabel: 'Move to Archives' }))) return
    setSaving(true); setError(''); setNotice('')
    try {
      await archiveStudent(student.id, archiveReason)
      setArchiveTarget('')
      setArchiveReason('')
      setNotice(`${fullName(student)} has been moved to Archives. Their academic and financial history has been retained.`)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to archive this student.')
    } finally { setSaving(false) }
  }

  async function restoreSelected() {
    if (!selected || !canManage) return
    if (!(await showConfirmDialog(`Restore ${fullName(selected)} (${selected.studentNumber}) to the active student lists?`, { title: 'Restore student', confirmLabel: 'Restore student' }))) return
    setSaving(true); setError(''); setNotice('')
    try {
      await restoreStudent(selected.id)
      setNotice(`${fullName(selected)} has been restored to the active student system.`)
      setSelected(null)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to restore this student.')
    } finally { setSaving(false) }
  }

  const activeChoices = useMemo(() => activeStudents.filter(student => {
    const q = activeSearch.trim().toLowerCase()
    if (!q) return true
    return [student.studentNumber, student.firstName, student.otherNames, student.lastName, student.email, student.phoneNumber]
      .some(value => value?.toLowerCase().includes(q))
  }), [activeStudents, activeSearch])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'biodata', label: 'Biodata' },
    { key: 'academic', label: 'Academic Records' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'fees', label: 'Fees & Payments' },
    { key: 'documents', label: 'Documents' },
  ]

  return <section className="panel archived-students-workspace" aria-label="Student archives">
    <div className="panel-heading">
      <div><h2>Archives</h2></div>
      <div className="summary-card archive-count"><span>Archived</span><strong>{archived.length}</strong></div>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="info-banner" role="status">{notice}</div>}

    {canManage && <form className="panel archive-action-panel" onSubmit={submitArchive}>
      <div className="panel-heading"><h3>Archive student</h3></div>
      <div className="lifecycle-form-grid">
        <label>Search active students
          <input value={activeSearch} onChange={e => setActiveSearch(e.target.value)} placeholder="Name or student number" />
        </label>
        <label>Student
          <select value={archiveTarget} onChange={e => setArchiveTarget(e.target.value)} required>
            <option value="">Choose student…</option>
            {activeChoices.map(student => <option key={student.id} value={student.id}>{student.studentNumber} — {fullName(student)} ({student.status})</option>)}
          </select>
        </label>
        <label>Reason (optional)
          <input value={archiveReason} onChange={e => setArchiveReason(e.target.value)} placeholder="e.g. Completed programme" />
        </label>
      </div>
      <div className="form-actions"><button type="submit" disabled={!archiveTarget || saving}>{saving ? 'Archiving…' : 'Archive student'}</button></div>
    </form>}

    <form className="finance-search-form archive-search-form" onSubmit={searchArchive}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search archived students…" aria-label="Search archived students" />
      <button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      <button type="button" className="secondary-button" onClick={() => { setSearch(''); void refresh('') }}>Clear</button>
    </form>

    {!selected ? <div className="table-wrap">
      {loading ? <p className="empty">Loading archived student records…</p> : <table>
        <thead><tr><th>Student number</th><th>Student name</th><th>Programme status</th><th>Archived on</th><th>Archive reason</th><th /></tr></thead>
        <tbody>{archived.map(student => <tr key={student.id}>
          <td><strong>{student.studentNumber}</strong></td>
          <td>{fullName(student)}</td>
          <td>{student.statusBeforeArchive || 'Former student'}</td>
          <td>{student.archivedAt ? new Date(student.archivedAt).toLocaleDateString('en-UG') : '—'}</td>
          <td>{student.archiveReason || '—'}</td>
          <td><button type="button" className="secondary-button" onClick={() => void openStudent(student)}>Open record</button></td>
        </tr>)}
        {archived.length === 0 && <tr><td colSpan={6}>No archived students match this search.</td></tr>}</tbody>
      </table>}
    </div> : <section className="archived-student-detail">
      <div className="panel-heading">
        <div><p className="eyebrow">HISTORICAL STUDENT FILE</p><h2>{fullName(selected)}</h2><p>{selected.studentNumber} · Archived {selected.archivedAt ? new Date(selected.archivedAt).toLocaleDateString('en-UG') : ''}</p></div>
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setSelected(null)}>Back to Archives</button>{canManage && <button type="button" onClick={() => void restoreSelected()} disabled={saving}>Restore to active system</button>}</div>
      </div>
      <div className="student-lifecycle-tabs archive-tabs" role="tablist" aria-label="Archived student record sections">
        {tabs.map(item => <button type="button" key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)} role="tab" aria-selected={tab === item.key}>{item.label}</button>)}
      </div>
      {detailLoading ? <p className="empty">Loading the student's preserved record…</p> : <>
        {tab === 'biodata' && <div className="lifecycle-form-grid">
          <label>Student number<input readOnly value={selected.studentNumber} /></label>
          <label>Full name<input readOnly value={fullName(selected)} /></label>
          <label>Date of birth<input readOnly value={selected.dateOfBirth || '—'} /></label>
          <label>Gender<input readOnly value={selected.gender || '—'} /></label>
          <label>National ID<input readOnly value={selected.nationalId || '—'} /></label>
          <label>Phone<input readOnly value={selected.phoneNumber || '—'} /></label>
          <label>Email<input readOnly value={selected.email || '—'} /></label>
          <label>Last active status<input readOnly value={selected.statusBeforeArchive || '—'} /></label>
          <label>Archive reason<input readOnly value={selected.archiveReason || '—'} /></label>
          <label>Archived by<input readOnly value={selected.archivedBy || '—'} /></label>
          <div className="full-width"><h4>Parent / Guardian records</h4>{guardians.length ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Email</th><th>Primary</th></tr></thead><tbody>{guardians.map(g => <tr key={g.id}><td>{g.fullName}</td><td>{g.relationship || '—'}</td><td>{g.phoneNumber || '—'}</td><td>{g.email || '—'}</td><td>{g.isPrimary ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div> : <p className="empty">No guardian records available.</p>}</div>
        </div>}
        {tab === 'academic' && <div>
          <div className="summary-grid">
            <div className="summary-card"><span>Programme</span><strong>{profile?.programmeName || 'Not recorded'}</strong><small>{profile?.department || ''}</small></div>
            <div className="summary-card"><span>Cumulative GPA</span><strong>{profile?.gpa?.toFixed(2) ?? '—'}</strong></div>
            <div className="summary-card"><span>Average assessment score</span><strong>{profile?.averageScore?.toFixed(1) ?? '—'}</strong></div>
            <div className="summary-card"><span>Examination average</span><strong>{profile?.averageExamScore?.toFixed(1) ?? '—'}</strong></div>
            <div className="summary-card"><span>Assessments recorded</span><strong>{profile?.assessmentCount ?? 0}</strong></div>
            <div className="summary-card"><span>Certificates</span><strong>{profile?.certificateCount ?? 0}</strong></div>
          </div>
          <h4>Transcript / Course Results</h4>
          <div className="table-wrap"><table><thead><tr><th>Course code</th><th>Course</th><th>Credit units</th><th>Score</th><th>Grade</th><th>Grade points</th><th>Result</th></tr></thead><tbody>
            {transcript.map(entry => <tr key={entry.id}><td>{entry.courseCode}</td><td>{entry.courseTitle}</td><td>{entry.creditUnits}</td><td>{entry.score}</td><td>{entry.grade || '—'}</td><td>{entry.gradePoint}</td><td>{entry.isPass ? 'Pass' : 'Not passed'}</td></tr>)}
            {transcript.length === 0 && <tr><td colSpan={7}>{transcriptNotice || 'No transcript entries are recorded for this student.'}</td></tr>}
          </tbody></table></div>
          {!profile && <p className="empty">Academic summary is not available for this record. The underlying student record has been retained.</p>}
        </div>}
        {tab === 'attendance' && <div className="summary-grid">
          <div className="summary-card"><span>Attendance rate</span><strong>{profile ? `${profile.attendancePercentage.toFixed(1)}%` : '—'}</strong></div>
          <div className="summary-card"><span>Sessions</span><strong>{profile?.totalSessions ?? 0}</strong></div>
          <div className="summary-card"><span>Present</span><strong>{profile?.presentSessions ?? 0}</strong></div>
          <div className="summary-card"><span>Absent</span><strong>{profile?.absentSessions ?? 0}</strong></div>
          <div className="summary-card"><span>Late</span><strong>{profile?.lateSessions ?? 0}</strong></div>
          {!profile && <p className="empty">Attendance summary is not available for this record.</p>}
        </div>}
        {tab === 'fees' && <div>
          {financialStatement ? <>
            <div className="summary-grid">{financialStatement.totalsByCurrency.map(total => <div className="summary-card" key={total.currency}><span>Total billed · {total.currency}</span><strong>{total.billed.toLocaleString('en-UG')}</strong><small>Paid {total.paid.toLocaleString('en-UG')} · Balance {total.balance.toLocaleString('en-UG')}</small></div>)}</div>
            <h4>Invoices & fee charges</h4>
            <div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Fee type</th><th>Date</th><th>Billed</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>
              {financialStatement.invoices.map(invoice => <tr key={invoice.id}><td>{invoice.invoiceNumber}</td><td>{invoice.feeType}</td><td>{new Date(invoice.issuedAt).toLocaleDateString('en-UG')}</td><td>{invoice.netAmount.toLocaleString('en-UG')} {invoice.currency}</td><td>{invoice.paidAmount.toLocaleString('en-UG')}</td><td>{invoice.balance.toLocaleString('en-UG')}</td><td>{invoice.status}</td></tr>)}
              {financialStatement.invoices.length === 0 && <tr><td colSpan={7}>No invoices are recorded.</td></tr>}
            </tbody></table></div>
            <h4>Payment history</h4>
            <div className="table-wrap"><table><thead><tr><th>Receipt</th><th>Invoice</th><th>Method</th><th>Reference</th><th>Date</th><th>Amount</th></tr></thead><tbody>
              {financialStatement.payments.map(payment => <tr key={payment.id}><td>{payment.receiptNumber}</td><td>{payment.invoiceNumber || '—'}</td><td>{payment.paymentMethod}</td><td>{payment.reference || '—'}</td><td>{new Date(payment.paidAt).toLocaleString('en-UG')}</td><td>{payment.amount.toLocaleString('en-UG')} {payment.currency}</td></tr>)}
              {financialStatement.payments.length === 0 && <tr><td colSpan={6}>No payments are recorded.</td></tr>}
            </tbody></table></div>
            <p className="finance-muted">{financialStatement.itemAllocationNote}</p>
          </> : <p className="empty">{financeNotice || 'Financial history is not available for this record.'}</p>}
        </div>}
        {tab === 'documents' && <div>
          <h4>Uploaded student documents</h4>
          <div className="table-wrap"><table><thead><tr><th>Document type</th><th>File name</th><th>Uploaded</th><th>Version</th><th>Status</th></tr></thead><tbody>
            {documents.map(document => <tr key={document.id}><td>{document.documentType}</td><td>{document.fileName}</td><td>{new Date(document.uploadedAt).toLocaleString('en-UG')}</td><td>{document.version}</td><td>{document.isArchived ? 'Document archived' : 'Available'}</td></tr>)}
            {documents.length === 0 && <tr><td colSpan={5}>{documentsNotice || 'No uploaded documents are available for this student.'}</td></tr>}
          </tbody></table></div>
          {application ? <><h4>Admission application record</h4><p>Submitted: {new Date(application.submittedAt).toLocaleString('en-UG')} · Status: {application.status}</p><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(application.application, null, 2)}</pre></> : null}
          <p>Document count recorded in Student 360: {profile?.documentCount ?? documents.length}</p>
        </div>}
      </>}
    </section>}
  </section>
}
