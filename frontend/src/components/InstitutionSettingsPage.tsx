import { useEffect, useState } from 'react'
import { useInstitutionSettings } from './InstitutionSettingsContext'
import { addGalleryUrl, createInstitutionSettings, deleteGalleryItem, getActiveInstitutionSettings, getGallery, uploadGalleryImage, uploadInstitutionLogo, uploadInstitutionLogoFromUrl, type CreateInstitutionSettingsRequest, type GalleryItem, type InstitutionSettings } from '../api/institutionSettings'

type SettingsTab = 'general' | 'branding' | 'gallery'

interface InstitutionSettingsPageProps {
  onSaved: (settings: InstitutionSettings) => void
}

export function InstitutionSettingsPage({ onSaved }: InstitutionSettingsPageProps) {
  const { setInstitution } = useInstitutionSettings()
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
  const [logoRefreshKey, setLogoRefreshKey] = useState(0)

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
    }
    finally {
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
      await loadGallery()
      // Additional verification: reload gallery again after short delay to ensure DB commit
      await new Promise(resolve => setTimeout(resolve, 1000))
      await loadGallery()
      setGalleryFiles([]); setGalleryTitle(''); setGalleryCaption('')
      setSuccess(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} added to the gallery.`)
    } catch (e) { 
      setError(e instanceof Error ? e.message : 'Unable to upload gallery images.')
      // Even on error, try to reload gallery in case partial success or to show current state
      try { await loadGallery() } catch (reloadError) { /* ignore reload errors */ }
    }
    finally { setUploadingGallery(false) }
  }

  async function removeGalleryItem(id: string) {
    try { await deleteGalleryItem(id); setGallery(current => current.filter(item => item.id !== id)); setSuccess('Gallery image removed.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to remove gallery image.') }
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true); setError(''); setSuccess('')
    try {
      const result = await uploadInstitutionLogo(file)
      setActive(result)
      setForm(prev => ({ ...prev, logoPath: result.logoPath ?? '' }))
      setInstitution(result)
      onSaved(result)
      setLogoRefreshKey(k => k + 1)
      window.dispatchEvent(new CustomEvent('smis:institution-settings-updated', { detail: result }))
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('smis-institution-settings')
        channel.postMessage(result)
        channel.close()
      }
      setSuccess('Logo uploaded successfully!')
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to upload logo.') }
    finally { setUploadingLogo(false) }
  }

  function getLogoPreviewUrl(path: string): string {
    if (!path) return ''
    const url = path.startsWith('http') ? path : `${(import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''}${path.startsWith('/') ? path : '/' + path}`
    return `${url}?v=${logoRefreshKey}&t=${Date.now()}`
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const remoteLogoUrl = form.logoPath?.trim() ?? ''
      const isRemoteLogo = /^https?:\/\//i.test(remoteLogoUrl)

      const result = await createInstitutionSettings({
        ...form,
        logoPath: isRemoteLogo ? (active?.logoPath ?? '') : remoteLogoUrl,
      })

      let finalResult = result
      if (isRemoteLogo) {
        finalResult = await uploadInstitutionLogoFromUrl(remoteLogoUrl)
      }

      setActive(finalResult)
      setForm(prev => ({ ...prev, logoPath: finalResult.logoPath ?? '' }))
      setInstitution(finalResult)
      onSaved(finalResult)
      setLogoRefreshKey(k => k + 1)
      window.dispatchEvent(new CustomEvent('smis:institution-settings-updated', { detail: finalResult }))
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('smis-institution-settings')
        channel.postMessage(finalResult)
        channel.close()
      }
      setSuccess(isRemoteLogo ? 'Institution settings and logo saved successfully. The logo is now stored locally.' : 'Institution settings saved successfully.')
    }
    catch (e) {
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
    <section className="panel" aria-label="Institution settings" style={{ minHeight: '100vh' }}>
      <div className="panel-heading" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', paddingBottom: '8px' }}>
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
        </div>
        <div>
          <h2>Institution Settings</h2>
        </div>
        {active && (
          <div>
            <span>Last updated: {new Date(active.updatedAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Settings sections" style={{ marginBottom: '16px' }}>
        <button role="tab" aria-selected={tab === 'general'} className={tab === 'general' ? 'active' : ''} onClick={() => setTab('general')}>General Information</button>
        <button role="tab" aria-selected={tab === 'branding'} className={tab === 'branding' ? 'active' : ''} onClick={() => setTab('branding')}>Branding</button>
        <button role="tab" aria-selected={tab === 'gallery'} className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>Gallery</button>
      </div>

      <div className="sheet-content" style={{ flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
        <form className="student-form" onSubmit={submit} style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 16px' }}>
          {tab === 'general' && (
            <>
              <div className="settings-grid" style={{ flex: '1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div className="form-row">
                  <label>Institution Name<input required value={form.institutionName} onChange={e => updateField('institutionName', e.target.value)} /></label>
                  <label>Abbreviation<input value={form.abbreviation} onChange={e => updateField('abbreviation', e.target.value)} maxLength={50} /></label>
                </div>
                <div className="form-row">
                  <label>Institution Type<select value={form.institutionType} onChange={e => updateField('institutionType', e.target.value)}><option value="">Select type</option><option>University</option><option>College</option><option>School</option><option>Training Center</option></select></label>
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
                <div>
                  <label>Website<input value={form.website} onChange={e => updateField('website', e.target.value)} /></label>
                  <label>Motto<textarea value={form.motto} onChange={e => updateField('motto', e.target.value)} rows={2} /></label>
                </div>
              </div>
            </>
          )}

          {tab === 'branding' && (
            <>
              <div className="settings-grid" style={{ flex: '1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div className="form-row">
                  <label>Logo URL<input value={form.logoPath} onChange={e => updateField('logoPath', e.target.value)} placeholder="https://..." /></label>
                  <label>Upload Logo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingLogo || !active} onChange={e => { const file=e.target.files?.[0]; if(file) void uploadLogo(file) }} /></label>
                </div>
                <div className="form-row">
                  <label>Primary Color<input type="color" value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} /></label>
                  <label>Accent Color<input type="color" value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} /></label>
                </div>
                {form.logoPath && (
                  <div className="logo-preview" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span><strong>Logo Preview:</strong></span>
                    <img src={getLogoPreviewUrl(form.logoPath)} alt="Institution logo" style={{ maxHeight: 120, maxWidth: 200, objectFit: 'contain', border: '1px solid #e7e5e4', borderRadius: 8, padding: 8 }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'gallery' && (
            <>
              <div className="gallery-section" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="gallery-heading" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div>
                    <p className="eyebrow" style={{ margin: 0 }}>Institution Gallery</p>
                    <h3 style={{ margin: 0 }}>Classic photo gallery</h3>
                  </div>
                  <span className="gallery-count">{gallery.length} image{gallery.length === 1 ? '' : 's'}</span>
                  <p style={{ margin: '8px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                    Upload as many campus, graduation, event, laboratory and facility photographs as needed. Photos are displayed as a traditional framed gallery.
                  </p>
                </div>

                <div className="gallery-upload-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label>Choose multiple images
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploadingGallery} onChange={e => setGalleryFiles(Array.from(e.target.files ?? []))} />
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label>Title (optional)<input value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)} placeholder="Shared title, or leave blank to use filenames" /></label>
                      <label>Caption (optional)<textarea value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} rows={2} placeholder="Describe the selected photographs" /></label>
                    </div>
                  </div>
                  {galleryFiles.length > 0 && <p className="gallery-selection" style={{ margin: 0 }}>{galleryFiles.length} image{galleryFiles.length === 1 ? '' : 's'} selected</p>}
                  <button type="button" onClick={() => void uploadGalleryFiles()} disabled={!galleryFiles.length || uploadingGallery} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                    {uploadingGallery ? 'Uploading images…' : 'Upload selected images'}
                  </button>
                </div>

                <div className="gallery-display" style={{ flex: '1', minHeight: '0' }}>
                  {galleryLoading ? <p className="empty" style={{ margin: 0, textAlign: 'center', paddingTop: '40px' }}>Loading gallery…</p> : gallery.length === 0 ? (
                    <div className="gallery-empty" style={{ textAlign: 'center', padding: '40px 0' }}>
                      No photographs have been uploaded yet. Add multiple images above.
                    </div>
                  ) : (
                    <div className="classic-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', padding: '0 16px' }}>
                      {gallery.map(item => (
                        <article className="classic-gallery-item" key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                          <button type="button" className="classic-gallery-photo" onClick={() => setGalleryPreview(item)} aria-label={`View ${item.title}`} style={{ flex: '1 0 auto', minHeight: '0' }}>
                            <img src={item.imageUrl} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                          </button>
                          <div className="classic-gallery-caption" style={{ flex: '0 0 auto', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{item.title}</h4>
                            {item.caption && <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{item.caption}</p>}
                            <small style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(item.uploadedAt).toLocaleDateString()}</small>
                            <button type="button" className="secondary-button" onClick={() => void removeGalleryItem(item.id)} style={{ alignSelf: 'flex-start', marginTop: '4px', padding: '4px 10px', fontSize: '0.875rem' }}>Remove</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                {galleryPreview && (
                  <div className="gallery-lightbox" role="dialog" aria-modal="true" onClick={() => setGalleryPreview(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="gallery-lightbox-card" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '12px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto', position: 'relative' }}>
                      <button type="button" className="close-button" onClick={() => setGalleryPreview(null)} style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px' }}>×</button>
                      <div style={{ textAlign: 'center', padding: '32px' }}>
                        <img src={galleryPreview.imageUrl} alt={galleryPreview.title} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
                        <h3 style={{ margin: '24px 0 16px', fontSize: '1.75rem' }}>{galleryPreview.title}</h3>
                        {galleryPreview.caption && <p style={{ margin: '16px 0 0', fontSize: '1rem', color: '#64748b' }}>{galleryPreview.caption}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="topbar-actions" style={{ marginTop: 'auto', padding: '0 16px', display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
            <button type="button" className="secondary-button" onClick={() => void load()}>Reset</button>
          </div>
        </form>
      </div>
    </section>
  )
}