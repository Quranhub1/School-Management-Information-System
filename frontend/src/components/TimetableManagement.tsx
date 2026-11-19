import { useCallback, useEffect, useState } from 'react'
import { getUsers } from '../api/administration'
import { useInstitutionSettings } from './InstitutionSettingsContext'
import './TimetableManagement.css'

type TimetableCell = {
  courseId?: string
  course: string
  tutorId?: string
  tutor: string
  room: string
  customTime: string
  rowSpan: number
  colSpan: number
}

type TimetableColumn = {
  id: string
  type: 'slot' | 'divider'
  label?: string
  verticalText?: string
}

type TimetableRow = {
  id: string
  short: string
  full: string
  isWeekend: boolean
}

type TimetableMeta = {
  institution: string
  title: string
  year: string
  semester: string
  dayCornerLabel: string
}

type TimetableProgram = {
  programId?: string
  optionLabel: string
  meta: TimetableMeta
  rows: TimetableRow[]
  columns: TimetableColumn[]
  cells: Record<string, Record<string, TimetableCell>>
}

type SystemProgram = { id: string; code: string; name: string }
type SystemCourse = { id: string; code: string; name: string; programTag: string }
type SystemTutor = { id: string; name: string; department: string }
type AcademicRegistrar = {
  name: string
  role: string
  secondaryName: string
  secondaryRole: string
}

type SystemRegistry = {
  apiUrl: string
  schoolName: string
  programs: SystemProgram[]
  courses: SystemCourse[]
  tutors: SystemTutor[]
  academicRegistrar: AcademicRegistrar
}

type GridCell =
  | { type: 'divider'; col: TimetableColumn; rowspan: number }
  | {
      type: 'cell'
      cell: TimetableCell
      rSpan: number
      cSpan: number
      rowObj: TimetableRow
      col: TimetableColumn
      hasVal: boolean
    }

const STORAGE_KEY = 'kshs_timetable_v5'
const REGISTRY_KEY = 'kshs_smis_registry_v1'

const DEFAULT_SYSTEM_REGISTRY: SystemRegistry = {
  apiUrl: '',
  schoolName: 'KAMPALA SCHOOL OF HEALTH SCIENCES',
  programs: [
    { id: 'CPH', code: 'CPH', name: 'CERTIFICATE IN PHARMACY' },
    { id: 'DPH', code: 'DPH', name: 'DIPLOMA IN PHARMACY' },
    { id: 'DCM', code: 'DCM', name: 'DIPLOMA IN CLINICAL MEDICINE & COMMUNITY HEALTH' },
    { id: 'DMLT', code: 'DMLT', name: 'DIPLOMA IN MEDICAL LABORATORY TECHNOLOGY' }
  ],
  courses: [
    { id: 'CRS-101', code: 'CPH 1201', name: 'MEDICAL PSYCHOLOGY', programTag: 'CPH Y1S2' },
    { id: 'CRS-102', code: 'CPH 1202', name: 'PHARMACEUTICAL CALCULATIONS', programTag: 'CPH Y1S2' },
    { id: 'CRS-103', code: 'CPH 1203', name: 'PHARMACEUTICAL CHEMISTRY', programTag: 'CPH Y1S2' },
    { id: 'CRS-104', code: 'CPH 1204', name: 'PHARMACEUTICAL CHEMISTRY II', programTag: 'CPH Y1S2' },
    { id: 'CRS-105', code: 'CPH 1205', name: 'BASIC PHARMACOGNOSY', programTag: 'CPH Y1S2' },
    { id: 'CRS-106', code: 'CPH 1206', name: 'PHARMACEUTICAL PRACTICALS', programTag: 'CPH Y1S2' },
    { id: 'CRS-107', code: 'CPH 1207', name: 'COMMUNICATION SKILLS', programTag: 'CPH Y1S2' },
    { id: 'CRS-108', code: 'CPH 1208', name: 'ANATOMY & PHYSIOLOGY II', programTag: 'CPH Y1S2' }
  ],
  tutors: [
    { id: 'TUT-01', name: 'MR. WERE', department: 'Health Sciences' },
    { id: 'TUT-02', name: 'MR. CLIFFE', department: 'Health Sciences' },
    { id: 'TUT-03', name: 'MR. RICHARD', department: 'Pharmacy' },
    { id: 'TUT-04', name: 'MR. DAN', department: 'Pharmacognosy' },
    { id: 'TUT-05', name: 'MR. OTAI', department: 'General Studies' },
    { id: 'TUT-06', name: 'MS. MUSIMENTA', department: 'Anatomy & Physiology' }
  ],
  academicRegistrar: { name: '', role: 'ACADEMIC REGISTRAR', secondaryName: '', secondaryRole: '' }
}

function createDefaultRows(): TimetableRow[] {
  return [
    { id: 'Monday', short: 'MON', full: 'Monday', isWeekend: false },
    { id: 'Tuesday', short: 'TUE', full: 'Tuesday', isWeekend: false },
    { id: 'Wednesday', short: 'WED', full: 'Wednesday', isWeekend: false },
    { id: 'Thursday', short: 'THUR', full: 'Thursday', isWeekend: false },
    { id: 'Friday', short: 'FRID', full: 'Friday', isWeekend: false },
    { id: 'Saturday', short: 'SAT', full: 'Saturday', isWeekend: true },
    { id: 'Sunday', short: 'SUN', full: 'Sunday', isWeekend: true }
  ]
}

const DEFAULT_PROGRAMS: Record<string, TimetableProgram> = {
  'CPH-Y1S2': {
    programId: 'CPH',
    optionLabel: 'Certificate in Pharmacy — Year 1 Sem 2',
    meta: {
      institution: 'KAMPALA SCHOOL OF HEALTH SCIENCES',
      title: 'TEACHING TIME TABLE FOR CERTIFICATE IN PHARMACY',
      year: 'ACADEMIC YEAR 2026/2027',
      semester: 'YEAR ONE SEMESTER TWO',
      dayCornerLabel: 'DAY'
    },
    rows: createDefaultRows(),
    columns: [
      { id: 'slot-1', type: 'slot', label: '8:00 AM – 10:30 AM' },
      { id: 'div-break', type: 'divider', verticalText: 'BREAK' },
      { id: 'slot-2', type: 'slot', label: '11:00 AM – 1:00 PM' },
      { id: 'div-lunch', type: 'divider', verticalText: 'LUNCH' },
      { id: 'slot-3', type: 'slot', label: '2:00 PM – 4:00 PM' },
      { id: 'slot-4', type: 'slot', label: '5:00 PM – 6:30 PM' }
    ],
    cells: {
      Monday: {
        'slot-1': { courseId: 'CRS-101', course: 'MEDICAL PSYCHOLOGY', tutorId: 'TUT-01', tutor: 'MR. WERE', rowSpan: 1, colSpan: 1 },
        'slot-2': { courseId: 'CRS-101', course: 'MEDICAL PSYCHOLOGY', tutorId: 'TUT-01', tutor: 'MR. WERE', rowSpan: 1, colSpan: 1 },
        'slot-3': { courseId: 'CRS-106', course: 'PHARMACEUTICAL PRACTICALS', tutorId: 'TUT-03', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-4': { courseId: 'CRS-106', course: 'PHARMACEUTICAL PRACTICALS', tutorId: 'TUT-03', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 }
      },
      Tuesday: {
        'slot-1': { courseId: 'CRS-101', course: 'MEDICAL PSYCHOLOGY', tutorId: 'TUT-02', tutor: 'MR. CLIFFE', rowSpan: 1, colSpan: 1 },
        'slot-2': { courseId: 'CRS-101', course: 'MEDICAL PSYCHOLOGY', tutorId: 'TUT-02', tutor: 'MR. CLIFFE', rowSpan: 1, colSpan: 1 },
        'slot-3': { courseId: 'CRS-105', course: 'BASIC PHARMACOGNOSY', tutorId: 'TUT-04', tutor: 'MR. DAN', rowSpan: 1, colSpan: 1 },
        'slot-4': { courseId: 'CRS-105', course: 'BASIC PHARMACOGNOSY', tutorId: 'TUT-04', tutor: 'MR. DAN', rowSpan: 1, colSpan: 1 }
      },
      Wednesday: {
        'slot-1': { courseId: 'CRS-102', course: 'PHARMACEUTICAL CALCULATIONS', tutorId: 'TUT-03', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-2': { courseId: 'CRS-102', course: 'PHARMACEUTICAL CALCULATIONS', tutorId: 'TUT-03', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-3': { courseId: 'CRS-107', course: 'COMMUNICATION SKILLS', tutorId: 'TUT-05', tutor: 'MR. OTAI', rowSpan: 1, colSpan: 1 },
        'slot-4': { courseId: 'CRS-107', course: 'COMMUNICATION SKILLS', tutorId: 'TUT-05', tutor: 'MR. OTAI', rowSpan: 1, colSpan: 1 }
      },
      Thursday: {
        'slot-1': { courseId: 'CRS-103', course: 'PHARMACEUTICAL CHEMISTRY', tutorId: 'TUT-03', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-2': { courseId: 'CRS-103', course: 'PHARMACEUTICAL CHEMISTRY', tutorId: 'TUT-03', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-3': { courseId: 'CRS-108', course: 'ANATOMY & PHYSIOLOGY II', tutorId: 'TUT-06', tutor: 'MS. MUSIMENTA', rowSpan: 1, colSpan: 1 },
        'slot-4': { courseId: 'CRS-108', course: 'ANATOMY & PHYSIOLOGY II', tutorId: 'TUT-06', tutor: 'MS. MUSIMENTA', rowSpan: 1, colSpan: 1 }
      },
      Friday: {
        'slot-1': { courseId: 'CRS-105', course: 'BASIC PHARMACOGNOSY', tutorId: 'TUT-04', tutor: 'MR. DAN', rowSpan: 1, colSpan: 1 },
        'slot-2': { courseId: 'CRS-105', course: 'BASIC PHARMACOGNOSY', tutorId: 'TUT-04', tutor: 'MR. DAN', rowSpan: 1, colSpan: 1 },
        'slot-3': { courseId: 'CRS-104', course: 'PHARMACEUTICAL CHEMISTRY II', tutorId: 'TUT-03', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-4': { courseId: 'CRS-104', course: 'PHARMACEUTICAL CHEMISTRY II', tutorId: 'TUT-03', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 }
      }
    }
  }
}

function loadPrograms(): Record<string, TimetableProgram> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_PROGRAMS))
}

function savePrograms(programs: Record<string, TimetableProgram>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
  } catch {}
}

