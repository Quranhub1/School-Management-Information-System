import { useEffect, useState, type FormEvent } from 'react'
import {
  getResidentDirectorDashboard,
  getResidentDirectorStudents,
  getResidentDirectorStaff,
  getResidentDirectorHostelStatus,
  getResidentDirectorAttendanceSummary,
  getResidentDirectorWelfareAlerts,
  type ResidentDirectorDashboard,
  type StudentOverview,
  type StaffOverview,
  type HostelStatus,
  type AttendanceSummary,
  type WelfareAlerts,
} from '../api/residentDirector'
import {
  getRegulatoryRegistrations,
  createRegulatoryRegistration,
  getRegulatoryAssessments,
  createRegulatoryAssessment,
  getContinuousAssessments,
  createContinuousAssessment,
  getAssessmentResults,
  createAssessmentResult,
  getAssessmentCentres,
  createAssessmentCentre,
  getRegulatoryCirculars,
  createRegulatoryCircular,
  type RegulatoryRegistration,
  type RegulatoryAssessment,
  type ContinuousAssessment,
  type AssessmentResult,
  type AssessmentCentre,
  type RegulatoryCircular,
} from '../api/regulatory'

type MainTab = 'overview' | 'students' | 'staff' | 'hostel' | 'welfare' | 'registrations' | 'assessments' | 'continuous' | 'results' | 'centres' | 'circulars'

