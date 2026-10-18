# School Management Information System

A comprehensive, modular and LAN-first School Management Information System (SMIS) designed for Ugandan tertiary, higher-education and TVET institutions.

## Project status

**Active development — final production-readiness and deployment verification.** The repository contains the core academic, admissions, student, assessment, attendance, finance, staff, hostel, transport, library, clinical/workplace-learning, reporting and administration capabilities. The authoritative implementation tracker is [`PROGRESS.md`](PROGRESS.md). The role-specific dashboard and chart requirements are documented in [`docs/ROLE_DASHBOARDS.md`](docs/ROLE_DASHBOARDS.md).

## Complete installation

**Start here:** [`INSTALLATION.md`](INSTALLATION.md)

The complete installation guide covers the full stack, including:

- PostgreSQL database installation and configuration
- ASP.NET Core 8 API installation, configuration and migrations
- React/Vite frontend installation and production build
- LAN deployment and Nginx/HTTPS configuration
- Native Windows desktop client
- Windows x86/x64 installer generation
- The approved `frontend/public/icon.png` and Windows installer icon handling
- First-run server connection checks
- Administrator bootstrap and role-based access
- Institutional setup order
- Backup/restore
- Production security
- Troubleshooting
- Release and deployment checklist
- End-to-end acceptance testing

## Software used

The SMIS core stack and optional visual design tools are listed separately. The visual editors below are **design/development aids, not required runtime dependencies**. Evaluate them on the dedicated `docs/visual-screen-designers` branch or another feature branch before adopting any generated changes. Preserve existing React components, routing, authentication, role-based authorization, API integration and backend business logic.

### Core application stack

- **Frontend:** React, TypeScript and Vite
- **Backend:** .NET 8 / ASP.NET Core
- **Database:** PostgreSQL with Entity Framework Core
- **Desktop packaging:** Tauri
- **Source control and CI:** Git and GitHub Actions

### Visual screen designers

