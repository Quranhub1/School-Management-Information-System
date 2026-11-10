# KSHS SMIS — SchoolPay Integration Preparation and Implementation Plan

**Repository:** `Quranhub1/School-Management-Information-System`  
**Target branch:** `main`  
**Status:** Preparation approved; provider access pending  
**Institution:** Kampala School of Health Sciences (KSHS)  
**Currency:** UGX

## KSHS payment-source decision

The approved SMIS payment sources are exactly:

1. **SchoolPay** — the only integrated provider source. MTN Mobile Money, Airtel Money and bank transfers are recorded as SchoolPay channels when SchoolPay reports them; SMIS must not connect to those providers independently.
2. **Manual** — payments entered and receipted by authorised Finance staff, with the supporting receipt/reference and audit identity.

Do not add separate MTN, Airtel, bank-transfer or card gateway integrations. Keep the provider channel as transaction metadata, separate from the source classification. Both sources must post through the existing central Payments, PaymentAllocations and student ledger workflows. Existing mobile-money transaction rows are legacy records; staff-entered external references must not be accepted as proof of a provider payment.

The webhook validator uses the documented SHA-256 digest of the exact SchoolPay API password plus the SchoolPay receipt number. Configure `SchoolPay:WebhookSecret` with the exact password SchoolPay specifies for this webhook signature contract, delivered through deployment secrets (not source control). The callback must include a `PAID` status and valid signature before SMIS posts it. Confirm the payload field names and password assignment with SchoolPay during UAT.

> This is an implementation plan, not evidence that SchoolPay is connected or that any live payment has been processed. KSHS has its SchoolPay school code, but API credentials and test access have not yet been supplied. Provider confirmation of student/fee synchronisation is also pending.

## 1. Current readiness

| Prerequisite | KSHS position | Consequence |
|---|---|---|
| SchoolPay school code | Available to KSHS; do not store it in source control | Can identify the school in provider onboarding |
| Transactions API password | Not yet obtained | Sync API calls cannot be authenticated |
| Adhoc Payments API password/access | Not yet obtained; provider must confirm whether separate | Payment registration/request cannot be tested |
| UAT/test credentials | Not yet obtained | No provider-backed test transaction can be run |
| Student data synchronisation agreement | Not confirmed | Scope and supported endpoints need written confirmation |
| Fee-category mapping | Not confirmed | Provider payment data cannot yet be safely allocated to tuition, guild and other fee accounts |
| Webhook activation/subscription | Not confirmed | Real-time notification availability is unknown |

No secrets, passwords, private keys or production identifiers should be committed to Git. Credentials belong in backend environment configuration or the deployment secret store.

## 2. Repository baseline observed on main

The current repository already contains useful finance foundations:

- `backend/src/SchoolManagement.Domain/Finance/MobileMoneyTransaction.cs`: a mobile-money transaction record with student, optional invoice, provider, transaction reference, phone, amount, currency, status and timestamps.
- `frontend/src/components/MobileMoneyPayments.tsx`: a mobile-money screen that starts a transaction and offers a staff-entered external-reference confirmation flow.
- `backend/src/SchoolManagement.Api/Controllers/FinanceController.cs`: finance endpoints for invoices, payments, unallocated payments, allocations, refunds and related finance operations.
- Finance domain entities include `Payment`, `PaymentAllocation`, `StudentInvoice` and `StudentInvoiceLine`.
- Existing finance workflow and reconciliation services should be reused where they satisfy the required accounting controls.

Important implementation observation: the current mobile-money UI includes a manual "Confirm Received" action. That must not be treated as SchoolPay verification. For SchoolPay transactions, a staff-entered receipt/reference is evidence to investigate, not sufficient authority to post a payment.

Before coding, the implementation branch must verify the current mobile-money API handlers, dependency injection, EF Core mapping/migrations, payment posting service contracts and authorization policies. Extend the existing finance architecture; do not create a parallel ledger or duplicate student accounts.

## 3. Provider API capabilities documented publicly

The official SchoolPay API documentation currently describes the following integration surfaces:

### 3.1 Transactions Sync API

- Single-date retrieval:
  `GET /AndroidRS/SyncSchoolTransactions/{schoolCode}/{transactionDate}/{requestHash}`
- Date-range retrieval (maximum 31 days):
  `GET /AndroidRS/SchoolRangeTransactions/{schoolCode}/{fromDate}/{toDate}/{requestHash}`
