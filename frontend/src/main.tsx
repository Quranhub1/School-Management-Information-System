import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { InstitutionSettingsProvider } from './components/InstitutionSettingsContext'
import { installGlobalErrorHandlers } from './lib/logging'
import { QueryCacheProvider } from './lib/QueryCacheProvider'
import './styles.css'
import './institution-theme.css'
import './tailadmin-inspired.css'
import './sidebar-fixed.css'
import './table-font.css'
import './workspace-density.css'

installGlobalErrorHandlers()

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Vite owns development assets. Unregister production workers and remove
    // only SMIS caches so stale bundles cannot mix with the current module graph.
    void navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    )
    void caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('smis-')).map((key) => caches.delete(key))),
    )
  } else {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('SMIS offline service worker registration failed:', error)
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryCacheProvider>
      <InstitutionSettingsProvider>
        <App />
      </InstitutionSettingsProvider>
    </QueryCacheProvider>
  </StrictMode>,
)
