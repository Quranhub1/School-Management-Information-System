import { useEffect, useState } from 'react';
import {
  emptyLibraryPluginSettings,
  getLibraryPluginSettings,
  saveLibraryPluginSettings,
  testLibraryPluginConnection,
  type LibraryPluginSettings,
} from '../api/libraryIntegrations';

type EditableSettings = LibraryPluginSettings & { kohaPassword: string; dSpacePassword: string };
const blank: EditableSettings = { ...emptyLibraryPluginSettings, kohaPassword: '', dSpacePassword: '' };

export function LibraryIntegrations({ canManage }: { canManage?: boolean }) {
  const [settings, setSettings] = useState<EditableSettings>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<'koha' | 'dspace' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getLibraryPluginSettings()
      .then(value => { if (active) setSettings({ ...value, kohaPassword: '', dSpacePassword: '' }); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load plugin settings.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) =>
    setSettings(current => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true); setError(''); setMessage('');
    try {
      const saved = await saveLibraryPluginSettings(settings);
      setSettings(current => ({ ...saved, kohaPassword: '', dSpacePassword: '' }));
      setMessage('Plugin connection settings saved securely on the SMIS server.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save plugin settings.');
    } finally { setSaving(false); }
  }

  async function test(service: 'koha' | 'dspace') {
    setTesting(service); setError(''); setMessage('');
    try {
      const result = await testLibraryPluginConnection(service);
      if (result.ok) setMessage(result.message); else setError(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Connection test failed.');
    } finally { setTesting(null); }
  }

  if (loading) return <section className="library-integrations"><p>Loading plugin settings…</p></section>;

  return (
    <section className="library-integrations" aria-labelledby="library-integrations-title">
      <div className="library-toolbar"><div><span className="eyebrow">SYSTEM PLUGINS</span><h3 id="library-integrations-title">Koha and DSpace connections</h3><p>Connect SMIS to the library and repository servers already hosted by your institution.</p></div></div>
      {error && <p role="alert" className="form-error">{error}</p>}
      {message && <p role="status" className="form-success">{message}</p>}
      {canManage && <>
        <article className="library-add-card">
          <div><span className="eyebrow">PHYSICAL LIBRARY</span><h4>Koha connection</h4><p>Enter the OPAC address and REST API endpoint. Credentials are encrypted by the SMIS server and are never returned to the browser.</p></div>
          <div className="library-book-form">
            <label>Koha OPAC URL<input value={settings.kohaOpacUrl} onChange={e => update('kohaOpacUrl', e.target.value)} placeholder="http://koha-server:8080" /></label>
            <label>Koha REST API URL<input value={settings.kohaApiUrl} onChange={e => update('kohaApiUrl', e.target.value)} placeholder="http://koha-server:8080/api/v1" /></label>
            <label>API username<input value={settings.kohaUsername ?? ''} onChange={e => update('kohaUsername', e.target.value)} autoComplete="off" /></label>
            <label>API password<input type="password" value={settings.kohaPassword} onChange={e => update('kohaPassword', e.target.value)} placeholder={settings.hasKohaPassword ? 'Saved — leave blank to keep current password' : 'Enter API password'} autoComplete="new-password" /></label>
            <label className="checkbox-label"><input type="checkbox" checked={settings.kohaEnabled} onChange={e => update('kohaEnabled', e.target.checked)} /> Enable Koha integration</label>
            <button type="button" className="secondary-button" disabled={testing !== null || !settings.kohaApiUrl.trim() && !settings.kohaOpacUrl.trim()} onClick={() => void test('koha')}>{testing === 'koha' ? 'Testing…' : 'Test Koha connection'}</button>
          </div>
        </article>
        <article className="library-add-card">
          <div><span className="eyebrow">DIGITAL REPOSITORY</span><h4>DSpace connection</h4><p>Use the DSpace REST API for repository operations and OAI-PMH for metadata identification and harvesting.</p></div>
          <div className="library-book-form">
            <label>DSpace base URL<input value={settings.dSpaceBaseUrl} onChange={e => update('dSpaceBaseUrl', e.target.value)} placeholder="https://repository.example.org" /></label>
            <label>DSpace REST API URL<input value={settings.dSpaceRestApiUrl} onChange={e => update('dSpaceRestApiUrl', e.target.value)} placeholder="https://repository.example.org/server/api" /></label>
            <label>DSpace OAI-PMH URL<input value={settings.dSpaceOaiPmhUrl} onChange={e => update('dSpaceOaiPmhUrl', e.target.value)} placeholder="https://repository.example.org/server/oai/request" /></label>
            <label>API username (if required)<input value={settings.dSpaceUsername ?? ''} onChange={e => update('dSpaceUsername', e.target.value)} autoComplete="off" /></label>
            <label>API password / token<input type="password" value={settings.dSpacePassword} onChange={e => update('dSpacePassword', e.target.value)} placeholder={settings.hasDSpacePassword ? 'Saved — leave blank to keep current password' : 'Enter API password or token'} autoComplete="new-password" /></label>
            <label className="checkbox-label"><input type="checkbox" checked={settings.dSpaceEnabled} onChange={e => update('dSpaceEnabled', e.target.checked)} /> Enable DSpace integration</label>
            <button type="button" className="secondary-button" disabled={testing !== null || !settings.dSpaceOaiPmhUrl.trim() && !settings.dSpaceBaseUrl.trim()} onClick={() => void test('dspace')}>{testing === 'dspace' ? 'Testing…' : 'Test DSpace connection'}</button>
          </div>
        </article>
        <div className="library-toolbar"><button type="button" className="library-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save plugin configuration'}</button></div>
      </>}
      <div className="integration-grid">
        <article className="integration-card"><div className="integration-card-heading"><div><span className="integration-label">KOHA</span><h4>Library Automation &amp; OPAC</h4></div><span className={settings.kohaEnabled && settings.kohaApiUrl ? 'status connected' : 'status'}>{settings.kohaEnabled && settings.kohaApiUrl ? 'Enabled' : 'Not connected'}</span></div><div className="integration-url"><small>OPAC address</small><span>{settings.kohaOpacUrl || 'No OPAC address configured.'}</span></div>{settings.kohaOpacUrl && <div className="integration-actions"><a className="secondary-button" href={settings.kohaOpacUrl} target="_blank" rel="noreferrer">Open Koha OPAC</a></div>}</article>
        <article className="integration-card"><div className="integration-card-heading"><div><span className="integration-label">DSPACE</span><h4>Institutional Repository</h4></div><span className={settings.dSpaceEnabled && settings.dSpaceBaseUrl ? 'status connected' : 'status'}>{settings.dSpaceEnabled && settings.dSpaceBaseUrl ? 'Enabled' : 'Not connected'}</span></div><div className="integration-url"><small>Repository address</small><span>{settings.dSpaceBaseUrl || 'No repository address configured.'}</span></div>{settings.dSpaceBaseUrl && <div className="integration-actions"><a className="secondary-button" href={settings.dSpaceBaseUrl} target="_blank" rel="noreferrer">Open DSpace</a></div>}</article>
      </div>
    </section>
  );
}
