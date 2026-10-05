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
  refreshInstitution: () => Promise<boolean>
  loaded: boolean
}

const InstitutionSettingsContext = createContext<InstitutionSettingsContextValue | null>(null)

function isValidInstitution(settings: InstitutionSettings | null | undefined): settings is InstitutionSettings {
  return Boolean(settings?.id && settings.isActive && settings.institutionName?.trim())
}

export function InstitutionSettingsProvider({ children }: { children: ReactNode }) {
  const [institution, setInstitution] = useState<InstitutionSettings>(DEFAULT_INSTITUTION)
  const [loaded, setLoaded] = useState(false)

  const refreshInstitution = async () => {
    try {
      const settings = await getPublicInstitutionSettings()
      if (!isValidInstitution(settings)) return false
      setInstitution(settings)
      setLoaded(true)
      return true
    } catch {
      // Do not mark the application as loaded until PostgreSQL-backed settings are available.
      return false
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadUntilReady = async () => {
      while (!cancelled) {
        const ready = await refreshInstitution()
        if (cancelled || ready) return
        await new Promise(resolve => window.setTimeout(resolve, 2000))
      }
    }

    void loadUntilReady()

    const handleSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<InstitutionSettings>).detail
      if (isValidInstitution(detail)) setInstitution(detail)
      else void refreshInstitution()
    }
    window.addEventListener('smis:institution-settings-updated', handleSettingsUpdated)

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('smis-institution-settings') : null
    const handleBroadcast = (event: MessageEvent<InstitutionSettings>) => {
      const detail = event.data
      if (isValidInstitution(detail)) setInstitution(detail)
      else void refreshInstitution()
    }
    channel?.addEventListener('message', handleBroadcast)

    // The institution feed is deliberately live: it is refreshed frequently and on focus/visibility.
    const refreshTimer = window.setInterval(() => { void refreshInstitution() }, 5000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshInstitution()
    }
    const handleFocus = () => { void refreshInstitution() }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
      window.removeEventListener('smis:institution-settings-updated', handleSettingsUpdated)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
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
