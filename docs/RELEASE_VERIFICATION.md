# Release Verification

## Purpose

Use this checklist against the exact commit intended for production. A green build proves compilation/tests covered by CI; it does not by itself prove production configuration, database state, authentication, or client-to-API integration.

## Verification sequence

1. Record the production commit SHA.
2. Run backend, frontend, desktop and full-system CI.
3. Apply EF Core migrations to a clean test database.
4. Verify login, roles and administrator permissions.
5. Exercise representative create/read/update/delete workflows in each production module.
6. Verify API-to-database connectivity and error handling.
7. Verify desktop-to-API connectivity and packaging.
8. Verify `icon.png` in all required application/resource locations.
9. Perform a production smoke test.
10. Mark the final completion checklist only after evidence exists for every gate.

## Completion rule

Do not label SMIS production-ready while any release gate is unverified.
