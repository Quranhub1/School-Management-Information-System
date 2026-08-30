import {
  hasAnyRole,
  ADMINISTRATION_ROLES,
  ACADEMIC_MANAGEMENT_ROLES,
  FINANCE_MANAGEMENT_ROLES,
  EXAMINATION_MANAGEMENT_ROLES,
  STUDENT_MANAGEMENT_ROLES,
  INVENTORY_MANAGEMENT_ROLES,
  HOSTEL_MANAGEMENT_ROLES,
  TRANSPORT_MANAGEMENT_ROLES,
  REPORTS_ROLES,
  COMMUNICATION_ROLES,
  ATTENDANCE_ROLES,
} from './roles'

export function canManageAdministration(roles: string[]) {
  return hasAnyRole(roles, ADMINISTRATION_ROLES)
}
export function canManageAcademics(roles: string[]) {
  return hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES)
}
export function canManageFinance(roles: string[]) {
  return hasAnyRole(roles, FINANCE_MANAGEMENT_ROLES)
}
export function canManageExaminations(roles: string[]) {
  return hasAnyRole(roles, EXAMINATION_MANAGEMENT_ROLES)
}
export function canManageStudents(roles: string[]) {
  return hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES)
}
export function canManageTimetable(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar', 'Lecturer'])
}
export function canManageAdmissions(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar'])
}
export function canReadStaff(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar', 'HR Manager', 'Lecturer'])
}
export function canManageStaff(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'HR Manager', 'Registrar'])
}
export function canReadLibrary(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'Librarian', 'Registrar', 'Academic Registrar', 'Lecturer'])
}
export function canManageCommunication(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar'])
}
export function canManageLibrary(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'Librarian'])
}
export function canManageAttendance(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar', 'Lecturer'])
}
export function canManageTransport(roles: string[]) {
  return hasAnyRole(roles, TRANSPORT_MANAGEMENT_ROLES)
}
export function canManageInventory(roles: string[]) {
  return hasAnyRole(roles, INVENTORY_MANAGEMENT_ROLES)
}
export function canManageHostel(roles: string[]) {
  return hasAnyRole(roles, HOSTEL_MANAGEMENT_ROLES)
}
export function canManagePrinters(roles: string[]) {
  return hasAnyRole(roles, ['System Administrator', 'Registrar', 'Principal', 'ResidentDirector', 'Secretary', 'StoreOfficer'])
}
export function canManageReporting(roles: string[]) {
  return hasAnyRole(roles, REPORTS_ROLES)
}
