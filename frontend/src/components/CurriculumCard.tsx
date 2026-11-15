import type { KeyboardEvent } from 'react'
import type { Curriculum } from '../api/curriculumManagement'

interface CurriculumCardProps {
  curriculum: Curriculum
  programmeName: string
  courseCount: number
  totalCredits: number
  onEdit: () => void
  onToggleStatus: () => void
  onSelect: () => void
  isSelected: boolean
}

function displayDate(value?: string | null) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function CurriculumCard({
  curriculum,
  programmeName,
  courseCount,
  totalCredits,
  onEdit,
  onToggleStatus,
  onSelect,
  isSelected,
}: CurriculumCardProps) {
  function handleSelectKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <article className={`curriculum-card${isSelected ? ' is-selected' : ''}`}>
      <button
        type="button"
        className="curriculum-card-select"
        style={{ display: "grid", gap: 8, width: "100%", textAlign: "left", border: 0, padding: 0, background: "transparent", color: "inherit", cursor: "pointer" }}
        aria-pressed={isSelected}
        onClick={onSelect}
        onKeyDown={handleSelectKeyDown}
      >
        <span className={`curriculum-card-status ${curriculum.isActive ? 'is-active' : 'is-inactive'}`}>
          {curriculum.isActive ? 'Active' : 'Inactive'}
        </span>
        <strong className="curriculum-card-title">{curriculum.title}</strong>
        <span className="curriculum-card-programme">{programmeName}</span>
        <span className="curriculum-card-meta">Version {curriculum.version} · Effective {displayDate(curriculum.effectiveFrom)}</span>
        <span className="curriculum-card-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, padding: "10px 0", borderTop: "1px solid #e7e5e4", borderBottom: "1px solid #e7e5e4" }}>
          <span><strong>{courseCount}</strong><small>Courses</small></span>
          <span><strong>{totalCredits}</strong><small>Total credits</small></span>
          <span><strong>{curriculum.minimumCredits}</strong><small>Minimum required</small></span>
        </span>
        {curriculum.effectiveTo && <span className="curriculum-card-meta">Effective to {displayDate(curriculum.effectiveTo)}</span>}
        <span className="curriculum-card-selection">{isSelected ? 'Selected for course mapping' : 'Select to manage course mapping'}</span>
      </button>
      <div className="curriculum-card-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={event => { event.stopPropagation(); onEdit() }}>Edit</button>
        <button type="button" className="secondary-button" onClick={event => { event.stopPropagation(); onToggleStatus() }}>
          {curriculum.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </article>
  )
}
