# Academic Years and Periods

The SMIS now exposes the existing `AcademicYear` and `Semester` entities through the protected Academic Management API.

## Supported operations

- List academic years.
- Create an academic year with date validation and duplicate-name protection.
- Mark one academic year as current; setting a new current year clears the previous current flag.
- Activate/deactivate an academic year.
- List periods for an academic year.
- Create periods with year-boundary, sequence/name, and overlap validation.
- Mark one period within an academic year as current.

## Local-only deployment

The API is served by the school's local SMIS server and requires no Internet service.
