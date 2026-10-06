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
  STAFF_READ_ROLES,
  STAFF_MANAGE_ROLES,
  LIBRARY_READ_ROLES,
  LIBRARY_MANAGE_ROLES,
  TIMETABLE_ROLES,
  ADMISSIONS_ROLES,
  DASHBOARD_ROLES,
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
export function canManageDocuments(roles: string[]) {
  return hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES)
}
export function canManageReporting(roles: string[]) {
  return hasAnyRole(roles, REPORTS_ROLES)
}
export function canViewAnalytics(roles: string[]) {
  return hasAnyRole(roles, REPORTS_ROLES)
}

// Principal oversight functions
export function canViewInstitutionalOverview(roles: string[]) {
  return hasAnyRole(roles, DASHBOARD_ROLES)
}
export function canViewStudentOversight(roles: string[]) {
  return hasAnyRole(roles, [...STAFF_READ_ROLES, ...REPORTS_ROLES])
}
export function canViewStaffOversight(roles: string[]) {
  return hasAnyRole(roles, [...STAFF_READ_ROLES, ...REPORTS_ROLES])
}
export function canViewAcademicOversight(roles: string[]) {
  return hasAnyRole(roles, [...ACADEMIC_MANAGEMENT_ROLES, ...REPORTS_ROLES])
}
export function canViewAdmissionsOversight(roles: string[]) {
  return hasAnyRole(roles, [...ADMISSIONS_ROLES, ...REPORTS_ROLES])
}
export function canViewFinanceOversight(roles: string[]) {
  return hasAnyRole(roles, [...FINANCE_MANAGEMENT_ROLES, ...REPORTS_ROLES])
}
export function canViewApprovalCentre(roles: string[]) {
  return hasAnyRole(roles, [...STAFF_MANAGE_ROLES, ...FINANCE_MANAGEMENT_ROLES])
}
export function canViewDisciplineWelfareOversight(roles: string[]) {
  return hasAnyRole(roles, [...STAFF_READ_ROLES, ...REPORTS_ROLES])
}
export function canViewHostelFacilitiesOversight(roles: string[]) {
  return hasAnyRole(roles, [...HOSTEL_MANAGEMENT_ROLES, ...REPORTS_ROLES])
}
export function canViewLibraryOversight(roles: string[]) {
  return hasAnyRole(roles, [...LIBRARY_READ_ROLES, ...REPORTS_ROLES])
}
export function canManageInstitutionalCommunication(roles: string[]) {
  return hasAnyRole(roles, [...COMMUNICATION_ROLES, ...STAFF_MANAGE_ROLES])
}
export function canViewPrincipalReports(roles: string[]) {
  return hasAnyRole(roles, REPORTS_ROLES)
}
