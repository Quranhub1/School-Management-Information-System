import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
<<<<<<< HEAD
import { InstitutionSettingsProvider } from './components/InstitutionSettingsContext'
import { installGlobalErrorHandlers } from './lib/logging'
import { QueryCacheProvider } from './lib/QueryCacheProvider'
<<<<<<< HEAD
=======
import { installGlobalErrorHandlers } from './lib/logging'
>>>>>>> origin/feat/structured-logging-observability
=======
>>>>>>> origin/feat/tanstack-query-offline-cache
import './styles.css'
<<<<<<< HEAD
import './institution-theme.css'
=======
>>>>>>> origin/feat/tailadmin-inspired-smis-ui
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
<<<<<<< HEAD
      <InstitutionSettingsProvider>
        <App />
      </InstitutionSettingsProvider>
=======
      <App />
>>>>>>> origin/feat/tanstack-query-offline-cache
    </QueryCacheProvider>
  </StrictMode>,
)
