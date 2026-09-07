# School Management Information System — Project Progress

**Last updated:** 2026-09-07  
**Current focus:** Frontend CI fixes, merge conflict resolution, and production hardening  
**Tracking branch:** `main`

> Master project tracker. A feature is complete only when its implemented scope is verified in the repository and CI. A model, placeholder endpoint or UI mockup alone does not make a workflow complete.

## Finance — Current verified scope
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
- [x] Reversal audit metadata (source entry, reason and performing user)
- [x] Itemized invoice fee lines
- [x] Payment allocation and FIFO allocation
- [x] Unallocated student payments / advances
- [x] Student Payment Ledger
- [x] Discount and waiver request/approval/rejection workflow
- [x] Percentage- and amount-based invoice installment schedules
- [x] Installment due dates, outstanding and overdue tracking
- [x] Invoice payments automatically applied across installment balances
- [x] Student charges and charge-void workflow
- [x] Credit-note workflow and invoice credit-note listing
- [x] Refund workflow with payment and credit-note safeguards
- [x] Credit-note and refund journal posting
- [x] Receivables ageing buckets
- [x] Student Receivables control-account reconciliation

## Finance — Phase 1: Accounting Integrity
- [x] Central journal-entry validation
- [x] Mandatory balanced debit/credit enforcement
- [x] Duplicate-posting protection
- [ ] Database-level posted-entry immutability enforcement
- [x] Controlled reversal mechanism
- [x] Finance-specific journal source/reversal metadata
- [ ] Finance-specific immutable audit event history
- [ ] Automated persistence tests for immutability and reversal

## Finance — Phase 2: Student Billing
- [x] Fee categories
- [x] Itemized fee structures
- [x] Fee items
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

## Finance — Phase 5–6
- [ ] Campus/faculty/department/programme accounting dimensions
- [ ] Dimension-aware journal lines and reports
- [ ] Production-grade General Ledger
- [ ] Production-grade Trial Balance
- [ ] Income Statement / Profit & Loss
- [ ] Balance Sheet
- [ ] Cash and bank reports
- [ ] Budget vs actual
- [ ] Fiscal periods and period closing
- [ ] Opening balances
- [ ] Bank transactions and bank reconciliation

## Other platform work
The wider SMIS foundation, academic, admissions, student, attendance, staff/HR, library, timetable, communication, portals and operational areas remain under incremental verification and production hardening. See the repository history and module documentation for their detailed status.

## Definition of Done
A workflow is covered only when business/domain logic, persistence, authorization, frontend UI where applicable, validation and automated tests are implemented and CI passes. Finance additionally requires balanced accounting effects, transaction integrity, source traceability and controlled corrections rather than editing posted ledger history.

## Immediate roadmap
1. Complete Finance Phase 1 persistence-level immutability, dedicated audit events and persistence tests.
2. Add adjustment cancellation/reversal with full auditability.
3. Add accounting dimensions and dimension-aware reporting.
4. Complete production-grade financial statements, fiscal periods and opening balances.
5. Implement bank transactions and bank reconciliation.
6. Continue system-wide tests, security, deployment and integration hardening.
