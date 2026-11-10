import { useEffect, useState } from 'react'
import {
  getInstitutionEmailSettings,
  saveInstitutionEmailSettings,
  sendInstitutionEmailTest,
  type InstitutionEmailSettings,
  type SaveInstitutionEmailSettings,
} from '../api/institutionSettings'

const initial: SaveInstitutionEmailSettings = {
  enabled: false,
  host: 'smtp.gmail.com',
  port: 465,
  secureMode: 'SslOnConnect',
  username: '',
  password: '',
  fromAddress: '',
  fromName: 'Kampala School of Health Sciences',
}

export function InstitutionEmailSettingsPanel() {
  const [form, setForm] = useState<SaveInstitutionEmailSettings>(initial)
  const [passwordConfigured, setPasswordConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const data: InstitutionEmailSettings = await getInstitutionEmailSettings()
        setForm({
          enabled: data.emailEnabled,
          host: data.emailSmtpHost ?? 'smtp.gmail.com',
          port: data.port,
          secureMode: data.secureMode,
          username: data.emailSmtpUsername ?? '',
          password: '',
          fromAddress: data.fromAddress ?? '',
          fromName: data.fromName ?? '',
        })
        setPasswordConfigured(data.passwordConfigured)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load email settings.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function update<K extends keyof SaveInstitutionEmailSettings>(key: K, value: SaveInstitutionEmailSettings[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function save() {
    setSaving(true); setError(''); setSuccess('')
    try {
      const result = await saveInstitutionEmailSettings(form)
      setPasswordConfigured(result.passwordConfigured)
      setForm(current => ({ ...current, password: '' }))
      setSuccess('Institutional email settings saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save email settings.')
    } finally {
      setSaving(false)
    }
  }

  async function test() {
    setTesting(true); setError(''); setSuccess('')
    try {
      const result = await sendInstitutionEmailTest(recipient)
      setSuccess(`Test email sent to ${result.recipient}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SMTP test failed.')
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <p className="empty">Loading institutional email settings…</p>

  return (
    <section className="settings-grid" aria-label="Institutional email settings">
      <div className="form-row">
        <label>SMTP host<input value={form.host} onChange={e => update('host', e.target.value)} placeholder="smtp.gmail.com" /></label>
        <label>SMTP port<input type="number" min={1} max={65535} value={form.port} onChange={e => update('port', Number(e.target.value))} /></label>
      </div>
      <div className="form-row">
        <label>TLS mode<select value={form.secureMode} onChange={e => update('secureMode', e.target.value)}>
          <option value="SslOnConnect">SSL/TLS (465)</option>
          <option value="StartTls">STARTTLS (587)</option>
          <option value="StartTlsWhenAvailable">STARTTLS when available</option>
        </select></label>
        <label>SMTP username<input autoComplete="username" value={form.username} onChange={e => update('username', e.target.value)} /></label>
      </div>
      <div className="form-row">
        <label>Sender email<input type="email" value={form.fromAddress} onChange={e => update('fromAddress', e.target.value)} /></label>
        <label>Sender display name<input value={form.fromName} onChange={e => update('fromName', e.target.value)} /></label>
      </div>
      <label>SMTP password<input type="password" autoComplete="new-password" value={form.password ?? ''} onChange={e => update('password', e.target.value)} placeholder={passwordConfigured ? 'Saved securely — leave blank to keep it' : 'Enter SMTP password or app password'} /></label>
      <p>{passwordConfigured ? 'SMTP password is stored encrypted. It is never returned to the browser.' : 'No SMTP password has been saved yet.'}</p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={form.enabled} onChange={e => update('enabled', e.target.checked)} />
        Enable institutional email delivery
      </label>
      <div className="gallery-upload-actions">
        <button type="button" className="gallery-upload-btn" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save email settings'}</button>
      </div>
      <div className="form-row">
        <label>Test recipient email<input type="email" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="admin@example.com" /></label>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button type="button" className="gallery-upload-btn" disabled={testing || !recipient.trim() || !form.enabled} onClick={() => void test()}>{testing ? 'Sending…' : 'Send test email'}</button>
        </div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}
    </section>
  )
}