export function ResidentDirectorDashboard() {
  const [mainTab, setMainTab] = useState<MainTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<ResidentDirectorDashboard | null>(null)
  const [students, setStudents] = useState<StudentOverview[]>([])
  const [staff, setStaff] = useState<StaffOverview[]>([])
  const [hostel, setHostel] = useState<HostelStatus | null>(null)
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null)
  const [welfare, setWelfare] = useState<WelfareAlerts | null>(null)

  const [registrations, setRegistrations] = useState<RegulatoryRegistration[]>([])
  const [assessments, setAssessments] = useState<RegulatoryAssessment[]>([])
  const [continuous, setContinuous] = useState<ContinuousAssessment[]>([])
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [centres, setCentres] = useState<AssessmentCentre[]>([])
  const [circulars, setCirculars] = useState<RegulatoryCircular[]>([])

  const [regulatoryBody, setRegulatoryBody] = useState('UHPAB')
  const [subTab, setSubTab] = useState('list')

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [dash, studentsData, staffData, hostelData, attendanceData, welfareData, regs, assmts, cont, res, cents, circs] = await Promise.all([
        getResidentDirectorDashboard(),
        getResidentDirectorStudents(),
        getResidentDirectorStaff(),
        getResidentDirectorHostelStatus(),
        getResidentDirectorAttendanceSummary(),
        getResidentDirectorWelfareAlerts(),
        getRegulatoryRegistrations(regulatoryBody || undefined),
        getRegulatoryAssessments(regulatoryBody || undefined),
        getContinuousAssessments(),
        getAssessmentResults(regulatoryBody || undefined),
        getAssessmentCentres(),
        getRegulatoryCirculars(regulatoryBody || undefined),
      ])
      setDashboard(dash)
      setStudents(studentsData)
      setStaff(staffData)
      setHostel(hostelData)
      setAttendance(attendanceData)
      setWelfare(welfareData)
      setRegistrations(regs)
      setAssessments(assmts)
      setContinuous(cont)
      setResults(res)
      setCentres(cents)
      setCirculars(circs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load resident director dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [regulatoryBody])

  function getStatusColor(status: string): string {
    if (status === 'Active' || status === 'Paid' || status === 'Released' || status === 'Registered' || status === 'Occupied') return '#059669'
    if (status === 'Pending' || status === 'Approved' || status === 'Scheduled' || status === 'Submitted') return '#d97706'
    return '#dc2626'
  }

  return (
    <section className="panel" aria-label="Resident Director dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RESIDENT DIRECTOR</span>
          <h2>Resident Director Dashboard</h2>
        </div>
        <button className="secondary-button" onClick={() => void loadAll()}>Refresh</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Resident Director sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={mainTab === 'overview'} className={mainTab === 'overview' ? 'active' : ''} onClick={() => setMainTab('overview')}>Overview</button>
        <button role="tab" aria-selected={mainTab === 'students'} className={mainTab === 'students' ? 'active' : ''} onClick={() => setMainTab('students')}>Students</button>
        <button role="tab" aria-selected={mainTab === 'staff'} className={mainTab === 'staff' ? 'active' : ''} onClick={() => setMainTab('staff')}>Staff</button>
        <button role="tab" aria-selected={mainTab === 'hostel'} className={mainTab === 'hostel' ? 'active' : ''} onClick={() => setMainTab('hostel')}>Hostel</button>
        <button role="tab" aria-selected={mainTab === 'welfare'} className={mainTab === 'welfare' ? 'active' : ''} onClick={() => setMainTab('welfare')}>Welfare</button>
        <button role="tab" aria-selected={mainTab === 'registrations'} className={mainTab === 'registrations' ? 'active' : ''} onClick={() => setMainTab('registrations')}>UHPAB/UVTAB Registration</button>
        <button role="tab" aria-selected={mainTab === 'assessments'} className={mainTab === 'assessments' ? 'active' : ''} onClick={() => setMainTab('assessments')}>Assessments</button>
        <button role="tab" aria-selected={mainTab === 'continuous'} className={mainTab === 'continuous' ? 'active' : ''} onClick={() => setMainTab('continuous')}>Continuous Assessment</button>
        <button role="tab" aria-selected={mainTab === 'results'} className={mainTab === 'results' ? 'active' : ''} onClick={() => setMainTab('results')}>Results</button>
        <button role="tab" aria-selected={mainTab === 'centres'} className={mainTab === 'centres' ? 'active' : ''} onClick={() => setMainTab('centres')}>Centres</button>
        <button role="tab" aria-selected={mainTab === 'circulars'} className={mainTab === 'circulars' ? 'active' : ''} onClick={() => setMainTab('circulars')}>Circulars</button>
      </div>

      {loading ? (
        <p className="empty">Loading resident director data…</p>
      ) : (
        <>
          {mainTab === 'overview' && dashboard && (
            <>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Total Students</span>
                  <strong>{dashboard.totalStudents}</strong>
                </div>
                <div className="summary-card">
                  <span>Active Students</span>
                  <strong style={{ color: '#059669' }}>{dashboard.activeStudents}</strong>
                </div>
                <div className="summary-card">
                  <span>Total Staff</span>
                  <strong>{dashboard.totalStaff}</strong>
                </div>
                <div className="summary-card">
                  <span>Programmes</span>
                  <strong>{dashboard.totalProgrammes}</strong>
                </div>
                <div className="summary-card">
                  <span>Outstanding Invoices</span>
                  <strong style={{ color: '#dc2626' }}>{dashboard.outstandingInvoices}</strong>
                </div>
                <div className="summary-card">
                  <span>Total Invoices</span>
                  <strong>{dashboard.totalInvoices}</strong>
                </div>
              </div>

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">ADMISSIONS</span>
                    <h3>Recent Admissions</h3>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Programme</th>
                        <th>Academic Year</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentAdmissions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty">No recent admissions</td>
                        </tr>
                      ) : (
                        dashboard.recentAdmissions.map(admission => (
                          <tr key={admission.id}>
                            <td>
                              <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(admission.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                                {admission.status}
                              </span>
                            </td>
                            <td>{admission.programmeId}</td>
                            <td>{admission.academicYearId}</td>
                            <td>{new Date(admission.createdAt).toLocaleDateString('en-UG')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">FINANCE</span>
                    <h3>Outstanding Balances</h3>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Programme</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.outstandingBalances.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty">No outstanding balances</td>
                        </tr>
                      ) : (
                        dashboard.outstandingBalances.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.studentNumber}</strong> {item.studentName}</td>
                            <td>{item.programmeName}</td>
                            <td style={{ color: '#dc2626', fontWeight: 700 }}>{item.currency} {item.balance.toLocaleString()}</td>
                            <td>
                              <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#dc2626', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                                Outstanding
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {mainTab === 'students' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">STUDENTS</span>
                  <h3>All Students ({students.length})</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student No.</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Status</th>
                      <th>Admission ID</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty">No students found</td>
                      </tr>
                    ) : (
                      students.map(student => (
                        <tr key={student.id}>
                          <td><strong>{student.studentNumber}</strong></td>
                          <td>{student.firstName} {student.otherNames} {student.lastName}</td>
                          <td>{student.gender || '—'}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(student.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {student.status}
                            </span>
                          </td>
                          <td>{student.admissionId || '—'}</td>
                          <td>{new Date(student.createdAt).toLocaleDateString('en-UG')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'staff' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">STAFF</span>
                  <h3>All Staff ({staff.length})</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Staff No.</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty">No staff found</td>
                      </tr>
                    ) : (
                      staff.map(member => (
                        <tr key={member.id}>
                          <td><strong>{member.staffNumber}</strong></td>
                          <td>{member.firstName} {member.otherNames} {member.lastName}</td>
                          <td>{member.email || '—'}</td>
                          <td>{member.phoneNumber || '—'}</td>
                          <td>{member.department || '—'}</td>
                          <td>{member.position || '—'}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(member.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {member.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'hostel' && hostel && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">HOSTEL</span>
                  <h3>Hostel Status</h3>
                </div>
              </div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Total Houses</span>
                  <strong>{hostel.totalHouses}</strong>
                </div>
                <div className="summary-card">
                  <span>Total Rooms</span>
                  <strong>{hostel.totalRooms}</strong>
                </div>
                <div className="summary-card">
                  <span>Total Beds</span>
                  <strong>{hostel.totalBeds}</strong>
                </div>
                <div className="summary-card">
                  <span>Occupied Beds</span>
                  <strong style={{ color: '#059669' }}>{hostel.occupiedBeds}</strong>
                </div>
                <div className="summary-card">
                  <span>Available Beds</span>
                  <strong style={{ color: '#d97706' }}>{hostel.availableBeds}</strong>
                </div>
                <div className="summary-card">
                  <span>Occupancy Rate</span>
                  <strong>{hostel.occupancyRate}%</strong>
                </div>
              </div>
              <p className="empty">Hostel management module available for detailed operations.</p>
            </div>
          )}

          {mainTab === 'welfare' && welfare && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">WELFARE</span>
                  <h3>Welfare Alerts ({welfare.totalAlerts})</h3>
                </div>
              </div>

              <h4 style={{ marginBottom: 10 }}>Students with Large Fee Balances</h4>
              <div className="table-wrap" style={{ marginBottom: 22 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Programme</th>
                      <th>Balance</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {welfare.studentsWithLargeBalances.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty">No students with large balances</td>
                      </tr>
                    ) : (
                      welfare.studentsWithLargeBalances.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.studentNumber}</strong> {item.studentName}</td>
                          <td>{item.programmeName}</td>
                          <td style={{ color: '#dc2626', fontWeight: 700 }}>{item.currency} {item.balance?.toLocaleString()}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#dc2626', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {item.alertType}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <h4 style={{ marginBottom: 10 }}>Recent Absences</h4>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Date</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {welfare.absentStudents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty">No recent absences</td>
                      </tr>
                    ) : (
                      welfare.absentStudents.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.studentName}</strong></td>
                          <td>{item.date ? new Date(item.date).toLocaleDateString('en-UG') : '—'}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#d97706', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {item.alertType}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'registrations' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">UHPAB/UVTAB</span>
                  <h3>Student Registrations</h3>
                </div>
                <select value={regulatoryBody} onChange={e => setRegulatoryBody(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="UHPAB">UHPAB</option>
                  <option value="UVTAB">UVTAB</option>
                </select>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Registration No.</th>
                      <th>Student</th>
                      <th>Programme</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Assessment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty">No registrations found</td>
                      </tr>
                    ) : (
                      registrations.map(reg => (
                        <tr key={reg.id}>
                          <td><strong>{reg.registrationNumber}</strong></td>
                          <td>{reg.studentId}</td>
                          <td>{reg.programmeName} ({reg.programmeCode})</td>
                          <td>{reg.level}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(reg.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {reg.status}
                            </span>
                          </td>
                          <td>{reg.assessmentDate ? new Date(reg.assessmentDate).toLocaleDateString('en-UG') : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'assessments' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">UHPAB/UVTAB</span>
                  <h3>Assessments</h3>
                </div>
                <select value={regulatoryBody} onChange={e => setRegulatoryBody(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="UHPAB">UHPAB</option>
                  <option value="UVTAB">UVTAB</option>
                </select>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Pass Mark</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty">No assessments found</td>
                      </tr>
                    ) : (
                      assessments.map(a => (
                        <tr key={a.id}>
                          <td><strong>{a.assessmentCode}</strong></td>
                          <td>{a.title}</td>
                          <td>{a.assessmentType}</td>
                          <td>{a.durationMinutes} mins</td>
                          <td>{a.passMark}/{a.totalMarks}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(a.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'continuous' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">UHPAB/UVTAB</span>
                  <h3>Continuous Assessments (SBA)</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Score</th>
                      <th>Logbook</th>
                      <th>Report</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {continuous.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty">No continuous assessments found</td>
                      </tr>
                    ) : (
                      continuous.map(c => (
                        <tr key={c.id}>
                          <td>{c.assessmentType}</td>
                          <td>{c.title}</td>
                          <td>{c.score}/{c.maxScore}</td>
                          <td>{c.logbookReference || '—'}</td>
                          <td>{c.reportReference || '—'}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(c.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'results' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">UHPAB/UVTAB</span>
                  <h3>Assessment Results</h3>
                </div>
                <select value={regulatoryBody} onChange={e => setRegulatoryBody(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="UHPAB">UHPAB</option>
                  <option value="UVTAB">UVTAB</option>
                </select>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Result</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty">No results found</td>
                      </tr>
                    ) : (
                      results.map(r => (
                        <tr key={r.id}>
                          <td>{r.studentId}</td>
                          <td>{r.score}</td>
                          <td><strong>{r.grade}</strong></td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: r.passed ? '#059669' : '#dc2626', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {r.passed ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(r.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'centres' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">UHPAB/UVTAB</span>
                  <h3>Assessment Centres</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Regulatory Body</th>
                      <th>Contact</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centres.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty">No assessment centres found</td>
                      </tr>
                    ) : (
                      centres.map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.centreCode}</strong></td>
                          <td>{c.centreName}</td>
                          <td>{c.regulatoryBody}</td>
                          <td>{c.contactPerson || '—'}<br/>{c.phone || '—'}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(c.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'circulars' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">UHPAB/UVTAB</span>
                  <h3>Regulatory Circulars</h3>
                </div>
                <select value={regulatoryBody} onChange={e => setRegulatoryBody(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="UHPAB">UHPAB</option>
                  <option value="UVTAB">UVTAB</option>
                </select>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Circular No.</th>
                      <th>Title</th>
                      <th>Issue Date</th>
                      <th>Deadline</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {circulars.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty">No circulars found</td>
                      </tr>
                    ) : (
                      circulars.map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.circularNumber}</strong></td>
                          <td>{c.title}</td>
                          <td>{new Date(c.issueDate).toLocaleDateString('en-UG')}</td>
                          <td>{c.deadline ? new Date(c.deadline).toLocaleDateString('en-UG') : '—'}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: c.isActive ? '#059669' : '#dc2626', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {c.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
