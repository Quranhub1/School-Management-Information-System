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
}

const InstitutionSettingsContext = createContext<InstitutionSettingsContextValue | null>(null)

export function InstitutionSettingsProvider({ children }: { children: ReactNode }) {
  const [institution, setInstitution] = useState<InstitutionSettings>(DEFAULT_INSTITUTION)

  const refreshInstitution = async () => {
    try {
      const settings = await getPublicInstitutionSettings()
      setInstitution(settings)
    } catch {
      // Keep the last known settings so the application remains usable offline.
    }
  }

  useEffect(() => {
    void refreshInstitution()
    const handleSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<InstitutionSettings>).detail
      if (detail?.institutionName !== undefined) setInstitution(detail)
      else void refreshInstitution()
    }
    window.addEventListener('smis:institution-settings-updated', handleSettingsUpdated)
    return () => window.removeEventListener('smis:institution-settings-updated', handleSettingsUpdated)
  }, [])

  const value = useMemo(() => ({ institution, setInstitution, refreshInstitution }), [institution])

  return <InstitutionSettingsContext.Provider value={value}>{children}</InstitutionSettingsContext.Provider>
}

export function useInstitutionSettings() {
  const context = useContext(InstitutionSettingsContext)
  if (!context) throw new Error('useInstitutionSettings must be used inside InstitutionSettingsProvider')
  return context
}

export { DEFAULT_INSTITUTION }
