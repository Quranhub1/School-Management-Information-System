import { useMemo, useState } from 'react'
import { AdmissionsManagement } from './AdmissionsManagement'
import { StudentManagement } from './StudentManagement'

type Section = 'biodata' | 'admissions' | 'indexing' | 'status' | 'cards'

const sections: { key: Section; label: string }[] = [
  { key: 'biodata', label: 'Bio-Data & Profiling' },
  { key: 'admissions', label: 'Admissions & Screening' },
  { key: 'indexing', label: 'UHPAB National Indexing' },
  { key: 'status', label: 'Enrollment & Status' },
  { key: 'cards', label: 'ID Card Generator' },
]

const statuses = ['Active', 'On Clinical Attachment', 'Retake/Repeat Year', 'Discontinued', 'Deferred', 'Graduated']

export function AdmissionsStudentManagement({ canManage = false }: { canManage?: boolean }) {
  const [section, setSection] = useState<Section>('biodata')
  const [indexNumber, setIndexNumber] = useState('')
  const [indexingStatus, setIndexingStatus] = useState('Not Indexed')
  const [studentStatus, setStudentStatus] = useState(statuses[0])

  const selected = useMemo(() => sections.find(item => item.key === section), [section])

  return (
    <section className="student-lifecycle-workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Student Lifecycle</p>
          <h2>Admissions & Student Management</h2>
          <p>Manage the student journey from application and screening through UHPAB indexing, enrollment, graduation and identity services.</p>
        </div>
      </header>

      <div className="student-lifecycle-tabs" role="tablist" aria-label="Admissions and student management">
        {sections.map(item => (
          <button key={item.key} className={section === item.key ? 'active' : ''} onClick={() => setSection(item.key)} role="tab" aria-selected={section === item.key}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="student-lifecycle-panel">
        <h3>{selected?.label}</h3>

        {section === 'biodata' && (
          <div>
            <p className="section-copy">Student records, national identification and education-history evidence.</p>
            <div className="feature-grid">
              <article className="feature-card"><strong>Bio-Data</strong><span>Student number, names, date of birth, gender, contacts and core profile.</span></article>
              <article className="feature-card"><strong>National ID / NIN</strong><span>Capture and maintain the student's national identification reference.</span></article>
              <article className="feature-card"><strong>Next of Kin</strong><span>Maintain next-of-kin contacts and relationship details.</span></article>
              <article className="feature-card"><strong>UNEB Records</strong><span>Capture O-Level and A-Level index numbers and pass-slip records.</span></article>
            </div>
            <StudentManagement canManage={canManage} />
          </div>
        )}

        {section === 'admissions' && (
          <div>
            <p className="section-copy">Application pipeline, eligibility screening and provisional admission processing.</p>
            <div className="feature-grid compact">
              <article className="feature-card"><strong>Eligibility checks</strong><span>Record programme-specific requirements, including Biology, Chemistry, Physics and Mathematics where applicable.</span></article>
              <article className="feature-card"><strong>Admission letters</strong><span>Generate and manage provisional admission documentation.</span></article>
            </div>
            <AdmissionsManagement />
          </div>
        )}

        {section === 'indexing' && (
          <div className="lifecycle-form-grid">
            <label>UHPAB Unified National Indexing Number<input value={indexNumber} onChange={e => setIndexNumber(e.target.value)} placeholder="Enter assigned UHPAB index number" /></label>
            <label>Indexing Status<select value={indexingStatus} onChange={e => setIndexingStatus(e.target.value)}><option>Not Indexed</option><option>Pending</option><option>Indexed</option><option>Rejected</option></select></label>
            <div className="feature-card full-width"><strong>Scope</strong><span>Track unified UHPAB indexing for nursing/midwifery and allied-health programmes, including the assigned number, programme and indexing status.</span></div>
            <div className="info-banner full-width">The indexing fields are currently a management workspace. National UHPAB submission/synchronisation requires the institution's authorised integration credentials and endpoint.</div>
          </div>
        )}

        {section === 'status' && (
          <div className="lifecycle-form-grid">
            <label>Enrollment / Student Status<select value={studentStatus} onChange={e => setStudentStatus(e.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
            <div className="feature-card"><strong>Current status</strong><span>{studentStatus}</span></div>
            <div className="feature-card full-width"><strong>Status workflow</strong><span>Active, On Clinical Attachment, Retake/Repeat Year, Discontinued, Deferred and Graduated.</span></div>
          </div>
        )}

        {section === 'cards' && (
          <div className="feature-grid">
            <article className="feature-card"><strong>Library ID Cards</strong><span>Prepare student library identity cards for batch production.</span><button className="secondary-button" type="button">Open Card Queue</button></article>
            <article className="feature-card"><strong>Campus ID Cards</strong><span>Prepare campus identity cards with student details.</span><button className="secondary-button" type="button">Open Card Queue</button></article>
            <article className="feature-card"><strong>Barcode / QR</strong><span>Identity cards are designed for barcode and QR-code identification.</span></article>
            <article className="feature-card"><strong>Batch Printing</strong><span>Organize selected students into printable card batches.</span></article>
          </div>
        )}
      </div>
    </section>
  )
}
