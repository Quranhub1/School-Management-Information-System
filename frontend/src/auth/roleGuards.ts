import {
  hasAnyRole,
  ADMINISTRATION_ROLES,
  ACADEMIC_MANAGEMENT_ROLES,
  FINANCE_MANAGEMENT_ROLES,
  FINANCE_OPERATIONS_ROLES,
  FINANCE_READ_ROLES,
  STAFF_READ_ROLES,
  STAFF_MANAGE_ROLES,
  EXAMINATION_MANAGEMENT_ROLES,
  STUDENT_MANAGEMENT_ROLES,
  INVENTORY_MANAGEMENT_ROLES,
  HOSTEL_MANAGEMENT_ROLES,
  REPORTS_ROLES,
  COMMUNICATION_ROLES,
  ATTENDANCE_ROLES,
  ATTENDANCE_READ_ROLES,
  TIMETABLE_ROLES,
  LIBRARY_READ_ROLES,
  LIBRARY_MANAGE_ROLES,
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
export function canAccessFinance(roles: string[]) {
  return hasAnyRole(roles, [...FINANCE_OPERATIONS_ROLES, ...FINANCE_READ_ROLES])
}
export function canReadOnlyFinance(roles: string[]) {
  return hasAnyRole(roles, FINANCE_READ_ROLES) && !hasAnyRole(roles, FINANCE_OPERATIONS_ROLES)
}
export function isAssistantAccountant(roles: string[]) {
  return roles.includes('AssistantAccountant')
}
export function canManageExaminations(roles: string[]) {
  return hasAnyRole(roles, EXAMINATION_MANAGEMENT_ROLES)
}
export function canManageStudents(roles: string[]) {
  return hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES)
}
export function canManageTimetable(roles: string[]) {
  return hasAnyRole(roles, ['SystemAdministrator', 'Registrar', 'AcademicRegistrar', 'Lecturer', 'HR Manager'])
}
export function canReadTimetable(roles: string[]) {
  return hasAnyRole(roles, TIMETABLE_ROLES)
}
export function canManageAdmissions(roles: string[]) {
  return hasAnyRole(roles, ['SystemAdministrator', 'Registrar', 'AcademicRegistrar', 'AdmissionsOfficer', 'HR Manager'])
}
export function canReadStaff(roles: string[]) {
  return hasAnyRole(roles, STAFF_READ_ROLES)
}
export function canManageStaff(roles: string[]) {
  return hasAnyRole(roles, STAFF_MANAGE_ROLES)
}
export function canReadLibrary(roles: string[]) {
  return hasAnyRole(roles, LIBRARY_READ_ROLES)
}
export function canManageCommunication(roles: string[]) {
  return hasAnyRole(roles, COMMUNICATION_ROLES)
}
export function canManageLibrary(roles: string[]) {
  return hasAnyRole(roles, LIBRARY_MANAGE_ROLES)
}
export function canManageAttendance(roles: string[]) {
  return hasAnyRole(roles, ATTENDANCE_ROLES)
}
export function canReadAttendance(roles: string[]) {
  return hasAnyRole(roles, [...ATTENDANCE_ROLES, ...ATTENDANCE_READ_ROLES])
}
export function canManageInventory(roles: string[]) {
  return hasAnyRole(roles, INVENTORY_MANAGEMENT_ROLES)
}
export function canManageHostel(roles: string[]) {
  return hasAnyRole(roles, HOSTEL_MANAGEMENT_ROLES)
}
export function canManagePrinters(roles: string[]) {
  return hasAnyRole(roles, ['SystemAdministrator', 'Registrar', 'Principal', 'Director', 'ResidentDirector', 'Secretary', 'Records Officer'])
}
export function canManageDocuments(roles: string[]) {
  return hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES)
}
export function canManageReporting(roles: string[]) {
  return hasAnyRole(roles, REPORTS_ROLES)
}
export function canViewAnalytics(roles: string[]) {
  return hasAnyRole(roles, REPORTS_ROLES)
}
