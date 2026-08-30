import { useState } from 'react';

export function Announcements({ canManage }: { canManage?: boolean }) {
  const [message, setMessage] = useState('');
  return (
    <section className="panel" aria-label="Announcements">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">COMMUNICATION</span>
          <h3>Announcements</h3>
        </div>
      </div>
      {message && <p role="status" className="empty">{message}</p>}
      <p className="empty">Announcements module is available.</p>
    </section>
  );
}
