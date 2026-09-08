# School Management Information System — Project Progress

**Last updated:** 2026-09-09  
**Current focus:** Final acceptance testing and release verification  
**Tracking branch:** `main`

## Latest closure work — 2026-09-09
- [x] Hostel persisted domain, repository, service and authorized API
- [x] Hostel PostgreSQL migration with capacity/date/active-allocation constraints
- [x] Hostel frontend workflow for houses, rooms, beds, allocations and occupancy reporting
- [x] Hostel service tests for capacity and duplicate active allocation rules
- [x] Lecturer teaching workspace connected directly to attendance context
- [x] Frontend attendance session opening, manual marking, student history, QR token generation and controlled session closing
- [x] Transport persisted domain, repository, service and authorized API
- [x] Transport PostgreSQL migration with active-student assignment uniqueness
- [x] Transport frontend workflow for vehicles, routes and student assignments
- [x] Transport service test for duplicate active student assignment
- [x] Full System CI green, including backend build, migrations, PostgreSQL integration tests, frontend build and Playwright E2E smoke tests
- [x] Frontend CI green on the latest validated commit
- [x] Native Tauri desktop CI green for Windows x86, Windows x64 and Ubuntu x64
- [x] Windows x86/x64 NSIS installer `.exe` artifacts produced and uploaded by CI
- [x] Ubuntu `.deb` and `.AppImage` artifacts produced and uploaded by CI
- [x] Approved `frontend/public/icon.png` generated into the Tauri icon set and validated before native builds
- [x] Installer privacy/license asset validated and wired into the Tauri bundle
- [x] Native release workflow is tag-gated for `v*` releases and downloads the verified build artifacts
- [ ] Publish a tagged GitHub Release and verify its attached installer/package assets
- [ ] Verify the installer visually on a Windows machine, including Explorer/installer icon rendering
- [ ] Verify clean-machine installation and first-run server connection

## Finance
- [x] Double-entry invoice/payment posting, balanced journals and duplicate-posting protection
- [x] General Ledger, Trial Balance, receivables, ageing and control-account reconciliation
- [x] Journal reversal, credit notes, refunds, cancellations and audit metadata
- [x] Fiscal periods, closing, opening balances and retained earnings handling
- [x] Budgets, budget-vs-actual and bank reconciliation/import/outstanding reporting
- [x] Campus/faculty/department/programme accounting dimensions
- [x] Cash, bank and mobile-money position reporting and finance dashboard workspaces
- [x] Database-level posted-journal and audit-log immutability boundaries
- [x] Fresh Full System CI verification of the current finance-hardening code

## Attendance
- [x] Authorized session opening and duplicate-session prevention
- [x] Manual and rotating-QR attendance recording
- [x] Status validation and duplicate-record prevention
- [x] Controlled session closing and post-close write blocking
- [x] Active course-registration validation
- [x] Application-service tests for registration eligibility, closure, duplicates and valid marking
- [x] Teaching-to-attendance context handoff
- [x] Frontend lecturer attendance journey
- [ ] Automated API/integration tests for authorized manual and QR attendance paths

## Other platform work
- [x] Hostel vertical slice closed
- [x] Transport vertical slice closed
- [x] Teaching-to-attendance vertical slice closed
- [ ] Final authorization/audit boundary audit across remaining modules
- [ ] Replace any remaining non-functional placeholders discovered by final repository audit

## Acceptance test — required golden path

Test database only:

- Student: **Kaigwa Akram**
- Assessment/admission number: **U075/042**
- Admission/reporting date: **2026-09-09**
- Currency: **UGX**

Required journey:

```text
admin login
→ configure/verify institution + academic structure
→ create application/admission
→ accept decision
→ admit student U075/042
→ enroll student
→ register courses
→ generate UGX fees
→ create installment schedule
→ record installment payment 1
→ verify allocation/outstanding balance
→ record subsequent installment payment(s)
→ verify ledger/reports
→ record attendance
→ enter assessment marks
→ verify results/transcript/progression behavior
→ inspect student 360/profile
→ inspect audit/reporting
```

Authorization journey:

```text
admin123 (development/test only)
→ login
→ create second test user
→ assign limited role
→ login as limited user
→ verify permitted screens/actions
→ verify restricted actions return authorization failure
→ return to admin
→ deactivate/remove test user
```

**Important:** `admin123` is a development/test credential only. Production administrators must use a unique strong password.

## Current final production gate
1. [x] Fresh Full System CI passes.
2. [x] Fresh frontend CI passes.
3. [x] Native Windows x86/x64 installers build successfully.
4. [x] Ubuntu native packages build successfully.
5. [x] Approved icon and installer assets are validated during native builds.
6. [ ] Execute the isolated golden-path acceptance test with Kilo Code.
7. [ ] Execute administrator and restricted-role authorization acceptance test.
8. [ ] Smoke-test every enabled frontend screen and workflow.
9. [ ] Complete final EF Core migration snapshot/designer audit.
10. [ ] Verify backup/restore and clean-machine installation.
11. [ ] Publish and verify a tagged GitHub Release.
12. [ ] Perform final production secrets and Uganda-specific operational configuration review.

**Evidence note:** The native CI run produced three uploaded artifact groups: Windows x86 NSIS, Windows x64 NSIS, and Ubuntu x64 (`.deb` + `.AppImage`). The run did not publish a GitHub Release because it was a `main` push rather than a `v*` tag. The live admission scenario has not been executed; no student record has been fabricated in the repository.