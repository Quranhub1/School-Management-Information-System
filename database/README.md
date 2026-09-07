# Database migrations for SMIS

This directory contains SQL-based database schema scripts for PostgreSQL.

## Files

- `migrations/0001_InitialCreate.sql` — Creates the full SMIS schema (identity, institution, academic structure, students, staff, finance, library, etc.)
- `migrations/0001_InitialCreate.rollback.sql` — Rolls back the initial schema
- `migrations/0002_AcademicManagement.sql` — Academic classes, streams, and subjects tables
- `seed/admin_roles.sql` — Seeds initial institutional roles

## Usage

Run migrations manually against a PostgreSQL instance:

```bash
psql -h localhost -U school_management -d school_management -f migrations/0001_InitialCreate.sql
psql -h localhost -U school_management -d school_management -f seed/admin_roles.sql
```

Or via Docker Compose (migrations run automatically on first startup):

```bash
cd ../infrastructure
docker compose up -d
```

## Notes

- EF Core migrations are scaffolded in CI. For production use the SQL scripts above.
- All UUIDs use `gen_random_uuid()` (requires `pgcrypto` extension on older PostgreSQL, built-in from PG 13+).
- The schema is designed for PostgreSQL 15+.
