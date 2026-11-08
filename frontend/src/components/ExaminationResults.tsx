import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  getAssessmentPlans,
  getExaminationSummaries,
  getExaminationTranscript,
  getStudentAssessments,
  recordAssessment,
} from '../api/examinationResults'
import type { AcademicResultSummary, TranscriptEntry } from '../types/academic'
import type { AssessmentPlan, StudentAssessment } from '../api/examinationResults'

export function ExaminationResults() {
  const [studentId, setStudentId] = useState('')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [summaries, setSummaries] = useState<AcademicResultSummary[]>([])
  const [plans, setPlans] = useState<AssessmentPlan[]>([])
  const [assessments, setAssessments] = useState<StudentAssessment[]>([])
  const [registrationId, setRegistrationId] = useState('')
  const [planId, setPlanId] = useState('')
  const [score, setScore] = useState('')
  const [maximumScore, setMaximumScore] = useState('100')
  const [competencyLevel, setCompetencyLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getAssessmentPlans().then(setPlans).catch(() => setPlans([]))
  }, [])

  async function retrieve(event: FormEvent) {
    event.preventDefault()
    if (!studentId.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const id = studentId.trim()
      const [entries, resultSummaries] = await Promise.all([
        getExaminationTranscript(id),
        getExaminationSummaries(id),
      ])
      setTranscript(entries)
      setSummaries(resultSummaries)
    } catch (requestError) {
      setTranscript([])
      setSummaries([])
      setError(requestError instanceof Error ? requestError.message : 'Unable to load examination results.')
    } finally {
      setLoading(false)
    }
  }

  async function loadAssessments() {
    if (!registrationId.trim()) return
    setError('')
    try {
      setAssessments(await getStudentAssessments(registrationId.trim()))
    } catch (requestError) {
      setAssessments([])
      setError(requestError instanceof Error ? requestError.message : 'Unable to load assessment marks.')
    }
  }

  async function saveAssessment(event: FormEvent) {
    event.preventDefault()
    if (!studentId.trim() || !registrationId.trim() || !planId || !score || !maximumScore) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await recordAssessment({
        studentId: studentId.trim(),
        courseRegistrationId: registrationId.trim(),
        assessmentPlanId: planId,
        score: Number(score),
        maximumScore: Number(maximumScore),
        competencyLevel: competencyLevel.trim() || undefined,
      })
      await loadAssessments()
      setScore('')
      setCompetencyLevel('')
      setMessage('Assessment mark recorded successfully.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to record assessment mark.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="academic-workspace" aria-label="Examination and results workspace">
      <div className="panel-heading">
        <div><p className="eyebrow">Examinations & Results</p><h2>Results and assessment entry</h2></div>
        <span>{transcript.length} course results</span>
      </div>

      <form className="student-form" onSubmit={retrieve}>
        <label htmlFor="exam-student-id">Student ID</label>
        <div className="form-row">
          <input id="exam-student-id" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter student UUID" />
          <button type="submit" disabled={loading || !studentId.trim()}>{loading ? 'Loading…' : 'Retrieve results'}</button>
        </div>
      </form>

      <div className="panel">
        <div className="panel-heading"><div><p className="eyebrow">Assessment entry</p><h3>Record marks / competency</h3></div></div>
        <form className="student-form" onSubmit={saveAssessment}>
          <label htmlFor="registration-id">Course registration ID</label>
          <input id="registration-id" value={registrationId} onChange={(event) => setRegistrationId(event.target.value)} placeholder="Enter course registration UUID" />
          <label htmlFor="assessment-plan">Assessment plan</label>
          <select id="assessment-plan" value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="">Select assessment plan</option>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.assessmentType} · {plan.weightPercentage}%{plan.isCompetencyBased ? ' · CBET' : ''}</option>)}
          </select>
          <div className="form-row">
            <div><label htmlFor="assessment-score">Score</label><input id="assessment-score" type="number" min="0" step="0.01" value={score} onChange={(event) => setScore(event.target.value)} /></div>
            <div><label htmlFor="assessment-max">Maximum</label><input id="assessment-max" type="number" min="0.01" step="0.01" value={maximumScore} onChange={(event) => setMaximumScore(event.target.value)} /></div>
          </div>
          {plans.find((plan) => plan.id === planId)?.isCompetencyBased && <><label htmlFor="competency-level">Competency level</label><input id="competency-level" value={competencyLevel} onChange={(event) => setCompetencyLevel(event.target.value)} placeholder="e.g. Competent / Not Yet Competent" /></>}
          <div className="form-row"><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record assessment'}</button><button type="button" className="secondary-button" onClick={loadAssessments}>Load registration marks</button></div>
        </form>
        {message && <div className="success" role="status">{message}</div>}
        {assessments.length > 0 && <div className="table-wrap"><table><thead><tr><th>Assessment</th><th>Score</th><th>Maximum</th><th>Competency</th><th>Status</th></tr></thead><tbody>{assessments.map((assessment) => <tr key={assessment.id}><td>{plans.find((plan) => plan.id === assessment.assessmentPlanId)?.name ?? assessment.assessmentPlanId}</td><td>{assessment.score}</td><td>{assessment.maximumScore}</td><td>{assessment.competencyLevel ?? '—'}</td><td>{assessment.isFinalized ? 'Finalized' : 'Draft'}</td></tr>)}</tbody></table></div>}
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="summary-grid">
        {summaries.map((summary) => (
          <article className="summary-card" key={summary.id}>
            <span>Semester</span><strong>{summary.semesterId}</strong>
            <div className="metrics"><span>GPA <b>{summary.gpa.toFixed(2)}</b></span><span>CGPA <b>{summary.cgpa?.toFixed(2) ?? '—'}</b></span></div>
            <small>{summary.standing}{summary.isApproved ? ' · Approved' : ' · Pending approval'}</small>
          </article>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Course</th><th>Title</th><th>Units</th><th>Score</th><th>Grade</th><th>Point</th><th>Outcome</th></tr></thead>
          <tbody>
            {transcript.length === 0 ? <tr><td colSpan={7} className="empty">No examination results loaded.</td></tr> : transcript.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.courseCode}</td><td>{entry.courseTitle}</td><td>{entry.creditUnits}</td><td>{entry.score}</td><td>{entry.grade ?? '—'}</td><td>{entry.gradePoint.toFixed(2)}</td><td>{entry.isPass ? 'Pass' : 'Fail'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
