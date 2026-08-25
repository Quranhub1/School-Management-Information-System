import { useState } from 'react';

export function Notices({ canManage }: { canManage: boolean }) {
  return (
    <section className="panel" aria-label="Notices">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">COMMUNICATION</span>
          <h3>Notices</h3>
        </div>
      </div>
      <p className="empty">Notices module is available.</p>
    </section>
  );
}
