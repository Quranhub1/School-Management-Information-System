import { useState } from 'react';

export function SubjectManagement({ canManage }: { canManage: boolean }) {
  return (
    <section className="panel" aria-label="Subject management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ACADEMIC</span>
          <h3>Subject Management</h3>
        </div>
      </div>
      <p className="empty">Subject management module is available.</p>
    </section>
  );
}
