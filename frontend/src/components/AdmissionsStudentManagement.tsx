import { useMemo, useState } from 'react'
import { AdmissionsManagement } from './AdmissionsManagement'
import { StudentManagement } from './StudentManagement'
import { AlumniManagement } from './AlumniManagement'

type Section = 'biodata' | 'admissions' | 'indexing' | 'status' | 'cards' | 'national-results' | 'alumni'
type AccessProfile = 'receptionist' | 'records' | 'department' | 'general'

const sections: { key: Section; label: string }[] = [
  { key: 'biodata', label: 'Bio-Data & Profiling' },
  { key: 'admissions', label: 'Admissions & Screening' },
  { key: 'indexing', label: 'UHPAB National Indexing' },
  { key: 'status', label: 'Enrollment & Status' },
  { key: 'cards', label: 'ID Card Generator' },
  { key: 'national-results', label: 'National Results' },
  { key: 'alumni', label: 'Alumni & Graduates' },
]

const statuses = ['Active', 'On Clinical Attachment', 'Retake/Repeat Year', 'Discontinued', 'Deferred', 'Graduated']

export function AdmissionsStudentManagement({ canManage = false, readOnly = false, accessProfile = 'general' }: { canManage?: boolean; readOnly?: boolean; accessProfile?: AccessProfile }) {
  const [section, setSection] = useState<Section>('biodata')
  const [uhpabNumber, setUhpabNumber] = useState('')
  const [legacyRegistrationNumber, setLegacyRegistrationNumber] = useState('')
  const [indexingStatus, setIndexingStatus] = useState('Not Indexed')
  const [uvtabRegistrationNumber, setUvtabRegistrationNumber] = useState('')
  const [studentStatus, setStudentStatus] = useState(statuses[0])
  const visibleSections = readOnly
    ? sections.filter(item => accessProfile === 'receptionist' ? ['biodata', 'admissions'].includes(item.key) : accessProfile === 'department' ? item.key === 'biodata' : accessProfile === 'records' ? ['biodata', 'admissions', 'status'].includes(item.key) : ['biodata', 'admissions', 'status'].includes(item.key))
    : sections
  const selected = useMemo(() => visibleSections.find(item => item.key === section), [visibleSections, section])

  return (
    <section className="student-lifecycle-workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Student Lifecycle</p>
          <h2>{readOnly ? 'Student Records · Read-only' : 'Admissions & Student Management'}</h2>
        </div>
      </header>

      <div className="student-lifecycle-tabs" role="tablist" aria-label="Admissions and student management">
        {visibleSections.map(item => (
          <button key={item.key} className={section === item.key ? 'active' : ''} onClick={() => setSection(item.key)} role="tab" aria-selected={section === item.key}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="student-lifecycle-panel">
        <h3>{selected?.label}</h3>

        {section === 'biodata' && (
          <div>
            <div className="feature-grid">
              <article className="feature-card"><strong>Bio-Data</strong></article>
              <article className="feature-card"><strong>National ID / NIN</strong></article>
              <article className="feature-card"><strong>Next of Kin</strong></article>
              <article className="feature-card"><strong>UNEB Records</strong></article>
            </div>
            <StudentManagement canManage={canManage} readOnly={readOnly} />
          </div>
        )}

        {section === 'admissions' && (
          <div>
            <div className="feature-grid compact">
              <article className="feature-card"><strong>Eligibility checks</strong></article>
              <article className="feature-card"><strong>Admission letters</strong></article>
            </div>
            <AdmissionsManagement readOnly={readOnly} />
          </div>
        )}

        {section === 'indexing' && (
          <div className="lifecycle-form-grid">
            <label>UHPAB HTIN<input value={uhpabNumber} onChange={e => setUhpabNumber(e.target.value)} placeholder="Health Trainee Identification Number" /></label>
            <label>Indexing Status<select value={indexingStatus} onChange={e => setIndexingStatus(e.target.value)}><option>Not Indexed</option><option>Pending</option><option>Indexed</option><option>Rejected</option></select></label>
            <label>Legacy UHPAB Registration / NSIN<input value={legacyRegistrationNumber} onChange={e => setLegacyRegistrationNumber(e.target.value)} placeholder="For trainees covered by earlier registration arrangements" /></label>
            <label>UVTAB Registration Number<input value={uvtabRegistrationNumber} onChange={e => setUvtabRegistrationNumber(e.target.value)} placeholder="TVET assessment registration number" /></label>
          </div>
        )}

        {section === 'status' && (
          <div className="lifecycle-form-grid">
            <label>Enrollment / Student Status<select value={studentStatus} onChange={e => setStudentStatus(e.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
          </div>
        )}

        {section === 'cards' && (
          <div className="feature-grid">
            <article className="feature-card"><strong>Library ID Cards</strong><button className="secondary-button" type="button">Open Card Queue</button></article>
            <article className="feature-card"><strong>Campus ID Cards</strong><button className="secondary-button" type="button">Open Card Queue</button></article>
            <article className="feature-card"><strong>Barcode / QR</strong></article>
            <article className="feature-card"><strong>Batch Printing</strong></article>
          </div>
        )}

        {section === 'alumni' && (
          <div>
            <AlumniManagement />
          </div>
        )}

        {section === 'national-results' && (
          <div className="feature-grid">
            <article className="feature-card"><strong>UHPAB Results</strong></article>
            <article className="feature-card"><strong>UVTAB Results</strong></article>
          </div>
        )}
      </div>
    </section>
  )
}