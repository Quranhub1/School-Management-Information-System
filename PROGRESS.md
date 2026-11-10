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


## Reproducible dependency setup — November 2026

### Implemented on `chore/reproducible-one-command-setup`

- [x] Add a Windows PowerShell setup script that checks Node.js/.NET prerequisites, runs frontend `npm ci`, and restores the backend .NET solution.
- [x] Add a Linux setup script with equivalent prerequisite checks and dependency restoration.
- [x] Add Windows and Linux update helpers that perform a fast-forward-only pull and then run dependency setup.
- [x] Make update helpers refuse to run with a dirty working tree, protecting local edits.
- [x] Document the one-command setup and update workflow in README and INSTALLATION.
- [x] Keep exact frontend package versions reproducible through the committed npm lockfile; `npm ci` installs the complete dependency graph, including Zod, AG Grid, Chart.js and local font packages.
- [ ] Execute both setup scripts on clean Windows and Ubuntu machines and record successful dependency restoration.
- [ ] Verify backend NuGet restore and frontend npm clean-install/build in CI on the final branch head.
- [ ] Decide and document the institution's offline-server package-cache/internal-mirror strategy; Git does not carry `node_modules` or NuGet caches.
- [ ] Consider NuGet lock-file generation and pinning SDK versions after checking all project target frameworks and CI runners.

**Important boundary:** a standard `git pull` does not run arbitrary setup scripts. Use `update.ps1` or `update.sh` for a pull-plus-restore operation. This avoids unsafe implicit code execution during Git operations while still making updates a single command.


## Runtime diagnostics — React hooks and Vite HMR

### Implemented on `chore/reproducible-one-command-setup`

- [x] Confirm `ReportCards.tsx` declares `useState` and `useEffect` inside the `ReportCards` function; no hook-rule violation is visible in the current `main` source.
- [x] Confirm the committed lockfile resolves `react` and `react-dom` to the same version (19.2.8) and has one top-level entry for each.
- [x] Configure Vite `resolve.dedupe` for `react` and `react-dom` to guard against duplicate module instances in linked/hoisted dependency layouts.
- [x] Remove the hard-coded HMR host so Vite derives the WebSocket host from the browser URL, supporting localhost and LAN access more reliably.
- [ ] Verify the actual Windows `node_modules` tree with `npm ls react react-dom`; the browser error alone cannot establish whether a duplicate runtime is present.
- [ ] Verify HMR after restarting Vite and confirming port 5173 is owned by the expected project process.
- [ ] Run frontend CI and browser-level regression checks after these configuration changes.

**Diagnostic note:** The Vite WebSocket error may also be caused by a stopped/failed Vite process, a port conflict, or browser/proxy network handling. Configuration changes alone do not prove the local server is reachable.


## UI copy and network-error cleanup — November 2026

### Implemented in this change

- [x] Remove the Inventory helper paragraph without changing automatic S/N or custom-column behavior.
- [x] Remove explanatory fee-configuration copy and the non-functional “module is available” placeholder paragraphs from the Academic Reports, Subject Management, Teacher Assignments, Assessment Configuration and Student Notifications panels.
- [x] Remove the Student Portal explanatory paragraph while retaining authorization and role-based access boundaries.
- [x] Remove redundant instructional/placeholder copy from Mobile Money Payments, Staff recruitment, Student Finance lookup, Curriculum draft-selection, Alumni document requests and Admissions external-board status panels.
- [x] Correct academic-year/period, Streams, staff-allowance and Mobile Money bearer-token retrieval to use the shared `getAccessToken()` helper and canonical `smis.accessToken` key.
- [x] Add bearer-token headers and non-success handling to Mobile Money student-search, invoice-list and transaction-cancel requests.
- [x] Correct FeeTypesManager to load academic years through the shared authenticated academic-structure API.
- [x] Correct the balance-sheet fiscal-period failure: reject an as-of date outside configured fiscal periods with a clear validation error rather than silently assuming a calendar fiscal year or triggering an unhandled exception.
- [x] Return HTTP 400 with a useful validation message for invalid income-statement/balance-sheet date ranges instead of allowing `ArgumentException` to surface as HTTP 500.
- [x] Render the structured finance API validation message in the Accounting Reports screen instead of displaying raw JSON.

### Verification still required

- [ ] Run frontend TypeScript, Vitest and production build after the authentication and copy cleanup.
- [ ] Run backend Finance application/API tests and add regression coverage for a balance-sheet date outside configured fiscal periods.
- [ ] Verify Fee Types, Academic Years and Academic Periods with a real authenticated account; confirm no 401 requests remain.
- [ ] Verify the balance sheet for 2026-11-08 with a configured fiscal period; confirm an out-of-period date returns HTTP 400 with the setup instruction.
- [ ] Create the institution-approved fiscal period covering 2026-11-08 in the target database. Do not auto-create a financial period or assume calendar-year boundaries without institutional approval.
- [ ] Continue a screen-by-screen visual review of all remaining authenticated modules and tabs. This change removes the identified redundant copy and stub paragraphs; it does not remove required labels, validation messages, warnings, empty states or operational instructions.

