import { useEffect, useState } from 'react'
import { generateCertificate, getCertificate, printCertificate, type CertificateDto } from '../api/certificates'
import { getStudents, type Student } from '../api/students'

type Tab = 'generate' | 'view'

interface CertificateManagementProps { canManage?: boolean }
export function CertificateManagement({ canManage }: CertificateManagementProps) {
  const [tab, setTab] = useState<Tab>('generate')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [programme, setProgramme] = useState('')
  const [awardType, setAwardType] = useState('Certificate')
  const [graduationDate, setGraduationDate] = useState('')
  const [issuedBy, setIssuedBy] = useState('')
  const [certificates, setCertificates] = useState<CertificateDto[]>([])
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadStudents()
  }, [])

  async function loadStudents() {
    try {
      const data = await getStudents()
      setStudents(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load students.')
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudentId) return
    setLoading(true)
    setError('')
    try {
      const cert = await generateCertificate(selectedStudentId, {
        studentId: selectedStudentId,
        programme,
        awardType,
        graduationDate,
        issuedBy
      })
      setCertificates(prev => [cert, ...prev])
      setSelectedCertificate(cert)
      setTab('view')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate certificate.')
    } finally {
      setLoading(false)
    }
  }

  async function handleViewCert(id: string) {
    setLoading(true)
    setError('')
    try {
      const cert = await getCertificate(id)
      setSelectedCertificate(cert)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load certificate.')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    if (!selectedCertificate) return
    window.print()
  }

  return (
    <section className="panel" aria-label="Certificate canManagement">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CERTIFICATES</span>
          <h3>Certificate Management</h3>
        </div>
        <button className="secondary-button" onClick={handlePrint} disabled={!selectedCertificate}>Print Certificate</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Certificate sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'generate'} className={tab === 'generate' ? 'active' : ''} onClick={() => setTab('generate')}>Generate</button>
        <button role="tab" aria-selected={tab === 'view'} className={tab === 'view' ? 'active' : ''} onClick={() => setTab('view')}>View Issued</button>
      </div>

      {tab === 'generate' && (
        <form className="student-form" onSubmit={handleGenerate}>
          <div className="form-row">
            <label>Student
              <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} required>
                <option value="">Select student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.studentNumber} - {s.firstName} {s.lastName}</option>
                ))}
              </select>
            </label>
            <label>Programme<input value={programme} onChange={e => setProgramme(e.target.value)} placeholder="e.g. BSc Computer Science" required /></label>
          </div>
          <div className="form-row">
            <label>Award Type
              <select value={awardType} onChange={e => setAwardType(e.target.value)}>
                <option>Certificate</option>
                <option>Diploma</option>
                <option>Degree</option>
                <option>Postgraduate Diploma</option>
                <option>Masters</option>
              </select>
            </label>
            <label>Graduation Date<input type="date" value={graduationDate} onChange={e => setGraduationDate(e.target.value)} required /></label>
          </div>
          <div className="form-row">
            <label>Issued By<input value={issuedBy} onChange={e => setIssuedBy(e.target.value)} placeholder="Issuing authority" required /></label>
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Generating…' : 'Generate Certificate'}</button>
        </form>
      )}

      {tab === 'view' && (
        <div className="table-wrap">
          {certificates.length === 0 ? (
            <p className="empty">No certificates issued yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Student</th>
                  <th>Programme</th>
                  <th>Award</th>
                  <th>Graduation</th>
                  <th>Issued</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.serialNumber}</strong></td>
                    <td>{c.name}</td>
                    <td>{c.programme}</td>
                    <td>{c.awardType}</td>
                    <td>{new Date(c.graduationDate).toLocaleDateString('en-UG')}</td>
                    <td>{new Date(c.issuedAt).toLocaleDateString('en-UG')}</td>
                    <td><button className="secondary-button" onClick={() => handleViewCert(c.id)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedCertificate && (
        <div className="certificate-preview" id="certificate-print">
          <div className="certificate-border">
            <div className="certificate-header">
              <h4>Certificate of {selectedCertificate.awardType}</h4>
              <p>Serial No: {selectedCertificate.serialNumber}</p>
            </div>
            <div className="certificate-body">
              <p>This is to certify that</p>
              <h3>{selectedCertificate.name}</h3>
              <p>has successfully completed the requirements for the</p>
              <h3>{selectedCertificate.awardType} in {selectedCertificate.programme}</h3>
              <p>Graduation Date: {new Date(selectedCertificate.graduationDate).toLocaleDateString('en-UG')}</p>
              <p>Issued By: {selectedCertificate.issuedBy}</p>
              <p>Date Issued: {new Date(selectedCertificate.issuedAt).toLocaleDateString('en-UG')}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
