import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode, type CSSProperties } from 'react'
import LoadingSpinner from './LoadingSpinner';
import {
  addStudentGuardian, createStudent, deleteStudentGuardian, getStudentGuardians, getStudentQrCode,
  getStudents, saveStudentApplicationForm, updateStudentGuardian, type CreateStudentRequest, type GuardianInput, type Student, type StudentGuardian,
} from '../api/students'
import { useInstitutionSettings } from './InstitutionSettingsContext'

interface Props { canManage?: boolean; readOnly?: boolean }
type EducationRow = { school: string; location: string; from: string; to: string; qualification: string; grade: string; language: string }
type ApplicationForm = {
  academicYear: string; intake: string; course: string; entryStatus: string; programme: string;
  firstName: string; otherNames: string; lastName: string; dateOfBirth: string; gender: string;
  village: string; subCounty: string; district: string; phone: string; email: string;
  nationality: string; religion: string; countryOfResidence: string;
  seriousCondition: string; conditionDetails: string; regularMedication: string; medicationDetails: string; specialRequirements: string;
  fatherName: string; fatherAddress: string; fatherPhone: string; fatherOccupation: string;
  motherName: string; motherAddress: string; motherPhone: string; motherOccupation: string;
  sponsorName: string; sponsorAddress: string; sponsorPhone: string; sponsorOccupation: string; sponsorRelationship: string;
  declaration: boolean; applicantSignature: string; signatureDate: string;
  applicationFee: string; feePaid: string; approvedBy: string; approvalSignature: string; approvalDate: string;
}
const emptyApplication: ApplicationForm = {
  academicYear: '', intake: '', course: '', entryStatus: 'Direct', programme: 'Day',
  firstName: '', otherNames: '', lastName: '', dateOfBirth: '', gender: '', village: '', subCounty: '', district: '', phone: '', email: '',
  nationality: '', religion: '', countryOfResidence: '', seriousCondition: '', conditionDetails: '', regularMedication: '', medicationDetails: '', specialRequirements: '',
  fatherName: '', fatherAddress: '', fatherPhone: '', fatherOccupation: '', motherName: '', motherAddress: '', motherPhone: '', motherOccupation: '',
  sponsorName: '', sponsorAddress: '', sponsorPhone: '', sponsorOccupation: '', sponsorRelationship: '',
  declaration: false, applicantSignature: '', signatureDate: '', applicationFee: '50000', feePaid: 'Not paid', approvedBy: '', approvalSignature: '', approvalDate: '',
}
const emptyEducation = (): EducationRow => ({ school: '', location: '', from: '', to: '', qualification: '', grade: '', language: '' })
const emptyGuardian: GuardianInput = { fullName: '', relationship: 'Parent', address: '', phoneNumber: '', email: '', isPrimary: false }
const logoUrl = (path?: string | null) => {
  if (!path?.trim()) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
  return path.startsWith('/') ? base + path : base + '/' + path
}
function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? 'application-field application-field-wide' : 'application-field'}><span>{label}</span>{children}</label>
}
function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <section className="application-section"><h3><span>{number}</span>{title}</h3><div className="application-section-body">{children}</div></section>
}
export function StudentManagement({ canManage = false, readOnly = false }: Props) {
  const { institution, loaded: institutionLoaded } = useInstitutionSettings()
  const [students, setStudents] = useState<Student[]>([])
  const [view, setView] = useState<'application' | 'registry'>('application')
  const [application, setApplication] = useState<ApplicationForm>(emptyApplication)
  const [education, setEducation] = useState<EducationRow[]>([emptyEducation()])
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [qrStudentId, setQrStudentId] = useState<string | null>(null)
  const [guardianStudent, setGuardianStudent] = useState<Student | null>(null)
  const [guardians, setGuardians] = useState<StudentGuardian[]>([])
  const [guardianLoading, setGuardianLoading] = useState(false)
  const [guardianSaving, setGuardianSaving] = useState(false)
  const [guardianError, setGuardianError] = useState('')
  const [guardianForm, setGuardianForm] = useState<GuardianInput>({ ...emptyGuardian, isPrimary: true })
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null)
  const branding = useMemo(() => ({
    '--application-primary': institution.primaryColor || '#1e3a8a',
    '--application-accent': institution.accentColor || '#b45309',
  } as CSSProperties), [institution.primaryColor, institution.accentColor])

  async function load() {
    setLoading(true); setError('')
    try { setStudents(await getStudents()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load students.') }
    finally { setLoading(false) }
  }
  async function loadGuardians(studentId: string) {
    setGuardianLoading(true); setGuardianError('')
    try { setGuardians(await getStudentGuardians(studentId)) }
    catch (e) { setGuardianError(e instanceof Error ? e.message : 'Unable to load parent/guardian records.') }
    finally { setGuardianLoading(false) }
  }
  useEffect(() => { if (canManage || readOnly) void load() }, [canManage, readOnly])
  useEffect(() => {
    if (!photo) { setPhotoPreview(''); return }
    const url = URL.createObjectURL(photo); setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])
  if (!canManage && !readOnly) return <section className="panel"><h3>Student Management</h3><p className="empty">Your role does not have student-record access.</p></section>

  function setApp<K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) {
    setApplication(current => ({ ...current, [key]: value }))
  }
  function setEducationField(index: number, key: keyof EducationRow, value: string) {
    setEducation(rows => rows.map((row, i) => i === index ? { ...row, [key]: value } : row))
  }
  function choosePhoto(event: ChangeEvent<HTMLInputElement>) { setPhoto(event.target.files?.[0] ?? null) }

  async function submitApplication(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      // Student identity is written through the existing protected student API. Application-only fields are
      // represented by the form below and must be persisted through the application-record endpoint.
      const profile: CreateStudentRequest = {
        studentNumber: studentNumber.trim(), firstName: application.firstName.trim(), lastName: application.lastName.trim(),
        otherNames: application.otherNames.trim(), dateOfBirth: application.dateOfBirth || undefined, gender: application.gender,
        phoneNumber: application.phone, email: application.email,
      }
      const created = await createStudent(profile)
      let photographBase64: string | null = null
      if (photo) {
        photographBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = String(reader.result ?? '')
            resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result)
          }
          reader.onerror = () => reject(new Error('Unable to read the selected photograph.'))
          reader.readAsDataURL(photo)
        })
      }
      await saveStudentApplicationForm(created.id, {
        application: { ...application, education, studentNumber: profile.studentNumber, institutionId: institution.id },
        photographBase64,
        photographContentType: photo?.type ?? null,
        photographFileName: photo?.name ?? null,
      })
      const primaryContact = application.fatherName || application.motherName || application.sponsorName
      if (primaryContact) {
        const guardian: GuardianInput = {
          fullName: application.fatherName || application.motherName || application.sponsorName,
          relationship: application.fatherName ? 'Father' : application.motherName ? 'Mother' : application.sponsorRelationship || 'Sponsor',
          address: application.fatherAddress || application.motherAddress || application.sponsorAddress,
          phoneNumber: application.fatherPhone || application.motherPhone || application.sponsorPhone,
          email: '', isPrimary: true,
        }
        await addStudentGuardian(created.id, guardian)
      }
      setStudents(current => [created, ...current.filter(s => s.id !== created.id)])
      setNotice('Student application, photograph and student profile were saved successfully.')
      setView('registry')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save the application.') }
    finally { setSaving(false) }
  }
  async function saveGuardian(event: FormEvent) {
    event.preventDefault(); if (!guardianStudent) return
    setGuardianSaving(true); setGuardianError('')
    try {
      if (editingGuardianId) await updateStudentGuardian(guardianStudent.id, editingGuardianId, guardianForm)
      else await addStudentGuardian(guardianStudent.id, guardianForm)
      setGuardianForm(emptyGuardian); setEditingGuardianId(null); await loadGuardians(guardianStudent.id); setNotice('Parent/guardian record saved.')
    } catch (e) { setGuardianError(e instanceof Error ? e.message : 'Unable to save parent/guardian details.') }
    finally { setGuardianSaving(false) }
  }
  function editGuardian(g: StudentGuardian) {
    setEditingGuardianId(g.id); setGuardianForm({ fullName: g.fullName, relationship: g.relationship ?? '', address: g.address ?? '', phoneNumber: g.phoneNumber ?? '', email: g.email ?? '', isPrimary: g.isPrimary }); setGuardianError('')
  }
  async function removeGuardian(g: StudentGuardian) {
    if (!guardianStudent || !window.confirm(`Remove ${g.fullName} from this student's records?`)) return
    try { await deleteStudentGuardian(guardianStudent.id, g.id); await loadGuardians(guardianStudent.id) }
    catch (e) { setGuardianError(e instanceof Error ? e.message : 'Unable to remove parent/guardian record.') }
  }
  function openGuardians(s: Student) {
    setGuardianStudent(s); setGuardians([]); setGuardianForm(emptyGuardian); setEditingGuardianId(null); setGuardianError(''); void loadGuardians(s.id)
  }

  const schoolName = institutionLoaded && institution.isActive ? institution.institutionName : ''
  const schoolBadge = institutionLoaded && institution.isActive ? institution.abbreviation : ''
  const schoolLogo = institutionLoaded && institution.isActive ? logoUrl(institution.logoPath) : ''
  return <section className="academic-workspace student-application-workspace" style={branding} aria-label="Student management workspace">
    <div className="student-application-toolbar">
      <div><p className="eyebrow">Student Management</p><h2>{readOnly ? 'Student records · Read-only' : 'Student applications & registry'}</h2></div>
      <div className="application-view-switch"><button type="button" className={view === 'application' ? 'active' : ''} onClick={() => setView('application')} disabled={!canManage}>New application</button><button type="button" className={view === 'registry' ? 'active' : ''} onClick={() => setView('registry')}>Student registry <span>{students.length}</span></button></div>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="info-banner" role="status">{notice}</div>}
    {view === 'application' && canManage && <form className="student-application-form" onSubmit={submitApplication}>
      <header className="application-paper-header">
        <div className="application-logo">{schoolLogo ? <img src={schoolLogo} alt={schoolName ? `${schoolName} logo` : 'Institution logo'} /> : <span aria-label="Institution logo not configured">Logo</span>}</div>
        <div className="application-institution-title">{schoolName ? <h1>{schoolName}</h1> : <h1>Institution settings unavailable</h1>}{schoolBadge && <span className="application-badge">{schoolBadge}</span>}{institution.motto && <p>{institution.motto}</p>}<h2>STUDENT ADMISSION APPLICATION FORM</h2></div>
        <label className="application-photo-upload"><span>{photoPreview ? <img src={photoPreview} alt="Applicant passport photograph preview" /> : 'Passport photograph'}</span><input type="file" accept="image/*" onChange={choosePhoto} /><small>Upload recent photo</small></label>
      </header>
      {!schoolName && <p className="application-settings-warning" role="status">The active institution name and branding have not loaded. Configure Institution Settings before printing or issuing this form.</p>}
      <div className="application-form-intro"><p>Complete every relevant section in clear BLOCK letters. Fields marked * are required.</p><label>Student / application number *<input value={studentNumber} onChange={e => setStudentNumber(e.target.value)} required /></label></div>
      <Section number="01" title="Admission information">
        <div className="application-grid">
          <Field label="Academic year *"><input value={application.academicYear} onChange={e => setApp('academicYear', e.target.value)} placeholder="e.g. 2027" required /></Field>
          <Field label="Intake *"><input value={application.intake} onChange={e => setApp('intake', e.target.value)} placeholder="e.g. January / August" required /></Field>
          <Field label="Course / programme applied for *"><input value={application.course} onChange={e => setApp('course', e.target.value)} required /></Field>
          <Field label="Entry status"><select value={application.entryStatus} onChange={e => setApp('entryStatus', e.target.value)}><option>Direct</option><option>Mature</option></select></Field>
          <Field label="Study programme"><select value={application.programme} onChange={e => setApp('programme', e.target.value)}><option>Day</option><option>Evening</option><option>Weekend</option></select></Field>
        </div>
      </Section>
      <Section number="02" title="Applicant personal information">
        <div className="application-grid">
          <Field label="First name *"><input value={application.firstName} onChange={e => setApp('firstName', e.target.value)} required /></Field>
          <Field label="Other names"><input value={application.otherNames} onChange={e => setApp('otherNames', e.target.value)} /></Field>
          <Field label="Surname / last name *"><input value={application.lastName} onChange={e => setApp('lastName', e.target.value)} required /></Field>
          <Field label="Date of birth"><input type="date" value={application.dateOfBirth} onChange={e => setApp('dateOfBirth', e.target.value)} /></Field>
          <Field label="Gender"><select value={application.gender} onChange={e => setApp('gender', e.target.value)}><option value="">Select</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></Field>
          <Field label="Home village"><input value={application.village} onChange={e => setApp('village', e.target.value)} /></Field>
          <Field label="Sub-county"><input value={application.subCounty} onChange={e => setApp('subCounty', e.target.value)} /></Field>
          <Field label="County / district"><input value={application.district} onChange={e => setApp('district', e.target.value)} /></Field>
          <Field label="Telephone number *"><input type="tel" value={application.phone} onChange={e => setApp('phone', e.target.value)} required /></Field>
          <Field label="Email address"><input type="email" value={application.email} onChange={e => setApp('email', e.target.value)} /></Field>
          <Field label="Nationality"><input value={application.nationality} onChange={e => setApp('nationality', e.target.value)} /></Field>
          <Field label="Religion"><input value={application.religion} onChange={e => setApp('religion', e.target.value)} /></Field>
          <Field label="Country of residence"><input value={application.countryOfResidence} onChange={e => setApp('countryOfResidence', e.target.value)} /></Field>
        </div>
      </Section>
      <Section number="03" title="Health status and medical information">
        <div className="application-grid">
          <Field label="Do you have any serious medical condition?"><select value={application.seriousCondition} onChange={e => setApp('seriousCondition', e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option></select></Field>
          {application.seriousCondition === 'Yes' && <Field label="Explain the condition" wide><textarea value={application.conditionDetails} onChange={e => setApp('conditionDetails', e.target.value)} rows={3} /></Field>}
          <Field label="Do you take medication regularly?"><select value={application.regularMedication} onChange={e => setApp('regularMedication', e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option></select></Field>
          {application.regularMedication === 'Yes' && <Field label="Medication details" wide><textarea value={application.medicationDetails} onChange={e => setApp('medicationDetails', e.target.value)} rows={3} /></Field>}
          <Field label="Special medication / support requirements" wide><textarea value={application.specialRequirements} onChange={e => setApp('specialRequirements', e.target.value)} rows={3} /></Field>
        </div>
        <p className="application-medical-note">The applicant is responsible for costs associated with specialised medical care or treatment not covered by the institution.</p>
      </Section>
      <Section number="04" title="Parent / guardian details">
        <div className="application-table-scroll"><table className="application-data-table"><thead><tr><th>Relationship</th><th>Full name</th><th>Address</th><th>Telephone</th><th>Occupation</th></tr></thead><tbody>
          <tr><th>Father</th><td><input aria-label="Father full name" value={application.fatherName} onChange={e => setApp('fatherName', e.target.value)} /></td><td><input aria-label="Father address" value={application.fatherAddress} onChange={e => setApp('fatherAddress', e.target.value)} /></td><td><input aria-label="Father telephone" value={application.fatherPhone} onChange={e => setApp('fatherPhone', e.target.value)} /></td><td><input aria-label="Father occupation" value={application.fatherOccupation} onChange={e => setApp('fatherOccupation', e.target.value)} /></td></tr>
          <tr><th>Mother</th><td><input aria-label="Mother full name" value={application.motherName} onChange={e => setApp('motherName', e.target.value)} /></td><td><input aria-label="Mother address" value={application.motherAddress} onChange={e => setApp('motherAddress', e.target.value)} /></td><td><input aria-label="Mother telephone" value={application.motherPhone} onChange={e => setApp('motherPhone', e.target.value)} /></td><td><input aria-label="Mother occupation" value={application.motherOccupation} onChange={e => setApp('motherOccupation', e.target.value)} /></td></tr>
        </tbody></table></div>
      </Section>
      <Section number="05" title="Sponsor details">
        <div className="application-grid">
          <Field label="Sponsor full name"><input value={application.sponsorName} onChange={e => setApp('sponsorName', e.target.value)} /></Field>
          <Field label="Relationship to applicant"><input value={application.sponsorRelationship} onChange={e => setApp('sponsorRelationship', e.target.value)} /></Field>
          <Field label="Sponsor address"><input value={application.sponsorAddress} onChange={e => setApp('sponsorAddress', e.target.value)} /></Field>
          <Field label="Sponsor telephone"><input value={application.sponsorPhone} onChange={e => setApp('sponsorPhone', e.target.value)} /></Field>
          <Field label="Sponsor occupation"><input value={application.sponsorOccupation} onChange={e => setApp('sponsorOccupation', e.target.value)} /></Field>
        </div>
      </Section>
      <Section number="06" title="Education background">
        
        <div className="application-table-scroll"><table className="application-data-table education-table"><thead><tr><th>School / institution</th><th>Location (city / country)</th><th>Date from</th><th>Date to</th><th>Qualification received</th><th>Average grade</th><th>Language of instruction</th><th className="no-print">Action</th></tr></thead><tbody>
          {education.map((row, i) => <tr key={i}><td><input aria-label={`Education ${i + 1} school`} value={row.school} onChange={e => setEducationField(i, 'school', e.target.value)} /></td><td><input aria-label={`Education ${i + 1} location`} value={row.location} onChange={e => setEducationField(i, 'location', e.target.value)} /></td><td><input aria-label={`Education ${i + 1} from`} value={row.from} onChange={e => setEducationField(i, 'from', e.target.value)} /></td><td><input aria-label={`Education ${i + 1} to`} value={row.to} onChange={e => setEducationField(i, 'to', e.target.value)} /></td><td><input aria-label={`Education ${i + 1} qualification`} value={row.qualification} onChange={e => setEducationField(i, 'qualification', e.target.value)} /></td><td><input aria-label={`Education ${i + 1} grade`} value={row.grade} onChange={e => setEducationField(i, 'grade', e.target.value)} /></td><td><input aria-label={`Education ${i + 1} language`} value={row.language} onChange={e => setEducationField(i, 'language', e.target.value)} /></td><td className="no-print"><button type="button" className="secondary-button" onClick={() => setEducation(rows => rows.filter((_, j) => i !== j))} disabled={education.length === 1}>Remove</button></td></tr>)}
        </tbody></table></div><button type="button" className="secondary-button no-print" onClick={() => setEducation(rows => [...rows, emptyEducation()])}>Add education row</button>
      </Section>
      <Section number="07" title="Declaration by applicant">
        <div className="application-declaration"><p>I declare that the information provided in this application is complete and accurate to the best of my knowledge. I understand that false or misleading information may result in the application being rejected or admission being withdrawn. I agree to abide by the institution's rules and regulations if admitted.</p><label className="application-checkbox"><input type="checkbox" checked={application.declaration} onChange={e => setApp('declaration', e.target.checked)} required /> I have read and agree to this declaration.</label></div>
        <div className="application-grid"><Field label="Applicant signature (type full legal name) *"><input value={application.applicantSignature} onChange={e => setApp('applicantSignature', e.target.value)} required /></Field><Field label="Date *"><input type="date" value={application.signatureDate} onChange={e => setApp('signatureDate', e.target.value)} required /></Field></div>
      </Section>
      <Section number="08" title="Official use only">
        <div className="application-official-only"><strong>Please do not write in this section.</strong><div className="application-grid">
          <Field label="Application fee (UGX)"><input value={application.applicationFee} readOnly /></Field><Field label="Payment status"><input value={application.feePaid} readOnly aria-readonly="true" /></Field>
          <Field label="Approved / reviewed by"><input value={application.approvedBy} readOnly aria-readonly="true" /></Field><Field label="Official signature"><input value={application.approvalSignature} readOnly aria-readonly="true" /></Field><Field label="Date"><input type="date" value={application.approvalDate} readOnly aria-readonly="true" /></Field>
        </div></div>
      </Section>
      <div className="application-actions no-print"><button type="button" className="secondary-button" onClick={() => window.print()}>Print application</button><button type="button" className="secondary-button" onClick={() => { setApplication(emptyApplication); setEducation([emptyEducation()]); setPhoto(null); setStudentNumber(''); }}>Clear form</button><button type="submit" disabled={saving || !institutionLoaded || !institution.isActive}>{saving ? 'Saving…' : 'Submit application'}</button></div>

    </form>}
    {view === 'registry' && <section className="panel student-registry-panel"><div className="panel-heading"><div><p className="eyebrow">Student Management</p><h3>{readOnly ? 'Student registry · Read-only' : 'Student registry'}</h3></div><span>{students.length} students</span></div>
      <div className="table-wrap"><table><thead><tr><th>Student number</th><th>Name</th><th>Gender</th><th>Phone</th><th>Email</th><th>Status</th><th>Parent / guardian</th><th>QR code</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={8}><LoadingSpinner label="Loading students…" /></td></tr> : students.length === 0 ? <tr><td colSpan={8} className="empty">No students registered.</td></tr> : students.map(s => <tr key={s.id}><td>{s.studentNumber}</td><td>{[s.firstName, s.otherNames, s.lastName].filter(Boolean).join(' ')}</td><td>{s.gender ?? '—'}</td><td>{s.phoneNumber ?? '—'}</td><td>{s.email ?? '—'}</td><td>{s.status}</td><td><button className="secondary-button" type="button" onClick={() => openGuardians(s)}>View / manage</button></td><td><button className="secondary-button" type="button" onClick={() => setQrStudentId(s.id)}>View QR</button></td></tr>)}
      </tbody></table></div>
    </section>}
    {qrStudentId && <div className="modal-backdrop" onClick={() => setQrStudentId(null)}><div className="auth-card" onClick={e => e.stopPropagation()}><p className="eyebrow">Student QR code</p><h3>{qrStudentId}</h3><img src={getStudentQrCode(qrStudentId)} alt="Student QR code" style={{ width: '100%', height: 'auto' }} /><button type="button" className="secondary-button" style={{ marginTop: 12 }} onClick={() => setQrStudentId(null)}>Close</button></div></div>}
    {guardianStudent && <div className="modal-backdrop" onClick={() => setGuardianStudent(null)}><div className="auth-card" style={{ width: 'min(900px, 96vw)', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
      <div className="panel-heading"><div><p className="eyebrow">Student record</p><h3>Parent / guardian details</h3><p>{guardianStudent.studentNumber} · {[guardianStudent.firstName, guardianStudent.otherNames, guardianStudent.lastName].filter(Boolean).join(' ')}</p></div><button type="button" className="secondary-button" onClick={() => setGuardianStudent(null)}>Close</button></div>
      {guardianError && <div className="error" role="alert">{guardianError}</div>}
      {guardianLoading ? <LoadingSpinner label="Loading parent/guardian records…" /> : guardians.length === 0 ? <p className="empty">No parent/guardian details are recorded for this student yet.</p> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Relationship</th><th>Address</th><th>Phone</th><th>Email</th><th>Primary</th>{canManage && <th>Actions</th>}</tr></thead><tbody>{guardians.map(g => <tr key={g.id}><td>{g.fullName}</td><td>{g.relationship || '—'}</td><td>{g.address || '—'}</td><td>{g.phoneNumber || '—'}</td><td>{g.email || '—'}</td><td>{g.isPrimary ? 'Yes' : 'No'}</td>{canManage && <td><button className="secondary-button" type="button" onClick={() => editGuardian(g)}>Edit</button><button className="secondary-button" type="button" onClick={() => void removeGuardian(g)}>Remove</button></td>}</tr>)}</tbody></table></div>}
      {canManage && <form className="student-form" onSubmit={saveGuardian}><h4>{editingGuardianId ? 'Edit parent / guardian' : 'Add another parent / guardian'}</h4><div className="form-grid">
        <label>Full name<input value={guardianForm.fullName} onChange={e => setGuardianForm({ ...guardianForm, fullName: e.target.value })} required /></label>
        <label>Relationship<select value={guardianForm.relationship} onChange={e => setGuardianForm({ ...guardianForm, relationship: e.target.value })} required><option value="">Select relationship</option><option>Parent</option><option>Mother</option><option>Father</option><option>Guardian</option><option>Sponsor</option><option>Other</option></select></label>
        <label>Address<input value={guardianForm.address} onChange={e => setGuardianForm({ ...guardianForm, address: e.target.value })} /></label>
        <label>Phone<input value={guardianForm.phoneNumber} onChange={e => setGuardianForm({ ...guardianForm, phoneNumber: e.target.value })} /></label>
        <label>Email<input type="email" value={guardianForm.email} onChange={e => setGuardianForm({ ...guardianForm, email: e.target.value })} /></label>
        <label className="checkbox-label"><input type="checkbox" checked={guardianForm.isPrimary} onChange={e => setGuardianForm({ ...guardianForm, isPrimary: e.target.checked })} /> Primary parent / guardian</label>
      </div><div className="form-actions"><button type="submit" disabled={guardianSaving}>{guardianSaving ? 'Saving…' : editingGuardianId ? 'Save changes' : 'Add guardian'}</button>{editingGuardianId && <button type="button" className="secondary-button" onClick={() => { setEditingGuardianId(null); setGuardianForm(emptyGuardian) }}>Cancel edit</button>}</div></form>}
    </div></div>}
  </section>
}