**Status:** targeted UI copy and identified request/report defects are corrected in source. CI and runtime verification remain pending. Do not mark the repository-wide screen review complete until each remaining screen and tab has been inspected and its regression checks passed.


## Framer Motion workspace transitions — November 2026

- Reuse the existing Framer Motion dependency for reduced-motion-aware workspace and sidebar transitions.
- Keep navigation, forms, validation, keyboard interaction and login behavior functional when motion is disabled.
- Avoid animating large data grids or expensive paint properties; profile on representative low-powered devices.


## Global command palette — November 2026

- [x] Add locally bundled `cmdk` for an accessible global command palette opened with Ctrl+K / Cmd+K.
- [x] Add role-filtered module navigation using the same sidebar visibility rules as the application shell.
- [x] Search students, applicants, alumni, staff, courses, programmes, academic years, semesters and teaching groups through the existing authenticated `/api/search` endpoint.
- [x] Add sign-out command and keyboard navigation; search is on-demand and does not preload full directories.
- [ ] Run frontend type-check, tests and production build on the rebased PR head; verify the palette with representative roles.
- [ ] Add direct record-detail navigation only where the destination modules expose a supported record-opening route.

- [x] Add a compact, left-scrolling latest-admitted-student ribbon to the Admissions & Screening workspace. It reads the newest non-archived student linked to an admission record and respects reduced-motion preferences.


## SchoolPay integration — unified payment work resumed (2026-11-10)

**Status: RESUMED — source review and provider-documentation checks are complete enough to begin isolated posting corrections. The live PostgreSQL schema still must be inspected before any schema migration is designed or applied.**

### Scope and integration decisions already established

- Institution: Kampala School of Health Sciences (KSHS).
- Finance integration approach: extend the existing SMIS finance module (hybrid approach).
- Initial payment channel: mobile money.
- Payment initiation: support both school/staff-initiated and payer-initiated flows.
- SchoolPay implementation is deliberately paused here while other work takes priority. Resume from the database-verification step below; do not begin migrations based only on the source-code snapshot.

### Seven required SchoolPay physical tables and fields

The supplied SchoolPay schema notes specify these physical PostgreSQL table names and fields:

1. `chart_of_accounts`: `id`, `account_code`, `account_name`, `account_type`, `is_active`, `created_at`.
2. `students`: `id`, `reg_number`, `schoolpay_code`, `full_name`, `program_name`, `status`, `created_at`.
3. `student_ledgers`: `id`, `student_id`, `semester_id`, `total_billed`, `total_paid`, `balance`, `updated_at`.
4. `payment_transactions`: `id`, `schoolpay_tx_id`, `student_id`, `amount_paid`, `payment_channel`, `payer_name`, `payer_phone`, `payment_date`, `status`, `raw_payload`.
5. `payment_allocations`: `id`, `transaction_id`, `student_id`, `fee_type`, `amount_allocated`, `created_at`.
6. `journal_entries`: `id`, `entry_date`, `reference_number`, `description`, `created_at`.
7. `journal_items`: `id`, `journal_entry_id`, `account_id`, `debit_amount`, `credit_amount`.

The supplied notes also call for unique SchoolPay/provider transaction identifiers and unique receipt numbers. Confirm the complete provider contract and constraints before implementation.

### Existing SMIS model/table mapping found in source review

The EF Core model snapshot and finance configuration were inspected on `main`. The following are source-level findings, **not confirmation of the live database schema**:

| Required SchoolPay table | Existing SMIS table/entity candidates | Assessment to carry into design |
|---|---|---|
| `chart_of_accounts` | `ChartOfAccounts` | Existing chart-of-accounts model; reconcile columns and map the physical table name without creating a duplicate chart. |
| `students` | `Students` | Reuse the canonical SMIS Student entity/table; do not create a second student directory. Map SchoolPay identifiers and any required provider-facing fields carefully. |
| `student_ledgers` | `PaymentLedgerEntries` | No direct equivalent found. Ledger entries are history/events, not a student-plus-semester summary. Design a separate aggregate only if the agreed contract requires it. |
| `payment_transactions` | `Payments`, `MobileMoneyTransactions`, `SchoolPaymentNotifications` | No single direct equivalent found. Define the relationship between provider transaction, notification/event, SMIS payment and invoice before creating a table or duplicating records. |
| `payment_allocations` | `PaymentAllocations` | Existing invoice-based allocations must be reconciled with the requested transaction/student/fee-type shape; preserve invoice allocation and reconciliation behavior. |
| `journal_entries` | `JournalEntries` | Existing accounting journal model; reconcile field names and retain posting, status, source and reversal behavior. |
| `journal_items` | `JournalEntryLines` | Existing journal-line model; reconcile debit/credit and account relationships without bypassing journal balancing rules. |

