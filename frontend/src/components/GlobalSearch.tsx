import { useEffect, useRef, useState } from 'react'
import { globalSearch, type GlobalSearchResponse } from '../api/globalSearch'

const EMPTY: GlobalSearchResponse = {
  query: '',
  students: [],
  staff: [],
  courses: [],
  programmes: [],
  academicYears: [],
  semesters: [],
  teachingGroups: [],
  applicants: [],
  alumni: [],
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [results, setResults] = useState<GlobalSearchResponse>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(EMPTY)
      setOpen(false)
      return
    }
    setLoading(true)
    setActiveIndex(0)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(query.trim(), from || undefined, to || undefined)
        setResults(data)
        setOpen(true)
      } catch {
        setResults(EMPTY)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, from, to])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const total = results.students.length + results.staff.length + results.courses.length + results.programmes.length + results.academicYears.length + results.semesters.length + results.teachingGroups.length + results.applicants.length + results.alumni.length

  function navigate(delta: number) {
    const max = total
    if (max === 0) return
    setActiveIndex(i => (i + delta + max) % max)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); navigate(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); navigate(-1) }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const items: { label: string; type: string; data: { id: string } }[] = []
  for (const s of results.students) items.push({ label: `${s.fullName} (${s.studentNumber})`, type: 'Student', data: s })
  for (const s of results.staff) items.push({ label: `${s.fullName} (${s.staffNumber})`, type: 'Staff', data: s })
  for (const c of results.courses) items.push({ label: `${c.code} — ${c.name}`, type: 'Course', data: c })
  for (const p of results.programmes) items.push({ label: `${p.code} — ${p.name}`, type: 'Programme', data: p })
  for (const y of results.academicYears) items.push({ label: `${y.name} ${y.isCurrent ? '(current)' : ''}`, type: 'Academic Year', data: y })
  for (const s of results.semesters) items.push({ label: `${s.name} (seq ${s.sequence})`, type: 'Semester', data: s })
  for (const g of results.teachingGroups) items.push({ label: `${g.groupCode}${g.name ? ` — ${g.name}` : ''}`, type: 'Teaching Group', data: g })
  for (const a of results.applicants) items.push({ label: `${a.applicationNumber} — ${a.fullName}`, type: 'Applicant', data: a })
  for (const a of results.alumni) items.push({ label: `${a.fullName}`, type: 'Alumni', data: a })

  return (
    <div className="global-search" ref={containerRef}>
      <div className="search-input-row">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search students, courses, staff, programmes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (total > 0) setOpen(true) }}
          onKeyDown={handleKey}
          aria-label="Global search"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
        />
        <button type="button" className="search-filter-toggle" onClick={() => setShowFilters(f => !f)} aria-pressed={showFilters}>Filters</button>
      </div>
      {showFilters && (
        <div className="search-filters">
          <label>
            <span>From</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </label>
        </div>
      )}
      {loading && <span className="search-status" aria-live="polite">Searching…</span>}
      {open && total > 0 && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          {items.map((item, idx) => (
            <div
              key={`${item.type}-${idx}`}
              className={`search-result-item ${idx === activeIndex ? 'active' : ''}`}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => { setOpen(false); setQuery(''); setFrom(''); setTo(''); }}
            >
              <span className="search-result-type">{item.type}</span>
              <span className="search-result-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}
      {open && !loading && total === 0 && query.trim().length >= 2 && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          <div className="search-empty">No results for “{query.trim()}”</div>
        </div>
      )}
    </div>
  )
}
