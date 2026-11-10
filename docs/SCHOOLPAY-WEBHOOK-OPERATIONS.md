# SchoolPay webhook operations

## Configuration

Configure these values on the API server only. Never commit provider credentials:

- `SchoolPay__Enabled=true` to activate SchoolPay processing after UAT approval.
- `SchoolPay__WebhookSecret` to the exact SchoolPay-issued API password used for webhook signature verification.
- `SchoolPay__SchoolCode` and `SchoolPay__ApiPassword` for authenticated Sync API reconciliation.
- `SchoolPay__ReconciliationEnabled=true` to enable the background reconciliation worker.
- Optional: `SchoolPay__BaseUrl=https://schoolpay.co.ug/paymentapi`, `SchoolPay__ReconciliationIntervalMinutes=360`, and `SchoolPay__ReconciliationLookbackDays=2` (maximum lookback: 30 days).

When SchoolPay is disabled or the secret is missing/invalid, the webhook cannot post payments.

## Webhook endpoint

Register the public HTTPS endpoint:

`POST /api/schoolpay/webhook`

The endpoint accepts SchoolPay's signed nested `payment` payloads for `SCHOOL_FEES` and `OTHER_FEES`.

SMIS verifies the documented signature:

`SHA256(apiPassword + payment.schoolpayReceiptNumber)`

The signature comparison is constant-time. Only `transactionCompletionStatus = Completed` is accepted for posting. Other statuses are acknowledged as ignored.

## Student matching

The webhook's `studentPaymentCode` and `studentRegistrationNumber` are matched against `Students.StudentNumber`. The notification is rejected unless the values identify exactly one active SMIS student. SMIS never guesses a student using a name or phone number.

Before enabling SchoolPay, KSHS must confirm with SchoolPay that the supplied payment code or registration number matches the SMIS student number. If SchoolPay uses a different identifier, add a dedicated mapping field/import and populate it before production activation.

## Central finance posting

SMIS records exactly two payment sources:

- `Manual`: staff-entered cash, cheque and other authorised manual receipts.
- `SchoolPay`: provider-confirmed collections, including mobile-money and bank channels offered through SchoolPay.

For SchoolPay, the provider channel is stored separately in `Payments.SourceChannel` and `SchoolPaymentNotifications.Channel`. The provider transaction ID, receipt, provider status and raw payload are retained for reconciliation.

SchoolPay receipts post to the SchoolPay Clearing asset account (1040), not directly to Cash, Mobile Money or Bank. The clearing balance represents funds collected through SchoolPay pending settlement reconciliation.

When the webhook identifies a student but does not specify an invoice, SMIS records the unallocated payment and applies it FIFO to outstanding invoices in the same database save as the notification, payment, allocations and journals. Any remaining amount stays unapplied.

Direct MTN/Airtel initiation and staff-entered provider-reference confirmation are disabled. Those channels must reach SMIS through SchoolPay.

## Reconciliation

SchoolPay documentation states that webhook delivery is single-attempt. SMIS therefore includes a background reconciliation worker that calls the authenticated `SchoolRangeTransactions` endpoint using the official MD5 formula `MD5(schoolCode + fromDate + apiPassword)` (uppercase hexadecimal). It checks a rolling date window, with a maximum 30-day lookback, and sends both regular and supplementary fee transactions through the same idempotent finance workflow as webhooks.

Enable reconciliation only after KSHS supplies the SchoolPay school code and transactions API password and completes UAT. The worker posts only completed transactions that match exactly one active student. Unmatched or ambiguous identifiers are skipped and written to structured API logs for Finance investigation; they are not silently assigned to a student.

The webhook and Sync API share receipt/provider-transaction uniqueness constraints, so a transaction already posted by one path is not posted again by the other. Do not bypass student matching or manually post an unverified provider transaction.