Relevant source inspected: `FinanceConfiguration.cs`; finance domain models including `StudentInvoice`, `MobileMoneyTransaction` and `SchoolPaymentNotification`; `SchoolManagementDbContext.cs`; `SchoolManagementDbContextModelSnapshot.cs`; and the November 2026 SchoolPay-notification and student-invoice-line migrations.

Additional design facts from that review:
- Existing `PaymentAllocation` is tied to a `Payment` and a `StudentInvoice`, with a unique payment/invoice pair.
- Existing journal entries carry entry number, status, source type/source ID and reversal-related behavior; journal lines carry journal-entry ID, account ID, debit, credit and description.
- Existing SchoolPay notification records already retain provider references, student/invoice links where known, amount/currency, status, payer details, raw payload and processing timestamps.
- Existing mobile-money transactions already retain provider, transaction/external references, student/invoice links, amount/currency, status and request/completion timestamps.
- Existing student invoices represent billed fee obligations and track paid/discount amounts and outstanding balance.

### Provisional mapping direction — not approved for migration yet

- Prefer EF Core table/column mapping (for example, `.ToTable(...)` and `.HasColumnName(...)`) over renaming CLR/domain classes solely to satisfy physical PostgreSQL names.
- Assess whether the five existing tables can safely be mapped to the required snake_case physical names: `ChartOfAccounts` → `chart_of_accounts`, `Students` → `students`, `PaymentAllocations` → `payment_allocations`, `JournalEntries` → `journal_entries`, and `JournalEntryLines` → `journal_items`.
- Treat `student_ledgers` as a potential new student/semester aggregate, distinct from the existing ledger-entry history.
- Treat `payment_transactions` as a potential provider transaction record only after its lifecycle and relationship to `SchoolPaymentNotifications`, `MobileMoneyTransactions` and `Payments` are explicitly designed.
- Preserve existing foreign keys, indexes, unique constraints, invoice allocation, audit history, journal balancing, reversals and finance workflows.
- Validate data types and semantics with the provider contract before choosing numeric precision, timestamp handling or JSON/JSONB representation.

### Required next steps when work resumes

1. In Windows PowerShell, update the local checkout from `main` using the fast-forward-only workflow:
   ```powershell
   cd "C:\Users\JOES TECH\School-Management-Information-System"
   git switch main
   git pull --ff-only origin main
   ```
2. In pgAdmin, open the `school_management` database's Query Tool and run the read-only schema inspection SQL below. Do not paste SQL into PowerShell.
   ```sql
   -- List public tables
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_type = 'BASE TABLE'
   ORDER BY table_name;

   -- Inspect relevant columns
   SELECT table_name, column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND (
       table_name ILIKE '%student%'
       OR table_name ILIKE '%payment%'
       OR table_name ILIKE '%journal%'
       OR table_name ILIKE '%account%'
       OR table_name ILIKE '%schoolpay%'
     )
   ORDER BY table_name, ordinal_position;

   -- Check applied EF Core migrations
   SELECT *
   FROM "__EFMigrationsHistory"
   ORDER BY "MigrationId";
   ```
3. Save/share the query results and compare the actual PostgreSQL schema and applied migration history with the EF Core model snapshot. Record any drift before designing migrations.
4. Confirm the complete SchoolPay specification, including exact types, nullability, primary/foreign keys, unique constraints, indexes, receipt-number rules, transaction lifecycle, retries/idempotency and reconciliation expectations.
5. Produce a table-by-table migration and compatibility plan, including data-preservation and rollback strategy, for review before implementation.
6. Only after approval, implement migrations and code changes on a feature branch; test against a database backup/test database, run backend/frontend tests and CI, and verify existing finance workflows.

**Important:** the SQL above is read-only. The live database has not yet been inspected by the assistant, and no claim is made that the physical database currently matches the source snapshot. Do not rename tables, create tables, or apply migrations until the live inspection and compatibility review are complete.


## System-wide person-name display order — November 2026

**Required display convention:** surname, first name, then other/given names, with every component displayed in uppercase. Example: `NAKIBUULE ALICE MARIA`. This is a presentation rule; do not swap or rewrite the underlying `FirstName`, `LastName` or `OtherNames` database fields or API request semantics.

### Implemented on `fix/system-wide-name-order`

