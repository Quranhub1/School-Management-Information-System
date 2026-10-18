import { useEffect, useState } from 'react'
import { useInstitutionSettings } from './InstitutionSettingsContext'
import { createInstitutionSettings, deleteGalleryItem, getActiveInstitutionSettings, getGallery, uploadGalleryImage, uploadInstitutionLogo, uploadInstitutionLogoFromUrl, type CreateInstitutionSettingsRequest, type GalleryItem, type InstitutionSettings } from '../api/institutionSettings'

type SettingsTab = 'general' | 'branding' | 'gallery'
type GalleryFilter = 'all' | 'recent' | 'captioned'

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
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all')
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryTitle, setGalleryTitle] = useState('')
  const [galleryCaption, setGalleryCaption] = useState('')
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryError, setGalleryError] = useState('')
  const [galleryImageFailures, setGalleryImageFailures] = useState<string[]>([])
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
    } finally {
      setLoading(false)
    }
  }

  async function loadGallery(): Promise<boolean> {
    setGalleryLoading(true)
    setGalleryError('')
    try {
      const items = await getGallery()
      setGallery(items)
      setGalleryImageFailures([])
      return true
    } catch (e) {
      setGalleryError(e instanceof Error ? e.message : 'Unable to load gallery.')
      return false
    } finally {
      setGalleryLoading(false)
    }
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
      // Read the gallery back from the public database endpoint before showing success.
      // loadGallery() intentionally handles its own errors for normal page loads, so use
      // getGallery() directly here to ensure a failed/stale listing cannot look successful.
      const refreshedGallery = await getGallery()
      setGallery(refreshedGallery)
      setGalleryImageFailures([])
      const visibleIds = new Set(refreshedGallery.map(item => item.id))
      const missingUploads = uploaded.filter(item => !visibleIds.has(item.id))
      if (missingUploads.length > 0) {
        throw new Error(
          `${missingUploads.length} upload(s) were accepted, but the public gallery could not read them back from the database. Check that the upload and gallery-list endpoints use the same running backend and database.`,
        )
      }

      setGalleryFiles([]); setGalleryTitle(''); setGalleryCaption('')
      setSuccess(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} saved and verified in the gallery.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to upload gallery images.')
      // If a later file in a multi-file batch fails, still show any earlier files saved successfully.
      await loadGallery()
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  function updateField<K extends keyof CreateInstitutionSettingsRequest>(field: K, value: CreateInstitutionSettingsRequest[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const visibleGallery = gallery.filter(item => {
    if (galleryFilter === 'captioned') return Boolean(item.caption?.trim())
    if (galleryFilter === 'recent') return Date.now() - new Date(item.uploadedAt).getTime() <= 30 * 24 * 60 * 60 * 1000
    return true
  })

  useEffect(() => {
    if (!galleryPreview) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGalleryPreview(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [galleryPreview])

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
            <label>Website<input value={form.website} onChange={e => updateField('website', e.target.value)} /></label>
            <label>Motto<textarea value={form.motto} onChange={e => updateField('motto', e.target.value)} rows={2} /></label>
          </div>
        )}

        {tab === 'branding' && (
          <div className="settings-grid">
            <div className="form-row">
              <label>Logo URL<input value={form.logoPath} onChange={e => updateField('logoPath', e.target.value)} placeholder="https://..." /></label>
              <label>Upload Logo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingLogo || !active} onChange={e => { const file=e.target.files?.[0]; if(file) void uploadLogo(file) }} /></label>
              <label>Primary Color<input type="color" value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} /></label>
            </div>
            <div className="form-row">
              <label>Accent Color<input type="color" value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} /></label>
            </div>
            {form.logoPath && (
              <div className="logo-preview" key={logoRefreshKey}>
                <p><strong>Logo Preview:</strong></p>
                <img src={getLogoPreviewUrl(form.logoPath)} alt="Institution logo" style={{ maxHeight: 120, maxWidth: 200, objectFit: 'contain', border: '1px solid #e7e5e4', borderRadius: 8, padding: 8 }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            )}
          </div>
        )}

        {tab === 'gallery' && (
          <div className="gallery-section smis-gallery">
            <div className="gallery-heading smis-gallery-heading">
              <div>
                <p className="eyebrow">INSTITUTION MEDIA</p>
                <h3>School Media & Event Gallery</h3>
                
              </div>
              <span className="gallery-count">{visibleGallery.length} of {gallery.length} photo{gallery.length === 1 ? '' : 's'}</span>
            </div>

            <div className="gallery-filter-tabs" role="group" aria-label="Filter gallery photos">
              <button type="button" className={galleryFilter === 'all' ? 'active' : ''} aria-pressed={galleryFilter === 'all'} onClick={() => setGalleryFilter('all')}>All photos</button>
              <button type="button" className={galleryFilter === 'recent' ? 'active' : ''} aria-pressed={galleryFilter === 'recent'} onClick={() => setGalleryFilter('recent')}>Last 30 days</button>
              <button type="button" className={galleryFilter === 'captioned' ? 'active' : ''} aria-pressed={galleryFilter === 'captioned'} onClick={() => setGalleryFilter('captioned')}>With captions</button>
            </div>

            <div className="gallery-upload-panel">
              <label>Choose image files
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploadingGallery} onChange={e => setGalleryFiles(Array.from(e.target.files ?? []))} />
                <small>JPG, PNG, WebP or GIF · up to 10 MB per image</small>
              </label>
              <label>Photo / event title (optional)
                <input value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)} placeholder="Leave blank to use each filename" maxLength={180} />
              </label>
              <label>Caption or notes (optional)
                <textarea value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} rows={2} placeholder="Add event details or context" maxLength={2000} />
              </label>
              <div className="gallery-upload-actions">
                {galleryFiles.length > 0 && <span className="gallery-selection">{galleryFiles.length} file{galleryFiles.length === 1 ? '' : 's'} selected</span>}
                <button type="button" className="gallery-upload-btn" onClick={() => void uploadGalleryFiles()} disabled={!galleryFiles.length || uploadingGallery}>
                  <span aria-hidden="true">{uploadingGallery ? '…' : '+'}</span>
                  {uploadingGallery ? 'Uploading…' : 'Upload photos'}
                </button>
              </div>
            </div>

            {galleryLoading ? <p className="empty" role="status">Loading gallery photos…</p> : galleryError ? (
              <div className="gallery-load-error" role="alert">
                <p><strong>Unable to load gallery photos.</strong></p>
                <p>{galleryError}</p>
                <button type="button" className="secondary-button" onClick={() => void loadGallery()}>Retry loading gallery</button>
              </div>
            ) : visibleGallery.length === 0 ? (
              <div className="gallery-empty">
                <div className="gallery-empty-icon" aria-hidden="true">▧</div>
                <h4>{gallery.length === 0 ? 'Your institution gallery is ready' : 'No photos match this filter'}</h4>
                
                {gallery.length > 0 && <button type="button" className="secondary-button" onClick={() => setGalleryFilter('all')}>Show all photos</button>}
              </div>
            ) : (
              <div className="classic-gallery">
                {visibleGallery.map(item => (
                  <article className="classic-gallery-item" key={item.id}>
                    <button type="button" className="classic-gallery-photo" onClick={() => { if (!galleryImageFailures.includes(item.id)) setGalleryPreview(item) }} aria-label={`Preview ${item.title}`} disabled={galleryImageFailures.includes(item.id)}>
                      <span className="badge-category">{item.source === 'upload' ? 'SCHOOL PHOTO' : 'EXTERNAL IMAGE'}</span>
                      {galleryImageFailures.includes(item.id) ? (
                        <span className="gallery-image-fallback" role="img" aria-label={`${item.title}: image could not be loaded`}>
                          <span aria-hidden="true">Image unavailable</span>
                          <small>Check the API connection or stored image.</small>
                        </span>
                      ) : (
                        <img src={item.imageUrl} alt={item.title} loading="lazy"
                          onError={() => setGalleryImageFailures(current => current.includes(item.id) ? current : [...current, item.id])}
                          onLoad={() => setGalleryImageFailures(current => current.filter(id => id !== item.id))} />
                      )}
                    </button>
                    <div className="classic-gallery-caption">
                      <div className="classic-gallery-copy">
                        <h4>{item.title}</h4>
                        {item.caption && <p>{item.caption}</p>}
                      </div>
                      <div className="card-footer">
                        <small>Added {new Date(item.uploadedAt).toLocaleDateString()}</small>
                        <button type="button" className="delete-btn" onClick={() => void removeGalleryItem(item.id)} aria-label={`Permanently delete ${item.title}`} title="Delete photo">
                          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {galleryPreview && (
              <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={galleryPreview.title} onClick={() => setGalleryPreview(null)}>
                <div className="gallery-lightbox-card" onClick={e => e.stopPropagation()}>
                  <button type="button" className="lightbox-close" onClick={() => setGalleryPreview(null)} aria-label="Close photo preview">×</button>
                  <img src={galleryPreview.imageUrl} alt={galleryPreview.title} />
                  <h3>{galleryPreview.title}</h3>
                  {galleryPreview.caption && <p>{galleryPreview.caption}</p>}
                  <div className="gallery-lightbox-meta">
                    <span className="badge-category">{galleryPreview.source === 'upload' ? 'SCHOOL PHOTO' : 'EXTERNAL IMAGE'}</span>
                    <small>Added {new Date(galleryPreview.uploadedAt).toLocaleString()}</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="topbar-actions" style={{ marginTop: 22 }}>
          <button type="submit" disabled={saving} style={{ backgroundColor: '#15803d', color: '#ffffff', border: '1px solid #15803d', borderRadius: 6, minHeight: 42, padding: '10px 20px', fontWeight: 600, boxShadow: 'none' }}>{saving ? 'Saving…' : 'Save Settings'}</button>
          <button type="button" className="secondary-button" onClick={() => void load()}>Reset</button>
        </div>
      </form>
    </section>
  )
}
