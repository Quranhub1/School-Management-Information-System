# SMIS capability benchmarking and implementation roadmap

## Objective

Improve SMIS by learning from established school information systems and education ERPs, while keeping SMIS's own architecture, Uganda-first workflows, LAN/offline operation, PostgreSQL data integrity, and role-based access. This is a capability roadmap, not a proposal to copy another product's source code or branding.

## Reference systems reviewed

- OpenEduCat: https://github.com/openeducat/openeducat_erp and https://www.openeducat.org/open-source-school-management-system/
- Frappe Education: https://github.com/frappe/education and https://docs.frappe.io/education/introduction
- Uganda-focused market reference: https://www.schoolmanageruganda.com/features

Common patterns across these references include a single student record shared by modules, a complete admissions-to-alumni lifecycle, attendance and grading, integrated fees and finance, portals, staff/payroll, library and facilities, notifications, analytics, imports/exports, and auditability. Product marketing is not proof that every feature is available in a free edition; verify feature and license scope before adopting an implementation.

## Implementation rules

1. **Inspect before building.** Search the existing frontend, API, domain model, migrations, tests, and role policies before adding a new feature. Extend an existing module instead of creating a duplicate.
2. **One source of truth.** Student, staff, finance, and institution records should be stored server-side in PostgreSQL and linked by stable IDs. Do not use browser storage as a substitute for persistence.
3. **Complete workflows, not decorative screens.** A feature is complete only when its UI, authorized API, validation, persistence, audit events where appropriate, error/loading/empty states, and tests work together.
4. **Role-safe by default.** Navigation visibility is not authorization. Enforce access in backend policies and test both allowed and denied roles.
5. **LAN-first and offline-capable.** Bundle fonts/assets locally. Core school operations must not depend on public CDNs or third-party APIs.
6. **Uganda-ready.** Keep UGX as the currency default; make payment integrations configurable and never assume a foreign payment provider. Support institution-specific academic terms, streams, grading scales, and reports.
7. **Safe data handling.** Do not import another product's proprietary source, assets, sample data, or trademarks. Respect each project's license and data-protection requirements.

## Capability matrix and proposed priorities

Status is deliberately marked **audit required** where the repository's current implementation and test coverage must be verified before deciding whether to extend or replace anything.

