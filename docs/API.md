# API Architecture

## API style

The backend exposes a versioned REST API consumed by the React frontend and other authorized clients.

## Base path

`/api/v1`

## API principles

- Resource-oriented endpoints.
- Consistent HTTP status codes.
- Request and response validation.
- Authentication and authorization on protected endpoints.
- Pagination for large collections.
- Structured error responses.
- Correlation/request identifiers.
- OpenAPI documentation in development and controlled environments.
- Institution-specific terminology represented by configuration, not separate APIs.

## Endpoint domains

### Identity and institution

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/institution`
- `/api/v1/campuses`
- `/api/v1/faculties`
- `/api/v1/departments`

### Admissions and students

- `/api/v1/admissions`
- `/api/v1/students`
- `/api/v1/students/{id}/guardians`
- `/api/v1/enrollments`
- `/api/v1/intakes`

### Academics

- `/api/v1/programmes`
- `/api/v1/curricula`
- `/api/v1/courses`
- `/api/v1/programme-courses`
- `/api/v1/academic-years`
- `/api/v1/academic-periods`
- `/api/v1/registrations`

### Teaching, attendance and assessment

- `/api/v1/staff`
- `/api/v1/teaching-allocations`
- `/api/v1/attendance`
- `/api/v1/assessments`
- `/api/v1/results`
- `/api/v1/progression`
- `/api/v1/transcripts`
- `/api/v1/workplace-learning`

### Academic records and missed papers

The current academic-record controller also exposes the following protected endpoints for the implemented transcript/progression workflow:

- `GET /api/academic-records/students/{studentId}/transcript`
- `GET /api/academic-records/students/{studentId}/summaries`
- `GET /api/academic-records/students/{studentId}/outstanding/missed-papers`
- `GET /api/academic-records/students/{studentId}/progression-assessment`

A missed paper is represented by status `X` and has no numeric score or grade point. It remains on the transcript as an outstanding academic requirement and is excluded from GPA calculation. UHPAB/UVTAB progression treatment is applied through configurable rules rather than separate APIs.

### Operations

- `/api/v1/finance`
- `/api/v1/library`
- `/api/v1/communications`
- `/api/v1/graduation`
- `/api/v1/alumni`
- `/api/v1/reports`
- `/api/v1/audit`

Endpoint contracts will be expanded as each domain is implemented and tested.
