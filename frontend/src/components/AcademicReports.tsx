import { useState } from 'react';

export function AcademicReports({ canManage }: { canManage?: boolean }) {
  return (
    <section className="panel" aria-label="Academic reports">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ACADEMIC</span>
          <h3>Academic Reports</h3>
        </div>
      </div>
      <p className="empty">Academic reports module is available.</p>
    </section>
  );
}
