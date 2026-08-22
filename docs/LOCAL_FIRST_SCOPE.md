# Local-first scope

The SMIS core runs on the school's local server and local network.

## Core operations that must work without Internet

- Student records and enrollment
- Admissions
- Academic registration
- Attendance
- Assessment and results
- GPA/CGPA calculations
- Transcripts and reports
- Staff and user administration
- Finance and fees
- Library management
- Audit logging

## External integrations

External integrations are exceptions, not dependencies. They must be explicitly requested, configured by an authorized administrator, and isolated so that failure of an external service does not stop the local SMIS.

The library module may contain manually configurable integration endpoints for separately operated systems such as KOHA and DSpace. These endpoints are not required for normal SMIS operation.

## Student access

There is no Internet student/guardian portal in the current scope. Authorized school staff manage and generate academic records locally.
