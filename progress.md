# SMIS Implementation Progress

> This file mirrors the master implementation status in `PROGRESS.md`. Items are marked complete only when repository implementation and CI evidence support the status.

## Current status
- 🔄 Final production-readiness closure is in progress.
- 🔄 Approved SMIS application icon integration is being completed.
- 🔄 Native desktop packaging remains part of the production gate.

## CI — verified baseline
- ✅ Frontend CI
- ✅ Foundation CI
- ✅ Backend CI
- ✅ Full System CI
- ✅ Native desktop CI foundation for Windows x86/x64 and Ubuntu x64

## Finance & Accounting

### Covered
- ✅ Finance repository abstraction and EF Core persistence.
- ✅ Chart of Accounts and standard school accounting seed accounts.
- ✅ Student invoicing and automatic double-entry invoice posting.
- ✅ Student payments and payment-method account mapping.
- ✅ Unapplied student payment control account and allocation reclassification.
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
- ✅ Fiscal-period creation, overlap validation and date containment.
- ✅ Fiscal-period enforcement for financial posting.
- ✅ Controlled fiscal-period closing.
- ✅ Controlled fiscal-period reopening with identity and closure metadata reset.

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

## Native desktop
- ✅ .NET 8 WPF desktop shell foundation.
- ✅ WebView2 shell with restricted trusted origin navigation.
- ✅ Windows x86/x64 publish CI.
- 🔄 Approved icon integration and final asset verification.
- ⏳ Bundle approved frontend build into the desktop installer/local application origin.
- ⏳ Implement production Windows installer with mandatory server setup/resource validation.
- ⏳ Implement and package Ubuntu native client.
- ⏳ Clean-machine installation verification.

## Final production gate
1. Complete approved icon integration and verify all application icon references.
2. Bundle the approved frontend locally so the installed client does not depend on an external browser.
3. Implement and validate Windows installer packaging for x86/x64 with mandatory server connection setup and resource validation.
4. Implement and validate Ubuntu native packaging.
5. Add API/integration tests for authorized attendance manual and QR attendance paths.
6. Audit EF Core migration snapshots/designer artifacts and deployment configuration.
7. Verify backup/restore, monitoring, secrets and Uganda-specific operational configuration before production sign-off.
