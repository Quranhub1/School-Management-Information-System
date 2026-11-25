import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, CalendarDays, Clock3, FileText, LayoutGrid, List, Plus, RefreshCw, Search, Sparkles, Trash2, Pencil, Save } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import {
  createTimetableEntry,
  deactivateTimetableEntry,
  generateTimetable,
  getTimetableOptions,
  getTimetableTemplate,
  listTimetable,
  listSavedTimetableTemplates,
  saveTimetableTemplate,
  updateTimetableEntry,
  type CreateTimetableEntry,
  type GenerateTimetableResult,
  type TimetableEntry,
  type TimetableOptions,
  type SavedTimetableTemplate,
} from '../api/timetable'
import './TimetableManagement.css'
import { deriveTimetableSelection, filterTutorsForCourse } from './timetableSelection'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useInstitutionSettings } from './InstitutionSettingsContext'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const emptyOptions: TimetableOptions = {
  teachingGroups: [],
  courses: [],
  teachers: [],
  semesters: [],
  programmes: [],
  curricula: [],
  curriculumCourses: [],
}

type ProgrammeOption = TimetableOptions['programmes'][number] & { sourceIds: string[] }

// The catalogue can contain legacy and imported records for the same visible
// programme under different IDs/codes. Group by the normalized programme name
// and retain every source ID so curricula and teaching groups remain selectable.
const programmeIdentity = (programme: TimetableOptions['programmes'][number]) =>
  programme.label.trim().replace(/\s+/g, ' ').toLocaleLowerCase() ||
  programme.code?.trim().toLocaleUpperCase() || programme.id

const compactCurriculumLabel = (label: string, programmeLabel?: string, fallbackIndex = 0) => {
  const programmeName = programmeLabel?.split(' (')[0].trim()
  let compact = label.trim()
  if (programmeName) {
    const programmeIndex = compact.toLocaleLowerCase().indexOf(programmeName.toLocaleLowerCase())
    if (programmeIndex >= 0) {
      compact = compact.slice(0, programmeIndex) + compact.slice(programmeIndex + programmeName.length)
    }
  }
  compact = compact.trim().replace(/^[-–—:|]+\s*/, '').replace(/\s+/g, ' ')
  if (!compact || compact.toLocaleLowerCase() === 'curriculum') return `Curriculum ${fallbackIndex + 1}`
  if (/^\d{4}$/.test(compact)) compact = `${compact} Curriculum`
  else if (/^alternate record$/i.test(compact)) compact = 'Alternate curriculum'
  else if (/^curriculum\b/i.test(compact)) compact = compact.replace(/^curriculum\s*/i, 'Curriculum ')
  return compact.length > 36 ? `${compact.slice(0, 33).trimEnd()}…` : compact
}

