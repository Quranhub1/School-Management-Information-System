export type AcademicAuthority = string

export function resolveAcademicAuthority(regulator?: string | null): AcademicAuthority {
  const value = (regulator ?? '').trim()
  if (!value) return ''
  const normalized = value.toUpperCase().replace(/[ -]+/g, '_')
  if (normalized === 'SCHOOL' || normalized === 'SCHOOL_BASED' || normalized === 'SCHOOLBASED') return 'SCHOOL_BASED'
  return normalized
}
