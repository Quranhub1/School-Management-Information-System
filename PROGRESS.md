# School Management Information System — Project Progress

**Last updated:** 2026-11-08  
**Tracking branch:** `main`  
**Current release:** `v0.2.0`  
**Currency:** UGX

## Current status

The core backend, persistence, security hardening, frontend, automated verification, and native desktop release pipeline are implemented. **SMIS v0.2.0 is published on GitHub with four verified desktop assets:** Windows x64, Windows x86, Ubuntu x64 `.deb`, and Ubuntu x64 `.AppImage`.

Corrected native release workflow run `34351052149` completed successfully for Windows x86/x64, Ubuntu x64, and release publication. The obsolete tag-helper workflow has been removed. The later duplicate desktop-workflow cleanup on `main` also passed the full CI suite, including native desktop builds.

A dedicated executable target-environment acceptance runbook is now available at `docs/PRODUCTION_ACCEPTANCE.md`. It records the evidence required for golden-path, authorization, module, finance, attendance, assessment, clinical, staff/student, deployment, backup/restore, desktop, and security sign-off.

## Structured logging and observability — November 2026

- [x] Add Serilog to the .NET 8 API with structured console and daily rolling file sinks.
- [x] Store logs in the service account's local application data directory; allow deployment override through `SMIS_LOG_DIRECTORY`.
- [x] Configure 14-file retention and a 10 MiB per-file limit through appsettings.
- [x] Add request correlation middleware with safe incoming ID validation and an `X-Correlation-ID` response header.
- [x] Enrich API request logs with correlation ID, HTTP method, path, status and elapsed time.
- [x] Add authenticated, rate-limited browser diagnostic ingestion with bounded payloads and secret redaction.
- [x] Add React global handlers for uncaught errors and unhandled promise rejections.
- [x] Propagate correlation IDs from the modern API client.
- [x] Add correlation middleware unit tests and document the operational logging policy in `docs/LOGGING-OBSERVABILITY.md`.
- [ ] Run backend and frontend CI for this change and resolve any failures before merging.
- [ ] Extend correlation header propagation to remaining legacy frontend API modules as they are consolidated.
- [ ] Configure production log-directory permissions and retention/collection during target-environment acceptance.

## Dexie.js offline data and synchronisation — 2026-11-08

- [x] Add Dexie.js 4.4.7 as a locally bundled frontend dependency.
- [x] Upgrade the existing `smis-offline` IndexedDB database to a versioned Dexie schema while retaining legacy stores.
- [x] Add a role/user-scoped read-through cache with network-failure fallback; HTTP authorization/server errors are not masked.
- [x] Enable the first read cache for the authenticated notices board (30-minute TTL).
- [x] Clear the signed-out user's cached reads on logout.
- [x] Replace the unsafe generic offline mutation replay path with a blocked-by-default, auditable operation journal and explicit conflict records.
- [x] Reject offline mutations until a module-specific synchronisation contract is implemented; financial operations are explicitly excluded from the journal.
- [x] Document PostgreSQL authority, cache isolation, migration, and financial idempotency/validation/conflict gates in `docs/OFFLINE_MODE.md` and `docs/OFFLINE_FIRST.md`.
- [ ] Add visible staff-facing sync queue/conflict review UI and operational audit export.
- [ ] Add automated IndexedDB migration, cache isolation, logout cleanup, offline fallback and conflict tests.
- [ ] Expand read caching only to approved low-sensitivity datasets; sensitive student, clinical, staff and finance records remain excluded pending device data-protection controls.
- [ ] Implement low-risk offline writes one module at a time with API authorization, idempotency, server validation and explicit 409 conflict handling.
- [ ] Implement financial idempotency keys with a PostgreSQL unique constraint, atomic ledger posting, request-payload matching and staff-reviewed conflict resolution before enabling any finance replay.
- [ ] Run frontend build/tests, backend tests, and Windows/Linux desktop CI on the Dexie branch; perform target-device offline acceptance testing.


