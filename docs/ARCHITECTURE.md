# System Architecture

## Purpose

This is the authoritative technical architecture for the School Management Information System (SMIS). The application is designed for Ugandan tertiary, higher-education and TVET environments while remaining configurable for institution-specific structures.

## Architectural principles

- LAN-first operation for normal institutional workflows.
- Modular domain architecture.
- Separate frontend, backend, database and infrastructure concerns.
- API-first communication.
- Database migrations are version-controlled.
- Automated tests and CI are required for meaningful changes.
- No production secrets are committed to Git.
- `main` represents the stable project state.
- Institutional terminology must be configurable; do not hard-code semester, term, faculty, school or TVET-only concepts.

## Technical stack

### Backend

- ASP.NET Core / .NET
- C#
- REST API
- Entity Framework Core

### Frontend

- React
- TypeScript
- Vite

### Database

- PostgreSQL is the preferred initial relational database.
- Referential integrity, indexes, unique constraints and migrations are part of the application architecture.

### Infrastructure

- Ubuntu Server
- Nginx
- Docker/container support where useful
- On-premises school/institution LAN

## Institutional architecture

```text
Institution
├── Campus / Site
├── Faculty / School / Directorate
│   └── Department / Unit
│       └── Programme
│           └── Curriculum Version
│               └── Programme Course
│                   └── Course / Unit
└── Academic Structure
    ├── Academic Year
    │   └── Academic Period
    └── Intake
```

## Academic and student architecture

```text
Applicant
  ↓
Admission Application
  ↓
Admission Decision
  ↓
Student
  ↓
Student Enrollment
  ↓
Academic Period Registration
  ↓
Course Registration
  ↓
Attendance / Practical / Clinical / Workplace Learning
  ↓
Assessment
  ↓
Results
  ↓
Progression
  ↓
Completion
  ↓
Graduation / Certification
  ↓
Alumni
```

## Major domains

1. Identity and access
2. Institution and campus administration
3. Faculties/schools and departments
4. Programmes and curriculum versions
5. Admissions and enrollment
6. Students, guardians and next of kin
7. Academic years, periods and intakes
8. Courses and registration
9. Attendance
10. Assessment and examinations
11. Results, progression and transcripts
12. Staff and teaching allocation
13. Clinical/workplace learning
14. Finance and fees
15. Library
16. Communication
17. Graduation/certification/alumni
18. Reporting and dashboards
19. Audit and system administration

## Uganda-specific academic capability

The model supports both conventional academic assessment and competency-based education/training. A programme can define its assessment model, and assessment records can represent theory, practical, workplace, clinical and competency outcomes where applicable.

This follows the direction of Ugandan education-sector policy and standards without assuming that every institution uses identical terminology.

## Deployment model

The primary deployment target is an on-premises institutional server accessible through the LAN. Internet connectivity is not required for normal internal operations.

## Development lifecycle

1. Requirement
2. Institutional/domain model
3. Architecture/design
4. Feature branch
5. Implementation
6. Automated tests
7. GitHub Actions CI
8. Review
9. Merge to `main`
10. Release/deployment validation

## Source of truth

The repository is the source of truth for requirements, institutional model, architecture, migrations, tests, workflows and production-relevant configuration.
