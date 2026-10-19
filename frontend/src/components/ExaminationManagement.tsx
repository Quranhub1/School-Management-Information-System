import { useState } from 'react';

type AcademicAuthority = 'School-based' | 'UHPAB' | 'UVTAB' | 'UNMEB';

export function ExaminationManagement({ canManage }: { canManage?: boolean }) {
  const [view, setView] = useState<'sessions' | 'marks' | 'report-cards' | 'approvals' | 'reports'>('sessions');
  const [authority, setAuthority] = useState<AcademicAuthority>('School-based');
  return (
    <section className="panel" aria-label="Examination management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">EXAMINATIONS</span>
          <h3>Examination Management</h3>
        </div>
      </div>
      <div className="form-row academic-authority-picker">
        <label>Examination authority
          <select value={authority} onChange={e => setAuthority(e.target.value as AcademicAuthority)}>
            <option value="School-based">School-based curriculum</option><option value="UHPAB">UHPAB — Health programmes</option><option value="UVTAB">UVTAB — Vocational & technical</option><option value="UNMEB">UNMEB — Legacy records</option>
          </select>
        </label>
      </div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Examination sections">
        <button role="tab" aria-selected={view === 'sessions'} className={view === 'sessions' ? 'active' : ''} onClick={() => setView('sessions')}>Sessions</button>
        <button role="tab" aria-selected={view === 'marks'} className={view === 'marks' ? 'active' : ''} onClick={() => setView('marks')}>Marks Entry</button>
        <button role="tab" aria-selected={view === 'report-cards'} className={view === 'report-cards' ? 'active' : ''} onClick={() => setView('report-cards')}>Report Cards</button>
        <button role="tab" aria-selected={view === 'approvals'} className={view === 'approvals' ? 'active' : ''} onClick={() => setView('approvals')}>Approvals</button>
        <button role="tab" aria-selected={view === 'reports'} className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}>Reports</button>
      </div>
      <section className="academic-authority-workspace" aria-live="polite">
        <h4>{authority === 'School-based' ? 'School-based examinations' : `${authority} examinations`}</h4>
        <p>Sessions, marks, report cards, approvals and reports are scoped to the selected academic authority. Records from other authorities must not be mixed into this workspace.</p>
        <p className="empty">No examination records are connected to this authority workspace yet.</p>
      </section>
    </section>
  );
}
