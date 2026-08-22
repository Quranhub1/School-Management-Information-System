# Academic Management — Administrative UI Scope

This document defines the first administrative layer to expose the existing academic domain through the local SMIS interface.

## Navigation

**Academic Management**

- Dashboard
- Academic Years
- Academic Periods
- Programmes
- Curriculum
- Courses / Units
- Course Offerings
- Student Course Registration
- Academic Records

## Rules

1. Screens must use the existing academic domain entities and APIs.
2. Do not create duplicate academic-year, programme, curriculum, course or registration tables.
3. Academic period terminology is configurable; the UI may display Semester, Term, Trimester or Block according to institutional configuration.
4. Historical records must remain visible and must not be overwritten when a new academic year or curriculum version is created.
5. Course registration must identify the student, programme context, course offering, academic period and attempt/registration status where supported by the existing model.
6. Result entry remains in the assessment/result workflow. `X` and other configured special codes remain non-numeric result statuses.
7. GPA/CGPA remains in the existing calculation service; the management UI consumes approved results rather than reimplementing calculations.
8. UHPAB/UVTAB are not recreated as board systems. Their school-relevant grading, weighting and special-result rules are configuration profiles.
9. All data is served from the local SMIS server/database. No Internet service is required.

## Suggested administrative flow

```text
Create Academic Year
        ↓
Create Periods
        ↓
Review Programmes / Curriculum Versions
        ↓
Configure Course Offerings
        ↓
Register Students for Courses
        ↓
Monitor Attendance / Assessment
        ↓
Review Approved Results
        ↓
Academic Records / Progression / Transcript
```

## Guardrails

- Prevent deletion of academic records that have dependent historical registrations or results; use inactive/archive states where appropriate.
- Prevent duplicate active registrations for the same student and course offering unless the existing attempt model explicitly permits another attempt.
- Prevent editing locked/approved results from the administrative structure screens.
- Show clear local validation errors rather than relying on Internet-connected services.
