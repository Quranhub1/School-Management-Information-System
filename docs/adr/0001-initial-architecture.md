# ADR 0001: Initial Architecture

- Status: Accepted
- Date: 2026-08-20

## Context

The system is intended to be a real school management platform deployed primarily on a school-owned local network. It must remain maintainable, testable, and usable without Internet connectivity for normal internal operations.

## Decision

Use a layered web application with a React/TypeScript frontend, ASP.NET Core backend, Entity Framework Core data access, and a relational database. Use Nginx as the production reverse proxy on Ubuntu Server. Keep domain modules separated and use GitHub as the implementation source of truth.

Use GitHub Actions for automated build and test workflows. Workflows are stored under `.github/workflows`.

## Consequences

- The application can be developed and tested without purchasing proprietary development tools.
- Backend and frontend can evolve independently behind a stable API boundary.
- Database changes can be versioned through migrations.
- CI can catch regressions before code is merged.
- The final production database engine remains an explicit deployment decision rather than an accidental implementation detail.
