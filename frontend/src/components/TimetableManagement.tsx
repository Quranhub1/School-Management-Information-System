import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, LayoutGrid, List, Plus, Sparkles, Trash2, Pencil, Save, Printer, Columns, X } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { createTimetableEntry, deactivateTimetableEntry, generateTimetable, getTimetableOptions, getTimetableTemplate, listTimetable, saveTimetableTemplate, updateTimetableEntry, type CreateTimetableEntry, type GenerateTimetableResult, type TimetableEntry, type TimetableOptions } from '../api/timetable'
import './TimetableManagement.css'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useInstitutionSettings } from './InstitutionSettingsContext'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const shortDays = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRID', 'SAT']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const emptyOptions: TimetableOptions = { teachingGroups: [], courses: [], teachers: [], semesters: [], programmes: [], curricula: [], curriculumCourses: [] }
const defaultTemplateSlots = [
  { startTime: '08:00', endTime: '10:30' },
  { startTime: '11:00', endTime: '13:00' },
  { startTime: '14:00', endTime: '16:00' },
  { startTime: '17:00', endTime: '18:30' },
]

type TemplateCell = {
  id?: string
  courseId: string
  teacherId: string
  room: string
  sessionType: string
  customTime?: string
  rowSpan?: number | string
  colSpan?: number | string
}

type SheetColumn =
  | { id: string; type: 'slot'; slotIndex: number; startTime: string; endTime: string }
  | { id: string; type: 'divider'; verticalText: string }

type ProgrammeOption = TimetableOptions['programmes'][number] & { sourceIds: string[] }
const programmeIdentity = (programme: TimetableOptions['programmes'][number]) =>
  programme.code?.trim().toLocaleUpperCase() || programme.label.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
const deduplicateProgrammeOptions = (programmes: TimetableOptions['programmes'], curricula: TimetableOptions['curricula'], groups: TimetableOptions['teachingGroups']): ProgrammeOption[] => {
  const grouped = new Map<string, TimetableOptions['programmes']>()
  for (const programme of programmes) {
    const key = programmeIdentity(programme)
    grouped.set(key, [...(grouped.get(key) ?? []), programme])
  }
  return [...grouped.values()].map(items => {
    const ranked = [...items].sort((left, right) => {
      const score = (item: TimetableOptions['programmes'][number]) =>
        curricula.filter(curriculum => curriculum.programmeId === item.id).length * 10 +
        groups.filter(group => group.programmeId === item.id).length
      return score(right) - score(left) || left.label.localeCompare(right.label)
    })
    return { ...ranked[0], sourceIds: items.map(item => item.id) }
  }).sort((left, right) => left.label.localeCompare(right.label))
}

