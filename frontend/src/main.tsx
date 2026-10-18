import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PlasmicCanvasHost, PlasmicRootProvider } from '@plasmicapp/loader-react'
import App from './App'
import { PLASMIC } from './plasmic-init'
import './styles.css'
import './tailadmin-inspired.css'
import './sidebar-fixed.css'
import './table-font.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

const root = createRoot(document.getElementById('root')!)

if (window.location.pathname === '/plasmic-host') {
  root.render(
    <StrictMode>
      <PlasmicRootProvider loader={PLASMIC}>
        <PlasmicCanvasHost />
      </PlasmicRootProvider>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
