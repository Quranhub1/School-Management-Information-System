import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, LayoutGrid, List, Plus, Sparkles, Trash2, Pencil, Save } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { createTimetableEntry, deactivateTimetableEntry, generateTimetable, getTimetableOptions, getTimetableTemplate, listTimetable, saveTimetableTemplate, updateTimetableEntry, type CreateTimetableEntry, type GenerateTimetableResult, type TimetableEntry, type TimetableOptions } from '../api/timetable'
import './TimetableManagement.css'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useInstitutionSettings } from './InstitutionSettingsContext'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const emptyOptions: TimetableOptions = { teachingGroups: [], courses: [], teachers: [], semesters: [], programmes: [], curricula: [], curriculumCourses: [] }

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
const defaultTemplateSlots = [{ startTime: '08:00', endTime: '09:00' }, { startTime: '09:00', endTime: '10:00' }, { startTime: '10:30', endTime: '11:30' }, { startTime: '11:30', endTime: '12:30' }, { startTime: '13:30', endTime: '14:30' }, { startTime: '14:30', endTime: '15:30' }, { startTime: '15:30', endTime: '16:30' }]
type TemplateCell = { id?: string; courseId: string; teacherId: string; room: string; sessionType: string; rowSpan?: number | string; colSpan?: number | string }
const timeLabel = (value: string) => value.slice(0, 5)
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
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [templateGroupId, setTemplateGroupId] = useState('')
  const [templateLoadedGroupId, setTemplateLoadedGroupId] = useState('')
  const [templateSlots, setTemplateSlots] = useState(defaultTemplateSlots)
  const [templateCells, setTemplateCells] = useState<Record<string, TemplateCell>>({})
  const [templateTitle, setTemplateTitle] = useState('CLASS TEACHING TIMETABLE')
  const [templateDayLabel, setTemplateDayLabel] = useState('DAY')
  const [templateRegistrarName, setTemplateRegistrarName] = useState('')
  const [templateRegistrarRole, setTemplateRegistrarRole] = useState('ACADEMIC REGISTRAR')
  const [templateFooterText, setTemplateFooterText] = useState('Prepared for academic use')
  const [templateBreakAfter, setTemplateBreakAfter] = useState<number | null>(null)
  const [templateBreakLabel, setTemplateBreakLabel] = useState('BREAK')
  const [templateDayOrder, setTemplateDayOrder] = useState([1, 2, 3, 4, 5, 6, 0])
  const [templateSaving, setTemplateSaving] = useState(false)
  const [activeTemplateCellKey, setActiveTemplateCellKey] = useState<string | null>(null)
  const { institution, loaded: institutionLoaded } = useInstitutionSettings()

  const load = useCallback(async () => {
    setError('')
    try {
      const [loadedEntries, loadedOptions] = await Promise.all([listTimetable(), getTimetableOptions()])
      setEntries(loadedEntries)
      setOptions({ ...emptyOptions, ...loadedOptions, programmes: loadedOptions.programmes ?? [], curricula: loadedOptions.curricula ?? [], curriculumCourses: loadedOptions.curriculumCourses ?? [] })
      setSemesterId(current => current || loadedOptions.semesters.find(item => item.isCurrent)?.id || loadedOptions.semesters.find(item => item.isActive)?.id || loadedOptions.semesters[0]?.id || '')
      const uniqueProgrammes = deduplicateProgrammeOptions(loadedOptions.programmes ?? [], loadedOptions.curricula ?? [], loadedOptions.teachingGroups ?? [])
      setProgrammeId(current => current || uniqueProgrammes[0]?.id || '')
      setCurriculumId(current => current || loadedOptions.curricula.find(item => uniqueProgrammes[0]?.sourceIds.includes(item.programmeId))?.id || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load timetable data.')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void load().finally(() => setLoading(false))
  }, [load])

  const groupLabels = useMemo(() => new Map(options.teachingGroups.map(item => [item.id, item.label])), [options.teachingGroups])
  const courseLabels = useMemo(() => new Map(options.courses.map(item => [item.id, item.label])), [options.courses])
  const teacherLabels = useMemo(() => new Map(options.teachers.map(item => [item.id, item.label])), [options.teachers])
  const availableSemesters = options.semesters
  const selectedSemester = availableSemesters.find(item => item.id === semesterId)
  const academicYearLabel = selectedSemester?.academicYearLabel || selectedSemester?.label || 'Academic year not set'
  const programmeOptions = useMemo(() => deduplicateProgrammeOptions(options.programmes, options.curricula, options.teachingGroups), [options.programmes, options.curricula, options.teachingGroups])
  const selectedProgramme = programmeOptions.find(item => item.id === programmeId)
  const selectedProgrammeIds = new Set(selectedProgramme?.sourceIds ?? (programmeId ? [programmeId] : []))
  const semesterGroupIds = useMemo(() => new Set(options.teachingGroups.filter(item => item.semesterId === semesterId).map(item => item.id)), [options.teachingGroups, semesterId])
  const programmeCurricula = options.curricula.filter(item => selectedProgrammeIds.has(item.programmeId))
  const selectedCurriculum = programmeCurricula.find(item => item.id === curriculumId) ?? programmeCurricula[0]
  const curriculumMappings = options.curriculumCourses.filter(item => item.curriculumId === selectedCurriculum?.id)
  // Each distinct year/semester in an active curriculum is represented as its own
  // timetable template for the selected academic period, even before sessions exist.
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
  const availableGroups = options.teachingGroups.filter(item => item.programmeId === selectedCurriculum?.programmeId && item.semesterId === semesterId && eligibleCourseIds.has(item.courseId))
  const selectedGroup = options.teachingGroups.find(item => item.id === teachingGroupId)
  const selectedGroupCourses = selectedGroup ? options.courses.filter(item => item.id === selectedGroup.courseId && eligibleCourseIds.has(item.id)) : []
  const activeEntries = useMemo(() => entries.filter(item => item.isActive && semesterGroupIds.has(item.teachingGroupId)), [entries, semesterGroupIds])
  const distinctGroups = useMemo(() => new Set(activeEntries.map(item => item.teachingGroupId)).size, [activeEntries])
  const distinctTeachers = useMemo(() => new Set(activeEntries.map(item => item.teacherId)).size, [activeEntries])
  const practicalCount = useMemo(() => activeEntries.filter(item => item.sessionType?.toLowerCase() === 'practical').length, [activeEntries])
  const orderedEntries = useMemo(() => [...activeEntries].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)), [activeEntries])
  const displayedWeekDays = showWeekends ? weekOrder.filter(day => day !== 0) : weekOrder.filter(day => day >= 1 && day <= 5)
  const timeSlots = useMemo(() => [...new Set(activeEntries.map(entry => entry.startTime))].sort((a, b) => a.localeCompare(b)), [activeEntries])

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
      institutionName: institutionLoaded && institution.isActive ? institution.institutionName : undefined,
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
        { text: 'Academic Registrar: ______________________________', alignment: 'right', margin: [0, 28, 0, 0] },
      ],
    }
  }

  function printGeneratedTimetable(groupId: string) {
    const target = generatedTimetables.find(item => item.groupId === groupId)
    if (target) printInstitutionalPdf(timetablePdfOptions(target.groupLabel + ' Teaching Timetable', target.result.entries, target.groupLabel + '-timetable'))
  }

  function printTimetableTemplate() {
    const visibleDays = templateDayOrder.filter(day => showWeekends || day <= 5)
    const rows = visibleDays.flatMap(day => templateSlots.flatMap((slot, slotIndex) => {
      const cell = templateCells[day + '-' + slotIndex]
      if (!cell?.courseId && !cell?.teacherId && !cell?.room?.trim()) return []
      return [{
        id: day + '-' + slotIndex,
        teachingGroupId: templateGroupId,
        courseId: cell.courseId,
        teacherId: cell.teacherId,
        curriculumId: selectedCurriculum?.id ?? '',
        yearOfStudy: Number(yearOfStudy),
        curriculumSemesterNumber: Number(curriculumSemester),
        dayOfWeek: day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: cell.room,
        sessionType: cell.sessionType,
        isActive: true,
      } as TimetableEntry]
    }))
    const groupLabel = groupLabels.get(templateGroupId) ?? 'Class timetable'
    const base = timetablePdfOptions(templateTitle || groupLabel + ' Timetable Template', rows, groupLabel + '-timetable-template')
    const body = [
      [{ text: templateDayLabel || 'DAY', style: 'tableHeader' }, ...templateSlots.map((slot, index) => ({
        text: [`PERIOD ${index + 1}`, `${timeLabel(slot.startTime)}–${timeLabel(slot.endTime)}`, templateBreakAfter === index ? (templateBreakLabel || 'BREAK') : ''].filter(Boolean).join('\\n'),
        style: 'tableHeader',
      }))],
      ...visibleDays.map(day => {
        const row: Array<Record<string, unknown>> = [{ text: days[day].toUpperCase(), style: 'tableHeader' }]
        templateSlots.forEach((slot, slotIndex) => {
          if (templateCellCovered(day, slotIndex)) { row.push({}); return }
          const cell = templateCells[day + '-' + slotIndex]
          const rowSpan = Math.max(1, Math.min(visibleDays.length - visibleDays.indexOf(day), Number(cell?.rowSpan) || 1))
          const colSpan = Math.max(1, Math.min(templateSlots.length - slotIndex, Number(cell?.colSpan) || 1))
          const text = cell ? [
            courseLabels.get(cell.courseId) ?? '',
            teacherLabels.get(cell.teacherId) ?? '',
            `${timeLabel(slot.startTime)}–${timeLabel(slot.endTime)}`,
            cell.room ? `Venue: ${cell.room}` : '',
            cell.sessionType || '',
          ].filter(Boolean).join('\\n') : '—'
          row.push({ text: text || '—', alignment: 'center', ...(rowSpan > 1 ? { rowSpan } : {}), ...(colSpan > 1 ? { colSpan } : {}) })
        })
        return row
      }),
    ]
    printInstitutionalPdf({
      ...base,
      title: templateTitle || base.title,
      content: [
        base.content[0],
        { table: { headerRows: 1, widths: ['auto', ...templateSlots.map(() => '*')], body }, layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => '#111827',
          vLineColor: () => '#111827',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        } },
        { text: `${templateRegistrarRole || 'ACADEMIC REGISTRAR'}: ${templateRegistrarName || '____________________________'}`, alignment: 'right', margin: [0, 28, 0, 0] },
        { text: templateFooterText, alignment: 'left', fontSize: 8, margin: [0, 10, 0, 0] },
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
        const result = await generateTimetable(semesterId, group.id, selectedCurriculum.id, Number(yearOfStudy), Number(curriculumSemester), group.programmeId)
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
    setProgrammeId(programmeOptions.find(item => item.sourceIds.includes(group?.programmeId ?? ''))?.id ?? group?.programmeId ?? '')
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

  async function loadTemplate() {
    if (!selectedCurriculum || !yearOfStudy || !curriculumSemester) { setError('Select a curriculum, year of study and curriculum semester before loading the template.'); return }
    if (!templateGroupId || !availableGroups.some(item => item.id === templateGroupId)) { setError('Choose a teaching group from the selected programme curriculum and academic period.'); return }
    setError('')
    try {
      const saved = await getTimetableTemplate(templateGroupId)
      if (saved.layoutJson) {
        const layout = JSON.parse(saved.layoutJson) as { slots?: Array<{ startTime: string; endTime: string }>; cells?: Record<string, TemplateCell>; showWeekends?: boolean; title?: string; dayLabel?: string; registrarName?: string; registrarRole?: string; footerText?: string; breakAfter?: number | null; breakLabel?: string; dayOrder?: number[] }
        if (Array.isArray(layout.slots) && layout.slots.length > 0 && layout.cells && typeof layout.cells === 'object') {
          setTemplateSlots(layout.slots.map(slot => ({ startTime: slot.startTime, endTime: slot.endTime })))
          setTemplateCells(layout.cells)
          // The official timetable always opens with the complete seven-day week, including for older saved layouts.
          setShowWeekends(true)
          setTemplateTitle(layout.title || 'CLASS TEACHING TIMETABLE')
          setTemplateDayLabel(layout.dayLabel || 'DAY')
          setTemplateRegistrarName(layout.registrarName || '')
          setTemplateRegistrarRole(layout.registrarRole || 'ACADEMIC REGISTRAR')
          setTemplateFooterText(layout.footerText || 'Prepared for academic use')
          setTemplateBreakAfter(typeof layout.breakAfter === 'number' ? layout.breakAfter : null)
          setTemplateBreakLabel(layout.breakLabel || 'BREAK')
          const savedDayOrder = Array.isArray(layout.dayOrder) && layout.dayOrder.length ? layout.dayOrder : [1, 2, 3, 4, 5, 6, 0]
          setTemplateDayOrder([...savedDayOrder, ...[1, 2, 3, 4, 5, 6, 0].filter(day => !savedDayOrder.includes(day))])
          setTemplateLoadedGroupId(templateGroupId)
          setShowTemplateEditor(true)
          return
        }
      }

      // Backward-compatible fallback for groups that have lessons but no saved layout yet.
      const groupEntries = activeEntries.filter(entry => entry.teachingGroupId === templateGroupId)
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
        cells[key] = { id: entry.id, courseId: entry.courseId, teacherId: entry.teacherId, room: entry.room ?? '', sessionType: entry.sessionType ?? 'Lecture' }
      }
      setTemplateSlots(slots)
      setTemplateCells(cells)
      setTemplateTitle('CLASS TEACHING TIMETABLE')
      setTemplateDayLabel('DAY')
      setTemplateRegistrarName('')
      setTemplateRegistrarRole('ACADEMIC REGISTRAR')
      setTemplateFooterText('Prepared for academic use')
      setTemplateBreakAfter(null)
      setTemplateBreakLabel('BREAK')
      setTemplateDayOrder([1, 2, 3, 4, 5, 6, 0])
      setTemplateLoadedGroupId(templateGroupId)
      setShowTemplateEditor(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the saved timetable template.')
    }
  }

  function changeTemplateCell(key: string, field: keyof TemplateCell, value: string) {
    setTemplateCells(current => ({ ...current, [key]: { ...(current[key] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture', rowSpan: 1, colSpan: 1 }), [field]: value } }))
  }

  async function saveTemplate() {
    if (!selectedCurriculum || !yearOfStudy || !curriculumSemester) { setError('Select a curriculum, year of study and curriculum semester before saving the template.'); return }
    if (!templateGroupId || templateLoadedGroupId !== templateGroupId) { setError('Choose a class and load it into the template before saving.'); return }
    const coveredPopulated = Object.entries(templateCells).filter(([key, cell]) => { const [day, slot] = key.split('-').map(Number); return (cell.courseId || cell.teacherId) && templateCellCovered(day, slot) })
    if (coveredPopulated.length) { setError('A merged cell covers another populated lesson. Move or clear the covered lesson before saving so no scheduled session is lost.'); return }
    const populated = Object.entries(templateCells).filter(([key, cell]) => { const [day, slot] = key.split('-').map(Number); return (cell.courseId || cell.teacherId) && !templateCellCovered(day, slot) })
    if (templateSlots.some(slot => !slot.startTime || !slot.endTime || slot.endTime <= slot.startTime)) { setError('Every period must have an end time later than its start time.'); return }
    if (populated.some(([, cell]) => !cell.courseId || !cell.teacherId)) { setError('Every filled timetable cell needs both a course and a teacher.'); return }

    const entries: CreateTimetableEntry[] = populated.map(([key, cell]) => {
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
      await saveTimetableTemplate(templateGroupId, entries, { slots: templateSlots, cells: templateCells, showWeekends, title: templateTitle, dayLabel: templateDayLabel, registrarName: templateRegistrarName, registrarRole: templateRegistrarRole, footerText: templateFooterText, breakAfter: templateBreakAfter, breakLabel: templateBreakLabel, dayOrder: templateDayOrder })
      await load()
      setShowTemplateEditor(false)
      setTemplateCells({})
      setTemplateLoadedGroupId('')
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
    setTemplateBreakAfter(current => current === null ? null : order.indexOf(current) >= 0 ? order.indexOf(current) : null)
  }

  function removeTemplateSlot(index: number) {
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
    const visibleDays = templateDayOrder.filter(item => showWeekends || item <= 5)
    const rowIndex = visibleDays.indexOf(day)
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

  return <section className="timetable-screen">
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
            const matchingGroups = options.teachingGroups.filter(group => group.programmeId === selectedCurriculum?.programmeId && group.semesterId === semesterId && courseIds.has(group.courseId))
            const sessionCount = activeEntries.filter(entry => matchingGroups.some(group => group.id === entry.teachingGroupId)).length
            const selected = yearOfStudy === String(item.year) && curriculumSemester === String(item.semester)
            return <article className={`timetable-semester-template-card${selected ? ' is-selected' : ''}`} key={item.year + '-' + item.semester}>
              <div><span className="timetable-semester-template-kicker">YEAR {item.year}</span><h4>Semester {item.semester}</h4></div>
              <p>{item.courseLabels.length} course unit{item.courseLabels.length === 1 ? '' : 's'} · {matchingGroups.length} teaching group{matchingGroups.length === 1 ? '' : 's'}</p>
              <span className="timetable-semester-template-status">{sessionCount > 0 ? sessionCount + ' scheduled session' + (sessionCount === 1 ? '' : 's') : 'Blank template ready'}</span>
              <button className="timetable-action primary" type="button" onClick={() => {
                setYearOfStudy(String(item.year))
                setCurriculumSemester(String(item.semester))
                setTeachingGroupId(matchingGroups[0]?.id ?? '')
                setTemplateGroupId(matchingGroups[0]?.id ?? '')
                setTemplateLoadedGroupId('')
                setTemplateCells({})
                setShowTemplateEditor(true)
                setShowGenerator(false)
                setShowScheduleForm(false)
              }}>Open semester template</button>
            </article>
          })}
        </div>}
    </section>}

    {!readOnly && (showGenerator || showTemplateEditor || showScheduleForm) && <section className="timetable-form-panel timetable-curriculum-guide" aria-label="Programme curriculum selection">
      <h3>Programme curriculum guide</h3>
      <div className="timetable-form-grid">
        <label>Programme<select value={programmeId} onChange={event => { const next = event.target.value; setProgrammeId(next); setCurriculumId(options.curricula.find(item => programmeOptions.find(option => option.id === next)?.sourceIds.includes(item.programmeId))?.id ?? ''); setYearOfStudy(''); setCurriculumSemester(''); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">Select programme</option>{programmeOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
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

    {!readOnly && showTemplateEditor && <section className="timetable-template-editor" aria-label="Editable timetable template">
      <div className="timetable-template-document-heading">
        <div className="timetable-official-identity">
          {institutionLoaded && institution.isActive && institution.logoPath && <img className="timetable-institution-logo" src={institution.logoPath} alt={institution.institutionName + ' logo'} />}
          <div className="timetable-official-identity-copy">
            <p className="timetable-country-line">REPUBLIC OF UGANDA</p>
            <h3>{institutionLoaded && institution.isActive ? institution.institutionName : 'Institution settings loading…'}</h3>
            {institutionLoaded && institution.isActive && institution.motto && <p className="timetable-institution-motto">{institution.motto}</p>}
            {institutionLoaded && institution.isActive && <p className="timetable-institution-contact">{[institution.address, institution.phone, institution.email, institution.website].filter(value => Boolean(value?.trim())).join(' · ')}</p>}
          </div>
        </div>
        <div className="timetable-official-rule" />
        <input className="timetable-document-title-input" aria-label="Timetable document title" value={templateTitle} onChange={event => setTemplateTitle(event.target.value)} />
        <strong className="timetable-document-programme">{selectedProgramme?.label ?? 'Programme not selected'}{selectedCurriculum ? ' · ' + selectedCurriculum.label : ''}</strong>
        <span className="timetable-document-period">ACADEMIC YEAR {academicYearLabel} · {selectedSemester?.label ?? 'Academic period not selected'} · YEAR {yearOfStudy || '—'} · CURRICULUM SEMESTER {curriculumSemester || '—'}</span>
        <span className="timetable-document-period">VALID FOR {semesterDateRange(selectedSemester)}{templateGroupId ? ' · ' + (groupLabels.get(templateGroupId) ?? 'Selected class') : ''}</span>
      </div>
      <div className="timetable-document-meta-editor">
        <label>Day column heading<input value={templateDayLabel} onChange={event => setTemplateDayLabel(event.target.value)} maxLength={20}/></label>
        <label>Registrar name<input value={templateRegistrarName} onChange={event => setTemplateRegistrarName(event.target.value)} placeholder="Name (optional)" maxLength={120}/></label>
        <label>Registrar title<input value={templateRegistrarRole} onChange={event => setTemplateRegistrarRole(event.target.value)} maxLength={80}/></label>
        <label>Footer text<input value={templateFooterText} onChange={event => setTemplateFooterText(event.target.value)} maxLength={160}/></label>
      </div>
      <div className="timetable-template-editor-heading">
        <div><p className="timetable-eyebrow">Fillable timetable template</p><h3>Edit the timetable grid</h3><p>All teaching days are shown together. Click any period to assign or update its course, lecturer and venue.</p></div>
        <div className="timetable-template-controls">
          <label>Class / teaching group<select value={templateGroupId} onChange={event => { setTemplateGroupId(event.target.value); setTemplateLoadedGroupId(''); setTemplateCells({}); setTemplateSlots(defaultTemplateSlots) }}><option value="">Select class</option>{availableGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <button className="timetable-action" type="button" onClick={loadTemplate} disabled={!templateGroupId}><Pencil size={15}/> Load class</button>
        </div>
      </div>
      {templateGroupId && templateLoadedGroupId === templateGroupId && <div className="timetable-grid-scroll">
        <table className="timetable-editable-grid">
          <thead><tr><th>{templateDayLabel || 'DAY'}</th>{templateSlots.map((slot, index) => <th key={index} className={templateBreakAfter === index ? 'timetable-break-after' : ''}><span>PERIOD {index + 1}</span>{templateBreakAfter === index && <span className="timetable-break-label">{templateBreakLabel || 'BREAK'}</span>}<label>From<input aria-label={`Period ${index + 1} start time`} type="time" value={slot.startTime} onChange={event => setTemplateSlots(current => current.map((item, slotIndex) => slotIndex === index ? { ...item, startTime: event.target.value } : item))}/></label><label>To<input aria-label={`Period ${index + 1} end time`} type="time" value={slot.endTime} onChange={event => setTemplateSlots(current => current.map((item, slotIndex) => slotIndex === index ? { ...item, endTime: event.target.value } : item))}/></label><div className="timetable-period-tools"><button type="button" onClick={() => moveTemplateSlot(index, -1)} disabled={index === 0} aria-label={`Move period ${index + 1} left`}>←</button><button type="button" onClick={() => moveTemplateSlot(index, 1)} disabled={index === templateSlots.length - 1} aria-label={`Move period ${index + 1} right`}>→</button><button type="button" onClick={() => removeTemplateSlot(index)} disabled={templateSlots.length <= 1} aria-label={`Remove period ${index + 1}`}>−</button></div></th>)}</tr></thead>
          <tbody>{templateDayOrder.filter(day => showWeekends || day <= 5).map((day, rowIndex) => <tr key={day}><th><div className="timetable-day-tools"><button type="button" onClick={() => moveTemplateDay(day, -1)} disabled={rowIndex === 0} aria-label={`Move ${days[day]} up`}>↑</button><button type="button" onClick={() => moveTemplateDay(day, 1)} disabled={rowIndex === templateDayOrder.filter(item => showWeekends || item <= 5).length - 1} aria-label={`Move ${days[day]} down`}>↓</button></div>{days[day].toUpperCase()}</th>{templateSlots.map((slot, slotIndex) => {
            if (templateCellCovered(day, slotIndex)) return null
            const key = day + '-' + slotIndex
            const cell = templateCells[key] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture', rowSpan: 1, colSpan: 1 }
            const rowSpan = Math.max(1, Math.min(templateDayOrder.filter(item => showWeekends || item <= 5).length - rowIndex, Number(cell.rowSpan) || 1))
            const colSpan = Math.max(1, Math.min(templateSlots.length - slotIndex, Number(cell.colSpan) || 1))
            return <td key={slotIndex} rowSpan={rowSpan} colSpan={colSpan} className={templateBreakAfter === slotIndex ? 'timetable-break-after' : ''}>
              <button type="button" className="timetable-template-cell-trigger" onClick={() => setActiveTemplateCellKey(key)} aria-label={'Edit ' + days[day] + ' ' + timeLabel(slot.startTime) + ' period'}>
                {cell.courseId || cell.teacherId || cell.room ? <>{cell.courseId && <strong>{courseLabels.get(cell.courseId) ?? 'Course'}</strong>}{cell.teacherId && <span>{teacherLabels.get(cell.teacherId) ?? 'Lecturer'}</span>}{cell.room && <small>{cell.room}</small>}<small>{cell.sessionType}</small></> : <span className="timetable-template-cell-empty">+ Add session</span>}
                {cell.id && <small className="timetable-template-existing">Saved session</small>}
                <span className="timetable-template-cell-edit"><Pencil size={12}/> Edit period</span>
              </button>
            </td>
          })}</tr>)}</tbody>
        </table>
      </div>}
      {templateGroupId && templateLoadedGroupId !== templateGroupId && <p className="timetable-generator-help">Click “Load class” to fill the template with that class’s saved sessions before editing.</p>}
      {activeTemplateCellKey && (() => {
        const [dayValue, slotValue] = activeTemplateCellKey.split('-').map(Number)
        const slot = templateSlots[slotValue]
        const cell = templateCells[activeTemplateCellKey] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture', rowSpan: 1, colSpan: 1 }
        if (!slot) return null
        return <div className="timetable-cell-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setActiveTemplateCellKey(null) }}>
          <section className="timetable-cell-modal" role="dialog" aria-modal="true" aria-labelledby="timetable-cell-modal-title">
            <header><div><h3 id="timetable-cell-modal-title">Edit timetable period</h3><p>{days[dayValue]} · {timeLabel(slot.startTime)}–{timeLabel(slot.endTime)}</p></div><button type="button" aria-label="Close period editor" onClick={() => setActiveTemplateCellKey(null)}>×</button></header>
            <div className="timetable-cell-modal-fields">
              <label>Course unit<select aria-label="Course unit" value={cell.courseId} onChange={event => changeTemplateCell(activeTemplateCellKey, 'courseId', event.target.value)}><option value="">— Select course —</option>{availableCourses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
              <label>Lecturer / teacher<select aria-label="Lecturer / teacher" value={cell.teacherId} onChange={event => changeTemplateCell(activeTemplateCellKey, 'teacherId', event.target.value)}><option value="">— Select lecturer —</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
              <label>Room / venue<input aria-label="Room / venue" value={cell.room} onChange={event => changeTemplateCell(activeTemplateCellKey, 'room', event.target.value)} placeholder="Enter room or laboratory"/></label>
              <label>Session type<select aria-label="Session type" value={cell.sessionType} onChange={event => changeTemplateCell(activeTemplateCellKey, 'sessionType', event.target.value)}><option>Lecture</option><option>Practical</option><option>Tutorial</option><option>Seminar</option><option>Examination</option><option>Other</option></select></label>
              <label>Merge down (days)<select aria-label="Merge down (days)" value={Number(cell.rowSpan) || 1} onChange={event => changeTemplateCell(activeTemplateCellKey, 'rowSpan', event.target.value)}>{[1,2,3,4,5,6].slice(0, templateDayOrder.filter(item => showWeekends || item <= 5).length - templateDayOrder.filter(item => showWeekends || item <= 5).indexOf(dayValue)).map(value => <option key={value} value={value}>{value} day(s)</option>)}</select></label>
              <label>Merge across periods<select aria-label="Merge across periods" value={Number(cell.colSpan) || 1} onChange={event => changeTemplateCell(activeTemplateCellKey, 'colSpan', event.target.value)}>{[1,2,3,4,5,6,7].slice(0, templateSlots.length - slotValue).map(value => <option key={value} value={value}>{value} period(s)</option>)}</select></label>
            </div>
            <footer><button type="button" className="timetable-cell-clear" onClick={() => { changeTemplateCell(activeTemplateCellKey, 'courseId', ''); changeTemplateCell(activeTemplateCellKey, 'teacherId', ''); changeTemplateCell(activeTemplateCellKey, 'room', ''); changeTemplateCell(activeTemplateCellKey, 'sessionType', 'Lecture'); changeTemplateCell(activeTemplateCellKey, 'rowSpan', '1'); changeTemplateCell(activeTemplateCellKey, 'colSpan', '1') }}>Clear period</button><button type="button" className="timetable-cell-done" onClick={() => setActiveTemplateCellKey(null)}>Done</button></footer>
          </section>
        </div>
      })()}
      <div className="timetable-template-design-tools">
        <label>Divider after period<select value={templateBreakAfter ?? ''} onChange={event => setTemplateBreakAfter(event.target.value === '' ? null : Number(event.target.value))}><option value="">No divider</option>{templateSlots.map((_, index) => <option key={index} value={index}>After period {index + 1}</option>)}</select></label>
        <label>Break label<input value={templateBreakLabel} onChange={event => setTemplateBreakLabel(event.target.value)} maxLength={30}/></label>
        <button type="button" className="timetable-action" onClick={() => setTemplateSlots(current => [...current, { startTime: '16:30', endTime: '17:30' }])}>+ Add period</button>
      </div>
      <div className="timetable-template-document-footer"><span>{templateFooterText}</span><div><div className="timetable-signature-line"></div><strong>{templateRegistrarName || '____________________________'}</strong><small>{templateRegistrarRole || 'ACADEMIC REGISTRAR'}</small></div></div>
      <div className="timetable-form-footer"><button className="timetable-action primary" type="button" onClick={() => void saveTemplate()} disabled={!templateGroupId || templateLoadedGroupId !== templateGroupId || templateSaving || !availableCourses.length || !options.teachers.length}><Save size={15}/>{templateSaving ? 'Saving template…' : 'Save timetable template'}</button><button className="timetable-action" type="button" onClick={printTimetableTemplate} disabled={!institutionLoaded || !institution.isActive}>Print template</button></div>
    </section>}

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
          <div className="timetable-class-document-heading"><div className="timetable-class-document-identity"><div className="timetable-official-identity">{institutionLoaded && institution.isActive && institution.logoPath && <img className="timetable-institution-logo" src={institution.logoPath} alt={institution.institutionName + ' logo'} />}<div className="timetable-official-identity-copy"><h4>{institutionLoaded && institution.isActive ? institution.institutionName : 'Institution settings loading…'}</h4>{institutionLoaded && institution.isActive && institution.motto && <span className="timetable-institution-motto">{institution.motto}</span>}{institutionLoaded && institution.isActive && <span className="timetable-institution-contact">{[institution.address, institution.phone, institution.email].filter(value => Boolean(value?.trim())).join(' · ')}</span>}</div></div><strong>{selectedProgramme?.label ?? 'Programme'} · {groupLabel}</strong><span>ACADEMIC YEAR {academicYearLabel} · {selectedSemester?.label ?? 'Selected academic period'} · YEAR {yearOfStudy} · CURRICULUM SEMESTER {curriculumSemester}</span><span>VALID FOR: {semesterDateRange(selectedSemester)}</span></div>
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
        <label className="timetable-weekend-toggle"><input type="checkbox" checked={showWeekends} onChange={event => setShowWeekends(event.target.checked)} /> Show weekend days (Saturday & Sunday)</label>
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
        <div className="timetable-official-identity">
          {institutionLoaded && institution.isActive && institution.logoPath ? <img className="timetable-institution-logo" src={institution.logoPath} alt={institution.institutionName + ' logo'} /> : <div className="timetable-document-mark">{institutionLoaded && institution.isActive ? institution.abbreviation || 'SMIS' : 'SMIS'}</div>}
          <div className="timetable-official-identity-copy">
                <h3>{institutionLoaded && institution.isActive ? institution.institutionName : 'Institution settings loading…'}</h3>
            {institutionLoaded && institution.isActive && institution.motto && <span className="timetable-institution-motto">{institution.motto}</span>}
            {institutionLoaded && institution.isActive && <span className="timetable-institution-contact">{[institution.address, institution.phone, institution.email].filter(value => Boolean(value?.trim())).join(' · ')}</span>}
          </div>
        </div>
        <div className="timetable-official-rule" />
        <p>TEACHING TIMETABLE</p>
        <strong className="timetable-document-programme">{selectedProgramme?.label ?? 'All programmes'}</strong>
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
                  <span>{groupLabels.get(entry.teachingGroupId) ?? 'Teaching group'}</span>
                  <span>{teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}</span>
                  <span className="timetable-grid-time">{timeRange(entry)}</span>
                  {entry.room && <span>Venue: {entry.room}</span>}
                  {!readOnly && (
                    <>
                      <button className="timetable-event-remove" type="button" onClick={() => void editEntry(entry)}><Pencil size={12} /> Edit</button>
                      <button className="timetable-event-remove" type="button" onClick={() => void remove(entry.id)}><Trash2 size={12} /> Remove</button>
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