**Last updated:** 2026-10-11  
**Tracking branch:** `main`  
**Current release:** `v0.2.0`  
**Currency:** UGX


**Last updated:** 2026-10-11  
**Tracking branch:** `main`  
**Current release:** `v0.2.0`  
**Currency:** UGX

## Current work — October 2026

- [x] Replaced the institution login page with the approved glassmorphism login design in `frontend/public/institution-login.html`
- [x] Refactored the institution login HTML for clarity while preserving the approved visual design and controls
- [ ] Wire the approved login controls to the existing SMIS authentication API without altering the approved login design
- [ ] Load institution name, motto, logo, primary/accent colours and related branding from the active institution settings used by SMIS
- [ ] Verify successful login transfers the authenticated session into the existing SMIS application shell
- [ ] Verify login failure, loading state, Remember Me and password recovery behaviour against the real backend
- [ ] Complete Windows target-machine setup and validate the same backend/frontend workflow used for the production-style environment

## Current work — role-specific dashboards and table layouts

- [ ] Implement and verify a distinct, live-data dashboard for every configured role/role family, aligned to its permitted sidebar modules and backend authorization.
- [ ] Verify chart data, drill-downs, loading/empty/error states, and read-only boundaries with representative role accounts.
- [x] Publish the dashboard content, visualization, permission, and verification standard in `docs/ROLE_DASHBOARDS.md` (implementation remains in progress).
- [ ] Verify shared row/column resizing across all authenticated tabular screens and decide whether user layout preferences should persist.

## Inventory stock alerts — implementation in progress

- [x] Add administrator-only dashboard controls to configure a low-stock threshold for each named inventory item.
- [x] Persist each item's threshold with its database-backed inventory register; blank threshold means warn only when stock reaches zero.
- [x] Add a backend endpoint that identifies items at/below threshold and always flags items at zero.
- [x] Surface in-app warnings on Records Officer and School Warden/legacy Hostel Warden dashboards.
- [ ] Verify backend role authorization, threshold persistence, quantity parsing, and dashboard alerts through automated tests and representative role accounts.
- [ ] Run all affected CI workflows and confirm the database migration state remains consistent.

## Completed / verified

- [x] .NET 8 backend solution and modular domain structure
- [x] EF Core persistence and PostgreSQL integration
- [x] Academic, admissions, assessment, attendance, clinical, examinations, finance, identity, staff and student domains
- [x] Hostel and transport vertical slices
- [x] Teaching-to-attendance workflow
- [x] Admission decision synchronization and duplicate-admission prevention
- [x] Student/enrollment reuse during admission
- [x] Finance repository compatibility and explicit DI registrations
- [x] Production database/JWT placeholder validation
- [x] Production admin seed password enforcement
- [x] JWT issuer/audience validation
- [x] FinanceRead authorization policy
- [x] Login rate limiting
- [x] Admission upload validation
- [x] Assessment record lookup fix
- [x] Attendance and examination authorization regression coverage
- [x] UGX currency requirement
- [x] Backend build and automated tests
- [x] PostgreSQL migration/model consistency validation in CI
- [x] Permanent PostgreSQL integration tests
- [x] API startup/readiness verification
- [x] Ubuntu target-environment verification of PostgreSQL migrations, API health and administrator JWT login
- [x] Deterministic Development administrator bootstrap with secure Production password enforcement
- [x] Frontend production build
- [x] Playwright/browser installation and E2E smoke tests
- [x] Approved `frontend/public/icon.png` validation and Tauri icon generation
- [x] Installer privacy/license asset validation
- [x] Windows x86/x64 NSIS installers
- [x] Ubuntu x64 `.deb` and `.AppImage` packages
- [x] GitHub `v0.2.0` release publication and asset verification
- [x] Obsolete release tag-helper workflow removed
- [x] Duplicate WPF desktop workflow removed; `desktop-ci.yml` remains the effective WPF CI workflow
- [x] Full CI verification after workflow cleanup
- [x] No open GitHub issues at release verification
- [x] Target-environment acceptance procedure documented as an executable runbook

