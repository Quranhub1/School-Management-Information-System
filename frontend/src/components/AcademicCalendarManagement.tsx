import { useEffect, useState } from 'react'
import {
  createAcademicPeriod, createAcademicYear, getAcademicPeriods, getAcademicYears,
  setAcademicPeriodActive, setAcademicYearActive, setCurrentAcademicPeriod,
  setCurrentAcademicYear, updateAcademicPeriod, updateAcademicYear,
  type AcademicPeriod, type AcademicYear,
} from '../api/academicCalendar'

const emptyYear = { name: '', startDate: '', endDate: '' }
const emptyPeriod = { name: '', sequence: '1', startDate: '', endDate: '' }

export function AcademicCalendarManagement() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [yearForm, setYearForm] = useState(emptyYear)
  const [periodForm, setPeriodForm] = useState(emptyPeriod)
  const [editingYear, setEditingYear] = useState<string | null>(null)
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { void loadYears() }, [])
  useEffect(() => {
    if (!selectedYear) { setPeriods([]); return }
    let cancelled = false
    getAcademicPeriods(selectedYear).then(rows => { if (!cancelled) setPeriods(rows) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load academic periods.') })
    return () => { cancelled = true }
  }, [selectedYear])

  async function loadYears(preferred?: string) {
    try {
      const rows = await getAcademicYears()
      setYears(rows)
      const selected = preferred ?? rows.find(x => x.isCurrent && x.isActive)?.id ?? rows.find(x => x.isActive)?.id ?? ''
      setSelectedYear(selected)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load academic years.') }
  }

  async function loadPeriods() {
    if (selectedYear) setPeriods(await getAcademicPeriods(selectedYear))
  }

  async function saveYear(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true); setError(''); setMessage('')
    let preferredYear = editingYear ?? undefined
    try {
      if (editingYear) {
        await updateAcademicYear(editingYear, yearForm)
        setMessage('Academic year updated.')
      } else {
        const created = await createAcademicYear(yearForm)
        setMessage('Academic year created.')
        preferredYear = created.id
      }
      setEditingYear(null); setYearForm(emptyYear)
      await loadYears(preferredYear)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save academic year.') }
    finally { setLoading(false) }
  }

  function editYear(year: AcademicYear) {
    setEditingYear(year.id)
    setYearForm({ name: year.name, startDate: year.startDate, endDate: year.endDate })
  }

  async function toggleYear(year: AcademicYear) {
    setLoading(true); setError('')
    try {
      await setAcademicYearActive(year.id, !year.isActive)
      await loadYears(selectedYear === year.id && year.isActive ? undefined : selectedYear)
      setMessage(year.isActive ? 'Academic year deactivated.' : 'Academic year activated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update academic year.') }
    finally { setLoading(false) }
  }

  async function makeCurrentYear(year: AcademicYear) {
    setLoading(true); setError('')
    try {
      await setCurrentAcademicYear(year.id); await loadYears(year.id)
      setMessage('Current academic year updated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to set current academic year.') }
    finally { setLoading(false) }
  }

  async function savePeriod(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedYear) return
    setLoading(true); setError(''); setMessage('')
    const values = { name: periodForm.name, sequence: Number(periodForm.sequence), startDate: periodForm.startDate, endDate: periodForm.endDate }
    try {
      if (editingPeriod) {
        await updateAcademicPeriod(selectedYear, editingPeriod, values)
        setMessage('Academic period updated.')
      } else {
        await createAcademicPeriod({ academicYearId: selectedYear, ...values })
        setMessage('Academic period created.')
      }
      setEditingPeriod(null); setPeriodForm(emptyPeriod); await loadPeriods()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save academic period.') }
    finally { setLoading(false) }
  }

  function editPeriod(period: AcademicPeriod) {
    setEditingPeriod(period.id)
    setPeriodForm({ name: period.name, sequence: String(period.sequence), startDate: period.startDate, endDate: period.endDate })
  }

  async function togglePeriod(period: AcademicPeriod) {
    setLoading(true); setError('')
    try {
      await setAcademicPeriodActive(selectedYear, period.id, !period.isActive)
      await loadPeriods(); setMessage(period.isActive ? 'Academic period deactivated.' : 'Academic period activated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update academic period.') }
    finally { setLoading(false) }
  }

  async function makeCurrentPeriod(period: AcademicPeriod) {
    setLoading(true); setError('')
    try {
      await setCurrentAcademicPeriod(selectedYear, period.id); await loadPeriods()
      setMessage('Current academic period updated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to set current academic period.') }
    finally { setLoading(false) }
  }

  return <section className="academic-workspace" aria-label="Academic calendar management">
    <div className="panel-heading"><div><p className="eyebrow">Academic Calendar</p><h2>Academic years &amp; periods</h2></div></div>
    {error && <div className="error" role="alert">{error}</div>}
    {message && <p role="status">{message}</p>}
    <form className="student-form" onSubmit={saveYear}>
      <h3>{editingYear ? 'Edit academic year' : 'Add academic year'}</h3>
      <div className="form-row">
        <input required value={yearForm.name} onChange={e => setYearForm({ ...yearForm, name: e.target.value })} placeholder="Academic year name" />
        <label>Start <input required type="date" value={yearForm.startDate} onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })} /></label>
        <label>End <input required type="date" value={yearForm.endDate} onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })} /></label>
        <button type="submit" disabled={loading}>{editingYear ? 'Save Year' : 'Add Year'}</button>
        {editingYear && <button type="button" className="secondary-button" onClick={() => { setEditingYear(null); setYearForm(emptyYear) }}>Cancel Edit</button>}
      </div>
    </form>
    <div className="table-wrap"><table><thead><tr><th>Academic year</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{years.length === 0 ? <tr><td colSpan={4} className="empty">No academic years configured.</td></tr> : years.map(year => <tr key={year.id}>
        <td>{year.name}</td><td>{year.startDate} – {year.endDate}</td><td>{year.isCurrent ? 'Current' : year.isActive ? 'Active' : 'Inactive'}</td>
        <td><button type="button" onClick={() => editYear(year)}>Edit</button> <button type="button" disabled={loading || !year.isActive} onClick={() => void makeCurrentYear(year)}>Make Current</button> <button type="button" className="secondary-button" disabled={loading} onClick={() => void toggleYear(year)}>{year.isActive ? 'Deactivate' : 'Activate'}</button></td>
      </tr>)}</tbody>
    </table></div>
    <div className="form-row">
      <label htmlFor="calendar-year-select">Manage periods for</label>
      <select id="calendar-year-select" value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setEditingPeriod(null); setPeriodForm(emptyPeriod) }}>
        <option value="">Select academic year</option>{years.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}
      </select>
    </div>
    {selectedYear && <>
      <form className="student-form" onSubmit={savePeriod}>
        <h3>{editingPeriod ? 'Edit academic period' : 'Add academic period'}</h3>
        <div className="form-row">
          <input required value={periodForm.name} onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })} placeholder="Period name (e.g. Semester 1)" />
          <input required type="number" min="1" value={periodForm.sequence} onChange={e => setPeriodForm({ ...periodForm, sequence: e.target.value })} placeholder="Sequence" />
          <label>Start <input required type="date" value={periodForm.startDate} onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })} /></label>
          <label>End <input required type="date" value={periodForm.endDate} onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })} /></label>
          <button type="submit" disabled={loading}>{editingPeriod ? 'Save Period' : 'Add Period'}</button>
          {editingPeriod && <button type="button" className="secondary-button" onClick={() => { setEditingPeriod(null); setPeriodForm(emptyPeriod) }}>Cancel Edit</button>}
        </div>
      </form>
      <div className="table-wrap"><table><thead><tr><th>Period</th><th>Sequence</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{periods.length === 0 ? <tr><td colSpan={5} className="empty">No periods configured.</td></tr> : periods.map(period => <tr key={period.id}>
          <td>{period.name}</td><td>{period.sequence}</td><td>{period.startDate} – {period.endDate}</td><td>{period.isCurrent ? 'Current' : period.isActive ? 'Active' : 'Inactive'}</td>
          <td><button type="button" onClick={() => editPeriod(period)}>Edit</button> <button type="button" disabled={loading || !period.isActive} onClick={() => void makeCurrentPeriod(period)}>Make Current</button> <button type="button" className="secondary-button" disabled={loading} onClick={() => void togglePeriod(period)}>{period.isActive ? 'Deactivate' : 'Activate'}</button></td>
        </tr>)}</tbody>
      </table></div>
    </>}
  </section>
}
