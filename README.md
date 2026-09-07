# School Management Information System

A comprehensive, modular and LAN-first School Management Information System (SMIS) designed for Ugandan tertiary, higher-education and TVET institutions.

## Project status

**Active development — core platform foundations are in place, while major business workflows are being hardened and expanded incrementally.**

GitHub is the persistent source of truth. The system is being built as a production-oriented application with a configurable institutional model rather than a school-specific hard-coded schema.

See [`PROGRESS.md`](PROGRESS.md) for the authoritative implementation tracker, verified capabilities and remaining work.

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
- Communication and local notifications
- Reporting and audit
- System administration

Student/guardian self-service portals are **not part of the current scope**. Academic results, transcripts and institutional records are managed by authorized school staff through the local SMIS.

## Finance accounting

The Finance domain is being upgraded toward ERP-grade double-entry accounting, using mature ERP accounting patterns as design references while keeping the SMIS architecture and institutional workflows intact. The implemented foundation connects student billing and payments to the General Ledger through a chart of accounts, automatic invoice/payment posting, balanced journal validation, duplicate-posting protection and core ledger/report foundations.

The current receivables workflow includes controlled journal reversals, source/reversal metadata, itemized fee billing, payment allocation/FIFO allocation, unallocated student payments, a student Payment Ledger, and approved discount/waiver workflows. Invoice installment schedules now support reusable percentage- or amount-based payment schedules with ordered due dates, outstanding/overdue tracking and automatic application of invoice payments across installment balances.

The remaining Finance roadmap includes persistence-level posted-entry immutability, dedicated audit events, student charges, credit notes/refunds, bank reconciliation, accounting dimensions and complete financial statements.

See [`PROGRESS.md`](PROGRESS.md) for the exact verified Finance status and roadmap.

## Uganda alignment

The institutional model is designed around Ugandan higher-education and TVET realities, including configurable programmes, approved curricula, admissions, competency-based education/training where applicable, practical/workplace learning and assessment. It is not hard-coded to one regulator or one institution.

See [`docs/UGANDA_INSTITUTIONAL_MODEL.md`](docs/UGANDA_INSTITUTIONAL_MODEL.md) for the authoritative table catalogue and field definitions.

## Documentation

- [Implementation progress](PROGRESS.md)
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
3. Create a feature/fix branch from the current verified baseline.
4. Implement the change.
5. Add/update automated tests.
6. Update `README.md`, `PROGRESS.md` and relevant documentation.
7. Run GitHub Actions CI.
8. Review the change.
9. Merge only verified work into `main`.
