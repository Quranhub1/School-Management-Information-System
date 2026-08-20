# School Management Information System

A comprehensive, modular and LAN-first School Management Information System (SMIS) for managing students, academics, finance, library, transport, staff, examinations, communication and school operations.

## Project status

**Phase 1 — Architecture and repository foundation**

The project is being built as a real production-oriented coding project with GitHub as the persistent source of truth.

## Architecture

- **Frontend:** React + TypeScript
- **Backend:** ASP.NET Core / C#
- **Data access:** Entity Framework Core
- **Database:** relational SQL database; production engine to be finalized during infrastructure validation
- **Production server:** Ubuntu Server
- **Reverse proxy:** Nginx
- **CI:** GitHub Actions
- **Deployment model:** primarily on-premises and LAN-first

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the authoritative architecture and [`docs/adr/`](docs/adr/) for recorded architecture decisions.

## Core domains

- Identity and access management
- Student management
- Staff and teachers
- Admissions and enrollment
- Academics
- Attendance
- Examinations and grading
- Finance and fees
- Library
- Transport
- Notifications and communication
- Parent portal
- Student portal
- Reporting
- Audit and administration

## Development workflow

1. Define requirements.
2. Record architecture decisions.
3. Create a feature or fix branch.
4. Implement the change.
5. Add or update automated tests.
6. Run GitHub Actions CI.
7. Review the change.
8. Merge only verified work into `main`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Database architecture](docs/DATABASE.md)
- [API architecture](docs/API.md)
- [Security baseline](docs/SECURITY.md)
- [Deployment architecture](docs/DEPLOYMENT.md)
- [Architecture decisions](docs/adr/)