const timeLabel = (value: string) => value.slice(0, 5)
const format12Hour = (time24: string) => {
  if (!time24) return ''
  const [hStr, mStr] = time24.slice(0, 5).split(':')
  const h = Number(hStr)
  if (Number.isNaN(h)) return time24
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr || '00'} ${period}`
}
const formatSlotRange12 = (startTime: string, endTime: string) => `${format12Hour(startTime)} – ${format12Hour(endTime)}`

const formatSemesterDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value.slice(0, 10) + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const semesterDateRange = (semester?: TimetableOptions['semesters'][number]) => semester?.startDate && semester?.endDate
  ? `${formatSemesterDate(semester.startDate)} – ${formatSemesterDate(semester.endDate)}`
  : 'Semester dates not configured'
const timeRange = (entry: TimetableEntry) => timeLabel(entry.startTime) + '–' + timeLabel(entry.endTime)

export function TimetableManagement({ readOnly = false }: { readOnly?: boolean } = {}) {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [options, setOptions] = useState<TimetableOptions>(emptyOptions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [programmeId, setProgrammeId] = useState('')
  const [curriculumId, setCurriculumId] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [curriculumSemester, setCurriculumSemester] = useState('')
  const [teachingGroupId, setTeachingGroupId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [room, setRoom] = useState('')
  const [sessionType, setSessionType] = useState('Lecture')
  const [generatedResult, setGeneratedResult] = useState<GenerateTimetableResult | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [timetableCount, setTimetableCount] = useState('1')
  const [generatedTimetables, setGeneratedTimetables] = useState<Array<{ groupId: string; groupLabel: string; result: GenerateTimetableResult }>>([])
  const [view, setView] = useState<'week' | 'list'>('week')
  const [showWeekends, setShowWeekends] = useState(true)
  const [showSystemData, setShowSystemData] = useState(false)

  // Official KSHS Document Sheet Editor State
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [sheetEditingMode, setSheetEditingMode] = useState(true)
  const [templateGroupId, setTemplateGroupId] = useState('')
  const [templateLoadedGroupId, setTemplateLoadedGroupId] = useState('')
  const [templateSlots, setTemplateSlots] = useState(defaultTemplateSlots)
  const [templateCells, setTemplateCells] = useState<Record<string, TemplateCell>>({})
  const [templateInstitution, setTemplateInstitution] = useState('KAMPALA SCHOOL OF HEALTH SCIENCES')
  const [templateTitle, setTemplateTitle] = useState('TEACHING TIME TABLE')
  const [templateYearLabel, setTemplateYearLabel] = useState('')
  const [templateSemesterLabel, setTemplateSemesterLabel] = useState('')
  const [templateDayLabel, setTemplateDayLabel] = useState('DAY')
  const [templateRegistrarName, setTemplateRegistrarName] = useState('')
  const [templateRegistrarRole, setTemplateRegistrarRole] = useState('ACADEMIC REGISTRAR')
  const [templateSecondaryName, setTemplateSecondaryName] = useState('')
  const [templateSecondaryRole, setTemplateSecondaryRole] = useState('')
  const [templateFooterText, setTemplateFooterText] = useState('')
  const [templateBreakAfter, setTemplateBreakAfter] = useState<number | null>(0)
  const [templateBreakLabel, setTemplateBreakLabel] = useState('BREAK')
  const [templateLunchAfter, setTemplateLunchAfter] = useState<number | null>(1)
  const [templateLunchLabel, setTemplateLunchLabel] = useState('LUNCH')
  const [templateDayOrder, setTemplateDayOrder] = useState([1, 2, 3, 4, 5, 6, 0])
  const [templateSaving, setTemplateSaving] = useState(false)

  // Interactive Sheet Modals & Inline Tutor Picker State
  const [activeCellModal, setActiveCellModal] = useState<{ day: number; slotIndex: number } | null>(null)
  const [inlineTutorTarget, setInlineTutorTarget] = useState<string | null>(null)
  const [clipboardCell, setClipboardCell] = useState<TemplateCell | null>(null)
  const [showHeaderModal, setShowHeaderModal] = useState(false)
  const [showColumnsModal, setShowColumnsModal] = useState(false)
  const [showRegistrarModal, setShowRegistrarModal] = useState(false)

  const { institution, loaded: institutionLoaded } = useInstitutionSettings()

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(prev => (prev === msg ? '' : prev)), 2400)
  }, [])

  const load = useCallback(async () => {
    setError('')
    try {
      const [loadedEntries, loadedOptions] = await Promise.all([listTimetable(), getTimetableOptions()])
      setEntries(loadedEntries)
      setOptions({ ...emptyOptions, ...loadedOptions, programmes: loadedOptions.programmes ?? [], curricula: loadedOptions.curricula ?? [], curriculumCourses: loadedOptions.curriculumCourses ?? [] })
      setSemesterId(current => current || loadedOptions.semesters.find(item => item.isCurrent)?.id || loadedOptions.semesters.find(item => item.isActive)?.id || loadedOptions.semesters[0]?.id || '')
      setProgrammeId(current => current || loadedOptions.programmes?.[0]?.id || '')
      setCurriculumId(current => current || loadedOptions.curricula.find(item => item.programmeId === (loadedOptions.programmes[0]?.id ?? ''))?.id || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load timetable data.')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void load().finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    if (institutionLoaded && institution.isActive && institution.institutionName) {
      setTemplateInstitution(institution.institutionName.toUpperCase())
    }
  }, [institutionLoaded, institution])

  const groupLabels = useMemo(() => new Map(options.teachingGroups.map(item => [item.id, item.label])), [options.teachingGroups])
  const courseLabels = useMemo(() => new Map(options.courses.map(item => [item.id, item.label])), [options.courses])
  const teacherLabels = useMemo(() => new Map(options.teachers.map(item => [item.id, item.label])), [options.teachers])
  const availableSemesters = options.semesters
  const selectedSemester = availableSemesters.find(item => item.id === semesterId)
  const academicYearLabel = selectedSemester?.academicYearLabel || selectedSemester?.label || 'Academic year not set'
  const selectedProgramme = options.programmes.find(item => item.id === programmeId)
  const semesterGroupIds = useMemo(() => new Set(options.teachingGroups.filter(item => item.semesterId === semesterId).map(item => item.id)), [options.teachingGroups, semesterId])
  const deduplicatedProgrammes = deduplicateProgrammeOptions(options.programmes, options.curricula, options.teachingGroups)
  const programmeSourceIds = useMemo(() => new Map(deduplicatedProgrammes.map(item => [item.id, item.sourceIds])), [deduplicatedProgrammes])
  const selectedSourceIds = programmeSourceIds.get(programmeId) ?? [programmeId]
  const programmeCurricula = options.curricula.filter(item => selectedSourceIds.includes(item.programmeId))
  const selectedCurriculum = programmeCurricula.find(item => item.id === curriculumId) ?? programmeCurricula[0]
  const curriculumMappings = options.curriculumCourses.filter(item => item.curriculumId === selectedCurriculum?.id)

  const semesterTemplates = useMemo(() => {
    const grouped = new Map<string, { year: number; semester: number; courseIds: Set<string>; courseLabels: string[] }>()
    for (const mapping of curriculumMappings) {
      const key = mapping.yearOfStudy + '-' + mapping.semesterNumber
      const current = grouped.get(key) ?? { year: mapping.yearOfStudy, semester: mapping.semesterNumber, courseIds: new Set<string>(), courseLabels: [] }
      current.courseIds.add(mapping.courseId)
      if (!current.courseLabels.includes(mapping.courseLabel)) current.courseLabels.push(mapping.courseLabel)
      grouped.set(key, current)
    }
    return [...grouped.values()].sort((a, b) => a.year - b.year || a.semester - b.semester)
  }, [curriculumMappings])

  const studyYears = [...new Set(curriculumMappings.map(item => item.yearOfStudy))].sort((a, b) => a - b)
  const curriculumSemesters = [...new Set(curriculumMappings.filter(item => !yearOfStudy || item.yearOfStudy === Number(yearOfStudy)).map(item => item.semesterNumber))].sort((a, b) => a - b)
  const eligibleMappings = curriculumMappings.filter(item => (!yearOfStudy || item.yearOfStudy === Number(yearOfStudy)) && (!curriculumSemester || item.semesterNumber === Number(curriculumSemester)))
  const eligibleCourseIds = new Set(eligibleMappings.map(item => item.courseId))
  const availableCourses = options.courses.filter(item => eligibleCourseIds.has(item.id))
  const availableGroups = options.teachingGroups.filter(item => item.programmeId === programmeId && item.semesterId === semesterId && eligibleCourseIds.has(item.courseId))
  const allSemesterGroups = options.teachingGroups.filter(item => item.programmeId === programmeId && item.semesterId === semesterId)
  const selectedGroup = options.teachingGroups.find(item => item.id === teachingGroupId)
  const selectedGroupCourses = selectedGroup ? options.courses.filter(item => item.id === selectedGroup.courseId && eligibleCourseIds.has(item.id)) : []
  const activeEntries = useMemo(() => entries.filter(item => item.isActive && semesterGroupIds.has(item.teachingGroupId)), [entries, semesterGroupIds])
  const distinctGroups = useMemo(() => new Set(activeEntries.map(item => item.teachingGroupId)).size, [activeEntries])
  const distinctTeachers = useMemo(() => new Set(activeEntries.map(item => item.teacherId)).size, [activeEntries])
  const practicalCount = useMemo(() => activeEntries.filter(item => item.sessionType?.toLowerCase() === 'practical').length, [activeEntries])
  const orderedEntries = useMemo(() => [...activeEntries].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)), [activeEntries])
  const displayedWeekDays = showWeekends ? weekOrder.filter(day => day !== 0) : weekOrder.filter(day => day >= 1 && day <= 5)
  const timeSlots = useMemo(() => [...new Set(activeEntries.map(entry => entry.startTime))].sort((a, b) => a.localeCompare(b)), [activeEntries])

  // Build horizontal columns with vertical BREAK and LUNCH dividers
  const sheetColumns = useMemo<SheetColumn[]>(() => {
    const cols: SheetColumn[] = []
    templateSlots.forEach((slot, idx) => {
      cols.push({
        id: `slot-${idx}`,
        type: 'slot',
        slotIndex: idx,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
      if (templateBreakAfter === idx) {
        cols.push({
          id: `div-break-${idx}`,
          type: 'divider',
          verticalText: (templateBreakLabel || 'BREAK').toUpperCase(),
        })
      }
      if (templateLunchAfter === idx && templateLunchAfter !== templateBreakAfter) {
        cols.push({
          id: `div-lunch-${idx}`,
          type: 'divider',
          verticalText: (templateLunchLabel || 'LUNCH').toUpperCase(),
        })
      }
    })
    return cols
  }, [templateSlots, templateBreakAfter, templateBreakLabel, templateLunchAfter, templateLunchLabel])

  function timetablePdfOptions(title: string, rows: TimetableEntry[], filename: string) {
    const sorted = [...rows].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    const slots = [...new Set(sorted.map(entry => entry.startTime))].sort((a, b) => a.localeCompare(b))
    const printableSlots = slots.length ? slots : defaultTemplateSlots.map(slot => slot.startTime)
    const timetableBody = [
      [{ text: 'DAY', style: 'tableHeader' }, ...printableSlots.map((slot, index) => ({ text: `PERIOD ${index + 1}\n${timeLabel(slot)}`, style: 'tableHeader' }))],
      ...displayedWeekDays.map(day => [
        { text: days[day].toUpperCase(), style: 'tableHeader' },
        ...printableSlots.map(slot => {
          const sessions = sorted.filter(entry => entry.dayOfWeek === day && entry.startTime === slot)
          const text = sessions.map(entry => [
            courseLabels.get(entry.courseId) ?? 'Course not found',
            teacherLabels.get(entry.teacherId) ?? 'Teacher not found',
            timeRange(entry),
            entry.room ? `Venue: ${entry.room}` : '',
            entry.sessionType || '',
          ].filter(Boolean).join('\n')).join('\n\n')
          return { text: text || '—', alignment: 'center' }
        }),
      ]),
    ]
    return {
      title,
      filename,
      orientation: 'landscape' as const,
      institutionName: institutionLoaded && institution.isActive ? institution.institutionName : templateInstitution || undefined,
      motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
      contactLines: institutionLoaded && institution.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
      accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
      content: [
        { text: `ACADEMIC YEAR ${academicYearLabel} · ${selectedSemester?.label ?? 'Academic period'} · VALID FOR ${semesterDateRange(selectedSemester)}`, alignment: 'center', fontSize: 9, margin: [0, 0, 0, 10] },
        { table: { headerRows: 1, widths: ['auto', ...printableSlots.map(() => '*')], body: timetableBody }, layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => '#111827',
          vLineColor: () => '#111827',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        } },
        ...(templateRegistrarName.trim()
          ? [{ text: `${templateRegistrarRole || 'ACADEMIC REGISTRAR'}: ${templateRegistrarName.trim().toUpperCase()}`, alignment: 'left' as const, margin: [0, 28, 0, 0] }]
          : []),
      ],
    }
  }

  function printGeneratedTimetable(groupId: string) {
    const target = generatedTimetables.find(item => item.groupId === groupId)
    if (target) printInstitutionalPdf(timetablePdfOptions(target.groupLabel + ' Teaching Timetable', target.result.entries, target.groupLabel + '-timetable'))
  }

  function printTimetableTemplate() {
    const visibleDays = templateDayOrder.filter(day => showWeekends || (day >= 1 && day <= 5))
    const groupLabel = groupLabels.get(templateGroupId) ?? 'Class timetable'
    const base = timetablePdfOptions(templateTitle || groupLabel + ' Timetable', [], groupLabel + '-timetable-template')

    const headerRow: Array<Record<string, unknown>> = [{ text: templateDayLabel || 'DAY', style: 'tableHeader' }]
    sheetColumns.forEach(col => {
      if (col.type === 'divider') {
        headerRow.push({ text: col.verticalText[0] || 'B', style: 'tableHeader', alignment: 'center' })
      } else {
        headerRow.push({ text: formatSlotRange12(col.startTime, col.endTime), style: 'tableHeader', alignment: 'center' })
      }
    })

    const body = [
      headerRow,
      ...visibleDays.map((day, rIdx) => {
        const row: Array<Record<string, unknown>> = [{ text: shortDays[day] || days[day].toUpperCase(), style: 'tableHeader' }]
        sheetColumns.forEach(col => {
          if (col.type === 'divider') {
            if (rIdx === 0) {
              row.push({
                text: col.verticalText.slice(1).split('').join('\n'),
                rowSpan: visibleDays.length,
                alignment: 'center',
                bold: true,
              })
            } else {
              row.push({})
            }
            return
          }
          const slotIndex = col.slotIndex
          if (templateCellCovered(day, slotIndex)) { row.push({}); return }
          const cell = templateCells[day + '-' + slotIndex]
          const rowSpan = Math.max(1, Math.min(visibleDays.length - rIdx, Number(cell?.rowSpan) || 1))
          const colSpan = Math.max(1, Math.min(templateSlots.length - slotIndex, Number(cell?.colSpan) || 1))
          const courseName = cell?.courseId ? (courseLabels.get(cell.courseId) ?? '').toUpperCase() : ''
          const teacherName = cell?.teacherId ? `(${(teacherLabels.get(cell.teacherId) ?? '').toUpperCase()})` : ''
          const metaLine = [cell?.customTime, cell?.room].filter(Boolean).join(' • ')
          const text = cell ? [courseName, teacherName, metaLine].filter(Boolean).join('\n') : ''
          row.push({ text: text || ' ', alignment: 'center', ...(rowSpan > 1 ? { rowSpan } : {}), ...(colSpan > 1 ? { colSpan } : {}) })
        })
        return row
      }),
    ]

    const widths = ['auto', ...sheetColumns.map(col => (col.type === 'divider' ? 18 : '*'))]
    const footerContent: Array<Record<string, unknown>> = []
    if (templateRegistrarName.trim()) {
      footerContent.push({
        text: `..........................................\n${templateRegistrarRole || 'ACADEMIC REGISTRAR'}\n${templateRegistrarName.trim().toUpperCase()}`,
        alignment: 'left',
        bold: true,
        margin: [0, 24, 0, 0],
      })
    }
    if (templateFooterText.trim()) {
      footerContent.push({ text: templateFooterText, alignment: 'left', fontSize: 8, margin: [0, 8, 0, 0] })
    }

    printInstitutionalPdf({
      ...base,
      institutionName: templateInstitution || base.institutionName,
      title: templateTitle || base.title,
      content: [
        {
          text: `${templateYearLabel || 'ACADEMIC YEAR ' + academicYearLabel}\n${templateSemesterLabel || (yearOfStudy && curriculumSemester ? `YEAR ${yearOfStudy} SEMESTER ${curriculumSemester}` : selectedSemester?.label ?? '')}`,
          alignment: 'center',
          bold: true,
          fontSize: 10,
          margin: [0, 0, 0, 10],
        },
        {
          table: { headerRows: 1, widths, body },
          layout: {
            hLineWidth: () => 0.8,
            vLineWidth: () => 0.8,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
        ...footerContent,
      ],
    })
  }

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setGeneratedResult(null)
    setGeneratedTimetables([])
    if (!semesterId || !programmeId || !selectedCurriculum || !yearOfStudy || !curriculumSemester) { setError('Select a programme, curriculum, year of study, curriculum semester and academic period first.'); return }
    const selectedGroups = teachingGroupId
      ? availableGroups.filter(group => group.id === teachingGroupId)
      : availableGroups.slice(0, Math.max(1, Math.min(availableGroups.length, Number(timetableCount) || 1)))
    if (selectedGroups.length === 0) { setError('Create teaching groups before generating timetables.'); return }
    setLoading(true)
    try {
      const results: Array<{ groupId: string; groupLabel: string; result: GenerateTimetableResult }> = []
      for (const group of selectedGroups) {
        const result = await generateTimetable(semesterId, group.id, selectedCurriculum.id, Number(yearOfStudy), Number(curriculumSemester), programmeId)
        results.push({ groupId: group.id, groupLabel: group.label, result })
      }
      setGeneratedTimetables(results)
      if (results.length === 1) setGeneratedResult(results[0].result)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate timetables.')
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (!teachingGroupId || !courseId || !teacherId || !selectedCurriculum || !yearOfStudy || !curriculumSemester) { setError('Select a programme, curriculum, year, semester, teaching group, course unit and teacher.'); return }
    if (!eligibleCourseIds.has(courseId) || options.teachingGroups.find(item => item.id === teachingGroupId)?.courseId !== courseId) { setError('The selected course unit does not belong to this teaching group and curriculum selection.'); return }
    if (endTime <= startTime) { setError('End time must be later than start time.'); return }
    setLoading(true)
    try {
      if (editingEntryId) {
        await updateTimetableEntry(editingEntryId, {
          teachingGroupId,
          courseId,
          teacherId,
          curriculumId: selectedCurriculum.id,
          yearOfStudy: Number(yearOfStudy),
          curriculumSemesterNumber: Number(curriculumSemester),
          dayOfWeek: Number(dayOfWeek),
          startTime: startTime + ':00',
          endTime: endTime + ':00',
          room: room.trim() || undefined,
          sessionType: sessionType.trim() || undefined,
        })
        setEditingEntryId(null)
      } else {
        await createTimetableEntry({
          teachingGroupId,
          courseId,
          teacherId,
          curriculumId: selectedCurriculum.id,
          yearOfStudy: Number(yearOfStudy),
          curriculumSemesterNumber: Number(curriculumSemester),
          dayOfWeek: Number(dayOfWeek),
          startTime: startTime + ':00',
          endTime: endTime + ':00',
          room: room.trim() || undefined,
          sessionType: sessionType.trim() || undefined,
        })
      }
      setShowScheduleForm(false)
      setError('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save timetable entry.')
    } finally {
      setLoading(false)
    }
  }

  function editEntry(entry: TimetableEntry) {
    const group = options.teachingGroups.find(item => item.id === entry.teachingGroupId)
    const mapping = options.curriculumCourses.find(item => item.courseId === entry.courseId && item.programmeId === group?.programmeId)
    const curriculum = options.curricula.find(item => item.id === mapping?.curriculumId)
    setProgrammeId(group?.programmeId ?? '')
    setCurriculumId(curriculum?.id ?? '')
    setYearOfStudy(mapping ? String(mapping.yearOfStudy) : '')
    setCurriculumSemester(mapping ? String(mapping.semesterNumber) : '')
    setSemesterId(group?.semesterId ?? semesterId)
    setTeachingGroupId(entry.teachingGroupId)
    setCourseId(entry.courseId)
    setTeacherId(entry.teacherId)
    setDayOfWeek(String(entry.dayOfWeek))
    setStartTime(timeLabel(entry.startTime))
    setEndTime(timeLabel(entry.endTime))
    setRoom(entry.room ?? '')
    setSessionType(entry.sessionType ?? 'Lecture')
    setEditingEntryId(entry.id)
    setShowScheduleForm(true)
    setError('')
  }

  async function loadTemplate(overrideGroupId?: string, overrideYear?: string, overrideSem?: string) {
    const targetGroupId = overrideGroupId ?? templateGroupId
    const targetYear = overrideYear ?? yearOfStudy
    const targetSem = overrideSem ?? curriculumSemester
    if (!selectedCurriculum || !targetYear || !targetSem) { setError('Select a curriculum, year of study and curriculum semester before loading the template.'); return }
    if (!targetGroupId || !options.teachingGroups.some(item => item.id === targetGroupId)) { setError('Choose a teaching group from the selected programme curriculum and academic period.'); return }
    setError('')
    const progName = (selectedProgramme?.label || 'CERTIFICATE IN PHARMACY').toUpperCase()
    const defaultInst = institutionLoaded && institution.isActive && institution.institutionName
      ? institution.institutionName.toUpperCase()
      : 'KAMPALA SCHOOL OF HEALTH SCIENCES'
    const defaultYearStr = `ACADEMIC YEAR ${academicYearLabel.toUpperCase()}`
    const defaultSemStr = `YEAR ${targetYear} SEMESTER ${targetSem}`

    try {
      const saved = await getTimetableTemplate(targetGroupId)
      if (saved.layoutJson) {
        const layout = JSON.parse(saved.layoutJson) as {
          slots?: Array<{ startTime: string; endTime: string }>
          cells?: Record<string, TemplateCell>
          showWeekends?: boolean
          institutionName?: string
          title?: string
          yearLabel?: string
          semesterLabel?: string
          dayLabel?: string
          registrarName?: string
          registrarRole?: string
          secondaryName?: string
          secondaryRole?: string
          footerText?: string
          breakAfter?: number | null
          breakLabel?: string
          lunchAfter?: number | null
          lunchLabel?: string
          dayOrder?: number[]
        }
        if (Array.isArray(layout.slots) && layout.slots.length > 0 && layout.cells && typeof layout.cells === 'object') {
          setTemplateSlots(layout.slots.map(slot => ({ startTime: slot.startTime, endTime: slot.endTime })))
          setTemplateCells(layout.cells)
          if (typeof layout.showWeekends === 'boolean') setShowWeekends(layout.showWeekends)
          setTemplateInstitution(layout.institutionName || defaultInst)
          setTemplateTitle(layout.title || `TEACHING TIME TABLE FOR ${progName}`)
          setTemplateYearLabel(layout.yearLabel || defaultYearStr)
          setTemplateSemesterLabel(layout.semesterLabel || defaultSemStr)
          setTemplateDayLabel(layout.dayLabel || 'DAY')
          setTemplateRegistrarName(layout.registrarName || '')
          setTemplateRegistrarRole(layout.registrarRole || 'ACADEMIC REGISTRAR')
          setTemplateSecondaryName(layout.secondaryName || '')
          setTemplateSecondaryRole(layout.secondaryRole || '')
          setTemplateFooterText(layout.footerText ?? '')
          setTemplateBreakAfter(typeof layout.breakAfter === 'number' ? layout.breakAfter : 0)
          setTemplateBreakLabel(layout.breakLabel || 'BREAK')
          setTemplateLunchAfter(typeof layout.lunchAfter === 'number' ? layout.lunchAfter : 1)
          setTemplateLunchLabel(layout.lunchLabel || 'LUNCH')
          setTemplateDayOrder(Array.isArray(layout.dayOrder) && layout.dayOrder.length ? layout.dayOrder : [1, 2, 3, 4, 5, 6, 0])
          setTemplateLoadedGroupId(targetGroupId)
          setShowTemplateEditor(true)
          triggerToast('Loaded official timetable sheet.')
          return
        }
      }

      // Backward-compatible fallback for groups with existing sessions
      const groupEntries = activeEntries.filter(entry => entry.teachingGroupId === targetGroupId)
      const slots = [...defaultTemplateSlots.map(slot => ({ ...slot }))]
      for (const entry of groupEntries) {
        const start = timeLabel(entry.startTime)
        const existingSlot = slots.find(slot => slot.startTime === start)
        if (existingSlot) existingSlot.endTime = timeLabel(entry.endTime)
        else slots.push({ startTime: start, endTime: timeLabel(entry.endTime) })
      }
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
      const cells: Record<string, TemplateCell> = {}
      for (const entry of groupEntries) {
        const slotIndex = slots.findIndex(slot => slot.startTime === timeLabel(entry.startTime))
        const key = entry.dayOfWeek + '-' + slotIndex
        if (cells[key]) {
          setError('This class has multiple sessions at the same day and start time. Resolve the duplicate sessions before editing its template.')
          return
        }
        cells[key] = { id: entry.id, courseId: entry.courseId, teacherId: entry.teacherId, room: entry.room ?? '', sessionType: entry.sessionType ?? 'Lecture', rowSpan: 1, colSpan: 1 }
      }
      setTemplateSlots(slots)
      setTemplateCells(cells)
      setTemplateInstitution(defaultInst)
      setTemplateTitle(`TEACHING TIME TABLE FOR ${progName}`)
      setTemplateYearLabel(defaultYearStr)
      setTemplateSemesterLabel(defaultSemStr)
      setTemplateDayLabel('DAY')
      setTemplateRegistrarName('')
      setTemplateRegistrarRole('ACADEMIC REGISTRAR')
      setTemplateSecondaryName('')
      setTemplateSecondaryRole('')
      setTemplateFooterText('')
      setTemplateBreakAfter(0)
      setTemplateBreakLabel('BREAK')
      setTemplateLunchAfter(1)
      setTemplateLunchLabel('LUNCH')
      setTemplateDayOrder([1, 2, 3, 4, 5, 6, 0])
      setTemplateLoadedGroupId(targetGroupId)
      setShowTemplateEditor(true)
      triggerToast('Initialized official timetable sheet.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the saved timetable template.')
    }
  }

  function changeTemplateCell(key: string, field: keyof TemplateCell, value: string | number) {
    setTemplateCells(current => ({
      ...current,
      [key]: {
        ...(current[key] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture', customTime: '', rowSpan: 1, colSpan: 1 }),
        [field]: value,
      },
    }))
  }

  function clearTemplateCell(key: string) {
    setTemplateCells(current => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function saveTemplate() {
    if (!selectedCurriculum || !yearOfStudy || !curriculumSemester) { setError('Select a curriculum, year of study and curriculum semester before saving the template.'); return }
    if (!templateGroupId || templateLoadedGroupId !== templateGroupId) { setError('Choose a class and load it into the template before saving.'); return }
    const coveredPopulated = Object.entries(templateCells).filter(([key, cell]) => { const [day, slot] = key.split('-').map(Number); return (cell.courseId || cell.teacherId) && templateCellCovered(day, slot) })
    if (coveredPopulated.length) { setError('A merged cell covers another populated lesson. Move or clear the covered lesson before saving so no scheduled session is lost.'); return }
    const populated = Object.entries(templateCells).filter(([key, cell]) => { const [day, slot] = key.split('-').map(Number); return (cell.courseId || cell.teacherId) && !templateCellCovered(day, slot) })
    if (templateSlots.some(slot => !slot.startTime || !slot.endTime || slot.endTime <= slot.startTime)) { setError('Every period must have an end time later than its start time.'); return }
    if (populated.some(([, cell]) => !cell.courseId || !cell.teacherId)) { setError('Every filled timetable cell needs both a course unit and a tutor assigned.'); return }

    const payloadEntries: CreateTimetableEntry[] = populated.map(([key, cell]) => {
      const [day, slotIndexText] = key.split('-')
      const slot = templateSlots[Number(slotIndexText)]
      return {
        teachingGroupId: templateGroupId,
        courseId: cell.courseId,
        teacherId: cell.teacherId,
        curriculumId: selectedCurriculum.id,
        yearOfStudy: Number(yearOfStudy),
        curriculumSemesterNumber: Number(curriculumSemester),
        dayOfWeek: Number(day),
        startTime: slot.startTime + ':00',
        endTime: slot.endTime + ':00',
        room: cell.room.trim() || undefined,
        sessionType: cell.sessionType || 'Lecture',
      }
    })

    setTemplateSaving(true)
    setError('')
    try {
      await saveTimetableTemplate(templateGroupId, payloadEntries, {
        slots: templateSlots,
        cells: templateCells,
        showWeekends,
        institutionName: templateInstitution,
        title: templateTitle,
        yearLabel: templateYearLabel,
        semesterLabel: templateSemesterLabel,
        dayLabel: templateDayLabel,
        registrarName: templateRegistrarName,
        registrarRole: templateRegistrarRole,
        secondaryName: templateSecondaryName,
        secondaryRole: templateSecondaryRole,
        footerText: templateFooterText,
        breakAfter: templateBreakAfter,
        breakLabel: templateBreakLabel,
        lunchAfter: templateLunchAfter,
        lunchLabel: templateLunchLabel,
        dayOrder: templateDayOrder,
      })
      await load()
      triggerToast('Timetable sheet synced & saved to system.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the timetable template. No changes were saved.')
    } finally {
      setTemplateSaving(false)
    }
  }

  function moveTemplateDay(day: number, direction: -1 | 1) {
    setTemplateDayOrder(current => {
      const index = current.indexOf(day)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function reorderTemplateSlots(order: number[]) {
    setTemplateSlots(current => order.map(index => current[index]).filter(Boolean))
    setTemplateCells(current => {
      const next: Record<string, TemplateCell> = {}
      Object.entries(current).forEach(([key, cell]) => {
        const [day, oldIndex] = key.split('-').map(Number)
        const newIndex = order.indexOf(oldIndex)
        if (newIndex >= 0) next[day + '-' + newIndex] = cell
      })
      return next
    })
    setTemplateBreakAfter(current => (current === null ? null : order.indexOf(current) >= 0 ? order.indexOf(current) : null))
    setTemplateLunchAfter(current => (current === null ? null : order.indexOf(current) >= 0 ? order.indexOf(current) : null))
  }

  function removeTemplateSlot(index: number) {
    if (templateSlots.length <= 1) return
    reorderTemplateSlots(templateSlots.map((_, slotIndex) => slotIndex).filter(slotIndex => slotIndex !== index))
  }

  function moveTemplateSlot(index: number, direction: -1 | 1) {
    const order = templateSlots.map((_, slotIndex) => slotIndex)
    const target = index + direction
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    reorderTemplateSlots(order)
  }

  function templateCellCovered(day: number, slotIndex: number) {
    const visibleDays = templateDayOrder.filter(item => showWeekends || (item >= 1 && item <= 5))
    const rowIndex = visibleDays.indexOf(day)
    if (rowIndex === -1) return false
    for (let r = 0; r <= rowIndex; r++) {
      const sourceDay = visibleDays[r]
      const maxSlot = r === rowIndex ? slotIndex - 1 : templateSlots.length - 1
      for (let c = 0; c <= maxSlot; c++) {
        const source = templateCells[sourceDay + '-' + c]
        if (!source) continue
        const rowSpan = Math.max(1, Math.min(visibleDays.length - r, Number(source.rowSpan) || 1))
        const colSpan = Math.max(1, Math.min(templateSlots.length - c, Number(source.colSpan) || 1))
        if (r + rowSpan > rowIndex && c + colSpan > slotIndex) return true
      }
    }
    return false
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this timetable session?')) return
    setError('')
    try {
      await deactivateTimetableEntry(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to deactivate entry.')
    }
  }

  const visibleSheetDays = templateDayOrder.filter(day => showWeekends || (day >= 1 && day <= 5))
  const modalCellData = activeCellModal
    ? templateCells[activeCellModal.day + '-' + activeCellModal.slotIndex] ?? {
        courseId: '',
        teacherId: '',
        room: '',
        sessionType: 'Lecture',
        customTime: '',
        rowSpan: 1,
        colSpan: 1,
      }
    : null

  return <section className="timetable-screen">
    <style>{`
      .kshs-workspace { background: #eef1f5; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-bottom: 1.5rem; }
      .kshs-toolbar { background: #0f172a; color: #f8fafc; padding: 0.75rem 1.15rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; }
      .kshs-toolbar-group { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
      .kshs-badge { font-weight: 700; font-size: 0.9rem; padding-right: 0.65rem; border-right: 1px solid #334155; color: #fff; }
      .kshs-select, .kshs-btn { background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 0.42rem 0.75rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; }
      .kshs-select:hover, .kshs-btn:hover { background: #334155; }
      .kshs-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .kshs-btn-amber { background: #d97706; border-color: #f59e0b; color: #fff; }
      .kshs-btn-amber:hover { background: #b45309; }
      .kshs-btn-blue { background: #1d4ed8; border-color: #2563eb; color: #fff; }
      .kshs-btn-blue:hover { background: #1e40af; }
      .kshs-sheet-viewport { padding: 1.25rem; overflow-x: auto; }
      .kshs-document-sheet { background: #ffffff; border: 1px solid #cbd5e1; box-shadow: 0 10px 28px rgba(15,23,42,0.08); padding: 1.75rem 2rem 2rem; font-family: "Times New Roman", Times, Georgia, serif; color: #000000; max-width: 1280px; margin: 0 auto; }
      .kshs-doc-header { text-align: center; margin-bottom: 1rem; transition: background 0.15s; }
      .kshs-is-editing .kshs-doc-header { border: 1.5px dashed #d97706; background: #fffdf7; padding: 0.6rem; border-radius: 6px; cursor: pointer; }
      .kshs-doc-line { text-transform: uppercase; font-weight: 700; color: #000; line-height: 1.32; }
      .kshs-doc-inst { font-size: 1.35rem; }
      .kshs-doc-sub { font-size: 1.06rem; }
      .kshs-doc-meta { font-size: 1rem; }
      .kshs-table-wrap { width: 100%; overflow-x: auto; }
      .kshs-grid { width: 100%; min-width: 920px; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #000000; }
      .kshs-grid th, .kshs-grid td { border: 1px solid #000000; text-align: center; vertical-align: middle; color: #000000; }
      .kshs-col-day, .kshs-col-slot { font-size: 0.9rem; font-weight: 700; padding: 0.55rem; background: #f8fafc; }
      .kshs-is-editing .kshs-col-day, .kshs-is-editing .kshs-col-slot { background: #fffbeb; cursor: pointer; }
      .kshs-col-divider { width: 34px; padding: 0.4rem 0.15rem; background: #ffffff; font-weight: 700; font-size: 0.9rem; line-height: 1.15; }
      .kshs-is-editing .kshs-col-divider { background: #fffbeb; cursor: pointer; }
      .kshs-divider-stack { display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 260px; height: 100%; }
      .kshs-day-cell { font-weight: 700; font-size: 0.94rem; padding: 0.55rem; background: #ffffff; width: 92px; }
      .kshs-is-editing .kshs-day-cell { background: #fffdf7; }
      .kshs-row-ctrls { display: flex; justify-content: center; gap: 3px; margin-top: 4px; font-family: sans-serif; }
      .kshs-mini-btn { border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; border-radius: 3px; font-size: 0.68rem; padding: 1px 5px; cursor: pointer; }
      .kshs-mini-btn:hover { background: #e2e8f0; }
      .kshs-lecture-cell { padding: 0.6rem; font-size: 0.88rem; background: #ffffff; transition: background 0.12s; }
      .kshs-is-editing .kshs-lecture-cell:hover { background: #fefce8; cursor: pointer; }
      .kshs-cell-course { font-weight: 700; margin-bottom: 2px; border-radius: 4px; padding: 1px 4px; text-transform: uppercase; }
      .kshs-cell-tutor { font-style: italic; color: #1e293b; font-size: 0.84rem; border-radius: 4px; padding: 1px 4px; text-transform: uppercase; }
      .kshs-is-editing .kshs-cell-course:hover, .kshs-is-editing .kshs-cell-tutor:hover { background: #fde68a; outline: 1px dashed #b45309; }
      .kshs-inline-picker { font-family: sans-serif; font-size: 0.78rem; padding: 3px 5px; border: 1.5px solid #1d4ed8; border-radius: 4px; background: #fff; color: #0f172a; width: 100%; max-width: 195px; margin-top: 2px; }
      .kshs-cell-sub { font-size: 0.76rem; color: #475569; margin-top: 2px; }
      .kshs-empty-hint { color: #94a3b8; font-size: 0.75rem; font-style: italic; font-family: sans-serif; }
      .kshs-doc-footer { margin-top: 1.6rem; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 2rem; min-height: 48px; }
      .kshs-is-editing .kshs-doc-footer { border: 1.5px dashed #d97706; background: #fffdf7; padding: 0.65rem; border-radius: 6px; cursor: pointer; }
      .kshs-reg-block { min-width: 240px; }
      .kshs-sig-line { border-bottom: 1.5px dotted #000000; height: 26px; margin-bottom: 4px; }
      .kshs-reg-text { font-size: 0.88rem; font-weight: 700; text-transform: uppercase; line-height: 1.3; }
      .kshs-modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
      .kshs-modal-card { background: #ffffff; width: 100%; max-width: 520px; border-radius: 10px; box-shadow: 0 24px 48px rgba(15,23,42,0.22); overflow: hidden; font-family: sans-serif; color: #0f172a; }
      .kshs-modal-head { background: #0f172a; color: #ffffff; padding: 0.9rem 1.2rem; display: flex; align-items: center; justify-content: space-between; }
      .kshs-modal-head h4 { margin: 0; font-size: 1rem; font-weight: 700; }
      .kshs-modal-body { padding: 1.15rem; display: flex; flex-direction: column; gap: 0.85rem; max-height: 75vh; overflow-y: auto; }
      .kshs-modal-foot { background: #f8fafc; padding: 0.8rem 1.2rem; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
      .kshs-field { display: flex; flex-direction: column; gap: 0.3rem; }
      .kshs-field label { font-size: 0.78rem; font-weight: 700; color: #334155; }
      .kshs-input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.48rem 0.7rem; font-size: 0.88rem; width: 100%; background: #fff; color: #0f172a; }
      .kshs-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .kshs-mbtn { padding: 0.45rem 0.9rem; border-radius: 6px; font-weight: 600; font-size: 0.82rem; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; color: #0f172a; }
      .kshs-mbtn-save { background: #1d4ed8; color: #fff; border-color: #2563eb; }
      .kshs-mbtn-danger { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
      .kshs-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; background: #0f172a; color: #fff; padding: 0.7rem 1.15rem; border-radius: 8px; font-size: 0.84rem; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.22); z-index: 2000; }
      @media print {
        .kshs-toolbar, .kshs-row-ctrls, .kshs-empty-hint { display: none !important; }
        .kshs-workspace { border: none; background: #fff; }
        .kshs-sheet-viewport { padding: 0; overflow: visible !important; }
        .kshs-document-sheet { border: none !important; box-shadow: none !important; padding: 0.4cm; }
        .kshs-doc-header, .kshs-doc-footer { border: none !important; background: transparent !important; padding: 0 !important; }
      }
    `}</style>

    <header className="timetable-hero">
      <div>
        <p className="timetable-eyebrow">Academic planning</p>
        <h2>{readOnly ? 'Timetable' : 'Timetable management'}</h2>
        <p>Review the weekly teaching schedule, rooms and staff assignments in one place.</p>
      </div>
      <div className="timetable-actions">
        {!readOnly && <button className="timetable-action primary" type="button" onClick={() => setShowGenerator(value => !value)} aria-expanded={showGenerator}><Sparkles /> {showGenerator ? 'Hide generator' : 'Generate timetable'}</button>}
        {!readOnly && <button className="timetable-action primary" type="button" onClick={() => setShowTemplateEditor(value => !value)} aria-expanded={showTemplateEditor}><Pencil /> {showTemplateEditor ? 'Close template editor' : 'Edit timetable template'}</button>}
        {!readOnly && <button className="timetable-action primary" type="button" onClick={() => setShowScheduleForm(value => !value)} aria-expanded={showScheduleForm}><Plus /> {showScheduleForm ? 'Close form' : 'Schedule session'}</button>}
      </div>
    </header>

    {error && <div className="timetable-notice" role="alert">{error}</div>}
    {toastMsg && <div className="kshs-toast">{toastMsg}</div>}

    <div className="timetable-metrics" aria-label="Timetable summary">
      <div className="timetable-metric"><span>Scheduled sessions</span><strong>{activeEntries.length}</strong></div>
      <div className="timetable-metric"><span>Teaching groups</span><strong>{distinctGroups}</strong></div>
      <div className="timetable-metric"><span>Assigned teachers</span><strong>{distinctTeachers}</strong></div>
      <div className="timetable-metric"><span>Practical sessions</span><strong>{practicalCount}</strong></div>
    </div>
    
    {!readOnly && selectedCurriculum && <section className="timetable-semester-templates" aria-label="Curriculum semester timetable templates">
      <div className="timetable-semester-templates-heading">
        <div><h3>{selectedCurriculum.label} · Semester templates</h3><span>{semesterTemplates.length} separate template{semesterTemplates.length === 1 ? '' : 's'} · {availableSemesters.find(item => item.id === semesterId)?.label ?? 'Select an academic period'}</span></div>
      </div>
      {semesterTemplates.length === 0 ? <p className="timetable-day-empty">This active curriculum has no semester course mappings yet. Add course units and assign each to a year and semester in Curriculum &amp; Courses; its timetable templates will appear here automatically.</p> :
        <div className="timetable-semester-template-grid">
          {semesterTemplates.map(item => {
            const courseIds = item.courseIds
            const matchingGroups = options.teachingGroups.filter(group => group.programmeId === programmeId && group.semesterId === semesterId && courseIds.has(group.courseId))
            const sessionCount = activeEntries.filter(entry => matchingGroups.some(group => group.id === entry.teachingGroupId)).length
            const selected = yearOfStudy === String(item.year) && curriculumSemester === String(item.semester)
            return <article className={`timetable-semester-template-card${selected ? ' is-selected' : ''}`} key={item.year + '-' + item.semester}>
              <div><span className="timetable-semester-template-kicker">YEAR {item.year}</span><h4>Semester {item.semester}</h4></div>
              <p>{item.courseLabels.length} course unit{item.courseLabels.length === 1 ? '' : 's'} · {matchingGroups.length} teaching group{matchingGroups.length === 1 ? '' : 's'}</p>
              <span className="timetable-semester-template-status">{sessionCount > 0 ? sessionCount + ' scheduled session' + (sessionCount === 1 ? '' : 's') : 'Blank template ready'}</span>
              <button className="timetable-action primary" type="button" onClick={() => {
                const yr = String(item.year)
                const sem = String(item.semester)
                const grpId = matchingGroups[0]?.id ?? ''
                setYearOfStudy(yr)
                setCurriculumSemester(sem)
                setTeachingGroupId(grpId)
                setTemplateGroupId(grpId)
                setShowTemplateEditor(true)
                setShowGenerator(false)
                setShowScheduleForm(false)
                if (grpId) {
                  void loadTemplate(grpId, yr, sem)
                } else {
                  setTemplateLoadedGroupId('')
                  setTemplateCells({})
                }
              }}>Open semester template</button>
            </article>
          })}
        </div>}
    </section>}

    {!readOnly && (showGenerator || showTemplateEditor || showScheduleForm) && <section className="timetable-form-panel timetable-curriculum-guide" aria-label="Programme curriculum selection">
      <h3>Programme curriculum guide</h3>
      <div className="timetable-form-grid">
        <label>Programme<select value={programmeId} onChange={event => { const next = event.target.value; setProgrammeId(next); const nextSourceIds = programmeSourceIds.get(next) ?? [next]; setCurriculumId(options.curricula.find(item => nextSourceIds.includes(item.programmeId))?.id ?? ''); setYearOfStudy(''); setCurriculumSemester(''); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">Select programme</option>{deduplicatedProgrammes.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Curriculum<select value={selectedCurriculum?.id ?? ''} onChange={event => { setCurriculumId(event.target.value); setYearOfStudy(''); setCurriculumSemester(''); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">Select curriculum</option>{programmeCurricula.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Year of study<select value={yearOfStudy} onChange={event => { setYearOfStudy(event.target.value); setCurriculumSemester(''); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">All years</option>{studyYears.map(item => <option key={item} value={item}>Year {item}</option>)}</select></label>
        <label>Curriculum semester<select value={curriculumSemester} onChange={event => { setCurriculumSemester(event.target.value); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">All semesters</option>{curriculumSemesters.map(item => <option key={item} value={item}>Semester {item}</option>)}</select></label>
        <label>Academic period<select value={semesterId} onChange={event => { setSemesterId(event.target.value); setTeachingGroupId(''); setTemplateGroupId(''); setTemplateLoadedGroupId(''); }}><option value="">Select academic period</option>{availableSemesters.map(item => <option key={item.id} value={item.id}>{item.academicYearLabel || item.label} · {item.label} · {semesterDateRange(item)}{item.isCurrent ? ' (Current)' : ''}</option>)}</select></label>
      </div>
      <p className="timetable-generator-help">{eligibleMappings.length} curriculum course unit(s) match this selection. {availableGroups.length} operational teaching group(s) are available for the selected academic period.</p>
      {eligibleMappings.length > 0 && <p className="timetable-generator-help">Course units: {eligibleMappings.map(item => item.courseLabel).join(' · ')}</p>}
      {eligibleMappings.length === 0 && <p className="timetable-day-empty">No course units are mapped to this programme, year and semester. Add them under Curriculum &amp; Courses; unrelated courses will not be shown.</p>}
      {eligibleMappings.length > 0 && availableGroups.length === 0 && <p className="timetable-day-empty">The curriculum has course units, but no active course offerings and teaching groups match this academic period. Set up the offerings and groups before scheduling.</p>}
    </section>}

    {!readOnly && showGenerator && <form className="timetable-form-panel" onSubmit={handleGenerate}>
      <h3>Generate a timetable</h3>
      <div className="timetable-form-grid">
        <label>Teaching group<select value={teachingGroupId} onChange={event => setTeachingGroupId(event.target.value)}><option value="">Generate for multiple classes</option>{availableGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        {!teachingGroupId && <label>Number of timetables<input type="number" min="1" max={Math.max(1, availableGroups.length)} value={timetableCount} onChange={event => setTimetableCount(event.target.value)} required /></label>}
      </div>
      {!teachingGroupId && <p className="timetable-generator-help">Generates one separate timetable for each of the first N teaching groups. Available groups: {availableGroups.length}.</p>}
      <div className="timetable-form-footer">
        <button className="timetable-action primary" type="submit" disabled={loading || availableSemesters.length === 0}>{loading ? 'Generating…' : 'Generate schedule'}</button>
        {availableSemesters.length === 0 && <span className="timetable-day-empty">No academic periods were returned. Create a period under Academic Periods, then reload this screen.</span>}
      </div>
    </form>}

    {/* ========================================================================= */}
    {/* REPLACED TIMETABLE TEMPLATE EDITOR WITH OFFICIAL KSHS HORIZONTAL SHEET    */}
    {/* ========================================================================= */}
    {!readOnly && showTemplateEditor && (
      <section className="kshs-workspace" aria-label="Official Teaching Timetable Sheet Editor">
        {/* Top Dark Control Bar */}
        <div className="kshs-toolbar">
          <div className="kshs-toolbar-group">
            <span className="kshs-badge">Official Sheet Editor</span>
            <select
              className="kshs-select"
              aria-label="Class or teaching group"
              value={templateGroupId}
              onChange={e => {
                const nextId = e.target.value
                setTemplateGroupId(nextId)
                setTemplateLoadedGroupId('')
                setTemplateCells({})
                if (nextId) void loadTemplate(nextId)
              }}
            >
              <option value="">-- Select Class / Teaching Group --</option>
              {allSemesterGroups.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <button type="button" className="kshs-btn" onClick={() => void loadTemplate()} disabled={!templateGroupId}>
              Load Class
            </button>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', cursor: 'pointer' }}>
              <input type="checkbox" checked={showWeekends} onChange={e => setShowWeekends(e.target.checked)} />
              <span>Sat &amp; Sun</span>
            </label>
          </div>

          <div className="kshs-toolbar-group">
            <button
              type="button"
              className={`kshs-btn ${sheetEditingMode ? 'kshs-btn-amber' : ''}`}
              onClick={() => setSheetEditingMode(v => !v)}
            >
              <Pencil size={14} /> {sheetEditingMode ? 'Editing On' : 'Preview Mode'}
            </button>
            <button type="button" className="kshs-btn" onClick={() => setShowSystemData(v => !v)}>
              System Data ({options.courses.length} Courses · {options.teachers.length} Tutors)
            </button>
            <button type="button" className="kshs-btn" onClick={() => setShowColumnsModal(true)}>
              <Columns size={14} /> Columns &amp; Breaks
            </button>
            <button
              type="button"
              className="kshs-btn kshs-btn-blue"
              onClick={() => void saveTemplate()}
              disabled={!templateGroupId || templateLoadedGroupId !== templateGroupId || templateSaving}
            >
              <Save size={14} /> {templateSaving ? 'Syncing…' : 'Sync & Save to System'}
            </button>
            <button type="button" className="kshs-btn" onClick={printTimetableTemplate} disabled={!institutionLoaded || !institution.isActive}>
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>

        {/* Printable Official Document Viewport */}
        <div className={`kshs-sheet-viewport ${sheetEditingMode ? 'kshs-is-editing' : ''}`}>
          {!templateGroupId || templateLoadedGroupId !== templateGroupId ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#475569' }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>Select a Class / Teaching Group above to load its Official Timetable Sheet</p>
              <p style={{ fontSize: '0.86rem' }}>Course units, tutors, academic periods and curricula are fetched directly from your SMIS database.</p>
            </div>
          ) : (
            <article className="kshs-document-sheet">
              {/* Editable Official Header */}
              <div
                className="kshs-doc-header"
                onClick={() => sheetEditingMode && setShowHeaderModal(true)}
                title={sheetEditingMode ? 'Click to edit School Name, Timetable Title, Academic Year & Semester' : undefined}
              >
                <div className="kshs-doc-line kshs-doc-inst">{templateInstitution}</div>
                <div className="kshs-doc-line kshs-doc-sub">{templateTitle}</div>
                <div className="kshs-doc-line kshs-doc-meta">
                  {templateYearLabel || `ACADEMIC YEAR ${academicYearLabel.toUpperCase()}`}
                </div>
                <div className="kshs-doc-line kshs-doc-meta">
                  {templateSemesterLabel || (yearOfStudy && curriculumSemester ? `YEAR ${yearOfStudy} SEMESTER ${curriculumSemester}` : selectedSemester?.label ?? '')}
                </div>
              </div>

              {/* Horizontal Single-Line-Per-Day Matrix Grid */}
              <div className="kshs-table-wrap">
                <table className="kshs-grid">
                  <thead>
                    <tr>
                      <th
                        className="kshs-col-day"
                        onClick={() => sheetEditingMode && setShowHeaderModal(true)}
                        title={sheetEditingMode ? 'Click to edit corner header' : undefined}
                      >
                        {templateDayLabel || 'DAY'}
                      </th>
                      {sheetColumns.map(col =>
                        col.type === 'divider' ? (
                          <th
                            key={col.id}
                            className="kshs-col-divider"
                            aria-label={col.verticalText || 'BREAK'}
                            onClick={() => sheetEditingMode && setShowColumnsModal(true)}
                            title={sheetEditingMode ? 'Click to configure Break / Lunch dividers' : undefined}
                          >
                            {(col.verticalText || 'B')[0]}
                          </th>
                        ) : (
                          <th
                            key={col.id}
                            className="kshs-col-slot"
                            onClick={() => sheetEditingMode && setShowColumnsModal(true)}
                            title={sheetEditingMode ? 'Click to edit lecture time slots' : undefined}
                          >
                            {formatSlotRange12(col.startTime, col.endTime)}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {visibleSheetDays.map((day, rIdx) => (
                      <tr key={day}>
                        <td className="kshs-day-cell">
                          <div>{shortDays[day] || days[day].toUpperCase()}</div>
                          {sheetEditingMode && (
                            <div className="kshs-row-ctrls">
                              <button
                                type="button"
                                className="kshs-mini-btn"
                                onClick={() => moveTemplateDay(day, -1)}
                                disabled={rIdx === 0}
                                title="Move Day Up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="kshs-mini-btn"
                                onClick={() => moveTemplateDay(day, 1)}
                                disabled={rIdx === visibleSheetDays.length - 1}
                                title="Move Day Down"
                              >
                                ↓
                              </button>
                            </div>
                          )}
                        </td>

                        {sheetColumns.map(col => {
                          if (col.type === 'divider') {
                            if (rIdx === 0) {
                              const letters = (col.verticalText || 'BREAK').slice(1).split('')
                              return (
                                <td
                                  key={col.id}
                                  className="kshs-col-divider"
                                  rowSpan={visibleSheetDays.length}
                                  onClick={() => sheetEditingMode && setShowColumnsModal(true)}
                                >
                                  <div className="kshs-divider-stack">
                                    {letters.map((ch, idx) => (
                                      <span key={idx}>{ch}</span>
                                    ))}
                                  </div>
                                </td>
                              )
                            }
                            return null
                          }

                          const slotIndex = col.slotIndex
                          if (templateCellCovered(day, slotIndex)) return null

                          const key = day + '-' + slotIndex
                          const cell = templateCells[key]
                          const rSpan = Math.max(1, Math.min(visibleSheetDays.length - rIdx, Number(cell?.rowSpan) || 1))
                          const cSpan = Math.max(1, Math.min(templateSlots.length - slotIndex, Number(cell?.colSpan) || 1))
                          const courseName = cell?.courseId ? (courseLabels.get(cell.courseId) ?? '') : ''
                          const tutorName = cell?.teacherId ? (teacherLabels.get(cell.teacherId) ?? '') : ''
                          const hasContent = Boolean(courseName || tutorName || cell?.room || cell?.customTime)
                          const metaLine = [cell?.customTime, cell?.room].filter(Boolean).join(' • ')
                          const isInlineTutorOpen = inlineTutorTarget === key

                          return (
                            <td
                              key={col.id}
                              className="kshs-lecture-cell"
                              rowSpan={rSpan > 1 ? rSpan : undefined}
                              colSpan={cSpan > 1 ? cSpan : undefined}
                              onClick={() => {
                                if (sheetEditingMode) {
                                  setActiveCellModal({ day, slotIndex })
                                }
                              }}
                            >
                              {hasContent ? (
                                <>
                                  <div
                                    className="kshs-cell-course"
                                    title={sheetEditingMode ? 'Click to edit Course Unit' : undefined}
                                  >
                                    {courseName}
                                  </div>

                                  {isInlineTutorOpen && sheetEditingMode ? (
                                    <select
                                      className="kshs-inline-picker"
                                      autoFocus
                                      value={cell?.teacherId ?? ''}
                                      onClick={e => e.stopPropagation()}
                                      onChange={e => {
                                        changeTemplateCell(key, 'teacherId', e.target.value)
                                        setInlineTutorTarget(null)
                                        triggerToast('Tutor updated independently.')
                                      }}
                                      onBlur={() => setInlineTutorTarget(null)}
                                    >
                                      <option value="">-- No Tutor --</option>
                                      {options.teachers.map(t => (
                                        <option key={t.id} value={t.id}>
                                          {t.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div
                                      className="kshs-cell-tutor"
                                      onClick={e => {
                                        if (sheetEditingMode) {
                                          e.stopPropagation()
                                          setInlineTutorTarget(key)
                                        }
                                      }}
                                      title={sheetEditingMode ? 'Click to change Tutor alone' : undefined}
                                    >
                                      {tutorName ? `(${tutorName})` : courseName ? '(+ Assign Tutor)' : ''}
                                    </div>
                                  )}

                                  {metaLine && <div className="kshs-cell-sub">{metaLine}</div>}
                                </>
                              ) : (
                                sheetEditingMode && <span className="kshs-empty-hint">+ Edit</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Blank-Until-Registered Academic Registrar Footer */}
              <footer
                className="kshs-doc-footer"
                onClick={() => sheetEditingMode && setShowRegistrarModal(true)}
                title={sheetEditingMode ? 'Click to configure Academic Registrar signature block' : undefined}
              >
                {!templateRegistrarName.trim() && !templateSecondaryName.trim() ? (
                  sheetEditingMode && (
                    <span className="kshs-empty-hint">
                      No Academic Registrar registered in system (click here to register)
                    </span>
                  )
                ) : (
                  <>
                    {templateRegistrarName.trim() && (
                      <div className="kshs-reg-block">
                        <div className="kshs-sig-line" />
                        <div className="kshs-reg-text">{templateRegistrarRole || 'ACADEMIC REGISTRAR'}</div>
                        <div className="kshs-reg-text">{templateRegistrarName}</div>
                      </div>
                    )}
                    {templateSecondaryName.trim() && (
                      <div className="kshs-reg-block">
                        <div className="kshs-sig-line" />
                        <div className="kshs-reg-text">{templateSecondaryRole}</div>
                        <div className="kshs-reg-text">{templateSecondaryName}</div>
                      </div>
                    )}
                  </>
                )}
              </footer>
            </article>
          )}
        </div>

        {/* Modal 1: Cell Editor (Separate Course Unit & Tutor Pickers from System) */}
        {activeCellModal && modalCellData && (
          <div className="kshs-modal-backdrop" onClick={() => setActiveCellModal(null)}>
            <div className="kshs-modal-card" onClick={e => e.stopPropagation()}>
              <div className="kshs-modal-head">
                <h4>
                  Edit Lecture — {days[activeCellModal.day]} ({formatSlotRange12(
                    templateSlots[activeCellModal.slotIndex]?.startTime ?? '',
                    templateSlots[activeCellModal.slotIndex]?.endTime ?? ''
                  )})
                </h4>
                <button type="button" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setActiveCellModal(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="kshs-modal-body">
                {(() => {
                  const cellKey = activeCellModal.day + '-' + activeCellModal.slotIndex
                  const groupCourseObj = options.teachingGroups.find(g => g.id === templateGroupId)
                  const courseChoices = groupCourseObj
                    ? options.courses.filter(c => c.id === groupCourseObj.courseId || eligibleCourseIds.has(c.id))
                    : availableCourses.length > 0
                      ? availableCourses
                      : options.courses

                  return (
                    <>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem' }} className="kshs-field">
                        <label>1. Course Unit (From System Registry)</label>
                        <select
                          className="kshs-input"
                          value={modalCellData.courseId}
                          onChange={e => changeTemplateCell(cellKey, 'courseId', e.target.value)}
                        >
                          <option value="">-- Select Course Unit --</option>
                          {courseChoices.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem' }} className="kshs-field">
                        <label>2. Tutor / Lecturer (Editable Independently)</label>
                        <select
                          className="kshs-input"
                          value={modalCellData.teacherId}
                          onChange={e => changeTemplateCell(cellKey, 'teacherId', e.target.value)}
                        >
                          <option value="">-- Select Tutor / Lecturer --</option>
                          {options.teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="kshs-grid-2">
                        <div className="kshs-field">
                          <label>Room / Venue (Optional)</label>
                          <input
                            className="kshs-input"
                            value={modalCellData.room}
                            onChange={e => changeTemplateCell(cellKey, 'room', e.target.value)}
                            placeholder="e.g. Hall A / Lab 2"
                          />
                        </div>
                        <div className="kshs-field">
                          <label>Session Type</label>
                          <select
                            className="kshs-input"
                            value={modalCellData.sessionType || 'Lecture'}
                            onChange={e => changeTemplateCell(cellKey, 'sessionType', e.target.value)}
                          >
                            <option>Lecture</option>
                            <option>Practical</option>
                            <option>Tutorial</option>
                            <option>Seminar</option>
                            <option>Examination</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="kshs-grid-2">
                        <div className="kshs-field">
                          <label>Merge Down (Rows)</label>
                          <select
                            className="kshs-input"
                            value={Number(modalCellData.rowSpan) || 1}
                            onChange={e => changeTemplateCell(cellKey, 'rowSpan', Number(e.target.value))}
                          >
                            {[1, 2, 3, 4, 5, 6].map(n => (
                              <option key={n} value={n}>{n} {n === 1 ? 'Row (Normal)' : 'Rows'}</option>
                            ))}
                          </select>
                        </div>
                        <div className="kshs-field">
                          <label>Merge Across (Slots)</label>
                          <select
                            className="kshs-input"
                            value={Number(modalCellData.colSpan) || 1}
                            onChange={e => changeTemplateCell(cellKey, 'colSpan', Number(e.target.value))}
                          >
                            {templateSlots.map((_, idx) => (
                              <option key={idx + 1} value={idx + 1}>{idx + 1} {idx === 0 ? 'Slot (Normal)' : 'Slots'}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="kshs-modal-foot">
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="kshs-mbtn kshs-mbtn-danger"
                    onClick={() => {
                      clearTemplateCell(activeCellModal.day + '-' + activeCellModal.slotIndex)
                      setActiveCellModal(null)
                      triggerToast('Cell cleared.')
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="kshs-mbtn"
                    onClick={() => {
                      setClipboardCell({ ...modalCellData })
                      triggerToast('Cell copied.')
                    }}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="kshs-mbtn"
                    onClick={() => {
                      if (!clipboardCell) {
                        triggerToast('Nothing copied yet.')
                        return
                      }
                      const key = activeCellModal.day + '-' + activeCellModal.slotIndex
                      setTemplateCells(prev => ({
                        ...prev,
                        [key]: { ...clipboardCell, rowSpan: 1, colSpan: 1 },
                      }))
                      triggerToast('Cell pasted.')
                    }}
                  >
                    Paste
                  </button>
                </div>
                <button type="button" className="kshs-mbtn kshs-mbtn-save" onClick={() => setActiveCellModal(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: School & Course Header Editor */}
        {showHeaderModal && (
          <div className="kshs-modal-backdrop" onClick={() => setShowHeaderModal(false)}>
            <div className="kshs-modal-card" onClick={e => e.stopPropagation()}>
              <div className="kshs-modal-head">
                <h4>Edit School &amp; Course Header</h4>
                <button type="button" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowHeaderModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="kshs-modal-body">
                <div className="kshs-field">
                  <label>School / Institution Name</label>
                  <input className="kshs-input" value={templateInstitution} onChange={e => setTemplateInstitution(e.target.value)} />
                </div>
                <div className="kshs-field">
                  <label>Timetable Title &amp; Course</label>
                  <input className="kshs-input" value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} />
                </div>
                <div className="kshs-grid-2">
                  <div className="kshs-field">
                    <label>Academic Year Line</label>
                    <input className="kshs-input" value={templateYearLabel} onChange={e => setTemplateYearLabel(e.target.value)} />
                  </div>
                  <div className="kshs-field">
                    <label>Semester / Class Line</label>
                    <input className="kshs-input" value={templateSemesterLabel} onChange={e => setTemplateSemesterLabel(e.target.value)} />
                  </div>
                </div>
                <div className="kshs-field">
                  <label>Top-Left Corner Label</label>
                  <input className="kshs-input" value={templateDayLabel} onChange={e => setTemplateDayLabel(e.target.value)} />
                </div>
              </div>
              <div className="kshs-modal-foot">
                <div style={{ marginLeft: 'auto' }}>
                  <button type="button" className="kshs-mbtn kshs-mbtn-save" onClick={() => setShowHeaderModal(false)}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal 3: Columns & Vertical Break/Lunch Dividers */}
        {showColumnsModal && (
          <div className="kshs-modal-backdrop" onClick={() => setShowColumnsModal(false)}>
            <div className="kshs-modal-card" onClick={e => e.stopPropagation()}>
              <div className="kshs-modal-head">
                <h4>Manage Time Columns &amp; Vertical Dividers</h4>
                <button type="button" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowColumnsModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="kshs-modal-body">
                {templateSlots.map((slot, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, width: 58, color: '#475569' }}>SLOT {idx + 1}</span>
                    <input
                      type="time"
                      className="kshs-input"
                      value={slot.startTime}
                      onChange={e => setTemplateSlots(prev => prev.map((s, i) => (i === idx ? { ...s, startTime: e.target.value } : s)))}
                    />
                    <span>–</span>
                    <input
                      type="time"
                      className="kshs-input"
                      value={slot.endTime}
                      onChange={e => setTemplateSlots(prev => prev.map((s, i) => (i === idx ? { ...s, endTime: e.target.value } : s)))}
                    />
                    <button type="button" className="kshs-mbtn" style={{ padding: '0.35rem 0.5rem' }} onClick={() => moveTemplateSlot(idx, -1)} disabled={idx === 0}>←</button>
                    <button type="button" className="kshs-mbtn" style={{ padding: '0.35rem 0.5rem' }} onClick={() => moveTemplateSlot(idx, 1)} disabled={idx === templateSlots.length - 1}>→</button>
                    <button type="button" className="kshs-mbtn kshs-mbtn-danger" style={{ padding: '0.35rem 0.5rem' }} onClick={() => removeTemplateSlot(idx)} disabled={templateSlots.length <= 1}>×</button>
                  </div>
                ))}
                <button
                  type="button"
                  className="kshs-mbtn"
                  onClick={() => setTemplateSlots(prev => [...prev, { startTime: '16:30', endTime: '18:00' }])}
                >
                  + Add Lecture Time Slot
                </button>

                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

                <div className="kshs-grid-2">
                  <div className="kshs-field">
                    <label htmlFor="vertical-break-column-after">Vertical Break Column After</label>
                    <select
                      id="vertical-break-column-after"
                      className="kshs-input"
                      value={templateBreakAfter ?? ''}
                      onChange={e => setTemplateBreakAfter(e.target.value === '' ? null : Number(e.target.value))}
                    >
                      <option value="">None</option>
                      {templateSlots.map((_, idx) => (
                        <option key={idx} value={idx}>After Slot {idx + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="kshs-field">
                    <label htmlFor="break-label">Break Label</label>
                    <input id="break-label" className="kshs-input" value={templateBreakLabel} onChange={e => setTemplateBreakLabel(e.target.value)} />
                  </div>
                </div>

                <div className="kshs-grid-2">
                  <div className="kshs-field">
                    <label htmlFor="vertical-lunch-column-after">Vertical Lunch Column After</label>
                    <select
                      id="vertical-lunch-column-after"
                      className="kshs-input"
                      value={templateLunchAfter ?? ''}
                      onChange={e => setTemplateLunchAfter(e.target.value === '' ? null : Number(e.target.value))}
                    >
                      <option value="">None</option>
                      {templateSlots.map((_, idx) => (
                        <option key={idx} value={idx}>After Slot {idx + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="kshs-field">
                    <label htmlFor="lunch-label">Lunch Label</label>
                    <input id="lunch-label" className="kshs-input" value={templateLunchLabel} onChange={e => setTemplateLunchLabel(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="kshs-modal-foot">
                <div style={{ marginLeft: 'auto' }}>
                  <button type="button" className="kshs-mbtn kshs-mbtn-save" onClick={() => setShowColumnsModal(false)}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal 4: Academic Registrar Footer Configuration */}
        {showRegistrarModal && (
          <div className="kshs-modal-backdrop" onClick={() => setShowRegistrarModal(false)}>
            <div className="kshs-modal-card" onClick={e => e.stopPropagation()}>
              <div className="kshs-modal-head">
                <h4>Academic Registrar Signature Block</h4>
                <button type="button" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowRegistrarModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="kshs-modal-body">
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>
                  Leave the Academic Registrar name blank to keep the footer completely empty.
                </p>
                <div className="kshs-field">
                  <label>Academic Registrar Full Name</label>
                  <input
                    className="kshs-input"
                    value={templateRegistrarName}
                    onChange={e => setTemplateRegistrarName(e.target.value)}
                    placeholder="Leave blank for empty footer"
                  />
                </div>
                <div className="kshs-field">
                  <label>Official Title</label>
                  <input
                    className="kshs-input"
                    value={templateRegistrarRole}
                    onChange={e => setTemplateRegistrarRole(e.target.value)}
                  />
                </div>
                <div className="kshs-grid-2">
                  <div className="kshs-field">
                    <label>Secondary Signatory (Optional)</label>
                    <input
                      className="kshs-input"
                      value={templateSecondaryName}
                      onChange={e => setTemplateSecondaryName(e.target.value)}
                    />
                  </div>
                  <div className="kshs-field">
                    <label>Secondary Title (Optional)</label>
                    <input
                      className="kshs-input"
                      value={templateSecondaryRole}
                      onChange={e => setTemplateSecondaryRole(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="kshs-modal-foot">
                <button
                  type="button"
                  className="kshs-mbtn kshs-mbtn-danger"
                  onClick={() => {
                    setTemplateRegistrarName('')
                    setTemplateSecondaryName('')
                    setShowRegistrarModal(false)
                  }}
                >
                  Clear / Blank
                </button>
                <button type="button" className="kshs-mbtn kshs-mbtn-save" onClick={() => setShowRegistrarModal(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    )}

    {!readOnly && showScheduleForm && <form className="timetable-form-panel" onSubmit={submit}>
      <h3>{editingEntryId ? 'Edit teaching session' : 'Schedule a teaching session'}</h3>
      <div className="timetable-form-grid">
        <label>Teaching group<select value={teachingGroupId} onChange={event => { const next = event.target.value; setTeachingGroupId(next); setCourseId(options.teachingGroups.find(item => item.id === next)?.courseId ?? ''); }} required><option value="">Select group</option>{availableGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Course<select value={courseId} onChange={event => setCourseId(event.target.value)} required><option value="">Select course</option>{selectedGroupCourses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Teacher / staff<select value={teacherId} onChange={event => setTeacherId(event.target.value)} required><option value="">Select teacher</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Day<select value={dayOfWeek} onChange={event => setDayOfWeek(event.target.value)}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
        <label>Start time<input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} required /></label>
        <label>End time<input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} required /></label>
        <label>Room / venue<input value={room} onChange={event => setRoom(event.target.value)} maxLength={100} /></label>
        <label>Session type<select value={sessionType} onChange={event => setSessionType(event.target.value)}><option>Lecture</option><option>Practical</option><option>Tutorial</option><option>Seminar</option><option>Examination</option><option>Other</option></select></label>
      </div>
      <div className="timetable-form-footer">
        <button className="timetable-action primary" type="submit" disabled={loading || !options.teachingGroups.length || !options.courses.length || !options.teachers.length}>{loading ? 'Saving…' : editingEntryId ? 'Update session' : 'Save session'}</button>
        <button className="timetable-action" type="button" onClick={() => { setShowScheduleForm(false); setEditingEntryId(null); }}>Cancel</button>
        {(!options.teachingGroups.length || !options.courses.length || !options.teachers.length) && <span className="timetable-day-empty">Add teaching groups, courses and staff before scheduling.</span>}
      </div>
    </form>}

    {generatedTimetables.length > 0 && <section className="timetable-generated-list" aria-live="polite">
      <div className="timetable-generated-heading"><h3>Generated class timetables</h3><span>{generatedTimetables.length} timetable{generatedTimetables.length === 1 ? '' : 's'}</span></div>
      {generatedTimetables.map(({ groupId, groupLabel, result }) => {
        const classEntries = [...result.entries].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
        const classTimeSlots = [...new Set(classEntries.map(entry => entry.startTime))].sort((a, b) => a.localeCompare(b))
        return <article className="timetable-class-document" key={groupId}>
          <div className="timetable-class-document-heading"><div className="timetable-class-document-identity"><p>REPUBLIC OF UGANDA</p><h4>{institutionLoaded && institution.isActive ? institution.institutionName : 'Institution settings loading…'}</h4><strong>{selectedProgramme?.label ?? 'Programme'} · {groupLabel}</strong><span>ACADEMIC YEAR {academicYearLabel} · {selectedSemester?.label ?? 'Selected academic period'} · YEAR {yearOfStudy} · CURRICULUM SEMESTER {curriculumSemester}</span><span>VALID FOR: {semesterDateRange(selectedSemester)}</span></div>
            <div className="timetable-class-actions">
              <button className="timetable-action" type="button" onClick={() => downloadInstitutionalPdf(timetablePdfOptions(groupLabel + ' Teaching Timetable', classEntries, groupLabel + '-timetable'))} disabled={!institutionLoaded || !institution.isActive}>Download PDF</button>
              <button className="timetable-action" type="button" onClick={() => printGeneratedTimetable(groupId)} disabled={!institutionLoaded || !institution.isActive}>Print</button>
            </div>
          </div>
          <p className="timetable-class-status">Score: {result.optimizationScore.toFixed(1)}% · {result.isConflictFree ? 'No conflicts reported' : 'Conflicts detected'}</p>
          {result.conflicts.length > 0 && <p className="timetable-class-warning">Conflicts: {result.conflicts.join('; ')}</p>}
          {result.warnings.length > 0 && <p className="timetable-class-warning">Warnings: {result.warnings.join('; ')}</p>}
          {classEntries.length === 0 ? <p className="timetable-day-empty">No sessions were generated for this class.</p> : <div className="timetable-grid-scroll">
            <table className="timetable-formal-grid timetable-class-grid">
              <thead><tr><th className="timetable-day-column">DAY</th>{classTimeSlots.map((slot, index) => {
                const period = classEntries.find(entry => entry.startTime === slot)
                return <th key={slot}><span className="timetable-period-label">PERIOD {index + 1}</span><strong>{timeLabel(slot)}–{period ? timeLabel(period.endTime) : ''}</strong></th>
              })}</tr></thead>
              <tbody>{displayedWeekDays.map(dayIndex => <tr key={dayIndex}>
                <th className="timetable-day-column">{days[dayIndex].toUpperCase()}</th>
                {classTimeSlots.map(slot => {
                  const cellEntries = classEntries.filter(entry => entry.dayOfWeek === dayIndex && entry.startTime === slot)
                  return <td key={slot} className={cellEntries.length ? 'has-session' : 'empty-session'}>
                    {cellEntries.map(entry => <article className="timetable-grid-session" key={entry.id}>
                      <strong>{courseLabels.get(entry.courseId) ?? 'Course not found'}</strong>
                      <span>{teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}</span>
                      <span className="timetable-grid-time">{timeRange(entry)}</span>
                      {entry.room && <span>Venue: {entry.room}</span>}
                      {entry.sessionType && <span>{entry.sessionType}</span>}
                    </article>)}
                    {cellEntries.length === 0 && <span className="timetable-grid-dash">—</span>}
                  </td>
                })}
              </tr>)}</tbody>
            </table>
          </div>}
        </article>
      })}
    </section>}

    {generatedResult && <section className="timetable-result" aria-live="polite">
      <h3>Generation result</h3>
      <p><strong>Optimization score:</strong> {generatedResult.optimizationScore.toFixed(1)}%</p>
      <p><strong>Conflict status:</strong> {generatedResult.isConflictFree ? 'No conflicts reported' : 'Conflicts detected'}</p>
      {generatedResult.conflicts.length > 0 && <div><strong>Conflicts</strong><ul>{generatedResult.conflicts.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
      {generatedResult.warnings.length > 0 && <div><strong>Warnings</strong><ul>{generatedResult.warnings.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
      {generatedResult.unscheduled.length > 0 && <div><strong>Unscheduled</strong><ul>{generatedResult.unscheduled.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
    </section>}

    <div className="timetable-toolbar">
      <h3>Weekly schedule <span>({activeEntries.length})</span></h3>
      <div className="timetable-toolbar-controls">
        <label className="timetable-weekend-toggle"><input type="checkbox" checked={showWeekends} onChange={event => setShowWeekends(event.target.checked)} /> Show Saturday</label>
        {!readOnly && <button className="timetable-action" type="button" aria-expanded={showSystemData} onClick={() => setShowSystemData(value => !value)}>{showSystemData ? 'Hide system data' : 'System Data & Sync'}</button>}
        <div className="timetable-view-switch" role="group" aria-label="Schedule display">
          <button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}><LayoutGrid /> Week</button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><List /> List</button>
        </div>
      </div>
    </div>

    {showSystemData && !readOnly && <section className="timetable-system-data" aria-label="System data and sync">
      <div className="timetable-system-data-heading"><div><h3>System Data &amp; SMIS Bridge</h3><p>Live catalogue records supplied by the central SMIS APIs. Changes made in Curriculum &amp; Courses, Staff and Academic Periods appear here after refresh.</p></div><button className="timetable-action primary" type="button" onClick={() => { setLoading(true); void load().finally(() => setLoading(false)) }} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh system data'}</button></div>
      <div className="timetable-system-data-grid">
        <article><strong>{options.programmes.length}</strong><span>Programmes</span><small>{options.programmes.slice(0, 5).map(item => item.label).join(' · ') || 'No programmes returned'}</small></article>
        <article><strong>{options.curricula.length}</strong><span>Curricula</span><small>{options.curricula.slice(0, 5).map(item => item.label).join(' · ') || 'No curricula returned'}</small></article>
        <article><strong>{options.courses.length}</strong><span>Course units</span><small>{options.courses.slice(0, 5).map(item => item.label).join(' · ') || 'No course units returned'}</small></article>
        <article><strong>{options.teachers.length}</strong><span>Staff / tutors</span><small>{options.teachers.slice(0, 5).map(item => item.label).join(' · ') || 'No staff returned'}</small></article>
        <article><strong>{options.teachingGroups.length}</strong><span>Teaching groups</span><small>{options.teachingGroups.slice(0, 5).map(item => item.label).join(' · ') || 'No teaching groups returned'}</small></article>
        <article><strong>{options.semesters.length}</strong><span>Academic periods</span><small>{options.semesters.slice(0, 5).map(item => item.label).join(' · ') || 'No academic periods returned'}</small></article>
      </div>
      <p className="timetable-system-data-footnote">This screen does not keep a separate local programme, course or tutor registry. The central database remains the source of truth.</p>
    </section>}

    {loading && activeEntries.length === 0 ? <div className="timetable-empty"><LoadingSpinner label="Loading timetable…" /></div> : activeEntries.length === 0 ? <div className="timetable-empty"><CalendarDays size={26} /><strong>No sessions scheduled yet</strong><span>Schedule or generate sessions to populate the formal weekly timetable.</span></div> : view === 'week' ? <div className="timetable-print-area">
      <div className="timetable-document-heading">
        <div className="timetable-document-mark">{institutionLoaded && institution.isActive ? institution.abbreviation || 'SMIS' : 'SMIS'}</div>
        <h3>{institutionLoaded && institution.isActive ? institution.institutionName : 'Institution settings loading…'}</h3>
        <p>TEACHING TIMETABLE</p>
        <small>ACADEMIC YEAR {academicYearLabel} · {selectedSemester?.label ?? 'Academic period not selected'} · VALID FOR {semesterDateRange(selectedSemester)}</small>
      </div>
      <div className="timetable-grid-scroll">
        <table className="timetable-formal-grid">
          <thead><tr><th className="timetable-day-column">DAY</th>{timeSlots.map((slot, index) => <th key={slot}><span className="timetable-period-label">PERIOD {index + 1}</span><strong>{timeLabel(slot)}</strong><span>START TIME</span></th>)}</tr></thead>
          <tbody>{displayedWeekDays.map(dayIndex => <tr key={dayIndex}>
            <th className="timetable-day-column">{days[dayIndex].toUpperCase()}</th>
            {timeSlots.map(slot => {
              const cellEntries = orderedEntries.filter(entry => entry.dayOfWeek === dayIndex && entry.startTime === slot)
              return <td key={slot} className={cellEntries.length ? 'has-session' : 'empty-session'}>
                {cellEntries.map(entry => <article className="timetable-grid-session" key={entry.id}>
                  <strong>{courseLabels.get(entry.courseId) ?? 'Course not found'}</strong>
                  <span>{teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}</span>
                  <span className="timetable-grid-time">{timeRange(entry)}</span>
                  {entry.room && <span>Venue: {entry.room}</span>}
                  {entry.sessionType && <span>{entry.sessionType}</span>}
                  {!readOnly && (
                    <>
                      <button className="timetable-action" type="button" onClick={() => void editEntry(entry)}><Pencil size={12} /> Edit</button>
                      <button className="timetable-action" type="button" onClick={() => void remove(entry.id)}><Trash2 size={12} /> Remove</button>
                    </>
                  )}
                </article>)}
                {cellEntries.length === 0 && <span className="timetable-grid-dash">—</span>}
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
      <div className="timetable-document-footer"><span>Prepared for academic use</span><span>Academic Registrar: ____________________</span></div>
      <div className="timetable-document-print-actions"><button type="button" className="timetable-action" onClick={() => printInstitutionalPdf(timetablePdfOptions((availableSemesters.find(item => item.id === semesterId)?.label ?? 'Academic') + ' Timetable', orderedEntries, 'school-timetable'))} disabled={!institutionLoaded || !institution.isActive}>Print timetable</button></div>
    </div> : <div className="timetable-table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Room</th><th>Type</th><th>Teaching group</th><th>Course</th><th>Teacher</th>{!readOnly && <th>Actions</th>}</tr></thead><tbody>
      {orderedEntries.map(entry => <tr key={entry.id}><td>{days[entry.dayOfWeek] ?? '—'}</td><td>{timeRange(entry)}</td><td>{entry.room || '—'}</td><td>{entry.sessionType || '—'}</td><td>{groupLabels.get(entry.teachingGroupId) ?? 'Group not found'}</td><td>{courseLabels.get(entry.courseId) ?? 'Course not found'}</td><td>{teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}</td>{!readOnly && <td><button className="timetable-action" type="button" onClick={() => void editEntry(entry)}><Pencil size={14} /> Edit</button><button className="timetable-action" type="button" onClick={() => void remove(entry.id)}><Trash2 /> Remove</button></td>}</tr>)}
    </tbody></table></div>}
  </section>
}