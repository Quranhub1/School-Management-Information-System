import { useState } from 'react';

export function AssessmentConfiguration({ canManage }: { canManage?: boolean }) {
  return (
    <section className="panel" aria-label="Assessment configuration">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ASSESSMENT</span>
          <h3>Assessment Configuration</h3>
        </div>
      </div>
      <p className="empty">Assessment configuration module is available.</p>
    </section>
  );
}
