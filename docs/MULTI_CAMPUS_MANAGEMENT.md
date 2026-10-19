# Multi-campus management

SMIS campus administration supports multiple sites under the active institution settings, using one server and one database.

## Implemented in this change
- System Administrators can add, edit, activate and deactivate campuses.
- Campus code and name uniqueness are enforced within the institution.
- Campus and institution records are persisted in PostgreSQL via EF Core migration.
- Deactivation preserves records; campus records are not hard-deleted.

## Scope boundary
This register does not yet provide full campus-level data isolation. Student, staff, financial, inventory, attendance and examination records still need CampusId assignment and server-side authorization filters before campus-restricted accounts should be enabled. The current change must not be described as complete separation across every module.

The migration creates institution/campus tables and does not delete existing school records.
