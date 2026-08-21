import { ACADEMIC_MANAGEMENT_ROLES, EXAMINATION_MANAGEMENT_ROLES, FINANCE_MANAGEMENT_ROLES, hasAnyRole } from '../auth/roles'

interface RoleNavigationProps {
  roles: string[]
}

export function RoleNavigation({ roles }: RoleNavigationProps) {
  const items = [
    hasAnyRole(roles, ACADEMIC_MANAGEMENT_ROLES) ? 'Academic Management' : null,
    hasAnyRole(roles, EXAMINATION_MANAGEMENT_ROLES) ? 'Examinations' : null,
    hasAnyRole(roles, FINANCE_MANAGEMENT_ROLES) ? 'Finance' : null,
    roles.includes('Lecturer') ? 'Teaching' : null,
    roles.includes('Student') ? 'Student Portal' : null,
  ].filter(Boolean) as string[]

  return (
    <nav className="role-navigation" aria-label="Authorized modules">
      {items.map((item) => <span className="module-chip" key={item}>{item}</span>)}
    </nav>
  )
}
