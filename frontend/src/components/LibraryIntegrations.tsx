import { useEffect, useState } from 'react';
import {
  defaultLibraryIntegrations,
  listLibraryIntegrations,
  type LibraryIntegration,
} from '../api/libraryIntegrations';

export function LibraryIntegrations() {
  const [integrations, setIntegrations] = useState<LibraryIntegration[]>(
    defaultLibraryIntegrations,
  );

  useEffect(() => {
    void listLibraryIntegrations()
      .then(setIntegrations)
      .catch(() => setIntegrations(defaultLibraryIntegrations));
  }, []);

  return (
    <section className="library-integrations" aria-labelledby="library-integrations-title">
      <div className="library-toolbar">
        <div>
          <span className="eyebrow">CONNECTED LIBRARY SERVICES</span>
          <h3 id="library-integrations-title">KOHA &amp; DSpace</h3>
          <p>Connect the school library workspace to the existing library automation and repository systems.</p>
        </div>
      </div>

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
              <span>{integration.baseUrl || 'Configure the service URL for this school installation.'}</span>
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
                  ? 'Use KOHA for catalogue/OPAC and library automation workflows.'
                  : 'Use DSpace for institutional repository and digital-content workflows.'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
