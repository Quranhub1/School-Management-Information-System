import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, LayoutGrid, List, Plus, Sparkles, Trash2, Pencil, Save, Printer, Columns } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { createTimetableEntry, deactivateTimetableEntry, generateTimetable, getTimetableOptions, getTimetableTemplate, listTimetable, saveTimetableTemplate, updateTimetableEntry, type CreateTimetableEntry, type GenerateTimetableResult, type TimetableEntry, type TimetableOptions } from '../api/timetable'
import './TimetableManagement.css'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useInstitutionSettings } from './InstitutionSettingsContext'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const shortDays = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRID', 'SAT']
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
const defaultTemplateSlots = [
{ startTime: '08:00', endTime: '10:30' },
{ startTime: '11:00', endTime: '13:00' },
{ startTime: '14:00', endTime: '16:00' },
{ startTime: '17:00', endTime: '18:30' },
]
type TemplateCell = { id?: string; courseId: string; teacherId: string; room: string; sessionType: string; customTime?: string; rowSpan?: number | string; colSpan?: number | string }
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
const [options, setOptions] = useState(emptyOptions)
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
const [showTemplateEditor, setShowTemplateEditor] = useState(true)
const [sheetEditingMode, setSheetEditingMode] = useState(true)
const [templateGroupId, setTemplateGroupId] = useState('')
const [templateLoadedGroupId, setTemplateLoadedGroupId] = useState('')
const [templateSlots, setTemplateSlots] = useState(defaultTemplateSlots)
const [templateCells, setTemplateCells] = useState<Record<string, TemplateCell>>({})
const [templateInstitution, setTemplateInstitution] = useState('KAMPALA SCHOOL OF HEALTH SCIENCES')
const [templateTitle, setTemplateTitle] = useState('TEACHING TIME TABLE FOR ENTER PROGRAMME')
const [templateYearLabel, setTemplateYearLabel] = useState('')
const [templateSemesterLabel, setTemplateSemesterLabel] = useState('ENTER SEMESTER')
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
const [activeTemplateCellKey, setActiveTemplateCellKey] = useState<string | null>(null)
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
const uniqueProgrammes = deduplicateProgrammeOptions(loadedOptions.programmes ?? [], loadedOptions.curricula ?? [], loadedOptions.teachingGroups ?? [])
const preferredProgramme = uniqueProgrammes[0]
const preferredCurriculum = loadedOptions.curricula.find(item => preferredProgramme?.sourceIds.includes(item.programmeId))
const preferredPeriodId = loadedOptions.semesters.find(item => item.isCurrent)?.id || loadedOptions.semesters.find(item => item.isActive)?.id || loadedOptions.semesters[0]?.id || ''
const preferredGroup = loadedOptions.teachingGroups.find(item => item.programmeId === preferredCurriculum?.programmeId && item.semesterId === preferredPeriodId)
setProgrammeId(current => current || preferredProgramme?.id || '')
setCurriculumId(current => current || preferredCurriculum?.id || '')
setTemplateGroupId(current => current || preferredGroup?.id || '')
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
const programmeOptions = useMemo(() => deduplicateProgrammeOptions(options.programmes, options.curricula, options.teachingGroups), [options.programmes, options.curricula, options.teachingGroups])
const selectedProgramme = programmeOptions.find(item => item.id === programmeId)
const selectedProgrammeIds = new Set(selectedProgramme?.sourceIds ?? (programmeId ? [programmeId] : []))
const semesterGroupIds = useMemo(() => new Set(options.teachingGroups.filter(item => item.semesterId === semesterId).map(item => item.id)), [options.teachingGroups, semesterId])
const programmeCurricula = options.curricula.filter(item => selectedProgrammeIds.has(item.programmeId))
const selectedCurriculum = programmeCurricula.find(item => item.id === curriculumId) ?? programmeCurricula[0]
const curriculumMappings = options.curriculumCourses.filter(item => item.curriculumId === selectedCurriculum?.id)
const semesterTemplates = useMemo(() => {
const grouped = new Map<string, { year: number; semester: number; courseIds: Set; courseLabels: string[] }>()
for (const mapping of curriculumMappings) {
const key = mapping.yearOfStudy + '-' + mapping.semesterNumber
const current = grouped.get(key) ?? { year: mapping.yearOfStudy, semester: mapping.semesterNumber, courseIds: new Set(), courseLabels: [] }
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
const availableGroups = options.teachingGroups.filter(item => item.programmeId === selectedCurriculum?.programmeId && item.semesterId === semesterId)
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
courseLabels.get(entry.courseId) ?? 'ENTER COURSE UNIT',
teacherLabels.get(entry.teacherId) ?? 'TUTOR',
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
{ text: `ACADEMIC YEAR ${academicYearLabel} · ${selectedSemester?.label ?? 'ENTER SEMESTER'} · VALID FOR ${semesterDateRange(selectedSemester)}`,  alignment: 'center', fontSize: 9, margin: [0, 0, 0, 10] },
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
[
{ text: templateDayLabel || 'DAY', style: 'tableHeader' },
...templateSlots.flatMap((slot, index) => [
{ text: formatSlotRange12(slot.startTime, slot.endTime), style: 'tableHeader' },
...(templateBreakAfter === index ? [{ text: (templateBreakLabel || 'BREAK')[0], style: 'tableHeader' }] : []),
...(templateLunchAfter === index && templateLunchAfter !== templateBreakAfter ? [{ text: (templateLunchLabel || 'LUNCH')[0], style: 'tableHeader' }] : []),
]),
],
...visibleDays.map((day, dayIndex) => {
const row: Array<Record<string, unknown>> = [{ text: shortDays[day] || days[day].toUpperCase(), style: 'tableHeader' }]
templateSlots.forEach((slot, slotIndex) => {
if (templateCellCovered(day, slotIndex)) {
row.push({})
} else {
const cell = templateCells[day + '-' + slotIndex]
const rowSpan = Math.max(1, Math.min(visibleDays.length - dayIndex, Number(cell?.rowSpan) || 1))
const colSpan = templatePeriodSpan(slotIndex, cell?.colSpan)
const cName = cell?.courseId ? (courseLabels.get(cell.courseId) ?? 'ENTER COURSE UNIT') : ''
const tName = cell?.teacherId ? `(${teacherLabels.get(cell.teacherId) ?? 'TUTOR'})` : ''
const text = cell ? [
cName,
tName,
cell.customTime || '',
cell.room ? `Venue: ${cell.room}` : '',
].filter(Boolean).join('\n') : ''
row.push({ text: text || '', alignment: 'center', ...(rowSpan > 1 ? { rowSpan } : {}), ...(colSpan > 1 ? { colSpan } : {}) })
}
if (templateBreakAfter === slotIndex) {
row.push(dayIndex === 0
? { text: (templateBreakLabel || 'BREAK').slice(1).split('').join('\n'), alignment: 'center', bold: true, rowSpan: visibleDays.length }
: {})
}
if (templateLunchAfter === slotIndex && templateLunchAfter !== templateBreakAfter) {
row.push(dayIndex === 0
? { text: (templateLunchLabel || 'LUNCH').slice(1).split('').join('\n'), alignment: 'center', bold: true, rowSpan: visibleDays.length }
: {})
}
})
return row
}),
]
printInstitutionalPdf({
...base,
title: templateTitle || base.title,
institutionName: templateInstitution || base.institutionName,
content: [
{ text: `${templateYearLabel || `ACADEMIC YEAR ${academicYearLabel}`} · ${templateSemesterLabel || selectedSemester?.label || 'ENTER SEMESTER'}`,  alignment: 'center', fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
{ table: { headerRows: 1, widths: ['auto', ...templateSlots.flatMap((_, index) => {
const cols: Array<string | number> = ['*']
if (templateBreakAfter === index) cols.push(16)
if (templateLunchAfter === index && templateLunchAfter !== templateBreakAfter) cols.push(16)
return cols
})], body }, layout: {
hLineWidth: () => 0.8,
vLineWidth: () => 0.8,
hLineColor: () => '#000000',
vLineColor: () => '#000000',
paddingLeft: () => 4,
paddingRight: () => 4,
paddingTop: () => 6,
paddingBottom: () => 6,
} },
...(templateRegistrarName.trim()
? [{ text: `${templateRegistrarRole || 'ACADEMIC REGISTRAR'}\n${templateRegistrarName.trim().toUpperCase()}`, alignment: 'left' as const, bold: true, margin: [0, 28, 0, 0] }]
: []),
...(templateFooterText.trim() ? [{ text: templateFooterText, alignment: 'left' as const, fontSize: 8, margin: [0, 10, 0, 0] }] : []),
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
const mappings = options.curriculumCourses.filter(item => item.courseId === entry.courseId && item.programmeId === group?.programmeId)
const mapping = mappings.find(item => item.curriculumId === selectedCurriculum?.id) ?? mappings[0]
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

async function loadTemplate(overrideGroupId?: string) {
const targetGroupId = overrideGroupId ?? templateGroupId
if (!targetGroupId || !availableGroups.some(item => item.id === targetGroupId)) { setError('Choose a class from the selected programme and academic period. Its course units are still validated against the selected curriculum when saving.'); return }
setError('')
try {
const saved = await getTimetableTemplate(targetGroupId)
if (saved.layoutJson) {
const layout = JSON.parse(saved.layoutJson) as { slots?: Array<{ startTime: string; endTime: string }>; cells?: Record<string, TemplateCell>; showWeekends?: boolean; institutionName?: string; title?: string; yearLabel?: string; semesterLabel?: string; dayLabel?: string; registrarName?: string; registrarRole?: string; secondaryName?: string; secondaryRole?: string; footerText?: string; breakAfter?: number | null; breakLabel?: string; lunchAfter?: number | null; lunchLabel?: string; dayOrder?: number[] }
if (Array.isArray(layout.slots) && layout.slots.length > 0 && layout.cells && typeof layout.cells === 'object') {
setTemplateSlots(layout.slots.map(slot => ({ startTime: slot.startTime, endTime: slot.endTime })))
setTemplateCells(layout.cells)
setShowWeekends(true)
if (layout.institutionName) setTemplateInstitution(layout.institutionName)
setTemplateTitle(layout.title || `TEACHING TIME TABLE FOR ${selectedProgramme?.label || 'ENTER PROGRAMME'}`)
setTemplateYearLabel(layout.yearLabel || '')
setTemplateSemesterLabel(layout.semesterLabel || 'ENTER SEMESTER')
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
const savedDayOrder = Array.isArray(layout.dayOrder) && layout.dayOrder.length ? layout.dayOrder : [1, 2, 3, 4, 5, 6, 0]
setTemplateDayOrder([...savedDayOrder, ...[1, 2, 3, 4, 5, 6, 0].filter(day => !savedDayOrder.includes(day))])
setTemplateLoadedGroupId(targetGroupId)
setShowTemplateEditor(true)
triggerToast('Loaded official timetable sheet.')
return
}
}

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
    cells[key] = { id: entry.id, courseId: entry.courseId, teacherId: entry.teacherId, room: entry.room ?? '', sessionType: entry.sessionType ?? 'Lecture' }
  }
  setTemplateSlots(slots)
  setTemplateCells(cells)
  setTemplateTitle(`TEACHING TIME TABLE FOR ${selectedProgramme?.label || 'ENTER PROGRAMME'}`)
  setTemplateYearLabel('')
  setTemplateSemesterLabel('ENTER SEMESTER')
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
} catch (e) {
  setError(e instanceof Error ? e.message : 'Unable to load the saved timetable template.')
}


}

function changeTemplateCell(key: string, field: keyof TemplateCell, value: string) {
setTemplateCells(current => ({ ...current, [key]: { ...(current[key] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture', customTime: '', rowSpan: 1, colSpan: 1 }), [field]: value } }))
}

async function saveTemplate() {
if (!selectedCurriculum || !yearOfStudy || !curriculumSemester) { setError('Select a curriculum, year of study and curriculum semester before saving the template.'); return }
if (!templateGroupId || templateLoadedGroupId !== templateGroupId) { setError('Choose a class and load it into the template before saving.'); return }
const coveredPopulated = Object.entries(templateCells).filter(([key, cell]) => { const [day, slot] = key.split('-').map(Number); return (cell.courseId || cell.teacherId) && templateCellCovered(day, slot) })
if (coveredPopulated.length) { setError('A merged cell covers another populated lesson. Move or clear the covered lesson before saving so no scheduled session is lost.'); return }
const populated = Object.entries(templateCells).filter(([key, cell]) => { const [day, slot] = key.split('-').map(Number); return (cell.courseId || cell.teacherId) && !templateCellCovered(day, slot) })
if (templateSlots.some(slot => !slot.startTime || !slot.endTime || slot.endTime <= slot.startTime)) { setError('Every period must have an end time later than its start time.'); return }
if (populated.some(([, cell]) => !cell.courseId || !cell.teacherId)) { setError('Every filled timetable cell needs both a course unit and a tutor.'); return }

const visibleDays = templateDayOrder.filter(day => showWeekends || day <= 5)
for (const [key, cell] of populated) {
  const customTime = cell.customTime?.trim()
  if (!customTime) continue
  const match = /^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/.exec(customTime)
  if (!match) { setError('Custom time must use HH:mm–HH:mm (24-hour time), for example 08:30–10:00.'); return }
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number)
    return hours * 60 + minutes
  }
  if (toMinutes(match[1]) >= toMinutes(match[2]) || toMinutes(match[2]) > 24 * 60 || toMinutes(match[1]) < 0) {
    setError('Custom time must have a valid start time before its end time.'); return
  }
}
const entries: CreateTimetableEntry[] = populated.flatMap(([key, cell]) => {
  const [dayText, slotIndexText] = key.split('-')
  const day = Number(dayText)
  const slotIndex = Number(slotIndexText)
  const slot = templateSlots[slotIndex]
  const periodSpan = templatePeriodSpan(slotIndex, cell.colSpan)
  const lastSlot = templateSlots[slotIndex + periodSpan - 1]
  const visibleDayIndex = visibleDays.indexOf(day)
  const daySpan = Math.max(1, Math.min(visibleDays.length - visibleDayIndex, Number(cell.rowSpan) || 1))
  const customRange = cell.customTime?.trim()
    ? /^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/.exec(cell.customTime.trim())
    : null
  const sessionStart = customRange?.[1] ?? slot.startTime
  const sessionEnd = customRange?.[2] ?? lastSlot.endTime
  return Array.from({ length: daySpan }, (_, offset) => ({
    teachingGroupId: templateGroupId,
    courseId: cell.courseId,
    teacherId: cell.teacherId,
    curriculumId: selectedCurriculum.id,
    yearOfStudy: Number(yearOfStudy),
    curriculumSemesterNumber: Number(curriculumSemester),
    dayOfWeek: visibleDays[visibleDayIndex + offset],
    startTime: sessionStart + ':00',
    endTime: sessionEnd + ':00',
    room: cell.room.trim() || undefined,
    sessionType: cell.sessionType || 'Lecture',
  }))
})

setTemplateSaving(true)
setError('')
try {
  await saveTimetableTemplate(templateGroupId, entries, {
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
  triggerToast('Timetable template saved & synced.')
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
setTemplateLunchAfter(current => current === null ? null : order.indexOf(current) >= 0 ? order.indexOf(current) : null)
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

function templatePeriodSpan(slotIndex: number, requestedSpan: number | string = 1) {
let availablePeriods = templateSlots.length - slotIndex
if (templateBreakAfter !== null && slotIndex <= templateBreakAfter) {
availablePeriods = Math.min(availablePeriods, templateBreakAfter - slotIndex + 1)
}
if (templateLunchAfter !== null && slotIndex <= templateLunchAfter) {
availablePeriods = Math.min(availablePeriods, templateLunchAfter - slotIndex + 1)
}
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
const rowSpan = Math.max(1, Math.min(visibleDays.length - r, Number(source.rowSpan) || 1))
const colSpan = templatePeriodSpan(c, source.colSpan)
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

return (
<div className="timetable-screen">
  <div className="timetable-hero">
    <div>
      <p className="timetable-eyebrow">Academic planning</p>
      <h2>{readOnly ? 'Timetable' : 'Timetable management'}</h2>
      <p>Load and edit the official class timetable, assign course units and tutors independently, then save or print it.</p>
    </div>
    {!readOnly && <div className="timetable-actions">
      <button className="timetable-action primary" type="button" onClick={() => setShowGenerator(value => !value)} aria-expanded={showGenerator}>{showGenerator ? 'Hide generator' : 'Generate timetable'}</button>
      <button className="timetable-action primary" type="button" onClick={() => setShowTemplateEditor(value => !value)} aria-expanded={showTemplateEditor}>{showTemplateEditor ? 'Hide timetable designer' : 'Open timetable designer'}</button>
      <button className="timetable-action primary" type="button" onClick={() => setShowScheduleForm(value => !value)} aria-expanded={showScheduleForm}>{showScheduleForm ? 'Close form' : 'Schedule session'}</button>
    </div>}
  </div>



{error && <div className="timetable-notice" role="alert">{error}</div>}
{toastMsg && <div className="kshs-sheet-toast" role="status">{toastMsg}</div>}

<div className="timetable-metrics" aria-label="Timetable summary">
  <div className="timetable-metric"><span>Scheduled sessions</span><strong>{activeEntries.length}</strong></div>
  <div className="timetable-metric"><span>Teaching groups</span><strong>{distinctGroups}</strong></div>
  <div className="timetable-metric"><span>Assigned tutors</span><strong>{distinctTeachers}</strong></div>
  <div className="timetable-metric"><span>Practical sessions</span><strong>{practicalCount}</strong></div>
</div>

{!readOnly && selectedCurriculum && <section className="timetable-semester-templates" aria-label="Curriculum semester timetable templates">
  <div className="timetable-semester-templates-heading">
    <div><h3>{selectedCurriculum.label} · Semester templates</h3><span>{semesterTemplates.length} separate template{semesterTemplates.length === 1 ? '' : 's'} · {availableSemesters.find(item => item.id === semesterId)?.label ?? 'ENTER SEMESTER'}</span></div>
  </div>
  {semesterTemplates.length === 0 ? <p className="timetable-day-empty">This active curriculum has no semester course mappings yet. Add course units and assign each to a year and semester in Curriculum &amp; Courses; its timetable templates will appear here automatically.</p> :
    <div className="timetable-semester-template-grid">
      {semesterTemplates.map(item => {
        const matchingGroups = options.teachingGroups.filter(group => group.programmeId === selectedCurriculum?.programmeId && group.semesterId === semesterId)
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
    <label>Programme<select value={programmeId} onChange={event => { const next = event.target.value; setProgrammeId(next); setCurriculumId(options.curricula.find(item => programmeOptions.find(option => option.id === next)?.sourceIds.includes(item.programmeId))?.id ?? ''); setYearOfStudy(''); setCurriculumSemester(''); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">ENTER PROGRAMME</option>{programmeOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label>Curriculum<select value={selectedCurriculum?.id ?? ''} onChange={event => { setCurriculumId(event.target.value); setYearOfStudy(''); setCurriculumSemester(''); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">Select curriculum</option>{programmeCurricula.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label>Year of study<select value={yearOfStudy} onChange={event => { setYearOfStudy(event.target.value); setCurriculumSemester(''); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">All years</option>{studyYears.map(item => <option key={item} value={item}>Year {item}</option>)}</select></label>
    <label>Curriculum semester<select value={curriculumSemester} onChange={event => { setCurriculumSemester(event.target.value); setTeachingGroupId(''); setTemplateGroupId(''); setCourseId(''); setTemplateLoadedGroupId(''); }}><option value="">ENTER SEMESTER</option>{curriculumSemesters.map(item => <option key={item} value={item}>Semester {item}</option>)}</select></label>
    <label>Academic period<select value={semesterId} onChange={event => { setSemesterId(event.target.value); setTeachingGroupId(''); setTemplateGroupId(''); setTemplateLoadedGroupId(''); }}><option value="">ENTER SEMESTER</option>{availableSemesters.map(item => <option key={item.id} value={item.id}>{item.academicYearLabel || item.label} · {item.label} · {semesterDateRange(item)}{item.isCurrent ? ' (Current)' : ''}</option>)}</select></label>
  </div>
  <p className="timetable-generator-help">{eligibleMappings.length} curriculum course unit(s) match this selection. {availableGroups.length} operational teaching group(s) are available for the selected academic period.</p>
  {eligibleMappings.length > 0 && <p className="timetable-generator-help">Course units: {eligibleMappings.map(item => item.courseLabel).join(' · ')}</p>}
  {eligibleMappings.length === 0 && <p className="timetable-day-empty">No course units are mapped to this programme, year and semester. Add them under Curriculum &amp; Courses; unrelated courses will not be shown.</p>}
  {eligibleMappings.length > 0 && availableGroups.length === 0 && <p className="timetable-day-empty">The curriculum has course units, but no active course offerings and teaching groups match this academic period. Set up the offerings and groups before scheduling.</p>}
</section>}

{!readOnly && showGenerator && <form className="timetable-form-panel" onSubmit={handleGenerate}>
  <h3>Generate a timetable</h3>
  <div className="timetable-form-grid">
    <label>Teaching group<select value={teachingGroupId} onChange={event => setTeachingGroupId(event.target.value)}><option value="">Generate for multiple classes</option>{availableGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>{availableGroups.length === 0 && <small className="timetable-class-empty-hint">No active teaching groups are linked to this programme and academic period. Check Course Offerings and Teaching Groups.</small>}</label>
    {!teachingGroupId && <label>Number of timetables<input type="number" min="1" max={Math.max(1, availableGroups.length)} value={timetableCount} onChange={event => setTimetableCount(event.target.value)} required /></label>}
  </div>
  {!teachingGroupId && <p className="timetable-generator-help">Generates one separate timetable for each of the first N teaching groups. Available groups: {availableGroups.length}.</p>}
  <div className="timetable-form-footer">
    <button className="timetable-action primary" type="submit" disabled={loading || availableSemesters.length === 0}>{loading ? 'Generating…' : 'Generate schedule'}</button>
    {availableSemesters.length === 0 && <span className="timetable-day-empty">No academic periods were returned. Create a period under Academic Periods, then reload this screen.</span>}
  </div>
</form>}

{!readOnly && showTemplateEditor && <section className={`timetable-template-editor kshs-official-sheet-wrap ${sheetEditingMode ? 'is-sheet-editing' : ''}`} aria-label="Editable timetable template">
  <div className="kshs-sheet-toolbar">
    <div className="kshs-sheet-toolbar-group">
      <span className="kshs-sheet-badge">Official Sheet Designer</span>
      <select
        className="kshs-sheet-select"
        aria-label="Class or teaching group"
        value={templateGroupId}
        onChange={event => {
          const next = event.target.value
          setTemplateGroupId(next)
          setTemplateLoadedGroupId('')
          setTemplateCells({})
          setTemplateSlots(defaultTemplateSlots)
          if (next) void loadTemplate(next)
        }}
      >
        <option value="">Select class / teaching group</option>
        {availableGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <button className="kshs-sheet-btn" type="button" onClick={() => void loadTemplate()} disabled={!templateGroupId}>
        <Pencil size={14} /> Load Class
      </button>
      <label className="kshs-sheet-weekend-pill">
        <input type="checkbox" checked={showWeekends} onChange={event => setShowWeekends(event.target.checked)} />
        <span>Sat &amp; Sun</span>
      </label>
    </div>

    <div className="kshs-sheet-toolbar-group">
      <button
        type="button"
        className={`kshs-sheet-btn ${sheetEditingMode ? 'is-amber' : ''}`}
        onClick={() => setSheetEditingMode(v => !v)}
      >
        <Pencil size={14} /> {sheetEditingMode ? 'Editing On' : 'Preview Mode'}
      </button>
      <button type="button" className="kshs-sheet-btn" onClick={() => setShowColumnsModal(true)}>
        <Columns size={14} /> Columns &amp; Breaks
      </button>
      <button
        className="kshs-sheet-btn is-primary"
        type="button"
        onClick={() => void saveTemplate()}
        disabled={!templateGroupId || templateLoadedGroupId !== templateGroupId || templateSaving || !availableCourses.length || !options.teachers.length}
      >
        <Save size={14} /> {templateSaving ? 'Saving…' : 'Save Template'}
      </button>
      <button className="kshs-sheet-btn" type="button" onClick={printTimetableTemplate} disabled={!institutionLoaded || !institution.isActive}>
        <Printer size={14} /> Print / PDF
      </button>
    </div>
  </div>

  {templateGroupId && templateLoadedGroupId !== templateGroupId && (
    <p className="timetable-generator-help" style={{ marginBottom: '12px' }}>Click “Load Class” to fill the sheet with that class’s saved sessions before editing.</p>
  )}

  {templateGroupId && templateLoadedGroupId === templateGroupId && (
    <article className="kshs-official-paper">
      <div
        className="kshs-official-masthead"
        onClick={() => sheetEditingMode && setShowHeaderModal(true)}
        title={sheetEditingMode ? 'Click to edit School Name, Programme Title, Academic Year & Semester' : undefined}
      >
        {institutionLoaded && institution.isActive && institution.logoPath && (
          <img className="timetable-institution-logo" src={institution.logoPath} alt={institution.institutionName + ' logo'} style={{ margin: '0 auto 6px', display: 'block' }} />
        )}
        <div className="kshs-masthead-line kshs-masthead-inst">
          {templateInstitution || (institutionLoaded && institution.isActive ? institution.institutionName : 'KAMPALA SCHOOL OF HEALTH SCIENCES')}
        </div>
        <div className="kshs-masthead-line kshs-masthead-sub">
          {templateTitle}
        </div>
        <div className="kshs-masthead-line kshs-masthead-meta">
          {templateYearLabel || `ACADEMIC YEAR ${academicYearLabel}`}
        </div>
        <div className="kshs-masthead-line kshs-masthead-meta">
          {templateSemesterLabel || `${selectedSemester?.label ?? 'ENTER SEMESTER'}${yearOfStudy || curriculumSemester ? ` · YEAR ${yearOfStudy || '—'} SEMESTER ${curriculumSemester || '—'}` : ''}`}
        </div>
      </div>

      <div className="timetable-grid-scroll">
        <table className="kshs-matrix-table">
          <thead>
            <tr>
              <th
                className="kshs-matrix-day-head"
                onClick={() => sheetEditingMode && setShowHeaderModal(true)}
                title={sheetEditingMode ? 'Click to edit corner label' : undefined}
              >
                {templateDayLabel || 'DAY'}
              </th>
              {templateSlots.map((slot, index) => (
                <React.Fragment key={index}>
                  <th
                    className="kshs-matrix-slot-head"
                    onClick={() => sheetEditingMode && setShowColumnsModal(true)}
                    title={sheetEditingMode ? 'Click to edit lecture time slots' : undefined}
                  >
                    {formatSlotRange12(slot.startTime, slot.endTime)}
                  </th>
                  {templateBreakAfter === index && (
                    <th
                      className="kshs-matrix-divider"
                      onClick={() => sheetEditingMode && setShowColumnsModal(true)}
                      title={sheetEditingMode ? 'Click to configure Break / Lunch dividers' : undefined}
                    >
                      {(templateBreakLabel || 'BREAK')[0]}
                    </th>
                  )}
                  {templateLunchAfter === index && templateLunchAfter !== templateBreakAfter && (
                    <th
                      className="kshs-matrix-divider"
                      onClick={() => sheetEditingMode && setShowColumnsModal(true)}
                      title={sheetEditingMode ? 'Click to configure Break / Lunch dividers' : undefined}
                    >
                      {(templateLunchLabel || 'LUNCH')[0]}
                    </th>
                  )}
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {templateDayOrder.filter(day => showWeekends || day <= 5).map((day, rowIndex, visibleRows) => (
              <tr key={day}>
                <th className="kshs-matrix-day-cell">
                  <div>{shortDays[day] || days[day].toUpperCase()}</div>
                  {sheetEditingMode && (
                    <div className="timetable-day-tools">
                      <button type="button" onClick={() => moveTemplateDay(day, -1)} disabled={rowIndex === 0} aria-label={`Move ${days[day]} up`}>↑</button>
                      <button type="button" onClick={() => moveTemplateDay(day, 1)} disabled={rowIndex === visibleRows.length - 1} aria-label={`Move ${days[day]} down`}>↓</button>
                    </div>
                  )}
                </th>

                {templateSlots.map((slot, slotIndex) => {
                  const key = day + '-' + slotIndex
                  const cell = templateCells[key] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture', customTime: '', rowSpan: 1, colSpan: 1 }
                  const rowSpan = Math.max(1, Math.min(visibleRows.length - rowIndex, Number(cell.rowSpan) || 1))
                  const colSpan = templatePeriodSpan(slotIndex, cell.colSpan)
                  const courseName = cell.courseId ? (courseLabels.get(cell.courseId) ?? 'ENTER COURSE UNIT') : ''
                  const tutorName = cell.teacherId ? (teacherLabels.get(cell.teacherId) ?? 'TUTOR') : ''
                  const hasContent = Boolean(courseName || tutorName || cell.room || cell.customTime)
                  const metaLine = [cell.customTime, cell.room, cell.sessionType && cell.sessionType !== 'Lecture' ? cell.sessionType : ''].filter(Boolean).join(' • ')
                  const isInlineTutorOpen = inlineTutorTarget === key

                  return (
                    <React.Fragment key={slotIndex}>
                      {!templateCellCovered(day, slotIndex) && (
                        <td
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                          colSpan={colSpan > 1 ? colSpan : undefined}
                          className="kshs-matrix-lecture-cell"
                          onClick={() => {
                            if (sheetEditingMode) {
                              setActiveTemplateCellKey(key)
                            }
                          }}
                        >
                          {hasContent ? (
                            <>
                              <div
                                className="kshs-matrix-course"
                                title={sheetEditingMode ? 'Click to edit Course Unit' : undefined}
                              >
                                {courseName}
                              </div>

                              {isInlineTutorOpen && sheetEditingMode ? (
                                <select
                                  className="kshs-inline-tutor-select"
                                  autoFocus
                                  value={cell.teacherId}
                                  onClick={event => event.stopPropagation()}
                                  onChange={event => {
                                    changeTemplateCell(key, 'teacherId', event.target.value)
                                    setInlineTutorTarget(null)
                                    triggerToast('Tutor updated independently.')
                                  }}
                                  onBlur={() => setInlineTutorTarget(null)}
                                >
                                  <option value="">-- TUTOR --</option>
                                  {options.teachers.map(item => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <div
                                  className="kshs-matrix-tutor"
                                  onClick={event => {
                                    if (sheetEditingMode) {
                                      event.stopPropagation()
                                      setInlineTutorTarget(key)
                                    }
                                  }}
                                  title={sheetEditingMode ? 'Click to change Tutor alone' : undefined}
                                >
                                  {tutorName ? `(${tutorName})` : courseName ? '(TUTOR)' : ''}
                                </div>
                              )}

                              {metaLine && <div className="kshs-matrix-meta">{metaLine}</div>}
                              {cell.id && <small className="timetable-template-existing">Saved</small>}
                            </>
                          ) : (
                            sheetEditingMode && <span className="kshs-matrix-empty">+ Edit</span>
                          )}
                        </td>
                      )}

                      {templateBreakAfter === slotIndex && rowIndex === 0 && (
                        <td rowSpan={visibleRows.length} className="kshs-matrix-divider" onClick={() => sheetEditingMode && setShowColumnsModal(true)}>
                          <div className="kshs-divider-letters">
                            {(templateBreakLabel || 'BREAK').slice(1).split('').map((letter, letterIndex) => (
                              <span key={letterIndex}>{letter}</span>
                            ))}
                          </div>
                        </td>
                      )}

                      {templateLunchAfter === slotIndex && templateLunchAfter !== templateBreakAfter && rowIndex === 0 && (
                        <td rowSpan={visibleRows.length} className="kshs-matrix-divider" onClick={() => sheetEditingMode && setShowColumnsModal(true)}>
                          <div className="kshs-divider-letters">
                            {(templateLunchLabel || 'LUNCH').slice(1).split('').map((letter, letterIndex) => (
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

      <footer
        className="kshs-official-footer"
        onClick={() => sheetEditingMode && setShowRegistrarModal(true)}
        title={sheetEditingMode ? 'Click to configure Academic Registrar signature block' : undefined}
      >
        {!templateRegistrarName.trim() && !templateSecondaryName.trim() ? (
          sheetEditingMode && (
            <span className="kshs-matrix-empty">
              No Academic Registrar registered in system (click here to register)
            </span>
          )
        ) : (
          <>
            {templateRegistrarName.trim() && (
              <div className="kshs-registrar-sign-block">
                <div className="kshs-registrar-dotted-line" />
                <div className="kshs-registrar-label">{templateRegistrarRole || 'ACADEMIC REGISTRAR'}</div>
                <div className="kshs-registrar-label">{templateRegistrarName}</div>
              </div>
            )}
            {templateSecondaryName.trim() && (
              <div className="kshs-registrar-sign-block">
                <div className="kshs-registrar-dotted-line" />
                <div className="kshs-registrar-label">{templateSecondaryRole}</div>
                <div className="kshs-registrar-label">{templateSecondaryName}</div>
              </div>
            )}
          </>
        )}
        {templateFooterText.trim() && <span style={{ fontSize: '0.78rem', color: '#334155' }}>{templateFooterText}</span>}
      </footer>
    </article>
  )}

  {activeTemplateCellKey && (() => {
    const [dayValue, slotValue] = activeTemplateCellKey.split('-').map(Number)
    const slot = templateSlots[slotValue]
    const cell = templateCells[activeTemplateCellKey] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture', customTime: '', rowSpan: 1, colSpan: 1 }
    if (!slot) return null
    return <div className="timetable-cell-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setActiveTemplateCellKey(null) }}>
      <section className="timetable-cell-modal" role="dialog" aria-modal="true" aria-labelledby="timetable-cell-modal-title">
        <header><div><h3 id="timetable-cell-modal-title">Edit timetable period</h3><p>{days[dayValue]} · {formatSlotRange12(slot.startTime, slot.endTime)}</p></div><button type="button" aria-label="Close period editor" onClick={() => setActiveTemplateCellKey(null)}>×</button></header>
        <div className="timetable-cell-modal-fields">
          <label>1. Course unit (from system registry)<select aria-label="Course unit" value={cell.courseId} onChange={event => changeTemplateCell(activeTemplateCellKey, 'courseId', event.target.value)}><option value="">ENTER COURSE UNIT</option>{(availableCourses.length ? availableCourses : options.courses).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>2. Tutor / lecturer (editable independently)<select aria-label="Lecturer / teacher" value={cell.teacherId} onChange={event => changeTemplateCell(activeTemplateCellKey, 'teacherId', event.target.value)}><option value="">TUTOR</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Room / venue<input aria-label="Room / venue" value={cell.room} onChange={event => changeTemplateCell(activeTemplateCellKey, 'room', event.target.value)} placeholder="Enter room or laboratory"/></label>
          <label>Custom time (optional, 24-hour)<input aria-label="Custom time" value={cell.customTime ?? ''} onChange={event => changeTemplateCell(activeTemplateCellKey, 'customTime', event.target.value)} placeholder="08:30–10:00" /></label>
          <label>Session type<select aria-label="Session type" value={cell.sessionType} onChange={event => changeTemplateCell(activeTemplateCellKey, 'sessionType', event.target.value)}><option>Lecture</option><option>Practical</option><option>Tutorial</option><option>Seminar</option><option>Examination</option><option>Other</option></select></label>
          <label>Merge down (days)<select aria-label="Merge down (days)" value={Number(cell.rowSpan) || 1} onChange={event => changeTemplateCell(activeTemplateCellKey, 'rowSpan', event.target.value)}>{[1,2,3,4,5,6,7].slice(0, templateDayOrder.filter(item => showWeekends || item <= 5).length - templateDayOrder.filter(item => showWeekends || item <= 5).indexOf(dayValue)).map(value => <option key={value} value={value}>{value} day(s)</option>)}</select></label>
          <label>Merge across periods<select aria-label="Merge across periods" value={Number(cell.colSpan) || 1} onChange={event => changeTemplateCell(activeTemplateCellKey, 'colSpan', event.target.value)}>{[1,2,3,4,5,6,7].slice(0, templateSlots.length - slotValue).map(value => <option key={value} value={value}>{value} period(s)</option>)}</select></label>
        </div>
        <footer>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" className="timetable-cell-clear" onClick={() => { changeTemplateCell(activeTemplateCellKey, 'courseId', ''); changeTemplateCell(activeTemplateCellKey, 'teacherId', ''); changeTemplateCell(activeTemplateCellKey, 'room', ''); changeTemplateCell(activeTemplateCellKey, 'customTime', ''); changeTemplateCell(activeTemplateCellKey, 'sessionType', 'Lecture'); changeTemplateCell(activeTemplateCellKey, 'rowSpan', '1'); changeTemplateCell(activeTemplateCellKey, 'colSpan', '1'); triggerToast('Period cleared.') }}>Clear</button>
            <button type="button" className="timetable-action" style={{ minHeight: '38px', padding: '6px 12px' }} onClick={() => { setClipboardCell({ ...cell }); triggerToast('Period copied.') }}>Copy</button>
            <button type="button" className="timetable-action" style={{ minHeight: '38px', padding: '6px 12px' }} onClick={() => { if (!clipboardCell) { triggerToast('Nothing copied yet.'); return } setTemplateCells(prev => ({ ...prev, [activeTemplateCellKey]: { ...clipboardCell, rowSpan: 1, colSpan: 1 } })); triggerToast('Period pasted.') }}>Paste</button>
          </div>
          <button type="button" className="timetable-cell-done" onClick={() => setActiveTemplateCellKey(null)}>Done</button>
        </footer>
      </section>
    </div>
  })()}

  {showHeaderModal && (
    <div className="timetable-cell-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowHeaderModal(false) }}>
      <section className="timetable-cell-modal" role="dialog" aria-modal="true" aria-labelledby="kshs-header-modal-title">
        <header><div><h3 id="kshs-header-modal-title">Edit School &amp; Programme Header</h3><p>Customize the official document masthead</p></div><button type="button" aria-label="Close header editor" onClick={() => setShowHeaderModal(false)}>×</button></header>
        <div className="timetable-cell-modal-fields">
          <label>School / institution name<input value={templateInstitution} onChange={event => setTemplateInstitution(event.target.value)} /></label>
          <label>Timetable title &amp; programme<input value={templateTitle} onChange={event => setTemplateTitle(event.target.value)} placeholder="TEACHING TIME TABLE FOR ENTER PROGRAMME" /></label>
          <label>Corner day label<input value={templateDayLabel} onChange={event => setTemplateDayLabel(event.target.value)} maxLength={20} /></label>
          <label>Academic year line<input value={templateYearLabel} onChange={event => setTemplateYearLabel(event.target.value)} placeholder={`ACADEMIC YEAR ${academicYearLabel}`} /></label>
          <label>Semester / class line<input value={templateSemesterLabel} onChange={event => setTemplateSemesterLabel(event.target.value)} placeholder="ENTER SEMESTER" /></label>
        </div>
        <footer><span /><button type="button" className="timetable-cell-done" onClick={() => setShowHeaderModal(false)}>Done</button></footer>
      </section>
    </div>
  )}

  {showColumnsModal && (
    <div className="timetable-cell-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowColumnsModal(false) }}>
      <section className="timetable-cell-modal" role="dialog" aria-modal="true" aria-labelledby="kshs-cols-modal-title">
        <header><div><h3 id="kshs-cols-modal-title">Manage Time Columns &amp; Dividers</h3><p>Configure period times and vertical BREAK / LUNCH columns</p></div><button type="button" aria-label="Close columns manager" onClick={() => setShowColumnsModal(false)}>×</button></header>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {templateSlots.map((slot, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '58px', color: '#475569' }}>SLOT {index + 1}</span>
              <input type="time" value={slot.startTime} onChange={event => setTemplateSlots(current => current.map((item, idx) => idx === index ? { ...item, startTime: event.target.value } : item))} style={{ padding: '6px', border: '1px solid #b9c1cb', borderRadius: '4px' }} />
              <span>–</span>
              <input type="time" value={slot.endTime} onChange={event => setTemplateSlots(current => current.map((item, idx) => idx === index ? { ...item, endTime: event.target.value } : item))} style={{ padding: '6px', border: '1px solid #b9c1cb', borderRadius: '4px' }} />
              <button type="button" className="timetable-action" style={{ minHeight: '32px', padding: '4px 8px' }} onClick={() => moveTemplateSlot(index, -1)} disabled={index === 0}>←</button>
              <button type="button" className="timetable-action" style={{ minHeight: '32px', padding: '4px 8px' }} onClick={() => moveTemplateSlot(index, 1)} disabled={index === templateSlots.length - 1}>→</button>
              <button type="button" className="timetable-cell-clear" style={{ minHeight: '32px', padding: '4px 8px' }} onClick={() => removeTemplateSlot(index)} disabled={templateSlots.length <= 1}>×</button>
            </div>
          ))}
          <button type="button" className="timetable-action" onClick={() => setTemplateSlots(current => [...current, { startTime: '16:30', endTime: '18:00' }])}>+ Add lecture time slot</button>

          <div className="timetable-cell-modal-fields" style={{ padding: '10px 0 0' }}>
            <span style={{ display: 'none' }} />
            <span style={{ display: 'none' }} />
            <span style={{ display: 'none' }} />
            <label>Vertical break after<select value={templateBreakAfter ?? ''} onChange={event => setTemplateBreakAfter(event.target.value === '' ? null : Number(event.target.value))}><option value="">None</option>{templateSlots.map((_, idx) => <option key={idx} value={idx}>After slot {idx + 1}</option>)}</select></label>
            <label>Break label<input value={templateBreakLabel} onChange={event => setTemplateBreakLabel(event.target.value)} maxLength={20} /></label>
            <label>Vertical lunch after<select value={templateLunchAfter ?? ''} onChange={event => setTemplateLunchAfter(event.target.value === '' ? null : Number(event.target.value))}><option value="">None</option>{templateSlots.map((_, idx) => <option key={idx} value={idx}>After slot {idx + 1}</option>)}</select></label>
            <label>Lunch label<input value={templateLunchLabel} onChange={event => setTemplateLunchLabel(event.target.value)} maxLength={20} /></label>
          </div>
        </div>
        <footer><span /><button type="button" className="timetable-cell-done" onClick={() => setShowColumnsModal(false)}>Done</button></footer>
      </section>
    </div>
  )}

  {showRegistrarModal && (
    <div className="timetable-cell-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowRegistrarModal(false) }}>
      <section className="timetable-cell-modal" role="dialog" aria-modal="true" aria-labelledby="kshs-reg-modal-title">
        <header><div><h3 id="kshs-reg-modal-title">Academic Registrar Signature Block</h3><p>Leave blank to keep the footer completely empty</p></div><button type="button" aria-label="Close registrar editor" onClick={() => setShowRegistrarModal(false)}>×</button></header>
        <div className="timetable-cell-modal-fields">
          <label>Academic Registrar full name<input value={templateRegistrarName} onChange={event => setTemplateRegistrarName(event.target.value)} placeholder="Leave empty for blank footer" maxLength={120} /></label>
          <label>Official title<input value={templateRegistrarRole} onChange={event => setTemplateRegistrarRole(event.target.value)} maxLength={80} /></label>
          <label>Optional footer note<input value={templateFooterText} onChange={event => setTemplateFooterText(event.target.value)} placeholder="Leave empty for clean official sheet" maxLength={160} /></label>
          <label>Secondary signatory (optional)<input value={templateSecondaryName} onChange={event => setTemplateSecondaryName(event.target.value)} maxLength={120} /></label>
          <label>Secondary title (optional)<input value={templateSecondaryRole} onChange={event => setTemplateSecondaryRole(event.target.value)} maxLength={80} /></label>
        </div>
        <footer>
          <button type="button" className="timetable-cell-clear" onClick={() => { setTemplateRegistrarName(''); setTemplateSecondaryName(''); setTemplateFooterText(''); setShowRegistrarModal(false) }}>Clear / Blank</button>
          <button type="button" className="timetable-cell-done" onClick={() => setShowRegistrarModal(false)}>Done</button>
        </footer>
      </section>
    </div>
  )}
</section>}

{!readOnly && showScheduleForm && <form className="timetable-form-panel" onSubmit={submit}>
  <h3>{editingEntryId ? 'Edit teaching session' : 'Schedule a teaching session'}</h3>
  <div className="timetable-form-grid">
    <label>Teaching group<select value={teachingGroupId} onChange={event => { const next = event.target.value; setTeachingGroupId(next); setCourseId(options.teachingGroups.find(item => item.id === next)?.courseId ?? ''); }} required><option value="">Select group</option>{availableGroups.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label>Course unit<select value={courseId} onChange={event => setCourseId(event.target.value)} required><option value="">ENTER COURSE UNIT</option>{selectedGroupCourses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label>Tutor / staff<select value={teacherId} onChange={event => setTeacherId(event.target.value)} required><option value="">TUTOR</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
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
      <div className="timetable-class-document-heading"><div className="timetable-class-document-identity"><div className="timetable-official-identity">{institutionLoaded && institution.isActive && institution.logoPath && <img className="timetable-institution-logo" src={institution.logoPath} alt={institution.institutionName + ' logo'} />}<div className="timetable-official-identity-copy"><h4>{institutionLoaded && institution.isActive ? institution.institutionName : 'Institution settings loading…'}</h4>{institutionLoaded && institution.isActive && institution.motto && <span className="timetable-institution-motto">{institution.motto}</span>}{institutionLoaded && institution.isActive && <span className="timetable-institution-contact">{[institution.address, institution.phone, institution.email].filter(value => Boolean(value?.trim())).join(' · ')}</span>}</div></div><strong>{selectedProgramme?.label ?? 'ENTER PROGRAMME'} · {groupLabel}</strong><span>ACADEMIC YEAR {academicYearLabel} · {selectedSemester?.label ?? 'ENTER SEMESTER'} · YEAR {yearOfStudy} · CURRICULUM SEMESTER {curriculumSemester}</span><span>VALID FOR: {semesterDateRange(selectedSemester)}</span></div>
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
                  <strong>{courseLabels.get(entry.courseId) ?? 'ENTER COURSE UNIT'}</strong>
                  <span>{teacherLabels.get(entry.teacherId) ?? 'TUTOR'}</span>
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
    <label className="timetable-weekend-toggle"><input type="checkbox" checked={showWeekends} onChange={event => setShowWeekends(event.target.checked)} /> Show weekend days (Saturday &amp; Sunday)</label>
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
    <article><strong>{options.programmes.length}</strong><span>Programmes</span><small>{options.programmes.slice(0, 5).map(item => item.label).join(' · ') || 'ENTER PROGRAMME'}</small></article>
    <article><strong>{options.curricula.length}</strong><span>Curricula</span><small>{options.curricula.slice(0, 5).map(item => item.label).join(' · ') || 'No curricula returned'}</small></article>
    <article><strong>{options.courses.length}</strong><span>Course units</span><small>{options.courses.slice(0, 5).map(item => item.label).join(' · ') || 'ENTER COURSE UNIT'}</small></article>
    <article><strong>{options.teachers.length}</strong><span>Staff / tutors</span><small>{options.teachers.slice(0, 5).map(item => item.label).join(' · ') || 'TUTOR'}</small></article>
    <article><strong>{options.teachingGroups.length}</strong><span>Teaching groups</span><small>{options.teachingGroups.slice(0, 5).map(item => item.label).join(' · ') || 'No teaching groups returned'}</small></article>
    <article><strong>{options.semesters.length}</strong><span>Academic periods</span><small>{options.semesters.slice(0, 5).map(item => item.label).join(' · ') || 'ENTER SEMESTER'}</small></article>
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
    <strong className="timetable-document-programme">{selectedProgramme?.label ?? 'ENTER PROGRAMME'}</strong>
    <small>ACADEMIC YEAR {academicYearLabel} · {selectedSemester?.label ?? 'ENTER SEMESTER'} · VALID FOR {semesterDateRange(selectedSemester)}</small>
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
              <strong>{courseLabels.get(entry.courseId) ?? 'ENTER COURSE UNIT'}</strong>
              <span>{groupLabels.get(entry.teachingGroupId) ?? 'Teaching group'}</span>
              <span>{teacherLabels.get(entry.teacherId) ?? 'TUTOR'}</span>
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
  <div className="timetable-document-footer"><span>Prepared for academic use</span><span>{templateRegistrarName.trim() ? `${templateRegistrarRole || 'ACADEMIC REGISTRAR'}: ${templateRegistrarName.trim().toUpperCase()}` : ''}</span></div>
  <div className="timetable-document-print-actions"><button type="button" className="timetable-action" onClick={() => printInstitutionalPdf(timetablePdfOptions((availableSemesters.find(item => item.id === semesterId)?.label ?? 'ENTER SEMESTER') + ' Timetable', orderedEntries, 'school-timetable'))} disabled={!institutionLoaded || !institution.isActive}>Print timetable</button></div>
</div> : <div className="timetable-table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Room</th><th>Type</th><th>Teaching group</th><th>Course unit</th><th>Tutor</th>{!readOnly && <th>Actions</th>}</tr></thead><tbody>
  {orderedEntries.map(entry => <tr key={entry.id}><td>{days[entry.dayOfWeek] ?? '—'}</td><td>{timeRange(entry)}</td><td>{entry.room || '—'}</td><td>{entry.sessionType || '—'}</td><td>{groupLabels.get(entry.teachingGroupId) ?? 'Group not found'}</td><td>{courseLabels.get(entry.courseId) ?? 'ENTER COURSE UNIT'}</td><td>{teacherLabels.get(entry.teacherId) ?? 'TUTOR'}</td>{!readOnly && <td><button className="timetable-action" type="button" onClick={() => void editEntry(entry)}><Pencil size={14} /> Edit</button><button className="timetable-action" type="button" onClick={() => void remove(entry.id)}><Trash2 /> Remove</button></td>}</tr>)}
</tbody></table></div>}
</div>
)
}