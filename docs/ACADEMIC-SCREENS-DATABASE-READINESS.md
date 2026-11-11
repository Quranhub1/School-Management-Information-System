# Academic Screens: Database-Driven Readiness and Implementation Plan

## Objective

Make every configurable academic register and workflow editable through SMIS screens, backed by the existing PostgreSQL database and authenticated APIs. The work extends the current schema and services; it must not create a second database, discard academic history, or introduce hardcoded programme/course catalogues.

## Screen inventory and current findings

### 1. Curriculum & Courses

Current implementation:
- Academic authorities and programmes are loaded through the database APIs introduced by the programme-catalogue migration.
- The authority selector is initialized from active database records; there is no hardcoded School-based default or runtime authority catalogue.
- Authorities support create, edit and activation/deactivation. Programme records support create, edit and activation/deactivation.
- Departments support create, edit and activation/deactivation through the existing faculty register. Programme forms use a database-backed department selector instead of a free-text UUID.
- A department cannot be moved to another faculty while programmes still reference it; those programme assignments must be changed explicitly first.
- Courses support create, edit and activation/deactivation. Inactive courses remain visible in the register but are excluded from new curriculum mappings.
- Curricula support create, edit and activation/deactivation, including version, minimum credits, effective dates and programme type.
- Curriculum-course mappings can be listed, added and edited (year, semester and core/elective flag); mappings are retained and are not hard-deleted.
- New curricula and mappings are validated against the database-backed authority, active programme, non-reference-only status and an approved programme status (Institutional, Verified or Approved), plus active curriculum and active course. Courses cannot be shared across different authorities.
- Programme maintenance is centralized in Curriculum & Courses; the duplicate Programme tab has been removed from Academic Management.

Remaining work:
- Add faculty creation/editing if the institution needs to configure faculties; the current department workflow selects from existing active faculty records.
- Add explicit audit history for department, course, curriculum and mapping changes.
- Review curriculum version/effective-date rules and protect curricula already referenced by registrations, results or transcripts.
- Audit downstream programme/course/curriculum selectors to ensure they consume the same database records and respect active/reference-only status.

### 2. Academic Structures

Current implementation:
- Programmes, classes, streams, subjects, courses and academic periods have database APIs.
- Classes, streams and subjects are loaded from the existing database and can be created.
- Classes now support edit, close and reopen with persisted updates.
- Streams now support edit and activate/deactivate; stream creation maps the selected academic class ID to the persisted class relationship.
- Subjects now support edit and activate/deactivate, including course, year, period sequence, compulsory/elective classification and elective group.
- Academic years and periods now have a dedicated Academic Calendar screen for create, edit, activate/deactivate and current selection.

Defects and gaps identified:
- The Classes screen imported the academic-period API but never loaded academic years or periods. The period selector therefore remained empty, preventing class creation. This branch now loads active academic years, selects the current/first active year and loads its periods.
- The class status endpoint previously returned HTTP 204 without changing the database. This branch now persists class status changes.
- Class update service previously returned success without saving any changes. This branch now persists class code, name, year, capacity and status.
- The Classes screen now exposes Edit, Close and Reopen actions.
- Stream and subject edit/activation controls are exposed in the Classes/Streams/Subjects screen. Capacity is intentionally not presented as editable until the persisted stream model supports it.
- Academic year and period updates validate date containment, unique period names/sequences and non-overlapping periods. A current period cannot be deactivated until another period is selected; only one current period is maintained globally.

### 3. Academic Calendar

Current implementation:
- A dedicated Academic Calendar screen is available from Academic Management.
- Academic years and periods can be created, edited, activated/deactivated and selected as current.
- Server-side validation protects date ranges, period sequence/name uniqueness and overlap rules.
- A current period cannot be deactivated before current-period selection is moved; setting a current period also aligns the current academic year.
- Timetable options are loaded from persisted semester records.

Remaining work:
- Add audit history for calendar changes and verify period changes against every downstream workflow.
- Preserve historical years and periods referenced by classes, registrations, assessments and timetables.

