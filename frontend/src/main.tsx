import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { InstitutionSettingsProvider } from './components/InstitutionSettingsContext'
import './styles.css'
import './institution-theme.css'
import './tailadmin-inspired.css'
import './sidebar-fixed.css'
import './table-font.css'
import './workspace-density.css'

// A service worker must never control Vite's development server. A stale
// cache can mix old React bundles with the current provider tree and break HMR.
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
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
    <InstitutionSettingsProvider>
      <App />
    </InstitutionSettingsProvider>
  </StrictMode>,
)
