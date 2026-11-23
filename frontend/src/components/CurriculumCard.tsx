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
    <article className={`curriculum-card${isSelected ? ' is-selected' : ''}`} style={{ minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: isSelected ? '2px solid var(--primary, #2563eb)' : '1px solid var(--border, #d6d3d1)', borderRadius: 10, background: 'var(--surface, #fff)', overflow: 'hidden', boxSizing: 'border-box' }}>
      <button
        type="button"
        className="curriculum-card-select"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', alignContent: 'start', gap: 8, minWidth: 0, width: '100%', textAlign: 'left', border: 0, padding: 0, background: 'transparent', color: 'inherit', cursor: 'pointer' }}
        aria-pressed={isSelected}
        onClick={onSelect}
        onKeyDown={handleSelectKeyDown}
      >
        <span className={`curriculum-card-status ${curriculum.isActive ? 'is-active' : 'is-inactive'}`}>
          {curriculum.isActive ? 'Active' : 'Inactive'}
        </span>
        <strong className="curriculum-card-title" style={{ display: 'block', minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'normal', lineHeight: 1.35 }}>{curriculum.title}</strong>
        <span className="curriculum-card-programme" style={{ display: 'block', minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.4 }}>{programmeName}</span>
        <span className="curriculum-card-meta" style={{ display: 'block', minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.4 }}>Version {curriculum.version} · Effective {displayDate(curriculum.effectiveFrom)}</span>
        <span className="curriculum-card-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, minWidth: 0, padding: '10px 0', borderTop: '1px solid #e7e5e4', borderBottom: '1px solid #e7e5e4' }}>
          <span><strong>{courseCount}</strong><small>Courses</small></span>
          <span><strong>{totalCredits}</strong><small>Total credits</small></span>
          <span><strong>{curriculum.minimumCredits}</strong><small>Minimum required</small></span>
        </span>
        {curriculum.effectiveTo && <span className="curriculum-card-meta" style={{ display: 'block', minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>Effective to {displayDate(curriculum.effectiveTo)}</span>}
        <span className="curriculum-card-selection" style={{ display: 'block', minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.4 }}>{isSelected ? 'Selected for course mapping' : 'Select to manage course mapping'}</span>
      </button>
      <div className="curriculum-card-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 4, minWidth: 0 }}>
        <button type="button" onClick={event => { event.stopPropagation(); onEdit() }}>Edit</button>
        <button type="button" className="secondary-button" onClick={event => { event.stopPropagation(); onToggleStatus() }}>
          {curriculum.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </article>
  )
}
