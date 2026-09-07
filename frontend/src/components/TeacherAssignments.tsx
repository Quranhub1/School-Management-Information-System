import { useState } from 'react';

export function TeacherAssignments({ canManage }: { canManage?: boolean }) {
  return (
    <section className="panel" aria-label="Teacher assignments">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ACADEMIC</span>
          <h3>Teacher Assignments</h3>
        </div>
      </div>
      <p className="empty">Teacher assignments module is available.</p>
    </section>
  );
}
