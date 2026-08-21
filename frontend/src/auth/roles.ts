export const ROLES = {
  systemAdministrator: 'SystemAdministrator',
  registrar: 'Registrar',
  academicRegistrar: 'AcademicRegistrar',
  financeOfficer: 'FinanceOfficer',
  lecturer: 'Lecturer',
  examinationsOfficer: 'ExaminationsOfficer',
  student: 'Student',
} as const

export type InstitutionalRole = typeof ROLES[keyof typeof ROLES]

export function hasAnyRole(userRoles: string[], allowedRoles: readonly string[]): boolean {
  return allowedRoles.some((role) => userRoles.includes(role))
}

export const ACADEMIC_MANAGEMENT_ROLES = [
  ROLES.systemAdministrator,
  ROLES.registrar,
  ROLES.academicRegistrar,
] as const

export const FINANCE_MANAGEMENT_ROLES = [
  ROLES.systemAdministrator,
  ROLES.financeOfficer,
] as const

export const EXAMINATION_MANAGEMENT_ROLES = [
  ROLES.systemAdministrator,
  ROLES.examinationsOfficer,
] as const
