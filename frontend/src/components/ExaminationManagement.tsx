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
  const [examSetupMode, setExamSetupMode] = useState<'list' | 'create'>('list');
  const [printStudentName, setPrintStudentName] = useState('');
  const [printEnrollmentNumber, setPrintEnrollmentNumber] = useState('');
  const [printSession, setPrintSession] = useState('');
  const [printClass, setPrintClass] = useState('');
  const [printPin, setPrintPin] = useState('');
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
      setRegistrationAssessments([]);
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
        setRegistrationAssessments([]);
      setNotice('Mark saved to the school database.');
      setScore('');
      setCompetencyLevel('');
      try {
        setRegistrationAssessments(await getStudentAssessments(registrationId.trim()));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to refresh marks.');
      }
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
          { key: 'sessions', label: 'Manage Exams' },
          { key: 'marks', label: 'Add Exam Result' },
          { key: 'report-cards', label: 'Print Exam Results' },
          { key: 'reports', label: 'Result Summary' },
        ] as { key: View; label: string }[]).map((item) => (
          <button key={item.key} type="button" role="tab" aria-selected={view === item.key} className={view === item.key ? 'active' : ''} onClick={() => setView(item.key)}>{item.label}</button>
        ))}
      </div>

      {view === 'sessions' && (
        <section className="academic-authority-workspace">
          <div className="panel-heading"><div><span className="eyebrow">EXAMINATION SETUP</span><h4>Manage exams</h4></div><span className="status">{activePlans.length} active plan(s)</span></div>
          <div className="form-row" role="group" aria-label="Exam management actions">
            <button type="button" className={examSetupMode === 'list' ? '' : 'secondary-button'} onClick={() => setExamSetupMode('list')}>View Exams</button>
            {canManage && <button type="button" className={examSetupMode === 'create' ? '' : 'secondary-button'} onClick={() => setExamSetupMode('create')}>Add New Exam</button>}
            <button type="button" className="secondary-button" onClick={() => void loadPlans()} disabled={loadingPlans}>Refresh exams</button>
          </div>
          {examSetupMode === 'create' && canManage && <form onSubmit={submitPlan} className="academic-authority-workspace">
            <h5>Add new exam</h5>
            <div className="form-row">
              <label>Course ID<input required value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Course UUID" /></label>
              <label>Exam name<input required maxLength={160} value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. End of semester examination" /></label>
              <label>Assessment type<input required maxLength={80} value={assessmentType} onChange={e => setAssessmentType(e.target.value)} placeholder="Examination, practical, coursework" /></label>
              <label>Weight (%)<input required type="number" min="0" max="100" step="0.01" value={weightPercentage} onChange={e => setWeightPercentage(e.target.value)} /></label>
            </div>
            <label><input type="checkbox" checked={isCompetencyBased} onChange={e => setIsCompetencyBased(e.target.checked)} /> Competency-based assessment</label>
            <div className="form-row"><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save New Exam'}</button><button type="button" className="secondary-button" onClick={() => setExamSetupMode('list')}>Cancel</button></div>
          </form>}
          {examSetupMode === 'list' && <>
            <div className="form-row">
              <label>Filter by course ID<input value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Optional course UUID" /></label>
              <button type="button" className="secondary-button" onClick={() => void loadPlans()} disabled={loadingPlans}>Apply filter</button>
            </div>
            {loadingPlans ? <p>Loading exams…</p> : activePlans.length === 0 ? <p className="empty">No active exams were returned by the school database.</p> : (
              <div className="table-wrap"><table><thead><tr><th>Exam</th><th>Course ID</th><th>Type</th><th>Weight</th><th>Assessment mode</th><th>Status</th></tr></thead>
                <tbody>{activePlans.map(plan => <tr key={plan.id}><td>{plan.name}</td><td>{plan.courseId}</td><td>{plan.assessmentType}</td><td>{plan.weightPercentage}%</td><td>{plan.isCompetencyBased ? 'Competency-based' : 'Score-based'}</td><td>Active</td></tr>)}</tbody>
              </table></div>
            )}
          </>}
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
          <div className="panel-heading"><div><span className="eyebrow">ACADEMIC RECORDS</span><h4>Print exam results</h4></div></div>
          <form onSubmit={loadReport} className="form-row">
            <label>Student ID<input required value={reportStudentId} onChange={e => setReportStudentId(e.target.value)} placeholder="Student UUID" /></label>
            <button type="submit" disabled={busy}>{busy ? 'Loading…' : 'Load exam results'}</button>
          </form>
          {transcript.length > 0 && <>
            <section className="academic-authority-workspace" aria-label="Student details for printed result">
              <h5>Student details</h5>
              <div className="form-row">
                <label>Student name<input value={printStudentName} onChange={e => setPrintStudentName(e.target.value)} placeholder="Enter student name" /></label>
                <label>Enrollment number<input value={printEnrollmentNumber} onChange={e => setPrintEnrollmentNumber(e.target.value)} placeholder="Enter enrollment number" /></label>
                <label>Session<input value={printSession} onChange={e => setPrintSession(e.target.value)} placeholder="Academic session" /></label>
                <label>Class<input value={printClass} onChange={e => setPrintClass(e.target.value)} placeholder="Class / programme" /></label>
                <label>PIN number<input value={printPin} onChange={e => setPrintPin(e.target.value)} placeholder="Enter PIN number" /></label>
              </div>
              <p className="empty">These identity fields are entered for this printout; the current transcript endpoint does not return them automatically.</p>
            </section>
            <div className="form-row"><button type="button" onClick={() => window.print()} disabled={!printStudentName.trim() || !printEnrollmentNumber.trim()}>Print Exam Results</button></div>
            <section id="exam-result-print-area" className="exam-result-print" aria-label="Printable examination result">
              <header className="exam-result-print__header">
                <h2>KAMPALA SCHOOL OF HEALTH SCIENCES</h2>
                <p>EXAMINATION RESULT</p>
                <div className="exam-result-print__contacts"><span>Phone: __________________</span><span>Email: __________________</span><span>Address: __________________</span></div>
              </header>
              <h3>STUDENT DETAILS</h3>
              <dl className="exam-result-print__details">
                <div><dt>Student Name</dt><dd>{printStudentName || '—'}</dd></div>
                <div><dt>Enrollment Number</dt><dd>{printEnrollmentNumber || '—'}</dd></div>
                <div><dt>Session</dt><dd>{printSession || '—'}</dd></div>
                <div><dt>Class</dt><dd>{printClass || '—'}</dd></div>
                <div><dt>PIN Number</dt><dd>{printPin || '—'}</dd></div>
              </dl>
              <h3>EXAM RESULT</h3>
              <table className="exam-result-print__table"><thead><tr><th>Paper Code</th><th>Subject Name</th><th>Score</th><th>Grade</th><th>Outcome</th></tr></thead>
                <tbody>{transcript.map(entry => <tr key={entry.id}><td>{entry.courseCode}</td><td>{entry.courseTitle}</td><td>{entry.score}</td><td>{entry.grade ?? '—'}</td><td>{entry.isPass ? 'Pass' : 'Fail'}</td></tr>)}</tbody>
              </table>
              <footer className="exam-result-print__footer"><span>Prepared by: __________________</span><span>Approved by: __________________</span><span>Date: __________________</span></footer>
            </section>
          </>}
          <style>{`@media print {
            @page { size: A4; margin: 16mm; }
            body * { visibility: hidden !important; }
            #exam-result-print-area, #exam-result-print-area * { visibility: visible !important; }
            #exam-result-print-area { position: absolute; inset: 0; width: 100%; color: #111827; background: #fff; font-family: Arial, sans-serif; }
            #exam-result-print-area h2 { text-align: center; font-size: 18pt; margin: 0 0 6px; }
            #exam-result-print-area h3 { font-size: 11pt; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 22px; }
            .exam-result-print__header > p { text-align: center; font-weight: 700; letter-spacing: 2px; }
            .exam-result-print__contacts { display: flex; justify-content: space-between; font-size: 9pt; border-top: 1px solid #777; border-bottom: 1px solid #777; padding: 8px 0; }
            .exam-result-print__details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px; }
            .exam-result-print__details div { display: flex; gap: 8px; border-bottom: 1px solid #aaa; padding: 5px 0; }
            .exam-result-print__details dt { font-weight: 700; min-width: 135px; }
            .exam-result-print__details dd { margin: 0; }
            .exam-result-print__table { width: 100%; border-collapse: collapse; }
            .exam-result-print__table th, .exam-result-print__table td { border: 1px solid #444; padding: 8px; text-align: left; }
            .exam-result-print__footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 9pt; }
          }`}</style>
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