| Priority | Capability | Benchmark pattern | SMIS implementation direction | Acceptance evidence |
|---|---|---|---|---|
| P0 | Account and role persistence | Shared server-side identity and role assignments | Verify create/list/re-login against the same PostgreSQL database; make mismatched API/database targets visible | Integration test proves a created user and roles remain after a new DbContext/API request; unauthorized roles are denied |
| P0 | Unified student lifecycle | One student record shared by admissions, academics, fees, attendance, exams and alumni | Audit duplicate records and IDs; ensure admission acceptance creates/links one student without retyping | End-to-end test from application to enrollment and linked finance/academic records |
| P0 | Database integrity and recovery | Consistent data, migrations, audit trails and recoverability | Test migrations from a clean database and an existing database; verify backups/restores and durable volumes | Migration test plus documented backup/restore rehearsal |
| P0 | Role-specific workflows | Each office sees permitted actions and its own operational queues | Audit each configured role against frontend navigation and backend policies; remove dead/placeholder actions | Permission matrix tests; every visible action completes or explains a real unavailable dependency |
| P1 | Admissions CRM and intake | Enquiry, application, documents, review, decisions, offer and enrollment | Connect applicant follow-up, document checklist, decision history, intake/stream allocation and conversion to student | Duplicate-safe conversion test and application status history |
| P1 | Academic delivery | Curriculum, course registration, timetable, attendance, assessment, grading and progression | Audit course/stream/semester relationships, timetable clash prevention, grading scales, missing-work alerts and progression | End-to-end academic year/semester test with timetable conflicts and grade calculations |
| P1 | Fees and finance | Fee structures, invoices, installments, receipts, ledgers, waivers and reconciled reports | Ensure student invoices, payments, allocations, refunds and finance ledger reconcile; support configurable local payment channels | Ledger reconciliation tests, duplicate-payment protection and auditable reversals |
| P1 | Student/guardian self-service | Timetable, results, attendance, balances, documents and notices | Verify student portal API contracts, access isolation, profile updates and document permissions | Tests prove a student can only see their own records |
| P1 | Communications and notifications | Announcements, targeted messages, reminders and delivery status | Add reusable in-app notification/event patterns first; SMS/email/WhatsApp should be optional adapters | Notification audience/permission tests and delivery-failure handling |
| P1 | Staff and HR | Staff records, leave, workload, allowances, payroll and payslips | Connect staff profile, approvals, allowance entry, payroll calculations and audit trail without duplicating employee records | Payroll/allowance calculation tests and role separation |
| P2 | Library and learning resources | Catalog, circulation, fines, member history, digital resources | Verify book/member/loan flows and connect any fines to finance only through auditable transactions | Issue/return/overdue tests and member-level access controls |
| P2 | Inventory, property and facilities | Stock receipts/issues, assets, maintenance, procurement and accountability | Separate consumable stock from durable assets; link records, approvals and maintenance to accountable offices | Stock-balance tests, movement history and negative-stock controls |
| P2 | Hostel and student welfare | Allocation, movements, incidents, welfare and maintenance | Keep school-welfare and school-warden tasks separate from prohibited/unused transport features; enforce least privilege | Warden role tests and incident/inspection history |
| P2 | Reporting and analytics | Operational dashboards, cohort analysis, export and scheduled reports | Use real API data; define each KPI and date range; support CSV/PDF exports with permission checks | KPI reconciliation against database queries and export tests |
| P2 | Bulk data operations | Validated import/export and migration between systems | Provide preview, row-level validation, duplicate detection, error report and rollback/partial-failure strategy | Import tests for valid, invalid, duplicate and large datasets |
| P3 | Integrations and standards | Documented APIs, SSO and education data exchange | Inventory current APIs first; design versioned APIs and adapter interfaces for approved integrations | Contract tests, secrets kept server-side, and integration-disabled mode |
| P3 | Accessibility and mobile UX | Responsive portals, keyboard navigation and accessible status/error feedback | Apply shared design tokens and accessible controls across existing modules; keep core functions usable on small screens | Automated accessibility checks plus mobile/keyboard acceptance pass |

## Execution order

### Phase 1 — Reliability before expansion
- Finish user-account persistence verification.
- Run frontend and backend builds/tests and record the baseline.
- Verify migration repeatability and PostgreSQL persistence across API restarts.
- Audit role access and remove misleading actions that do not work.

### Phase 2 — End-to-end school lifecycle
- Trace admissions → student record → enrollment → fees → timetable → attendance → assessment → report card → progression/alumni.
- Fix broken links and duplicated data at the integration boundaries before adding more screens.
- Add cross-module integration tests.

### Phase 3 — Operations and finance
- Verify fee/payment/ledger reconciliation, HR/allowances/payroll, inventory movements, library loans, and hostel/welfare workflows.
- Add approval and audit trails for high-impact changes.

### Phase 4 — Insights, self-service and integrations
- Validate role-specific dashboards against source data.
- Improve student portal and communications.
- Add optional integrations only after core workflows work offline and configuration/security is established.

## Definition of done for each feature

- UI action is wired to a real API operation.
- Server validates inputs and enforces authorization.
- Data persists in PostgreSQL and survives a new request/session/restart.
- Related records remain consistent and duplicate submissions are handled safely.
- Loading, empty, success, validation, permission, and server-error states are understandable.
- Audit history exists for security-sensitive and financially significant actions.
- Automated tests cover success, validation, authorization, and persistence.
- Feature is usable with no internet unless it explicitly requires an enabled external integration.
