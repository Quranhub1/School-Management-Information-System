import { ModernInformationHub } from './ModernInformationHub'
import './AnalyticsDashboard.css'

export function AnalyticsDashboard() {
  return <section className="analytics-panel" aria-label="Institutional analytics">
    <div className="analytics-heading">
      <div><p className="eyebrow">Chart.js visual analytics</p><h2>Institutional Analytics & Intelligence</h2></div>
    </div>
    <ModernInformationHub />
  </section>
}
