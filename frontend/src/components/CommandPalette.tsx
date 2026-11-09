import { useEffect, useMemo, useRef, useState } from 'react'
import { Command as CommandMenu } from 'cmdk'
import { Search } from 'lucide-react'
import { globalSearch, normalizeSearchTerm, type GlobalSearchResponse } from '../api/globalSearch'
import './CommandPalette.css'

interface SearchItem {
  id: string
  label: string
  detail: string
  type: string
  module: string
}

interface CommandPaletteProps {
  scope: string
  onNavigate: (module: string) => void
}

const EMPTY_RESULTS: GlobalSearchResponse = {
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

function toSearchItems(data: GlobalSearchResponse): SearchItem[] {
  return [
    ...data.students.map(item => ({ id: item.id, label: item.fullName, detail: item.studentNumber, type: 'Student', module: 'students' })),
    ...data.applicants.map(item => ({ id: item.id, label: item.fullName, detail: item.applicationNumber, type: 'Applicant', module: 'students' })),
    ...data.alumni.map(item => ({ id: item.id, label: item.fullName, detail: 'Alumni', type: 'Alumni', module: 'students' })),
    ...data.staff.map(item => ({ id: item.id, label: item.fullName, detail: item.staffNumber, type: 'Staff', module: 'staff' })),
    ...data.courses.map(item => ({ id: item.id, label: item.name, detail: item.code, type: 'Course', module: 'curriculum' })),
    ...data.programmes.map(item => ({ id: item.id, label: item.name, detail: item.code, type: 'Programme', module: 'curriculum' })),
    ...data.academicYears.map(item => ({ id: item.id, label: item.name, detail: item.isCurrent ? 'Current academic year' : 'Academic year', type: 'Academic year', module: 'academics' })),
    ...data.semesters.map(item => ({ id: item.id, label: item.name, detail: `Semester ${item.sequence}`, type: 'Semester', module: 'academics' })),
    ...data.teachingGroups.map(item => ({ id: item.id, label: item.name || item.groupCode, detail: item.groupCode, type: 'Teaching group', module: 'academics' })),
  ]
}

export function CommandPalette({ scope, onNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!paletteRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    const term = normalizeSearchTerm(query)
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      setSearchError(null)
      return
    }

    setResults([])
    setSearchError(null)
    setLoading(true)
    let active = true
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      // This is a global search, not a search limited to the currently open module.
      globalSearch(term, undefined, undefined, controller.signal)
        .then(data => { if (active) setResults(toSearchItems(data)) })
        .catch(error => {
          if (active && !controller.signal.aborted) {
            setResults([])
            setSearchError(error instanceof Error ? error.message : 'Search is temporarily unavailable. Please try again.')
          }
        })
        .finally(() => { if (active) setLoading(false) })
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchItem[]>()
    results.forEach(item => groups.set(item.type, [...(groups.get(item.type) ?? []), item]))
    return [...groups.entries()]
  }, [results])

  const close = () => {
    setOpen(false)
    setQuery('')
    setResults([])
    setSearchError(null)
  }

  const selectSearchResult = (item: SearchItem) => {
    close()
    onNavigate(item.module)
  }

  return (
    <div className="command-palette-container" ref={paletteRef}>
      <CommandMenu className="command-palette-menu" shouldFilter={false}>
        <div className="command-palette-input-wrap">
          <Search size={17} aria-hidden="true" />
          <CommandMenu.Input
            ref={searchInputRef}
            value={query}
            onFocus={() => setOpen(true)}
            onValueChange={value => { setQuery(value); setOpen(true) }}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                close()
                searchInputRef.current?.blur()
              }
            }}
            placeholder={scope === 'dashboard' ? 'Search all records…' : `Search all records (currently: ${scope.replaceAll('-', ' ')})…`}
            aria-label="Search all records"
          />
        </div>

        {open && (
          <div className="command-palette-results">
            <CommandMenu.List>
              <CommandMenu.Empty>
                {loading ? 'Searching…' : searchError ?? (query.trim().length < 2 ? '' : 'No results')}
              </CommandMenu.Empty>
              {groupedResults.map(([type, group]) => (
                <CommandMenu.Group key={type} heading={type}>
                  {group.map(item => (
                    <CommandMenu.Item
                      key={`record-${item.type}-${item.id}`}
                      value={`${item.type} ${item.label} ${item.detail}`}
                      onSelect={() => selectSearchResult(item)}
                    >
                      <Search size={14} aria-hidden="true" />
                      <span>{item.label}</span>
                      <small>{item.detail}</small>
                    </CommandMenu.Item>
                  ))}
                </CommandMenu.Group>
              ))}
            </CommandMenu.List>
          </div>
        )}
      </CommandMenu>
    </div>
  )
}