- Authentication hash:
  `UPPERCASE_HEX(MD5(schoolCode + transactionDate + password))` for a single date; for a range, the identifying date is `fromDate`.
- Responses include regular transactions and supplementary fee payments.
- Transaction data may include SchoolPay receipt number, source transaction ID, amount, payment date/time, payment channel, student payment code, student name, completion status and settlement bank code. Supplementary payments may also include supplementary fee ID and description.

### 3.2 Adhoc Payments API

The documentation describes:

- Register a payment reference:
  `POST /AndroidRS/AdhocPayments/Register/{schoolCode}/{hash}`
- Request a mobile-money debit:
  `POST /AndroidRS/AdhocPayments/Request/{schoolCode}/{hash}`
- Check payment status:
  `GET /AndroidRS/AdhocPayments/Check/{schoolCode}/{hash}/{reference}`

The documented Adhoc authentication hash is based on MD5 of the school code, identifying reference and API password. Register/request use the external reference; status inquiry uses the payment reference. Register examples include amount, external reference, payer names, reason and callback URL. Request examples additionally include phone number. The provider's response includes a SchoolPay payment reference and an initial status such as PENDING. Status inquiry can return PAID with receipt and transaction identifiers.

### 3.3 Callback and webhook notifications

The Adhoc callback example contains amount, channel, payment reference, receipt number, status, transaction ID and return code. The documentation says to require `PAID` before updating records.

The general SchoolPay webhook examples include a type such as `SCHOOL_FEES` or `OTHER_FEES` and a payment payload. The documented webhook signature is SHA-256 of:

`schoolApiPassword + schoolpayReceiptNumber`

This is distinct from the MD5 request hashes used by the Sync and Adhoc APIs. Implement separate, explicitly named validators; never reuse one hash formula for another integration surface.

The documentation says webhook notifications are attempted once and are not retried automatically, and that webhook delivery depends on configuration and an active subscription. Therefore webhook processing must be supplemented by scheduled Sync API polling and reconciliation.

### 3.4 Test environment

The public test documentation is hosted at:

- `https://schoolpaytest.servicecops.com/apidocumentation`

Its examples use the `/uatpaymentapi/` path. The production documentation uses:

- `https://www.schoolpay.co.ug/apidocumentation`

The production examples use the `/paymentapi/` path.

These are documentation-disclosed hosts and paths, not proof that KSHS has been provisioned. Confirm the correct base URLs, credentials, enabled products and test-school configuration directly with SchoolPay before making requests.

### 3.5 Important scope limitation

The public documentation establishes payment registration/request, payment status inquiry, callbacks/webhooks and transaction synchronisation. It does not, by itself, establish a complete general-purpose API for uploading and maintaining all KSHS student biographical records, fee structures or invoices inside SchoolPay.

Do not promise full student-and-fee master-data synchronisation until SchoolPay supplies the relevant endpoint specifications, field mappings, authentication rules and written approval. The integration can still match incoming transactions to SMIS students using a controlled SchoolPay student payment-code mapping.

## 4. Target architecture

Implement a provider adapter inside the existing .NET backend. The frontend must never call SchoolPay directly and must never receive the provider API password.

Proposed responsibilities (adapt folder placement to actual solution conventions):

- SchoolPay options/configuration: provider base URL, school code, API password reference, enabled features and timeout settings.
- SchoolPay HTTP client: typed requests, response parsing, timeouts and safe error handling.
- Sync client: single-date and date-range transaction retrieval.
- Adhoc client: payment registration, mobile-money request and status inquiry, once KSHS is enabled for those services.
- Callback/webhook controller: receive provider notifications, validate signature/status and persist an inbox record.
- Transaction processor: match, validate, deduplicate and post eligible transactions using existing finance services.
- Reconciliation service: scheduled Sync API import, compare provider records with SMIS records and surface exceptions.
- Finance UI: provider status, payment references, transaction history, unmatched items, failed/pending items and reconciliation reports.

A suggested conceptual flow:

1. SMIS creates/identifies a student invoice and a unique internal external reference.
2. SMIS requests a SchoolPay payment reference or initiates a payment request, if enabled for KSHS.
3. SchoolPay processes the payment.
4. A callback/webhook is received and stored; alternatively the Sync API discovers the transaction.
5. SMIS verifies provider status and signature where applicable.
6. The transaction is matched to the KSHS student and applicable invoice/fee category.
7. The existing finance workflow posts the payment and allocations atomically.
8. Reconciliation compares imported provider records with posted SMIS payments and reports exceptions.

## 5. Data and accounting rules

