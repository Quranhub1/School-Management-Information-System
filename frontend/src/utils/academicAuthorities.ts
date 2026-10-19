export type AcademicAuthority = 'School-based' | 'UHPAB' | 'UVTAB' | 'UNMEB'

export const ACADEMIC_AUTHORITY_OPTIONS: { value: AcademicAuthority; label: string }[] = [
  { value: 'School-based', label: 'School-based curriculum' },
  { value: 'UHPAB', label: 'UHPAB — Health programmes' },
  { value: 'UVTAB', label: 'UVTAB — Vocational & technical' },
  { value: 'UNMEB', label: 'UNMEB — Legacy records' },
]

export function resolveAcademicAuthority(regulator?: string | null): AcademicAuthority {
  const value = (regulator ?? '').toUpperCase()
  if (value.includes('UHPAB')) return 'UHPAB'
  if (value.includes('UVTAB')) return 'UVTAB'
  if (value.includes('UNMEB')) return 'UNMEB'
  return 'School-based'
}
