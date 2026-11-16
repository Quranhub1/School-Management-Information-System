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
    setMessage('Plugin endpoint settings saved in this browser. Connection status is verified separately.');
    void refresh();
  }

  return (
    <section className="library-integrations" aria-labelledby="library-integrations-title">
      <div className="library-toolbar">
        <div>
          <span className="eyebrow">SYSTEM PLUGINS</span>
          <h3 id="library-integrations-title">Connected library plugins</h3>
          
        </div>
      </div>

      {canManage && (
        <div className="library-add-card">
          <div>
            <span className="eyebrow">PLUGIN CONNECTIONS</span>
            <h4>Koha and DSpace connection settings</h4>
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
                {integration.enabled ? 'Endpoint configured' : 'Not configured'}
              </span>
            </div>
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
                Open {integration.name} workspace
              </button>
              <span className="integration-note">
                {integration.name === 'KOHA'
                  ? 'Koha provides the library catalogue and circulation service. The workspace opens the connected Koha service; in-app API operations require a configured Koha API connection.'
                  : 'DSpace provides the institutional repository. The workspace opens the connected DSpace service; repository API operations require a configured DSpace REST connection.'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
