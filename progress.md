# SMIS Implementation Progress

> This file mirrors the master implementation status in `PROGRESS.md`. Items are marked complete only when repository implementation and CI evidence support the status.

## 2026-09-09 documentation and acceptance work
- ✅ Added `INSTALLATION.md` covering PostgreSQL, API, frontend, LAN/Nginx, native Windows client, Windows installer, icon packaging, administrator bootstrap, backups, security, troubleshooting and release procedure.
- ✅ Updated `README.md` to point to the complete installation guide and document the end-to-end acceptance path.
- ✅ Updated `BACKEND_SETUP.md` to match the current backend and production setup.
- ✅ Documented the controlled golden-path test student: Kaigwa Akram / `U075/042` / `2026-09-09`.
- ✅ Documented administrator login, creation of a restricted test user, authorization checks and the complete admission → enrollment → finance installments → attendance → assessment/results path.
- ⚠️ The live end-to-end scenario has **not** been executed against a connected school database from this session. It must run against a dedicated test database before production data is touched. No live student record has been fabricated in the repository or claimed as completed.
- ⚠️ Repository-wide build/test and native installer verification still require an actual CI runner or connected build environment; this session cannot honestly mark those checks green without their results.

## CI
- 🔄 Latest finance hardening commits require fresh GitHub Actions evidence.
- ✅ Frontend CI — previous verified baseline.
- ✅ Foundation CI — previous verified baseline.
- ✅ Backend CI — previous verified baseline.
- ✅ Full System CI — previous verified baseline.

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

### Hardening / remaining
- 🔄 Fresh automated PostgreSQL persistence verification for the newest finance hardening commits.
- 🔄 Fresh CI verification of adjustment cancellation/reversal workflow.
- 🔄 Fresh CI verification of opening-balance/carry-forward workflow.
- 🔄 Fresh CI verification of accounting dimensions and dimension-aware reporting.
- 🔄 Fresh CI verification of bank reconciliation and budget-vs-actual paths.
- 🔄 Full frontend finance workflow smoke test.

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
- ✅ Hostel and transport vertical slices.
- ✅ Teaching-to-attendance vertical slice.

### Remaining / ongoing
- ⏳ Execute the documented system-wide golden-path acceptance test on an isolated database.
- ⏳ Execute administrator/restricted-user authorization test.
- ⏳ Smoke-test every enabled frontend screen and workflow.
- ⏳ Add/complete major user-journey E2E automation where missing.
- ⏳ Final authorization/audit boundary audit across remaining modules.
- ⏳ Final EF Core migration snapshot/designer audit.
- ⏳ Backup/restore and clean-machine installation verification.
- ⏳ Native Windows installer and GitHub Release verification.
- ⏳ Ubuntu native package verification.

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

## Final production gate

1. Fresh backend Release build passes.
2. Fresh backend test suite passes.
3. Fresh frontend production build passes.
4. EF Core migration and snapshot/designer artifacts are consistent.
5. Isolated golden-path acceptance test passes.
6. Administrator and restricted-role authorization test passes.
7. Every enabled screen is smoke-tested without unhandled exceptions.
8. Backup and restore are verified.
9. Native Windows x86/x64 installers build successfully.
10. The installer `.exe` visibly uses the approved SMIS icon.
11. GitHub Release contains verified Windows installer assets.
12. Clean-machine installation and first-run server connection succeed.
13. Ubuntu native package is produced and verified if required for the release.
14. Production secrets and Uganda-specific operational configuration are reviewed.