### 5.1 Student identity mapping

- Maintain an explicit unique mapping between each KSHS student and the SchoolPay student payment code.
- Do not assume the SchoolPay payment code is identical to the SMIS student number.
- Reject or quarantine ambiguous matches; do not match by student name alone.
- Preserve the raw provider identifiers and source payload for audit/reconciliation, subject to data-protection and retention rules.

### 5.2 Fee-category allocation

- Preserve the distinction between tuition, guild and other approved fee categories.
- Use provider supplementary fee identifiers/descriptions only after Finance approves a mapping to SMIS fee items/accounts.
- A general school-fees transaction without a reliable invoice/category reference must enter an allocation queue or follow a formally approved allocation rule.
- Never infer that all money received is tuition.
- Confirm settlement-bank and account mapping with KSHS Finance before financial reporting is enabled.

### 5.3 Idempotency and ledger integrity

- Enforce unique provider transaction identifiers, including receipt number and source transaction ID where available.
- Repeated callbacks, polling results or imports must not create duplicate payments.
- Persist incoming notifications before acknowledging them; process them asynchronously where appropriate.
- Use a database transaction for payment posting and allocations.
- Never delete a posted payment to correct it; use the existing authorised reversal/refund/adjustment workflow.
- Preserve original provider status, receipt, channel, settlement bank, event time, import time and processing outcome.

### 5.4 Status model

At minimum distinguish:

- Initiated / Pending
- Paid / Verified
- Failed
- Cancelled / Expired (only where provider confirms these statuses)
- Unmatched
- Exception / Requires review
- Reversed / Refunded (through authorised finance workflows)

An API request accepted by SchoolPay is not proof of payment. A callback with a PAID status must still pass signature, amount, reference, school, mapping and duplicate checks. Where provider capabilities allow, independently verify status through the status inquiry or transaction Sync API before posting.

## 6. Security and operations

- Store provider passwords only in server-side secrets/configuration; never in frontend bundles, Git, logs or API responses.
- Use HTTPS for callbacks and outbound requests.
- Validate webhook SHA-256 signatures using constant-time comparison.
- Implement the separately documented MD5 request hashes only where required by the provider's legacy API contract; keep them isolated and do not mistake them for webhook authentication.
- Ask SchoolPay for webhook source IP ranges; use IP allowlisting only as an additional control, not as a replacement for signature validation.
- Apply request timeouts, bounded retries for safe read operations, structured redacted logs and operational alerts.
- Do not blindly retry payment initiation requests; use stable external references and query status to avoid duplicate debit requests.
- Keep callback ingestion available even if the finance posting processor is temporarily unavailable.
- Restrict reconciliation and exception resolution to authorised Finance roles and audit every manual action.

## 7. Implementation phases and exit criteria

### Phase 0 — Provider onboarding (blocked on SchoolPay)

Obtain written confirmation of:

1. KSHS production school code and the exact code format.
2. Transactions Sync API password.
3. Adhoc Payments API password and whether it is separate.
4. UAT base URL, credentials and test-school provisioning.
5. Whether Register, Request and Check endpoints are enabled for KSHS.
6. Whether SchoolPay webhooks are enabled, subscription requirements, payload version and source IP ranges.
7. Student payment-code creation/update process.
8. Supported student master-data and fee/invoice synchronisation endpoints, if any.
9. Supplementary-fee setup and mapping process.
10. Settlement bank/account information, transaction fees and settlement timing.
11. Production certification and activation procedure.

**Exit:** KSHS has provider-approved documentation and test credentials stored securely.

### Phase 1 — Repository audit and design

- Trace current mobile-money API methods and handlers end to end.
- Inspect EF Core configuration and migrations for MobileMoneyTransaction.
- Confirm finance posting service, payment allocation and audit boundaries.
- Confirm role policies for finance operations and callback endpoints.
- Agree student payment-code mapping and fee-category mapping with KSHS Finance.
- Write integration contract tests using provider-approved sample payloads.

**Exit:** approved technical design, no duplicate finance ledger, migrations and API contracts identified.

### Phase 2 — Provider adapter and configuration

- Add typed SchoolPay client and separate Sync/Adhoc request signing.
- Add environment-specific base URL and secret configuration.
- Add safe provider error and timeout handling.
- Add health/configuration status that never reveals secrets.
- Keep SchoolPay disabled until valid configuration is present.

**Exit:** client tests pass against fixtures; no live call occurs without explicit enablement and credentials.

### Phase 3 — Transaction ingestion and matching

