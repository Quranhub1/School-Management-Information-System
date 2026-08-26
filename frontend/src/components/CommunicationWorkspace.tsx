import { useState } from 'react';
import { Notices } from './Notices';
import { InternalMessaging } from './InternalMessaging';
import { ParentStudentNotifications } from './ParentStudentNotifications';

type CommunicationTab = 'notices' | 'messaging' | 'notifications';

export function CommunicationWorkspace({ canManage }: { canManage: boolean }) {
  const [tab, setTab] = useState<CommunicationTab>('notices');

  return (
    <section className="library-workspace-shell" aria-labelledby="communication-workspace-title">
      <div className="library-workspace-tabs" role="tablist" aria-label="Communication sections">
        <button role="tab" aria-selected={tab === 'notices'} className={tab === 'notices' ? 'active' : ''} onClick={() => setTab('notices')}>
          Notices
        </button>
        <button role="tab" aria-selected={tab === 'messaging'} className={tab === 'messaging' ? 'active' : ''} onClick={() => setTab('messaging')}>
          Internal Messaging
        </button>
        <button role="tab" aria-selected={tab === 'notifications'} className={tab === 'notifications' ? 'active' : ''} onClick={() => setTab('notifications')}>
          Parent / Student Notifications
        </button>
      </div>

      <div id="communication-workspace-title">
        {tab === 'notices' && <Notices canManage={canManage} />}
        {tab === 'messaging' && <InternalMessaging />}
        {tab === 'notifications' && <ParentStudentNotifications />}
      </div>
    </section>
  );
}
