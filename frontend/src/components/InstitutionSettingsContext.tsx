import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getPublicInstitutionSettings, type InstitutionSettings } from '../api/institutionSettings'

const DEFAULT_INSTITUTION: InstitutionSettings = {
  id: '',
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
  logoPath: null,
  primaryColor: null,
  accentColor: null,
  isActive: false,
  updatedAt: '',
}

interface InstitutionSettingsContextValue {
  institution: InstitutionSettings
  setInstitution: (settings: InstitutionSettings) => void
  refreshInstitution: () => Promise<void>
  loaded: boolean
}

const InstitutionSettingsContext = createContext<InstitutionSettingsContextValue | null>(null)

export function InstitutionSettingsProvider({ children }: { children: ReactNode }) {
  const [institution, setInstitution] = useState<InstitutionSettings>(DEFAULT_INSTITUTION)
  const [loaded, setLoaded] = useState(false)

  const refreshInstitution = async () => {
    try {
      const settings = await getPublicInstitutionSettings()
      if (settings?.id && settings.institutionName?.trim()) setInstitution(settings)
      setLoaded(true)
    } catch {
      // Keep the last known settings. The database/API remains the source of truth.
      setLoaded(true)
    }
  }

  useEffect(() => {
    void refreshInstitution()
    const handleSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<InstitutionSettings>).detail
      if (detail?.id && detail.institutionName?.trim()) setInstitution(detail)
      else void refreshInstitution()
    }
    window.addEventListener('smis:institution-settings-updated', handleSettingsUpdated)

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('smis-institution-settings') : null
    const handleBroadcast = (event: MessageEvent<InstitutionSettings>) => {
      const detail = event.data
      if (detail?.id && detail.institutionName?.trim()) setInstitution(detail)
      else void refreshInstitution()
    }
    channel?.addEventListener('message', handleBroadcast)
    return () => {
      window.removeEventListener('smis:institution-settings-updated', handleSettingsUpdated)
      channel?.removeEventListener('message', handleBroadcast)
      channel?.close()
    }
  }, [])

  const value = useMemo(() => ({ institution, setInstitution, refreshInstitution, loaded }), [institution, loaded])

  return <InstitutionSettingsContext.Provider value={value}>{children}</InstitutionSettingsContext.Provider>
}

export function useInstitutionSettings() {
  const context = useContext(InstitutionSettingsContext)
  if (!context) throw new Error('useInstitutionSettings must be used inside InstitutionSettingsProvider')
  return context
}

export { DEFAULT_INSTITUTION }
