import { useEffect, useState } from 'react'
import { getStudentDocuments, uploadDocument, archiveDocument, deleteDocument, getDocumentDownloadUrl, type StudentDocument } from '../api/documents'
import { getStudents, type Student } from '../api/students'
import { getAccessToken } from '../api/auth'

const DOCUMENT_TYPES = ['Birth Certificate', 'National ID', 'Passport', 'Academic Transcript', 'Medical Record', 'Immunization Record', 'Transfer Certificate', 'Other']

export function DocumentManagement({ canManage }: { canManage: boolean }) {
  const [students, setStudents] = useState<Student[]>([])
  const [documents, setDocuments] = useState<StudentDocument[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [description, setDescription] = useState('')

  async function loadStudents() {
    try { setStudents(await getStudents()) } catch { setError('Unable to load students.') }
  }

  async function loadDocuments() {
    if (!selectedStudentId) return
    setLoading(true); setError('')
    try { setDocuments(await getStudentDocuments(selectedStudentId)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load documents.') } finally { setLoading(false) }
  }

  useEffect(() => { void loadStudents() }, [])
  useEffect(() => { void loadDocuments() }, [selectedStudentId])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!file || !selectedStudentId || !documentType) return
    setSaving(true); setError('')
    try {
      const uploaded = await uploadDocument({ studentId: selectedStudentId, documentType, file, description })
      setDocuments((current) => [uploaded, ...current])
      setFile(null)
      setDocumentType('')
      setDescription('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to upload document.') } finally { setSaving(false) }
  }

  async function handleArchive(id: string) {
    try { await archiveDocument(id); setDocuments((current) => current.map((d) => d.id === id ? { ...d, isArchived: true } : d)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to archive document.') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document permanently?')) return
    try { await deleteDocument(id); setDocuments((current) => current.filter((d) => d.id !== id)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete document.') }
  }

  async function handleDownload(id: string, fileName: string) {
    const token = getAccessToken()
    const url = getDocumentDownloadUrl(id)
    try {
      const response = await fetch(url, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      if (!response.ok) throw new Error('Download failed.')
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to download document.') }
  }

  if (!canManage) return <section className="panel"><h3>Documents</h3><p className="empty">Your role does not have document management access.</p></section>

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }

  return <section className="academic-workspace" aria-label="Document management workspace">
    <div className="panel-heading"><div><p className="eyebrow">Documents</p><h2>Student Document Management</h2></div></div>
    <div className="form-grid" style={{ marginBottom: 12 }}>
      <label>Student
        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} required>
          <option value="">Select a student</option>
          {students.map((s) => <option key={s.id} value={s.id}>{[s.firstName, s.otherNames, s.lastName].filter(Boolean).join(' ')} ({s.studentNumber})</option>)}
        </select>
      </label>
    </div>
    {selectedStudentId && (
      <form className="student-form" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div className="form-grid">
          <label>Document type
            <select value={documentType} onChange={e => setDocumentType(e.target.value)} required>
              <option value="">Select type</option>
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>File
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} required />
          </label>
          <label>Description
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
          </label>
        </div>
        <button type="submit" disabled={saving}>{saving ? 'Uploading…' : 'Upload document'}</button>
      </form>
    )}
    {error && <div className="error" role="alert">{error}</div>}
    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {!selectedStudentId ? <tr><td colSpan={6} className="empty">Select a student to view documents.</td></tr> : loading ? <tr><td colSpan={6} className="empty">Loading documents…</td></tr> : documents.length === 0 ? <tr><td colSpan={6} className="empty">No documents found.</td></tr> : documents.map((d) => <tr key={d.id}>
        <td>{d.fileName}</td>
        <td>{d.documentType}</td>
        <td>{formatSize(d.fileSizeBytes)}</td>
        <td>{new Date(d.uploadedAt).toLocaleDateString()}</td>
        <td>{d.isArchived ? 'Archived' : 'Active'}</td>
        <td>
          <button className="secondary-button" onClick={() => handleDownload(d.id, d.fileName)}>Download</button>
          {!d.isArchived && <button className="secondary-button" onClick={() => handleArchive(d.id)}>Archive</button>}
          <button className="secondary-button" onClick={() => handleDelete(d.id)}>Delete</button>
        </td>
      </tr>)}
    </tbody></table></div>
  </section>
}