## Remaining production acceptance gates

These require an actual target deployment or physical client/test environment and must not be marked complete from repository inspection alone:

- [ ] Execute the isolated golden-path acceptance test on a dedicated test database
- [ ] Verify administrator and restricted-role authorization end-to-end
- [ ] Smoke-test every enabled frontend module and major workflow
- [ ] Verify admissions → acceptance → admission → student → enrollment → course registration
- [ ] Verify finance posting, adjustments, balances, ledger/reporting and UGX presentation
- [ ] Verify attendance manual/QR generation, validation, closing and production secret
- [ ] Verify assessment/examination/result calculations and transcript/progression behavior
- [ ] Verify clinical/workplace-learning persistence and workflows
- [ ] Verify staff and student management workflows
- [ ] Verify production deployment configuration, `/api/health`, systemd service and logs
- [ ] Verify Nginx/HTTPS/LAN configuration where used
- [ ] Verify PostgreSQL backup and restore on a separate test database/server
- [ ] Verify clean-machine Windows installation and first-run server connection
- [ ] Visually verify Windows installer, installed application and shortcuts use the approved SMIS icon
- [ ] Complete final security/configuration review and production sign-off
- [ ] Configure `main` branch protection / required status checks (requires repository administration access; current repository ruleset is disabled)

## Release

**Released:** `v0.2.0`  
**Corrected release workflow:** `34351052149`  
**Release target:** `9163ef416f8d44be66ab5e97408b1d2fcd3ed27f`  
**Current main:** `16b998c`

Expected published assets:

1. `School.Management.Information.System_0.2.0_amd64.AppImage`
2. `School.Management.Information.System_0.2.0_amd64.deb`
3. `School.Management.Information.System_0.2.0_x64-setup.exe`
4. `School.Management.Information.System_0.2.0_x86-setup.exe`

## Production rules

- Production secrets must never be committed to Git.
- `SEED_ADMIN_PASSWORD` and the attendance QR secret must be supplied by the deployment environment.
- Production must use strong unique administrator credentials.
- PostgreSQL must not be exposed directly to ordinary client machines.
- Production migrations must be reviewed and backed up before application.
- Finance amounts are institutional **UGX** unless the system is explicitly extended for multi-currency support.
- CI success does not substitute for target-environment acceptance.

## Definition of done

SMIS is ready for production sign-off only when the remaining target-environment acceptance gates above are completed, CI remains green, deployment health is verified, critical workflows are exercised successfully, backups/restores are validated, and repository administration has configured branch protection where permitted.


## Zod validation integration — November 2026

### Implemented in this change

