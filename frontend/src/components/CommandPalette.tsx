import { useEffect, useMemo, useRef, useState } from 'react'
import { Command as CommandMenu } from 'cmdk'
import { ArrowRight, Search } from 'lucide-react'
import { globalSearch, type GlobalSearchResponse } from '../api/globalSearch'
import './CommandPalette.css'

interface NavigationItem {
  label: string
  module: string
  subsection?: string
}

interface SearchItem {
  id: string
  label: string
  detail: string
  type: string
  module: string
}

interface CommandPaletteProps {
  items: NavigationItem[]
  onNavigate: (module: string, subsection?: string) => void
  onSignOut: () => void
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

export function CommandPalette({ items, onNavigate, onSignOut }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
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
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let active = true
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      globalSearch(term, undefined, undefined, controller.signal)
        .then(data => { if (active) setResults(toSearchItems(data)) })
        .catch(() => { if (active) setResults([]) })
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
  }

  const selectNavigation = (item: NavigationItem) => {
    close()
    onNavigate(item.module, item.subsection)
  }

  const selectSearchResult = (item: SearchItem) => {
    close()
    onNavigate(item.module)
  }

  return (
    <div className="command-palette-container" ref={paletteRef}>
      <CommandMenu className="command-palette-inline" shouldFilter>
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
            placeholder="Search…"
            aria-label="Search"
        />
      </div>

      {open && (
        <CommandMenu.List>
            <CommandMenu.Empty>{loading ? 'Searching…' : query.trim().length < 2 ? '' : 'No results'}</CommandMenu.Empty>
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
            {items.length > 0 && (
              <CommandMenu.Group heading="Go to">
                {items.map((item, index) => (
                  <CommandMenu.Item
                    key={`nav-${item.module}-${item.subsection ?? 'root'}-${index}`}
                    value={`navigate ${item.label} ${item.module} ${item.subsection ?? ''}`}
                    onSelect={() => selectNavigation(item)}
                  >
                    <ArrowRight size={14} aria-hidden="true" />
                    <span>{item.label}</span>
                    <small>{item.subsection ? item.module : 'Module'}</small>
                  </CommandMenu.Item>
                ))}
              </CommandMenu.Group>
            )}
          </CommandMenu.List>
      </CommandMenu>
    </div>
  )
}