### 4. Classes, Streams, Admissions and Student Enrolment

Current implementation:
- Classes are linked to programmes and academic periods.
- Streams are linked to classes.
- The admissions form loads active academic authorities and active, verified programmes through an admissions-read endpoint, so Receptionist/Admissions roles do not need academic-management write permissions to read the catalogue.
- Admissions uses database-backed authority and programme selectors, retains the selected programme ID in the application record and validates that the selected programme belongs to the selected authority.
- Reference-only, inactive and not-yet-approved programmes are excluded from admissions choices. Only Institutional, Verified or Approved programme statuses are selectable; no hardcoded School-based default is used.
- Course registrations and student academic status have domain/API support.

Remaining work:
- Verify stream and subject edit/activation behavior against existing student records and downstream reports.
- Audit enrolment screens and APIs for class/stream assignment, transfer, withdrawal and progression.
- Complete the handoff from the admission application form to the formal Applicant/Admission/StudentEnrollment workflow so the selected programme ID is the authoritative relational value, not only application-form metadata.
- Use database-backed programme, year, period, class and stream selectors throughout.
- Prevent destructive changes to classes/streams already referenced by student records.

### 5. Examinations, Assessment and Results

Current implementation:
- Assessment plans can be created and listed.
- Student assessments can be recorded and finalized.
- Transcripts and academic result summaries are retrieved from persisted records.
- The examination screen has assessment-plan and student-record workflows.

Remaining work:
- Audit plan editing, weighting profiles, grade bands and assessment configuration for missing CRUD operations.
- Ensure assessment types, grading scales, pass rules and progression rules are configurable records rather than UI constants where they represent institutional policy.
- Keep finalized assessment records immutable or use an explicit audited correction workflow.
- Add database-backed selectors for academic year, period, programme, course, class and student.

### 6. Timetables

Current implementation:
- Timetable options are database-backed (teaching groups, courses, teachers and periods).
- Timetable entries can be created, updated, deactivated and generated.
- Template save validates class, teacher and room overlaps.
- Generated class timetables support print and PDF download.

Remaining work:
- Verify every timetable workflow is scoped to the selected academic period and teaching group.
- Add audit-safe change history and ensure regenerated timetables do not erase previously published schedules.
- Keep the configurable number-of-class-timetables workflow and its per-class print/download actions.

## Delivery sequence

1. Integrate the database-driven authority/programme catalogue only after all CI checks pass and the school's applied migration history is reviewed.
2. Completed in the stacked academic-maintenance branch: academic years, periods, classes, streams and subjects are editable through database-backed screens.
3. Completed in the stacked academic-maintenance branch: departments, courses, curricula, curriculum mappings and programme associations are editable; admissions and curriculum selectors consume approved database records.
4. Complete the formal admissions application handoff to Applicant, Admission and StudentEnrollment records, then complete enrolment, transfer, withdrawal and progression workflows.
5. Complete examination/assessment configuration, grading and audited result-correction workflows.
6. Complete timetable period scoping, publication/history and regression testing.
7. Add audit history for academic register changes and faculty maintenance controls if required by the institution.

## Non-negotiable data-safety rules

- Use the existing SMIS database and EF Core migration chain.
- Never reset the database or replace existing academic records.
- Prefer deactivation/archive over hard deletion when a record has dependent history.
- Do not silently reassign students, courses, classes or curricula when a parent record changes.
- Validate uniqueness, dates, authority ownership and foreign-key relationships on the server.
- Protect finalized results and transcripts; corrections must be explicit and auditable.
- Keep role-based authorization on every read and write API.
- Test migrations against an isolated PostgreSQL database before applying them to the school's database.

## Current branch scope

This branch is intentionally stacked on the database-driven catalogue branch. It now includes academic year/period management, class/stream/subject maintenance, department/course/curriculum maintenance, and editable curriculum-course mappings. It does not claim that all academic screens are complete yet; faculty setup, enrolment/progression, assessment configuration, result corrections and timetable history remain planned work.
