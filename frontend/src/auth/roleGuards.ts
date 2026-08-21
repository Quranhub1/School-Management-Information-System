import { hasAnyRole, ADMINISTRATION_ROLES, ACADEMIC_MANAGEMENT_ROLES, FINANCE_MANAGEMENT_ROLES, EXAMINATION_MANAGEMENT_ROLES, STUDENT_MANAGEMENT_ROLES } from './roles'
export function canManageAdministration(roles: string[]): boolean { return hasAnyRole(roles, ADMINISTRATION_ROLES) }
export function canManageAcademics(roles: string[]): boolean { return hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES) }
export function canManageFinance(roles: string[]): boolean { return hasAnyRole(roles, FINANCE_MANAGEMENT_ROLES) }
export function canManageExaminations(roles: string[]): boolean { return hasAnyRole(roles, EXAMINATION_MANAGEMENT_ROLES) }
export function canManageStudents(roles: string[]): boolean { return hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES) }
