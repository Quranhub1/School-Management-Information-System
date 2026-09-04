import { useEffect, useRef, useState } from 'react'
import { embedDashboard } from '@superset-ui/embedded-sdk'
import { getSupersetConfig, getSupersetGuestToken } from '../api/analytics'
import { ModernInformationHub } from './ModernInformationHub'
import './AnalyticsDashboard.css'

export function AnalyticsDashboard() {
  const [tab, setTab] = useState<'overview' | 'bi'>('overview')
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [disabled, setDisabled] = useState(false)

  useEffect(() => {
    if (tab !== 'bi') return
    let cancelled = false
    let embedded: { unmount?: () => void } | undefined

    async function load() {
      try {
        setLoading(true); setError('')
        const config = await getSupersetConfig()
        if (cancelled) return
        if (!config.enabled || !config.supersetDomain || !config.dashboardId) { setDisabled(true); setLoading(false); return }
        if (!mountRef.current) return
        embedded = await embedDashboard({
          id: config.dashboardId,
          supersetDomain: config.supersetDomain,
          mountPoint: mountRef.current,
          fetchGuestToken: getSupersetGuestToken,
          dashboardUiConfig: { hideTitle: true, hideTab: true, hideChartControls: true, filters: { visible: true, expanded: false }, urlParams: { themeMode: 'system' } },
          iframeAllowExtras: ['fullscreen'], referrerPolicy: 'same-origin',
        })
        if (!cancelled) setLoading(false)
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : 'Unable to load analytics.'); setLoading(false) }
      }
    }
    void load()
    return () => { cancelled = true; embedded?.unmount?.() }
  }, [tab])

  return <section className="analytics-panel">
    <div className="analytics-heading">
      <div><p className="eyebrow">Business intelligence</p><h2>Institutional Analytics & Intelligence</h2><p>One offline command centre connecting the operational SMIS modules with predictive analytics and Apache Superset BI.</p></div>
    </div>
    <div className="library-workspace-tabs" role="tablist" aria-label="Analytics sections">
      <button role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Modern command centre</button>
      <button role="tab" aria-selected={tab === 'bi'} className={tab === 'bi' ? 'active' : ''} onClick={() => setTab('bi')}>Apache Superset BI</button>
    </div>
    {tab === 'overview' && <ModernInformationHub />}
    {tab === 'bi' && <>
      {loading && <div className="analytics-state">Loading analytics dashboard…</div>}
      {disabled && !loading && <div className="analytics-state"><strong>Superset is installed but not configured yet.</strong><span>Configure the local Superset dashboard ID and URL, or continue using the offline command centre.</span></div>}
      {error && !loading && <div className="analytics-state error" role="alert">{error}</div>}
      <div ref={mountRef} className="superset-dashboard" aria-label="Institutional analytics dashboard" />
    </>}
  </section>
}
