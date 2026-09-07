import { useEffect, useState } from 'react'
import { createInstitutionSettings, getActiveInstitutionSettings, type CreateInstitutionSettingsRequest, type InstitutionSettings } from '../api/institutionSettings'

type SettingsTab = 'general' | 'branding' | 'gallery'

interface InstitutionSettingsPageProps {
  onSaved: (settings: InstitutionSettings) => void
}

export function InstitutionSettingsPage({ onSaved }: InstitutionSettingsPageProps) {
  const [active, setActive] = useState<InstitutionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<SettingsTab>('general')

  const [form, setForm] = useState<CreateInstitutionSettingsRequest>({
    institutionName: '',
    abbreviation: '',
    motto: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    postalAddress: '',
    country: '',
    institutionType: '',
    logoPath: '',
    primaryColor: '#1e40af',
    accentColor: '#f97316',
  })

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getActiveInstitutionSettings()
      setActive(data)
      setForm({
        institutionName: data.institutionName,
        abbreviation: data.abbreviation ?? '',
        motto: data.motto ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        website: data.website ?? '',
        postalAddress: data.postalAddress ?? '',
        country: data.country ?? '',
        institutionType: data.institutionType ?? '',
        logoPath: data.logoPath ?? '',
        primaryColor: data.primaryColor ?? '#1e40af',
        accentColor: data.accentColor ?? '#f97316',
      })
    } catch {
      setError('Unable to load institution settings.')
    } finally {
      setLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const result = await createInstitutionSettings(form)
      setActive(result)
      onSaved(result)
      setSuccess('Institution settings saved successfully.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  function updateField<K extends keyof CreateInstitutionSettingsRequest>(field: K, value: CreateInstitutionSettingsRequest[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (loading) return <p className="empty">Loading institution settings…</p>

  return (
    <section className="panel" aria-label="Institution settings">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h2>Institution Settings</h2>
        </div>
        {active && <span>Last updated: {new Date(active.updatedAt).toLocaleString()}</span>}
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Settings sections">
        <button role="tab" aria-selected={tab === 'general'} className={tab === 'general' ? 'active' : ''} onClick={() => setTab('general')}>General Information</button>
        <button role="tab" aria-selected={tab === 'branding'} className={tab === 'branding' ? 'active' : ''} onClick={() => setTab('branding')}>Branding</button>
        <button role="tab" aria-selected={tab === 'gallery'} className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>Gallery</button>
      </div>

      <form className="student-form" onSubmit={submit}>
        {tab === 'general' && (
          <div className="settings-grid">
            <div className="form-row">
              <label>Institution Name<input required value={form.institutionName} onChange={e => updateField('institutionName', e.target.value)} /></label>
              <label>Abbreviation<input value={form.abbreviation} onChange={e => updateField('abbreviation', e.target.value)} maxLength={50} /></label>
            </div>
            <div className="form-row">
              <label>Institution Type<select value={form.institutionType} onChange={e => updateField('institutionType', e.target.value)}><option value="">Select type</option><option>University</option><option>College</option><option>Health Training Institution</option><option>Vocational Institute</option><option>Polytechnic</option><option>School</option></select></label>
              <label>Country<input value={form.country} onChange={e => updateField('country', e.target.value)} /></label>
            </div>
            <div className="form-row">
              <label>Address<input value={form.address} onChange={e => updateField('address', e.target.value)} /></label>
              <label>Postal Address<input value={form.postalAddress} onChange={e => updateField('postalAddress', e.target.value)} /></label>
            </div>
            <div className="form-row">
              <label>Phone<input value={form.phone} onChange={e => updateField('phone', e.target.value)} /></label>
              <label>Email<input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} /></label>
            </div>
            <label>Website<input value={form.website} onChange={e => updateField('website', e.target.value)} /></label>
            <label>Motto<textarea value={form.motto} onChange={e => updateField('motto', e.target.value)} rows={2} /></label>
          </div>
        )}

        {tab === 'branding' && (
          <div className="settings-grid">
            <div className="form-row">
              <label>Logo Path/URL<input value={form.logoPath} onChange={e => updateField('logoPath', e.target.value)} placeholder="https://... or /uploads/logo.png" /></label>
              <label>Primary Color<input type="color" value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} /></label>
            </div>
            <div className="form-row">
              <label>Accent Color<input type="color" value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} /></label>
            </div>
            {form.logoPath && (
              <div className="logo-preview">
                <p><strong>Logo Preview:</strong></p>
                <img src={form.logoPath} alt="Institution logo" style={{ maxHeight: 120, maxWidth: 200, objectFit: 'contain', border: '1px solid #e7e5e4', borderRadius: 8, padding: 8 }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
              </div>
            )}
          </div>
        )}

        {tab === 'gallery' && (
          <div className="gallery-section">
            <h4>Institution Gallery</h4>
            <p className="empty">Graduation photos, campus images, events, and facility highlights. Image upload and gallery management coming soon.</p>
            <div className="gallery-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="gallery-placeholder">
                  <div className="gallery-img">Image {i}</div>
                  <p>Gallery image placeholder {i}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="topbar-actions" style={{ marginTop: 22 }}>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
          <button type="button" className="secondary-button" onClick={() => void load()}>Reset</button>
        </div>
      </form>
    </section>
  )
}
