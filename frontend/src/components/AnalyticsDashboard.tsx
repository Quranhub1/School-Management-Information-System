import { useEffect, useRef, useState } from 'react'
import { embedDashboard } from '@superset-ui/embedded-sdk'
import { getSupersetConfig, getSupersetGuestToken } from '../api/analytics'
import './AnalyticsDashboard.css'

export function AnalyticsDashboard() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [disabled, setDisabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    let embedded: { unmount?: () => void } | undefined

    async function load() {
      try {
        setLoading(true)
        setError('')
        const config = await getSupersetConfig()
        if (cancelled) return

        if (!config.enabled || !config.supersetDomain || !config.dashboardId) {
          setDisabled(true)
          setLoading(false)
          return
        }

        if (!mountRef.current) return
        embedded = await embedDashboard({
          id: config.dashboardId,
          supersetDomain: config.supersetDomain,
          mountPoint: mountRef.current,
          fetchGuestToken: getSupersetGuestToken,
          dashboardUiConfig: {
            hideTitle: true,
            hideTab: true,
            hideChartControls: true,
            filters: { visible: true, expanded: false },
            urlParams: { themeMode: 'system' },
          },
          iframeAllowExtras: ['fullscreen'],
          referrerPolicy: 'same-origin',
        })
        if (!cancelled) setLoading(false)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unable to load analytics.')
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
      embedded?.unmount?.()
    }
  }, [])

  return (
    <section className="analytics-panel">
      <div className="analytics-heading">
        <div>
          <p className="eyebrow">Business intelligence</p>
          <h2>Institutional Analytics</h2>
          <p>Interactive dashboards powered by Apache Superset.</p>
        </div>
      </div>
      {loading && <div className="analytics-state">Loading analytics dashboard…</div>}
      {disabled && !loading && (
        <div className="analytics-state">
          <strong>Analytics is installed but not configured yet.</strong>
          <span>Set the Superset dashboard ID and public URL on the API, then reload this page.</span>
        </div>
      )}
      {error && !loading && <div className="analytics-state error" role="alert">{error}</div>}
      <div ref={mountRef} className="superset-dashboard" aria-label="Institutional analytics dashboard" />
    </section>
  )
}