- Implement single-day and date-range Sync API retrieval.
- Persist provider transaction inbox/import records.
- Implement unique constraints/idempotency.
- Match by SchoolPay student payment code.
- Map supplementary fee IDs to approved SMIS fee categories.
- Quarantine unmatched, ambiguous and unsupported records.

**Exit:** repeated imports do not duplicate transactions; every imported item is matched, posted or visibly quarantined.

### Phase 4 — Payment initiation and status

- Implement Adhoc Register/Request/Check only after SchoolPay confirms KSHS access.
- Generate stable SMIS external references.
- Persist pending requests and provider payment references.
- Display pending/paid/failed states accurately.
- Do not mark invoices paid from initiation responses.

**Exit:** UAT payment can be initiated and independently verified without duplicate debit requests.

### Phase 5 — Callback/webhook

- Implement separate callback and general webhook contracts based on provider-approved payloads.
- Validate signature, school configuration, amount, receipt, reference and status.
- Persist raw event safely and acknowledge only after durable receipt.
- Make processing idempotent.
- Add Sync API recovery for missed callbacks.

**Exit:** valid notifications are processed once; invalid signatures and duplicate events cannot post money.

### Phase 6 — Finance ledger posting and reconciliation

- Post verified payments through existing finance services.
- Allocate by invoice/fee category using approved rules.
- Update student statements and collection reports.
- Compare SchoolPay imports against SMIS postings and settlement records.
- Provide exception handling and audit reports.

**Exit:** Finance signs off transaction-level and aggregate reconciliation.

### Phase 7 — Production pilot and rollout

- Run a controlled pilot with Finance and a small approved group.
- Reconcile every test/live pilot transaction against SchoolPay and bank settlement records.
- Obtain Finance and management sign-off.
- Enable wider production use only after rollback, monitoring and support procedures are ready.

**Exit:** signed acceptance evidence, stable reconciliation and approved operational ownership.

## 8. Minimum acceptance tests

1. Valid student payment code matches exactly one active KSHS student.
2. Unknown or ambiguous payment code is quarantined without ledger posting.
3. A verified payment posts to the correct student and invoice.
4. Tuition, guild and supplementary fees remain separately reported.
5. Repeated webhook with the same receipt does not duplicate a payment.
6. The same transaction discovered by webhook and Sync API posts once.
7. Invalid webhook signature is rejected and audited.
8. Pending, failed or unknown provider status never posts a payment.
9. Amount mismatch is quarantined.
10. A missed webhook is recovered by Sync API import.
11. A provider outage does not corrupt existing finance records.
12. A refund/reversal follows authorised existing finance workflows.
13. Unallocated funds remain visible and are not silently assigned to tuition.
14. Daily and date-range totals reconcile to provider data and settlement evidence.
15. Credentials never appear in frontend assets, logs, error messages or Git history.
16. Finance roles can resolve exceptions; unauthorised roles cannot.
17. Provider retries and concurrent notifications cannot create duplicate ledger entries.

## 9. Provider contact and request

SchoolPay's public contact page currently lists:

- Email: support@schoolpay.co.ug
- Office: 0200 502 140
- WhatsApp: +256 750 923 262
- Website: https://www.schoolpay.co.ug/contact

Request a technical onboarding session and written answers to the Phase 0 questions. Do not send the school's API password through ordinary email or chat; request a secure credential-delivery method.

## 10. Official technical references

- Production API documentation: https://www.schoolpay.co.ug/apidocumentation
- UAT/test API documentation: https://schoolpaytest.servicecops.com/apidocumentation
- SchoolPay contact: https://www.schoolpay.co.ug/contact
- SchoolPay ERP and integration overview: https://www.schoolpay.co.ug/site/erp

Provider documentation can change. Reconfirm endpoint paths, request/response schemas, hash formats, webhook requirements and enabled products with SchoolPay before implementation.

## 11. Immediate next actions

1. KSHS requests UAT credentials, Transactions API password and Adhoc API access from SchoolPay.
2. KSHS asks for written confirmation of student payment-code synchronisation and fee-category/settlement mapping.
3. Development audits the current mobile-money API and Finance posting path on `main`.
4. Development prepares the provider adapter, configuration contract, inbox/idempotency design and automated tests without enabling live payments.
5. Once credentials arrive, run UAT before production activation.

**Current decision:** proceed with preparation and repository audit. Do not enable live SchoolPay traffic or claim integration completion until provider access, end-to-end UAT, Finance reconciliation and KSHS approval are complete.
