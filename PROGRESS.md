# School Management Information System — Project Progress

**Last updated:** 2026-09-08  
**Current focus:** Production finance hardening, accounting/reporting completeness, and system-wide verification  
**Tracking branch:** `main`

> Master project tracker. A feature is complete only when its implemented scope is verified in the repository and CI. A model, placeholder endpoint or UI mockup alone does not make a workflow complete.

## CI — Current verified state
- [x] Frontend CI passing on current `main`
- [x] Foundation CI passing on current `main`
- [x] Backend CI passing on current `main`
- [x] Full System CI passing on current `main`
- [x] Full System PostgreSQL + API readiness + frontend build + Playwright smoke path passing
- [x] PostgreSQL integration tests covering database-level journal immutability boundaries and finance migration schema
- [x] Backend CI provisions PostgreSQL before running the full test suite

## Finance — Current implemented scope
- [x] Chart of Accounts foundation
- [x] Student receivable and tuition revenue accounts
- [x] Automatic double-entry invoice posting
- [x] Automatic double-entry payment posting
- [x] Payment-method account mapping
- [x] Journal-entry numbering and duplicate-posting protection
- [x] Central balanced journal validation
- [x] General Ledger foundation
- [x] Trial Balance foundation
- [x] Student receivables foundation
- [x] Controlled journal reversal workflow
- [x] Reversal entries preserve the original posted entry
- [x] Source-document metadata on invoice/payment journal entries
- [x] Reversal audit metadata
- [x] Itemized invoice fee lines
- [x] Payment allocation and FIFO allocation
- [x] Unallocated student payments / advances
- [x] Student Payment Ledger
- [x] Discount and waiver workflow
- [x] Installment schedules and overdue tracking
- [x] Student charges and charge-void workflow
- [x] Credit-note workflow and posting
- [x] Credit-note/refund posting now respects open fiscal periods
- [x] Refund workflow and posting safeguards
- [x] Receivables ageing
- [x] Student Receivables control-account reconciliation
- [x] Database-level posted journal immutability
- [x] Database-level audit-log immutability boundary
- [x] Income Statement API/report foundation
- [x] Balance Sheet API/report foundation
- [x] Fiscal-period domain model, persistence and administration API
- [x] Fiscal-period date-range and overlap validation
- [x] Fiscal-period closing workflow with user/audit metadata
- [x] Opening-balance posting workflow
- [x] Budget management and budget-vs-actual API foundation
- [x] Bank reconciliation workflow with statement lines and journal matching
- [x] Campus/faculty/department/programme accounting dimensions
- [x] Dimension-aware journal lines and reports

## Finance — Phase 1: Accounting Integrity
- [x] Central journal-entry validation
- [x] Mandatory balanced debit/credit enforcement
- [x] Duplicate-posting protection
- [x] Database-level posted-entry immutability enforcement
- [x] Controlled reversal mechanism
- [x] Finance-specific journal source/reversal metadata
- [x] Finance-specific immutable audit-log database boundary
- [x] Automated PostgreSQL persistence tests for database immutability, journal source/reversal schema, and migration application

## Finance — Phase 2: Student Billing
- [x] Fee categories
- [x] Itemized fee structures
- [x] Installments / fee schedules
- [x] Discounts
- [x] Waivers
- [x] Student charges

## Finance — Phase 3: Receivables & Payment Ledger
- [x] Payment allocation
- [x] Partial payment allocation across invoice balances
- [x] Multi-invoice payment allocation
- [x] Unallocated payments / advances
- [x] Student payment ledger
- [x] Receivables ageing
- [x] Receivables control-account reconciliation

## Finance — Phase 4: Adjustments
- [x] Credit-note workflow
- [x] Credit-note application to invoices
- [x] Refund workflow
- [x] Refund journal posting
- [ ] Adjustment cancellation/reversal workflow

## Finance — Phase 5–6: Production Accounting
- [x] Campus/faculty/department/programme accounting dimensions
- [x] Dimension-aware journal lines and reports
- [ ] Production-grade General Ledger
- [ ] Production-grade Trial Balance
- [x] Income Statement API/report foundation
- [x] Balance Sheet API/report foundation
- [x] Fiscal-period-aware Income Statement and Balance Sheet foundation
- [x] Opening balances / retained earnings handling
- [x] Fiscal periods and period closing foundation
- [ ] Cash and bank reports
- [x] Bank transactions and bank reconciliation workflow foundation
- [x] Budget management and budget-vs-actual API foundation
- [ ] Production hardening of bank reconciliation, including imports/outstanding-item handling

## Other platform work
The wider SMIS foundation, academic, admissions, student, attendance, staff/HR, library, timetable, communication, portals and operational areas remain under incremental verification and production hardening. See repository history and module documentation for detailed status.

## Definition of Done
A workflow is covered only when business/domain logic, persistence, authorization, frontend UI where applicable, validation and automated tests are implemented and CI passes. Finance additionally requires balanced accounting effects, transaction integrity, source traceability and controlled corrections rather than editing posted ledger history.

## Immediate roadmap
1. Complete adjustment cancellation/reversal with full auditability.
2. Upgrade financial statements, GL and Trial Balance to production fiscal-period-aware reporting.
3. Harden cash/bank reporting and bank reconciliation, including imports and outstanding items.
4. Continue system-wide feature parity, authorization/audit hardening, major user-journey E2E coverage, deployment, backup/restore and Uganda-specific operational configuration.
