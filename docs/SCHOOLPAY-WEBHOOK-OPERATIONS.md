# SchoolPay webhook operations

## Configuration

Configure these values on the API server only. Never commit provider credentials:

- `SchoolPay__Enabled=true` to activate SchoolPay processing after UAT approval.
- `SchoolPay__WebhookSecret` to the exact SchoolPay-issued API password used for webhook signature verification.

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

## Reconciliation requirement

SchoolPay documentation states that webhook delivery is single-attempt. Before production sign-off, implement and enable a scheduled reconciliation using SchoolPay's authenticated Sync/Range Transactions API. It must compare provider transaction IDs and receipts with SMIS and surface unmatched, missing or amount-mismatched transactions for Finance review.

The webhook rejects unmatched or ambiguous student codes. Do not bypass that control or manually post an unverified SchoolPay callback.
