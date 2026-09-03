import { useEffect, useMemo, useState } from 'react'
import { getStudentPortalProfile, getStudentSummaries, getStudentTranscript, type StudentPortalProfile, type StudentSemesterResult } from '../api/studentPortal'
import type { TranscriptEntry, AcademicResultSummary } from '../types/academic'

function groupBySemester(summaries: AcademicResultSummary[], entries: TranscriptEntry[]): StudentSemesterResult[] {
  const map = new Map<string, StudentSemesterResult>()
  for (const s of summaries) {
    const key = `${s.academicYearId}__${s.semesterId}`
    if (!map.has(key)) map.set(key, { ...s, courses: [] })
  }
  for (const e of entries) {
    const key = `${e.academicYearId}__${e.semesterId}`
    const sem = map.get(key)
    if (sem) sem.courses.push(e)
  }
  return Array.from(map.values()).sort((a, b) => {
    const ay = b.academicYearId.localeCompare(a.academicYearId)
    if (ay !== 0) return ay
    return b.semesterId.localeCompare(a.semesterId)
  })
}

export function StudentPortal() {
  const [profile, setProfile] = useState<StudentPortalProfile | null>(null)
  const [summaries, setSummaries] = useState<AcademicResultSummary[]>([])
  const [entries, setEntries] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [p, s, t] = await Promise.all([getStudentPortalProfile(), getStudentSummaries(), getStudentTranscript()])
      setProfile(p)
      setSummaries(s)
      setEntries(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load portal data.')
    } finally {
      setLoading(false)
    }
  }

  const semesters = useMemo(() => groupBySemester(summaries, entries), [summaries, entries])
  const latestCgpa = semesters[0]?.cgpa ?? null

  return (
    <section className="panel" aria-label="Student Portal">
      <div className="panel-heading"><div><span className="eyebrow">STUDENT</span><h2>Student Portal</h2></div></div>
      {error && <div className="error" role="alert">{error}</div>}
      {loading ? <p className="empty">Loading…</p> : (
        <>
          <div className="summary-grid">
            <div className="summary-card"><span>Student</span><strong>{profile?.fullName ?? '—'}</strong><small>{profile?.studentNumber ?? ''}</small></div>
            <div className="summary-card"><span>Status</span><strong>{profile?.status ?? '—'}</strong><small>Enrollment status</small></div>
            <div className="summary-card"><span>Latest GPA</span><strong>{semesters[0]?.gpa.toFixed(2) ?? '—'}</strong><small>Most recent semester</small></div>
            <div className="summary-card"><span>CGPA</span><strong>{latestCgpa !== null ? latestCgpa.toFixed(2) : '—'}</strong><small>Cumulative</small></div>
          </div>
          <h3 style={{ margin: '22px 0 10px' }}>Results by Semester</h3>
          {semesters.length === 0 ? <p className="empty">No results found.</p> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>Courses</th>
                    <th>Credits</th>
                    <th>GPA</th>
                    <th>CGPA</th>
                    <th>Standing</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.map(sem => {
                    const label = `Academic Year ${sem.academicYearId} · Semester ${sem.semesterId}`
                    const isOpen = expandedSemester === `${sem.academicYearId}__${sem.semesterId}`
                    return (
                      <tr key={`${sem.academicYearId}-${sem.semesterId}`}>
                        <td><button className="link-button" onClick={() => setExpandedSemester(isOpen ? null : `${sem.academicYearId}__${sem.semesterId}`)}>{label} {isOpen ? '▲' : '▼'}</button></td>
                        <td>{sem.courses.length}</td>
                        <td>{sem.totalCreditUnits}</td>
                        <td>{sem.gpa.toFixed(2)}</td>
                        <td>{sem.cgpa !== null ? sem.cgpa.toFixed(2) : '—'}</td>
                        <td>{sem.standing}</td>
                        <td>{sem.isApproved ? 'Approved' : 'Pending'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {expandedSemester && (() => {
                const sem = semesters.find(s => `${s.academicYearId}__${s.semesterId}` === expandedSemester)
                if (!sem) return null
                return (
                  <div style={{ marginTop: 18 }}>
                    <h4 style={{ margin: '0 0 10px' }}>Course Results</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Title</th>
                          <th>Credits</th>
                          <th>Score</th>
                          <th>Grade</th>
                          <th>Grade Point</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map(c => (
                          <tr key={c.id}>
                            <td><code>{c.courseCode}</code></td>
                            <td>{c.courseTitle}</td>
                            <td>{c.creditUnits}</td>
                            <td>{c.score.toFixed(2)}</td>
                            <td>{c.grade ?? '—'}</td>
                            <td>{c.gradePoint.toFixed(2)}</td>
                            <td>{c.isPass ? 'Pass' : 'Fail'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}
    </section>
  )
}
