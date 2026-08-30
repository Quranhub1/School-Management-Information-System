import { useEffect, useState } from 'react';
import {
  defaultLibraryIntegrations,
  getLibraryIntegrationConfig,
  listLibraryIntegrations,
  saveLibraryIntegrationConfig,
  type LibraryIntegration,
  type LibraryIntegrationConfig,
} from '../api/libraryIntegrations';

export function LibraryIntegrations({ canManage }: { canManage?: boolean }) {
  const [integrations, setIntegrations] = useState<LibraryIntegration[]>(defaultLibraryIntegrations);
  const [config, setConfig] = useState<LibraryIntegrationConfig>(getLibraryIntegrationConfig());
  const [message, setMessage] = useState('');

  async function refresh() {
    try {
      setIntegrations(await listLibraryIntegrations());
    } catch {
      setIntegrations(defaultLibraryIntegrations);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function save() {
    saveLibraryIntegrationConfig(config);
    setMessage('Library integration settings saved on this workstation.');
    void refresh();
  }

  return (
    <section className="library-integrations" aria-labelledby="library-integrations-title">
      <div className="library-toolbar">
        <div>
          <span className="eyebrow">LIBRARY INTEGRATIONS</span>
          <h3 id="library-integrations-title">KOHA &amp; DSpace Configuration</h3>
          <p>Configure the institution's existing library services. Local network endpoints are supported; these integrations are not required for normal operation.</p>
        </div>
      </div>

      {canManage && (
        <div className="library-add-card">
          <div>
            <span className="eyebrow">LOCAL ENDPOINTS</span>
            <h4>Service configuration</h4>
            <p>Enter the addresses used by this school's local installation.</p>
          </div>
          <div className="library-book-form">
            <input
              aria-label="KOHA OPAC URL"
              placeholder="KOHA OPAC URL (e.g. http://192.168.1.20:8080)"
              value={config.kohaOpacUrl}
              onChange={(event) => setConfig({ ...config, kohaOpacUrl: event.target.value })}
            />
            <input
              aria-label="KOHA API URL"
              placeholder="KOHA API URL (optional)"
              value={config.kohaApiUrl}
              onChange={(event) => setConfig({ ...config, kohaApiUrl: event.target.value })}
            />
            <input
              aria-label="DSpace URL"
              placeholder="DSpace URL (e.g. http://192.168.1.21:4000)"
              value={config.dspaceUrl}
              onChange={(event) => setConfig({ ...config, dspaceUrl: event.target.value })}
            />
            <button className="library-primary" type="button" onClick={save}>Save Configuration</button>
          </div>
          {message && <p role="status">{message}</p>}
        </div>
      )}

      <div className="integration-grid">
        {integrations.map((integration) => (
          <article className="integration-card" key={integration.id}>
            <div className="integration-card-heading">
              <div>
                <span className="integration-label">{integration.name}</span>
                <h4>{integration.name === 'KOHA' ? 'Library Automation & OPAC' : 'Institutional Repository'}</h4>
              </div>
              <span className={integration.enabled ? 'status connected' : 'status'}>
                {integration.enabled ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <p>{integration.description}</p>
            <div className="integration-url">
              <small>Service URL</small>
              <span>{integration.baseUrl || 'No endpoint configured.'}</span>
            </div>
            <div className="integration-actions">
              <button
                className="secondary-button"
                disabled={!integration.enabled || !integration.baseUrl}
                onClick={() => window.open(integration.baseUrl, '_blank', 'noopener,noreferrer')}
              >
                Open {integration.name}
              </button>
              <span className="integration-note">
                {integration.name === 'KOHA'
                  ? 'KOHA can remain a separate local library system while the management system manages institution-level library workflows.'
                  : 'DSpace can remain a separate local repository while management system provides controlled access from Library Management.'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
