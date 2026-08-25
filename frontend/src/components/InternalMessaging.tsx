import { useState } from 'react';

export function InternalMessaging() {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  return (
    <section className="panel" aria-label="Internal messaging">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">COMMUNICATION</span>
          <h3>Internal Messaging</h3>
        </div>
      </div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Message folders">
        <button role="tab" aria-selected={tab === 'inbox'} className={tab === 'inbox' ? 'active' : ''} onClick={() => setTab('inbox')}>Inbox</button>
        <button role="tab" aria-selected={tab === 'sent'} className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}>Sent</button>
      </div>
      <p className="empty">Internal messaging module is available.</p>
    </section>
  );
}
