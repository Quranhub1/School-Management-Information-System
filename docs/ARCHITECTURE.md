# System Architecture

## Purpose

This document is the authoritative technical architecture for the School Management Information System (SMIS).

## Architectural principles

- LAN-first operation for the school environment.
- Modular domain architecture.
- Separation of frontend, backend, database, and infrastructure concerns.
- API-first communication between the frontend and backend.
- Database migrations are version-controlled.
- Automated tests and CI are required for meaningful changes.
- No production secrets are committed to Git.
- The `main` branch represents the stable project state.

## Initial technology direction

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

- Relational SQL database
- PostgreSQL is the preferred initial target unless project requirements establish a stronger reason to use another supported engine.

### Infrastructure

- Ubuntu Server for the target on-premises school server
- Nginx as reverse proxy
- Docker/container support where it improves reproducibility and deployment

## Major domains

- Identity and access management
- Student management
- Staff and teacher management
- Academic management
- Attendance
- Examinations and grading
- Finance and fees
- Library
- Transport
- Communication and notifications
- Parent portal
- Student portal
- Reporting

## Deployment model

The primary deployment target is an on-premises school server accessible through the school LAN. Internet connectivity is not required for normal internal operation after deployment.

## Development lifecycle

1. Requirement
2. Architecture/design
3. Feature branch
4. Implementation
5. Automated tests
6. GitHub Actions CI
7. Review
8. Merge to `main`
9. Release/deployment validation

## Source of truth

The repository is the source of truth for implementation. Architecture decisions, requirements, migrations, tests, workflows, and production-relevant configuration must be represented in version-controlled files.
