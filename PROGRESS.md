# School Management Information System — Project Progress

**Last updated:** 2026-09-08  
**Current focus:** Final production-readiness audit and native Windows desktop client  
**Tracking branch:** `main`

## Latest closure work — 2026-09-08
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
- [x] Hostel/attendance closure merged to `main` in PR #98
- [x] Transport closure merged to `main` in PR #99
- [x] Full System CI green after finance fixture and posting fixes
- [x] Frontend CI green on the latest validated commit
- [x] Native Windows desktop shell foundation added as a .NET 8 WPF application
- [x] Desktop shell uses WebView2 without browser tabs, address bar, status bar or developer tools
- [x] Desktop navigation is restricted to the configured trusted HTTPS system origin
- [x] Dedicated Windows desktop CI workflow added
- [ ] Bundle the approved frontend build into the desktop installer/local application origin
- [ ] Produce signed/installable Windows desktop package and verify on a clean Windows machine

## Finance
- [x] Double-entry invoice/payment posting, balanced journals and duplicate-posting protection
- [x] General Ledger, Trial Balance, receivables, ageing and control-account reconciliation
- [x] Journal reversal, credit notes, refunds, cancellations and audit metadata
- [x] Fiscal periods, closing, opening balances and retained earnings handling
- [x] Budgets, budget-vs-actual and bank reconciliation/import/outstanding reporting
- [x] Campus/faculty/department/programme accounting dimensions
- [x] Cash, bank and mobile-money position reporting and finance dashboard workspaces
- [x] Database-level posted-journal and audit-log immutability boundaries

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

## Final production gate
1. Complete and validate the native Windows desktop packaging/local frontend embedding.
2. Add API/integration tests for authorized attendance manual and QR attendance paths.
3. Audit EF Core migration snapshots/designer artifacts and deployment configuration.
4. Verify backup/restore, monitoring, secrets and Uganda-specific operational configuration before production sign-off.
