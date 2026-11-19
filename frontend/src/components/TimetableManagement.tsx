import { useCallback, useEffect, useState } from 'react'
import { getUsers } from '../api/administration'
import { useInstitutionSettings } from './InstitutionSettingsContext'
import './TimetableManagement.css'

type TimetableCell = {
  course: string
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
  optionLabel: string
  meta: TimetableMeta
  rows: TimetableRow[]
  columns: TimetableColumn[]
  cells: Record<string, Record<string, TimetableCell>>
}

type Registrar = {
  name: string
  role: string
  secondaryName: string
  secondaryRole: string
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

const STORAGE_KEY = 'kshs_timetable_v4'
const REGISTRAR_KEY = 'kshs_registered_registrar_v1'

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
        'slot-1': { course: 'MEDICAL PSYCHOLOGY', tutor: 'MR. WERE', rowSpan: 1, colSpan: 1 },
        'slot-2': { course: 'MEDICAL PSYCHOLOGY', tutor: 'MR. WERE', rowSpan: 1, colSpan: 1 },
        'slot-3': { course: 'PHARMACEUTICAL PRACTICALS', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-4': { course: 'PHARMACEUTICAL PRACTICALS', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 }
      },
      Tuesday: {
        'slot-1': { course: 'MEDICAL PSYCHOLOGY', tutor: 'MR. CLIFFE', rowSpan: 1, colSpan: 1 },
        'slot-2': { course: 'MEDICAL PSYCHOLOGY', tutor: 'MR. CLIFFE', rowSpan: 1, colSpan: 1 },
        'slot-3': { course: 'BASIC PHARMACOGNOSY', tutor: 'MR. DAN', rowSpan: 1, colSpan: 1 },
        'slot-4': { course: 'BASIC PHARMACOGNOSY', tutor: 'MR. DAN', rowSpan: 1, colSpan: 1 }
      },
      Wednesday: {
        'slot-1': { course: 'PHARMACEUTICAL CALCULATIONS', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-2': { course: 'PHARMACEUTICAL CALCULATIONS', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-3': { course: 'COMMUNICATION SKILLS', tutor: 'MR. OTAI', rowSpan: 1, colSpan: 1 },
        'slot-4': { course: 'COMMUNICATION SKILLS', tutor: 'MR. OTAI', rowSpan: 1, colSpan: 1 }
      },
      Thursday: {
        'slot-1': { course: 'PHARMACEUTICAL CHEMISTRY', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-2': { course: 'PHARMACEUTICAL CHEMISTRY', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-3': { course: 'ANATOMY & PHYSIOLOGY II', tutor: 'MS. MUSIMENTA', rowSpan: 1, colSpan: 1 },
        'slot-4': { course: 'ANATOMY & PHYSIOLOGY II', tutor: 'MS. MUSIMENTA', rowSpan: 1, colSpan: 1 }
      },
      Friday: {
        'slot-1': { course: 'BASIC PHARMACOGNOSY', tutor: 'MR. DAN', rowSpan: 1, colSpan: 1 },
        'slot-2': { course: 'BASIC PHARMACOGNOSY', tutor: 'MR. DAN', rowSpan: 1, colSpan: 1 },
        'slot-3': { course: 'PHARMACEUTICAL CHEMISTRY II', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 },
        'slot-4': { course: 'PHARMACEUTICAL CHEMISTRY II', tutor: 'MR. RICHARD', rowSpan: 1, colSpan: 1 }
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

function loadRegistrar(): Registrar {
  try {
    const saved = localStorage.getItem(REGISTRAR_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { name: '', role: 'ACADEMIC REGISTRAR', secondaryName: '', secondaryRole: '' }
}

function saveRegistrar(reg: Registrar): void {
  try {
    localStorage.setItem(REGISTRAR_KEY, JSON.stringify(reg))
  } catch {}
}

export function TimetableManagement({ readOnly = false }: { readOnly?: boolean } = {}) {
  const { institution, loaded: institutionLoaded } = useInstitutionSettings()

  const [programs, setPrograms] = useState<Record<string, TimetableProgram>>(() => loadPrograms())
  const [registrar, setRegistrar] = useState<Registrar>(() => loadRegistrar())
  const [rolesRegistrar, setRolesRegistrar] = useState<Registrar | null>(null)
  const [activeProgramKey, setActiveProgramKey] = useState<string>('CPH-Y1S2')
  const [isEditing, setIsEditing] = useState(true)
  const [showWeekends, setShowWeekends] = useState(true)
  const [modals, setModals] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false })

  // Seed the registrar from the roles section (users with the Academic Registrar role)
  // when no registrar has been registered in localStorage yet.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const users = await getUsers()
        const regUser = users.find(u => Array.isArray(u.roles) && u.roles.includes('AcademicRegistrar'))
        if (!cancelled && regUser) {
          const fullName = `${regUser.firstName ?? ''} ${regUser.lastName ?? ''}`.trim() || regUser.username
          setRolesRegistrar({
            name: fullName.toUpperCase(),
            role: 'ACADEMIC REGISTRAR',
            secondaryName: '',
            secondaryRole: ''
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

  const effectiveRegistrar: Registrar =
    registrar && registrar.name ? registrar : rolesRegistrar ?? { name: '', role: 'ACADEMIC REGISTRAR', secondaryName: '', secondaryRole: '' }

  const getActiveProgram = useCallback((): TimetableProgram => {
    if (!programs[activeProgramKey]) {
      const first = Object.keys(programs)[0]
      setActiveProgramKey(first || 'CPH-Y1S2')
    }
    return programs[activeProgramKey] || DEFAULT_PROGRAMS['CPH-Y1S2']
  }, [programs, activeProgramKey])

  const showToast = useCallback((msg: string) => {
    setToast({ msg, show: true })
    setTimeout(() => setToast({ msg, show: false }), 2200)
  }, [])

  const openModal = useCallback((id: string) => setModals(m => ({ ...m, [id]: true })), [])
  const closeModal = useCallback((id: string) => setModals(m => ({ ...m, [id]: false })), [])
  const isOpen = (id: string) => Boolean(modals[id])

  const escapeHtml = useCallback((text: string) => {
    const div = document.createElement('div')
    div.textContent = text || ''
    return div.innerHTML
  }, [])

  const renderFooter = useCallback(() => {
    const footer = document.getElementById('docFooterBlock')
    if (!footer) return
    const reg = effectiveRegistrar
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
  }, [effectiveRegistrar, escapeHtml])

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

    // Refs to DOM elements manipulated directly (mirrors the original template's imperative rendering)
    const hdrInstitution = document.getElementById('hdrInstitution')
    const hdrTitle = document.getElementById('hdrTitle')
    const hdrYear = document.getElementById('hdrYear')
    const hdrSemester = document.getElementById('hdrSemester')
    const editBtn = document.getElementById('editModeBtn')
    const table = document.getElementById('timetableGrid')
    const footer = document.getElementById('docFooterBlock')
    const programSelect = document.getElementById('programSelect') as HTMLSelectElement | null

    if (hdrInstitution) hdrInstitution.textContent = (institutionLoaded && institution.institutionName ? institution.institutionName : prog.meta.institution)
    if (hdrTitle) hdrTitle.textContent = prog.meta.title
    if (hdrYear) hdrYear.textContent = prog.meta.year
    if (hdrSemester) hdrSemester.textContent = prog.meta.semester

    document.body.classList.toggle('is-editing', isEditing && !readOnly)

    if (editBtn) {
      editBtn.textContent = isEditing ? 'Editing On' : 'Edit Mode'
      editBtn.classList.toggle('ui-btn-edit-active', isEditing)
    }

    if (programSelect) {
      programSelect.innerHTML = ''
      Object.keys(programs).forEach(key => {
        const p = programs[key]
        const opt = document.createElement('option')
        opt.value = key
        opt.textContent = p.optionLabel || p.meta.title
        if (key === activeProgramKey) opt.selected = true
        programSelect.appendChild(opt)
      })
    }

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
        tbodyHtml += `<td class="lecture-cell"${rSpan > 1 ? ` rowspan="${rSpan}"` : ''}${cSpan > 1 ? ` colspan="${cSpan}"` : ''} data-day="${escapeHtml(rowObj.id)}" data-slot="${escapeHtml(col.id)}">
          ${hasVal
            ? `<div class="cell-course">${escapeHtml(data.course)}</div>${data.tutor ? `<div class="cell-tutor">(${escapeHtml(data.tutor)})</div>` : ''}${metaLine ? `<div class="cell-meta-sub">${escapeHtml(metaLine)}</div>` : ''}`
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
    institution,
    institutionLoaded,
    buildGrid,
    escapeHtml,
    renderFooter,
    getActiveProgram
  ])

  useEffect(() => {
    renderTimetable()
  }, [renderTimetable])

  /* ---------- Modal: registrar ---------- */
  const openRegistrarModal = useCallback(() => {
    const reg = effectiveRegistrar
    document.getElementById('sysRegistrarName')!.value = reg.name || ''
    document.getElementById('sysRegistrarRole')!.value = reg.role || 'ACADEMIC REGISTRAR'
    document.getElementById('sysSecondaryName')!.value = reg.secondaryName || ''
    document.getElementById('sysSecondaryRole')!.value = reg.secondaryRole || ''
    openModal('registrarModal')
  }, [effectiveRegistrar, openModal])

  /* ---------- Modal: slot manager ---------- */
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

  /* ---------- Event wiring (imperative, mirrors the original template) ---------- */
  useEffect(() => {
    const programSelect = document.getElementById('programSelect') as HTMLSelectElement | null
    const newProgramBtn = document.getElementById('newProgramBtn')
    const toggleWeekends = document.getElementById('toggleWeekends') as HTMLInputElement | null
    const editModeBtn = document.getElementById('editModeBtn')
    const registrarBtn = document.getElementById('registrarBtn')
    const docFooterBlock = document.getElementById('docFooterBlock')
    const registrarForm = document.getElementById('registrarForm') as HTMLFormElement | null
    const clearRegistrarBtn = document.getElementById('clearRegistrarBtn')
    const manageSlotsBtn = document.getElementById('manageSlotsBtn')
    const slotManagerList = document.getElementById('slotManagerList')
    const addNewSlotColBtn = document.getElementById('addNewSlotColBtn')
    const addNewDividerColBtn = document.getElementById('addNewDividerColBtn')
    const backupBtn = document.getElementById('backupBtn')
    const printBtn = document.getElementById('printBtn')
    const docHeaderBlock = document.getElementById('docHeaderBlock')
    const docMetaForm = document.getElementById('docMetaForm') as HTMLFormElement | null
    const timetableGrid = document.getElementById('timetableGrid')
    const cellForm = document.getElementById('cellForm') as HTMLFormElement | null
    const clearCellBtn = document.getElementById('clearCellBtn')
    const clearAllCellsBtn = document.getElementById('clearAllCellsBtn')
    const exportJsonBtn = document.getElementById('exportJsonBtn')
    const importJsonInput = document.getElementById('importJsonInput') as HTMLInputElement | null
    const confirmResetBtn = document.getElementById('confirmResetBtn')

    const unload = () => {
      programSelect?.removeEventListener('change', handleProgramChange)
      newProgramBtn?.removeEventListener('click', handleNewProgram)
      toggleWeekends?.removeEventListener('change', handleToggleWeekends)
      editModeBtn?.removeEventListener('click', handleEditMode)
      registrarBtn?.removeEventListener('click', openRegistrarModal)
      docFooterBlock?.removeEventListener('click', handleFooterClick)
      registrarForm?.removeEventListener('submit', handleRegistrarSubmit)
      clearRegistrarBtn?.removeEventListener('click', handleClearRegistrar)
      manageSlotsBtn?.removeEventListener('click', openSlotManager)
      slotManagerList?.removeEventListener('input', handleSlotInput)
      slotManagerList?.removeEventListener('click', handleSlotClick)
      addNewSlotColBtn?.removeEventListener('click', handleAddSlot)
      addNewDividerColBtn?.removeEventListener('click', handleAddDivider)
      backupBtn?.removeEventListener('click', handleBackup)
      printBtn?.removeEventListener('click', handlePrint)
      docHeaderBlock?.removeEventListener('click', handleDocHeader)
      docMetaForm?.removeEventListener('submit', handleDocMetaSubmit)
      timetableGrid?.removeEventListener('click', handleGridClick)
      cellForm?.removeEventListener('submit', handleCellSubmit)
      clearCellBtn?.removeEventListener('click', handleClearCell)
      clearAllCellsBtn?.removeEventListener('click', handleClearAllCells)
      exportJsonBtn?.removeEventListener('click', handleExportJson)
      importJsonInput?.removeEventListener('change', handleImportJson)
      confirmResetBtn?.removeEventListener('click', handleConfirmReset)
      document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.removeEventListener('click', handleCloseModal)
      })
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
          institution: institutionLoaded && institution.institutionName ? institution.institutionName : 'KAMPALA SCHOOL OF HEALTH SCIENCES',
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

    const handleFooterClick = () => {
      if (isEditing && !readOnly) openRegistrarModal()
    }

    const handleRegistrarSubmit = (e: React.FormEvent | Event) => {
      if (e.preventDefault) e.preventDefault()
      const reg: Registrar = {
        name: (document.getElementById('sysRegistrarName') as HTMLInputElement).value.trim().toUpperCase(),
        role: (document.getElementById('sysRegistrarRole') as HTMLInputElement).value.trim().toUpperCase() || 'ACADEMIC REGISTRAR',
        secondaryName: (document.getElementById('sysSecondaryName') as HTMLInputElement).value.trim().toUpperCase(),
        secondaryRole: (document.getElementById('sysSecondaryRole') as HTMLInputElement).value.trim().toUpperCase()
      }
      setRegistrar(reg)
      saveRegistrar(reg)
      closeModal('registrarModal')
      renderFooter()
      showToast(reg.name ? 'Academic Registrar registered across all timetables.' : 'Registrar cleared (footer blank).')
    }

    const handleClearRegistrar = () => {
      const empty: Registrar = { name: '', role: 'ACADEMIC REGISTRAR', secondaryName: '', secondaryRole: '' }
      setRegistrar(empty)
      saveRegistrar(empty)
      closeModal('registrarModal')
      renderFooter()
      showToast('Academic Registrar removed; footer is now blank.')
    }

    const handleSlotInput = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target.classList.contains('col-edit-input')) return
      const idx = Number(target.dataset.idx)
      const prog = getActiveProgram()
      const col = prog.columns[idx]
      if (!col) return
      const nextCols = [...prog.columns]
      if (col.type === 'divider') nextCols[idx] = { ...col, verticalText: target.value.trim().toUpperCase() || 'BREAK' }
      else nextCols[idx] = { ...col, label: target.value }
      const nextProg = { ...prog, columns: nextCols }
      setPrograms(prev => {
        const updated = { ...prev, [activeProgramKey]: nextProg }
        savePrograms(updated)
        return updated
      })
      renderTimetable()
    }

    const handleSlotClick = (e: Event) => {
      const btn = (e.target as Element).closest('[data-col-act]')
      if (!btn) return
      const idx = Number(btn.dataset.idx)
      const act = btn.dataset.colAct
      const prog = getActiveProgram()
      const cols = [...prog.columns]
      if (act === 'left' && idx > 0) {
        ;[cols[idx - 1], cols[idx]] = [cols[idx], cols[idx - 1]]
      } else if (act === 'right' && idx < cols.length - 1) {
        ;[cols[idx + 1], cols[idx]] = [cols[idx], cols[idx + 1]]
      } else if (act === 'del' && cols.length > 1) {
        cols.splice(idx, 1)
      }
      const nextProg = { ...prog, columns: cols }
      setPrograms(prev => {
        const updated = { ...prev, [activeProgramKey]: nextProg }
        savePrograms(updated)
        return updated
      })
      renderTimetable()
      openSlotManager()
    }

    const handleAddSlot = () => {
      const prog = getActiveProgram()
      const nextCols = [...prog.columns, { id: 'slot-' + Date.now(), type: 'slot', label: '4:00 PM – 5:00 PM' }]
      const nextProg = { ...prog, columns: nextCols }
      setPrograms(prev => {
        const updated = { ...prev, [activeProgramKey]: nextProg }
        savePrograms(updated)
        return updated
      })
      renderTimetable()
      openSlotManager()
    }

    const handleAddDivider = () => {
      const prog = getActiveProgram()
      const nextCols = [...prog.columns, { id: 'div-' + Date.now(), type: 'divider', verticalText: 'BREAK' }]
      const nextProg = { ...prog, columns: nextCols }
      setPrograms(prev => {
        const updated = { ...prev, [activeProgramKey]: nextProg }
        savePrograms(updated)
        return updated
      })
      renderTimetable()
      openSlotManager()
    }

    const handleBackup = () => openModal('backupModal')
    const handlePrint = () => window.print()

    const handleDocHeader = () => {
      if (!isEditing || readOnly) return
      const prog = getActiveProgram()
      document.getElementById('metaInstitution')!.value = prog.meta.institution
      document.getElementById('metaTitle')!.value = prog.meta.title
      document.getElementById('metaYear')!.value = prog.meta.year
      document.getElementById('metaSemester')!.value = prog.meta.semester
      document.getElementById('metaDayCorner')!.value = prog.meta.dayCornerLabel || 'DAY'
      openModal('docMetaModal')
    }

    const handleDocMetaSubmit = (e: React.FormEvent | Event) => {
      if (e.preventDefault) e.preventDefault()
      const prog = getActiveProgram()
      const nextMeta = {
        ...prog.meta,
        institution: (document.getElementById('metaInstitution') as HTMLInputElement).value.trim(),
        title: (document.getElementById('metaTitle') as HTMLInputElement).value.trim(),
        year: (document.getElementById('metaYear') as HTMLInputElement).value.trim(),
        semester: (document.getElementById('metaSemester') as HTMLInputElement).value.trim(),
        dayCornerLabel: (document.getElementById('metaDayCorner') as HTMLInputElement).value.trim() || 'DAY'
      }
      const nextProg = { ...prog, meta: nextMeta, optionLabel: nextMeta.title.replace(/^TEACHING TIME TABLE FOR\s*/i, '') + ' — ' + nextMeta.semester }
      setPrograms(prev => {
        const updated = { ...prev, [activeProgramKey]: nextProg }
        savePrograms(updated)
        return updated
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
        const nextProg = { ...prog, rows: nextRows }
        setPrograms(prev => {
          const updated = { ...prev, [activeProgramKey]: nextProg }
          savePrograms(updated)
          return updated
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
        const data = (prog.cells[day] && prog.cells[day][slot]) || {
          course: '',
          tutor: '',
          room: '',
          customTime: '',
          rowSpan: 1,
          colSpan: 1
        }
        document.getElementById('editDayKey')!.value = day
        document.getElementById('editSlotId')!.value = slot
        document.getElementById('inputCourse')!.value = data.course || ''
        document.getElementById('inputTutor')!.value = data.tutor || ''
        document.getElementById('inputRoom')!.value = data.room || ''
        document.getElementById('inputCustomTime')!.value = data.customTime || ''
        document.getElementById('inputRowSpan')!.value = String(data.rowSpan || 1)
        document.getElementById('inputColSpan')!.value = String(data.colSpan || 1)
        openModal('cellModal')
      }
    }

    const handleCellSubmit = (e: React.FormEvent | Event) => {
      if (e.preventDefault) e.preventDefault()
      const day = document.getElementById('editDayKey')!.value
      const slot = document.getElementById('editSlotId')!.value
      const prog = getActiveProgram()
      const nextCells = { ...prog.cells }
      if (!nextCells[day]) nextCells[day] = {}
      nextCells[day][slot] = {
        course: (document.getElementById('inputCourse') as HTMLInputElement).value.trim().toUpperCase(),
        tutor: (document.getElementById('inputTutor') as HTMLInputElement).value.trim().toUpperCase(),
        room: (document.getElementById('inputRoom') as HTMLInputElement).value.trim(),
        customTime: (document.getElementById('inputCustomTime') as HTMLInputElement).value.trim(),
        rowSpan: Number((document.getElementById('inputRowSpan') as HTMLSelectElement).value) || 1,
        colSpan: Number((document.getElementById('inputColSpan') as HTMLSelectElement).value) || 1
      }
      const nextProg = { ...prog, cells: nextCells }
      setPrograms(prev => {
        const updated = { ...prev, [activeProgramKey]: nextProg }
        savePrograms(updated)
        return updated
      })
      closeModal('cellModal')
      renderTimetable()
      showToast('Lecture saved.')
    }

    const handleClearCell = () => {
      const day = document.getElementById('editDayKey')!.value
      const slot = document.getElementById('editSlotId')!.value
      const prog = getActiveProgram()
      const nextCells = { ...prog.cells }
      if (nextCells[day]) delete nextCells[day][slot]
      const nextProg = { ...prog, cells: nextCells }
      setPrograms(prev => {
        const updated = { ...prev, [activeProgramKey]: nextProg }
        savePrograms(updated)
        return updated
      })
      closeModal('cellModal')
      renderTimetable()
      showToast('Cell cleared.')
    }

    const handleClearAllCells = () => {
      const prog = getActiveProgram()
      const nextProg = { ...prog, cells: {} }
      setPrograms(prev => {
        const updated = { ...prev, [activeProgramKey]: nextProg }
        savePrograms(updated)
        return updated
      })
      closeModal('backupModal')
      renderTimetable()
      showToast('All cells cleared.')
    }

    const handleExportJson = () => {
      const payload = { programs, registrar: effectiveRegistrar }
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
          let next: Record<string, TimetableProgram>
          if (parsed.programs) {
            next = parsed.programs
          } else {
            next = parsed
          }
          setPrograms(next)
          savePrograms(next)
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
      setActiveProgramKey('CPH-Y1S2')
      closeModal('backupModal')
      renderTimetable()
      showToast('Reset to default.')
    }

    const handleCloseModal = (e: Event) => {
      const btn = e.target as HTMLElement
      closeModal(btn.dataset.closeModal!)
    }

    /* attach */
    programSelect?.addEventListener('change', handleProgramChange)
    newProgramBtn?.addEventListener('click', handleNewProgram)
    toggleWeekends?.addEventListener('change', handleToggleWeekends)
    editModeBtn?.addEventListener('click', handleEditMode)
    registrarBtn?.addEventListener('click', openRegistrarModal)
    docFooterBlock?.addEventListener('click', handleFooterClick)
    registrarForm?.addEventListener('submit', handleRegistrarSubmit)
    clearRegistrarBtn?.addEventListener('click', handleClearRegistrar)
    manageSlotsBtn?.addEventListener('click', openSlotManager)
    slotManagerList?.addEventListener('input', handleSlotInput)
    slotManagerList?.addEventListener('click', handleSlotClick)
    addNewSlotColBtn?.addEventListener('click', handleAddSlot)
    addNewDividerColBtn?.addEventListener('click', handleAddDivider)
    backupBtn?.addEventListener('click', handleBackup)
    printBtn?.addEventListener('click', handlePrint)
    docHeaderBlock?.addEventListener('click', handleDocHeader)
    docMetaForm?.addEventListener('submit', handleDocMetaSubmit)
    timetableGrid?.addEventListener('click', handleGridClick)
    cellForm?.addEventListener('submit', handleCellSubmit)
    clearCellBtn?.addEventListener('click', handleClearCell)
    clearAllCellsBtn?.addEventListener('click', handleClearAllCells)
    exportJsonBtn?.addEventListener('click', handleExportJson)
    importJsonInput?.addEventListener('change', handleImportJson)
    confirmResetBtn?.addEventListener('click', handleConfirmReset)
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', handleCloseModal)
    })

    return unload
  }, [
    programs,
    activeProgramKey,
    isEditing,
    readOnly,
    showWeekends,
    institution,
    institutionLoaded,
    openRegistrarModal,
    openSlotManager,
    renderTimetable,
    renderFooter,
    getActiveProgram,
    closeModal,
    openModal,
    showToast
  ])

  /* ---------- Render ---------- */
  const prog = getActiveProgram()
  const institutionName = institutionLoaded && institution.institutionName ? institution.institutionName : prog.meta.institution
  const effectiveEditing = isEditing && !readOnly

  useEffect(() => {
    document.title = 'Kampala School of Health Sciences — Teaching Time Table'
    document.body.classList.toggle('is-editing', effectiveEditing)
    return () => {
      document.body.classList.remove('is-editing')
    }
  }, [effectiveEditing])

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
              <button type="button" id="registrarBtn" className="ui-btn">
                System Registrar
              </button>
              <button type="button" id="manageSlotsBtn" className="ui-btn">
                Columns &amp; Breaks
              </button>
              <button type="button" id="backupBtn" className="ui-btn">
                Backup / Clear
              </button>
              <button type="button" id="printBtn" className="ui-btn ui-btn-primary">
                Print / PDF
              </button>
            </div>
          </div>
        </header>

        <main className="sheet-viewport">
          <article className="document-sheet" id="documentSheet">
            <header className="doc-header" id="docHeaderBlock">
              <div className="doc-header-line doc-institution" id="hdrInstitution">
                {institutionName}
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
            </header>

            <div className="table-scroll-wrapper">
              <table className="timetable-grid" id="timetableGrid"></table>
            </div>

            <footer className="doc-footer" id="docFooterBlock"></footer>
          </article>
        </main>

        {/* System Academic Registrar Modal */}
        <div className={`modal-overlay${isOpen('registrarModal') ? ' open' : ''}`} id="registrarModal">
          <div className="modal-card">
            <div className="modal-head">
              <h3>System Academic Registrar</h3>
              <button type="button" className="modal-close-btn" data-close-modal="registrarModal">&times;</button>
            </div>
            <form id="registrarForm">
              <div className="modal-body">
                <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                  When an Academic Registrar is registered in the system, their title and name automatically appear on <strong>every</strong> timetable sheet. Leave blank to keep the footer completely empty.
                </p>
                <div className="field-group">
                  <label className="field-label" htmlFor="sysRegistrarName">Academic Registrar Full Name</label>
                  <input type="text" id="sysRegistrarName" className="field-input" placeholder="e.g. ATUKUUMA CLIFFE (leave empty for blank)" defaultValue={registrar.name} />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="sysRegistrarRole">Official Title</label>
                  <input type="text" id="sysRegistrarRole" className="field-input" placeholder="ACADEMIC REGISTRAR" defaultValue={registrar.role} />
                </div>
                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label" htmlFor="sysSecondaryName">Secondary Signatory Name (Optional)</label>
                    <input type="text" id="sysSecondaryName" className="field-input" placeholder="e.g. DR. NAMUKASA" defaultValue={registrar.secondaryName} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="sysSecondaryRole">Secondary Title (Optional)</label>
                    <input type="text" id="sysSecondaryRole" className="field-input" placeholder="e.g. HEAD OF DEPARTMENT" defaultValue={registrar.secondaryRole} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" id="clearRegistrarBtn" className="btn-modal btn-modal-danger">
                  Unregister / Blank
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn-modal" data-close-modal="registrarModal">
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal btn-modal-save">
                    Save to All Sheets
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Cell Modal */}
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
                <div className="field-group">
                  <label className="field-label" htmlFor="inputCourse">Course Unit / Subject Name</label>
                  <input type="text" id="inputCourse" className="field-input" placeholder="e.g. MEDICAL PSYCHOLOGY" />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="inputTutor">Tutor / Lecturer Name</label>
                  <input type="text" id="inputTutor" className="field-input" placeholder="e.g. MR. WERE" />
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
                <button type="button" id="clearCellBtn" className="btn-modal btn-modal-danger">
                  Clear Cell
                </button>
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
                  <label className="field-label" htmlFor="metaInstitution">School / Institution Name</label>
                  <input type="text" id="metaInstitution" className="field-input" required defaultValue={prog.meta.institution} />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="metaTitle">Timetable Title &amp; Course</label>
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
