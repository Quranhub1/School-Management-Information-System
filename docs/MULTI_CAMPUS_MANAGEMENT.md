# Multi-campus management

<<<<<<< HEAD
SMIS supports multiple campuses under one institution on a shared server and PostgreSQL database. Campus ownership and user access are enforced by authenticated backend endpoints.

## Operational workflows
- System Administrators can create, edit, activate and deactivate campuses. Campus codes and names are unique within the institution.
- Campus access is managed through `/api/campuses/{campusId}/users`. Users can be assigned to multiple campuses, with at most one primary campus.
- Student lists and student-specific records are restricted to campuses assigned to the signed-in user. New students inherit the selected user's primary campus unless an authorized administrator selects another assigned campus.
- Staff lists, staff-specific records and leave operations are restricted to assigned campuses.
- Course registrations carry a campus ID. Assessment entry and retrieval are checked against the student's campus; attendance sessions and QR operations are checked against the teaching staff member's campus.
- Inventory registers and stock alerts are scoped to the user's assigned campuses. Existing unassigned student, staff, course-registration and inventory-register records are associated with the first campus when it is created.
- Campus deactivation retains the campus and its records; records are not hard-deleted.

## Finance data semantics
Finance journal lines and report services support campus dimensions and campus-filtered reporting. Transactions that do not carry a campus dimension remain institution-wide and must not be interpreted as campus-isolated financial records.

## Database changes
The EF Core migrations create institution and campus tables, user-to-campus assignments, campus ownership columns, indexes and foreign keys. Existing records are preserved and backfilled where a first campus is established.
=======
SMIS campus administration supports multiple sites under the active institution settings, using one server and one database.

## Implemented in this change
- System Administrators can add, edit, activate and deactivate campuses.
- Campus code and name uniqueness are enforced within the institution.
- Campus and institution records are persisted in PostgreSQL via EF Core migration.
- Deactivation preserves records; campus records are not hard-deleted.

## Scope boundary
This register does not yet provide full campus-level data isolation. Student, staff, financial, inventory, attendance and examination records still need CampusId assignment and server-side authorization filters before campus-restricted accounts should be enabled. The current change must not be described as complete separation across every module.

The migration creates institution/campus tables and does not delete existing school records.
>>>>>>> origin/feat/multi-campus-management
