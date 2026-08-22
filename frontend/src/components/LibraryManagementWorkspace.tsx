import { useState } from 'react';
import { LibraryManagement } from './LibraryManagement';
import { LibrarianManagement } from './LibrarianManagement';
import { LibraryIntegrations } from './LibraryIntegrations';

type LibraryTab = 'circulation' | 'librarians' | 'integrations';

export function LibraryManagementWorkspace({ canManage }: { canManage: boolean }) {
  const [tab, setTab] = useState<LibraryTab>('circulation');

  return (
    <section className="library-workspace-shell" aria-labelledby="library-management-workspace-title">
      <div className="library-workspace-tabs" role="tablist" aria-label="Library management sections">
        <button
          role="tab"
          aria-selected={tab === 'circulation'}
          className={tab === 'circulation' ? 'active' : ''}
          onClick={() => setTab('circulation')}
        >
          Catalogue &amp; Circulation
        </button>
        {canManage && (
          <button
            role="tab"
            aria-selected={tab === 'librarians'}
            className={tab === 'librarians' ? 'active' : ''}
            onClick={() => setTab('librarians')}
          >
            Librarian Management
          </button>
        )}
        {canManage && (
          <button
            role="tab"
            aria-selected={tab === 'integrations'}
            className={tab === 'integrations' ? 'active' : ''}
            onClick={() => setTab('integrations')}
          >
            KOHA / DSpace Configuration
          </button>
        )}
      </div>

      <div id="library-management-workspace-title">
        {tab === 'circulation' && <LibraryManagement canManage={canManage} />}
        {tab === 'librarians' && canManage && <LibrarianManagement />}
        {tab === 'integrations' && canManage && <LibraryIntegrations canManage={canManage} />}
      </div>
    </section>
  );
}
