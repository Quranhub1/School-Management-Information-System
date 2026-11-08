# SchoolPay Integration — Phase 1 Repository Audit

**Repository:** `Quranhub1/School-Management-Information-System`  
**Audited branch:** `main`  
**Audit branch:** `feat/schoolpay-phase1-repository-audit`  
**Institution:** Kampala School of Health Sciences (KSHS)  
**Currency:** UGX  
**Status:** Audit findings recorded; provider-backed contract fixtures remain pending.

## 1. Executive finding

The repository has a usable finance ledger and a legacy mobile-money transaction entity, but the SchoolPay integration is not present. The frontend exposes mobile-money API calls, while repository code search did not identify corresponding backend handlers for those routes. This must be resolved before wiring SchoolPay into the UI.

SchoolPay must be implemented as a provider adapter and transaction-ingestion workflow that posts verified receipts through the existing Finance services. It must not introduce a second student balance or payment ledger.

## 2. Existing components verified

| Component | Location | Audit result |
|---|---|---|
| Mobile-money domain record | `backend/src/SchoolManagement.Domain/Finance/MobileMoneyTransaction.cs` | Existing record contains student, optional invoice, transaction reference, provider, phone, amount, currency, status, external reference, error and timestamps. |
| EF Core mapping | `backend/src/SchoolManagement.Infrastructure/Finance/FinanceConfiguration.cs` | Existing unique index on `TransactionRef`; amount precision and field lengths configured. |
| DbContext set | `backend/src/SchoolManagement.Infrastructure/Persistence/SchoolManagementDbContext.cs` | `MobileMoneyTransactions` DbSet exists. |
| Finance API | `backend/src/SchoolManagement.Api/Controllers/FinanceController.cs` | Class-level FinanceRead policy; finance operations endpoints use FinanceOperations. No SchoolPay endpoints identified. |
| Finance payment workflow | `backend/src/SchoolManagement.Application/Finance/FinanceWorkflowService.cs` | Supports invoice payments, unallocated payments, explicit allocations and FIFO allocation. |
| Finance domain service | `backend/src/SchoolManagement.Application/Finance/FinanceService.cs` | Existing payment posting and ledger logic should remain the source of truth. |
| Invoice/payment persistence | `backend/src/SchoolManagement.Infrastructure/Finance/FinanceConfiguration.cs` | Payment receipt number has a unique index; allocations are constrained by payment/invoice pair. |
| Frontend API | `frontend/src/api/finance.ts` | Calls `/api/finance/mobile-money`, `/{id}/confirm` and status listing routes. |
| Frontend screen | `frontend/src/components/MobileMoneyPayments.tsx` | Has a manual “Confirm Received” workflow and a generic provider-integration placeholder. |

## 3. Gaps and risks

1. **Backend route mismatch:** frontend code calls the mobile-money routes above, but a matching backend controller/action implementation was not found in the audited `main` branch. Confirm with a runtime route inventory before relying on these calls.
2. **Manual confirmation is unsafe for SchoolPay:** a staff-entered external reference must not transition a SchoolPay transaction to Paid/Verified or create a ledger payment.
3. **No SchoolPay adapter found:** no provider options/client, request-signing implementation, Sync API importer, Adhoc API client or webhook receiver was identified.
4. **No explicit SchoolPay student-code mapping found:** do not assume the SchoolPay payment code equals the SMIS student number. A dedicated unique mapping is required.
5. **No durable provider-event inbox found:** callbacks and Sync imports need durable raw-event/import records, processing outcomes and idempotency.
6. **Legacy transaction identity is insufficient by itself:** its unique `TransactionRef` is useful, but SchoolPay receipt number and source transaction ID need explicit provider-scoped uniqueness.
7. **Finance posting must be reused:** existing workflow methods support invoice and unallocated payments. Category allocation must use approved fee-item/account mappings; unknown or ambiguous transactions must be quarantined.
8. **Authorization boundary:** finance staff operations should remain under FinanceOperations. Provider callbacks cannot depend on an interactive staff JWT; they need anonymous transport access protected by provider signature validation, strict payload validation and durable audit.
9. **Provider contract fixtures are outstanding:** do not invent response schemas. Obtain provider-approved UAT samples and confirm endpoint/version details before writing contract tests or sending live requests.

## 4. Proposed implementation boundary

Add a SchoolPay integration area in the backend with these responsibilities:

- Strongly typed configuration for environment, base URL, school code, password, feature flags and timeouts.
- Separate signing/validation helpers for Sync MD5 request hashes, Adhoc MD5 request hashes and webhook SHA-256 signatures.
- Typed HTTP client(s) for Sync and, only when enabled by SchoolPay for KSHS, Adhoc Register/Request/Check.
- Provider transaction inbox/import persistence with source payload, provider identifiers, received/imported timestamps and processing state.
- Unique student-to-SchoolPay-payment-code mapping.
- Approved fee-category mapping for tuition, guild and supplementary fee identifiers.
- A processor that verifies, deduplicates, matches and posts through existing finance workflow services.
- A reconciliation job that uses Sync API polling to recover missed callbacks and compare provider records with SMIS postings.

Keep all provider credentials server-side. Default integration state must be disabled when configuration is absent or incomplete. Never expose secrets in health endpoints, logs, API responses or frontend bundles.

## 5. Proposed transaction lifecycle

`Received → Validated → Matched → Posted`

Non-postable records go to explicit exception states such as `Unmatched`, `Ambiguous`, `InvalidSignature`, `AmountMismatch`, `Duplicate` or `RequiresReview`.

Only provider-verified paid transactions that pass signature/status, school, amount, reference, student mapping, fee mapping and idempotency checks may enter the existing finance posting workflow. Pending, failed, unknown or staff-entered-only confirmations must never post.

## 6. Design decisions

- Keep the existing finance ledger and student account model.
- Treat provider receipt number and source transaction ID as external immutable identifiers, scoped to SchoolPay.
- Use the SchoolPay student payment code as an explicit mapping key, not a guessed student number.
- Persist provider notifications before acknowledging them; process asynchronously where appropriate.
- Use database transactions around payment posting and allocations.
- Quarantine uncertain matches and unsupported fee categories rather than silently assigning them to tuition.
- Do not implement payment initiation until KSHS Adhoc access and duplicate-debit handling are confirmed.
- Do not enable production traffic until UAT, Finance reconciliation and institutional approval are complete.

## 7. Remaining Phase 1 verification

- [ ] Run the backend and enumerate actual registered routes to confirm whether legacy mobile-money routes are missing at runtime.
- [ ] Inspect all existing finance payment posting, unallocated-payment, allocation and reversal tests before integrating.
- [ ] Confirm exact DbContext entity discovery/configuration and current migration baseline.
- [ ] Obtain provider-approved UAT payload fixtures for Sync, Adhoc and callbacks/webhooks.
- [ ] Obtain Finance-approved student payment-code and fee-category mapping rules.
- [ ] Convert the verified provider contracts into automated adapter and processing tests.

**Phase 1 exit condition:** approved design, verified route and persistence baseline, identified posting/authorization boundaries, and provider-approved contract samples ready for tests. Provider credentials are not required to complete the repository audit, but are required for UAT and live integration.

## 8. Next implementation step

After Phase 1 verification, implement Phase 2 configuration and a disabled-by-default typed SchoolPay Sync client. Do not add live payment initiation or ledger posting in that step.