- [x] Add Zod 4 as a direct frontend runtime dependency and record it in the npm lockfile.
- [x] Establish a central schema directory at `frontend/src/schemas/` with shared primitives and domain schemas.
- [x] Add reusable validation helpers for safe parsing, field-level error mapping, and API contract assertions.
- [x] Add initial request/form schemas for student admissions, finance payments/expenses, staff records, inventory movements/items, academic timetable entries, examination results, and library catalogue/loans.
- [x] Infer TypeScript types from schemas so validation and static types share a single source of truth.
- [x] Add unit tests for representative valid and invalid inputs, including UGX integer amounts, non-negative stock, required identifiers and date/time constraints.
- [x] Enforce request validation and response-contract parsing in Admissions API services (list/detail/create/update/decision).
- [x] Enforce payroll request validation for generation, payment and allowance/deduction updates; validate payroll list responses.
- [x] Enforce stream create/list validation in the Academics API service.
- [x] Enforce individual and bulk SMS request validation and validate send-result responses.
- [x] Enforce Student API create/update payload validation and validate student list/detail responses.
- [x] Enforce Finance API invoice creation/list response validation and payment request validation.
- [x] Enforce mobile-money payment initiation and bulk-payment request validation.
- [x] Enforce Finance API request validation for fee structure creation/application, credit notes, invoice notes and staff advance request/approval/recovery.
- [x] Add direct Zod form validation and field-error summaries to the Finance quick-payment, Accounts Office payment, Student Finance payment, bulk payment and mobile-money initiation forms.
- [x] Enforce HR staff creation/update and leave-request validation at the API service boundary.
- [x] Enforce Inventory register save payload and read/write response validation.
- [x] Enforce Library book creation and loan issue request validation.
- [x] Enforce bulk import request and result validation before/after the import API call.
- [x] Wire direct React form validation and visible field-error summaries into Student Admission, Staff create/edit, and Library book/loan forms; prevent submission until required data passes Zod.
- [x] Add optional Zod row-contract enforcement to the shared AG Grid component; invalid edits are reverted and field-level row errors are shown before caller persistence handlers run.
- [x] Attach row validation to the editable Inventory AG Grid and enforce item-name plus whole-number/non-negative quantity rules on inventory register reads and saves.
- [x] Add reusable `parseApiInput` and field-addressable `InputValidationError` so invalid requests are rejected before network submission.
- [x] Keep backend validation, authorization, database constraints and financial posting rules authoritative; frontend validation is an additional boundary, not a replacement.

### Verification notes

- [x] The first Frontend CI compile exposed missing imports for the new Library form validation helpers; the imports were added in a follow-up commit.
- [ ] Re-run Frontend CI against the corrected branch head and resolve any further TypeScript/test/build failures.

### Not yet tackled — remaining rollout

- [x] Install the frontend dependency graph successfully in CI (`npm install`); [ ] still run a clean `npm ci` to independently confirm lockfile reproducibility on the final head.
- [ ] Run TypeScript build, full Vitest suite and production Vite build; resolve any failures introduced by the integration.
- [ ] Extend direct React form validation to remaining create/edit workflows in Finance (fee structures, credits, advances and budgets), HR leave/recruitment, Inventory item setup, Library member management, Academics, Examinations and Administration. Current direct form wiring covers student admissions, staff records, library book/loan, finance payment, bulk payment and mobile-money forms; API guards protect additional service operations.
- [ ] Extend AG Grid Zod validation to other editable grids and explicitly test clipboard/bulk-paste behaviour; the shared grid guard and Inventory grid are now wired, but broader grid coverage remains.
- [ ] Validate each CSV/Excel imported row against the matching entity schema and return row/column-specific import errors; only the bulk-import request envelope and API result are currently validated.
- [ ] Extend runtime response schemas to all remaining API services and endpoints. The current response validation is enabled for admissions, payroll, streams, students, invoices, inventory registers, SMS send results and bulk-import results; other APIs remain typed-only.
- [ ] Add backend-aligned contract tests for DTOs, enums, nullable fields, IDs, pagination and date/time formats.
- [ ] Verify schemas against actual .NET request/response DTOs and EF/database constraints; adjust assumptions before enabling strict validation on production flows.
- [ ] Add module-by-module validation coverage and regression tests for all role-specific workflows.
- [ ] Add validation for SchoolPay integration contracts once provider-approved request/response payloads are available.
- [ ] Confirm offline desktop packaging includes Zod in the bundled frontend and run clean-machine Windows/Linux smoke tests.

**Status:** central Zod foundation, active validation in selected departmental API services, direct React form validation in Admissions, HR staff, Library and Finance payment workflows, and an AG Grid row-validation hook wired into Inventory are committed on the feature branch. Remaining work includes additional departmental forms, complete API coverage, per-entity import-row validation, broader editable-grid adoption and clipboard regression tests. Automated TypeScript/test/build verification is still required after the Library import fix and subsequent Finance additions; corrected CI reruns are queued. Do not declare system-wide adoption until all checks and remaining rollout/regression work are complete.
