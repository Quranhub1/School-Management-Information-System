/**
 * Canonical frontend values for backend-owned enum contracts.
 * Keep values aligned with SchoolManagement.Domain enums; these are not
 * institution-configurable reference records and must not be database-seeded.
 */
export const STAFF_TYPE_VALUES = ['Teaching', 'NonTeaching'] as const;
export type StaffTypeValue = typeof STAFF_TYPE_VALUES[number];
export const STAFF_TYPE_OPTIONS = [
  { value: 'Teaching', label: 'Teaching' },
  { value: 'NonTeaching', label: 'Non-teaching' },
] as const;

export const LEAVE_TYPE_VALUES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Study'] as const;
export type LeaveTypeValue = typeof LEAVE_TYPE_VALUES[number];
export const LEAVE_TYPE_OPTIONS = LEAVE_TYPE_VALUES.map(value => ({ value, label: value }));
