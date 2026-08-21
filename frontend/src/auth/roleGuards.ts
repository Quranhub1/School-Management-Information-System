import { hasAnyRole, ACADEMIC_MANAGEMENT_ROLES, FINANCE_MANAGEMENT_ROLES, EXAMINATION_MANAGEMENT_ROLES } from './roles'

export function canManageAcademics(roles: string[]): boolean {
  return hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES)
}

export function canManageFinance(roles: string[]): boolean {
  return hasAnyRole(roles, FINANCE_MANAGEMENT_ROLES)
}

export function canManageExaminations(roles: string[]): boolean {
  return hasAnyRole(roles, EXAMINATION_MANAGEMENT_ROLES)
}