function loadRegistry(): SystemRegistry {
  try {
    const saved = localStorage.getItem(REGISTRY_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...JSON.parse(JSON.stringify(DEFAULT_SYSTEM_REGISTRY)),
        ...parsed,
        programs: Array.isArray(parsed.programs) ? parsed.programs : DEFAULT_SYSTEM_REGISTRY.programs,
        courses: Array.isArray(parsed.courses) ? parsed.courses : DEFAULT_SYSTEM_REGISTRY.courses,
        tutors: Array.isArray(parsed.tutors) ? parsed.tutors : DEFAULT_SYSTEM_REGISTRY.tutors,
        academicRegistrar: parsed.academicRegistrar || DEFAULT_SYSTEM_REGISTRY.academicRegistrar
      }
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_SYSTEM_REGISTRY))
}

function saveRegistry(registry: SystemRegistry): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
  } catch {}
}

export function TimetableManagement({ readOnly = false }: { readOnly?: boolean } = {}) {
  const { institution, loaded: institutionLoaded } = useInstitutionSettings()

  const [programs, setPrograms] = useState<Record<string, TimetableProgram>>(() => loadPrograms())
  const [registry, setRegistry] = useState<SystemRegistry>(() => loadRegistry())
  const [activeProgramKey, setActiveProgramKey] = useState<string>('CPH-Y1S2')
  const [isEditing, setIsEditing] = useState(true)
  const [showWeekends, setShowWeekends] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [clipboardCell, setClipboardCell] = useState<TimetableCell | null>(null)
  const [activeSysTab, setActiveSysTab] = useState('tabEndpoint')
  const [modals, setModals] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false })

  // Seed the Academic Registrar from the roles section (users API) when no registrar is set yet.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const users = await getUsers()
        const regUser = users.find(u => Array.isArray(u.roles) && u.roles.includes('AcademicRegistrar'))
        if (!cancelled && regUser) {
          const fullName = `${regUser.firstName ?? ''} ${regUser.lastName ?? ''}`.trim() || regUser.username
          setRegistry(prev => {
            if (prev.academicRegistrar.name) return prev
            const next = {
              ...prev,
              academicRegistrar: {
                name: fullName.toUpperCase(),
                role: 'ACADEMIC REGISTRAR',
                secondaryName: '',
                secondaryRole: ''
              }
            }
            saveRegistry(next)
            return next
          })
        }
      } catch {
        // Roles section unreachable; keep whatever is in localStorage.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Sync institution name from system settings into registry + all program headers.
  useEffect(() => {
    const name = institutionLoaded && institution.institutionName ? institution.institutionName.trim() : ''
    if (!name) return
    setRegistry(prev => {
      if (prev.schoolName === name) return prev
      const next = { ...prev, schoolName: name.toUpperCase() }
      const nextPrograms = { ...programs }
      Object.values(nextPrograms).forEach(p => {
        p.meta.institution = next.schoolName
      })
      saveRegistry(next)
      savePrograms(nextPrograms)
      return next
    })
  }, [institution, institutionLoaded, programs])

  const getActiveProgram = useCallback((): TimetableProgram => {
    if (!programs[activeProgramKey]) {
      const first = Object.keys(programs)[0]
      setActiveProgramKey(first || 'CPH-Y1S2')
    }
    return programs[activeProgramKey] || DEFAULT_PROGRAMS['CPH-Y1S2']
  }, [programs, activeProgramKey])

  const showToast = useCallback((msg: string) => {
    setToast({ msg, show: true })
    setTimeout(() => setToast({ msg, show: false }), 2300)
  }, [])

  const openModal = useCallback((id: string) => setModals(m => ({ ...m, [id]: true })), [])
  const closeModal = useCallback((id: string) => setModals(m => ({ ...m, [id]: false })), [])
  const isOpen = (id: string) => Boolean(modals[id])

  const escapeHtml = useCallback((text: string) => {
    const div = document.createElement('div')
    div.textContent = text || ''
    return div.innerHTML
  }, [])

  /* ---------- Rendering (direct DOM, mirrors the template) ---------- */

  const renderProgramSelector = useCallback(() => {
    const select = document.getElementById('programSelect')
    if (!select) return
    select.innerHTML = ''
    Object.keys(programs).forEach(key => {
      const prog = programs[key]
      const opt = document.createElement('option')
      opt.value = key
      opt.textContent = prog.optionLabel || prog.meta.title
      if (key === activeProgramKey) opt.selected = true
      select.appendChild(opt)
    })
  }, [programs, activeProgramKey])

  const renderFooter = useCallback(() => {
    const footer = document.getElementById('docFooterBlock')
    if (!footer) return
    const reg = registry.academicRegistrar
    const hasPrimary = Boolean(reg.name && reg.name.trim())
    const hasSecondary = Boolean(reg.secondaryName && reg.secondaryName.trim())

    if (!hasPrimary && !hasSecondary) {
      footer.innerHTML = '<span class="registrar-empty-hint">No Academic Registrar registered in system (click here to register)</span>'
      return
    }

    let html = ''
    if (hasPrimary) {
      html += `
        <div class="registrar-block">
          <div class="signature-line"></div>
          <div class="registrar-role">${escapeHtml(reg.role || 'ACADEMIC REGISTRAR')}</div>
          <div class="registrar-name">${escapeHtml(reg.name)}</div>
        </div>
      `
    }
    if (hasSecondary) {
      html += `
        <div class="registrar-block">
          <div class="signature-line"></div>
          <div class="registrar-role">${escapeHtml(reg.secondaryRole || '')}</div>
          <div class="registrar-name">${escapeHtml(reg.secondaryName)}</div>
        </div>
      `
    }
    footer.innerHTML = html
  }, [registry.academicRegistrar, escapeHtml])

  const buildGrid = useCallback(
    (visibleRows: TimetableRow[], columns: TimetableColumn[], cells: Record<string, Record<string, TimetableCell>>) => {
      const R = visibleRows.length
      const C = columns.length
      const covered = Array.from({ length: R }, () => Array(C).fill(false))
      const grid: Array<Array<GridCell | null>> = Array.from({ length: R }, () => Array(C).fill(null))

      for (let r = 0; r < R; r++) {
        const rowObj = visibleRows[r]
        for (let c = 0; c < C; c++) {
          const col = columns[c]
          if (covered[r][c]) continue
          if (col.type === 'divider') {
            if (r === 0) {
              grid[r][c] = { type: 'divider', col, rowspan: R }
            }
            for (let rr = 0; rr < R; rr++) covered[rr][c] = true
            continue
          }

          const cell = (cells[rowObj.id] && cells[rowObj.id][col.id]) || {
            course: '',
            tutor: '',
            room: '',
            customTime: '',
            rowSpan: 1,
            colSpan: 1
          }
          const rSpan = Math.min(Number(cell.rowSpan) || 1, R - r)
          let cSpan = 1
          while (
            cSpan < (Number(cell.colSpan) || 1) &&
            c + cSpan < C &&
            columns[c + cSpan].type === 'slot'
          ) {
            cSpan++
          }

          for (let rr = 0; rr < rSpan; rr++) {
            for (let cc = 0; cc < cSpan; cc++) {
              if (rr !== 0 || cc !== 0) covered[r + rr][c + cc] = true
            }
          }

          grid[r][c] = {
            type: 'cell',
            cell,
            rSpan,
            cSpan,
            rowObj,
            col,
            hasVal: Boolean(cell.course || cell.tutor || cell.room || cell.customTime)
          }
        }
      }
      return grid
    },
    []
  )

  const renderTimetable = useCallback(() => {
    const prog = getActiveProgram()
    const visibleRows = showWeekends ? prog.rows : prog.rows.filter(r => !r.isWeekend)

    const hdrInstitution = document.getElementById('hdrInstitution')
    const hdrTitle = document.getElementById('hdrTitle')
    const hdrYear = document.getElementById('hdrYear')
    const hdrSemester = document.getElementById('hdrSemester')
    const editBtn = document.getElementById('editModeBtn')
    const table = document.getElementById('timetableGrid')
    const programSelect = document.getElementById('programSelect') as HTMLSelectElement | null

    if (hdrInstitution) hdrInstitution.textContent = prog.meta.institution
    if (hdrTitle) hdrTitle.textContent = prog.meta.title
    if (hdrYear) hdrYear.textContent = prog.meta.year
    if (hdrSemester) hdrSemester.textContent = prog.meta.semester

    document.body.classList.toggle('is-editing', isEditing && !readOnly)

    if (editBtn) {
      editBtn.textContent = isEditing ? 'Editing On' : 'Edit Mode'
      editBtn.classList.toggle('ui-btn-edit-active', isEditing)
    }

    renderProgramSelector()

    const grid = buildGrid(visibleRows, prog.columns, prog.cells)

    let theadHtml = '<thead><tr>'
    theadHtml += `<th class="col-day-header" id="cornerHeader">${escapeHtml(prog.meta.dayCornerLabel || 'DAY')}</th>`
    prog.columns.forEach(col => {
      if (col.type === 'divider') {
        theadHtml += `<th class="col-divider" data-col-id="${escapeHtml(col.id)}">${escapeHtml((col.verticalText || 'B')[0])}</th>`
      } else {
        theadHtml += `<th class="col-slot-header" data-col-id="${escapeHtml(col.id)}">${escapeHtml(col.label)}</th>`
      }
    })
    theadHtml += '</tr></thead>'

    let tbodyHtml = '<tbody>'
    visibleRows.forEach((rowObj, rIdx) => {
      tbodyHtml += `<tr>`
      tbodyHtml += `<td class="day-label-cell" data-row-id="${escapeHtml(rowObj.id)}">
        <div>${escapeHtml(rowObj.short)}</div>
        <div class="row-controls-bar">
          <button type="button" class="row-mini-btn" data-row-act="up" data-row-id="${escapeHtml(rowObj.id)}" title="Move Up">↑</button>
          <button type="button" class="row-mini-btn" data-row-act="down" data-row-id="${escapeHtml(rowObj.id)}" title="Move Down">↓</button>
          <button type="button" class="row-mini-btn" data-row-act="del" data-row-id="${escapeHtml(rowObj.id)}" title="Delete Row">×</button>
        </div>
      </td>`

      grid[rIdx].forEach((cell, cIdx) => {
        if (cell === null) return
        const col = prog.columns[cIdx]
        if (cell.type === 'divider') {
          const letters = (col.verticalText || 'BREAK').slice(1).split('').map(ch => `<span>${escapeHtml(ch)}</span>`).join('')
          tbodyHtml += `<td class="col-divider" rowspan="${cell.rowspan}" data-col-id="${escapeHtml(col.id)}"><div class="divider-letter-stack">${letters}</div></td>`
          return
        }

        const { cell: data, rSpan, cSpan, hasVal } = cell
        const metaLine = [data.customTime, data.room].filter(Boolean).join(' • ')
        const tutorDisplay = data.tutor ? `(${escapeHtml(data.tutor)})` : (data.course ? '(+ Assign Tutor)' : '')
        tbodyHtml += `<td class="lecture-cell"${rSpan > 1 ? ` rowspan="${rSpan}"` : ''}${cSpan > 1 ? ` colspan="${cSpan}"` : ''} data-day="${escapeHtml(rowObj.id)}" data-slot="${escapeHtml(col.id)}">
          ${hasVal
            ? `<div class="cell-course" data-edit-part="course" title="Click to edit Course Unit">${escapeHtml(data.course)}</div>
               <div class="cell-tutor" data-edit-part="tutor" title="Click to change Tutor alone">${tutorDisplay}</div>
               ${metaLine ? `<div class="cell-meta-sub">${escapeHtml(metaLine)}</div>` : ''}`
            : '<span class="cell-empty-placeholder">+ Edit</span>'}
        </td>`
      })
      tbodyHtml += '</tr>'
    })
    tbodyHtml += '</tbody>'

    if (table) table.innerHTML = theadHtml + tbodyHtml
    renderFooter()
  }, [
    programs,
    activeProgramKey,
    showWeekends,
    isEditing,
    readOnly,
    buildGrid,
    escapeHtml,
    renderFooter,
    renderProgramSelector,
    getActiveProgram
  ])

  useEffect(() => {
    renderTimetable()
  }, [renderTimetable])

  /* ---------- System bridge ---------- */

  const updateConnectionPill = useCallback(() => {
    const pill = document.getElementById('smisConnectionStatus')
    if (!pill) return
    if (isConnected) {
      pill.textContent = 'Connected to SMIS'
      pill.classList.add('connected')
    } else {
      pill.textContent = 'Offline Cache Active'
      pill.classList.remove('connected')
    }
  }, [isConnected])

  const renderSystemLists = useCallback(() => {
    const cList = document.getElementById('sysCoursesList')
    if (cList) {
      cList.innerHTML = registry.courses.map((c, i) => `
        <div class="sys-list-item">
          <div><strong>${escapeHtml(c.code ? c.code + ' — ' : '')}${escapeHtml(c.name)}</strong> <span style="color:#64748b; font-size:0.75rem;">${escapeHtml(c.programTag || '')}</span></div>
          <button type="button" class="btn-modal btn-modal-danger" style="padding:0.2rem 0.5rem;" data-del-course="${i}">×</button>
        </div>
      `).join('') || '<div style="font-size:0.8rem; color:#94a3b8;">No course units in system registry.</div>'
    }

    const tList = document.getElementById('sysTutorsList')
    if (tList) {
      tList.innerHTML = registry.tutors.map((t, i) => `
        <div class="sys-list-item">
          <div><strong>${escapeHtml(t.name)}</strong> <span style="color:#64748b; font-size:0.75rem;">${escapeHtml(t.id ? '[' + t.id + '] ' : '')}${escapeHtml(t.department || '')}</span></div>
          <button type="button" class="btn-modal btn-modal-danger" style="padding:0.2rem 0.5rem;" data-del-tutor="${i}">×</button>
        </div>
      `).join('') || '<div style="font-size:0.8rem; color:#94a3b8;">No tutors in system registry.</div>'
    }
  }, [registry.courses, registry.tutors, escapeHtml])

  const openSystemModal = useCallback((defaultTab = 'tabEndpoint') => {
    document.getElementById('smisApiUrl')!.value = registry.apiUrl || ''
    const reg = registry.academicRegistrar
    document.getElementById('sysRegistrarName')!.value = reg.name || ''
    document.getElementById('sysRegistrarRole')!.value = reg.role || 'ACADEMIC REGISTRAR'
    document.getElementById('sysSecondaryName')!.value = reg.secondaryName || ''
    document.getElementById('sysSecondaryRole')!.value = reg.secondaryRole || ''
    updateConnectionPill()
    renderSystemLists()
    setActiveSysTab(defaultTab)
    openModal('systemModal')
  }, [registry, updateConnectionPill, renderSystemLists, openModal, setActiveSysTab])

  const populateCellDropdowns = useCallback((selectedCourseName?: string, selectedTutorName?: string) => {
    const cSel = document.getElementById('selectSystemCourse')
    if (cSel) {
      cSel.innerHTML = '<option value="">-- Pick Course Unit from System --</option>'
      registry.courses.forEach(c => {
        const opt = document.createElement('option')
        opt.value = c.id
        opt.dataset.name = c.name
        opt.textContent = (c.code ? c.code + ' — ' : '') + c.name
        if (c.name.toUpperCase() === (selectedCourseName || '').toUpperCase()) opt.selected = true
        cSel.appendChild(opt)
      })
    }

    const tSel = document.getElementById('selectSystemTutor')
    if (tSel) {
      tSel.innerHTML = '<option value="">-- Pick Tutor from System --</option>'
      registry.tutors.forEach(t => {
        const opt = document.createElement('option')
        opt.value = t.id
        opt.dataset.name = t.name
        opt.textContent = t.name + (t.department ? ' (' + t.department + ')' : '')
        if (t.name.toUpperCase() === (selectedTutorName || '').toUpperCase()) opt.selected = true
        tSel.appendChild(opt)
      })
    }
  }, [registry.courses, registry.tutors])

  const openCellModal = useCallback((day: string, slot: string, focusPart = 'course') => {
    const prog = getActiveProgram()
    const data = (prog.cells[day] && prog.cells[day][slot]) || { course: '', tutor: '', room: '', customTime: '', rowSpan: 1, colSpan: 1 }
    document.getElementById('editDayKey')!.value = day
    document.getElementById('editSlotId')!.value = slot
    populateCellDropdowns(data.course, data.tutor)
    document.getElementById('inputCourse')!.value = data.course || ''
    document.getElementById('inputTutor')!.value = data.tutor || ''
    document.getElementById('inputRoom')!.value = data.room || ''
    document.getElementById('inputCustomTime')!.value = data.customTime || ''
    document.getElementById('inputRowSpan')!.value = String(data.rowSpan || 1)
    document.getElementById('inputColSpan')!.value = String(data.colSpan || 1)
    openModal('cellModal')
    setTimeout(() => {
      const target = focusPart === 'tutor' ? document.getElementById('selectSystemTutor') : document.getElementById('selectSystemCourse')
      if (target) target.focus()
    }, 40)
  }, [getActiveProgram, populateCellDropdowns, openModal])

  const openInlineTutorSelector = useCallback((tutorEl: HTMLElement, day: string, slot: string) => {
    if (tutorEl.querySelector('select')) return
    const prog = getActiveProgram()
    const currentCell = (prog.cells[day] && prog.cells[day][slot]) || { course: '', tutor: '', rowSpan: 1, colSpan: 1 }

    const sel = document.createElement('select')
    sel.className = 'inline-tutor-picker'
    sel.innerHTML = '<option value="">-- No Tutor --</option>'
    registry.tutors.forEach(t => {
      const opt = document.createElement('option')
      opt.value = t.name
      opt.dataset.tutorId = t.id
      opt.textContent = t.name
      if (t.name.toUpperCase() === (currentCell.tutor || '').toUpperCase()) opt.selected = true
      sel.appendChild(opt)
    })
    const customOpt = document.createElement('option')
    customOpt.value = '__CUSTOM__'
    customOpt.textContent = '+ Type Custom Tutor...'
    sel.appendChild(customOpt)

    tutorEl.innerHTML = ''
    tutorEl.appendChild(sel)
    sel.focus()

    const commitTutor = () => {
      if (sel.value === '__CUSTOM__') {
        openCellModal(day, slot, 'tutor')
        return
      }
      if (!prog.cells[day]) prog.cells[day] = {}
      const chosenOpt = sel.options[sel.selectedIndex]
      setPrograms(prev => {
        const next = { ...prev }
        const np = { ...next[activeProgramKey] }
        if (!np.cells[day]) np.cells[day] = {}
        np.cells[day][slot] = Object.assign({}, currentCell, {
          tutorId: chosenOpt ? (chosenOpt.dataset.tutorId || '') : '',
          tutor: sel.value.toUpperCase()
        })
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      renderTimetable()
      showToast('Tutor updated independently.')
    }

    sel.addEventListener('click', ev => ev.stopPropagation())
    sel.addEventListener('change', commitTutor)
    sel.addEventListener('blur', () => renderTimetable())
  }, [getActiveProgram, activeProgramKey, registry.tutors, setPrograms, renderTimetable, showToast, openCellModal])

  const openSlotManager = useCallback(() => {
    const prog = getActiveProgram()
    const list = document.getElementById('slotManagerList')
    if (!list) return
    list.innerHTML = ''
    prog.columns.forEach((col, idx) => {
      const div = document.createElement('div')
      div.style.display = 'flex'
      div.style.gap = '0.4rem'
      div.style.alignItems = 'center'
      div.innerHTML = `
        <span style="font-size:0.72rem; font-weight:700; width:46px; color:#64748b;">${col.type === 'divider' ? 'DIV' : 'SLOT'}</span>
        <input type="text" class="col-edit-input" style="flex:1;" value="${escapeHtml(col.label || col.verticalText)}" data-idx="${idx}">
        <button type="button" class="btn-modal" style="padding:0.35rem 0.55rem;" data-col-act="left" data-idx="${idx}">←</button>
        <button type="button" class="btn-modal" style="padding:0.35rem 0.55rem;" data-col-act="right" data-idx="${idx}">→</button>
        <button type="button" class="btn-modal btn-modal-danger" style="padding:0.35rem 0.55rem;" data-col-act="del" data-idx="${idx}">×</button>
      `
      list.appendChild(div)
    })
    openModal('slotsModal')
  }, [getActiveProgram, escapeHtml, openModal])

  /* ---------- SMIS bridge object exposed on window ---------- */

  const smisBridge = {
    setSystemData(payload: Record<string, unknown> = {}) {
      if (!payload || typeof payload !== 'object') return
      if (payload.schoolName) {
        const name = String(payload.schoolName).trim().toUpperCase()
        setRegistry(prev => {
          const next = { ...prev, schoolName: name }
          const np = { ...programs }
          Object.values(np).forEach(p => { p.meta.institution = name })
          saveRegistry(next)
          savePrograms(np)
          return next
        })
      }
      if (Array.isArray(payload.programs)) {
        setRegistry(prev => {
          const next = { ...prev }
          next.programs = payload.programs.map((p: Record<string, unknown>) => ({
            id: String(p.id || p.code || ('PRG-' + Date.now())),
            code: String(p.code || p.id || ''),
            name: String(p.name || '').toUpperCase()
          }))
          saveRegistry(next)
          return next
        })
      }
      if (Array.isArray(payload.courses)) {
        setRegistry(prev => {
          const next = { ...prev }
          next.courses = payload.courses.map((c: Record<string, unknown>, idx: number) => ({
            id: String(c.id || c.code || ('CRS-' + idx)),
            code: String(c.code || ''),
            name: String(c.name || c.title || '').toUpperCase(),
            programTag: String(c.programTag || c.semester || '')
          }))
          saveRegistry(next)
          return next
        })
      }
      if (Array.isArray(payload.tutors)) {
        setRegistry(prev => {
          const next = { ...prev }
          next.tutors = payload.tutors.map((t: Record<string, unknown>, idx: number) => ({
            id: String(t.id || ('TUT-' + idx)),
            name: String(t.name || t.fullName || '').toUpperCase(),
            department: String(t.department || '')
          }))
          saveRegistry(next)
          return next
        })
      }
      if (payload.academicRegistrar !== undefined) {
        const reg = payload.academicRegistrar as Record<string, unknown> | null | undefined
        setRegistry(prev => {
          const next = { ...prev }
          if (!reg || !String(reg.name || '').trim()) {
            next.academicRegistrar = { name: '', role: 'ACADEMIC REGISTRAR', secondaryName: '', secondaryRole: '' }
          } else {
            next.academicRegistrar = {
              name: String(reg.name || '').toUpperCase(),
              role: String(reg.role || 'ACADEMIC REGISTRAR').toUpperCase(),
              secondaryName: String(reg.secondaryName || '').toUpperCase(),
              secondaryRole: String(reg.secondaryRole || '').toUpperCase()
            }
          }
          saveRegistry(next)
          return next
        })
      }
      if (payload.activeYear) {
        setPrograms(prev => {
          const next = { ...prev }
          const np = next[activeProgramKey]
          if (np) np.meta.year = String(payload.activeYear).toUpperCase()
          savePrograms(next)
          return next
        })
      }
      if (payload.activeSemester) {
        setPrograms(prev => {
          const next = { ...prev }
          const np = next[activeProgramKey]
          if (np) np.meta.semester = String(payload.activeSemester).toUpperCase()
          savePrograms(next)
          return next
        })
      }
      renderTimetable()
      renderSystemLists()
      window.dispatchEvent(new CustomEvent('smis:timetable:sync', { detail: { registry } }))
    },

    async fetchFromEndpoint(apiUrl?: string, authToken?: string) {
      const url = (apiUrl || registry.apiUrl || '').trim()
      if (!url) {
        showToast('Enter an SMIS API URL or use offline system registries.')
        return null
      }
      setRegistry(prev => {
        const next = { ...prev, apiUrl: url }
        saveRegistry(next)
        return next
      })
      try {
        const headers: Record<string, string> = { 'Accept': 'application/json' }
        if (authToken) headers['Authorization'] = 'Bearer ' + authToken
        const res = await fetch(url, { headers })
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const data = await res.json()
        setIsConnected(true)
        smisBridge.setSystemData(data)
        updateConnectionPill()
        showToast('Synced Course Units, Tutors & Registrar from SMIS.')
        return data
      } catch (err) {
        setIsConnected(false)
        updateConnectionPill()
        showToast('Server unreachable — using offline cached SMIS data.')
        return null
      }
    },

    getTimetablePayload() {
      const prog = getActiveProgram()
      const entries: Array<Record<string, unknown>> = []
      Object.keys(prog.cells || {}).forEach(dayId => {
        Object.keys(prog.cells[dayId] || {}).forEach(slotId => {
          const c = prog.cells[dayId][slotId]
          if (c && (c.course || c.tutor)) {
            entries.push({
              dayId,
              slotId,
              courseId: c.courseId || null,
              courseName: c.course || '',
              tutorId: c.tutorId || null,
              tutorName: c.tutor || '',
              room: c.room || '',
              customTime: c.customTime || '',
              rowSpan: c.rowSpan || 1,
              colSpan: c.colSpan || 1
            })
          }
        })
      })
      return {
        timetableKey: activeProgramKey,
        programId: prog.programId || null,
        meta: prog.meta,
        columns: prog.columns,
        rows: prog.rows,
        entries,
        academicRegistrar: registry.academicRegistrar,
        exportedAt: new Date().toISOString()
      }
    },

    loadTimetablePayload(payload: Record<string, unknown> | null) {
      if (!payload || !payload.meta) return
      const key = String(payload.timetableKey || ('IMP-' + Date.now()))
      const cells: Record<string, Record<string, TimetableCell>> = {}
      ;(payload.entries as Array<Record<string, unknown>> | undefined)?.forEach((e: Record<string, unknown>) => {
        if (!cells[e.dayId as string]) cells[e.dayId as string] = {}
        cells[e.dayId as string][e.slotId as string] = {
          courseId: String(e.courseId || ''),
          course: String(e.courseName || e.course || '').toUpperCase(),
          tutorId: String(e.tutorId || ''),
          tutor: String(e.tutorName || e.tutor || '').toUpperCase(),
          room: String(e.room || ''),
          customTime: String(e.customTime || ''),
          rowSpan: Number(e.rowSpan) || 1,
          colSpan: Number(e.colSpan) || 1
        }
      })
      setPrograms(prev => {
        const next = { ...prev }
        next[key] = {
          programId: String(payload.programId || ''),
          optionLabel: (String(payload.meta.title || key)).replace(/^TEACHING TIME TABLE FOR\s*/i, '') + ' — ' + String(payload.meta.semester || ''),
          meta: payload.meta as TimetableMeta,
          rows: (payload.rows as TimetableRow[]) || createDefaultRows(),
          columns: (payload.columns as TimetableColumn[]) || DEFAULT_PROGRAMS['CPH-Y1S2'].columns,
          cells
        }
        savePrograms(next)
        return next
      })
      setActiveProgramKey(key)
      renderTimetable()
    },

    onSave(callback: (payload: Record<string, unknown>) => void) {
      // kept for API compatibility; not wired into React state flow
    }
  }

  ;(window as unknown as { SMIS_TIMETABLE_BRIDGE?: typeof smisBridge }).SMIS_TIMETABLE_BRIDGE = smisBridge

  /* ---------- Event wiring ---------- */

  useEffect(() => {
    const programSelect = document.getElementById('programSelect') as HTMLSelectElement | null
    const newProgramBtn = document.getElementById('newProgramBtn')
    const toggleWeekends = document.getElementById('toggleWeekends') as HTMLInputElement | null
    const editModeBtn = document.getElementById('editModeBtn')
    const systemSyncBtn = document.getElementById('systemSyncBtn')
    const docFooterBlock = document.getElementById('docFooterBlock')
    const manageSlotsBtn = document.getElementById('manageSlotsBtn')
    const backupBtn = document.getElementById('backupBtn')
    const syncSaveBtn = document.getElementById('syncSaveBtn')
    const printBtn = document.getElementById('printBtn')
    const docHeaderBlock = document.getElementById('docHeaderBlock')
    const timetableGrid = document.getElementById('timetableGrid')
    const cellForm = document.getElementById('cellForm') as HTMLFormElement | null
    const clearCellBtn = document.getElementById('clearCellBtn')
    const copyCellBtn = document.getElementById('copyCellBtn')
    const pasteCellBtn = document.getElementById('pasteCellBtn')
    const clearAllCellsBtn = document.getElementById('clearAllCellsBtn')
    const exportJsonBtn = document.getElementById('exportJsonBtn')
    const importJsonInput = document.getElementById('importJsonInput') as HTMLInputElement | null
    const confirmResetBtn = document.getElementById('confirmResetBtn')

    const unload = () => {
      programSelect?.removeEventListener('change', handleProgramChange)
      newProgramBtn?.removeEventListener('click', handleNewProgram)
      toggleWeekends?.removeEventListener('change', handleToggleWeekends)
      editModeBtn?.removeEventListener('click', handleEditMode)
      systemSyncBtn?.removeEventListener('click', handleSystemSync)
      docFooterBlock?.removeEventListener('click', handleFooterClick)
      manageSlotsBtn?.removeEventListener('click', openSlotManager)
      backupBtn?.removeEventListener('click', handleBackup)
      syncSaveBtn?.removeEventListener('click', handleSyncSave)
      printBtn?.removeEventListener('click', handlePrint)
      docHeaderBlock?.removeEventListener('click', handleDocHeader)
      timetableGrid?.removeEventListener('click', handleGridClick)
      cellForm?.removeEventListener('submit', handleCellSubmit)
      clearCellBtn?.removeEventListener('click', handleClearCell)
      copyCellBtn?.removeEventListener('click', handleCopyCell)
      pasteCellBtn?.removeEventListener('click', handlePasteCell)
      clearAllCellsBtn?.removeEventListener('click', handleClearAllCells)
      exportJsonBtn?.removeEventListener('click', handleExportJson)
      importJsonInput?.removeEventListener('change', handleImportJson)
      confirmResetBtn?.removeEventListener('click', handleConfirmReset)
      document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.removeEventListener('click', handleCloseModal)
      })
      // System modal internal listeners
      const fetchSmisNowBtn = document.getElementById('fetchSmisNowBtn')
      const exportPayloadBtn = document.getElementById('exportPayloadBtn')
      const addSysCourseBtn = document.getElementById('addSysCourseBtn')
      const sysCoursesList = document.getElementById('sysCoursesList')
      const addSysTutorBtn = document.getElementById('addSysTutorBtn')
      const sysTutorsList = document.getElementById('sysTutorsList')
      const saveRegistrarBtn = document.getElementById('saveRegistrarBtn')
      const clearRegistrarBtn = document.getElementById('clearRegistrarBtn')
      const selectSystemCourse = document.getElementById('selectSystemCourse')
      const selectSystemTutor = document.getElementById('selectSystemTutor')
      const selectSystemProgram = document.getElementById('selectSystemProgram')
      const docMetaForm = document.getElementById('docMetaForm') as HTMLFormElement | null
      fetchSmisNowBtn?.removeEventListener('click', handleFetchSmis)
      exportPayloadBtn?.removeEventListener('click', handleExportPayload)
      addSysCourseBtn?.removeEventListener('click', handleAddSysCourse)
      sysCoursesList?.removeEventListener('click', handleSysCoursesClick)
      addSysTutorBtn?.removeEventListener('click', handleAddSysTutor)
      sysTutorsList?.removeEventListener('click', handleSysTutorsClick)
      saveRegistrarBtn?.removeEventListener('click', handleSaveRegistrar)
      clearRegistrarBtn?.removeEventListener('click', handleClearRegistrar)
      selectSystemCourse?.removeEventListener('change', handleSelectSystemCourse)
      selectSystemTutor?.removeEventListener('change', handleSelectSystemTutor)
      selectSystemProgram?.removeEventListener('change', handleSelectSystemProgram)
      docMetaForm?.removeEventListener('submit', handleDocMetaSubmit)
      document.querySelectorAll('.sys-tab-btn').forEach(btn => {
        btn.removeEventListener('click', handleSysTabClick)
      })
      const slotManagerList = document.getElementById('slotManagerList')
      const addNewSlotColBtn = document.getElementById('addNewSlotColBtn')
      const addNewDividerColBtn = document.getElementById('addNewDividerColBtn')
      slotManagerList?.removeEventListener('input', handleSlotInput)
      slotManagerList?.removeEventListener('click', handleSlotClick)
      addNewSlotColBtn?.removeEventListener('click', handleAddSlot)
      addNewDividerColBtn?.removeEventListener('click', handleAddDivider)
    }

    /* handlers */
    const handleProgramChange = (e: Event) => {
      const target = e.target as HTMLSelectElement
      setActiveProgramKey(target.value)
      renderTimetable()
    }

    const handleNewProgram = () => {
      const id = 'PROG-' + Date.now()
      const p: TimetableProgram = {
        optionLabel: 'New Timetable Sheet (' + (Object.keys(programs).length + 1) + ')',
        meta: {
          institution: registry.schoolName || 'KAMPALA SCHOOL OF HEALTH SCIENCES',
          title: 'TEACHING TIME TABLE FOR NEW COURSE',
          year: 'ACADEMIC YEAR 2026/2027',
          semester: 'YEAR ONE SEMESTER ONE',
          dayCornerLabel: 'DAY'
        },
        rows: createDefaultRows(),
        columns: [
          { id: 'slot-1', type: 'slot', label: '8:00 AM – 10:30 AM' },
          { id: 'div-break', type: 'divider', verticalText: 'BREAK' },
          { id: 'slot-2', type: 'slot', label: '11:00 AM – 1:00 PM' },
          { id: 'div-lunch', type: 'divider', verticalText: 'LUNCH' },
          { id: 'slot-3', type: 'slot', label: '2:00 PM – 4:00 PM' }
        ],
        cells: {}
      }
      setPrograms(prev => {
        const next = { ...prev, [id]: p }
        savePrograms(next)
        return next
      })
      setActiveProgramKey(id)
      renderTimetable()
      showToast('Created new timetable sheet.')
    }

    const handleToggleWeekends = (e: Event) => {
      const target = e.target as HTMLInputElement
      setShowWeekends(target.checked)
    }

    const handleEditMode = () => {
      if (readOnly) return
      setIsEditing(prev => !prev)
    }

    const handleSystemSync = () => openSystemModal('tabEndpoint')
    const handleFooterClick = () => {
      if (isEditing && !readOnly) openSystemModal('tabRegistrar')
    }

    const handleFetchSmis = () => {
      const url = document.getElementById('smisApiUrl')!.value
      const token = document.getElementById('smisAuthToken')!.value
      smisBridge.fetchFromEndpoint(url, token)
    }

    const handleExportPayload = () => {
      const json = JSON.stringify(smisBridge.getTimetablePayload(), null, 2)
      const ta = document.createElement('textarea')
      ta.value = json
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      showToast('Database payload copied to clipboard.')
    }

    const handleAddSysCourse = () => {
      const name = document.getElementById('newCourseName')!.value.trim().toUpperCase()
      if (!name) return
      const code = document.getElementById('newCourseCode')!.value.trim().toUpperCase()
      const programTag = document.getElementById('newCourseTag')!.value.trim().toUpperCase()
      setRegistry(prev => {
        const next = { ...prev }
        next.courses = [...next.courses, { id: code || ('CRS-' + Date.now()), code, name, programTag }]
        saveRegistry(next)
        return next
      })
      ;(document.getElementById('newCourseCode') as HTMLInputElement).value = ''
      ;(document.getElementById('newCourseName') as HTMLInputElement).value = ''
      ;(document.getElementById('newCourseTag') as HTMLInputElement).value = ''
      showToast('Course unit added to system.')
    }

    const handleSysCoursesClick = (e: Event) => {
      const btn = (e.target as Element).closest('[data-del-course]')
      if (!btn) return
      setRegistry(prev => {
        const next = { ...prev }
        next.courses.splice(Number(btn.dataset.delCourse), 1)
        saveRegistry(next)
        return next
      })
    }

    const handleAddSysTutor = () => {
      const name = document.getElementById('newTutorName')!.value.trim().toUpperCase()
      if (!name) return
      const id = document.getElementById('newTutorId')!.value.trim().toUpperCase() || ('TUT-' + Date.now())
      const department = document.getElementById('newTutorDept')!.value.trim()
      setRegistry(prev => {
        const next = { ...prev }
        next.tutors = [...next.tutors, { id, name, department }]
        saveRegistry(next)
        return next
      })
      ;(document.getElementById('newTutorId') as HTMLInputElement).value = ''
      ;(document.getElementById('newTutorName') as HTMLInputElement).value = ''
      ;(document.getElementById('newTutorDept') as HTMLInputElement).value = ''
      showToast('Tutor added to system.')
    }

    const handleSysTutorsClick = (e: Event) => {
      const btn = (e.target as Element).closest('[data-del-tutor]')
      if (!btn) return
      setRegistry(prev => {
        const next = { ...prev }
        next.tutors.splice(Number(btn.dataset.delTutor), 1)
        saveRegistry(next)
        return next
      })
    }

    const handleSaveRegistrar = () => {
      setRegistry(prev => {
        const next = { ...prev }
        next.academicRegistrar = {
          name: (document.getElementById('sysRegistrarName') as HTMLInputElement).value.trim().toUpperCase(),
          role: (document.getElementById('sysRegistrarRole') as HTMLInputElement).value.trim().toUpperCase() || 'ACADEMIC REGISTRAR',
          secondaryName: (document.getElementById('sysSecondaryName') as HTMLInputElement).value.trim().toUpperCase(),
          secondaryRole: (document.getElementById('sysSecondaryRole') as HTMLInputElement).value.trim().toUpperCase()
        }
        saveRegistry(next)
        return next
      })
      renderFooter()
      showToast(registry.academicRegistrar.name ? 'Academic Registrar saved across all timetables.' : 'Footer left blank.')
    }

    const handleClearRegistrar = () => {
      setRegistry(prev => {
        const next = { ...prev }
        next.academicRegistrar = { name: '', role: 'ACADEMIC REGISTRAR', secondaryName: '', secondaryRole: '' }
        saveRegistry(next)
        return next
      })
      ;(document.getElementById('sysRegistrarName') as HTMLInputElement).value = ''
      ;(document.getElementById('sysSecondaryName') as HTMLInputElement).value = ''
      renderFooter()
      showToast('Registrar cleared; footer is blank.')
    }

    const handleSyncSave = () => {
      const payload = smisBridge.getTimetablePayload()
      window.dispatchEvent(new CustomEvent('smis:timetable:save', { detail: payload }))
      showToast('Timetable synced & dispatched to SMIS handler.')
    }

    const handleSelectSystemCourse = (e: Event) => {
      const opt = (e.target as HTMLSelectElement).options[(e.target as HTMLSelectElement).selectedIndex]
      if (opt && opt.dataset.name) {
        ;(document.getElementById('inputCourse') as HTMLInputElement).value = opt.dataset.name
      }
    }

    const handleSelectSystemTutor = (e: Event) => {
      const opt = (e.target as HTMLSelectElement).options[(e.target as HTMLSelectElement).selectedIndex]
      if (opt && opt.dataset.name) {
        ;(document.getElementById('inputTutor') as HTMLInputElement).value = opt.dataset.name
      }
    }

    const handleBackup = () => openModal('backupModal')
    const handlePrint = () => window.print()

    const handleDocHeader = () => {
      if (!isEditing || readOnly) return
      const prog = getActiveProgram()
      const pSel = document.getElementById('selectSystemProgram') as HTMLSelectElement
      pSel.innerHTML = '<option value="">-- Custom / Keep Current Title --</option>'
      registry.programs.forEach(p => {
        const opt = document.createElement('option')
        opt.value = p.id
        opt.dataset.name = p.name
        opt.textContent = (p.code ? p.code + ' — ' : '') + p.name
        if (p.id === prog.programId) opt.selected = true
        pSel.appendChild(opt)
      })
      document.getElementById('metaInstitution')!.value = prog.meta.institution
      document.getElementById('metaTitle')!.value = prog.meta.title
      document.getElementById('metaYear')!.value = prog.meta.year
      document.getElementById('metaSemester')!.value = prog.meta.semester
      document.getElementById('metaDayCorner')!.value = prog.meta.dayCornerLabel || 'DAY'
      openModal('docMetaModal')
    }

    const handleSelectSystemProgram = (e: Event) => {
      const opt = (e.target as HTMLSelectElement).options[(e.target as HTMLSelectElement).selectedIndex]
      if (opt && opt.dataset.name) {
        ;(document.getElementById('metaTitle') as HTMLInputElement).value = 'TEACHING TIME TABLE FOR ' + opt.dataset.name
      }
    }

    const handleDocMetaSubmit = (e: Event) => {
      e.preventDefault()
      const prog = getActiveProgram()
      const chosenProgId = (document.getElementById('selectSystemProgram') as HTMLSelectElement).value
      if (chosenProgId) prog.programId = chosenProgId
      setPrograms(prev => {
        const next = { ...prev }
        const np = next[activeProgramKey]
        if (!np) return next
        np.meta.institution = (document.getElementById('metaInstitution') as HTMLInputElement).value.trim()
        np.meta.title = (document.getElementById('metaTitle') as HTMLInputElement).value.trim()
        np.meta.year = (document.getElementById('metaYear') as HTMLInputElement).value.trim()
        np.meta.semester = (document.getElementById('metaSemester') as HTMLInputElement).value.trim()
        np.meta.dayCornerLabel = (document.getElementById('metaDayCorner') as HTMLInputElement).value.trim() || 'DAY'
        np.optionLabel = np.meta.title.replace(/^TEACHING TIME TABLE FOR\s*/i, '') + ' — ' + np.meta.semester
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      closeModal('docMetaModal')
      renderTimetable()
      showToast('Header updated.')
    }

    const handleGridClick = (e: Event) => {
      if (!isEditing || readOnly) return
      const prog = getActiveProgram()

      const rowBtn = (e.target as Element).closest('[data-row-act]')
      if (rowBtn) {
        e.stopPropagation()
        const rId = rowBtn.dataset.rowId!
        const act = rowBtn.dataset.rowAct!
        const idx = prog.rows.findIndex(r => r.id === rId)
        if (idx === -1) return
        const nextRows = [...prog.rows]
        if (act === 'up' && idx > 0) {
          ;[nextRows[idx - 1], nextRows[idx]] = [nextRows[idx], nextRows[idx - 1]]
        } else if (act === 'down' && idx < nextRows.length - 1) {
          ;[nextRows[idx + 1], nextRows[idx]] = [nextRows[idx], nextRows[idx + 1]]
        } else if (act === 'del' && nextRows.length > 1) {
          nextRows.splice(idx, 1)
        }
        setPrograms(prev => {
          const next = { ...prev }
          const np = { ...next[activeProgramKey] }
          np.rows = nextRows
          next[activeProgramKey] = np
          savePrograms(next)
          return next
        })
        renderTimetable()
        return
      }

      if ((e.target as Element).closest('#cornerHeader')) {
        ;(document.getElementById('docHeaderBlock') as HTMLElement).click()
        return
      }

      if ((e.target as Element).closest('.col-slot-header') || (e.target as Element).closest('.col-divider')) {
        openSlotManager()
        return
      }

      const cell = (e.target as Element).closest('.lecture-cell')
      if (cell) {
        const day = cell.dataset.day!
        const slot = cell.dataset.slot!
        const tutorPart = (e.target as Element).closest('[data-edit-part="tutor"]')
        if (tutorPart) {
          e.stopPropagation()
          openInlineTutorSelector(tutorPart, day, slot)
          return
        }
        const coursePart = (e.target as Element).closest('[data-edit-part="course"]')
        openCellModal(day, slot, coursePart ? 'course' : 'course')
      }
    }

    const handleCellSubmit = (e: Event) => {
      e.preventDefault()
      const day = document.getElementById('editDayKey')!.value
      const slot = document.getElementById('editSlotId')!.value
      const prog = getActiveProgram()
      setPrograms(prev => {
        const next = { ...prev }
        const np = next[activeProgramKey]
        if (!np.cells[day]) np.cells[day] = {}

        const courseName = (document.getElementById('inputCourse') as HTMLInputElement).value.trim().toUpperCase()
        const tutorName = (document.getElementById('inputTutor') as HTMLInputElement).value.trim().toUpperCase()
        const matchedCourse = registry.courses.find(c => c.name.toUpperCase() === courseName)
        const matchedTutor = registry.tutors.find(t => t.name.toUpperCase() === tutorName)

        np.cells[day][slot] = {
          courseId: matchedCourse ? matchedCourse.id : '',
          course: courseName,
          tutorId: matchedTutor ? matchedTutor.id : '',
          tutor: tutorName,
          room: (document.getElementById('inputRoom') as HTMLInputElement).value.trim(),
          customTime: (document.getElementById('inputCustomTime') as HTMLInputElement).value.trim(),
          rowSpan: Number((document.getElementById('inputRowSpan') as HTMLSelectElement).value) || 1,
          colSpan: Number((document.getElementById('inputColSpan') as HTMLSelectElement).value) || 1
        }
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      closeModal('cellModal')
      renderTimetable()
      showToast('Lecture saved.')
    }

    const handleClearCell = () => {
      const day = document.getElementById('editDayKey')!.value
      const slot = document.getElementById('editSlotId')!.value
      setPrograms(prev => {
        const next = { ...prev }
        const np = next[activeProgramKey]
        if (np.cells[day]) delete np.cells[day][slot]
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      closeModal('cellModal')
      renderTimetable()
      showToast('Cell cleared.')
    }

    const handleCopyCell = () => {
      setClipboardCell({
        course: (document.getElementById('inputCourse') as HTMLInputElement).value.trim().toUpperCase(),
        tutor: (document.getElementById('inputTutor') as HTMLInputElement).value.trim().toUpperCase(),
        room: (document.getElementById('inputRoom') as HTMLInputElement).value.trim(),
        customTime: (document.getElementById('inputCustomTime') as HTMLInputElement).value.trim(),
        rowSpan: 1,
        colSpan: 1
      })
      showToast('Cell copied.')
    }

    const handlePasteCell = () => {
      if (!clipboardCell) {
        showToast('Nothing copied yet.')
        return
      }
      populateCellDropdowns(clipboardCell.course, clipboardCell.tutor)
      ;(document.getElementById('inputCourse') as HTMLInputElement).value = clipboardCell.course
      ;(document.getElementById('inputTutor') as HTMLInputElement).value = clipboardCell.tutor
      ;(document.getElementById('inputRoom') as HTMLInputElement).value = clipboardCell.room
      ;(document.getElementById('inputCustomTime') as HTMLInputElement).value = clipboardCell.customTime
      showToast('Pasted into form.')
    }

    const handleClearAllCells = () => {
      setPrograms(prev => {
        const next = { ...prev }
        const np = next[activeProgramKey]
        np.cells = {}
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      closeModal('backupModal')
      renderTimetable()
      showToast('All cells cleared.')
    }

    const handleExportJson = () => {
      const payload = { programs, registry }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'kshs_timetable_backup.json'
      a.click()
    }

    const handleImportJson = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(ev.target!.result as string)
          setPrograms(prev => {
            let next: Record<string, TimetableProgram>
            if (parsed.programs) {
              next = parsed.programs
            } else {
              next = parsed
            }
            savePrograms(next)
            return next
          })
          setRegistry(prev => {
            let next: SystemRegistry
            if (parsed.registry) {
              next = { ...DEFAULT_SYSTEM_REGISTRY, ...parsed.registry }
            } else {
              next = prev
            }
            saveRegistry(next)
            return next
          })
          closeModal('backupModal')
          renderTimetable()
          showToast('Timetable backup imported.')
        } catch {
          showToast('Invalid JSON file.')
        }
      }
      reader.readAsText(file)
    }

    const handleConfirmReset = () => {
      setPrograms(JSON.parse(JSON.stringify(DEFAULT_PROGRAMS)))
      savePrograms(JSON.parse(JSON.stringify(DEFAULT_PROGRAMS)))
      setRegistry(JSON.parse(JSON.stringify(DEFAULT_SYSTEM_REGISTRY)))
      saveRegistry(JSON.parse(JSON.stringify(DEFAULT_SYSTEM_REGISTRY)))
      setActiveProgramKey('CPH-Y1S2')
      closeModal('backupModal')
      renderTimetable()
      showToast('Reset to default.')
    }

    const handleCloseModal = (e: Event) => {
      const btn = e.target as HTMLElement
      closeModal(btn.dataset.closeModal!)
    }

    const handleSlotInput = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target.classList.contains('col-edit-input')) return
      const idx = Number(target.dataset.idx)
      const prog = getActiveProgram()
      const col = prog.columns[idx]
      if (!col) return
      setPrograms(prev => {
        const next = { ...prev }
        const np = { ...next[activeProgramKey] }
        const nextCols = [...np.columns]
        if (col.type === 'divider') nextCols[idx] = { ...col, verticalText: target.value.trim().toUpperCase() || 'BREAK' }
        else nextCols[idx] = { ...col, label: target.value }
        np.columns = nextCols
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      renderTimetable()
    }

    const handleSlotClick = (e: Event) => {
      const btn = (e.target as Element).closest('[data-col-act]')
      if (!btn) return
      const idx = Number(btn.dataset.idx)
      const act = btn.dataset.colAct
      setPrograms(prev => {
        const next = { ...prev }
        const np = { ...next[activeProgramKey] }
        const cols = [...np.columns]
        if (act === 'left' && idx > 0) {
          ;[cols[idx - 1], cols[idx]] = [cols[idx], cols[idx - 1]]
        } else if (act === 'right' && idx < cols.length - 1) {
          ;[cols[idx + 1], cols[idx]] = [cols[idx], cols[idx + 1]]
        } else if (act === 'del' && cols.length > 1) {
          cols.splice(idx, 1)
        }
        np.columns = cols
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      renderTimetable()
      openSlotManager()
    }

    const handleAddSlot = () => {
      setPrograms(prev => {
        const next = { ...prev }
        const np = { ...next[activeProgramKey] }
        np.columns = [...np.columns, { id: 'slot-' + Date.now(), type: 'slot', label: '4:00 PM – 5:00 PM' }]
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      renderTimetable()
      openSlotManager()
    }

    const handleAddDivider = () => {
      setPrograms(prev => {
        const next = { ...prev }
        const np = { ...next[activeProgramKey] }
        np.columns = [...np.columns, { id: 'div-' + Date.now(), type: 'divider', verticalText: 'BREAK' }]
        next[activeProgramKey] = np
        savePrograms(next)
        return next
      })
      renderTimetable()
      openSlotManager()
    }

    const handleSysTabClick = (e: Event) => {
      const btn = e.target as HTMLElement
      const tab = btn.dataset.sysTab
      if (!tab) return
      setActiveSysTab(tab)
    }

    /* attach */
    programSelect?.addEventListener('change', handleProgramChange)
    newProgramBtn?.addEventListener('click', handleNewProgram)
    toggleWeekends?.addEventListener('change', handleToggleWeekends)
    editModeBtn?.addEventListener('click', handleEditMode)
    systemSyncBtn?.addEventListener('click', handleSystemSync)
    docFooterBlock?.addEventListener('click', handleFooterClick)
    manageSlotsBtn?.addEventListener('click', openSlotManager)
    backupBtn?.addEventListener('click', handleBackup)
    syncSaveBtn?.addEventListener('click', handleSyncSave)
    printBtn?.addEventListener('click', handlePrint)
    docHeaderBlock?.addEventListener('click', handleDocHeader)
    timetableGrid?.addEventListener('click', handleGridClick)
    cellForm?.addEventListener('submit', handleCellSubmit)
    clearCellBtn?.addEventListener('click', handleClearCell)
    copyCellBtn?.addEventListener('click', handleCopyCell)
    pasteCellBtn?.addEventListener('click', handlePasteCell)
    clearAllCellsBtn?.addEventListener('click', handleClearAllCells)
    exportJsonBtn?.addEventListener('click', handleExportJson)
    importJsonInput?.addEventListener('change', handleImportJson)
    confirmResetBtn?.addEventListener('click', handleConfirmReset)
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', handleCloseModal)
    })
    // System modal internal listeners
    document.getElementById('fetchSmisNowBtn')?.addEventListener('click', handleFetchSmis)
    document.getElementById('exportPayloadBtn')?.addEventListener('click', handleExportPayload)
    document.getElementById('addSysCourseBtn')?.addEventListener('click', handleAddSysCourse)
    document.getElementById('sysCoursesList')?.addEventListener('click', handleSysCoursesClick)
    document.getElementById('addSysTutorBtn')?.addEventListener('click', handleAddSysTutor)
    document.getElementById('sysTutorsList')?.addEventListener('click', handleSysTutorsClick)
    document.getElementById('saveRegistrarBtn')?.addEventListener('click', handleSaveRegistrar)
    document.getElementById('clearRegistrarBtn')?.addEventListener('click', handleClearRegistrar)
    document.getElementById('selectSystemCourse')?.addEventListener('change', handleSelectSystemCourse)
    document.getElementById('selectSystemTutor')?.addEventListener('change', handleSelectSystemTutor)
    document.getElementById('selectSystemProgram')?.addEventListener('change', handleSelectSystemProgram)
    document.getElementById('docMetaForm')?.addEventListener('submit', handleDocMetaSubmit)
    document.querySelectorAll('.sys-tab-btn').forEach(btn => {
      btn.addEventListener('click', handleSysTabClick)
    })
    const slotManagerList = document.getElementById('slotManagerList')
    const addNewSlotColBtn = document.getElementById('addNewSlotColBtn')
    const addNewDividerColBtn = document.getElementById('addNewDividerColBtn')
    slotManagerList?.addEventListener('input', handleSlotInput)
    slotManagerList?.addEventListener('click', handleSlotClick)
    addNewSlotColBtn?.addEventListener('click', handleAddSlot)
    addNewDividerColBtn?.addEventListener('click', handleAddDivider)

    return unload
  }, [
    programs,
    registry,
    activeProgramKey,
    isEditing,
    readOnly,
    showWeekends,
    isConnected,
    clipboardCell,
    activeSysTab,
    openModal,
    closeModal,
    renderTimetable,
    renderFooter,
    renderProgramSelector,
    renderSystemLists,
    openSystemModal,
    populateCellDropdowns,
    openInlineTutorSelector,
    openCellModal,
    openSlotManager,
    setPrograms,
    setRegistry,
    setActiveProgramKey,
    setIsEditing,
    setShowWeekends,
    setIsConnected,
    setClipboardCell,
    setActiveSysTab,
    savePrograms,
    saveRegistry,
    showToast,
    getActiveProgram,
    smisBridge,
    updateConnectionPill,
    escapeHtml
  ])

  /* ---------- Render ---------- */

  useEffect(() => {
    document.title = 'Kampala School of Health Sciences — Teaching Time Table'
    document.body.classList.toggle('is-editing', isEditing && !readOnly)
    return () => {
      document.body.classList.remove('is-editing')
    }
  }, [isEditing, readOnly])

  const prog = getActiveProgram()
  const effectiveEditing = isEditing && !readOnly

  return (
    <section className="timetable-screen">
      <header className="control-bar">
        <div className="control-bar-inner">
          <div className="control-group">
            <div className="app-badge">KSHS Timetable</div>
            <select id="programSelect" className="program-select"></select>
            <button type="button" id="newProgramBtn" className="ui-btn">
              + New Sheet
            </button>
            <label className="weekend-toggle">
              <input type="checkbox" id="toggleWeekends" defaultChecked={showWeekends} />
              <span>Sat &amp; Sun</span>
            </label>
          </div>

          <div className="control-group">
            <button type="button" id="editModeBtn" className={`ui-btn${effectiveEditing ? ' ui-btn-edit-active' : ''}`}>
              {isEditing ? 'Editing On' : 'Edit Mode'}
            </button>
            <button type="button" id="systemSyncBtn" className="ui-btn">
              System Data &amp; Sync
            </button>
            <button type="button" id="manageSlotsBtn" className="ui-btn">
              Columns &amp; Breaks
            </button>
            <button type="button" id="backupBtn" className="ui-btn">
              Backup / Clear
            </button>
            <button type="button" id="syncSaveBtn" className="ui-btn">
              Sync to System
            </button>
            <button type="button" id="printBtn" className="ui-btn ui-btn-primary">
              Print / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="sheet-viewport">
        <article className="document-sheet" id="documentSheet">
          <div
            className="doc-header"
            id="docHeaderBlock"
            title="Click to edit School Name, Course, Academic Year & Semester"
          >
            <div className="doc-header-line doc-institution" id="hdrInstitution">
              {prog.meta.institution}
            </div>
            <div className="doc-header-line doc-subtitle" id="hdrTitle">
              {prog.meta.title}
            </div>
            <div className="doc-header-line doc-year" id="hdrYear">
              {prog.meta.year}
            </div>
            <div className="doc-header-line doc-semester" id="hdrSemester">
              {prog.meta.semester}
            </div>
          </div>

          <div className="table-scroll-wrapper">
            <table className="timetable-grid" id="timetableGrid"></table>
          </div>

          <footer className="doc-footer" id="docFooterBlock" title="Academic Registrar Signature Block"></footer>
        </article>
      </main>

      {/* System Data & Sync Modal */}
      <div className={`modal-overlay${isOpen('systemModal') ? ' open' : ''}`} id="systemModal">
        <div className="modal-card" style={{ maxWidth: '620px' }}>
          <div className="modal-head">
            <h3>System Data &amp; SMIS Bridge</h3>
            <button type="button" className="modal-close-btn" data-close-modal="systemModal">&times;</button>
          </div>
          <div className="sys-tabs">
            <button
              type="button"
              className={`sys-tab-btn${activeSysTab === 'tabEndpoint' ? ' active' : ''}`}
              data-sys-tab="tabEndpoint"
            >
              API &amp; Sync
            </button>
            <button
              type="button"
              className={`sys-tab-btn${activeSysTab === 'tabCourses' ? ' active' : ''}`}
              data-sys-tab="tabCourses"
            >
              Course Units
            </button>
            <button
              type="button"
              className={`sys-tab-btn${activeSysTab === 'tabTutors' ? ' active' : ''}`}
              data-sys-tab="tabTutors"
            >
              Tutors
            </button>
            <button
              type="button"
              className={`sys-tab-btn${activeSysTab === 'tabRegistrar' ? ' active' : ''}`}
              data-sys-tab="tabRegistrar"
            >
              Registrar
            </button>
          </div>
          <div className="modal-body">
            {/* Tab 1: SMIS API Endpoint */}
            <div
              className={`sys-panel${activeSysTab === 'tabEndpoint' ? ' active' : ''}`}
              id="tabEndpoint"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155' }}>
                  SMIS Bridge Status:
                </span>
                <span className={`status-pill${isConnected ? ' connected' : ''}`} id="smisConnectionStatus">
                  Offline Cache Active
                </span>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="smisApiUrl">
                  SMIS Lookup Endpoint URL (GET JSON)
                </label>
                <input
                  type="text"
                  id="smisApiUrl"
                  className="field-input"
                  placeholder="e.g. /api/timetable/lookup-data"
                  defaultValue={registry.apiUrl}
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="smisAuthToken">
                  Bearer Token (Optional)
                </label>
                <input type="password" id="smisAuthToken" className="field-input" placeholder="Optional API authorization token" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" id="fetchSmisNowBtn" className="btn-modal btn-modal-save" style={{ flex: 1 }}>
                  Fetch / Sync From System Now
                </button>
                <button type="button" id="exportPayloadBtn" className="btn-modal">
                  Copy DB Payload
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                Programmatic hook: <code>{'window.SMIS_TIMETABLE_BRIDGE.setSystemData({ schoolName, programs, courses, tutors, academicRegistrar })'}</code> or listen for <code>smis:timetable:sync</code>.
              </p>
            </div>

            {/* Tab 2: System Course Units Registry */}
            <div className={`sys-panel${activeSysTab === 'tabCourses' ? ' active' : ''}`} id="tabCourses">
              <div className="field-row-2">
                <input
                  type="text"
                  id="newCourseCode"
                  className="field-input"
                  placeholder="Code (e.g. CPH 1201)"
                />
                <input
                  type="text"
                  id="newCourseTag"
                  className="field-input"
                  placeholder="Program/Sem (e.g. CPH Y1S2)"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  id="newCourseName"
                  className="field-input"
                  style={{ flex: 1 }}
                  placeholder="Course Unit Name (e.g. MEDICAL PSYCHOLOGY)"
                />
                <button type="button" id="addSysCourseBtn" className="btn-modal btn-modal-save">
                  + Add
                </button>
              </div>
              <div id="sysCoursesList" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '230px', overflowY: 'auto' }} />
            </div>

            {/* Tab 3: System Tutors Registry */}
            <div className={`sys-panel${activeSysTab === 'tabTutors' ? ' active' : ''}`} id="tabTutors">
              <div className="field-row-2">
                <input
                  type="text"
                  id="newTutorId"
                  className="field-input"
                  placeholder="Staff ID (e.g. STF-01)"
                />
                <input
                  type="text"
                  id="newTutorDept"
                  className="field-input"
                  placeholder="Department (e.g. Pharmacy)"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  id="newTutorName"
                  className="field-input"
                  style={{ flex: 1 }}
                  placeholder="Tutor Name (e.g. MR. WERE)"
                />
                <button type="button" id="addSysTutorBtn" className="btn-modal btn-modal-save">
                  + Add
                </button>
              </div>
              <div id="sysTutorsList" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '230px', overflowY: 'auto' }} />
            </div>

            {/* Tab 4: Academic Registrar */}
            <div className={`sys-panel${activeSysTab === 'tabRegistrar' ? ' active' : ''}`} id="tabRegistrar">
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                When an Academic Registrar is registered in the system, their title and name automatically appear on <strong>every</strong> timetable sheet. Leave blank to keep the footer completely empty.
              </p>
              <div className="field-group">
                <label className="field-label" htmlFor="sysRegistrarName">
                  Academic Registrar Full Name
                </label>
                <input
                  type="text"
                  id="sysRegistrarName"
                  className="field-input"
                  placeholder="Leave empty for blank footer"
                  defaultValue={registry.academicRegistrar.name}
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="sysRegistrarRole">
                  Official Title
                </label>
                <input
                  type="text"
                  id="sysRegistrarRole"
                  className="field-input"
                  placeholder="ACADEMIC REGISTRAR"
                  defaultValue={registry.academicRegistrar.role}
                />
              </div>
              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="sysSecondaryName">
                    Secondary Signatory (Optional)
                  </label>
                  <input
                    type="text"
                    id="sysSecondaryName"
                    className="field-input"
                    placeholder="Optional name"
                    defaultValue={registry.academicRegistrar.secondaryName}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="sysSecondaryRole">
                    Secondary Title (Optional)
                  </label>
                  <input
                    type="text"
                    id="sysSecondaryRole"
                    className="field-input"
                    placeholder="Optional title"
                    defaultValue={registry.academicRegistrar.secondaryRole}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" id="clearRegistrarBtn" className="btn-modal btn-modal-danger">
                  Unregister / Blank
                </button>
                <button type="button" id="saveRegistrarBtn" className="btn-modal btn-modal-save">
                  Save Registrar
                </button>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <div style={{ marginLeft: 'auto' }}>
              <button type="button" className="btn-modal btn-modal-save" data-close-modal="systemModal">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cell Modal (Separate Course Unit & Tutor Controls) */}
      <div className={`modal-overlay${isOpen('cellModal') ? ' open' : ''}`} id="cellModal">
        <div className="modal-card">
          <div className="modal-head">
            <h3 id="cellModalTitle">Edit Lecture Slot</h3>
            <button type="button" className="modal-close-btn" data-close-modal="cellModal">&times;</button>
          </div>
          <form id="cellForm">
            <div className="modal-body">
              <input type="hidden" id="editDayKey" />
              <input type="hidden" id="editSlotId" />

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <label className="field-label" htmlFor="selectSystemCourse">
                  1. Course Unit (From System Registry)
                </label>
                <select id="selectSystemCourse" className="field-input"></select>
                <input type="text" id="inputCourse" className="field-input" placeholder="Or type custom course unit name" />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <label className="field-label" htmlFor="selectSystemTutor">
                  2. Tutor / Lecturer (Editable Independently)
                </label>
                <select id="selectSystemTutor" className="field-input"></select>
                <input type="text" id="inputTutor" className="field-input" placeholder="Or type / override tutor name alone" />
              </div>

              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="inputRoom">Room / Lab (Optional)</label>
                  <input type="text" id="inputRoom" className="field-input" placeholder="e.g. Hall A" />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="inputCustomTime">Time Override (Optional)</label>
                  <input type="text" id="inputCustomTime" className="field-input" placeholder="e.g. 8:00 AM" />
                </div>
              </div>
              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="inputRowSpan">Merge Down (Rows)</label>
                  <select id="inputRowSpan" className="field-input" defaultValue="1">
                    <option value="1">1 Row (Normal)</option>
                    <option value="2">2 Rows</option>
                    <option value="3">3 Rows</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="inputColSpan">Merge Across (Slots)</label>
                  <select id="inputColSpan" className="field-input" defaultValue="1">
                    <option value="1">1 Slot (Normal)</option>
                    <option value="2">2 Slots</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" id="clearCellBtn" className="btn-modal btn-modal-danger">
                  Clear
                </button>
                <button type="button" id="copyCellBtn" className="btn-modal">
                  Copy
                </button>
                <button type="button" id="pasteCellBtn" className="btn-modal">
                  Paste
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-modal" data-close-modal="cellModal">
                  Cancel
                </button>
                <button type="submit" className="btn-modal btn-modal-save">
                  Save Cell
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Header & Footer Modal */}
      <div className={`modal-overlay${isOpen('docMetaModal') ? ' open' : ''}`} id="docMetaModal">
        <div className="modal-card">
          <div className="modal-head">
            <h3>Edit School &amp; Course Header</h3>
            <button type="button" className="modal-close-btn" data-close-modal="docMetaModal">&times;</button>
          </div>
          <form id="docMetaForm">
            <div className="modal-body">
              <div className="field-group">
                <label className="field-label" htmlFor="metaInstitution">
                  School / Institution Name
                </label>
                <input type="text" id="metaInstitution" className="field-input" required defaultValue={prog.meta.institution} />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="selectSystemProgram">
                  Select Program From System (Optional)
                </label>
                <select id="selectSystemProgram" className="field-input"></select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="metaTitle">
                  Timetable Title &amp; Course
                </label>
                <input type="text" id="metaTitle" className="field-input" required defaultValue={prog.meta.title} />
              </div>
              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="metaYear">Academic Year</label>
                  <input type="text" id="metaYear" className="field-input" required defaultValue={prog.meta.year} />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="metaSemester">Semester / Class</label>
                  <input type="text" id="metaSemester" className="field-input" required defaultValue={prog.meta.semester} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="metaDayCorner">Corner Header Label</label>
                <input type="text" id="metaDayCorner" className="field-input" placeholder="DAY" defaultValue={prog.meta.dayCornerLabel} />
              </div>
            </div>
            <div className="modal-foot">
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-modal" data-close-modal="docMetaModal">
                  Cancel
                </button>
                <button type="submit" className="btn-modal btn-modal-save">
                  Save Details
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Slots Manager Modal */}
      <div className={`modal-overlay${isOpen('slotsModal') ? ' open' : ''}`} id="slotsModal">
        <div className="modal-card">
          <div className="modal-head">
            <h3>Manage Time Columns &amp; Dividers</h3>
            <button type="button" className="modal-close-btn" data-close-modal="slotsModal">&times;</button>
          </div>
          <div className="modal-body">
            <div id="slotManagerList" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" id="addNewSlotColBtn" className="btn-modal" style={{ flex: 1 }}>
                + Add Time Slot
              </button>
              <button type="button" id="addNewDividerColBtn" className="btn-modal" style={{ flex: 1 }}>
                + Add Break/Lunch
              </button>
            </div>
          </div>
          <div className="modal-foot">
            <div style={{ marginLeft: 'auto' }}>
              <button type="button" className="btn-modal btn-modal-save" data-close-modal="slotsModal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Modal */}
      <div className={`modal-overlay${isOpen('backupModal') ? ' open' : ''}`} id="backupModal">
        <div className="modal-card">
          <div className="modal-head">
            <h3>Backup &amp; Reset Options</h3>
            <button type="button" className="modal-close-btn" data-close-modal="backupModal">&times;</button>
          </div>
          <div className="modal-body">
            <button type="button" id="exportJsonBtn" className="btn-modal btn-modal-save">
              Download Backup (.json)
            </button>
            <label className="btn-modal" style={{ textAlign: 'center', display: 'block' }}>
              Import Backup (.json)
              <input type="file" id="importJsonInput" accept=".json" style={{ display: 'none' }} />
            </label>
            <button type="button" id="clearAllCellsBtn" className="btn-modal btn-modal-danger">
              Clear All Lecture Cells
            </button>
            <button type="button" id="confirmResetBtn" className="btn-modal btn-modal-danger">
              Restore Official KSHS Default
            </button>
          </div>
          <div className="modal-foot">
            <div style={{ marginLeft: 'auto' }}>
              <button type="button" className="btn-modal" data-close-modal="backupModal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`toast-notification${toast.show ? ' show' : ''}`} id="toast">
        {toast.msg}
      </div>
    </section>
  )
}
