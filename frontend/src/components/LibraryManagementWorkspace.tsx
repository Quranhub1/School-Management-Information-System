import { useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';
import { LibraryManagement } from './LibraryManagement';
import './LibraryManagementWorkspace.css';

type LibraryToolLinks = {
  koha: { enabled: boolean; baseUrl: string };
  dspace: { enabled: boolean; baseUrl: string };
};

const emptyToolLinks: LibraryToolLinks = {
  koha: { enabled: false, baseUrl: '' },
  dspace: { enabled: false, baseUrl: '' },
};

export function LibraryManagementWorkspace({ canManage }: { canManage?: boolean }) {
  const [activeTab, setActiveTab] = useState<'library' | 'tools'>('library');
  const [toolLinks, setToolLinks] = useState<LibraryToolLinks>(emptyToolLinks);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState('');

  useEffect(() => {
    if (activeTab !== 'tools') return;
    let active = true;
    setToolsLoading(true);
    setToolsError('');
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\\/+$/, '') ?? '';
    const token = getAccessToken();
    void fetch(`${base}/api/library/integrations`, {
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    }).then(async response => {
      if (!response.ok) throw new Error(`Unable to load library tools (HTTP ${response.status}).`);
      return response.json() as Promise<LibraryToolLinks>;
    }).then(value => {
      if (active) setToolLinks(value);
    }).catch(reason => {
      if (active) {
        setToolLinks(emptyToolLinks);
        setToolsError(reason instanceof Error ? reason.message : 'Unable to load library tools.');
      }
    }).finally(() => {
      if (active) setToolsLoading(false);
    });
    return () => { active = false; };
  }, [activeTab]);

  const kohaAvailable = !toolsLoading && !toolsError && toolLinks.koha.enabled && Boolean(toolLinks.koha.baseUrl);
  const dspaceAvailable = !toolsLoading && !toolsError && toolLinks.dspace.enabled && Boolean(toolLinks.dspace.baseUrl);

  return (
    <section className="library-workspace-shell" aria-labelledby="library-management-workspace-title">
      <nav className="library-workspace-tabs" aria-label="Library sections">
        <button type="button" className={activeTab === 'library' ? 'active' : ''} aria-pressed={activeTab === 'library'} onClick={() => setActiveTab('library')}>Library Management</button>
        <button type="button" className={activeTab === 'tools' ? 'active' : ''} aria-pressed={activeTab === 'tools'} onClick={() => setActiveTab('tools')}>Library Tools</button>
      </nav>
      {activeTab === 'library' ? (
        <div id="library-management-workspace-title">
          <LibraryManagement canManage={canManage} />
        </div>
      ) : (
        <section className="library-tools-panel" aria-labelledby="library-tools-title">
          <div className="library-tools-heading">
            <h2 id="library-tools-title">Library Tools</h2>
            <p>Choose a connected platform to open its interface.</p>
          </div>
          {toolsLoading && <p role="status">Checking connected library platforms…</p>}
          {toolsError && <p className="form-error" role="alert">{toolsError}</p>}
          <div className="library-tools-actions">
            <article className="library-tool-card">
              <div>
                <span className="integration-label">KOHA</span>
                <h3>Library Management System</h3>
                <p>Open the institution's configured Koha OPAC.</p>
              </div>
              {kohaAvailable ? (
                <a className="library-primary" href={toolLinks.koha.baseUrl} target="_blank" rel="noopener noreferrer">Open Koha</a>
              ) : (
                <button className="library-primary" type="button" disabled aria-disabled="true">
                  {toolsLoading ? 'Loading Koha…' : 'Koha not connected'}
                </button>
              )}
              {!toolsLoading && !toolsError && !kohaAvailable && <span className="library-tool-unavailable">Ask an administrator to configure the Koha URL.</span>}
            </article>
            <article className="library-tool-card">
              <div>
                <span className="integration-label">DSPACE</span>
                <h3>Digital Repository</h3>
                <p>Browse the institution's digital publications, research and academic documents.</p>
              </div>
              {dspaceAvailable ? (
                <a className="library-primary" href={toolLinks.dspace.baseUrl} target="_blank" rel="noopener noreferrer">Open DSpace</a>
              ) : (
                <button className="library-primary" type="button" disabled aria-disabled="true">
                  {toolsLoading ? 'Loading DSpace…' : 'DSpace not connected'}
                </button>
              )}
              {!toolsLoading && !toolsError && !dspaceAvailable && <span className="library-tool-unavailable">Ask an administrator to configure the DSpace URL.</span>}
            </article>
          </div>
        </section>
      )}
    </section>
  );
}
