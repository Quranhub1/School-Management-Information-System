# SMIS Implementation Progress

> This file mirrors the master implementation status in `PROGRESS.md`. Items are marked complete only when repository implementation and CI evidence support the status.

## CI — verified on current main
- ✅ Frontend CI
- ✅ Foundation CI
- ✅ Backend CI
- ✅ Full System CI (PostgreSQL + API + frontend + Playwright smoke path)

## Finance & Accounting

### Covered
- ✅ Finance repository abstraction and EF Core persistence.
- ✅ Chart of Accounts and standard school accounting seed accounts.
- ✅ Student invoicing and automatic double-entry invoice posting.
- ✅ Student payments and payment-method account mapping.
- ✅ Journal numbering, duplicate protection and balanced journal validation.
- ✅ General Ledger, Trial Balance and Student Receivables report foundations.
- ✅ Controlled journal reversal with source/reversal metadata.
- ✅ Itemized fees, payment allocation/FIFO and student payment ledger.
- ✅ Discounts, waivers and installment schedules.
- ✅ Student charges and charge-void workflow.
- ✅ Credit notes and refunds with double-entry journal posting.
- ✅ Receivables ageing and control-account reconciliation.
- ✅ Database-level posted-journal immutability boundary.
- ✅ Database-level audit-log immutability boundary.
- ✅ Income Statement API/report foundation.
- ✅ Balance Sheet API/report foundation.

### Hardening / remaining
- 🔄 Automated PostgreSQL persistence tests for immutability and reversal.
- 🔄 Adjustment cancellation/reversal workflow.
- 🔄 Fiscal periods, closing and opening balances.
- 🔄 Accounting dimensions: campus/faculty/department/programme.
- 🔄 Dimension-aware journal lines and reports.
- 🔄 Fiscal-period-aware production GL and Trial Balance.
- 🔄 Production financial statement semantics, including retained earnings.
- 🔄 Cash/bank reporting and bank transactions.
- 🔄 Bank reconciliation workflow.
- 🔄 Budget vs actual reporting.
- 🔄 Vendor/payables, payroll and fixed-asset accounting integration where required.
- 🔄 Finance dashboard and complete frontend workflows.

## Core system

### Foundations covered
- ✅ Modular .NET application architecture.
- ✅ React + TypeScript + Vite frontend foundation.
- ✅ PostgreSQL/EF Core persistence foundation.
- ✅ GitHub Actions CI foundation.
- ✅ LAN-first/on-premises deployment direction.
- ✅ Configurable institution/campus/faculty/department/programme structure.
- ✅ Student lifecycle, identity/authorization, admissions, academic, attendance, assessment and progression foundations.
- ✅ Library, staff/HR, payroll, certificates, alumni and supporting domain foundations.

### Remaining / ongoing
- ⏳ Production-grade workflows across all domains.
- ⏳ Frontend parity for backend capabilities.
- ⏳ Major user-journey E2E coverage.
- ⏳ Cross-domain reporting and analytics.
- ⏳ Security, authorization and audit hardening.
- ⏳ Deployment, backup, monitoring and disaster recovery.
- ⏳ Institutional configuration and Uganda-specific operational requirements.

## Definition of Done
A feature is not production-complete merely because it compiles. It requires appropriate business/domain logic, persistence, authorization, validation, UI where applicable, automated tests and successful relevant CI evidence. Finance additionally requires balanced accounting effects, source traceability and controlled corrections without editing posted ledger history.

## Current priority
**Finance accounting hardening → fiscal-period accounting → dimensions → bank/budget controls → system-wide workflow parity and production hardening.**
