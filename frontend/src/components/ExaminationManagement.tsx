import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  createAssessmentPlan,
  finalizeAssessment,
  getAssessmentPlans,
  getExaminationTranscript,
  getStudentAssessments,
  recordAssessment,
  type AssessmentPlan,
  type StudentAssessment,
} from '../api/examinationResults';
import type { TranscriptEntry } from '../types/academic';

type View = 'sessions' | 'marks' | 'report-cards' | 'reports';

export function ExaminationManagement({ canManage = false }: { canManage?: boolean }) {
  const [view, setView] = useState<View>('sessions');
  const [plans, setPlans] = useState<AssessmentPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [courseId, setCourseId] = useState('');
  const [planName, setPlanName] = useState('');
  const [assessmentType, setAssessmentType] = useState('Examination');
  const [weightPercentage, setWeightPercentage] = useState('100');
  const [isCompetencyBased, setIsCompetencyBased] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [planId, setPlanId] = useState('');
  const [score, setScore] = useState('');
  const [maximumScore, setMaximumScore] = useState('100');
  const [competencyLevel, setCompetencyLevel] = useState('');
  const [registrationAssessments, setRegistrationAssessments] = useState<StudentAssessment[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [reportStudentId, setReportStudentId] = useState('');

  const activePlans = useMemo(() => plans.filter(plan => plan.isActive), [plans]);
  const selectedPlan = activePlans.find(plan => plan.id === planId);

  async function loadPlans() {
    setLoadingPlans(true);
    setError('');
    try {
      const rows = await getAssessmentPlans(courseId || undefined);
      setPlans(rows);
      setPlanId(current => rows.some(row => row.id === current && row.isActive) ? current : (rows.find(row => row.isActive)?.id ?? ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load assessment plans.');
    } finally {
      setLoadingPlans(false);
    }
  }

  useEffect(() => { void loadPlans(); }, []);


  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) { setError('Your role has read-only access to assessment configuration.'); return; }
    if (!courseId.trim() || !planName.trim() || !assessmentType.trim()) {
      setError('Course ID, plan name and assessment type are required.');
      return;
    }
    const weight = Number(weightPercentage);
    if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
      setError('Assessment weight must be between 0 and 100 percent.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      await createAssessmentPlan({
        courseId: courseId.trim(),
        name: planName.trim(),
        assessmentType: assessmentType.trim(),
        weightPercentage: weight,
        isCompetencyBased,
      });
      setNotice('Assessment plan saved to the school database.');
      setPlanName('');
      await loadPlans();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save assessment plan.');
    } finally { setBusy(false); }
  }

  async function loadRegistrationAssessments() {
    if (!registrationId.trim()) {
      setError('Enter a course registration ID to load recorded marks.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      setRegistrationAssessments(await getStudentAssessments(registrationId.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load marks for this registration.');
    } finally { setBusy(false); }
  }

  async function finalizeMark(id: string) {
    if (!canManage) { setError('Your role has read-only access to examinations.'); return; }
    if (!window.confirm('Finalize this mark? Finalized marks are locked and cannot be finalized again.')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await finalizeAssessment(id);
      setNotice('Mark finalized successfully.');
      if (registrationId.trim()) setRegistrationAssessments(await getStudentAssessments(registrationId.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to finalize the mark.');
    } finally { setBusy(false); }
  }
  async function submitMark(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) { setError('Your role has read-only access to examinations.'); return; }
    if (!studentId.trim() || !registrationId.trim() || !planId) {
      setError('Student, course registration and assessment plan are required.');
      return;
    }
    const parsedScore = Number(score);
    const parsedMaximum = Number(maximumScore);
    if (!Number.isFinite(parsedScore) || !Number.isFinite(parsedMaximum) || parsedMaximum <= 0 || parsedScore < 0 || parsedScore > parsedMaximum) {
      setError('Score must be between zero and a maximum score greater than zero.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      await recordAssessment({
        studentId: studentId.trim(),
        courseRegistrationId: registrationId.trim(),
        assessmentPlanId: planId,
        score: parsedScore,
        maximumScore: parsedMaximum,
        ...(competencyLevel.trim() ? { competencyLevel: competencyLevel.trim() } : {}),
      });
      setNotice('Mark saved to the school database.');
      setScore('');
      setCompetencyLevel('');
      setRegistrationAssessments(await getStudentAssessments(registrationId.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the mark.');
    } finally { setBusy(false); }
  }

  async function loadReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportStudentId.trim()) { setError('Enter a student ID to load the report.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      setTranscript(await getExaminationTranscript(reportStudentId.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the student transcript.');
      setTranscript([]);
    } finally { setBusy(false); }
  }

  return (
    <section className="panel" aria-label="Examination management">
      <div className="panel-heading">
        <div><span className="eyebrow">EXAMINATIONS</span><h3>Examination Management</h3></div>
        <button type="button" className="secondary-button" onClick={() => void loadPlans()} disabled={loadingPlans}>Refresh plans</button>
      </div>

      {error && <p role="alert" className="form-error">{error}</p>}
      {notice && <p role="status" className="form-success">{notice}</p>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Examination sections">
        {([
          ['sessions', 'Assessment plans'],
          ['marks', 'Marks entry'],
          ['report-cards', 'Student transcript'],
          ['reports', 'Assessment report'],
        ] as [View, string][]).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={view === key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>
        ))}
      </div>

      {view === 'sessions' && (
        <section className="academic-authority-workspace">
          <h4>Configured assessment plans</h4>
          <p>Plans are loaded from the API and marks are saved against the selected plan and course registration.</p>
          <div className="form-row">
            <label>Filter by course ID
              <input value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Optional course UUID" />
            </label>
            <button type="button" onClick={() => void loadPlans()} disabled={loadingPlans}>Apply filter</button>
          </div>
          {canManage && <form onSubmit={submitPlan}>
            <h5>Create assessment plan</h5>
            <div className="form-row">
              <label>Course ID<input required value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Course UUID" /></label>
              <label>Plan name<input required maxLength={160} value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. End of semester examination" /></label>
              <label>Assessment type<input required maxLength={80} value={assessmentType} onChange={e => setAssessmentType(e.target.value)} placeholder="Examination, practical, coursework" /></label>
              <label>Weight (%)<input required type="number" min="0" max="100" step="0.01" value={weightPercentage} onChange={e => setWeightPercentage(e.target.value)} /></label>
            </div>
            <label><input type="checkbox" checked={isCompetencyBased} onChange={e => setIsCompetencyBased(e.target.checked)} /> Competency-based assessment</label>
            <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create assessment plan'}</button>
          </form>}
          {loadingPlans ? <p>Loading assessment plans…</p> : activePlans.length === 0 ? <p className="empty">No active assessment plans were returned by the server.</p> : (
            <div className="table-wrap"><table><thead><tr><th>Plan</th><th>Course ID</th><th>Type</th><th>Weight</th><th>Assessment mode</th><th>Status</th></tr></thead>
              <tbody>{activePlans.map(plan => <tr key={plan.id}><td>{plan.name}</td><td>{plan.courseId}</td><td>{plan.assessmentType}</td><td>{plan.weightPercentage}%</td><td>{plan.isCompetencyBased ? 'Competency-based' : 'Score-based'}</td><td>Active</td></tr>)}</tbody>
            </table></div>
          )}
        </section>
      )}

      {view === 'marks' && (
        <section className="academic-authority-workspace">
          <h4>Record assessment mark</h4>
          {!canManage && <p role="note">Read-only access: your role cannot record or change marks.</p>}
          <form onSubmit={submitMark}>
            <div className="form-row">
              <label>Student ID<input required value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student UUID" /></label>
              <label>Course registration ID<input required value={registrationId} onChange={e => setRegistrationId(e.target.value)} placeholder="Course registration UUID" /></label>
              <label>Assessment plan<select required value={planId} onChange={e => setPlanId(e.target.value)}><option value="">Select plan</option>{activePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {plan.assessmentType}</option>)}</select></label>
            </div>
            <div className="form-row">
              <label>Score<input required type="number" min="0" step="0.01" value={score} onChange={e => setScore(e.target.value)} /></label>
              <label>Maximum score<input required type="number" min="0.01" step="0.01" value={maximumScore} onChange={e => setMaximumScore(e.target.value)} /></label>
              {selectedPlan?.isCompetencyBased && <label>Competency level<input required value={competencyLevel} onChange={e => setCompetencyLevel(e.target.value)} placeholder="e.g. Competent" /></label>}
            </div>
            <button type="submit" disabled={!canManage || busy || loadingPlans || activePlans.length === 0}>{busy ? 'Saving…' : 'Save mark'}</button>
          </form>
          <div className="form-row">
            <label>Load existing marks by registration ID<input value={registrationId} onChange={e => setRegistrationId(e.target.value)} placeholder="Course registration UUID" /></label>
            <button type="button" onClick={() => void loadRegistrationAssessments()} disabled={busy}>Load marks</button>
          </div>
          {registrationAssessments.length > 0 && <div className="table-wrap"><table><thead><tr><th>Assessment plan</th><th>Score</th><th>Maximum</th><th>Grade</th><th>Competency</th><th>Finalized</th><th>Recorded</th><th>Action</th></tr></thead><tbody>{registrationAssessments.map(item => <tr key={item.id}><td>{activePlans.find(p => p.id === item.assessmentPlanId)?.name ?? item.assessmentPlanId}</td><td>{item.score}</td><td>{item.maximumScore}</td><td>{item.grade ?? '—'}</td><td>{item.competencyLevel ?? '—'}</td><td>{item.isFinalized ? 'Yes' : 'No'}</td><td>{new Date(item.recordedAt).toLocaleString()}</td><td>{item.isFinalized ? 'Locked' : <button type="button" disabled={!canManage || busy} onClick={() => void finalizeMark(item.id)}>Finalize</button>}</td></tr>)}</tbody></table></div>}
        </section>
      )}

      {view === 'report-cards' && (
        <section className="academic-authority-workspace">
          <h4>Student transcript</h4>
          <form onSubmit={loadReport} className="form-row">
            <label>Student ID<input required value={reportStudentId} onChange={e => setReportStudentId(e.target.value)} placeholder="Student UUID" /></label>
            <button type="submit" disabled={busy}>{busy ? 'Loading…' : 'Load transcript'}</button>
          </form>
          {transcript.length === 0 ? <p className="empty">Enter a student ID to retrieve the persisted transcript.</p> : <div className="table-wrap"><table><thead><tr><th>Course</th><th>Title</th><th>Units</th><th>Score</th><th>Grade</th><th>Points</th><th>Outcome</th></tr></thead><tbody>{transcript.map(entry => <tr key={entry.id}><td>{entry.courseCode}</td><td>{entry.courseTitle}</td><td>{entry.creditUnits}</td><td>{entry.score}</td><td>{entry.grade ?? '—'}</td><td>{entry.gradePoint.toFixed(2)}</td><td>{entry.isPass ? 'Pass' : 'Fail'}</td></tr>)}</tbody></table></div>}
        </section>
      )}

      {view === 'reports' && (
        <section className="academic-authority-workspace">
          <h4>Assessment report</h4>
          <p>Summary of the assessment records currently loaded for the selected course registration.</p>
          {registrationAssessments.length > 0 && <p>{registrationAssessments.length} assessment record(s) loaded. Total score: {registrationAssessments.reduce((sum, item) => sum + item.score, 0)} / {registrationAssessments.reduce((sum, item) => sum + item.maximumScore, 0)}.</p>}
        </section>
      )}
    </section>
  );
}
