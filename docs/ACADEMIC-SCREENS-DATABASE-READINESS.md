# Academic Screens: Database-Driven Readiness and Implementation Plan

## Objective

Make every configurable academic register and workflow editable through SMIS screens, backed by the existing PostgreSQL database and authenticated APIs. The work extends the current schema and services; it must not create a second database, discard academic history, or introduce hardcoded programme/course catalogues.

## Screen inventory and current findings

### 1. Curriculum & Courses

Current implementation:
- Academic authorities and programmes are loaded through the database APIs introduced in the programme-catalogue migration.
- The screen supports authority creation, editing and activation/deactivation.
- Programme records support create, edit and activation/deactivation.
- Curricula and courses can be listed and created.
- Curriculum-course mappings can be listed and added.
- Authority separation is enforced when adding a course to another authority's curriculum.

Remaining work:
- Add safe edit/archive operations for curricula, courses and curriculum-course mappings.
- Make department management available from the screen and replace any free-text or UUID entry with database-backed selectors.
- Review curriculum version/effective-date rules and protect curricula already referenced by registrations, results or transcripts.
- Ensure the catalogue screen is the single programme-management entry point; remove the legacy duplicate programme editor from Academic Management after confirming no workflow depends on it.

### 2. Academic Structures

Current implementation:
- Programmes, classes, streams, subjects, courses and academic periods have database APIs.
- Classes and subjects can be created; streams can be created and listed.
- Academic years and periods can be created and marked current through the academic-structure API.

Defects and gaps identified:
- The Classes screen imported the academic-period API but never loaded academic years or periods. The period selector therefore remained empty, preventing class creation. This branch now loads active academic years, selects the current/first active year and loads its periods.
- The class status endpoint previously returned HTTP 204 without changing the database. This branch now persists class status changes.
- Class update service previously returned success without saving any changes. This branch now persists class code, name, year, capacity and status.
- The Classes screen now exposes Edit, Close and Reopen actions.
- Stream edit support exists at the academic-structure API level but is not yet exposed in the Classes/Streams screen.
- Subject and course APIs currently expose list/create operations; safe edit/archive operations and corresponding UI are still needed.
- Academic year and period APIs need full edit/retire controls, with validation that dates remain within the parent year and do not overlap.

### 3. Academic Calendar

Current implementation:
- Academic years and periods are persisted in the database.
- Current-year and current-period selection is supported.
- Timetable options are loaded from persisted semester records.

Remaining work:
- Provide a single clear calendar management workflow rather than overlapping calendar/structure controls.
- Add year/period editing and safe deactivation.
- Validate date ranges, period sequence uniqueness and overlapping periods.
- Preserve historical years and periods referenced by classes, registrations, assessments and timetables.

### 4. Classes, Streams and Student Enrolment

Current implementation:
- Classes are linked to programmes and academic periods.
- Streams are linked to classes.
- Course registrations and student academic status have domain/API support.

Remaining work:
- Add stream edit/activation controls to the UI.
- Add subject edit/activation controls.
- Audit enrolment screens and APIs for class/stream assignment, transfer, withdrawal and progression.
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

1. Complete and merge the database-driven authority/programme catalogue migration only after all CI checks pass and the existing database's applied migration history is reviewed.
2. Complete Academic Structures and Calendar CRUD: academic years, periods, classes, streams and subjects.
3. Complete Curriculum & Courses CRUD: departments, courses, curricula, curriculum mappings and programme associations.
4. Complete enrolment and progression configuration and ensure student academic records remain historically consistent.
5. Complete examination/assessment configuration, grading and audited result correction workflows.
6. Complete timetable period scoping, publication/history and regression testing.
7. Remove obsolete duplicate editors and hardcoded academic constants only after the database-backed replacement is verified.

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

This branch is intentionally stacked on the database-driven catalogue branch. It contains the first Academic Structures reliability slice: loading academic years/periods, persisting class edits/status changes, and exposing those class actions in the screen. It does not claim that all academic screens are complete yet.
