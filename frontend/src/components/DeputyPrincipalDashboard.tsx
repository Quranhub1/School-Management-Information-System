import { useEffect, useState } from 'react'
import {
  getDeputyPrincipalDashboard,
  getAcademicPerformance,
  getExaminationSummary,
  getTimetableOverview,
  type DeputyPrincipalDashboard,
  type AcademicPerformance,
  type ExaminationSummary,
  type TimetableEntry,
} from '../api/deputyPrincipal'

type MainTab = 'overview' | 'academics' | 'examinations' | 'timetable'

export function DeputyPrincipalDashboard() {
  const [mainTab, setMainTab] = useState<MainTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<DeputyPrincipalDashboard | null>(null)
  const [academicPerformance, setAcademicPerformance] = useState<AcademicPerformance[]>([])
  const [examinationSummary, setExaminationSummary] = useState<ExaminationSummary[]>([])
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [dash, academic, exams, tt] = await Promise.all([
        getDeputyPrincipalDashboard(),
        getAcademicPerformance(),
        getExaminationSummary(),
        getTimetableOverview(),
      ])
      setDashboard(dash)
      setAcademicPerformance(academic)
      setExaminationSummary(exams)
      setTimetable(tt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load deputy principal dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  function getStatusColor(status: string): string {
    if (status === 'Active' || status === 'Accepted' || status === 'Completed' || status === 'Published') return '#059669'
    if (status === 'Pending' || status === 'Scheduled' || status === 'InProgress') return '#d97706'
    return '#dc2626'
  }

  return (
    <section className="panel" aria-label="Deputy principal dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">DEPUTY PRINCIPAL</span>
          <h2>Academic & Operations Dashboard</h2>
        </div>
        <button className="secondary-button" onClick={() => void loadAll()}>Refresh</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Deputy principal sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={mainTab === 'overview'} className={mainTab === 'overview' ? 'active' : ''} onClick={() => setMainTab('overview')}>Overview</button>
        <button role="tab" aria-selected={mainTab === 'academics'} className={mainTab === 'academics' ? 'active' : ''} onClick={() => setMainTab('academics')}>Academics</button>
        <button role="tab" aria-selected={mainTab === 'examinations'} className={mainTab === 'examinations' ? 'active' : ''} onClick={() => setMainTab('examinations')}>Examinations</button>
        <button role="tab" aria-selected={mainTab === 'timetable'} className={mainTab === 'timetable' ? 'active' : ''} onClick={() => setMainTab('timetable')}>Timetable</button>
      </div>

      {loading ? (
        <p className="empty">Loading deputy principal dashboard…</p>
      ) : dashboard ? (
        <>
          {mainTab === 'overview' && (
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
                  <span>Courses</span>
                  <strong>{dashboard.totalCourses}</strong>
                </div>
                <div className="summary-card">
                  <span>Pending Admissions</span>
                  <strong style={{ color: '#d97706' }}>{dashboard.pendingAdmissions}</strong>
                </div>
                <div className="summary-card">
                  <span>Pass Rate</span>
                  <strong style={{ color: '#059669' }}>{dashboard.totalResults > 0 ? Math.round((dashboard.passedResults / dashboard.totalResults) * 100) : 0}%</strong>
                </div>
                <div className="summary-card">
                  <span>Timetable Conflicts</span>
                  <strong style={{ color: dashboard.timetableConflicts > 0 ? '#dc2626' : '#059669' }}>{dashboard.timetableConflicts}</strong>
                </div>
              </div>

              <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
                <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                  <div>
                    <span className="eyebrow">ADMISSIONS</span>
                    <h3>Admissions Pipeline</h3>
                  </div>
                </div>
                <div className="summary-grid" style={{ marginBottom: 22 }}>
                  <div className="summary-card">
                    <span>Pending</span>
                    <strong style={{ color: '#d97706' }}>{dashboard.pendingAdmissions}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Accepted</span>
                    <strong style={{ color: '#059669' }}>{dashboard.acceptedAdmissions}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Rejected</span>
                    <strong style={{ color: '#dc2626' }}>{dashboard.rejectedAdmissions}</strong>
                  </div>
                </div>

                <h4 style={{ marginBottom: 10 }}>Recent Admissions</h4>
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
                        <tr><td colSpan={4} className="empty">No recent admissions</td></tr>
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
                    <span className="eyebrow">STAFF</span>
                    <h3>Teaching Staff Performance</h3>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Staff No.</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Position</th>
                        <th>Classes</th>
                        <th>Results</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.staffPerformance.length === 0 ? (
                        <tr><td colSpan={6} className="empty">No staff data found</td></tr>
                      ) : (
                        dashboard.staffPerformance.map(s => (
                          <tr key={s.id}>
                            <td><strong>{s.staffNumber}</strong></td>
                            <td>{s.firstName} {s.lastName}</td>
                            <td>{s.department || '—'}</td>
                            <td>{s.position || '—'}</td>
                            <td>{s.classCount}</td>
                            <td>{s.resultCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {mainTab === 'academics' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">ACADEMICS</span>
                  <h3>Academic Performance by Programme</h3>
                </div>
              </div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Total Results</span>
                  <strong>{dashboard.totalResults}</strong>
                </div>
                <div className="summary-card">
                  <span>Passed</span>
                  <strong style={{ color: '#059669' }}>{dashboard.passedResults}</strong>
                </div>
                <div className="summary-card">
                  <span>Failed</span>
                  <strong style={{ color: '#dc2626' }}>{dashboard.failedResults}</strong>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Programme</th>
                      <th>Students</th>
                      <th>Results</th>
                      <th>Pass Rate</th>
                      <th>Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicPerformance.length === 0 ? (
                      <tr><td colSpan={5} className="empty">No academic data found</td></tr>
                    ) : (
                      academicPerformance.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.totalStudents}</td>
                          <td>{p.totalResults}</td>
                          <td style={{ color: p.passRate >= 50 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {p.totalResults > 0 ? Math.round((p.passRate / p.totalResults) * 100) : 0}%
                          </td>
                          <td>{p.avgScore.toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <h4 style={{ margin: '22px 0 10px' }}>Recent Results</h4>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentResults.length === 0 ? (
                      <tr><td colSpan={4} className="empty">No results found</td></tr>
                    ) : (
                      dashboard.recentResults.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.studentName}</strong></td>
                          <td>{r.score}</td>
                          <td><strong>{r.grade}</strong></td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: r.passed ? '#059669' : '#dc2626', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {r.passed ? 'Pass' : 'Fail'}
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

          {mainTab === 'examinations' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">EXAMINATIONS</span>
                  <h3>Examination Summary</h3>
                </div>
              </div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Attendance Sessions</span>
                  <strong>{dashboard.attendanceSessions}</strong>
                </div>
                <div className="summary-card">
                  <span>Attendance Records</span>
                  <strong>{dashboard.attendanceRecords}</strong>
                </div>
                <div className="summary-card">
                  <span>Absent</span>
                  <strong style={{ color: '#dc2626' }}>{dashboard.absentRecords}</strong>
                </div>
                <div className="summary-card">
                  <span>Attendance Rate</span>
                  <strong>{dashboard.attendanceRecords > 0 ? Math.round(((dashboard.attendanceRecords - dashboard.absentRecords) / dashboard.attendanceRecords) * 100) : 0}%</strong>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Entries</th>
                      <th>Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examinationSummary.length === 0 ? (
                      <tr><td colSpan={7} className="empty">No examinations found</td></tr>
                    ) : (
                      examinationSummary.map(exam => (
                        <tr key={exam.id}>
                          <td><strong>{exam.name}</strong></td>
                          <td>{exam.examType}</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getStatusColor(exam.status), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                              {exam.status}
                            </span>
                          </td>
                          <td>{new Date(exam.startDate).toLocaleDateString('en-UG')}</td>
                          <td>{new Date(exam.endDate).toLocaleDateString('en-UG')}</td>
                          <td>{exam.entryCount}</td>
                          <td>{exam.resultCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mainTab === 'timetable' && (
            <div className="panel" style={{ padding: 22, marginBottom: 22 }}>
              <div className="panel-heading" style={{ padding: 0, border: 0, marginBottom: 15 }}>
                <div>
                  <span className="eyebrow">TIMETABLE</span>
                  <h3>Timetable Overview</h3>
                </div>
              </div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <div className="summary-card">
                  <span>Total Entries</span>
                  <strong>{dashboard.timetableEntries}</strong>
                </div>
                <div className="summary-card">
                  <span>Conflicts</span>
                  <strong style={{ color: dashboard.timetableConflicts > 0 ? '#dc2626' : '#059669' }}>{dashboard.timetableConflicts}</strong>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Period</th>
                      <th>Room</th>
                      <th>Course</th>
                      <th>Staff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.length === 0 ? (
                      <tr><td colSpan={5} className="empty">No timetable entries found</td></tr>
                    ) : (
                      timetable.map(entry => (
                        <tr key={entry.id}>
                          <td><strong>{entry.day}</strong></td>
                          <td>{entry.period}</td>
                          <td>{entry.room}</td>
                          <td>{entry.courseName}</td>
                          <td>{entry.staffName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="empty">No data available.</p>
      )}
    </section>
  )
}
