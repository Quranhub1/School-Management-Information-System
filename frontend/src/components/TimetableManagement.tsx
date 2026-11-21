// ... existing code ...
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
return ${h12}:${mStr || '00'} ${period}
}
const formatSlotRange12 = (startTime: string, endTime: string) => ${format12Hour(startTime)} – ${format12Hour(endTime)}
const formatSemesterDate = (value?: string) => {
if (!value) return ''
const date = new Date(value.slice(0, 10) + 'T00:00:00')
return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const semesterDateRange = (semester?: TimetableOptions['semesters'][number]) => semester?.startDate && semester?.endDate
? ${formatSemesterDate(semester.startDate)} – ${formatSemesterDate(semester.endDate)}
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
// ... existing code ...
useEffect(() => {
setLoading(true)
void load().finally(() => setLoading(false))
}, [load])

useEffect(() => {
if (institutionLoaded && institution.isActive && institution.institutionName) {
setTemplateInstitution(institution.institutionName.toUpperCase())
}
}, [institutionLoaded, institution])
// ... existing code ...
return {
title,
filename,
orientation: 'landscape' as const,
institutionName: institutionLoaded && institution.isActive ? institution.institutionName : undefined,
motto: institutionLoaded && institution.isActive ? institution.motto : undefined,
contactLines: institutionLoaded && institution.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
accentColor: institutionLoaded && institution.isActive ? institution.primaryColor : undefined,
content: [
{ text: ACADEMIC YEAR ${academicYearLabel} · ${selectedSemester?.label ?? 'Academic period'} · VALID FOR ${semesterDateRange(selectedSemester)}, alignment: 'center', fontSize: 9, margin: [0, 0, 0, 10] },
{ table: { headerRows: 1, widths: ['auto', ...printableSlots.map(() => '')], body: timetableBody }, layout: {
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
? [{ text: ${templateRegistrarRole || 'ACADEMIC REGISTRAR'}: ${templateRegistrarName.trim().toUpperCase()}, alignment: 'left' as const, margin: [0, 28, 0, 0] }]
: []),
],
}
}
// ... existing code ...
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
const cName = cell?.courseId ? (courseLabels.get(cell.courseId) ?? '') : ''
const tName = cell?.teacherId ? (${teacherLabels.get(cell.teacherId) ?? ''}) : ''
const text = cell ? [
cName,
tName,
cell.customTime || '',
cell.room ? Venue: ${cell.room} : '',
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
{ text: ${templateYearLabel || ACADEMIC YEAR ${academicYearLabel}} · ${templateSemesterLabel || selectedSemester?.label || ''}, alignment: 'center', fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
{ table: { headerRows: 1, widths: ['auto', ...templateSlots.flatMap((_, index) => {
const cols: Array<string | number> = ['']
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
? [{ text: ${templateRegistrarRole || 'ACADEMIC REGISTRAR'}\n${templateRegistrarName.trim().toUpperCase()}, alignment: 'left' as const, bold: true, margin: [0, 28, 0, 0] }]
: []),
...(templateFooterText.trim() ? [{ text: templateFooterText, alignment: 'left' as const, fontSize: 8, margin: [0, 10, 0, 0] }] : []),
],
})
}
// ... existing code ...
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
setTemplateTitle(layout.title || TEACHING TIME TABLE FOR ${selectedProgramme?.label || 'ENTER PROGRAMME'})
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

  // Backward-compatible fallback for groups that have lessons but no saved layout yet.
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
// ... existing code ...
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
// ... existing code ...
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
// ... existing code ...
{error && {error}}
{toastMsg && {toastMsg}}

<div className="timetable-metrics" aria-label="Timetable summary">


// ... existing code ...
{!readOnly && showTemplateEditor && <section className={timetable-template-editor kshs-official-sheet-wrap ${sheetEditingMode ? 'is-sheet-editing' : ''}} aria-label="Editable timetable template">


Official Sheet Designer
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
Select class / teaching group
{availableGroups.map(item => {item.label})}

<button className="kshs-sheet-btn" type="button" onClick={() => void loadTemplate()} disabled={!templateGroupId}>
 Load Class


<input type="checkbox" checked={showWeekends} onChange={event => setShowWeekends(event.target.checked)} />
Sat & Sun



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
                                  <option value="">-- No Tutor --</option>
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
                                  {tutorName ? `(${tutorName})` : courseName ? '(+ Assign Tutor)' : ''}
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

  {/* Modal 1: Cell Editor with Independent Course Unit & Tutor Selectors + Copy/Paste */}
  {activeTemplateCellKey && (() => {
    const [dayValue, slotValue] = activeTemplateCellKey.split('-').map(Number)
    const slot = templateSlots[slotValue]
    const cell = templateCells[activeTemplateCellKey] ?? { courseId: '', teacherId: '', room: '', sessionType: 'Lecture', customTime: '', rowSpan: 1, colSpan: 1 }
    if (!slot) return null
    return <div className="timetable-cell-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setActiveTemplateCellKey(null) }}>
      <section className="timetable-cell-modal" role="dialog" aria-modal="true" aria-labelledby="timetable-cell-modal-title">
        <header><div><h3 id="timetable-cell-modal-title">Edit timetable period</h3><p>{days[dayValue]} · {formatSlotRange12(slot.startTime, slot.endTime)}</p></div><button type="button" aria-label="Close period editor" onClick={() => setActiveTemplateCellKey(null)}>×</button></header>
        <div className="timetable-cell-modal-fields">
          <label>1. Course unit (from system registry)<select aria-label="Course unit" value={cell.courseId} onChange={event => changeTemplateCell(activeTemplateCellKey, 'courseId', event.target.value)}><option value="">— Select course unit —</option>{(availableCourses.length ? availableCourses : options.courses).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>2. Tutor / lecturer (editable independently)<select aria-label="Lecturer / teacher" value={cell.teacherId} onChange={event => changeTemplateCell(activeTemplateCellKey, 'teacherId', event.target.value)}><option value="">— Select tutor / lecturer —</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Room / venue<input aria-label="Room / venue" value={cell.room} onChange={event => changeTemplateCell(activeTemplateCellKey, 'room', event.target.value)} placeholder="Enter room or laboratory"/></label>
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

  {/* Modal 2: School, Programme Title & Header Editor */}
  {showHeaderModal && (
    <div className="timetable-cell-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowHeaderModal(false) }}>
      <section className="timetable-cell-modal" role="dialog" aria-modal="true" aria-labelledby="kshs-header-modal-title">
        <header><div><h3 id="kshs-header-modal-title">Edit School &amp; Programme Header</h3><p>Customize the official document masthead</p></div><button type="button" aria-label="Close header editor" onClick={() => setShowHeaderModal(false)}>×</button></header>
        <div className="timetable-cell-modal-fields">
          <label>School / institution name<input value={templateInstitution} onChange={event => setTemplateInstitution(event.target.value)} /></label>
          <label>Timetable title &amp; programme<input value={templateTitle} onChange={event => setTemplateTitle(event.target.value)} /></label>
          <label>Corner day label<input value={templateDayLabel} onChange={event => setTemplateDayLabel(event.target.value)} maxLength={20} /></label>
          <label>Academic year line<input value={templateYearLabel} onChange={event => setTemplateYearLabel(event.target.value)} placeholder={`ACADEMIC YEAR ${academicYearLabel}`} /></label>
          <label>Semester / class line<input value={templateSemesterLabel} onChange={event => setTemplateSemesterLabel(event.target.value)} placeholder="ENTER SEMESTER" /></label>
        </div>
        <footer><span /><button type="button" className="timetable-cell-done" onClick={() => setShowHeaderModal(false)}>Done</button></footer>
      </section>
    </div>
  )}

  {/* Modal 3: Lecture Time Columns & Vertical Break/Lunch Dividers */}
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

  {/* Modal 4: Academic Registrar Footer (Blank unless registered) */}
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


// ... existing code ...