1. **[Onlook](https://onlook.com/) — visual React editor.** A tool to investigate for visually editing existing React components and adjusting layout, spacing, colors and typography. [GitHub repository](https://github.com/onlook-dev/onlook). Best candidate to test first for redesigning existing dashboards and screens. Verify current Linux/browser workflow and compatibility with the project's React/Vite setup before adoption.
2. **[Plasmic](https://www.plasmic.app/) — browser-based visual builder.** Provides a drag-and-drop studio and React integration for designing new pages and reusable interface components. [Documentation](https://docs.plasmic.app/). Best candidate for browser-based design and new screens; integration with existing screens may require wrapping or refactoring components.
3. **[SculptUI for VS Code](https://marketplace.visualstudio.com/items?itemName=ardevia.sculptui-vscode) — visual React editing extension.** Intended for selecting rendered React elements and making targeted visual changes through a VS Code workflow. Best considered as a supplementary option for focused edits.

These are candidate tools, not yet an approved part of the production build. Do not introduce their SDKs, generated code, credentials or external runtime dependencies into production without reviewing the diff and testing the frontend build, authorization behavior and key workflows.

## Privacy

SMIS now includes a complete software-level [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md), covering institutional data-controller responsibilities, student and staff data, minors and sensitive records, access control, audit logs, financial data, documents and backups, third-party services, retention, data-subject rights, complaints, incident response and Ugandan data-protection references.

The policy is also published inside the web application at `/privacy-policy.html` and is linked from both the sign-in screen and authenticated workspace. The deploying institution remains responsible for its own legal notices, privacy contact details, retention schedule and compliance obligations.

## Quick development setup

### Prerequisites

- .NET 8 SDK
- PostgreSQL 15/16 recommended
- Node.js 24 and npm
- Git
- Rust toolchain for Tauri Windows builds

### Backend

```bash
cd backend
dotnet restore
dotnet build SchoolManagement.sln
dotnet test SchoolManagement.sln
```

Configure PostgreSQL and the JWT key through environment variables or the appropriate local configuration. Then apply migrations:

```bash
dotnet ef database update --project src/SchoolManagement.Infrastructure --startup-project src/SchoolManagement.Api
```

Run the API:

```bash
cd src/SchoolManagement.Api
dotnet run
```

### Frontend

```bash
cd frontend
npm ci
npm run build
npm run dev
```

For the complete production procedure, follow [`INSTALLATION.md`](INSTALLATION.md), not this abbreviated setup.

## Authentication and administration

The API uses JWT authentication and server-side authorization policies. A System Administrator account is required to configure the institution and exercise all administration workflows.

Development/bootstrap environments use the deterministic `admin` / `admin123` seed when `SEED_ADMIN_PASSWORD` is not supplied. Setting `SEED_ADMIN_PASSWORD` overrides that development default. Production never falls back to the development password: `SEED_ADMIN_PASSWORD` is required and must be at least 12 characters. **The development credential is not a production credential and must never be retained in production.**

The acceptance guide includes a controlled administrator test in which a second limited-role user is created and verified to ensure that authorization is enforced rather than merely hiding screens.

## End-to-end acceptance test

The repository includes an explicit golden-path acceptance procedure in [`INSTALLATION.md`](INSTALLATION.md). It uses a dedicated test database and the following test student data:

- Name: **Kaigwa Akram**
- Assessment/admission number: **U075/042**
- Test admission/reporting date: **2026-09-09**

The path covers admission, enrollment, course registration, UGX fee billing, installment payments, ledger verification, attendance, assessment/results, student profile and reporting. **Do not run this scenario against a production database.**

## System scope

### Institutional structure

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

### Student lifecycle

```text
Application → Admission → Student → Enrollment → Period Registration
→ Course Registration → Attendance / Practical / Clinical / Workplace Learning
→ Assessment → Results → Progression → Completion → Graduation / Certification → Alumni
```

### Core domains

- Identity and role-based access
- Institution, campus, faculty and department management
- Programme and curriculum management
- Admissions and enrollment
- Student and guardian management
- Academic years, periods and intakes
- Courses and course registration
- Attendance, including QR attendance
- Theory, practical, clinical and competency-based assessment
- Results, progression and transcripts
- Staff and teaching allocation
- Finance and fees
- Hostel and transport
- Library
- Clinical/workplace attachment
- Graduation, certification and alumni
- Communication and local notifications
- Reporting and audit
- System administration

Student/guardian self-service portals are **not part of the current scope**. Academic results, transcripts and institutional records are managed by authorized school staff through the local SMIS.

## Finance and currency

The institutional system currency is **UGX — Ugandan Shilling**. Finance workflows cover invoices, payments, installments, allocation, receivables, ledger, journals, credit notes/refunds, fiscal periods, budgets, bank reconciliation/reporting, accounting dimensions and financial statements foundations.

Amounts entered as `125000` represent **UGX 125,000**. Production deployments must not silently reinterpret institutional amounts as USD, EUR or another currency.

## Windows installer and icon

The approved application icon is `frontend/public/icon.png` and must retain that exact filename. The Tauri packaging process generates the Windows icon assets from it. The resulting NSIS installer is a Windows `.exe` whose own file icon is the SMIS icon; the installed application and shortcuts use the same branding.

The installer is intended to be distributed through GitHub Releases and can then be copied to a flash disk for offline transfer to the target Windows machine.

## Documentation

- [`INSTALLATION.md`](INSTALLATION.md) — complete installation, deployment, acceptance testing and release checklist
- [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) — complete SMIS privacy policy and data-protection baseline
- [`PROGRESS.md`](PROGRESS.md) — authoritative implementation and production-gate tracker
- [`BACKEND_SETUP.md`](BACKEND_SETUP.md) — backend-focused setup notes
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture
- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — requirements
- [`docs/UGANDA_INSTITUTIONAL_MODEL.md`](docs/UGANDA_INSTITUTIONAL_MODEL.md) — Uganda institutional data model
- [`docs/DATABASE.md`](docs/DATABASE.md) — database architecture
- [`docs/API.md`](docs/API.md) — API architecture
- [`docs/SECURITY.md`](docs/SECURITY.md) — security baseline
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment architecture
- [`docs/adr/`](docs/adr/) — architecture decisions

## Verification policy

A feature is not considered production-ready merely because its screen exists. Release verification must cover build/test results, database migrations, authentication, authorization, real persistence, validation, audit behavior, the complete admission-to-finance-to-assessment golden path, and clean-machine installation.

Run the full automated baseline before release:

```bash
cd backend
dotnet restore SchoolManagement.sln
dotnet build SchoolManagement.sln --configuration Release
dotnet test SchoolManagement.sln --configuration Release

cd ../frontend
npm ci
npm run build
```

Then require successful GitHub Actions results and a successful Windows installer build before distributing the installer.
