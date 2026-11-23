import { useState } from 'react'
import type { Curriculum } from '../api/curriculumManagement'

function normalizeProgrammeType(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const normalized = String(value ?? '').trim().toLowerCase().replace(/[ _-]/g, '')
  if (normalized === 'fullprogramme' || normalized === 'fullprogram' || normalized === '0') return 0
  if (normalized === 'shortcourse' || normalized === '1') return 1
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : -1
}

export interface CurriculumFilters {
  status: string[]
  programmeType: string[]
  creditRange: { min: number; max: number }
  searchTerm: string
}

interface CurriculumFilterPanelProps {
  curricula: Curriculum[]
  onFilterChange: (filters: CurriculumFilters) => void
  onClearFilters: () => void
}

const initialFilters: CurriculumFilters = {
  status: [],
  programmeType: [],
  creditRange: { min: 0, max: 10000 },
  searchTerm: '',
}

export function CurriculumFilterPanel({ curricula, onFilterChange, onClearFilters }: CurriculumFilterPanelProps) {
  const [filters, setFilters] = useState<CurriculumFilters>(initialFilters)
  const activeCount = curricula.filter(item => item.isActive).length
  const inactiveCount = curricula.length - activeCount

  function update(next: CurriculumFilters) {
    setFilters(next)
    onFilterChange(next)
  }

  function toggleValue(key: 'status' | 'programmeType', value: string, checked: boolean) {
    const current = filters[key]
    update({ ...filters, [key]: checked ? [...current, value] : current.filter(item => item !== value) })
  }

  function clear() {
    setFilters(initialFilters)
    onClearFilters()
  }

  return (
    <section className="curriculum-filter-panel" aria-label="Filter curricula" style={{ border: "1px solid #d6d3d1", borderRadius: 8, padding: 12, background: "#fafaf9" }}>
      <div className="curriculum-filter-heading" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <strong>Filter curricula</strong>
        <span>{curricula.length} total · {activeCount} active · {inactiveCount} inactive</span>
      </div>
      <div className="curriculum-filter-controls" style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 14 }}>
        <label className="curriculum-filter-search">
          <span>Search</span>
          <input
            type="search"
            value={filters.searchTerm}
            placeholder="Search curriculum or version"
            onChange={event => update({ ...filters, searchTerm: event.target.value })}
          />
        </label>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 4 }}>
          <legend>Status</legend>
          <label><input type="checkbox" checked={filters.status.includes('active')} onChange={event => toggleValue('status', 'active', event.target.checked)} /> Active ({activeCount})</label>
          <label><input type="checkbox" checked={filters.status.includes('inactive')} onChange={event => toggleValue('status', 'inactive', event.target.checked)} /> Inactive ({inactiveCount})</label>
        </fieldset>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 4 }}>
          <legend>Programme type</legend>
          <label><input type="checkbox" checked={filters.programmeType.includes('0')} onChange={event => toggleValue('programmeType', '0', event.target.checked)} /> Full programme</label>
          <label><input type="checkbox" checked={filters.programmeType.includes('1')} onChange={event => toggleValue('programmeType', '1', event.target.checked)} /> Short course</label>
        </fieldset>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 4 }}>
          <legend>Minimum credits</legend>
          <div className="curriculum-credit-range" style={{ display: "flex", gap: 8 }}>
            <label>From <input type="number" min="0" value={filters.creditRange.min} onChange={event => update({ ...filters, creditRange: { ...filters.creditRange, min: Math.max(0, Number(event.target.value)) } })} /></label>
            <label>To <input type="number" min="0" value={filters.creditRange.max} onChange={event => update({ ...filters, creditRange: { ...filters.creditRange, max: Math.max(0, Number(event.target.value)) } })} /></label>
          </div>
        </fieldset>
        <button type="button" className="secondary-button" onClick={clear}>Clear filters</button>
      </div>
    </section>
  )
}
