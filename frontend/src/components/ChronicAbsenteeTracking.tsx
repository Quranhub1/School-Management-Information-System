import { useEffect, useState } from 'react'
import { getChronicAbsenteeReport, getAbsenteeAlerts, type ChronicAbsentee, type AbsenteeAlert } from '../api/chronicAbsentee'

type Tab = 'report' | 'alerts'

export function ChronicAbsenteeTracking() {
  const [tab, setTab] = useState<Tab>('report')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<ChronicAbsentee[]>([])
  const [alerts, setAlerts] = useState<AbsenteeAlert[]>([])
  const [thresholdDays, setThresholdDays] = useState(10)
  const [periodDays, setPeriodDays] = useState(30)

  async function loadReport() {
    setLoading(true)
    setError('')
    try {
      const data = await getChronicAbsenteeReport(thresholdDays, periodDays)
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load chronic absentee report.')
    } finally {
      setLoading(false)
    }
  }

  async function loadAlerts() {
    setLoading(true)
    setError('')
    try {
      const data = await getAbsenteeAlerts(periodDays)
      setAlerts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load absentee alerts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'report') void loadReport()
    else if (tab === 'alerts') void loadAlerts()
  }, [tab])

  function getSeverityColor(severity: string): string {
    if (severity === 'Critical') return '#dc2626'
    if (severity === 'Warning') return '#d97706'
    return '#2563eb'
  }

  return (
    <section className="panel" aria-label="Chronic absentee tracking">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ATTENDANCE</span>
          <h2>Chronic Absentee Tracking</h2>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-workspace-tabs" role="tablist" aria-label="Absentee sections" style={{ marginBottom: 18 }}>
        <button role="tab" aria-selected={tab === 'report'} className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>Chronic Absentee Report</button>
        <button role="tab" aria-selected={tab === 'alerts'} className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}>Alerts & Interventions</button>
      </div>

      <div className="form-row" style={{ marginBottom: 18 }}>
        <label>
          Threshold (absences)
          <input type="number" value={thresholdDays} onChange={e => setThresholdDays(Number(e.target.value))} min={1} />
        </label>
        <label>
          Period (days)
          <input type="number" value={periodDays} onChange={e => setPeriodDays(Number(e.target.value))} min={1} />
        </label>
        <button className="secondary-button" onClick={() => tab === 'report' ? void loadReport() : void loadAlerts()}>Refresh</button>
      </div>

      {loading ? (
        <p className="empty">Loading...</p>
      ) : tab === 'report' ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Absences</th>
                <th>Total Sessions</th>
                <th>Absence Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.length === 0 ? (
                <tr><td colSpan={5} className="empty">No chronic absentees found</td></tr>
              ) : (
                report.map(r => (
                  <tr key={r.studentId}>
                    <td><strong>{r.studentNumber}</strong> {r.studentName}</td>
                    <td>{r.absenceCount}</td>
                    <td>{r.totalSessions}</td>
                    <td style={{ color: r.absenceRate > 30 ? '#dc2626' : r.absenceRate > 15 ? '#d97706' : 'inherit', fontWeight: r.absenceRate > 15 ? 700 : 400 }}>{r.absenceRate}%</td>
                    <td>
                      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: r.isChronic ? '#dc2626' : '#d97706', color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                        {r.isChronic ? 'Chronic' : 'At Risk'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Absences</th>
                <th>Absence Rate</th>
                <th>Severity</th>
                <th>Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr><td colSpan={5} className="empty">No absentee alerts found</td></tr>
              ) : (
                alerts.map(a => (
                  <tr key={a.studentId}>
                    <td><strong>{a.studentNumber}</strong> {a.studentName}</td>
                    <td>{a.absenceCount}</td>
                    <td style={{ color: a.absenceRate > 30 ? '#dc2626' : a.absenceRate > 15 ? '#d97706' : 'inherit', fontWeight: a.absenceRate > 15 ? 700 : 400 }}>{a.absenceRate}%</td>
                    <td>
                      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: getSeverityColor(a.severity), color: 'white', fontSize: '.72rem', fontWeight: 800 }}>
                        {a.severity}
                      </span>
                    </td>
                    <td>{a.suggestedAction}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
