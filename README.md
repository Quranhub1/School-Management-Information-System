# School Management Information System

A comprehensive, modular and LAN-first School Management Information System (SMIS) designed for Ugandan tertiary, higher-education and TVET institutions.

## Project status

**Active development — architecture, institutional model, core workflows and production foundations are being implemented incrementally.**

GitHub is the persistent source of truth. The system is being built as a production-oriented application with a configurable institutional model rather than a school-specific hard-coded schema.

See [`progress.md`](progress.md) for the current implementation tracker, covered capabilities and remaining work.

## Technology

- **Frontend:** React + TypeScript + Vite
- **Backend:** ASP.NET Core / C#
- **Data access:** Entity Framework Core
- **Database:** PostgreSQL preferred
- **Production server:** Ubuntu Server
- **Reverse proxy:** Nginx
- **CI:** GitHub Actions
- **Deployment:** on-premises / LAN-first

## Institutional structure

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
    │   └── Semester / Term / Block
    └── Intake
```

## Student lifecycle

```text
Application → Admission → Student → Enrollment → Period Registration
→ Course Registration → Attendance / Practical / Clinical / Workplace Learning
→ Assessment → Results → Progression → Completion → Graduation / Certification → Alumni
```

## Core domains

- Identity and role-based access
- Institution, campus, faculty and department management
- Programme and curriculum management
- Admissions and enrollment
- Student and guardian management
- Academic years, periods and intakes
- Courses and course registration
- Attendance
- Theory, practical, clinical and competency-based assessment
- Results, progression and transcripts
- Staff and teaching allocation
- Finance and fees
- Library
- Clinical/workplace attachment
- Graduation, certification and alumni
- Communication and notifications
- Reporting and audit
- Parent/guardian and student self-service portals

## Finance accounting

The Finance domain is being upgraded toward a proper double-entry accounting model rather than treating fees as isolated transactions. The current implementation connects student billing and payments to the general ledger, including chart-of-accounts foundations, automatic invoice/payment journal posting and core ledger reports.

The accounting design is being strengthened incrementally with validation, posting controls, reversals, auditability, reconciliation and financial statements. See [`progress.md`](progress.md) for the exact status.

## Uganda alignment

The institutional model is designed around Ugandan higher-education and TVET realities, including configurable programmes, approved curricula, admissions, competency-based education/training where applicable, practical/workplace learning and assessment. It is not hard-coded to one regulator or one institution.

See [`docs/UGANDA_INSTITUTIONAL_MODEL.md`](docs/UGANDA_INSTITUTIONAL_MODEL.md) for the authoritative table catalogue and field definitions.

## Documentation

- [Implementation progress](progress.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Uganda institutional data model](docs/UGANDA_INSTITUTIONAL_MODEL.md)
- [Database architecture](docs/DATABASE.md)
- [API architecture](docs/API.md)
- [Security baseline](docs/SECURITY.md)
- [Deployment architecture](docs/DEPLOYMENT.md)
- [Architecture decisions](docs/adr/)

## Development workflow

1. Define requirements.
2. Record architecture decisions where needed.
3. Create a feature/fix branch.
4. Implement the change.
5. Add/update automated tests.
6. Update the implementation tracker and relevant documentation.
7. Run GitHub Actions CI.
8. Review the change.
9. Merge only verified work into `main`.
