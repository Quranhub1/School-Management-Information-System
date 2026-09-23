import { useEffect, useState } from 'react'
import { addGalleryUrl, createInstitutionSettings, deleteGalleryItem, getActiveInstitutionSettings, getGallery, uploadGalleryImage, uploadInstitutionLogo, type CreateInstitutionSettingsRequest, type GalleryItem, type InstitutionSettings } from '../api/institutionSettings'

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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryTitle, setGalleryTitle] = useState('')
  const [galleryCaption, setGalleryCaption] = useState('')
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryPreview, setGalleryPreview] = useState<GalleryItem | null>(null)

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
    void loadGallery()
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

  async function loadGallery() {
    setGalleryLoading(true)
    try { setGallery(await getGallery()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load gallery.') } finally { setGalleryLoading(false) }
  }

  async function uploadGalleryFiles() {
    if (!galleryFiles.length) return
    setUploadingGallery(true); setError(''); setSuccess('')
    try {
      const uploaded: GalleryItem[] = []
      for (const file of galleryFiles) {
        const title = galleryTitle.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        uploaded.push(await uploadGalleryImage(file, title, galleryCaption.trim()))
      }
      setGallery(current => [...uploaded, ...current])
      setGalleryFiles([]); setGalleryTitle(''); setGalleryCaption('')
      setSuccess(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} added to the gallery.`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to upload gallery images.') }
    finally { setUploadingGallery(false) }
  }

  async function removeGalleryItem(id: string) {
    try { await deleteGalleryItem(id); setGallery(current => current.filter(item => item.id !== id)); setSuccess('Gallery image removed.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to remove gallery image.') }
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true); setError(''); setSuccess('')
    try { const result = await uploadInstitutionLogo(file); setActive(result); setForm(prev => ({ ...prev, logoPath: result.logoPath ?? '' })); onSaved(result); setSuccess('Institution logo saved successfully.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to upload logo.') }
    finally { setUploadingLogo(false) }
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
              <label>Logo URL<input value={form.logoPath} onChange={e => updateField('logoPath', e.target.value)} placeholder="https://..." /></label>
              <label>Upload Logo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingLogo || !active} onChange={e => { const file=e.target.files?.[0]; if(file) void uploadLogo(file) }} />{!active&&<small>Save institution details first.</small>}</label>
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
            <div className="gallery-heading">
              <div>
                <p className="eyebrow">Institution Gallery</p>
                <h3>Classic photo gallery</h3>
                <p>Upload as many campus, graduation, event, laboratory and facility photographs as needed. Photos are displayed as a traditional framed gallery.</p>
              </div>
              <span className="gallery-count">{gallery.length} image{gallery.length === 1 ? '' : 's'}</span>
            </div>

            <div className="gallery-upload-panel">
              <label>Choose multiple images
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploadingGallery} onChange={e => setGalleryFiles(Array.from(e.target.files ?? []))} />
              </label>
              <label>Title (optional)<input value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)} placeholder="Shared title, or leave blank to use filenames" /></label>
              <label>Caption (optional)<textarea value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} rows={2} placeholder="Describe the selected photographs" /></label>
              {galleryFiles.length > 0 && <p className="gallery-selection">{galleryFiles.length} image{galleryFiles.length === 1 ? '' : 's'} selected</p>}
              <button type="button" onClick={() => void uploadGalleryFiles()} disabled={!galleryFiles.length || uploadingGallery}>
                {uploadingGallery ? 'Uploading images…' : 'Upload selected images'}
              </button>
            </div>

            {galleryLoading ? <p className="empty">Loading gallery…</p> : gallery.length === 0 ? (
              <div className="gallery-empty">No photographs have been uploaded yet. Add multiple images above.</div>
            ) : (
              <div className="classic-gallery">
                {gallery.map(item => (
                  <article className="classic-gallery-item" key={item.id}>
                    <button type="button" className="classic-gallery-photo" onClick={() => setGalleryPreview(item)} aria-label={`View ${item.title}`}>
                      <img src={item.imageUrl} alt={item.title} loading="lazy" />
                    </button>
                    <div className="classic-gallery-caption">
                      <h4>{item.title}</h4>
                      {item.caption && <p>{item.caption}</p>}
                      <small>{new Date(item.uploadedAt).toLocaleDateString()}</small>
                      <button type="button" className="secondary-button" onClick={() => void removeGalleryItem(item.id)}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {galleryPreview && (
              <div className="gallery-lightbox" role="dialog" aria-modal="true" onClick={() => setGalleryPreview(null)}>
                <div className="gallery-lightbox-card" onClick={e => e.stopPropagation()}>
                  <button type="button" className="close-button" onClick={() => setGalleryPreview(null)}>×</button>
                  <img src={galleryPreview.imageUrl} alt={galleryPreview.title} />
                  <h3>{galleryPreview.title}</h3>
                  {galleryPreview.caption && <p>{galleryPreview.caption}</p>}
                </div>
              </div>
            )}
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
