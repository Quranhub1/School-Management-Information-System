import { hasAnyRole, ADMINISTRATION_ROLES, ACADEMIC_MANAGEMENT_ROLES, FINANCE_MANAGEMENT_ROLES, FINANCE_READ_ROLES, EXAMINATION_MANAGEMENT_ROLES, STUDENT_MANAGEMENT_ROLES, INVENTORY_MANAGEMENT_ROLES, HOSTEL_MANAGEMENT_ROLES, TRANSPORT_MANAGEMENT_ROLES, REPORTS_ROLES, COMMUNICATION_ROLES, ATTENDANCE_ROLES } from './roles'

export function canManageAdministration(roles: string[]) { return hasAnyRole(roles, ADMINISTRATION_ROLES) }
export function canManageAcademics(roles: string[]) { return hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES) }
export function canManageFinance(roles: string[]) { return hasAnyRole(roles, FINANCE_MANAGEMENT_ROLES) }
export function canReadAccounts(roles: string[]) { return hasAnyRole(roles, FINANCE_READ_ROLES) }
export function canManageExaminations(roles: string[]) { return hasAnyRole(roles, EXAMINATION_MANAGEMENT_ROLES) }
export function canManageStudents(roles: string[]) { return hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES) }
export function canManageTimetable(roles: string[]) { return hasAnyRole(roles, ['SystemAdministrator', 'Registrar', 'AcademicRegistrar', 'Lecturer']) }
export function canManageAdmissions(roles: string[]) { return hasAnyRole(roles, ['SystemAdministrator', 'Registrar', 'AcademicRegistrar']) }
export function canReadStaff(roles: string[]) { return hasAnyRole(roles, ['SystemAdministrator', 'Registrar', 'AcademicRegistrar', 'Lecturer']) }
export function canManageStaff(roles: string[]) { return hasAnyRole(roles, ['SystemAdministrator', 'Registrar']) }
export function canReadLibrary(roles: string[]) { return hasAnyRole(roles, ['SystemAdministrator', 'Librarian', 'Registrar', 'AcademicRegistrar', 'Lecturer']) }
export function canManageLibrary(roles: string[]) { return hasAnyRole(roles, ['SystemAdministrator', 'Librarian']) }
export function canManageCommunication(roles: string[]) { return hasAnyRole(roles, ['SystemAdministrator', 'Registrar', 'AcademicRegistrar']) }
export function canManageReporting(roles: string[]) { return hasAnyRole(roles, REPORTS_ROLES) }
export function canReadReporting(roles: string[]) { return hasAnyRole(roles, REPORTS_ROLES) }
export function canManageBulkOperations(roles: string[]) { return hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES) }
export function canViewParentPortal(roles: string[]) { return roles.includes('Parent') }
export function canViewStudentPortal(roles: string[]) { return roles.includes('Student') }
export function canManageTransport(roles: string[]) { return hasAnyRole(roles, TRANSPORT_MANAGEMENT_ROLES) }
export function canManageInventory(roles: string[]) { return hasAnyRole(roles, INVENTORY_MANAGEMENT_ROLES) }
export function canManageHostel(roles: string[]) { return hasAnyRole(roles, HOSTEL_MANAGEMENT_ROLES) }
export function canManageAttendance(roles: string[]) { return hasAnyRole(roles, ATTENDANCE_ROLES) }
