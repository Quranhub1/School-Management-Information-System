import { useEffect, useMemo, useState } from 'react'
import { AdmissionsManagement } from './AdmissionsManagement'
import { StudentManagement } from './StudentManagement'
import { AlumniManagement } from './AlumniManagement'
import { getStudents, type Student } from '../api/students'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useInstitutionSettings } from './InstitutionSettingsContext'
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/feat/pdfmake-document-engine-main-sync
import { downloadElementAsPng } from '../lib/printCapture'
=======
>>>>>>> origin/feat/pdfmake-document-engine
=======
>>>>>>> origin/feat/pdfmake-document-engine-latest-main

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

export function AdmissionsStudentManagement({ canManage = false, readOnly = false, accessProfile = 'general', activeSubsection = null }: { canManage?: boolean; readOnly?: boolean; accessProfile?: AccessProfile; activeSubsection?: string | null }) {
  const { institution, loaded: institutionLoaded } = useInstitutionSettings()
  const [section, setSection] = useState<Section>('biodata')
  const [uhpabNumber, setUhpabNumber] = useState('')
  const [legacyRegistrationNumber, setLegacyRegistrationNumber] = useState('')
  const [indexingStatus, setIndexingStatus] = useState('Not Indexed')
  const [uvtabRegistrationNumber, setUvtabRegistrationNumber] = useState('')
  const [studentStatus, setStudentStatus] = useState(statuses[0])
  const [cardType, setCardType] = useState<'campus' | 'library'>('campus')
  const [cardStudents, setCardStudents] = useState<Student[]>([])
  const [selectedCardStudentIds, setSelectedCardStudentIds] = useState<string[]>([])
  const [cardQueueLoading, setCardQueueLoading] = useState(false)
  const [cardQueueError, setCardQueueError] = useState('')
  const [cardQueueNotice, setCardQueueNotice] = useState('')

  // Prop synchronization also handles navigation into Students from another module,
  // where the sidebar event can fire before this component has mounted.
  useEffect(() => {
    if (activeSubsection === 'records') setSection('biodata')
    else if (activeSubsection === 'registration') setSection('admissions')
  }, [activeSubsection])

  // Keep the sidebar's Students > Records destination synchronized with this workspace.
  useEffect(() => {
    const handleSubsectionNavigation = (event: Event) => {
      const detail = (event as CustomEvent<{ module?: string; subsection?: string }>).detail
      if (detail?.module !== 'students' || !detail.subsection) return
      if (detail.subsection === 'records') setSection('biodata')
      else if (detail.subsection === 'registration') setSection('admissions')
    }
    window.addEventListener('smis:navigate-subsection', handleSubsectionNavigation)
    return () => window.removeEventListener('smis:navigate-subsection', handleSubsectionNavigation)
  }, [])

  useEffect(() => {
    if (section !== 'cards') return
    let cancelled = false
    setCardQueueLoading(true)
    setCardQueueError('')
    getStudents()
      .then(items => {
        if (!cancelled) setCardStudents(items)
      })
      .catch(error => {
        if (!cancelled) setCardQueueError(error instanceof Error ? error.message : 'Unable to load students for ID cards.')
      })
      .finally(() => {
        if (!cancelled) setCardQueueLoading(false)
      })
    return () => { cancelled = true }
  }, [section])

  function toggleCardStudent(studentId: string) {
    setSelectedCardStudentIds(current => current.includes(studentId)
      ? current.filter(id => id !== studentId)
      : [...current, studentId])
    setCardQueueNotice('')
  }

  function printSelectedCards() {
    if (selectedCardStudentIds.length === 0) {
      setCardQueueError('Select at least one student before printing ID cards.')
      return
    }
    setCardQueueError('')
    setCardQueueNotice(`Preparing ${selectedCardStudentIds.length} ${cardType === 'campus' ? 'campus' : 'library'} ID card(s) for printing.`)
    printInstitutionalPdf(cardPdfOptions())
  }

  function cardPdfOptions() {
    const selectedStudents = cardStudents.filter(student => selectedCardStudentIds.includes(student.id))
    const cards = selectedStudents.map(student => ({
      stack: [
        { text: cardType === 'campus' ? 'STUDENT ID CARD' : 'LIBRARY ID CARD', bold: true, color: institutionLoaded && institution.isActive ? institution.primaryColor : '#166534', fontSize: 11, margin: [0, 0, 0, 12] },
        { text: institutionLoaded && institution.isActive ? institution.institutionName : 'Institutional identification', bold: true, fontSize: 12, margin: [0, 0, 0, 8] },
        { text: [student.firstName, student.otherNames, student.lastName].filter(Boolean).join(' '), bold: true, fontSize: 15, margin: [0, 0, 0, 8] },
        { columns: [{ text: [{ text: 'Student number: ', bold: true }, student.studentNumber] }, { text: [{ text: 'Status: ', bold: true }, student.status || 'Active'], alignment: 'right' }] },
        { text: 'Keep this card for institutional identification.', fontSize: 8, color: '#64748b', margin: [0, 10, 0, 0] },
      ],
      margin: [8, 8, 8, 8],
      fillColor: '#ffffff',
    }))
    const body = []
    for (let index = 0; index < cards.length; index += 2) body.push([cards[index], cards[index + 1] || { text: '' }])
    return {
      title: cardType === 'campus' ? 'Campus ID Cards' : 'Library ID Cards',
      filename: 'smis-' + cardType + '-id-cards',
      institutionName: institutionLoaded && institution.isActive ? institution.institutionName : undefined,
      motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
      contactLines: institutionLoaded && institution.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
      accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
      content: [{ table: { widths: ['*', '*'], body }, layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#cbd5e1', vLineColor: () => '#cbd5e1', paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 10, paddingBottom: () => 10 } }],
    }
  }

  function downloadSelectedCards() {
    if (selectedCardStudentIds.length) downloadInstitutionalPdf(cardPdfOptions())
  }

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
<<<<<<< HEAD
          
=======
>>>>>>> origin/kilo/golden-circuit-3yz
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
<<<<<<< HEAD
=======
            <div className="feature-grid">
              <article className="feature-card"><strong>Bio-Data</strong></article>
              <article className="feature-card"><strong>National ID / NIN</strong></article>
              <article className="feature-card"><strong>Next of Kin</strong></article>
              <article className="feature-card"><strong>UNEB Records</strong></article>
            </div>
>>>>>>> origin/kilo/golden-circuit-3yz
            <StudentManagement canManage={canManage} readOnly={readOnly} />
          </div>
        )}

        {section === 'admissions' && (
          <div>
<<<<<<< HEAD
=======
            <div className="feature-grid compact">
              <article className="feature-card"><strong>Eligibility checks</strong></article>
              <article className="feature-card"><strong>Admission letters</strong></article>
            </div>
>>>>>>> origin/kilo/golden-circuit-3yz
            <AdmissionsManagement readOnly={readOnly} />
          </div>
        )}

        {section === 'indexing' && (
          <div className="lifecycle-form-grid">
            <label>UHPAB HTIN<input value={uhpabNumber} onChange={e => setUhpabNumber(e.target.value)} placeholder="Health Trainee Identification Number" /></label>
            <label>Indexing Status<select value={indexingStatus} onChange={e => setIndexingStatus(e.target.value)}><option>Not Indexed</option><option>Pending</option><option>Indexed</option><option>Rejected</option></select></label>
            <label>Legacy UHPAB Registration / NSIN<input value={legacyRegistrationNumber} onChange={e => setLegacyRegistrationNumber(e.target.value)} placeholder="For trainees covered by earlier registration arrangements" /></label>
            <label>UVTAB Registration Number<input value={uvtabRegistrationNumber} onChange={e => setUvtabRegistrationNumber(e.target.value)} placeholder="TVET assessment registration number" /></label>
<<<<<<< HEAD
            <div className="feature-card full-width"><strong>Regulatory identity</strong><span>For UHPAB, new health trainees are tracked with HTIN while applicable earlier cohorts retain their existing registration/NSIN identifiers. UVTAB learners use their assessment registration number for the candidate/results journey.</span></div>
            <div className="info-banner full-width">External UHPAB/UVTAB integration is not configured.</div>
=======
>>>>>>> origin/kilo/golden-circuit-3yz
          </div>
        )}

        {section === 'status' && (
          <div className="lifecycle-form-grid">
            <label>Enrollment / Student Status<select value={studentStatus} onChange={e => setStudentStatus(e.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
<<<<<<< HEAD
            <div className="feature-card"><strong>Current status</strong><span>{studentStatus}</span></div>
=======
>>>>>>> origin/kilo/golden-circuit-3yz
          </div>
        )}

        {section === 'cards' && (
<<<<<<< HEAD
          <section className="panel" aria-label="Student ID card queue">
            <div className="panel-heading">
              <div><p className="eyebrow">STUDENT SERVICES</p><h3>ID Card Queue</h3></div>
              <label>Card type<select value={cardType} onChange={event => { setCardType(event.target.value as 'campus' | 'library'); setCardQueueNotice('') }}><option value="campus">Campus ID</option><option value="library">Library ID</option></select></label>
            </div>
            {cardQueueError && <div className="error" role="alert">{cardQueueError}</div>}
            {cardQueueNotice && <div className="info-banner" role="status">{cardQueueNotice}</div>}
            <div className="form-actions no-print" style={{ marginBottom: 12 }}>
              <button type="button" className="secondary-button" onClick={() => setSelectedCardStudentIds(cardStudents.map(student => student.id))} disabled={cardQueueLoading || cardStudents.length === 0}>Select all</button>
              <button type="button" className="secondary-button" onClick={() => setSelectedCardStudentIds([])} disabled={selectedCardStudentIds.length === 0}>Clear selection</button>
              <button type="button" className="secondary-button" onClick={printSelectedCards} disabled={cardQueueLoading || selectedCardStudentIds.length === 0}>Print selected cards ({selectedCardStudentIds.length})</button>
              <button type="button" onClick={downloadSelectedCards} disabled={cardQueueLoading || selectedCardStudentIds.length === 0}>Download PDF</button>
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/feat/pdfmake-document-engine-main-sync
              <button type="button" className="secondary-button" onClick={() => {
                const element = document.getElementById('print-queue-section')
                if (element) void downloadElementAsPng(element, { filename: `student-${cardType}-id-cards.png` }).catch(error => setCardQueueError(error instanceof Error ? error.message : 'Unable to capture ID cards.'))
              }} disabled={cardQueueLoading || selectedCardStudentIds.length === 0}>Download PNG</button>
<<<<<<< HEAD
=======
>>>>>>> origin/feat/pdfmake-document-engine
=======
>>>>>>> origin/feat/pdfmake-document-engine-latest-main
=======
>>>>>>> origin/feat/pdfmake-document-engine-main-sync
            </div>
            {cardQueueLoading ? <p className="empty">Loading registered students…</p> : cardStudents.length === 0 ? <p className="empty">No registered students are available for ID card printing.</p> : (
              <div className="table-wrap no-print">
                <table>
                  <thead><tr><th>Select</th><th>Student number</th><th>Student name</th><th>Status</th></tr></thead>
                  <tbody>{cardStudents.map(student => <tr key={student.id}>
                    <td><input type="checkbox" aria-label={`Select ${student.studentNumber}`} checked={selectedCardStudentIds.includes(student.id)} onChange={() => toggleCardStudent(student.id)} /></td>
                    <td>{student.studentNumber}</td>
                    <td>{[student.firstName, student.otherNames, student.lastName].filter(Boolean).join(' ')}</td>
                    <td>{student.status}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
            <div id="print-queue-section" className="student-id-card-print-grid">
              {cardStudents.filter(student => selectedCardStudentIds.includes(student.id)).map(student => (
                <article key={student.id} className="student-id-card">
                  <header><strong>{cardType === 'campus' ? 'STUDENT ID CARD' : 'LIBRARY ID CARD'}</strong></header>
                  <div><span>Student number</span><strong>{student.studentNumber}</strong></div>
                  <h4>{[student.firstName, student.otherNames, student.lastName].filter(Boolean).join(' ')}</h4>
                  <div><span>Status</span><strong>{student.status || 'Active'}</strong></div>
                  <small>Keep this card for institutional identification.</small>
                </article>
              ))}
            </div>
            <style>{`
              .student-id-card-print-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-top: 18px; }
              .student-id-card { min-height: 145px; padding: 14px; border: 1px solid #cbd5e1; border-radius: 10px; background: white; color: #0f172a; break-inside: avoid; }
              .student-id-card header { padding-bottom: 8px; margin-bottom: 10px; border-bottom: 2px solid #1d4ed8; color: #1d4ed8; font-size: 12px; letter-spacing: .08em; }
              .student-id-card h4 { margin: 8px 0; font-size: 18px; }
              .student-id-card div { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
              .student-id-card small { display: block; margin-top: 12px; color: #475569; }
              @media print { .student-id-card-print-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .student-id-card { box-shadow: none; } }
            `}</style>
          </section>
=======
          <div className="feature-grid">
            <article className="feature-card"><strong>Library ID Cards</strong><button className="secondary-button" type="button">Open Card Queue</button></article>
            <article className="feature-card"><strong>Campus ID Cards</strong><button className="secondary-button" type="button">Open Card Queue</button></article>
            <article className="feature-card"><strong>Barcode / QR</strong></article>
            <article className="feature-card"><strong>Batch Printing</strong></article>
          </div>
>>>>>>> origin/kilo/golden-circuit-3yz
        )}

        {section === 'alumni' && (
          <div>
            <AlumniManagement />
          </div>
        )}

        {section === 'national-results' && (
          <div className="feature-grid">
<<<<<<< HEAD
            <article className="feature-card">
              <strong>UHPAB Results</strong>
              <button className="secondary-button" type="button" disabled>UHPAB Results Integration — Coming Soon</button>
            </article>
            <article className="feature-card">
              <strong>UVTAB Results</strong>
              <button className="secondary-button" type="button" disabled>UVTAB Results Integration — Coming Soon</button>
            </article>
=======
            <article className="feature-card"><strong>UHPAB Results</strong></article>
            <article className="feature-card"><strong>UVTAB Results</strong></article>
>>>>>>> origin/kilo/golden-circuit-3yz
          </div>
        )}
      </div>
    </section>
  )
}