import { useEffect, useState } from 'react'
import { generateCertificate, getCertificate, printCertificate, revokeCertificate, verifyCertificate, type CertificateDto, type RevokeCertificateRequest } from '../api/certificates'
import { getStudents, type Student } from '../api/students'

type Tab = 'generate' | 'view' | 'verify'

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
  const [verifySerial, setVerifySerial] = useState('')
  const [verifyResult, setVerifyResult] = useState<CertificateDto | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null)

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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifyLoading(true)
    setError('')
    setVerifyResult(null)
    try {
      const result = await verifyCertificate(verifySerial)
      setVerifyResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to verify certificate.')
    } finally {
      setVerifyLoading(false)
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeConfirmId) return
    setLoading(true)
    setError('')
    try {
      const revokedBy = (document.getElementById('revoke-by') as HTMLInputElement)?.value || issuedBy
      const reason = (document.getElementById('revoke-reason') as HTMLInputElement)?.value
      await revokeCertificate(revokeConfirmId, { revokedBy, reason: reason || undefined })
      const now = new Date().toISOString()
      setCertificates(prev => prev.map(c => c.id === revokeConfirmId ? { ...c, isRevoked: true, revokedAt: now, revokedBy, revocationReason: reason } : c))
      if (selectedCertificate?.id === revokeConfirmId) {
        setSelectedCertificate(prev => prev ? { ...prev, isRevoked: true, revokedAt: now, revokedBy, revocationReason: reason } : null)
      }
      setRevokeConfirmId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to revoke certificate.')
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
        <button role="tab" aria-selected={tab === 'verify'} className={tab === 'verify' ? 'active' : ''} onClick={() => setTab('verify')}>Verify</button>
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
                  <th>Status</th>
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
                    <td>{c.isRevoked ? 'REVOKED' : 'Valid'}</td>
                    <td>
                      <button className="secondary-button" onClick={() => handleViewCert(c.id)}>View</button>
                      {canManage && !c.isRevoked && <button className="secondary-button" onClick={() => setRevokeConfirmId(c.id)}>Revoke</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'verify' && (
        <form className="student-form" onSubmit={handleVerify}>
          <div className="form-row">
            <label>Serial Number<input value={verifySerial} onChange={e => setVerifySerial(e.target.value)} placeholder="CERT-..." required /></label>
          </div>
          <button type="submit" disabled={verifyLoading}>{verifyLoading ? 'Verifying…' : 'Verify Certificate'}</button>
        </form>
      )}

      {tab === 'verify' && verifyResult && (
        <div className="certificate-preview" id="certificate-print">
          <div className="certificate-border">
            <div className="certificate-header">
              <h4>Verification Result</h4>
              <p>Serial No: {verifyResult.serialNumber}</p>
            </div>
            <div className="certificate-body">
              <p><strong>Status:</strong> {verifyResult.isRevoked ? 'REVOKED' : 'Valid'}</p>
              <p><strong>Student:</strong> {verifyResult.name}</p>
              <p><strong>Programme:</strong> {verifyResult.programme}</p>
              <p><strong>Award:</strong> {verifyResult.awardType}</p>
              <p><strong>Graduation Date:</strong> {new Date(verifyResult.graduationDate).toLocaleDateString('en-UG')}</p>
              <p><strong>Issued By:</strong> {verifyResult.issuedBy}</p>
              <p><strong>Date Issued:</strong> {new Date(verifyResult.issuedAt).toLocaleDateString('en-UG')}</p>
              <p><strong>Verification Hash:</strong> {verifyResult.verificationHash}</p>
              {verifyResult.isRevoked && (
                <>
                  <p><strong>Revoked At:</strong> {verifyResult.revokedAt ? new Date(verifyResult.revokedAt).toLocaleDateString('en-UG') : ''}</p>
                  <p><strong>Revoked By:</strong> {verifyResult.revokedBy}</p>
                  <p><strong>Reason:</strong> {verifyResult.revocationReason}</p>
                </>
              )}
            </div>
          </div>
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
              <p><strong>Verification Hash:</strong> {selectedCertificate.verificationHash}</p>
              <p><strong>Status:</strong> {selectedCertificate.isRevoked ? 'REVOKED' : 'Valid'}</p>
              {selectedCertificate.isRevoked && (
                <>
                  <p><strong>Revoked:</strong> {selectedCertificate.revokedAt ? new Date(selectedCertificate.revokedAt).toLocaleDateString('en-UG') : ''} by {selectedCertificate.revokedBy} - Reason: {selectedCertificate.revocationReason}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {revokeConfirmId && (
        <div className="confirm-dialog">
          <p>Are you sure you want to revoke certificate <strong>{revokeConfirmId}</strong>?</p>
          <div className="form-row">
            <label>Revoked By<input id="revoke-by" defaultValue={issuedBy} /></label>
            <label>Reason<input id="revoke-reason" placeholder="Optional" /></label>
          </div>
          <div>
            <button onClick={handleRevokeConfirm} disabled={loading}>{loading ? 'Revoking…' : 'Confirm Revoke'}</button>
            <button className="secondary-button" onClick={() => setRevokeConfirmId(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}