- [x] Add shared frontend `formatPersonName` utility to apply the same order, omit blank name parts and convert the final display name to uppercase.
- [x] Apply the formatter to student registry, archived student records, admission views, document student selectors and relevant student dashboard displays.
- [x] Apply surname-first display to staff registry, payroll, staff allowances and related staff selectors/notifications.
- [x] Update key backend-generated student display names used by student portal profiles, reports/transcripts, certificates, Student 360, examination analytics, defaulter lists, chronic-absence lists and global search.
- [x] Align the mock API server's student/staff/applicant/alumni name formatting with the same convention.
- [ ] Audit all remaining frontend modules, PDF/export templates, notifications and API projections for hard-coded first-name-first or mixed-case display strings; apply uppercase consistently.
- [ ] Run frontend TypeScript checks, Vitest and production build; run backend build and automated tests.
- [ ] Verify representative student and staff records with and without other names in registry, search, dashboards, payroll, reports, certificates and printed/exported documents.

**Data-integrity rule:** this change must affect display formatting only. Uppercasing is also display-only; Existing stored name components and API input fields remain in their original semantic columns. Do not run a database migration or bulk-update person records to change display order.


## Unified finance payment pipeline — implementation resumed (2026-11-10)

### Confirmed architecture decisions

- All payment channels must update the same canonical SMIS student financial records; no gateway may maintain an independent student balance.
- Keep the existing StudentInvoices, Payments, PaymentAllocations, PaymentLedgerEntries, JournalEntries and JournalEntryLines finance foundation.
- Provider intake/notification records are evidence and processing state, not separate student balances.
- SchoolPay covers multiple collection rails (bank, mobile money and other channels). Its receipt must not be posted as if every SchoolPay transaction were a mobile-money settlement.
- Use a dedicated SchoolPay clearing asset account for verified SchoolPay receipts, then reconcile settlement to the correct bank/mobile-money destination using provider settlement evidence.
- Keep pending, failed, unmatched or unverified transactions out of posted student balances.
- Implement one provider-neutral idempotency/transaction intake layer before enabling unattended processing across multiple gateways.
- Keep manual payments in the same Payments/allocation/journal path. Manual cash, bank transfer, card/cheque and gateway receipts must never create separate student balances.

### Implemented in PR #290 — not merged

- [x] Correct SchoolPay unallocated payment method/currency argument order.
- [x] Preserve SchoolPay as the recorded channel.
- [x] Add SchoolPayClearing account code 1040 and seed the SchoolPay Clearing asset account.
- [x] Centralize payment account resolution and route SchoolPay to the clearing account rather than the mobile-money or bank account directly.
- [x] Add unit tests for Cash, Bank Transfer, Cheque, Card, Mobile Money, MTN MoMo, Airtel Money, SchoolPay, blank and unsupported channels.
- [ ] Wait for Backend CI, Foundation CI and Full System CI on the final PR head; inspect failures and rerun/fix as required.
- [ ] Review and merge only after checks pass.

PR: https://github.com/Quranhub1/School-Management-Information-System/pull/290

### Next implementation milestones

1. Add a provider-neutral transaction inbox/idempotency key with unique provider + provider transaction/receipt identifiers, and a nullable link to the canonical Payment.
2. Make payment posting and the transaction's Posted state one database transaction; concurrent callbacks and Sync imports must not double-post.
3. Add student SchoolPay payment-code mapping and strict matching. Do not match by name alone.
4. Implement the official SchoolPay webhook envelope and SHA-256 signature validation (API password + schoolpayReceiptNumber) with constant-time comparison. Keep Sync/Adhoc MD5 request signing separate.
5. Add Sync API import/recovery because the official documentation says webhook delivery is a single attempt and is not automatically retried.
6. Quarantine unmatched, ambiguous, amount-mismatched and unsupported supplementary-fee transactions for Finance review.
7. Reconcile SchoolPay clearing to the actual settlement bank/channel; do not treat the platform as a single physical payment rail.
8. Extend the same provider-neutral posting contract to mobile money and any additional gateways; keep Finance-entered manual receipts on the same canonical posting path.
9. Run migration/model snapshot checks, backend unit/integration tests, PostgreSQL CI and frontend regression checks before production use.

### Provider contract confirmed from official SchoolPay documentation

- Sync API: MD5 of schoolCode + identifyingDate + API password; range sync uses fromDate.
- Adhoc API: MD5 of schoolCode + identifyingReference + API password; Register/Request use external reference and Check uses payment reference.
- General webhook signature: SHA-256 of School API password + schoolpayReceiptNumber.
- SchoolPay webhook delivery is documented as a single attempt; scheduled Sync API recovery is therefore required.
- Sync API exposes both ordinary and supplementary fee payments, including source transaction ID, receipt number, channel, settlement bank and student payment code.
- Provider documentation: https://www.schoolpay.co.ug/apidocumentation

**Verification boundary:** PR #290 is an isolated posting correction, not completion of the provider-neutral transaction inbox, signed webhook, Sync API, full reconciliation or live SchoolPay integration. No live database migration or provider transaction has been run.