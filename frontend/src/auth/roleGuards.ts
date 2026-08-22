import { hasAnyRole, ADMINISTRATION_ROLES, ACADEMIC_MANAGEMENT_ROLES, FINANCE_MANAGEMENT_ROLES, EXAMINATION_MANAGEMENT_ROLES, STUDENT_MANAGEMENT_ROLES } from './roles'
export function canManageAdministration(roles: string[]): boolean { return hasAnyRole(roles, ADMINISTRATION_ROLES) }
export function canManageAcademics(roles: string[]): boolean { return hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES) }
export function canManageFinance(roles: string[]): boolean { return hasAnyRole(roles, FINANCE_MANAGEMENT_ROLES) }
export function canManageExaminations(roles: string[]): boolean { return hasAnyRole(roles, EXAMINATION_MANAGEMENT_ROLES) }
export function canManageStudents(roles: string[]): boolean { return hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES) }
export function canManageTimetable(roles: string[]): boolean { return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar', 'Lecturer']) }
export function canManageAdmissions(roles: string[]): boolean { return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar']) }
export function canReadStaff(roles: string[]): boolean { return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar', 'HR Manager', 'Lecturer']) }
export function canManageStaff(roles: string[]): boolean { return hasAnyRole(roles, ['System Administrator', 'HR Manager', 'Registrar']) }