const deduplicateProgrammeOptions = (
  programmes: TimetableOptions['programmes'],
  curricula: TimetableOptions['curricula'],
  groups: TimetableOptions['teachingGroups']
): ProgrammeOption[] => {
  const grouped = new Map<string, TimetableOptions['programmes']>()
  for (const programme of programmes) {
    const key = programmeIdentity(programme)
    grouped.set(key, [...(grouped.get(key) ?? []), programme])
  }
  return [...grouped.values()]
    .map(items => {
      const ranked = [...items].sort((left, right) => {
        const score = (item: TimetableOptions['programmes'][number]) =>
          curricula.filter(curriculum => curriculum.programmeId === item.id).length * 10 +
          groups.filter(group => group.programmeId === item.id).length
        return score(right) - score(left) || left.label.localeCompare(right.label)
      })
      return {
        ...ranked[0],
        durationYears: Math.max(0, ...items.map(item => Number(item.durationYears) || 0)),
        sourceIds: items.map(item => item.id),
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label))
}

const defaultTemplateSlots = [
  { startTime: '08:00', endTime: '09:00' },
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:30', endTime: '11:30' },
  { startTime: '11:30', endTime: '12:30' },
  { startTime: '13:30', endTime: '14:30' },
  { startTime: '14:30', endTime: '15:30' },
  { startTime: '15:30', endTime: '16:30' },
]

type TemplateCell = {
  id?: string
  courseId: string
  teacherId: string
  room: string
  sessionType: string
  rowSpan?: number | string
  colSpan?: number | string
}

type SavedTimetablePreview = {
  slots: Array<{ startTime: string; endTime: string }>
  cells: Record<string, TemplateCell>
  title?: string
  dayLabel?: string
  showWeekends?: boolean
  breakAfter?: number | null
  breakLabel?: string
  dayOrder?: number[]
}

const timeLabel = (value: string) => value.slice(0, 5)

const formatSemesterDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value.slice(0, 10) + 'T00:00:00')
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const semesterDateRange = (semester?: TimetableOptions['semesters'][number]) =>
  semester?.startDate && semester?.endDate
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
  const [selectedCourseUnitId, setSelectedCourseUnitId] = useState('')
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
  const [selectedTeachingGroupIds, setSelectedTeachingGroupIds] = useState<string[]>([])
  const [generatedTimetables, setGeneratedTimetables] = useState<
    Array<{ groupId: string; groupLabel: string; result: GenerateTimetableResult }>
  >([])
  const [view, setView] = useState<'week' | 'list'>('week')
  const [showWeekends, setShowWeekends] = useState(true)
  const [showSystemData, setShowSystemData] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(true)
  const [showSavedTemplates, setShowSavedTemplates] = useState(false)
  const [openedSavedTemplate, setOpenedSavedTemplate] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<SavedTimetableTemplate[]>([])
  const [savedTemplatePreviews, setSavedTemplatePreviews] = useState<Record<string, SavedTimetablePreview>>({})
  const [savedTemplatesLoading, setSavedTemplatesLoading] = useState(false)
  const [savedTemplatesError, setSavedTemplatesError] = useState('')
  const [savedTemplateSearch, setSavedTemplateSearch] = useState('')
  const [savedTemplateProgrammeFilter, setSavedTemplateProgrammeFilter] = useState('')
  const [savedTemplateSemesterFilter, setSavedTemplateSemesterFilter] = useState('')
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
      setOptions({
        ...emptyOptions,
        ...loadedOptions,
        programmes: loadedOptions.programmes ?? [],
        curricula: loadedOptions.curricula ?? [],
        curriculumCourses: loadedOptions.curriculumCourses ?? [],
      })
      const preferredPeriodId =
        loadedOptions.semesters.find(item => item.isCurrent)?.id ||
        loadedOptions.semesters.find(item => item.isActive)?.id ||
        loadedOptions.semesters[0]?.id ||
        ''
      setSemesterId(current => current || preferredPeriodId)
      const uniqueProgrammes = deduplicateProgrammeOptions(
        loadedOptions.programmes ?? [],
        loadedOptions.curricula ?? [],
        loadedOptions.teachingGroups ?? []
      )
      const preferredProgramme = uniqueProgrammes[0]
      const preferredCurriculum = loadedOptions.curricula.find(item =>
        preferredProgramme?.sourceIds.includes(item.programmeId)
      )
      const preferredMappings = loadedOptions.curriculumCourses.filter(
        item => item.curriculumId === preferredCurriculum?.id
      )
      const preferredMapping =
        preferredMappings.find(item =>
          loadedOptions.teachingGroups.some(group =>
            group.isProgrammeYearClass &&
            group.programmeId === preferredCurriculum?.programmeId &&
            group.curriculumId === preferredCurriculum?.id &&
            group.semesterId === preferredPeriodId &&
            group.yearOfStudy === item.yearOfStudy &&
            group.semesterNumber === item.semesterNumber &&
            item.yearOfStudy === group.yearOfStudy &&
            item.semesterNumber === group.semesterNumber
          )
        ) ?? preferredMappings[0]
      const preferredGroup = loadedOptions.teachingGroups.find(
        item => item.isProgrammeYearClass &&
          item.programmeId === preferredCurriculum?.programmeId &&
          item.curriculumId === preferredCurriculum?.id &&
          item.semesterId === preferredPeriodId &&
          item.yearOfStudy === preferredMapping?.yearOfStudy &&
          item.semesterNumber === preferredMapping?.semesterNumber
      )
      setProgrammeId(current => current || preferredProgramme?.id || '')
      setCurriculumId(current => current || preferredCurriculum?.id || '')
      setYearOfStudy(current => current || (preferredMapping ? String(preferredMapping.yearOfStudy) : ''))
      setSelectedCourseUnitId(current => current || preferredMapping?.courseId || '')
      setCurriculumSemester(current => current || (preferredMapping ? (() => { const prefix = (uniqueProgrammes.find(item => item.sourceIds.includes(preferredCurriculum?.programmeId ?? ''))?.code ?? '').replace(/^(?:UHPAB|UVTAB|KSHS|SB)[-_]/i, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); return prefix ? `${prefix}${preferredMapping.yearOfStudy}${preferredMapping.semesterNumber}` : `Y${preferredMapping.yearOfStudy}S${preferredMapping.semesterNumber}` })() : ''))
      setTemplateGroupId(current => current || preferredGroup?.id || '')
      setTeachingGroupId(current => current || preferredGroup?.id || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load timetable data.')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void load().finally(() => setLoading(false))
  }, [load])

  const groupLabels = useMemo(
    () => new Map(options.teachingGroups.map(item => [item.id, item.label])),
    [options.teachingGroups]
  )
  const courseLabels = useMemo(
    () => new Map(options.courses.map(item => [item.id, item.label.toUpperCase()])),
    [options.courses]
  )
  const teacherLabels = useMemo(
    () => new Map(options.teachers.map(item => [item.id, item.label])),
    [options.teachers]
  )
  const availableSemesters = options.semesters
  const selectedSemester = availableSemesters.find(item => item.id === semesterId)
  const academicYearLabel =
    selectedSemester?.academicYearLabel || selectedSemester?.label || 'Academic year not set'
  const programmeOptions = useMemo(
    () => deduplicateProgrammeOptions(options.programmes, options.curricula, options.teachingGroups),
    [options.programmes, options.curricula, options.teachingGroups]
  )
  const selectedProgramme = programmeOptions.find(item => item.id === programmeId)
  const selectedProgrammeIds = new Set(
    selectedProgramme?.sourceIds ?? (programmeId ? [programmeId] : [])
  )
  const semesterGroupIds = useMemo(
    () => new Set(options.teachingGroups.filter(item => item.semesterId === semesterId).map(item => item.id)),
    [options.teachingGroups, semesterId]
  )
  const selection = deriveTimetableSelection(
    options,
    [...selectedProgrammeIds],
    curriculumId,
    yearOfStudy,
    curriculumSemester,
    semesterId,
    selectedCourseUnitId
  )
  const programmeCurricula = selection.curricula
  const selectedCurriculum = selection.selectedCurriculum
  const curriculumMappings = options.curriculumCourses.filter(
    item => item.curriculumId === selectedCurriculum?.id
  )

  const semesterTemplates = useMemo(() => {
    const grouped = new Map<
      string,
      { year: number; semester: number; courseIds: Set<string>; courseLabels: string[] }
    >()
    for (const mapping of curriculumMappings) {
      const key = mapping.yearOfStudy + '-' + mapping.semesterNumber
      const current = grouped.get(key) ?? {
        year: mapping.yearOfStudy,
        semester: mapping.semesterNumber,
        courseIds: new Set<string>(),
        courseLabels: [],
      }
      current.courseIds.add(mapping.courseId)
      if (!current.courseLabels.includes(mapping.courseLabel)) {
        current.courseLabels.push(mapping.courseLabel)
      }
      grouped.set(key, current)
    }
    return [...grouped.values()].sort((a, b) => a.year - b.year || a.semester - b.semester)
  }, [curriculumMappings])

  const studyYears = selection.studyYears
  const curriculumSemesters = selection.curriculumSemesters
  const eligibleMappings = curriculumMappings.filter(
    item =>
      (!yearOfStudy || item.yearOfStudy === Number(yearOfStudy)) &&
      (!curriculumSemester || (item.yearOfStudy === selection.selectedCurriculumSemester?.year && item.semesterNumber === selection.selectedCurriculumSemester?.semesterNumber))
  )
  const eligibleCourseIds = new Set(eligibleMappings.map(item => item.courseId))
  const availableCourses = selection.courseUnits
  const availableGroups = selection.allTeachingGroups
  const allAvailableGroups = selection.allTeachingGroups
  const availableTutors = selection.tutors
  const scheduleTutors = filterTutorsForCourse(options.teachers, courseId)
  const selectedGroup = options.teachingGroups.find(item => item.id === teachingGroupId)
  const selectedTemplateGroup = options.teachingGroups.find(item => item.id === templateGroupId)

  const savedTemplateCards = useMemo(() => {
    const search = savedTemplateSearch.trim().toLocaleLowerCase()
    return savedTemplates.map(template => {
      const group = options.teachingGroups.find(item => item.id === template.teachingGroupId)
      const programme = programmeOptions.find(item => item.sourceIds.includes(template.programmeId))
      const curriculum = options.curricula.find(item => item.id === template.curriculumId)
      const semester = options.semesters.find(item => item.id === template.semesterId)
      return {
        ...template,
        groupLabel: group?.label ?? template.teachingGroupLabel,
        programmeLabel: programme?.label ?? 'Programme not available',
        programmeCode: programme?.code ?? '',
        curriculumLabel: curriculum?.label ?? 'Curriculum not available',
        semesterLabel: semester?.label ?? template.semesterLabel,
      }
    }).filter(template => {
      const matchesSearch = !search || [
        template.groupLabel, template.programmeLabel, template.curriculumLabel,
        template.semesterLabel, template.programmeCode,
      ].some(value => value.toLocaleLowerCase().includes(search))
      const matchesProgramme = !savedTemplateProgrammeFilter || (programmeOptions.find(item => item.id === savedTemplateProgrammeFilter)?.sourceIds.includes(template.programmeId) ?? false)
      const matchesSemester = !savedTemplateSemesterFilter || template.semesterId === savedTemplateSemesterFilter
      return matchesSearch && matchesProgramme && matchesSemester
    })
  }, [savedTemplates, options.teachingGroups, options.curricula, options.semesters, programmeOptions, savedTemplateSearch, savedTemplateProgrammeFilter, savedTemplateSemesterFilter])
  // Course-unit choices belong only inside the timetable template. Keep every
  // cell restricted to mappings for the exact selected curriculum, year and semester.
  const templateCourseOptions =
    selectedCurriculum && yearOfStudy
      ? curriculumMappings
          .filter(mapping =>
            mapping.yearOfStudy === Number(yearOfStudy) &&
            (!selection.selectedCurriculumSemester ||
              mapping.semesterNumber === selection.selectedCurriculumSemester.semesterNumber)
          )
          .map(mapping => {
            const course = options.courses.find(item => item.id === mapping.courseId)
            return course ?? { id: mapping.courseId, label: mapping.courseLabel }
          })
          .filter((course, index, all) => all.findIndex(item => item.id === course.id) === index)
      : []
  const selectedGroupCourses = selectedGroup
    ? options.courses.filter(item =>
        eligibleCourseIds.has(item.id) &&
        (selectedGroup.isProgrammeYearClass || item.id === selectedGroup.courseId)
      )
    : []
  const activeEntries = useMemo(
    () => entries.filter(item => item.isActive && semesterGroupIds.has(item.teachingGroupId)),
    [entries, semesterGroupIds]
  )
  const distinctGroups = useMemo(
    () => new Set(activeEntries.map(item => item.teachingGroupId)).size,
    [activeEntries]
  )
  const distinctTeachers = useMemo(
    () => new Set(activeEntries.map(item => item.teacherId)).size,
    [activeEntries]
  )
  const practicalCount = useMemo(
    () => activeEntries.filter(item => item.sessionType?.toLowerCase() === 'practical').length,
    [activeEntries]
  )
  const orderedEntries = useMemo(
    () =>
      [...activeEntries].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
      ),
    [activeEntries]
  )
  const displayedWeekDays = showWeekends
    ? weekOrder.filter(day => day !== 0)
    : weekOrder.filter(day => day >= 1 && day <= 5)
  const timeSlots = useMemo(
    () => [...new Set(activeEntries.map(entry => entry.startTime))].sort((a, b) => a.localeCompare(b)),
    [activeEntries]
  )

  function templatePeriodSpan(slotIndex: number, requestedSpan: number | string = 1) {
    const availablePeriods =
      templateBreakAfter !== null && slotIndex <= templateBreakAfter
        ? templateBreakAfter - slotIndex + 1
        : templateSlots.length - slotIndex
    return Math.max(1, Math.min(availablePeriods, Number(requestedSpan) || 1))
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
        const rowSpan = Math.max(
          1,
          Math.min(visibleDays.length - r, Number(source.rowSpan) || 1)
        )
        const colSpan = templatePeriodSpan(c, source.colSpan)
        if (r + rowSpan > rowIndex && c + colSpan > slotIndex) return true
      }
    }
    return false
  }

  function timetablePdfOptions(title: string, rows: TimetableEntry[], filename: string) {
    const sorted = [...rows].sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
    )
    const slots = [...new Set(sorted.map(entry => entry.startTime))].sort((a, b) =>
      a.localeCompare(b)
    )
    const printableSlots = slots.length ? slots : defaultTemplateSlots.map(slot => slot.startTime)
    const timetableBody = [
      [
        { text: 'DAY', style: 'tableHeader' },
        ...printableSlots.map((slot, index) => ({
          text: `PERIOD ${index + 1}\n${timeLabel(slot)}`,
          style: 'tableHeader',
        })),
      ],
      ...displayedWeekDays.map(day => [
        { text: days[day].toUpperCase(), style: 'tableHeader' },
        ...printableSlots.map(slot => {
          const sessions = sorted.filter(
            entry => entry.dayOfWeek === day && entry.startTime === slot
          )
          const text = sessions
            .map(entry =>
              [
                courseLabels.get(entry.courseId) ?? 'Course not found',
                teacherLabels.get(entry.teacherId) ?? 'Teacher not found',
                timeRange(entry),
                entry.room ? `Venue: ${entry.room}` : '',
                entry.sessionType || '',
              ]
                .filter(Boolean)
                .join('\n')
            )
            .join('\n\n')
          return { text: text || '—', alignment: 'center' }
        }),
      ]),
    ]
    return {
      title,
      filename,
      orientation: 'landscape' as const,
      institutionName:
        institutionLoaded && institution.isActive ? institution.institutionName : undefined,
      motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
      contactLines:
        institutionLoaded && institution.isActive
          ? [institution.address, institution.phone, institution.email].filter(
              (value): value is string => Boolean(value?.trim())
            )
          : [],
      accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
      content: [
        {
          text: `ACADEMIC YEAR ${academicYearLabel} · ${
            selectedSemester?.label ?? 'Academic period'
          } · VALID FOR ${semesterDateRange(selectedSemester)}`,
          alignment: 'center',
          fontSize: 9,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', ...printableSlots.map(() => '*')],
            body: timetableBody,
          },
          layout: {
            hLineWidth: () => 0.8,
            vLineWidth: () => 0.8,
            hLineColor: () => '#111827',
            vLineColor: () => '#111827',
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
        {
          text: 'Academic Registrar: ______________________________',
          alignment: 'right',
          margin: [0, 28, 0, 0],
        },
      ],
    }
  }

  function printGeneratedTimetable(groupId: string) {
    const target = generatedTimetables.find(item => item.groupId === groupId)
    if (target) {
      printInstitutionalPdf(
        timetablePdfOptions(
          target.groupLabel + ' Teaching Timetable',
          target.result.entries,
          target.groupLabel + '-timetable'
        )
      )
    }
  }

  function timetableTemplatePdfOptions() {
    const visibleDays = templateDayOrder.filter(day => showWeekends || day <= 5)
    const rows = visibleDays.flatMap(day =>
      templateSlots.flatMap((slot, slotIndex) => {
        const cell = templateCells[day + '-' + slotIndex]
        if (!cell?.courseId && !cell?.teacherId && !cell?.room?.trim()) return []
        return [
          {
            id: day + '-' + slotIndex,
            teachingGroupId: templateGroupId,
            courseId: cell.courseId,
            teacherId: cell.teacherId,
            curriculumId: selectedCurriculum?.id ?? '',
            yearOfStudy: Number(yearOfStudy),
            curriculumSemesterNumber: (selection.selectedCurriculumSemester?.semesterNumber ?? 0),
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: cell.room,
            sessionType: cell.sessionType,
            isActive: true,
          } as TimetableEntry,
        ]
      })
    )
    const groupLabel = groupLabels.get(templateGroupId) ?? 'Class timetable'
    const base = timetablePdfOptions(
      templateTitle || groupLabel + ' Timetable Template',
      rows,
      groupLabel + '-timetable-template'
    )
    const body = [
      [
        { text: templateDayLabel || 'DAY', style: 'tableHeader' },
        ...templateSlots.flatMap((slot, index) => [
          {
            text: [`PERIOD ${index + 1}`, `${timeLabel(slot.startTime)}–${timeLabel(slot.endTime)}`].join(
              '\n'
            ),
            style: 'tableHeader',
          },
          ...(templateBreakAfter === index
            ? [{ text: (templateBreakLabel || 'BREAK').split('').join('\n'), style: 'tableHeader' }]
            : []),
        ]),
      ],
      ...visibleDays.map((day, dayIndex) => {
        const row: Array<Record<string, unknown>> = [
          { text: days[day].toUpperCase(), style: 'tableHeader' },
        ]
        templateSlots.forEach((slot, slotIndex) => {
          if (templateCellCovered(day, slotIndex)) {
            row.push({})
          } else {
            const cell = templateCells[day + '-' + slotIndex]
            const rowSpan = Math.max(
              1,
              Math.min(visibleDays.length - dayIndex, Number(cell?.rowSpan) || 1)
            )
            const colSpan = templatePeriodSpan(slotIndex, cell?.colSpan)
            const text = cell
              ? [
                  courseLabels.get(cell.courseId) ?? '',
                  teacherLabels.get(cell.teacherId) ?? '',
                  `${timeLabel(slot.startTime)}–${timeLabel(slot.endTime)}`,
                  cell.room ? `Venue: ${cell.room}` : '',
                  cell.sessionType || '',
                ]
                  .filter(Boolean)
                  .join('\n')
              : '—'
            row.push({
              text: text || '—',
              alignment: 'center',
              ...(rowSpan > 1 ? { rowSpan } : {}),
              ...(colSpan > 1 ? { colSpan } : {}),
            })
          }
          if (templateBreakAfter === slotIndex) {
            row.push(
              dayIndex === 0
                ? {
                    text: (templateBreakLabel || 'BREAK').split('').join('\n'),
                    alignment: 'center',
                    bold: true,
                    rowSpan: visibleDays.length,
                  }
                : {}
            )
          }
        })
        return row
      }),
    ]
    return {
      ...base,
      title: templateTitle || base.title,
      content: [
        base.content[0],
        {
          table: {
            headerRows: 1,
            widths: [
              'auto',
              ...templateSlots.flatMap((_, index) =>
                templateBreakAfter === index ? ['*', 14] : ['*']
              ),
            ],
            body,
          },
          layout: {
            hLineWidth: () => 0.8,
            vLineWidth: () => 0.8,
            hLineColor: () => '#111827',
            vLineColor: () => '#111827',
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
        {
          text: `${templateRegistrarRole || 'ACADEMIC REGISTRAR'}: ${
            templateRegistrarName || '____________________________'
          }`,
          alignment: 'right',
          margin: [0, 28, 0, 0],
        },
        { text: templateFooterText, alignment: 'left', fontSize: 8, margin: [0, 10, 0, 0] },
      ],
    }
  }

  function printTimetableTemplate() {
    printInstitutionalPdf(timetableTemplatePdfOptions())
  }

  function downloadTimetableTemplatePdf() {
    downloadInstitutionalPdf(timetableTemplatePdfOptions())
  }

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setGeneratedResult(null)
    setGeneratedTimetables([])
    if (!semesterId || !programmeId || !selectedCurriculum || !yearOfStudy || !curriculumSemester) {
      setError(
        'Select a programme, curriculum, year of study, curriculum semester and academic period first.'
      )
      return
    }
    const selectedGroups = allAvailableGroups.filter(group => selectedTeachingGroupIds.includes(group.id))
    if (selectedGroups.length === 0) {
      setError('Select at least one teaching group to generate its timetable.')
      return
    }
    setLoading(true)
    try {
      const combinedResult = await generateTimetable(
        semesterId,
        selectedGroups.map(group => group.id),
        selectedCurriculum.id,
        Number(yearOfStudy),
        (selection.selectedCurriculumSemester?.semesterNumber ?? 0),
        selectedGroups[0].programmeId
      )
      const results = selectedGroups.map(group => ({
        groupId: group.id,
        groupLabel: group.label,
        result: {
          ...combinedResult,
          entries: combinedResult.entries.filter(entry => entry.teachingGroupId === group.id),
        },
      }))
      setGeneratedTimetables(results)
      setGeneratedResult(combinedResult)
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
    if (
      !teachingGroupId ||
      !courseId ||
      !teacherId ||
      !selectedCurriculum ||
      !yearOfStudy ||
      !curriculumSemester
    ) {
      setError(
        'Select a programme, curriculum, year, semester, teaching group, course unit and teacher.'
      )
      return
    }
    if (
      !eligibleCourseIds.has(courseId) ||
      (!options.teachingGroups.find(item => item.id === teachingGroupId)?.isProgrammeYearClass &&
        options.teachingGroups.find(item => item.id === teachingGroupId)?.courseId !== courseId)
    ) {
      setError(
        'The selected course unit does not belong to this teaching group and curriculum selection.'
      )
      return
    }
    if (endTime <= startTime) {
      setError('End time must be later than start time.')
      return
    }
    setLoading(true)
    try {
      const payload: CreateTimetableEntry = {
        teachingGroupId,
        courseId,
        teacherId,
        curriculumId: selectedCurriculum.id,
        yearOfStudy: Number(yearOfStudy),
        curriculumSemesterNumber: (selection.selectedCurriculumSemester?.semesterNumber ?? 0),
        dayOfWeek: Number(dayOfWeek),
        startTime: startTime + ':00',
        endTime: endTime + ':00',
        room: room.trim() || undefined,
        sessionType: sessionType.trim() || undefined,
      }
      if (editingEntryId) {
        await updateTimetableEntry(editingEntryId, payload)
        setEditingEntryId(null)
      } else {
        await createTimetableEntry(payload)
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
    const mapping = options.curriculumCourses.find(
      item => item.courseId === entry.courseId && item.programmeId === group?.programmeId
    )
    const curriculum = options.curricula.find(item => item.id === mapping?.curriculumId)
    setProgrammeId(
      programmeOptions.find(item => item.sourceIds.includes(group?.programmeId ?? ''))?.id ??
        group?.programmeId ??
        ''
    )
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
    if (!selectedCurriculum || !yearOfStudy || !curriculumSemester) {
      setError(
        'Select a curriculum, year of study and curriculum semester before loading the template.'
      )
      return
    }
    if (!templateGroupId || !availableGroups.some(item => item.id === templateGroupId)) {
      setError(
        'Choose a class from the selected programme and academic period. Its course units are still validated against the selected curriculum when saving.'
      )
      return
    }
    setError('')
    try {
      const saved = await getTimetableTemplate(templateGroupId)
      if (saved.layoutJson) {
        const layout = JSON.parse(saved.layoutJson) as {
          slots?: Array<{ startTime: string; endTime: string }>
          cells?: Record<string, TemplateCell>
          showWeekends?: boolean
          title?: string
          dayLabel?: string
          registrarName?: string
          registrarRole?: string
          footerText?: string
          breakAfter?: number | null
          breakLabel?: string
          dayOrder?: number[]
        }
        if (
          Array.isArray(layout.slots) &&
          layout.slots.length > 0 &&
          layout.cells &&
          typeof layout.cells === 'object'
        ) {
          setTemplateSlots(
            layout.slots.map(slot => ({ startTime: slot.startTime, endTime: slot.endTime }))
          )
          setTemplateCells(layout.cells)
          setShowWeekends(true)
          setTemplateTitle(layout.title || 'CLASS TEACHING TIMETABLE')
          setTemplateDayLabel(layout.dayLabel || 'DAY')
          setTemplateRegistrarName(layout.registrarName || '')
          setTemplateRegistrarRole(layout.registrarRole || 'ACADEMIC REGISTRAR')
          setTemplateFooterText(layout.footerText || 'Prepared for academic use')
          setTemplateBreakAfter(typeof layout.breakAfter === 'number' ? layout.breakAfter : null)
          setTemplateBreakLabel(layout.breakLabel || 'BREAK')
          const savedDayOrder =
            Array.isArray(layout.dayOrder) && layout.dayOrder.length
              ? layout.dayOrder
              : [1, 2, 3, 4, 5, 6, 0]
          setTemplateDayOrder([
            ...savedDayOrder,
            ...[1, 2, 3, 4, 5, 6, 0].filter(day => !savedDayOrder.includes(day)),
          ])
          setTemplateLoadedGroupId(templateGroupId)
          setShowTemplateEditor(true)
          return
        }
      }

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
          setError(
            'This class has multiple sessions at the same day and start time. Resolve the duplicate sessions before editing its template.'
          )
          return
        }
        cells[key] = {
          id: entry.id,
          courseId: entry.courseId,
          teacherId: entry.teacherId,
          room: entry.room ?? '',
          sessionType: entry.sessionType ?? 'Lecture',
        }
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
    setTemplateCells(current => {
      const existing = current[key] ?? {
        courseId: '',
        teacherId: '',
        room: '',
        sessionType: 'Lecture',
        rowSpan: 1,
        colSpan: 1,
      }
      return {
        ...current,
        [key]: {
          ...existing,
          [field]: value,
          ...(field === 'courseId' ? { teacherId: '' } : {}),
        },
      }
    })
  }

  async function saveTemplate() {
    if (!selectedCurriculum || !yearOfStudy || !curriculumSemester) {
      setError(
        'Select a curriculum, year of study and curriculum semester before saving the template.'
      )
      return
    }
    if (!templateGroupId || templateLoadedGroupId !== templateGroupId) {
      setError('Choose a class and load it into the template before saving.')
      return
    }
    const visibleDays = templateDayOrder.filter(day => showWeekends || day <= 5)
    const visibleDaySet = new Set(visibleDays)
    const coveredPopulated = Object.entries(templateCells).filter(([key, cell]) => {
      const [day, slot] = key.split('-').map(Number)
      return visibleDaySet.has(day) && (cell.courseId || cell.teacherId) && templateCellCovered(day, slot)
    })
    if (coveredPopulated.length) {
      setError(
        'A merged cell covers another populated lesson. Move or clear the covered lesson before saving so no scheduled session is lost.'
      )
      return
    }
    const populated = Object.entries(templateCells).filter(([key, cell]) => {
      const [day, slot] = key.split('-').map(Number)
      return visibleDaySet.has(day) && (cell.courseId || cell.teacherId) && !templateCellCovered(day, slot)
    })
    if (
      templateSlots.some(slot => !slot.startTime || !slot.endTime || slot.endTime <= slot.startTime)
    ) {
      setError('Every period must have an end time later than its start time.')
      return
    }
    if (populated.some(([, cell]) => !cell.courseId || !cell.teacherId)) {
      setError('Every filled timetable cell needs both a course and a teacher.')
      return
    }

    const templateEntries: CreateTimetableEntry[] = populated.flatMap(([key, cell]) => {
      const [dayText, slotIndexText] = key.split('-')
      const day = Number(dayText)
      const slotIndex = Number(slotIndexText)
      const slot = templateSlots[slotIndex]
      const periodSpan = templatePeriodSpan(slotIndex, cell.colSpan)
      const lastSlot = templateSlots[slotIndex + periodSpan - 1]
      const dayIndex = visibleDays.indexOf(day)
      const daySpan = Math.max(1, Math.min(visibleDays.length - dayIndex, Number(cell.rowSpan) || 1))
      if (!slot || !lastSlot || dayIndex < 0) return []
      return Array.from({ length: daySpan }, (_, offset) => ({
        teachingGroupId: templateGroupId,
        courseId: cell.courseId,
        teacherId: cell.teacherId,
        curriculumId: selectedCurriculum.id,
        yearOfStudy: Number(yearOfStudy),
        curriculumSemesterNumber: (selection.selectedCurriculumSemester?.semesterNumber ?? 0),
        dayOfWeek: visibleDays[dayIndex + offset],
        startTime: slot.startTime + ':00',
        endTime: lastSlot.endTime + ':00',
        room: cell.room.trim() || undefined,
        sessionType: cell.sessionType || 'Lecture',
      }))
    })

    setTemplateSaving(true)
    setError('')
    try {
      await saveTimetableTemplate(templateGroupId, templateEntries, {
        slots: templateSlots,
        cells: templateCells,
        showWeekends,
        title: templateTitle,
        dayLabel: templateDayLabel,
        registrarName: templateRegistrarName,
        registrarRole: templateRegistrarRole,
        footerText: templateFooterText,
        breakAfter: templateBreakAfter,
        breakLabel: templateBreakLabel,
        dayOrder: templateDayOrder,
      })
      await load()
      setTemplateLoadedGroupId(templateGroupId)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to save the timetable template. No changes were saved.'
      )
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
    setTemplateBreakAfter(current =>
      current === null ? null : order.indexOf(current) >= 0 ? order.indexOf(current) : null
    )
  }

  function removeTemplateSlot(index: number) {
    reorderTemplateSlots(
      templateSlots.map((_, slotIndex) => slotIndex).filter(slotIndex => slotIndex !== index)
    )
  }

  function moveTemplateSlot(index: number, direction: -1 | 1) {
    const order = templateSlots.map((_, slotIndex) => slotIndex)
    const target = index + direction
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    reorderTemplateSlots(order)
  }

  async function refreshSavedTemplates() {
    setSavedTemplatesLoading(true)
    setSavedTemplatesError('')
    try {
      const templates = await listSavedTimetableTemplates()
      setSavedTemplates(templates)
      const previews = await Promise.all(templates.map(async template => {
        try {
          const saved = await getTimetableTemplate(template.teachingGroupId)
          if (!saved.layoutJson) return [template.teachingGroupId, null] as const
          const layout = JSON.parse(saved.layoutJson) as {
            slots?: Array<{ startTime: string; endTime: string }>
            cells?: Record<string, TemplateCell>
            title?: string
            dayLabel?: string
            showWeekends?: boolean
            breakAfter?: number | null
            breakLabel?: string
            dayOrder?: number[]
          }
          if (!Array.isArray(layout.slots) || !layout.cells || typeof layout.cells !== 'object') {
            return [template.teachingGroupId, null] as const
          }
          return [template.teachingGroupId, { slots: layout.slots, cells: layout.cells, title: layout.title, dayLabel: layout.dayLabel, showWeekends: layout.showWeekends, breakAfter: layout.breakAfter, breakLabel: layout.breakLabel, dayOrder: layout.dayOrder }] as const
        } catch {
          return [template.teachingGroupId, null] as const
        }
      }))
      setSavedTemplatePreviews(Object.fromEntries(previews.filter((item): item is readonly [string, SavedTimetablePreview] => item[1] !== null)))
    } catch (e) {
      setSavedTemplatesError(e instanceof Error ? e.message : 'Unable to load saved timetable templates.')
    } finally {
      setSavedTemplatesLoading(false)
    }
  }

  async function openSavedTemplates() {
    setShowSavedTemplates(true)
    setSavedTemplateSearch('')
    setSavedTemplateProgrammeFilter('')
    setSavedTemplateSemesterFilter('')
    await refreshSavedTemplates()
  }

  function openSavedTemplate(template: SavedTimetableTemplate) {
    const group = options.teachingGroups.find(item => item.id === template.teachingGroupId)
    if (!group) {
      setSavedTemplatesError('This saved timetable is no longer linked to an available teaching group.')
      return
    }
    const programme = programmeOptions.find(item => item.sourceIds.includes(template.programmeId))
    const mappedCourse = options.curriculumCourses.find(item =>
      item.programmeId === template.programmeId &&
      item.courseId === group.courseId &&
      item.semesterNumber === group.semesterNumber
    )
    const curriculumId = group.curriculumId ?? mappedCourse?.curriculumId ?? ''
    const year = group.yearOfStudy ?? mappedCourse?.yearOfStudy
    const semesterNumber = group.semesterNumber ?? mappedCourse?.semesterNumber
    if (!curriculumId || !year || !semesterNumber) {
      setSavedTemplatesError('This saved timetable is missing its curriculum-year mapping and cannot be opened safely.')
      return
    }
    const mapping = options.curriculumCourses.find(item =>
      item.curriculumId === curriculumId &&
      item.yearOfStudy === year &&
      item.semesterNumber === semesterNumber
    )
    const prefix = (programme?.code ?? '').replace(/^(?:UHPAB|UVTAB|KSHS|SB)[-_]/i, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const semesterCode = prefix
      ? `${prefix}${year}${semesterNumber}`
      : `Y${year}S${semesterNumber}`

    setSemesterId(template.semesterId)
    setProgrammeId(programme?.id ?? template.programmeId)
    setCurriculumId(curriculumId)
    setYearOfStudy(String(year))
    setCurriculumSemester(semesterCode)
    setSelectedCourseUnitId(mapping?.courseId ?? '')
    setTeachingGroupId(group.id)
    setTemplateGroupId(group.id)
    setTemplateLoadedGroupId('')
    setTemplateCells({})
    setOpenedSavedTemplate(true)
    setShowTemplateEditor(true)
    setShowGenerator(false)
    setShowScheduleForm(false)
    setShowSavedTemplates(false)
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

  useEffect(() => {
    if (!readOnly && templateGroupId && selectedCurriculum && yearOfStudy && curriculumSemester && templateLoadedGroupId !== templateGroupId) {
      void loadTemplate()
    }
  }, [readOnly, templateGroupId, selectedCurriculum?.id, yearOfStudy, curriculumSemester, templateLoadedGroupId])

  const visibleTemplateDays = templateDayOrder.filter(day => showWeekends || day <= 5)

  if (showSavedTemplates) {
    return (
      <section className="timetable-screen timetable-saved-screen" aria-label="Saved timetables">
        <header className="timetable-hero timetable-saved-hero">
          <div className="timetable-saved-heading">
            <button className="timetable-action primary timetable-back-main-button" type="button" onClick={() => { setShowSavedTemplates(false); setOpenedSavedTemplate(false) }}>
              <ArrowLeft /> Back to main
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2>SAVED TIMETABLES</h2>
            </div>
          </div>
          <div className="timetable-actions">
            <button className="timetable-action" type="button" onClick={() => void refreshSavedTemplates()} disabled={savedTemplatesLoading}>
              <RefreshCw className={savedTemplatesLoading ? 'is-spinning' : ''} /> Refresh
            </button>
            <button className="timetable-action primary" type="button" onClick={() => {
              setShowSavedTemplates(false)
              setOpenedSavedTemplate(false)
              setShowTemplateEditor(true)
              setTemplateLoadedGroupId('')
            }}>
              <Plus /> Create timetable
            </button>
          </div>
        </header>

        {savedTemplatesError && <div className="timetable-notice" role="alert">{savedTemplatesError}</div>}

        <section className="timetable-saved-library" aria-label="Saved timetable library">
          <div className="timetable-saved-toolbar">
            <div className="timetable-saved-count">
              <strong>{savedTemplates.length}</strong>
              <span>saved timetable{savedTemplates.length === 1 ? '' : 's'}</span>
              {savedTemplateCards.length !== savedTemplates.length && (
                <span className="timetable-saved-match-count">· {savedTemplateCards.length} shown</span>
              )}
            </div>
            <div className="timetable-saved-filters">
              <label className="timetable-saved-search">
                <span>Search</span>
                <span className="timetable-saved-search-input">
                  <Search />
                  <input aria-label="Search saved timetables" value={savedTemplateSearch} onChange={event => setSavedTemplateSearch(event.target.value)} placeholder="Class, programme or curriculum" />
                </span>
              </label>
              <label>
                <span>Programme</span>
                <select aria-label="Filter by programme" value={savedTemplateProgrammeFilter} onChange={event => setSavedTemplateProgrammeFilter(event.target.value)}>
                  <option value="">All programmes</option>
                  {programmeOptions.map(programme => <option key={programme.id} value={programme.id}>{programme.code ? programme.code + ' — ' : ''}{programme.label}</option>)}
                </select>
              </label>
              <label>
                <span>Academic period</span>
                <select aria-label="Filter by academic period" value={savedTemplateSemesterFilter} onChange={event => setSavedTemplateSemesterFilter(event.target.value)}>
                  <option value="">All periods</option>
                  {options.semesters.map(semester => <option key={semester.id} value={semester.id}>{semester.label} · {semester.academicYearLabel}</option>)}
                </select>
              </label>
            </div>
          </div>

          {savedTemplatesLoading ? (
            <div className="timetable-empty"><LoadingSpinner /><strong>Loading saved timetables…</strong></div>
          ) : savedTemplates.length === 0 ? (
            <div className="timetable-empty">
              <BookOpen size={28} />
              <strong>No saved timetables yet</strong>
              <span>Save a class timetable from the timetable designer to see it here.</span>
              <button className="timetable-action primary" type="button" onClick={() => {
                setShowSavedTemplates(false)
                setShowTemplateEditor(true)
              }}><Plus /> Create timetable</button>
            </div>
          ) : savedTemplateCards.length === 0 ? (
            <div className="timetable-empty">
              <Search size={26} />
              <strong>No matching timetables</strong>
              <span>Change your search or filters to see more results.</span>
              <button className="timetable-action" type="button" onClick={() => { setSavedTemplateSearch(''); setSavedTemplateProgrammeFilter(''); setSavedTemplateSemesterFilter('') }}>Clear filters</button>
            </div>
          ) : (
            <div className="timetable-saved-grid">
              {savedTemplateCards.map(template => (
                <article className="timetable-saved-card" key={template.teachingGroupId}>
                  <div className="timetable-saved-card-top">
                    <span className="timetable-saved-card-icon"><CalendarDays /></span>
                    <span className={template.sessionCount > 0 ? 'timetable-saved-status has-sessions' : 'timetable-saved-status'}>
                      {template.sessionCount > 0 ? 'Schedule saved' : 'Layout only'}
                    </span>
                  </div>
                  {(() => {
                    const preview = savedTemplatePreviews[template.teachingGroupId]
                    const previewDays = (preview?.dayOrder?.length ? preview.dayOrder : [1, 2, 3, 4, 5, 6, 0])
                      .filter(day => preview?.showWeekends !== false || day >= 1 && day <= 5)
                    const covered = (day: number, slotIndex: number) => preview ? previewDays.some((priorDay, dayIndex) => {
                      const priorCell = preview.cells[priorDay + '-' + slotIndex]
                      if (!priorCell || dayIndex >= previewDays.indexOf(day)) return false
                      return dayIndex + Math.max(1, Number(priorCell.rowSpan) || 1) > previewDays.indexOf(day)
                    }) || preview.slots.some((_, priorSlot) => {
                      if (priorSlot >= slotIndex) return false
                      const priorCell = preview.cells[day + '-' + priorSlot]
                      return !!priorCell && priorSlot + Math.max(1, Number(priorCell.colSpan) || 1) > slotIndex
                    }) : false
                    return (
                      <div className="timetable-saved-thumbnail" aria-label={preview ? 'Saved timetable design preview' : 'Timetable thumbnail unavailable'}>
                        {preview ? (
                          <div className="timetable-saved-thumbnail-paper">
                            <div className="timetable-saved-thumbnail-title">{preview.title || 'CLASS TEACHING TIMETABLE'}</div>
                            <table>
                              <thead><tr>
                                <th>{preview.dayLabel || 'DAY'}</th>
                                {preview.slots.map((slot, index) => (
                                  <React.Fragment key={index}>
                                    <th><b>PERIOD {index + 1}</b><span>{timeLabel(slot.startTime)}–{timeLabel(slot.endTime)}</span></th>
                                    {preview.breakAfter === index && <th className="timetable-saved-thumbnail-break">{preview.breakLabel || 'BREAK'}</th>}
                                  </React.Fragment>
                                ))}
                              </tr></thead>
                              <tbody>{previewDays.map(day => (
                                <tr key={day}>
                                  <th>{days[day].toUpperCase()}</th>
                                  {preview.slots.map((slot, slotIndex) => {
                                    if (covered(day, slotIndex)) return null
                                    const cell = preview.cells[day + '-' + slotIndex]
                                    const rowSpan = Math.max(1, Math.min(previewDays.length - previewDays.indexOf(day), Number(cell?.rowSpan) || 1))
                                    const colSpan = Math.max(1, Math.min(preview.slots.length - slotIndex, Number(cell?.colSpan) || 1))
                                    const course = cell ? options.courses.find(item => item.id === cell.courseId) : undefined
                                    return <React.Fragment key={slotIndex}>
                                      <td rowSpan={rowSpan} colSpan={colSpan} className={cell?.courseId ? 'is-filled' : ''}>
                                        {cell?.courseId && <strong>{(course?.label || 'COURSE').toUpperCase()}</strong>}
                                      </td>
                                      {preview.breakAfter === slotIndex && <td className="timetable-saved-thumbnail-break-cell" rowSpan={rowSpan}>{(preview.breakLabel || 'BREAK').split('').join(' ')}</td>}
                                    </React.Fragment>
                                  })}
                                </tr>
                              ))}</tbody>
                            </table>
                            {preview.title && <div className="timetable-saved-thumbnail-footer">{template.semesterLabel}</div>}
                          </div>
                        ) : <span className="timetable-saved-thumbnail-empty">Preview unavailable</span>}
                      </div>
                    )
                  })()}
                  <h3>{template.groupLabel}</h3>
                  <p className="timetable-saved-programme">{template.programmeCode ? template.programmeCode + ' · ' : ''}{template.programmeLabel}</p>
                  <div className="timetable-saved-meta">
                    <span><BookOpen /> {template.curriculumLabel}</span>
                    <span><CalendarDays /> Year {template.yearOfStudy ?? '—'} · {template.semesterLabel}</span>
                    <span><FileText /> {template.sessionCount} scheduled session{template.sessionCount === 1 ? '' : 's'}</span>
                    <span><Clock3 /> Updated {new Date(template.updatedAtUtc).toLocaleString()}</span>
                  </div>
                  <div className="timetable-saved-card-footer">
                    <button className="timetable-action primary timetable-open-saved-button" type="button" onClick={() => openSavedTemplate(template)}>
                      <Pencil /> Open timetable
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    )
  }

  return (
    <section className={readOnly ? 'timetable-screen is-read-only' : 'timetable-screen'}>
      <header className="timetable-hero">
        <div className="timetable-hero-heading">
          <h2>{readOnly ? 'Timetable' : openedSavedTemplate ? 'Saved timetable' : 'Timetable management'}</h2>
          {openedSavedTemplate && (
            <button
              className="timetable-action primary timetable-back-main-button"
              type="button"
              onClick={() => {
                setOpenedSavedTemplate(false)
                setTemplateLoadedGroupId('')
                setTemplateGroupId('')
                setTeachingGroupId('')
                setTemplateCells({})
                setTemplateSlots(defaultTemplateSlots)
              }}
            >
              <ArrowLeft /> Back to main
            </button>
          )}
          {!readOnly && !openedSavedTemplate && (
            <button className="timetable-action primary timetable-saved-entry" type="button" onClick={() => void openSavedTemplates()}>
              <BookOpen /> Saved timetables
            </button>
          )}
        </div>
        <div className="timetable-actions">
          {!readOnly && (
            <button
              className="timetable-action primary"
              type="button"
              onClick={() => setShowGenerator(value => !value)}
              aria-expanded={showGenerator}
            >
              <Sparkles /> {showGenerator ? 'Hide generator' : 'Generate timetable'}
            </button>
          )}
          {!readOnly && (
            <button
              className="timetable-action primary"
              type="button"
              onClick={() => setShowTemplateEditor(value => !value)}
              aria-expanded={showTemplateEditor}
            >
              <Pencil /> {showTemplateEditor ? 'Hide timetable designer' : 'Open timetable designer'}
            </button>
          )}
          {!readOnly && (
            <button
              className="timetable-action primary"
              type="button"
              onClick={() => setShowScheduleForm(value => !value)}
              aria-expanded={showScheduleForm}
            >
              <Plus /> {showScheduleForm ? 'Close form' : 'Schedule session'}
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="timetable-notice" role="alert">
          {error}
        </div>
      )}

      <div className="timetable-metrics" aria-label="Timetable summary">
        <div className="timetable-metric">
          <span>Scheduled sessions</span>
          <strong>{activeEntries.length}</strong>
        </div>
        <div className="timetable-metric">
          <span>Teaching groups</span>
          <strong>{distinctGroups}</strong>
        </div>
        <div className="timetable-metric">
          <span>Assigned teachers</span>
          <strong>{distinctTeachers}</strong>
        </div>
        <div className="timetable-metric">
          <span>Practical sessions</span>
          <strong>{practicalCount}</strong>
        </div>
      </div>

      {!readOnly && !openedSavedTemplate && selectedCurriculum && (
        <section
          className="timetable-semester-templates"
          aria-label="Curriculum semester timetable templates"
        >
          <div className="timetable-semester-templates-heading">
            <div>
              <h3>{selectedCurriculum.label} · Semester templates</h3>
              <span>
                {semesterTemplates.length} separate template
                {semesterTemplates.length === 1 ? '' : 's'} ·{' '}
                {availableSemesters.find(item => item.id === semesterId)?.label ??
                  'Select an academic period'}
              </span>
            </div>
          </div>
          {semesterTemplates.length === 0 ? (
            <p className="timetable-day-empty">
              This active curriculum has no semester course mappings yet. Add course units and
              assign each to a year and semester in Curriculum &amp; Courses; its timetable
              templates will appear here automatically.
            </p>
          ) : (
            <div className="timetable-semester-template-grid">
              {semesterTemplates.map(item => {
                const matchingGroups = options.teachingGroups.filter(
                  group =>
                    group.isProgrammeYearClass &&
                    group.programmeId === selectedCurriculum?.programmeId &&
                    group.curriculumId === selectedCurriculum?.id &&
                    group.yearOfStudy === item.year &&
                    group.semesterNumber === item.semester &&
                    group.semesterId === semesterId
                )
                const matchingCurriculumSemester = selection.curriculumSemesters.find(
                  option => option.year === item.year && option.semesterNumber === item.semester
                )
                const sessionCount = activeEntries.filter(entry =>
                  matchingGroups.some(group => group.id === entry.teachingGroupId)
                ).length
                const selected =
                  yearOfStudy === String(item.year) && curriculumSemester === (selection.curriculumSemesters.find(option => option.year === item.year && option.semesterNumber === item.semester)?.code ?? '')
                return (
                  <article
                    className={`timetable-semester-template-card${selected ? ' is-selected' : ''}`}
                    key={item.year + '-' + item.semester}
                  >
                    <div>
                      <span className="timetable-semester-template-kicker">YEAR {item.year}</span>
                      <h4>Semester {item.semester}</h4>
                    </div>
                    <p>
                      {item.courseLabels.length} course unit
                      {item.courseLabels.length === 1 ? '' : 's'} · {matchingGroups.length}{' '}
                      teaching group{matchingGroups.length === 1 ? '' : 's'}
                    </p>
                    <span className="timetable-semester-template-status">
                      {sessionCount > 0
                        ? sessionCount +
                          ' scheduled session' +
                          (sessionCount === 1 ? '' : 's')
                        : 'Blank template ready'}
                    </span>
                    <button
                      className="timetable-action primary"
                      type="button"
                      onClick={() => {
                        setYearOfStudy(String(item.year))
                        setCurriculumSemester(matchingCurriculumSemester?.code ?? '')
                        setTeachingGroupId(matchingGroups[0]?.id ?? '')
                        setTemplateGroupId(matchingGroups[0]?.id ?? '')
                        setTemplateLoadedGroupId('')
                        setTemplateCells({})
                        setShowTemplateEditor(true)
                        setShowGenerator(false)
                        setShowScheduleForm(false)
                      }}
                    >
                      Open semester template
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {!readOnly && !openedSavedTemplate && showTemplateEditor && (
        <section
          className="timetable-form-panel timetable-curriculum-guide"
          aria-label="Programme curriculum selection"
        >
          <div className="timetable-form-grid">
            <label>
              Programme
              <select
                aria-label="Programme"
                value={programmeId}
                onChange={event => {
                  const next = event.target.value
                  setProgrammeId(next)
                  setCurriculumId(
                    options.curricula.find(item =>
                      programmeOptions
                        .find(option => option.id === next)
                        ?.sourceIds.includes(item.programmeId)
                    )?.id ?? ''
                  )
                  setYearOfStudy('')
                  setCurriculumSemester('')
                  setSelectedCourseUnitId('')
                  setSelectedTeachingGroupIds([])
                  setTeachingGroupId('')
                  setTemplateGroupId('')
                  setCourseId('')
                  setTeacherId('')
                  setTemplateLoadedGroupId('')
                }}
              >
                <option value="">Select programme</option>
                {programmeOptions.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Curriculum
              <select
                aria-label="Curriculum"
                value={selectedCurriculum?.id ?? ''}
                disabled={!programmeId || programmeCurricula.length === 0}
                onChange={event => {
                  setCurriculumId(event.target.value)
                  setYearOfStudy('')
                  setCurriculumSemester('')
                  setSelectedCourseUnitId('')
                  setSelectedTeachingGroupIds([])
                  setTeachingGroupId('')
                  setTemplateGroupId('')
                  setCourseId('')
                  setTeacherId('')
                  setTemplateLoadedGroupId('')
                }}
              >
                <option value="">Select curriculum</option>
                {programmeCurricula.map((item, index) => (
                  <option key={item.id} value={item.id} title={item.label}>
                    {compactCurriculumLabel(item.label, selectedProgramme?.label, index)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Year of study
              <select
                aria-label="Year of study"
                value={yearOfStudy}
                disabled={!selectedCurriculum || studyYears.length === 0}
                onChange={event => {
                  setYearOfStudy(event.target.value)
                  setCurriculumSemester('')
                  setSelectedCourseUnitId('')
                  setSelectedTeachingGroupIds([])
                  setTeachingGroupId('')
                  setTemplateGroupId('')
                  setCourseId('')
                  setTeacherId('')
                  setTemplateLoadedGroupId('')
                }}
              >
                <option value="">Select year</option>
                {studyYears.map(item => (
                  <option key={item} value={item}>
                    Year {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Curriculum semester
              <select
                aria-label="Curriculum semester"
                value={curriculumSemester}
                disabled={!selectedCurriculum || curriculumSemesters.length === 0}
                onChange={event => {
                  const selectedSemesterOption = selection.curriculumSemesters.find(
                    item => item.code === event.target.value
                  )
                  setCurriculumSemester(event.target.value)
                  if (selectedSemesterOption) {
                    setYearOfStudy(String(selectedSemesterOption.year))
                  }
                  setSelectedCourseUnitId('')
                  setSelectedTeachingGroupIds([])
                  setTeachingGroupId('')
                  setTemplateGroupId('')
                  setCourseId('')
                  setTeacherId('')
                  setTemplateLoadedGroupId('')
                }}
              >
                <option value="">Select curriculum semester</option>
                {curriculumSemesters.map(item => (
                  <option key={item.value} value={item.code}>
                    {item.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Academic period
              <select
                value={semesterId}
                onChange={event => {
                  setSemesterId(event.target.value)
                  setSelectedTeachingGroupIds([])
                  setTeachingGroupId('')
                  setTemplateGroupId('')
                  setTemplateLoadedGroupId('')
                }}
              >
                <option value="">Select academic period</option>
                {availableSemesters.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.academicYearLabel || item.label} · {item.label} ·{' '}
                    {semesterDateRange(item)}
                    {item.isCurrent ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {eligibleMappings.length === 0 && (
            <p className="timetable-day-empty">
              No course units are mapped to this programme, year and semester. Add them under
              Curriculum &amp; Courses; unrelated courses will not be shown.
            </p>
          )}
          {eligibleMappings.length > 0 && availableGroups.length === 0 && (
            <p className="timetable-day-empty">
              The curriculum has course units, but no active course offerings and teaching groups
              match this academic period. Set up the offerings and groups before scheduling.
            </p>
          )}
        </section>
      )}

      {!readOnly && showGenerator && (
        <form className="timetable-form-panel" onSubmit={handleGenerate}>
          <h3>Generate a timetable</h3>
          <div className="timetable-form-grid">
            <label htmlFor="timetable-teaching-groups">
              Teaching groups
              <select
                id="timetable-teaching-groups"
                aria-label="Teaching groups"
                multiple
                size={Math.min(6, Math.max(2, allAvailableGroups.length))}
                value={selectedTeachingGroupIds}
                onChange={event =>
                  setSelectedTeachingGroupIds(
                    Array.from(event.target.selectedOptions, option => option.value)
                  )
                }
              >
                {allAvailableGroups.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {allAvailableGroups.length === 0 ? (
                <small className="timetable-class-empty-hint">
                  No active teaching groups are linked to this programme and academic period. Check
                  Course Offerings and Teaching Groups.
                </small>
              ) : (
                <small className="timetable-generator-help">
                  Select every class that should receive a timetable. Use Ctrl-click to select
                  multiple groups.
                </small>
              )}
            </label>
          </div>
          <p className="timetable-generator-help">Selected teaching groups: {selectedTeachingGroupIds.filter(id => allAvailableGroups.some(group => group.id === id)).length} of {allAvailableGroups.length} available.</p>
          <div className="timetable-form-footer">
            <button
              className="timetable-action primary"
              type="submit"
              disabled={loading || availableSemesters.length === 0 || allAvailableGroups.length === 0}
            >
              {loading ? 'Generating…' : 'Generate schedule'}
            </button>
            {availableSemesters.length === 0 && (
              <span className="timetable-day-empty">
                No academic periods were returned. Create a period under Academic Periods, then
                reload this screen.
              </span>
            )}
          </div>
        </form>
      )}

      {!readOnly && showTemplateEditor && (
        <section className="timetable-template-editor" aria-label="Editable timetable template">
          <div className="timetable-template-document-heading">
            <div className="timetable-official-identity">
              {institutionLoaded && institution.isActive && institution.logoPath && (
                <img
                  className="timetable-institution-logo"
                  src={institution.logoPath}
                  alt={institution.institutionName + ' logo'}
                />
              )}
              <div className="timetable-official-identity-copy">
                <h3>
                  {institutionLoaded && institution.isActive
                    ? institution.institutionName
                    : 'Institution settings loading…'}
                </h3>
                {institutionLoaded && institution.isActive && institution.motto && (
                  <p className="timetable-institution-motto">{institution.motto}</p>
                )}
                {institutionLoaded && institution.isActive && (
                  <p className="timetable-institution-contact">
                    {[institution.address, institution.phone, institution.email, institution.website]
                      .filter(value => Boolean(value?.trim()))
                      .join(' · ')}
                  </p>
                )}
              </div>
            </div>
            <div className="timetable-official-rule" />
            <input
              className="timetable-document-title-input"
              aria-label="Timetable document title"
              value={templateTitle}
              onChange={event => setTemplateTitle(event.target.value)}
            />
            <strong className="timetable-document-programme">
              {selectedProgramme?.label ?? 'Programme not selected'}
              {selectedCurriculum ? ' · ' + selectedCurriculum.label : ''}
            </strong>
            <span className="timetable-document-period">
              ACADEMIC YEAR {academicYearLabel} ·{' '}
              {selectedSemester?.label ?? 'Academic period not selected'} · YEAR{' '}
              {yearOfStudy || '—'} · CURRICULUM SEMESTER {selection.selectedCurriculumSemester?.code || '—'}
            </span>
            <span className="timetable-document-period">
              VALID FOR {semesterDateRange(selectedSemester)}
              {templateGroupId ? ' · ' + (groupLabels.get(templateGroupId) ?? 'Selected class') : ''}
            </span>
          </div>

          <div className="timetable-document-meta-editor">
            <label>
              Day column heading
              <input
                value={templateDayLabel}
                onChange={event => setTemplateDayLabel(event.target.value)}
                maxLength={20}
              />
            </label>
            <label>
              Registrar name
              <input
                value={templateRegistrarName}
                onChange={event => setTemplateRegistrarName(event.target.value)}
                placeholder="Name (optional)"
                maxLength={120}
              />
            </label>
            <label>
              Registrar title
              <input
                value={templateRegistrarRole}
                onChange={event => setTemplateRegistrarRole(event.target.value)}
                maxLength={80}
              />
            </label>
            <label>
              Footer text
              <input
                value={templateFooterText}
                onChange={event => setTemplateFooterText(event.target.value)}
                maxLength={160}
              />
            </label>
          </div>

          <div className="timetable-template-editor-heading">
            <div className="timetable-template-controls">
              <label>
                Class / teaching group
                <select
                  value={templateGroupId}
                  onChange={event => {
                    const nextGroupId = event.target.value
                    const nextGroup = options.teachingGroups.find(item => item.id === nextGroupId)
                    setTemplateGroupId(nextGroupId)
                    setTeachingGroupId(nextGroupId)
                    setSelectedCourseUnitId(nextGroup?.isProgrammeYearClass ? '' : nextGroup?.courseId ?? '')
                    setCourseId(nextGroup?.isProgrammeYearClass ? '' : nextGroup?.courseId ?? '')
                    setTeacherId('')
                    setTemplateLoadedGroupId('')
                    setTemplateCells({})
                    setTemplateSlots(defaultTemplateSlots)
                  }}
                >
                  <option value="" disabled>
                    {availableGroups.length ? 'Select class / teaching group' : 'No teaching groups available'}
                  </option>
                  {availableGroups.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="timetable-action timetable-load-class-button"
                type="button"
                onClick={() => void loadTemplate()}
                disabled={!templateGroupId || !availableGroups.some(item => item.id === templateGroupId)}
                aria-label="Load class timetable"
              >
                <Pencil size={15} /> Load Class
              </button>
              {availableGroups.length === 0 && (
                <small className="timetable-class-empty-hint" role="status">
                  No active teaching groups are configured for this programme and academic period.
                  Course offerings and teaching groups must be created before a class timetable can be loaded.
                </small>
              )}
            </div>
          </div>

          <div className="timetable-grid-scroll">
              <table className="timetable-editable-grid">
                <thead>
                  <tr>
                    <th>{templateDayLabel || 'DAY'}</th>
                    {templateSlots.map((slot, index) => (
                      <React.Fragment key={index}>
                        <th className={templateBreakAfter === index ? 'timetable-break-after' : ''}>
                          <span>PERIOD {index + 1}</span>
                          <label>
                            From
                            <input
                              aria-label={`Period ${index + 1} start time`}
                              type="time"
                              value={slot.startTime}
                              onChange={event =>
                                setTemplateSlots(current =>
                                  current.map((item, slotIndex) =>
                                    slotIndex === index
                                      ? { ...item, startTime: event.target.value }
                                      : item
                                  )
                                )
                              }
                            />
                          </label>
                          <label>
                            To
                            <input
                              aria-label={`Period ${index + 1} end time`}
                              type="time"
                              value={slot.endTime}
                              onChange={event =>
                                setTemplateSlots(current =>
                                  current.map((item, slotIndex) =>
                                    slotIndex === index
                                      ? { ...item, endTime: event.target.value }
                                      : item
                                  )
                                )
                              }
                            />
                          </label>
                          <div className="timetable-period-tools">
                            <button
                              type="button"
                              onClick={() => moveTemplateSlot(index, -1)}
                              disabled={index === 0}
                              aria-label={`Move period ${index + 1} left`}
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTemplateSlot(index, 1)}
                              disabled={index === templateSlots.length - 1}
                              aria-label={`Move period ${index + 1} right`}
                            >
                              →
                            </button>
                            <button
                              type="button"
                              onClick={() => removeTemplateSlot(index)}
                              disabled={templateSlots.length <= 1}
                              aria-label={`Remove period ${index + 1}`}
                            >
                              −
                            </button>
                          </div>
                        </th>
                        {templateBreakAfter === index && (
                          <th
                            className="timetable-template-divider-header"
                            aria-label={templateBreakLabel || 'Break'}
                          >
                            {(templateBreakLabel || 'BREAK')
                              .split('')
                              .map((letter, letterIndex) => (
                                <span key={letterIndex}>{letter}</span>
                              ))}
                          </th>
                        )}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleTemplateDays.map((day, rowIndex) => (
                    <tr key={day}>
                      <th>
                        <div className="timetable-day-tools">
                          <button
                            type="button"
                            onClick={() => moveTemplateDay(day, -1)}
                            disabled={rowIndex === 0}
                            aria-label={`Move ${days[day]} up`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTemplateDay(day, 1)}
                            disabled={rowIndex === visibleTemplateDays.length - 1}
                            aria-label={`Move ${days[day]} down`}
                          >
                            ↓
                          </button>
                        </div>
                        {days[day].toUpperCase()}
                      </th>
                      {templateSlots.map((slot, slotIndex) => {
                        const key = day + '-' + slotIndex
                        const cell = templateCells[key] ?? {
                          courseId: '',
                          teacherId: '',
                          room: '',
                          sessionType: 'Lecture',
                          rowSpan: 1,
                          colSpan: 1,
                        }
                        const rowSpan = Math.max(
                          1,
                          Math.min(
                            visibleTemplateDays.length - rowIndex,
                            Number(cell.rowSpan) || 1
                          )
                        )
                        const colSpan = templatePeriodSpan(slotIndex, cell.colSpan)
                        return (
                          <React.Fragment key={slotIndex}>
                            {!templateCellCovered(day, slotIndex) && (
                              <td
                                rowSpan={rowSpan}
                                colSpan={colSpan}
                                className={
                                  templateBreakAfter === slotIndex ? 'timetable-break-after' : ''
                                }
                              >
                                <div className="timetable-inline-cell-editor" aria-label={days[day] + ' period ' + (slotIndex + 1)}>
                                  <select aria-label="Course unit" value={cell.courseId} disabled={!templateCourseOptions.length} onChange={event => changeTemplateCell(key, 'courseId', event.target.value)}>
                                    <option value="">+ Select course</option>
                                    {templateCourseOptions.map(item => <option key={item.id} value={item.id}>{(item.id === cell.courseId ? item.label : [item.code, item.label].filter(Boolean).join(' — ')).toUpperCase()}</option>)}
                                  </select>
                                  <select aria-label="Lecturer" value={cell.teacherId} onChange={event => changeTemplateCell(key, 'teacherId', event.target.value)}>
                                    <option value="">Select lecturer</option>
                                    {filterTutorsForCourse(options.teachers, cell.courseId).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                                  </select>
                                  <input aria-label="Room or venue" value={cell.room} onChange={event => changeTemplateCell(key, 'room', event.target.value)} placeholder="Room / lab" />
                                  <select aria-label="Session type" value={cell.sessionType} onChange={event => changeTemplateCell(key, 'sessionType', event.target.value)}>
                                    <option>Lecture</option><option>Practical</option><option>Tutorial</option><option>Seminar</option><option>Examination</option><option>Other</option>
                                  </select>
                                  <div className="timetable-inline-merge">
                                    <label>Days <select aria-label="Merge days" value={Number(cell.rowSpan) || 1} onChange={event => changeTemplateCell(key, 'rowSpan', event.target.value)}>{Array.from({length: Math.max(1, visibleTemplateDays.length - rowIndex)}, (_, index) => index + 1).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
                                    <label>Periods <select aria-label="Merge periods" value={Number(cell.colSpan) || 1} onChange={event => changeTemplateCell(key, 'colSpan', event.target.value)}>{Array.from({length: Math.max(1, templateSlots.length - slotIndex)}, (_, index) => index + 1).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
                                  </div>
                                  {cell.id && <small className="timetable-template-existing">Saved session</small>}
                                </div>
                              </td>
                            )}
                            {templateBreakAfter === slotIndex && rowIndex === 0 && (
                              <td
                                rowSpan={visibleTemplateDays.length}
                                className="timetable-template-divider-cell"
                                aria-label={templateBreakLabel || 'Break'}
                              >
                                <div>
                                  {(templateBreakLabel || 'BREAK')
                                    .split('')
                                    .map((letter, letterIndex) => (
                                      <span key={letterIndex}>{letter}</span>
                                    ))}
                                </div>
                              </td>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>

          {templateGroupId && templateLoadedGroupId !== templateGroupId && (
            <p className="timetable-generator-help">Loading the selected class into the timetable sheet…</p>
          )}
          {!templateGroupId && (
            <p className="timetable-generator-help">The blank timetable sheet is ready. Select a teaching group above to load its saved sessions and enable saving.</p>
          )}

          {activeTemplateCellKey &&
            (() => {
              const [dayValue, slotValue] = activeTemplateCellKey.split('-').map(Number)
              const slot = templateSlots[slotValue]
              const cell = templateCells[activeTemplateCellKey] ?? {
                courseId: '',
                teacherId: '',
                room: '',
                sessionType: 'Lecture',
                rowSpan: 1,
                colSpan: 1,
              }
              if (!slot) return null
              const dayPosition = visibleTemplateDays.indexOf(dayValue)
              const maxRowSpan = Math.max(
                1,
                visibleTemplateDays.length - Math.max(0, dayPosition)
              )
              const maxColSpan = Math.max(1, templateSlots.length - slotValue)
              return (
                <div
                  className="timetable-cell-modal-overlay"
                  role="presentation"
                  onMouseDown={event => {
                    if (event.target === event.currentTarget) setActiveTemplateCellKey(null)
                  }}
                >
                  <section
                    className="timetable-cell-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="timetable-cell-modal-title"
                  >
                    <header>
                      <div>
                        <h3 id="timetable-cell-modal-title">Edit timetable period</h3>
                        <p>
                          {days[dayValue]} · {timeLabel(slot.startTime)}–{timeLabel(slot.endTime)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Close period editor"
                        onClick={() => setActiveTemplateCellKey(null)}
                      >
                        ×
                      </button>
                    </header>
                    <div className="timetable-cell-modal-fields">
                      <label>
                        Course unit
                        <select
                          aria-label="Course unit"
                          value={cell.courseId}
                          onChange={event =>
                            changeTemplateCell(activeTemplateCellKey, 'courseId', event.target.value)
                          }
                        >
                          <option value="">— Select course —</option>
                          {templateCourseOptions.map(item => (
                            <option key={item.id} value={item.id}>
                              {(item.id === cell.courseId ? item.label : [item.code, item.label].filter(Boolean).join(' — ')).toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Lecturer / teacher
                        <select
                          aria-label="Lecturer / teacher"
                          value={cell.teacherId}
                          onChange={event =>
                            changeTemplateCell(
                              activeTemplateCellKey,
                              'teacherId',
                              event.target.value
                            )
                          }
                        >
                          <option value="">— Select lecturer —</option>
                          {filterTutorsForCourse(options.teachers, cell.courseId).map(item => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Room / venue
                        <input
                          aria-label="Room / venue"
                          value={cell.room}
                          onChange={event =>
                            changeTemplateCell(activeTemplateCellKey, 'room', event.target.value)
                          }
                          placeholder="Enter room or laboratory"
                        />
                      </label>
                      <label>
                        Session type
                        <select
                          aria-label="Session type"
                          value={cell.sessionType}
                          onChange={event =>
                            changeTemplateCell(
                              activeTemplateCellKey,
                              'sessionType',
                              event.target.value
                            )
                          }
                        >
                          <option>Lecture</option>
                          <option>Practical</option>
                          <option>Tutorial</option>
                          <option>Seminar</option>
                          <option>Examination</option>
                          <option>Other</option>
                        </select>
                      </label>
                      <label>
                        Merge down (days)
                        <select
                          aria-label="Merge down (days)"
                          value={Number(cell.rowSpan) || 1}
                          onChange={event =>
                            changeTemplateCell(activeTemplateCellKey, 'rowSpan', event.target.value)
                          }
                        >
                          {[1, 2, 3, 4, 5, 6].slice(0, maxRowSpan).map(value => (
                            <option key={value} value={value}>
                              {value} day(s)
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Merge across periods
                        <select
                          aria-label="Merge across periods"
                          value={Number(cell.colSpan) || 1}
                          onChange={event =>
                            changeTemplateCell(activeTemplateCellKey, 'colSpan', event.target.value)
                          }
                        >
                          {[1, 2, 3, 4, 5, 6, 7].slice(0, maxColSpan).map(value => (
                            <option key={value} value={value}>
                              {value} period(s)
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <footer>
                      <button
                        type="button"
                        className="timetable-cell-clear"
                        onClick={() => {
                          changeTemplateCell(activeTemplateCellKey, 'courseId', '')
                          changeTemplateCell(activeTemplateCellKey, 'teacherId', '')
                          changeTemplateCell(activeTemplateCellKey, 'room', '')
                          changeTemplateCell(activeTemplateCellKey, 'sessionType', 'Lecture')
                          changeTemplateCell(activeTemplateCellKey, 'rowSpan', '1')
                          changeTemplateCell(activeTemplateCellKey, 'colSpan', '1')
                        }}
                      >
                        Clear period
                      </button>
                      <button
                        type="button"
                        className="timetable-cell-done"
                        onClick={() => setActiveTemplateCellKey(null)}
                      >
                        Done
                      </button>
                    </footer>
                  </section>
                </div>
              )
            })()}

          <div className="timetable-template-design-tools">
            <label>
              Divider after period
              <select
                value={templateBreakAfter ?? ''}
                onChange={event =>
                  setTemplateBreakAfter(
                    event.target.value === '' ? null : Number(event.target.value)
                  )
                }
              >
                <option value="">No divider</option>
                {templateSlots.map((_, index) => (
                  <option key={index} value={index}>
                    After period {index + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Break label
              <input
                value={templateBreakLabel}
                onChange={event => setTemplateBreakLabel(event.target.value)}
                maxLength={30}
              />
            </label>
            <button
              type="button"
              className="timetable-action"
              onClick={() =>
                setTemplateSlots(current => [...current, { startTime: '16:30', endTime: '17:30' }])
              }
            >
              + Add period
            </button>
          </div>

          <div className="timetable-template-document-footer">
            <span>{templateFooterText}</span>
            <div>
              <div className="timetable-signature-line" />
              <strong>{templateRegistrarName || '____________________________'}</strong>
              <small>{templateRegistrarRole || 'ACADEMIC REGISTRAR'}</small>
            </div>
          </div>

          <div className="timetable-form-footer">
            <button
              className="timetable-action primary"
              type="button"
              onClick={() => void saveTemplate()}
              disabled={
                !templateGroupId ||
                templateLoadedGroupId !== templateGroupId ||
                templateSaving ||
                !availableCourses.length ||
                !availableTutors.length
              }
            >
              <Save size={15} />
              {templateSaving ? 'Saving…' : 'Save timetable'}
            </button>
            <button
              className="timetable-action"
              type="button"
              onClick={downloadTimetableTemplatePdf}
              disabled={!institutionLoaded || !institution.isActive}
            >
              Download
            </button>
            <button
              className="timetable-action"
              type="button"
              onClick={printTimetableTemplate}
              disabled={!institutionLoaded || !institution.isActive}
            >
              Print
            </button>
          </div>
        </section>
      )}

      {!readOnly && showScheduleForm && (
        <form className="timetable-form-panel" onSubmit={submit}>
          <h3>{editingEntryId ? 'Edit teaching session' : 'Schedule a teaching session'}</h3>
          <div className="timetable-form-grid">
            <label>
              Teaching group
              <select
                value={teachingGroupId}
                onChange={event => {
                  const next = event.target.value
                  setTeachingGroupId(next)
                  const selected = options.teachingGroups.find(item => item.id === next)
                  setCourseId(selected?.isProgrammeYearClass ? '' : selected?.courseId ?? '')
                  setTeacherId('')
                }}
                required
              >
                <option value="">Select group</option>
                {availableGroups.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Course
              <select
                value={courseId}
                onChange={event => setCourseId(event.target.value)}
                required
              >
                <option value="">Select course</option>
                {selectedGroupCourses.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Teacher / staff
              <select
                value={teacherId}
                onChange={event => setTeacherId(event.target.value)}
                required
              >
                <option value="">Select teacher</option>
                {scheduleTutors.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Day
              <select
                value={dayOfWeek}
                onChange={event => setDayOfWeek(event.target.value)}
              >
                {days.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start time
              <input
                type="time"
                value={startTime}
                onChange={event => setStartTime(event.target.value)}
                required
              />
            </label>
            <label>
              End time
              <input
                type="time"
                value={endTime}
                onChange={event => setEndTime(event.target.value)}
                required
              />
            </label>
            <label>
              Room / venue
              <input
                value={room}
                onChange={event => setRoom(event.target.value)}
                maxLength={100}
              />
            </label>
            <label>
              Session type
              <select
                value={sessionType}
                onChange={event => setSessionType(event.target.value)}
              >
                <option>Lecture</option>
                <option>Practical</option>
                <option>Tutorial</option>
                <option>Seminar</option>
                <option>Examination</option>
                <option>Other</option>
              </select>
            </label>
          </div>
          <div className="timetable-form-footer">
            <button
              className="timetable-action primary"
              type="submit"
              disabled={
                loading ||
                !options.teachingGroups.length ||
                !options.courses.length ||
                !options.teachers.length
              }
            >
              {loading ? 'Saving…' : editingEntryId ? 'Update session' : 'Save session'}
            </button>
            <button
              className="timetable-action"
              type="button"
              onClick={() => {
                setShowScheduleForm(false)
                setEditingEntryId(null)
              }}
            >
              Cancel
            </button>
            {(!options.teachingGroups.length ||
              !options.courses.length ||
              !options.teachers.length) && (
              <span className="timetable-day-empty">
                Add teaching groups, courses and staff before scheduling.
              </span>
            )}
          </div>
        </form>
      )}

      {generatedTimetables.length > 0 && (
        <section className="timetable-generated-list" aria-live="polite">
          <div className="timetable-generated-heading">
            <h3>Generated class timetables</h3>
            <span>
              {generatedTimetables.length} timetable
              {generatedTimetables.length === 1 ? '' : 's'}
            </span>
          </div>
          {generatedTimetables.map(({ groupId, groupLabel, result }) => {
            const classEntries = [...result.entries].sort(
              (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
            )
            const classTimeSlots = [...new Set(classEntries.map(entry => entry.startTime))].sort(
              (a, b) => a.localeCompare(b)
            )
            return (
              <article className="timetable-class-document" key={groupId}>
                <div className="timetable-class-document-heading">
                  <div className="timetable-class-document-identity">
                    <div className="timetable-official-identity">
                      {institutionLoaded && institution.isActive && institution.logoPath && (
                        <img
                          className="timetable-institution-logo"
                          src={institution.logoPath}
                          alt={institution.institutionName + ' logo'}
                        />
                      )}
                      <div className="timetable-official-identity-copy">
                        <h4>
                          {institutionLoaded && institution.isActive
                            ? institution.institutionName
                            : 'Institution settings loading…'}
                        </h4>
                        {institutionLoaded && institution.isActive && institution.motto && (
                          <span className="timetable-institution-motto">{institution.motto}</span>
                        )}
                        {institutionLoaded && institution.isActive && (
                          <span className="timetable-institution-contact">
                            {[institution.address, institution.phone, institution.email]
                              .filter(value => Boolean(value?.trim()))
                              .join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <strong>
                      {selectedProgramme?.label ?? 'Programme'} · {groupLabel}
                    </strong>
                    <span>
                      ACADEMIC YEAR {academicYearLabel} ·{' '}
                      {selectedSemester?.label ?? 'Selected academic period'} · YEAR {yearOfStudy}{' '}
                      · CURRICULUM SEMESTER {selection.selectedCurriculumSemester?.code ?? curriculumSemester}
                    </span>
                    <span>VALID FOR: {semesterDateRange(selectedSemester)}</span>
                  </div>
                  <div className="timetable-class-actions">
                    <button
                      className="timetable-action"
                      type="button"
                      onClick={() =>
                        downloadInstitutionalPdf(
                          timetablePdfOptions(
                            groupLabel + ' Teaching Timetable',
                            classEntries,
                            groupLabel + '-timetable'
                          )
                        )
                      }
                      disabled={!institutionLoaded || !institution.isActive}
                    >
                      Download PDF
                    </button>
                    <button
                      className="timetable-action"
                      type="button"
                      onClick={() => printGeneratedTimetable(groupId)}
                      disabled={!institutionLoaded || !institution.isActive}
                    >
                      Print
                    </button>
                  </div>
                </div>
                <p className="timetable-class-status">
                  Score: {result.optimizationScore.toFixed(1)}% ·{' '}
                  {result.isConflictFree ? 'No conflicts reported' : 'Conflicts detected'}
                </p>
                {result.conflicts.length > 0 && (
                  <p className="timetable-class-warning">
                    Conflicts: {result.conflicts.join('; ')}
                  </p>
                )}
                {result.warnings.length > 0 && (
                  <p className="timetable-class-warning">
                    Warnings: {result.warnings.join('; ')}
                  </p>
                )}
                {classEntries.length === 0 ? (
                  <p className="timetable-day-empty">
                    No sessions were generated for this class.
                  </p>
                ) : (
                  <div className="timetable-grid-scroll">
                    <table className="timetable-formal-grid timetable-class-grid">
                      <thead>
                        <tr>
                          <th className="timetable-day-column">DAY</th>
                          {classTimeSlots.map((slot, index) => {
                            const period = classEntries.find(entry => entry.startTime === slot)
                            return (
                              <th key={slot}>
                                <span className="timetable-period-label">PERIOD {index + 1}</span>
                                <strong>
                                  {timeLabel(slot)}–{period ? timeLabel(period.endTime) : ''}
                                </strong>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {displayedWeekDays.map(dayIndex => (
                          <tr key={dayIndex}>
                            <th className="timetable-day-column">{days[dayIndex].toUpperCase()}</th>
                            {classTimeSlots.map(slot => {
                              const cellEntries = classEntries.filter(
                                entry => entry.dayOfWeek === dayIndex && entry.startTime === slot
                              )
                              return (
                                <td
                                  key={slot}
                                  className={cellEntries.length ? 'has-session' : 'empty-session'}
                                >
                                  {cellEntries.map(entry => (
                                    <article className="timetable-grid-session" key={entry.id}>
                                      <strong>
                                        {courseLabels.get(entry.courseId) ?? 'Course not found'}
                                      </strong>
                                      <span>
                                        {teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}
                                      </span>
                                      <span className="timetable-grid-time">
                                        {timeRange(entry)}
                                      </span>
                                      {entry.room && <span>Venue: {entry.room}</span>}
                                      {entry.sessionType && <span>{entry.sessionType}</span>}
                                    </article>
                                  ))}
                                  {cellEntries.length === 0 && (
                                    <span className="timetable-grid-dash">—</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}

      {generatedResult && (
        <section className="timetable-result" aria-live="polite">
          <h3>Generation result</h3>
          <p>
            <strong>Optimization score:</strong> {generatedResult.optimizationScore.toFixed(1)}%
          </p>
          <p>
            <strong>Conflict status:</strong>{' '}
            {generatedResult.isConflictFree ? 'No conflicts reported' : 'Conflicts detected'}
          </p>
          {generatedResult.conflicts.length > 0 && (
            <div>
              <strong>Conflicts</strong>
              <ul>
                {generatedResult.conflicts.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {generatedResult.warnings.length > 0 && (
            <div>
              <strong>Warnings</strong>
              <ul>
                {generatedResult.warnings.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {generatedResult.unscheduled.length > 0 && (
            <div>
              <strong>Unscheduled</strong>
              <ul>
                {generatedResult.unscheduled.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="timetable-toolbar">
        <h3>
          Weekly schedule <span>({activeEntries.length})</span>
        </h3>
        <div className="timetable-toolbar-controls">
          <label className="timetable-weekend-toggle">
            <input
              type="checkbox"
              checked={showWeekends}
              onChange={event => setShowWeekends(event.target.checked)}
            />{' '}
            Show weekend days (Saturday &amp; Sunday)
          </label>
          {!readOnly && (
            <button
              className="timetable-action"
              type="button"
              aria-expanded={showSystemData}
              onClick={() => setShowSystemData(value => !value)}
            >
              {showSystemData ? 'Hide system data' : 'System Data & Sync'}
            </button>
          )}
          <div className="timetable-view-switch" role="group" aria-label="Schedule display">
            <button
              type="button"
              aria-pressed={view === 'week'}
              onClick={() => setView('week')}
            >
              <LayoutGrid /> Week
            </button>
            <button
              type="button"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <List /> List
            </button>
          </div>
        </div>
      </div>

      {showSystemData && !readOnly && (
        <section className="timetable-system-data" aria-label="System data and sync">
          <div className="timetable-system-data-heading">
            <div>
              <h3>System Data &amp; SMIS Bridge</h3>
              <p>
                Live catalogue records supplied by the central SMIS APIs. Changes made in Curriculum
                &amp; Courses, Staff and Academic Periods appear here after refresh.
              </p>
            </div>
            <button
              className="timetable-action primary"
              type="button"
              onClick={() => {
                setLoading(true)
                void load().finally(() => setLoading(false))
              }}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh system data'}
            </button>
          </div>
          <div className="timetable-system-data-grid">
            <article>
              <strong>{options.programmes.length}</strong>
              <span>Programmes</span>
              <small>
                {options.programmes
                  .slice(0, 5)
                  .map(item => item.label)
                  .join(' · ') || 'No programmes returned'}
              </small>
            </article>
            <article>
              <strong>{options.curricula.length}</strong>
              <span>Curricula</span>
              <small>
                {options.curricula
                  .slice(0, 5)
                  .map(item => item.label)
                  .join(' · ') || 'No curricula returned'}
              </small>
            </article>
            <article>
              <strong>{options.courses.length}</strong>
              <span>Course units</span>
              <small>
                {options.courses
                  .slice(0, 5)
                  .map(item => item.label.toUpperCase())
                  .join(' · ') || 'No course units returned'}
              </small>
            </article>
            <article>
              <strong>{options.teachers.length}</strong>
              <span>Staff / tutors</span>
              <small>
                {options.teachers
                  .slice(0, 5)
                  .map(item => item.label)
                  .join(' · ') || 'No staff returned'}
              </small>
            </article>
            <article>
              <strong>{options.teachingGroups.length}</strong>
              <span>Teaching groups</span>
              <small>
                {options.teachingGroups
                  .slice(0, 5)
                  .map(item => item.label)
                  .join(' · ') || 'No teaching groups returned'}
              </small>
            </article>
            <article>
              <strong>{options.semesters.length}</strong>
              <span>Academic periods</span>
              <small>
                {options.semesters
                  .slice(0, 5)
                  .map(item => item.label)
                  .join(' · ') || 'No academic periods returned'}
              </small>
            </article>
          </div>
          <p className="timetable-system-data-footnote">
            This screen does not keep a separate local programme, course or tutor registry. The
            central database remains the source of truth.
          </p>
        </section>
      )}

      {loading && activeEntries.length === 0 ? (
        <div className="timetable-empty">
          <LoadingSpinner label="Loading timetable…" />
        </div>
      ) : activeEntries.length === 0 ? (
        <div className="timetable-empty">
          <CalendarDays size={26} />
          <strong>No sessions scheduled yet</strong>
          <span>Schedule or generate sessions to populate the formal weekly timetable.</span>
        </div>
      ) : view === 'week' ? (
        <div className="timetable-print-area">
          <div className="timetable-document-heading">
            <div className="timetable-official-identity">
              {institutionLoaded && institution.isActive && institution.logoPath ? (
                <img
                  className="timetable-institution-logo"
                  src={institution.logoPath}
                  alt={institution.institutionName + ' logo'}
                />
              ) : (
                <div className="timetable-document-mark">
                  {institutionLoaded && institution.isActive
                    ? institution.abbreviation || 'SMIS'
                    : 'SMIS'}
                </div>
              )}
              <div className="timetable-official-identity-copy">
                <h3>
                  {institutionLoaded && institution.isActive
                    ? institution.institutionName
                    : 'Institution settings loading…'}
                </h3>
                {institutionLoaded && institution.isActive && institution.motto && (
                  <span className="timetable-institution-motto">{institution.motto}</span>
                )}
                {institutionLoaded && institution.isActive && (
                  <span className="timetable-institution-contact">
                    {[institution.address, institution.phone, institution.email]
                      .filter(value => Boolean(value?.trim()))
                      .join(' · ')}
                  </span>
                )}
              </div>
            </div>
            <div className="timetable-official-rule" />
            <p>TEACHING TIMETABLE</p>
            <strong className="timetable-document-programme">
              {selectedProgramme?.label ?? 'All programmes'}
            </strong>
            <small>
              ACADEMIC YEAR {academicYearLabel} ·{' '}
              {selectedSemester?.label ?? 'Academic period not selected'} · VALID FOR{' '}
              {semesterDateRange(selectedSemester)}
            </small>
          </div>
          <div className="timetable-grid-scroll">
            <table className="timetable-formal-grid">
              <thead>
                <tr>
                  <th className="timetable-day-column">DAY</th>
                  {timeSlots.map((slot, index) => (
                    <th key={slot}>
                      <span className="timetable-period-label">PERIOD {index + 1}</span>
                      <strong>{timeLabel(slot)}</strong>
                      <span>START TIME</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedWeekDays.map(dayIndex => (
                  <tr key={dayIndex}>
                    <th className="timetable-day-column">{days[dayIndex].toUpperCase()}</th>
                    {timeSlots.map(slot => {
                      const cellEntries = orderedEntries.filter(
                        entry => entry.dayOfWeek === dayIndex && entry.startTime === slot
                      )
                      return (
                        <td
                          key={slot}
                          className={cellEntries.length ? 'has-session' : 'empty-session'}
                        >
                          {cellEntries.map(entry => (
                            <article className="timetable-grid-session" key={entry.id}>
                              <strong>
                                {courseLabels.get(entry.courseId) ?? 'Course not found'}
                              </strong>
                              <span>
                                {groupLabels.get(entry.teachingGroupId) ?? 'Teaching group'}
                              </span>
                              <span>
                                {teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}
                              </span>
                              <span className="timetable-grid-time">{timeRange(entry)}</span>
                              {entry.room && <span>Venue: {entry.room}</span>}
                              {!readOnly && (
                                <>
                                  <button
                                    className="timetable-event-remove"
                                    type="button"
                                    onClick={() => editEntry(entry)}
                                  >
                                    <Pencil size={12} /> Edit
                                  </button>
                                  <button
                                    className="timetable-event-remove"
                                    type="button"
                                    onClick={() => void remove(entry.id)}
                                  >
                                    <Trash2 size={12} /> Remove
                                  </button>
                                </>
                              )}
                            </article>
                          ))}
                          {cellEntries.length === 0 && (
                            <span className="timetable-grid-dash">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="timetable-document-footer">
            <span>Prepared for academic use</span>
            <span>Academic Registrar: ____________________</span>
          </div>
          <div className="timetable-document-print-actions">
            <button
              type="button"
              className="timetable-action"
              onClick={() =>
                printInstitutionalPdf(
                  timetablePdfOptions(
                    (availableSemesters.find(item => item.id === semesterId)?.label ??
                      'Academic') + ' Timetable',
                    orderedEntries,
                    'school-timetable'
                  )
                )
              }
              disabled={!institutionLoaded || !institution.isActive}
            >
              Print timetable
            </button>
          </div>
        </div>
      ) : (
        <div className="timetable-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Room</th>
                <th>Type</th>
                <th>Teaching group</th>
                <th>Course</th>
                <th>Teacher</th>
                {!readOnly && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {orderedEntries.map(entry => (
                <tr key={entry.id}>
                  <td>{days[entry.dayOfWeek] ?? '—'}</td>
                  <td>{timeRange(entry)}</td>
                  <td>{entry.room || '—'}</td>
                  <td>{entry.sessionType || '—'}</td>
                  <td>{groupLabels.get(entry.teachingGroupId) ?? 'Group not found'}</td>
                  <td>{courseLabels.get(entry.courseId) ?? 'Course not found'}</td>
                  <td>{teacherLabels.get(entry.teacherId) ?? 'Teacher not found'}</td>
                  {!readOnly && (
                    <td>
                      <button
                        className="timetable-action"
                        type="button"
                        onClick={() => editEntry(entry)}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        className="timetable-action"
                        type="button"
                        onClick={() => void remove(entry.id)}
                      >
                        <Trash2 /> Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
