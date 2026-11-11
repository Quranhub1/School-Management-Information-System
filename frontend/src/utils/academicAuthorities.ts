export type AcademicAuthority = string

export function resolveAcademicAuthority(regulator?: string | null): AcademicAuthority {
  const value = (regulator ?? '').trim()
  return value.toUpperCase().replace(/[ -]+/g, '_')
}

// Kept only as a compatibility type during migration. Programme and admission
// authority choices are now loaded from /api/academic-authorities.
export const VERIFIED_ACADEMIC_COURSES: { authority: AcademicAuthority; name: string }[] = []
