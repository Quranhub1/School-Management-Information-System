import { ACADEMIC_MANAGEMENT_ROLES, ADMINISTRATION_ROLES, EXAMINATION_MANAGEMENT_ROLES, FINANCE_MANAGEMENT_ROLES, STUDENT_MANAGEMENT_ROLES, INVENTORY_MANAGEMENT_ROLES, HOSTEL_MANAGEMENT_ROLES, TRANSPORT_MANAGEMENT_ROLES, REPORTS_ROLES, COMMUNICATION_ROLES, ATTENDANCE_ROLES, hasAnyRole } from '../auth/roles'
import './RoleNavigation.css'
interface RoleNavigationProps { roles: string[] }
export function RoleNavigation({ roles }: RoleNavigationProps) {
  const items = [
    hasAnyRole(roles, ADMINISTRATION_ROLES) ? 'Administration' : null,
    hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES) ? 'Academic Management' : null,
    hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES) ? 'Class Forms' : null,
    hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES) ? 'Streams' : null,
    hasAnyRole(roles, EXAMINATION_MANAGEMENT_ROLES) ? 'Examinations' : null,
    hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES) ? 'Student Management' : null,
    hasAnyRole(roles, FINANCE_MANAGEMENT_ROLES) ? 'Finance' : null,
    hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar', 'Lecturer']) ? 'Timetable' : null,
    hasAnyRole(roles, ['System Administrator', 'Registrar', 'Academic Registrar']) ? 'Admissions' : null,
    hasAnyRole(roles, ATTENDANCE_ROLES) ? 'Attendance' : null,
    hasAnyRole(roles, TRANSPORT_MANAGEMENT_ROLES) ? 'Transport' : null,
    hasAnyRole(roles, INVENTORY_MANAGEMENT_ROLES) ? 'Inventory' : null,
    hasAnyRole(roles, HOSTEL_MANAGEMENT_ROLES) ? 'Hostel' : null,
    hasAnyRole(roles, REPORTS_ROLES) ? 'Reports' : null,
    hasAnyRole(roles, COMMUNICATION_ROLES) ? 'Communication' : null,
    roles.includes('Lecturer') ? 'Teaching' : null,
    roles.includes('Student') ? 'Student Portal' : null,
    roles.includes('Parent') ? 'Parent Portal' : null,
    hasAnyRole(roles, ['System Administrator']) ? 'Payroll' : null,
    hasAnyRole(roles, STUDENT_MANAGEMENT_ROLES) ? 'Alumni' : null,
    hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES) ? 'Calendar' : null,
    hasAnyRole(roles, ATTENDANCE_ROLES) ? 'Gate Log' : null,
    hasAnyRole(roles, ['System Administrator']) ? 'Audit Log' : null,
  ].filter(Boolean) as string[]
  return <nav className="role-navigation" aria-label="Authorized modules">{items.map(item => <span className="module-chip" key={item}>{item}</span>)}</nav>
}